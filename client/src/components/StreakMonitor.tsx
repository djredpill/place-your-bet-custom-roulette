import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Settings, X, TrendingUp, Zap } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { detectStreaks, type StreakAlert } from "@/lib/streak-detector";

/*
 * StreakMonitor — Built-in pattern monitoring system
 * Watches spin history for streaks (color, parity, dozen, column, high/low)
 * Adjustable threshold: 5-10, default 7
 * Non-blocking alerts — informational only, player decides what to do
 */

interface StreakMonitorProps {
  /** Override history for Watch Mode (uses GameContext history by default) */
  externalHistory?: { number: number | string; timestamp: number }[];
}

export default function StreakMonitor({ externalHistory }: StreakMonitorProps) {
  const { history: gameHistory } = useGame();
  const [threshold, setThreshold] = useState(7);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activeAlerts, setActiveAlerts] = useState<StreakAlert[]>([]);

  const history = externalHistory || gameHistory;

  // Run streak detection whenever history changes
  useEffect(() => {
    const alerts = detectStreaks(history, threshold);
    // Only show alerts that haven't been dismissed
    const newAlerts = alerts.filter(a => {
      // Create a stable key based on type+value (not timestamp)
      const key = `${a.type}-${a.value}`;
      return !dismissedAlerts.has(key);
    });
    setActiveAlerts(newAlerts);
  }, [history, threshold, dismissedAlerts]);

  const dismissAlert = useCallback((alert: StreakAlert) => {
    const key = `${alert.type}-${alert.value}`;
    setDismissedAlerts(prev => { const next = new Set(prev); next.add(key); return next; });
  }, []);

  // Reset dismissed alerts when history is cleared
  useEffect(() => {
    if (history.length === 0) {
      setDismissedAlerts(new Set());
    }
  }, [history.length]);

  // Haptic feedback when new alert appears
  useEffect(() => {
    if (activeAlerts.length > 0 && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [activeAlerts.length]);

  return (
    <>
      {/* Streak Monitor indicator — always visible */}
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

      {/* Active streak alerts */}
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
            <div className="bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-2.5 flex items-start gap-2">
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
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
