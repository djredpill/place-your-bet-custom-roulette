import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause, Play, Square, RotateCcw, Eye, ArrowLeft,
  TrendingUp, TrendingDown, Hash, Clock, Skull,
  Target, Shuffle, Trophy, AlertTriangle,
} from "lucide-react";
import RouletteWheel from "./RouletteWheel";
import { useGame } from "@/contexts/GameContext";
import { generateRandomNumber, getNumberColor, calculateWin, type Strategy, type SpinResult } from "@/lib/roulette-data";
import { playBallSpin, playWinSound, playLossSound } from "@/lib/sounds";
import type { WatchModeConfig } from "./WatchModeSetup";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Watch Mode Engine — auto-plays a strategy with animated wheel
 * Transport controls: Pause / Resume / Stop / Restart
 * Shows live stats, spin history, and bankroll graph
 * On completion: results screen with Run Again / Change Strategy / Back to Table
 */

interface WatchModeEngineProps {
  strategy: Strategy;
  config: WatchModeConfig;
  onStop: () => void;
  onRestart: () => void;
  onChangeStrategy: () => void;
  onBackToTable: () => void;
}

type WatchState = "running" | "paused" | "finished";

interface WatchStats {
  spinsCompleted: number;
  wins: number;
  losses: number;
  pushes: number;
  peakBankroll: number;
  lowestBankroll: number;
  biggestWin: number;
  biggestLoss: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentWinStreak: number;
  currentLossStreak: number;
  bankrollHistory: number[];
}

