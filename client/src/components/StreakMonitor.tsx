import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Settings, X, Zap, DollarSign } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { detectStreaks, type StreakAlert } from "@/lib/streak-detector";
import { getOutsideBetNumbers, type BetType } from "@/lib/roulette-data";
import { playChipPlace } from "@/lib/sounds";
import { toast } from "sonner";

/*
 * StreakMonitor — Built-in pattern monitoring system
 * Watches spin history for streaks (color, parity, dozen, column, high/low)
 * Adjustable threshold: 5-10, default 7
 * Non-blocking alerts with SIDE BET quick-action button
 * Side bet places a $5 counter-bet on the opposite outcome
 */

interface StreakMonitorProps {
  externalHistory?: { number: number | string; timestamp: number }[];
}

export default function StreakMonitor({ externalHistory }: StreakMonitorProps) {
  const { history: gameHistory, addBet, soundEnabled } = useGame();
  const [threshold, setThreshold] = useState(7);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activeAlerts, setActiveAlerts] = useState<StreakAlert[]>([]);

  const history = externalHistory || gameHistory;

  useEffect(() => {
    const alerts = detectStreaks(history, threshold);
    const newAlerts = alerts.filter(a => {
      const key = `${a.type}-${a.value}`;
      return !dismissedAlerts.has(key);
    });
    setActiveAlerts(newAlerts);
  }, [history, threshold, dismissedAlerts]);

  const dismissAlert = useCallback((alert: StreakAlert) => {
    const key = `${alert.type}-${alert.value}`;
    setDismissedAlerts(prev => { const next = new Set(prev); next.add(key); return next; });
  }, []);

  useEffect(() => {
    if (history.length === 0) {
      setDismissedAlerts(new Set());
    }
  }, [history.length]);

  useEffect(() => {
    if (activeAlerts.length > 0 && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [activeAlerts.length]);

  // Side bet quick-action: places a $5 counter-bet
  const handleSideBet = useCallback((alert: StreakAlert) => {
    const betType = alert.suggestedBetType;
    let type: BetType;
    let numbers: (number | string)[];
    let label: string;

    // Parse the suggested bet type
    if (betType === "red" || betType === "black" || betType === "odd" || betType === "even" || betType === "high" || betType === "low") {
      type = betType as BetType;
      numbers = getOutsideBetNumbers(type);
      label = betType.toUpperCase();
    } else if (betType.startsWith("dozen-")) {
      type = "dozen";
      const variant = parseInt(betType.split("-")[1]);
      numbers = getOutsideBetNumbers("dozen", variant);
      const dozenLabels: Record<number, string> = { 1: "1st 12", 2: "2nd 12", 3: "3rd 12" };
      label = dozenLabels[variant] || "Dozen";
    } else if (betType.startsWith("column-")) {
      type = "column";
      const variant = parseInt(betType.split("-")[1]);
      numbers = getOutsideBetNumbers("column", variant);
      label = `Column ${variant}`;
    } else {
      return;
    }

    addBet({ type, numbers, amount: 5, label: `Side: ${label}` });
    if (soundEnabled) playChipPlace();
    toast.success(`Side bet placed: $5 on ${label}`);
    dismissAlert(alert);
  }, [addBet, soundEnabled, dismissAlert]);

  return (
    <>
      {/* Streak Monitor indicator */}
      <div className="flex items-center justify-between px-4 py-1">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className={activeAlerts.length > 0 ? "text-[#D4AF37] animate-pulse" : "text-[#C0C0C0]/30"} />
          <span className="text-[#C0C0C0]/40 font-body text-[9px] uppercase tracking-wider">
            Streak Monitor
          </span>
          {activeAlerts.length > 0 && (
            <span className="bg-[#D4AF37] text-[#1a1a2e] font-numbers text-[9px] font-bold px-1.5 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[#C0C0C0]/30 hover:text-[#C0C0C0]/60 transition-colors"
          title="Streak Monitor Settings"
        >
          <Settings size={12} />
        </button>
      </div>

      {/* Settings dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#C0C0C0] font-body text-xs">Alert Threshold</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[#C0C0C0]/40 hover:text-[#C0C0C0]"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[#C0C0C0]/50 font-body text-[10px] mb-2">
                Alert when a streak reaches this many consecutive results
              </p>
              <div className="flex gap-1.5">
                {[5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setThreshold(n)}
                    className={`flex-1 py-1.5 rounded text-sm font-numbers font-bold transition-colors ${
                      threshold === n
                        ? "bg-[#D4AF37] text-[#1a1a2e]"
                        : "bg-white/5 text-[#C0C0C0]/60 hover:bg-white/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[#C0C0C0]/30 font-body text-[9px] mt-2 text-center">
                Monitors: Color &bull; Odd/Even &bull; Dozen &bull; Column &bull; High/Low
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active streak alerts with side bet button */}
      <AnimatePresence>
        {activeAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ height: 0, opacity: 0, x: -20 }}
            animate={{ height: "auto", opacity: 1, x: 0 }}
            exit={{ height: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="px-4 mb-1"
          >
            <div className="bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#D4AF37] font-display text-xs tracking-wider">
                      {alert.label} STREAK
                    </span>
                    <span className="text-[#C0C0C0]/40 font-body text-[9px]">
                      {alert.count} in a row
                    </span>
                  </div>
                  <p className="text-[#C0C0C0] font-body text-[11px] mt-0.5">
                    {alert.suggestion}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alert)}
                  className="text-[#C0C0C0]/30 hover:text-[#C0C0C0]/60 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Side bet quick-action */}
              {!externalHistory && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleSideBet(alert)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 rounded text-[#D4AF37] font-body text-xs font-semibold transition-colors"
                  >
                    <DollarSign size={12} />
                    Side Bet $5
                  </button>
                  <span className="text-[#C0C0C0]/30 font-body text-[9px]">
                    Quick counter-bet
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
