import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Clock, Target, TrendingDown, Skull, Hash, Zap } from "lucide-react";
import type { Strategy } from "@/lib/roulette-data";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Watch Mode Setup — configure auto-play: spin duration slider, exit conditions
 * Spin duration: 3s–20s slider (default 20s = realistic casino pace) + Instant toggle
 * Exit conditions: manual, spin count, time, win goal, loss limit, go bust
 */

export interface WatchModeConfig {
  spinDuration: number;       // seconds (3-20, or 0 for instant)
  instant: boolean;
  exitMode: "manual" | "spins" | "time" | "bust" | "winGoal" | "lossLimit";
  spinCount: number;
  timeMinutes: number;
  winGoal: number;
  lossLimit: number;
}

interface WatchModeSetupProps {
  isOpen: boolean;
  strategy: Strategy;
  onClose: () => void;
  onStart: (config: WatchModeConfig) => void;
}

const DURATION_STOPS = [3, 5, 8, 12, 15, 20];

export default function WatchModeSetup({ isOpen, strategy, onClose, onStart }: WatchModeSetupProps) {
  const [spinDuration, setSpinDuration] = useState(20);
  const [instant, setInstant] = useState(false);
  const [exitMode, setExitMode] = useState<WatchModeConfig["exitMode"]>("manual");
  const [spinCount, setSpinCount] = useState(100);
  const [timeMinutes, setTimeMinutes] = useState(10);
  const [winGoal, setWinGoal] = useState(500);
  const [lossLimit, setLossLimit] = useState(250);
  const [customSpins, setCustomSpins] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customWin, setCustomWin] = useState("");
  const [customLoss, setCustomLoss] = useState("");

  const handleStart = () => {
    onStart({
      spinDuration: instant ? 0 : spinDuration,
      instant,
      exitMode,
      spinCount,
      timeMinutes,
      winGoal,
      lossLimit,
    });
  };

  // Find nearest stop index for the slider
  const sliderIndex = DURATION_STOPS.indexOf(spinDuration) !== -1
    ? DURATION_STOPS.indexOf(spinDuration)
    : DURATION_STOPS.length - 1;

  const durationLabel = instant
    ? "Instant — no animation"
    : spinDuration <= 5
      ? `${spinDuration}s — quick preview`
      : spinDuration <= 12
        ? `${spinDuration}s — compressed`
        : `${spinDuration}s — realistic casino pace`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[360px] max-w-[95vw] max-h-[85vh] overflow-auto"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg shadow-2xl">
              {/* Header */}
              <div className="bg-[#D4AF37]/10 px-4 py-3 border-b border-[#D4AF37]/30 flex items-center justify-between sticky top-0 bg-[#1a1a2e] z-10">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-[#D4AF37]" />
                  <h2 className="text-[#D4AF37] font-display text-lg tracking-wider">WATCH MODE</h2>
                </div>
                <button onClick={onClose} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Strategy name */}
                <div className="bg-black/20 rounded-lg border border-white/5 p-3 text-center">
                  <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase tracking-wider">Strategy</p>
                  <p className="text-[#FFFDD0] font-body font-semibold text-sm mt-0.5">{strategy.name}</p>
                  <div className="flex items-center justify-center gap-3 mt-1 text-xs font-numbers">
                    <span className="text-[#D4AF37] font-bold">{strategy.rating}/100</span>
                    <span className="text-[#C0C0C0]/30">|</span>
                    <span className="text-[#C0C0C0]">${strategy.bankrollRequired} bankroll</span>
                  </div>
                </div>

                {/* Spin Duration */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-[#D4AF37]" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Spin Duration
                    </label>
                  </div>

                  {/* Duration stops */}
                  <div className="grid grid-cols-6 gap-1.5 mb-2">
                    {DURATION_STOPS.map(d => (
                      <button
                        key={d}
                        onClick={() => { setSpinDuration(d); setInstant(false); }}
                        className={`py-2 rounded text-center transition-all border ${
                          !instant && spinDuration === d
                            ? "bg-[#35654D] border-[#D4AF37] text-white"
                            : "bg-black/20 border-white/10 text-[#C0C0C0] hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-numbers font-bold block">{d}s</span>
                      </button>
                    ))}
                  </div>

                  {/* Instant toggle */}
                  <button
                    onClick={() => setInstant(!instant)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      instant
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/50"
                        : "bg-black/20 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Zap size={16} className={instant ? "text-[#D4AF37]" : "text-[#C0C0C0]/40"} />
                    <div className="flex-1 text-left">
                      <p className={`font-body font-semibold text-sm ${instant ? "text-[#D4AF37]" : "text-[#C0C0C0]"}`}>
                        Instant
                      </p>
                      <p className="text-[#C0C0C0]/40 font-body text-[10px]">No animation — pure data</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all ${instant ? "bg-[#D4AF37]" : "bg-white/10"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-all ${instant ? "ml-5" : "ml-0.5"}`} />
                    </div>
                  </button>

                  <p className="text-[#C0C0C0]/40 font-body text-[10px] mt-1 text-center">
                    {durationLabel}
                  </p>
                </div>

                {/* Run Until (Exit Condition) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-[#D4AF37]" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Run Until
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    {/* Manual Stop */}
                    <ExitOption
                      active={exitMode === "manual"}
                      onClick={() => setExitMode("manual")}
                      icon={<Zap size={16} />}
                      title="Manual Stop"
                      desc="Run until you hit stop"
                    />

                    {/* Number of Spins */}
                    <ExitOption
                      active={exitMode === "spins"}
                      onClick={() => setExitMode("spins")}
                      icon={<Hash size={16} />}
                      title="Number of Spins"
                      desc="Stop after set number of spins"
                    />
                    {exitMode === "spins" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pl-8">
                        <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                          {[50, 100, 200, 500, 1000].map(n => (
                            <button
                              key={n}
                              onClick={() => setSpinCount(n)}
                              className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                                spinCount === n ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0]"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          placeholder="Custom"
                          value={customSpins}
                          onChange={e => {
                            setCustomSpins(e.target.value);
                            const v = parseInt(e.target.value);
                            if (v > 0) setSpinCount(v);
                          }}
                          className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-white font-numbers text-sm text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                      </motion.div>
                    )}

                    {/* Time Limit */}
                    <ExitOption
                      active={exitMode === "time"}
                      onClick={() => setExitMode("time")}
                      icon={<Clock size={16} />}
                      title="Time Limit"
                      desc="Stop after set time"
                    />
                    {exitMode === "time" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pl-8">
                        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                          {[5, 10, 15, 30].map(m => (
                            <button
                              key={m}
                              onClick={() => setTimeMinutes(m)}
                              className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                                timeMinutes === m ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0]"
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          placeholder="Custom min"
                          value={customTime}
                          onChange={e => {
                            setCustomTime(e.target.value);
                            const v = parseInt(e.target.value);
                            if (v > 0) setTimeMinutes(v);
                          }}
                          className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-white font-numbers text-sm text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                      </motion.div>
                    )}

                    {/* Win Goal */}
                    <ExitOption
                      active={exitMode === "winGoal"}
                      onClick={() => setExitMode("winGoal")}
                      icon={<Target size={16} />}
                      title="Win Goal"
                      desc="Stop when profit reaches target"
                      color="green"
                    />
                    {exitMode === "winGoal" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pl-8">
                        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                          {[100, 250, 500, 1000].map(v => (
                            <button
                              key={v}
                              onClick={() => setWinGoal(v)}
                              className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                                winGoal === v ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0]"
                              }`}
                            >
                              ${v}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          placeholder="Custom amount"
                          value={customWin}
                          onChange={e => {
                            setCustomWin(e.target.value);
                            const v = parseInt(e.target.value);
                            if (v > 0) setWinGoal(v);
                          }}
                          className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-white font-numbers text-sm text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                      </motion.div>
                    )}

                    {/* Loss Limit */}
                    <ExitOption
                      active={exitMode === "lossLimit"}
                      onClick={() => setExitMode("lossLimit")}
                      icon={<TrendingDown size={16} />}
                      title="Loss Limit"
                      desc="Stop when losses reach limit"
                      color="red"
                    />
                    {exitMode === "lossLimit" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pl-8">
                        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                          {[100, 250, 500, 1000].map(v => (
                            <button
                              key={v}
                              onClick={() => setLossLimit(v)}
                              className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                                lossLimit === v ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0]"
                              }`}
                            >
                              ${v}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          placeholder="Custom amount"
                          value={customLoss}
                          onChange={e => {
                            setCustomLoss(e.target.value);
                            const v = parseInt(e.target.value);
                            if (v > 0) setLossLimit(v);
                          }}
                          className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-white font-numbers text-sm text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                      </motion.div>
                    )}

                    {/* Go Bust */}
                    <ExitOption
                      active={exitMode === "bust"}
                      onClick={() => setExitMode("bust")}
                      icon={<Skull size={16} />}
                      title="Go Bust"
                      desc="Run until bankroll hits $0"
                      color="red"
                    />
                  </div>
                </div>

                {/* Start button */}
                <button
                  onClick={handleStart}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-xl tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Eye size={20} />
                  START WATCHING
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Reusable radio-style exit condition option */
function ExitOption({
  active, onClick, icon, title, desc, color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color?: "red" | "green";
}) {
  const activeBg = color === "red" ? "bg-red-900/30 border-red-600/40" : color === "green" ? "bg-green-900/20 border-green-600/30" : "bg-[#35654D]/30 border-[#D4AF37]/50";
  const activeIcon = color === "red" ? "text-red-400" : color === "green" ? "text-green-400" : "text-[#D4AF37]";
  const activeDot = color === "red" ? "border-red-400" : color === "green" ? "border-green-400" : "border-[#D4AF37]";
  const activeDotFill = color === "red" ? "bg-red-400" : color === "green" ? "bg-green-400" : "bg-[#D4AF37]";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
        active ? activeBg : "bg-black/20 border-white/10 hover:border-white/20"
      }`}
    >
      <span className={active ? activeIcon : "text-[#C0C0C0]/40"}>{icon}</span>
      <div className="flex-1">
        <p className={`font-body font-semibold text-sm ${active ? "text-white" : "text-[#C0C0C0]"}`}>{title}</p>
        <p className="text-[#C0C0C0]/40 font-body text-[10px]">{desc}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? activeDot : "border-white/20"}`}>
        {active && <div className={`w-2 h-2 rounded-full ${activeDotFill}`} />}
      </div>
    </button>
  );
}