export default function WatchModeEngine({
  strategy,
  config,
  onStop,
  onRestart,
  onChangeStrategy,
  onBackToTable,
}: WatchModeEngineProps) {
  const {
    bankroll, bets, spin, tableType, soundEnabled,
    startingBankroll, sessionProfit, loadStrategy,
  } = useGame();

  const [watchState, setWatchState] = useState<WatchState>("running");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | string | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<SpinResult[]>([]);

  const [stats, setStats] = useState<WatchStats>({
    spinsCompleted: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    peakBankroll: bankroll,
    lowestBankroll: bankroll,
    biggestWin: 0,
    biggestLoss: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    bankrollHistory: [bankroll],
  });

  const startTimeRef = useRef(Date.now());
  const spinQueueRef = useRef(true);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const bankrollRef = useRef(bankroll);
  bankrollRef.current = bankroll;

  const profitRef = useRef(sessionProfit);
  profitRef.current = sessionProfit;

  const spinDuration = config.instant ? 0.05 : config.spinDuration;

  // Check if an exit condition has been met
  const checkExit = useCallback((newBankroll: number, newProfit: number, spinsDone: number): string | null => {
    switch (config.exitMode) {
      case "spins":
        if (spinsDone >= config.spinCount) return `Completed ${config.spinCount} spins`;
        break;
      case "time": {
        const elapsed = (Date.now() - startTimeRef.current) / 60000;
        if (elapsed >= config.timeMinutes) return `Time limit reached (${config.timeMinutes}m)`;
        break;
      }
      case "bust":
        if (newBankroll <= 0) return "Went bust! Bankroll depleted";
        break;
      case "winGoal":
        if (newProfit >= config.winGoal) return `Win goal reached (+$${config.winGoal})!`;
        break;
      case "lossLimit":
        if (newProfit <= -config.lossLimit) return `Loss limit reached (-$${config.lossLimit})`;
        break;
    }
    // Always check bust regardless of mode
    if (newBankroll <= 0) return "Went bust! Bankroll depleted";
    // Check if can't afford bets
    const totalBet = bets.reduce((s, b) => s + b.amount, 0);
    if (newBankroll < totalBet) return "Can't afford next bet — bankroll too low";
    return null;
  }, [config, bets]);

  // Execute a single spin
  const doSpin = useCallback(() => {
    if (!spinQueueRef.current) return;

    const totalBet = bets.reduce((s, b) => s + b.amount, 0);
    if (bankrollRef.current < totalBet) {
      setEndReason("Can't afford next bet — bankroll too low");
      setWatchState("finished");
      return;
    }

    setIsSpinning(true);
    const number = generateRandomNumber(tableType);
    setWheelResult(number);

    if (soundEnabled && !config.instant) {
      playBallSpin(spinDuration * 1000);
    }

    const timeout = config.instant ? 60 : (spinDuration * 1000 + 200);

    setTimeout(() => {
      const result = spin(number);
      setIsSpinning(false);

      // Play sounds
      if (soundEnabled && !config.instant) {
        if (result.netResult > 0) playWinSound();
        else if (result.netResult < 0) playLossSound();
      }

      // Update stats
      setStats(prev => {
        const newSpins = prev.spinsCompleted + 1;
        const newBankroll = bankrollRef.current;
        let newWinStreak = prev.currentWinStreak;
        let newLossStreak = prev.currentLossStreak;

        if (result.netResult > 0) {
          newWinStreak += 1;
          newLossStreak = 0;
        } else if (result.netResult < 0) {
          newLossStreak += 1;
          newWinStreak = 0;
        } else {
          newWinStreak = 0;
          newLossStreak = 0;
        }

        return {
          spinsCompleted: newSpins,
          wins: prev.wins + (result.netResult > 0 ? 1 : 0),
          losses: prev.losses + (result.netResult < 0 ? 1 : 0),
          pushes: prev.pushes + (result.netResult === 0 ? 1 : 0),
          peakBankroll: Math.max(prev.peakBankroll, newBankroll),
          lowestBankroll: Math.min(prev.lowestBankroll, newBankroll),
          biggestWin: Math.max(prev.biggestWin, result.netResult),
          biggestLoss: Math.min(prev.biggestLoss, result.netResult),
          longestWinStreak: Math.max(prev.longestWinStreak, newWinStreak),
          longestLossStreak: Math.max(prev.longestLossStreak, newLossStreak),
          currentWinStreak: newWinStreak,
          currentLossStreak: newLossStreak,
          bankrollHistory: [...prev.bankrollHistory, newBankroll],
        };
      });

      // Add to recent results (keep last 20)
      setRecentResults(prev => [result, ...prev].slice(0, 20));

      // Check exit
      const newProfit = profitRef.current;
      const newBankroll = bankrollRef.current;
      const exitReason = checkExit(newBankroll, newProfit, statsRef.current.spinsCompleted + 1);
      if (exitReason) {
        setEndReason(exitReason);
        setWatchState("finished");
        spinQueueRef.current = false;
      }
    }, timeout);
  }, [bets, tableType, soundEnabled, config, spinDuration, spin, checkExit]);

  // Auto-spin loop
  useEffect(() => {
    if (watchState !== "running" || isSpinning) return;

    spinQueueRef.current = true;
    const delay = config.instant ? 80 : 500; // brief pause between spins
    const timer = setTimeout(doSpin, delay);
    return () => clearTimeout(timer);
  }, [watchState, isSpinning, doSpin, config.instant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { spinQueueRef.current = false; };
  }, []);

  const handlePause = () => {
    spinQueueRef.current = false;
    setWatchState("paused");
  };

  const handleResume = () => {
    setWatchState("running");
  };

  const handleStop = () => {
    spinQueueRef.current = false;
    setEndReason("Stopped manually");
    setWatchState("finished");
  };

  const handleRestart = () => {
    spinQueueRef.current = false;
    loadStrategy(strategy);
    setStats({
      spinsCompleted: 0, wins: 0, losses: 0, pushes: 0,
      peakBankroll: strategy.bankrollRequired,
      lowestBankroll: strategy.bankrollRequired,
      biggestWin: 0, biggestLoss: 0,
      longestWinStreak: 0, longestLossStreak: 0,
      currentWinStreak: 0, currentLossStreak: 0,
      bankrollHistory: [strategy.bankrollRequired],
    });
    setRecentResults([]);
    setEndReason(null);
    setWheelResult(null);
    setIsSpinning(false);
    startTimeRef.current = Date.now();
    setTimeout(() => setWatchState("running"), 100);
  };

  const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
  const elapsedStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`;
  const winRate = stats.spinsCompleted > 0 ? ((stats.wins / stats.spinsCompleted) * 100).toFixed(1) : "0.0";

  // Results screen
  if (watchState === "finished") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#0d0d1a] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#1a1a2e] border-b border-[#D4AF37]/20 px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <Eye size={18} className="text-[#D4AF37]" />
            <h1 className="font-display text-lg tracking-[0.2em] text-[#D4AF37]">WATCH MODE RESULTS</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 py-4">
          <div className="max-w-[400px] mx-auto space-y-4">
            {/* End reason */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase tracking-wider">Ended</p>
              <p className="text-white font-body font-semibold text-sm mt-0.5">{endReason}</p>
            </div>

            {/* Strategy + headline stats */}
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37]/30 rounded-lg p-4">
              <p className="text-[#D4AF37] font-display text-sm tracking-wider text-center mb-3">{strategy.name}</p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[#C0C0C0]/60 font-body text-[10px]">Spins</p>
                  <p className="text-white font-numbers font-bold text-xl">{stats.spinsCompleted}</p>
                </div>
                <div>
                  <p className="text-[#C0C0C0]/60 font-body text-[10px]">Final Bankroll</p>
                  <p className="text-white font-numbers font-bold text-xl">${bankroll}</p>
                </div>
                <div>
                  <p className="text-[#C0C0C0]/60 font-body text-[10px]">Profit/Loss</p>
                  <p className={`font-numbers font-bold text-xl ${sessionProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {sessionProfit >= 0 ? `+$${sessionProfit}` : `-$${Math.abs(sessionProfit)}`}
              </p>
            </div>
          </div>
        </div>

            {/* Detailed stats */}
            <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-2">
              <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">Performance</h4>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Win Rate</span>
                  <span className="text-white font-numbers font-bold">{winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Duration</span>
                  <span className="text-white font-numbers font-bold">{elapsedStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Wins</span>
                  <span className="text-green-400 font-numbers font-bold">{stats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Losses</span>
                  <span className="text-red-400 font-numbers font-bold">{stats.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Peak</span>
                  <span className="text-green-400 font-numbers font-bold">${stats.peakBankroll}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Lowest</span>
                  <span className="text-red-400 font-numbers font-bold">${stats.lowestBankroll}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Best Win</span>
                  <span className="text-green-400 font-numbers font-bold">+${stats.biggestWin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Worst Loss</span>
                  <span className="text-red-400 font-numbers font-bold">${stats.biggestLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Win Streak</span>
                  <span className="text-white font-numbers font-bold">{stats.longestWinStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C0C0C0]/60 font-body">Loss Streak</span>
                  <span className="text-white font-numbers font-bold">{stats.longestLossStreak}</span>
                </div>
              </div>
            </div>

            {/* Mini bankroll chart */}
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider mb-2">Bankroll Over Time</h4>
              <BankrollChart data={stats.bankrollHistory} startingBankroll={startingBankroll} />
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleRestart}
                className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-lg tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                RUN AGAIN
              </button>
              <button
                onClick={onChangeStrategy}
                className="w-full bg-[#35654D] hover:bg-[#35654D]/80 text-white font-display text-lg tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Shuffle size={18} />
                CHANGE STRATEGY
              </button>
              <button
                onClick={onBackToTable}
                className="w-full bg-[#2a2a3e] hover:bg-[#3a3a4e] text-[#C0C0C0] font-body font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                <ArrowLeft size={16} />
                Back to Table
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Running / Paused view
  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a1a2e] border-b border-[#D4AF37]/20 px-3 py-2">
        <div className="flex items-center justify-between max-w-[720px] mx-auto">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[#D4AF37]" />
            <span className="font-display text-sm tracking-wider text-[#D4AF37]">WATCHING</span>
          </div>
          <span className="text-[#FFFDD0] font-body text-xs truncate max-w-[140px]">{strategy.name}</span>
          <span className="text-[#C0C0C0] font-numbers text-xs">{elapsedStr}</span>
        </div>
      </div>

      {/* Transport controls bar */}
      <div className="bg-[#1a1a2e]/80 border-b border-white/5 px-3 py-2">
        <div className="flex items-center justify-center gap-3 max-w-[720px] mx-auto">
          {/* Restart */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#C0C0C0] transition-colors"
            title="Restart"
          >
            <RotateCcw size={18} />
          </button>

          {/* Pause / Resume */}
          <button
            onClick={watchState === "paused" ? handleResume : handlePause}
            className={`p-3 rounded-full transition-colors ${
              watchState === "paused"
                ? "bg-[#D4AF37] text-[#1a1a2e] hover:bg-[#D4AF37]/90"
                : "bg-white/10 hover:bg-white/15 text-white"
            }`}
            title={watchState === "paused" ? "Resume" : "Pause"}
          >
            {watchState === "paused" ? <Play size={22} /> : <Pause size={22} />}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
            title="Stop"
          >
            <Square size={18} />
          </button>
        </div>
      </div>

      {/* Paused overlay text */}
      {watchState === "paused" && (
        <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/30 px-3 py-1.5 text-center">
          <span className="text-[#D4AF37] font-display text-sm tracking-wider animate-pulse">PAUSED</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto px-2 py-3">
        <div className="max-w-[720px] mx-auto space-y-4">
          {/* Live stats row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-center">
              <p className="text-[#C0C0C0]/40 font-body text-[9px] uppercase">Bankroll</p>
              <p className="text-white font-numbers font-bold text-lg">${bankroll}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-center">
              <p className="text-[#C0C0C0]/40 font-body text-[9px] uppercase">Profit</p>
              <p className={`font-numbers font-bold text-lg ${sessionProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {sessionProfit >= 0 ? `+$${sessionProfit}` : `-$${Math.abs(sessionProfit)}`}
              </p>
            </div>
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-center">
              <p className="text-[#C0C0C0]/40 font-body text-[9px] uppercase">Spins</p>
              <p className="text-white font-numbers font-bold text-lg">{stats.spinsCompleted}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-center">
              <p className="text-[#C0C0C0]/40 font-body text-[9px] uppercase">Win Rate</p>
              <p className="text-white font-numbers font-bold text-lg">{winRate}%</p>
            </div>
          </div>

          {/* Wheel */}
          {!config.instant && (
            <div className="flex justify-center">
              <RouletteWheel
                isSpinning={isSpinning}
                resultNumber={wheelResult}
                size={200}
                tableType={tableType}
                spinDuration={spinDuration}
              />
            </div>
          )}

          {/* Instant mode: rapid results display */}
          {config.instant && (
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-3 text-center">
              <p className="text-[#D4AF37] font-display text-sm tracking-wider mb-2">INSTANT MODE</p>
              {wheelResult !== null && (
                <div className={`inline-flex w-14 h-14 rounded-full items-center justify-center font-display text-2xl text-white font-bold border-2 border-[#D4AF37] ${
                  getNumberColor(wheelResult) === "red" ? "bg-[#C41E23]" :
                  getNumberColor(wheelResult) === "black" ? "bg-[#1B1B1B]" : "bg-[#006400]"
                }`}>
                  {wheelResult}
                </div>
              )}
            </div>
          )}

          {/* Mini bankroll chart */}
          {stats.bankrollHistory.length > 2 && (
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-3">
              <BankrollChart data={stats.bankrollHistory} startingBankroll={startingBankroll} />
            </div>
          )}

          {/* Recent results trail */}
          {recentResults.length > 0 && (
            <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-3">
              <p className="text-[#C0C0C0]/40 font-body text-[9px] uppercase tracking-wider mb-2">Recent Spins</p>
              <div className="flex flex-wrap gap-1.5">
                {recentResults.slice(0, 15).map((r, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-numbers text-xs font-bold border ${
                      r.color === "red" ? "bg-[#C41E23] border-[#C41E23]" :
                      r.color === "black" ? "bg-[#1B1B1B] border-[#333]" : "bg-[#006400] border-[#006400]"
                    } ${r.netResult > 0 ? "ring-1 ring-green-400" : ""}`}
                  >
                    {r.number}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit condition indicator */}
          <div className="bg-black/20 border border-white/5 rounded-lg p-2 flex items-center gap-2">
            <ExitIcon mode={config.exitMode} />
            <span className="text-[#C0C0C0]/60 font-body text-xs">
              {getExitLabel(config)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Simple SVG bankroll chart */
function BankrollChart({ data, startingBankroll }: { data: number[]; startingBankroll: number }) {
  if (data.length < 2) return null;

  const width = 320;
  const height = 80;
  const padding = 4;

  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lastValue = data[data.length - 1];
  const isUp = lastValue >= startingBankroll;

  // Starting bankroll line Y
  const startY = height - padding - ((startingBankroll - min) / range) * (height - padding * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
      {/* Starting bankroll reference line */}
      <line
        x1={padding} y1={startY} x2={width - padding} y2={startY}
        stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3"
      />
      {/* Chart line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={isUp ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`}
        fill={isUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}
      />
    </svg>
  );
}

function ExitIcon({ mode }: { mode: string }) {
  const cls = "text-[#C0C0C0]/40";
  switch (mode) {
    case "spins": return <Hash size={14} className={cls} />;
    case "time": return <Clock size={14} className={cls} />;
    case "bust": return <Skull size={14} className={cls} />;
    case "winGoal": return <Target size={14} className="text-green-400/40" />;
    case "lossLimit": return <TrendingDown size={14} className="text-red-400/40" />;
    default: return <Eye size={14} className={cls} />;
  }
}

function getExitLabel(config: WatchModeConfig): string {
  switch (config.exitMode) {
    case "manual": return "Running until you stop";
    case "spins": return `Running for ${config.spinCount} spins`;
    case "time": return `Running for ${config.timeMinutes} minutes`;
    case "bust": return "Running until bust";
    case "winGoal": return `Running until +$${config.winGoal} profit`;
    case "lossLimit": return `Running until -$${config.lossLimit} loss`;
    default: return "Running...";
  }
}
