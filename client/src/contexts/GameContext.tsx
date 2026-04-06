import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Bet, SpinResult, calculateWin, generateRandomNumber, getNumberColor, TableType, Strategy, STRATEGIES } from "@/lib/roulette-data";
import { nanoid } from "nanoid";

export interface SessionSettings {
  mode: "visual" | "rapid" | "timed";
  entryMode: "random" | "manual";
  spinMode: "relaxed" | "casino";
  casinoTimer: number;             // seconds for casino mode countdown
  timeLimit: number | null;       // minutes
  lossLimit: number | null;
  winGoal: number | null;
  goBust: boolean;
  rapidSpinCount: number;
}

interface GameState {
  bankroll: number;
  startingBankroll: number;
  bets: Bet[];
  history: SpinResult[];
  isSpinning: boolean;
  lastResult: SpinResult | null;
  sessionActive: boolean;
  sessionPaused: boolean;
  sessionSettings: SessionSettings;
  sessionStartTime: number | null;
  pausedTimeAccum: number;         // ms accumulated while paused
  totalSpins: number;
  sessionProfit: number;
  tableType: TableType;
  soundEnabled: boolean;
  activeStrategy: Strategy | null;
  sessionEnded: boolean;
  sessionEndReason: string | null;
}

interface GameContextType extends GameState {
  setBankroll: (amount: number) => void;
  addBet: (bet: Omit<Bet, "id">) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;
  undoLastBet: () => void;
  updateBetAmount: (id: string, amount: number) => void;
  spin: (manualNumber?: number | string) => SpinResult;
  rapidSpin: (count: number) => SpinResult[];
  startSession: (settings: Partial<SessionSettings>) => void;
  endSession: (reason?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  resetSession: () => void;
  resetHistory: () => void;
  getTotalBetAmount: () => number;
  setTableType: (t: TableType) => void;
  toggleSound: () => void;
  loadStrategy: (strategy: Strategy) => void;
  clearStrategy: () => void;
  getElapsedMinutes: () => number;
  getRemainingSeconds: () => number | null;
}

const defaultSettings: SessionSettings = {
  mode: "visual",
  entryMode: "random",
  spinMode: "relaxed",
  casinoTimer: 30,
  timeLimit: null,
  lossLimit: null,
  winGoal: null,
  goBust: false,
  rapidSpinCount: 100,
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [bankroll, setBankrollState] = useState(1000);
  const [startingBankroll, setStartingBankroll] = useState(1000);
  const [bets, setBets] = useState<Bet[]>([]);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>(defaultSettings);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTimeAccum, setPausedTimeAccum] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [tableType, setTableTypeState] = useState<TableType>("american");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null);

  const pauseStartRef = useRef<number | null>(null);

  const setBankroll = useCallback((amount: number) => {
    setBankrollState(amount);
    setStartingBankroll(amount);
  }, []);

  const addBet = useCallback((bet: Omit<Bet, "id">) => {
    const newBet: Bet = { ...bet, id: nanoid() };
    setBets(prev => {
      const existing = prev.find(b =>
        b.type === bet.type &&
        JSON.stringify([...b.numbers].sort()) === JSON.stringify([...bet.numbers].sort())
      );
      if (existing) {
        return prev.map(b =>
          b.id === existing.id ? { ...b, amount: b.amount + bet.amount } : b
        );
      }
      return [...prev, newBet];
    });
  }, []);

  const removeBet = useCallback((id: string) => {
    setBets(prev => prev.filter(b => b.id !== id));
  }, []);

  const clearBets = useCallback(() => setBets([]), []);

  const undoLastBet = useCallback(() => {
    setBets(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
  }, []);

  const updateBetAmount = useCallback((id: string, amount: number) => {
    if (amount <= 0) {
      setBets(prev => prev.filter(b => b.id !== id));
    } else {
      setBets(prev => prev.map(b => b.id === id ? { ...b, amount } : b));
    }
  }, []);

  const getTotalBetAmount = useCallback(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);

  const getElapsedMinutes = useCallback(() => {
    if (!sessionStartTime) return 0;
    const now = Date.now();
    const paused = sessionPaused && pauseStartRef.current ? (now - pauseStartRef.current) : 0;
    const elapsed = now - sessionStartTime - pausedTimeAccum - paused;
    return elapsed / 60000;
  }, [sessionStartTime, pausedTimeAccum, sessionPaused]);

  const getRemainingSeconds = useCallback(() => {
    if (!sessionSettings.timeLimit || !sessionStartTime) return null;
    const totalMs = sessionSettings.timeLimit * 60000;
    const now = Date.now();
    const paused = sessionPaused && pauseStartRef.current ? (now - pauseStartRef.current) : 0;
    const elapsed = now - sessionStartTime - pausedTimeAccum - paused;
    const remaining = Math.max(0, totalMs - elapsed);
    return Math.ceil(remaining / 1000);
  }, [sessionSettings.timeLimit, sessionStartTime, pausedTimeAccum, sessionPaused]);

  const checkExitConditions = useCallback((currentBankroll: number, currentProfit: number) => {
    if (sessionSettings.goBust && currentBankroll <= 0) return "Bankroll depleted — went bust!";
    if (sessionSettings.lossLimit && (startingBankroll - currentBankroll) >= sessionSettings.lossLimit)
      return `Loss limit reached (-$${sessionSettings.lossLimit})`;
    if (sessionSettings.winGoal && currentProfit >= sessionSettings.winGoal)
      return `Win goal reached (+$${sessionSettings.winGoal})!`;
    return null;
  }, [sessionSettings, startingBankroll]);

  const spin = useCallback((manualNumber?: number | string): SpinResult => {
    const number = manualNumber !== undefined ? manualNumber : generateRandomNumber(tableType);
    const color = getNumberColor(number);
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    let totalWin = 0;
    for (const bet of bets) totalWin += calculateWin(bet, number);
    const netResult = totalWin - totalBet;

    const result: SpinResult = { number, color, timestamp: Date.now(), bets: [...bets], totalBet, totalWin, netResult };

    const newBankroll = bankroll + netResult;
    const newProfit = sessionProfit + netResult;
    setBankrollState(newBankroll);
    setHistory(prev => [result, ...prev]);
    setLastResult(result);
    setTotalSpins(prev => prev + 1);
    setSessionProfit(newProfit);

    // Check exit conditions
    if (sessionActive) {
      const reason = checkExitConditions(newBankroll, newProfit);
      if (reason) {
        setSessionEnded(true);
        setSessionEndReason(reason);
        setSessionActive(false);
      }
    }

    return result;
  }, [bets, bankroll, tableType, sessionProfit, sessionActive, checkExitConditions]);

  const rapidSpin = useCallback((count: number): SpinResult[] => {
    const results: SpinResult[] = [];
    let currentBankroll = bankroll;
    let currentProfit = sessionProfit;

    for (let i = 0; i < count; i++) {
      const number = generateRandomNumber(tableType);
      const color = getNumberColor(number);
      const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
      if (currentBankroll < totalBet) break;

      let totalWin = 0;
      for (const bet of bets) totalWin += calculateWin(bet, number);
      const netResult = totalWin - totalBet;
      currentBankroll += netResult;
      currentProfit += netResult;

      results.push({ number, color, timestamp: Date.now() + i, bets: [...bets], totalBet, totalWin, netResult });

      const reason = checkExitConditions(currentBankroll, currentProfit);
      if (reason) {
        setSessionEnded(true);
        setSessionEndReason(reason);
        break;
      }
    }

    setBankrollState(currentBankroll);
    setHistory(prev => [...results.reverse(), ...prev]);
    setLastResult(results[results.length - 1] || null);
    setTotalSpins(prev => prev + results.length);
    setSessionProfit(currentProfit);
    return results;
  }, [bankroll, bets, tableType, sessionProfit, checkExitConditions]);

  const startSession = useCallback((settings: Partial<SessionSettings>) => {
    setSessionSettings(prev => ({ ...prev, ...settings }));
    setSessionActive(true);
    setSessionPaused(false);
    setSessionStartTime(Date.now());
    setPausedTimeAccum(0);
    setTotalSpins(0);
    setSessionProfit(0);
    setStartingBankroll(bankroll);
    setSessionEnded(false);
    setSessionEndReason(null);
    pauseStartRef.current = null;
  }, [bankroll]);

  const endSession = useCallback((reason?: string) => {
    setSessionActive(false);
    setSessionPaused(false);
    if (reason) {
      setSessionEnded(true);
      setSessionEndReason(reason);
    }
  }, []);

  const pauseSession = useCallback(() => {
    setSessionPaused(true);
    pauseStartRef.current = Date.now();
  }, []);

  const resumeSession = useCallback(() => {
    if (pauseStartRef.current) {
      setPausedTimeAccum(prev => prev + (Date.now() - pauseStartRef.current!));
    }
    pauseStartRef.current = null;
    setSessionPaused(false);
  }, []);

  const resetSession = useCallback(() => {
    setSessionActive(false);
    setSessionPaused(false);
    setSessionStartTime(null);
    setPausedTimeAccum(0);
    setTotalSpins(0);
    setSessionProfit(0);
    setSessionEnded(false);
    setSessionEndReason(null);
    setBankrollState(startingBankroll);
    pauseStartRef.current = null;
  }, [startingBankroll]);

  const resetHistory = useCallback(() => {
    setHistory([]);
    setLastResult(null);
    setTotalSpins(0);
    setSessionProfit(0);
  }, []);

  const setTableType = useCallback((t: TableType) => setTableTypeState(t), []);
  const toggleSound = useCallback(() => setSoundEnabled(prev => !prev), []);

  const loadStrategy = useCallback((strategy: Strategy) => {
    setActiveStrategy(strategy);
    setBets(strategy.bets.map(b => ({ ...b, id: nanoid() })));
    setBankrollState(strategy.bankrollRequired);
    setStartingBankroll(strategy.bankrollRequired);
  }, []);

  const clearStrategy = useCallback(() => {
    setActiveStrategy(null);
  }, []);

  // Timer check effect
  useEffect(() => {
    if (!sessionActive || sessionPaused || !sessionSettings.timeLimit || !sessionStartTime) return;
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      if (remaining !== null && remaining <= 0) {
        setSessionActive(false);
        setSessionEnded(true);
        setSessionEndReason("Time's up!");
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [sessionActive, sessionPaused, sessionSettings.timeLimit, sessionStartTime, getRemainingSeconds]);

  return (
    <GameContext.Provider
      value={{
        bankroll, startingBankroll, bets, history, isSpinning, lastResult,
        sessionActive, sessionPaused, sessionSettings, sessionStartTime,
        pausedTimeAccum, totalSpins, sessionProfit, tableType, soundEnabled,
        activeStrategy, sessionEnded, sessionEndReason,
        setBankroll, addBet, removeBet, clearBets, undoLastBet, updateBetAmount,
        spin, rapidSpin, startSession, endSession, pauseSession, resumeSession,
        resetSession, resetHistory, getTotalBetAmount, setTableType, toggleSound,
        loadStrategy, clearStrategy, getElapsedMinutes, getRemainingSeconds,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}
