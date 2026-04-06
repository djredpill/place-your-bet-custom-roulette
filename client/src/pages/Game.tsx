import { useState, useCallback, useEffect, useRef } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import RouletteBoard from "@/components/RouletteBoard";
import RouletteWheel from "@/components/RouletteWheel";
import SpinHistory from "@/components/SpinHistory";
import NumberStrip from "@/components/NumberStrip";
import PayoutChart from "@/components/PayoutChart";
import StrategyLibrary from "@/components/StrategyLibrary";
import SessionSetup from "@/components/SessionSetup";
import SessionTimer from "@/components/SessionTimer";
import SessionEndOverlay from "@/components/SessionEndOverlay";
import PauseOverlay from "@/components/PauseOverlay";
import WatchModeSetup, { type WatchModeConfig } from "@/components/WatchModeSetup";
import WatchModeEngine from "@/components/WatchModeEngine";
import { generateRandomNumber, type Strategy } from "@/lib/roulette-data";
import { initSounds, playBallSpin, playTick, playNoMoreBets, playWinSound, playLossSound, playChipPlace, triggerHaptic } from "@/lib/sounds";
import StreakMonitor from "@/components/StreakMonitor";
import { motion } from "framer-motion";
import {
  Info, RotateCcw, Trash2, DollarSign, Home,
  Volume2, VolumeX, BookOpen, Settings2, Undo2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Full game screen with wheel, board, controls, and history
 * Session timer, strategy library, sound toggle, pause/reset
 * Watch Mode: auto-play strategies with animated wheel + transport controls
 */

function GameContent() {
  const {
    bankroll, bets, spin, clearBets, undoLastBet, getTotalBetAmount,
    history, resetHistory, setBankroll, lastResult,
    soundEnabled, toggleSound, tableType, sessionActive,
    sessionPaused, activeStrategy, clearStrategy, sessionSettings,
    loadStrategy,
  } = useGame();

  const [, navigate] = useLocation();
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | string | null>(null);
  const [showPayouts, setShowPayouts] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  const [showBankrollEdit, setShowBankrollEdit] = useState(false);
  const [bankrollInput, setBankrollInput] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [casinoCountdown, setCasinoCountdown] = useState<number | null>(null);
  const casinoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundInitRef = useRef(false);

  // Watch Mode state
  const [watchModeStrategy, setWatchModeStrategy] = useState<Strategy | null>(null);
  const [showWatchSetup, setShowWatchSetup] = useState(false);
  const [watchModeActive, setWatchModeActive] = useState(false);
  const [watchConfig, setWatchConfig] = useState<WatchModeConfig | null>(null);

  const totalBet = getTotalBetAmount();

  // Initialize sounds on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!soundInitRef.current) {
        initSounds();
        soundInitRef.current = true;
      }
    };
    document.addEventListener("click", handleInteraction, { once: true });
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  // Casino mode auto-spin countdown
  useEffect(() => {
    if (!sessionActive || sessionPaused || isSpinning) {
      if (casinoTimerRef.current) {
        clearInterval(casinoTimerRef.current);
        casinoTimerRef.current = null;
      }
      return;
    }
    if (sessionSettings.spinMode !== "casino") return;

    setCasinoCountdown(sessionSettings.casinoTimer);
    casinoTimerRef.current = setInterval(() => {
      setCasinoCountdown(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 5 && next > 0 && soundEnabled) {
          playTick();
        }
        if (next <= 0) {
          if (soundEnabled) playNoMoreBets();
          setTimeout(() => {
            if (bets.length > 0 && totalBet <= bankroll) {
              handleSpin();
            }
          }, 1200);
          if (casinoTimerRef.current) clearInterval(casinoTimerRef.current);
          return null;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (casinoTimerRef.current) {
        clearInterval(casinoTimerRef.current);
        casinoTimerRef.current = null;
      }
    };
  }, [sessionActive, sessionPaused, isSpinning, sessionSettings.spinMode, sessionSettings.casinoTimer]);

  const handleSpin = useCallback(() => {
    if (isSpinning || sessionPaused) return;
    if (bets.length === 0) {
      toast.error("Place at least one bet first!");
      return;
    }
    if (totalBet > bankroll) {
      toast.error("Not enough bankroll!");
      return;
    }

    setIsSpinning(true);
    const number = generateRandomNumber(tableType);
    setWheelResult(number);

    if (soundEnabled) playBallSpin(4000);

    setTimeout(() => {
      const result = spin(number);
      setIsSpinning(false);
      triggerHaptic(result.netResult > 0 ? "win" : result.netResult < 0 ? "loss" : "spin");
      if (soundEnabled) {
        if (result.netResult > 0) playWinSound();
        else if (result.netResult < 0) playLossSound();
      }
    }, 4200);
  }, [isSpinning, sessionPaused, bets, totalBet, bankroll, spin, tableType, soundEnabled]);

  const handleManualSpin = useCallback(() => {
    if (isSpinning || sessionPaused) return;
    if (bets.length === 0) {
      toast.error("Place at least one bet first!");
      return;
    }

    const num = manualNumber === "00" ? "00" : parseInt(manualNumber);
    const maxNum = tableType === "european" ? 36 : 36;
    if (num !== "00" && (isNaN(num as number) || (num as number) < 0 || (num as number) > maxNum)) {
      toast.error(`Enter a valid number (0-${maxNum}${tableType === "american" ? " or 00" : ""})`);
      return;
    }
    if (tableType === "european" && num === "00") {
      toast.error("European table has no 00");
      return;
    }

    setIsSpinning(true);
    setWheelResult(num);
    setShowManualEntry(false);
    setManualNumber("");

    if (soundEnabled) playBallSpin(4000);

    setTimeout(() => {
      const result = spin(num);
      setIsSpinning(false);
      triggerHaptic(result.netResult > 0 ? "win" : result.netResult < 0 ? "loss" : "spin");
      if (soundEnabled) {
        if (result.netResult > 0) playWinSound();
        else if (result.netResult < 0) playLossSound();
      }
    }, 4200);
  }, [isSpinning, sessionPaused, bets, manualNumber, spin, tableType, soundEnabled]);

  const handleSetBankroll = () => {
    const amount = parseInt(bankrollInput);
    if (amount > 0) {
      setBankroll(amount);
      setShowBankrollEdit(false);
      setBankrollInput("");
      toast.success(`Bankroll set to $${amount}`);
    }
  };

  const handleResetHistory = () => {
    resetHistory();
    setShowResetConfirm(false);
    toast.success("History cleared");
  };

  // Watch Mode handlers
  const handleWatchModeRequest = (strategy: Strategy) => {
    setWatchModeStrategy(strategy);
    loadStrategy(strategy);
    setShowWatchSetup(true);
  };

  const handleWatchStart = (config: WatchModeConfig) => {
    setWatchConfig(config);
    setShowWatchSetup(false);
    setWatchModeActive(true);
  };

  const handleWatchStop = () => {
    setWatchModeActive(false);
    setWatchConfig(null);
  };

  const handleWatchRestart = () => {
    if (watchModeStrategy) {
      loadStrategy(watchModeStrategy);
    }
  };

  const handleWatchChangeStrategy = () => {
    setWatchModeActive(false);
    setWatchConfig(null);
    setWatchModeStrategy(null);
    setShowStrategies(true);
  };

  const handleWatchBackToTable = () => {
    setWatchModeActive(false);
    setWatchConfig(null);
    setWatchModeStrategy(null);
  };

  // If Watch Mode is active, render the engine instead of normal game
  if (watchModeActive && watchConfig && watchModeStrategy) {
    return (
      <WatchModeEngine
        strategy={watchModeStrategy}
        config={watchConfig}
        onStop={handleWatchStop}
        onRestart={handleWatchRestart}
        onChangeStrategy={handleWatchChangeStrategy}
        onBackToTable={handleWatchBackToTable}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a1a2e] border-b border-[#D4AF37]/20 px-3 py-2">
        <div className="flex items-center justify-between max-w-[720px] mx-auto">
          <button
            onClick={() => navigate("/")}
            className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
          >
            <Home size={20} />
          </button>

          <h1 className="font-display text-lg tracking-[0.2em] text-[#D4AF37]">
            PLACE YOUR BET
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setShowPayouts(true)}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              title="Info & Payouts"
            >
              <Info size={18} />
            </button>
            <button
              onClick={() => setShowStrategies(true)}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              title="Strategy Library"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowSessionSetup(true)}
              className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              title="Session Setup"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Session Timer */}
      <SessionTimer />

      {/* Active strategy indicator */}
      {activeStrategy && (
        <div className="bg-[#35654D]/20 border-b border-[#35654D]/30 px-3 py-1">
          <div className="flex items-center justify-between max-w-[720px] mx-auto">
            <span className="text-[#D4AF37] font-body text-xs">
              Strategy: <span className="font-semibold text-white">{activeStrategy.name}</span>
              <span className="text-[#C0C0C0]/60 ml-1">({activeStrategy.rating})</span>
            </span>
            <button
              onClick={clearStrategy}
              className="text-[#C0C0C0]/40 hover:text-red-400 text-xs font-body transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bankroll display */}
      <div className="bg-[#1a1a2e]/50 px-3 py-2 border-b border-white/5">
        <div className="flex items-center justify-between max-w-[720px] mx-auto">
          <button
            onClick={() => {
              setShowBankrollEdit(true);
              setBankrollInput(String(bankroll));
            }}
            className="flex items-center gap-1.5 group"
          >
            <DollarSign size={16} className="text-[#D4AF37]" />
            <span className="font-numbers font-bold text-xl text-white group-hover:text-[#D4AF37] transition-colors">
              {bankroll.toLocaleString()}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[#C0C0C0] font-body text-xs">
              Bet: <span className="text-white font-numbers font-bold">${totalBet}</span>
            </span>
            <span className="text-[#C0C0C0]/30">|</span>
            <span className="text-[#C0C0C0] font-body text-[10px] uppercase">
              {tableType === "american" ? "US" : "EU"}
            </span>
            {bets.length > 0 && (
              <>
                <button
                  onClick={undoLastBet}
                  className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
                  title="Undo last bet"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  onClick={clearBets}
                  className="text-red-400/60 hover:text-red-400 transition-colors"
                  title="Clear all bets"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-2 py-3">
        <div className="max-w-[720px] mx-auto space-y-4">

          {/* Wheel */}
          <div className="flex justify-center">
            <RouletteWheel
              isSpinning={isSpinning}
              resultNumber={wheelResult}
              size={220}
              tableType={tableType}
            />
          </div>

          {/* Spin controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="px-4 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-[#C0C0C0] font-body text-sm rounded border border-white/10 transition-colors"
            >
              Manual
            </button>
            <button
              onClick={handleSpin}
              disabled={isSpinning || bets.length === 0 || sessionPaused}
              className={`
                px-8 py-3 rounded-lg font-display text-xl tracking-wider
                transition-all shadow-lg relative
                ${isSpinning || bets.length === 0 || sessionPaused
                  ? "bg-[#2a2a3e] text-[#C0C0C0]/40 cursor-not-allowed"
                  : "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] active:scale-95"
                }
              `}
            >
              {isSpinning ? "SPINNING..." : "SPIN"}
              {casinoCountdown !== null && !isSpinning && (
                <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-numbers font-bold text-xs ${
                  casinoCountdown <= 5 ? "bg-red-600 text-white animate-pulse" : casinoCountdown <= 10 ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                }`}>
                  {casinoCountdown}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-[#C0C0C0] font-body text-sm rounded border border-white/10 transition-colors"
              title="Reset History"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Manual entry */}
          {showManualEntry && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <input
                type="text"
                value={manualNumber}
                onChange={e => setManualNumber(e.target.value)}
                placeholder={tableType === "american" ? "0-36 or 00" : "0-36"}
                className="w-28 px-3 py-2 bg-[#2a2a3e] border border-[#D4AF37]/30 rounded text-white font-numbers text-center text-lg focus:outline-none focus:border-[#D4AF37]"
                onKeyDown={e => e.key === "Enter" && handleManualSpin()}
              />
              <button
                onClick={handleManualSpin}
                disabled={isSpinning}
                className="px-4 py-2 bg-[#35654D] hover:bg-[#35654D]/80 text-white font-body font-semibold rounded transition-colors"
              >
                Enter
              </button>
            </motion.div>
          )}

          {/* History */}
          <SpinHistory />

          {/* Streak Monitor — built-in pattern detection */}
          <StreakMonitor />

          {/* Number Strip — casino marquee display */}
          <NumberStrip history={history} />

          {/* Board */}
          <RouletteBoard />
        </div>
      </div>

      {/* Modals */}
      <PayoutChart isOpen={showPayouts} onClose={() => setShowPayouts(false)} />
      <StrategyLibrary
        isOpen={showStrategies}
        onClose={() => setShowStrategies(false)}
        onWatchMode={handleWatchModeRequest}
      />
      <SessionSetup isOpen={showSessionSetup} onClose={() => setShowSessionSetup(false)} />

      {/* Watch Mode Setup */}
      {watchModeStrategy && (
        <WatchModeSetup
          isOpen={showWatchSetup}
          strategy={watchModeStrategy}
          onClose={() => { setShowWatchSetup(false); setWatchModeStrategy(null); }}
          onStart={handleWatchStart}
        />
      )}

      {/* Overlays */}
      <PauseOverlay />
      <SessionEndOverlay />

      {/* Bankroll Edit Dialog */}
      {showBankrollEdit && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowBankrollEdit(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg p-4 w-[280px]">
            <h3 className="text-[#D4AF37] font-display text-lg tracking-wider mb-3 text-center">SET BANKROLL</h3>
            <input
              type="number"
              value={bankrollInput}
              onChange={e => setBankrollInput(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-[#D4AF37]/30 rounded text-white font-numbers text-xl text-center focus:outline-none focus:border-[#D4AF37] mb-3"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleSetBankroll()}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowBankrollEdit(false)}
                className="bg-[#2a2a3e] text-white font-body py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSetBankroll}
                className="bg-[#D4AF37] text-[#1a1a2e] font-body font-bold py-2 rounded"
              >
                Set
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowResetConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a2e] border-2 border-[#8B0000] rounded-lg p-4 w-[300px]">
            <h3 className="text-red-400 font-display text-lg tracking-wider mb-2 text-center">RESET HISTORY</h3>
            <p className="text-[#C0C0C0] font-body text-sm text-center mb-4">
              Are you sure you want to clear all spin history? This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-[#2a2a3e] text-white font-body py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleResetHistory}
                className="bg-[#8B0000] text-white font-body font-bold py-2 rounded"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
