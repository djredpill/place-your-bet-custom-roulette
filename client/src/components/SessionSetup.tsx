import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { X, Clock, Target, TrendingDown, Skull, Zap, Timer } from "lucide-react";
import { toast } from "sonner";

interface SessionSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionSetup({ isOpen, onClose }: SessionSetupProps) {
  const { startSession, setBankroll, bankroll, tableType, setTableType } = useGame();

  const [timeLimit, setTimeLimit] = useState<number | null>(15);
  const [lossLimit, setLossLimit] = useState<number | null>(null);
  const [winGoal, setWinGoal] = useState<number | null>(null);
  const [goBust, setGoBust] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [customLoss, setCustomLoss] = useState("");
  const [customWin, setCustomWin] = useState("");
  const [bankrollInput, setBankrollInput] = useState(String(bankroll));
  const [spinMode, setSpinMode] = useState<"relaxed" | "casino">("relaxed");
  const [casinoTimer, setCasinoTimer] = useState(30);

  const timeOptions = [5, 10, 15, 20, 30, 60];

  const handleStart = () => {
    const br = parseInt(bankrollInput);
    if (br > 0 && br !== bankroll) setBankroll(br);

    startSession({
      mode: "visual",
      entryMode: "random",
      spinMode,
      casinoTimer,
      timeLimit,
      lossLimit,
      winGoal,
      goBust,
    });
    onClose();
    toast.success("Session started!");
  };

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[340px] max-w-[95vw] max-h-[85vh] overflow-auto"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg shadow-2xl">
              {/* Header */}
              <div className="bg-[#D4AF37]/10 px-4 py-3 border-b border-[#D4AF37]/30 flex items-center justify-between sticky top-0 bg-[#1a1a2e] z-10">
                <h2 className="text-[#D4AF37] font-display text-xl tracking-wider">SESSION SETUP</h2>
                <button onClick={onClose} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Table Type */}
                <div>
                  <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider block mb-2">
                    Table Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTableType("american")}
                      className={`py-2 rounded font-body text-sm transition-all border ${
                        tableType === "american"
                          ? "bg-[#35654D] border-[#D4AF37] text-white"
                          : "bg-black/20 border-white/10 text-[#C0C0C0] hover:border-white/20"
                      }`}
                    >
                      American (0 + 00)
                    </button>
                    <button
                      onClick={() => setTableType("european")}
                      className={`py-2 rounded font-body text-sm transition-all border ${
                        tableType === "european"
                          ? "bg-[#35654D] border-[#D4AF37] text-white"
                          : "bg-black/20 border-white/10 text-[#C0C0C0] hover:border-white/20"
                      }`}
                    >
                      European (0 only)
                    </button>
                  </div>
                </div>

                {/* Spin Mode */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={14} className="text-[#D4AF37]" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Spin Mode
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={() => setSpinMode("relaxed")}
                      className={`py-2 rounded font-body text-sm transition-all border ${spinMode === "relaxed" ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0] hover:border-white/20"}`}
                    >
                      Relaxed
                    </button>
                    <button
                      onClick={() => setSpinMode("casino")}
                      className={`py-2 rounded font-body text-sm transition-all border ${spinMode === "casino" ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0] hover:border-white/20"}`}
                    >
                      Casino
                    </button>
                  </div>
                  <p className="text-[#C0C0C0]/50 font-body text-[10px] mb-2">
                    {spinMode === "relaxed"
                      ? "Take your time — wheel spins only when you press SPIN."
                      : "Simulates real table pressure — auto-spins after countdown."}
                  </p>
                  {spinMode === "casino" && (
                    <div>
                      <label className="text-[#C0C0C0]/60 font-body text-[10px] uppercase tracking-wider block mb-1">Bet Timer (seconds)</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[15, 30, 45, 60].map(s => (
                          <button
                            key={s}
                            onClick={() => setCasinoTimer(s)}
                            className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${casinoTimer === s ? "bg-[#35654D] border-[#D4AF37] text-white" : "bg-black/20 border-white/10 text-[#C0C0C0]"}`}
                          >
                            {s}s
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bankroll */}
                <div>
                  <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider block mb-2">
                    Starting Bankroll
                  </label>
                  <input
                    type="number"
                    value={bankrollInput}
                    onChange={e => setBankrollInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-[#D4AF37]/30 rounded text-white font-numbers text-lg text-center focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Timer */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-[#D4AF37]" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Time Limit
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <button
                      onClick={() => setTimeLimit(null)}
                      className={`py-1.5 rounded text-xs font-body transition-all border ${
                        timeLimit === null
                          ? "bg-[#35654D] border-[#D4AF37] text-white"
                          : "bg-black/20 border-white/10 text-[#C0C0C0]"
                      }`}
                    >
                      None
                    </button>
                    {timeOptions.map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeLimit(t)}
                        className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                          timeLimit === t
                            ? "bg-[#35654D] border-[#D4AF37] text-white"
                            : "bg-black/20 border-white/10 text-[#C0C0C0]"
                        }`}
                      >
                        {t}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Custom min"
                      value={customTime}
                      onChange={e => {
                        setCustomTime(e.target.value);
                        const v = parseInt(e.target.value);
                        if (v > 0) setTimeLimit(v);
                      }}
                      className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded text-white font-numbers text-sm text-center focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Loss Limit */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} className="text-red-400" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Loss Limit
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <button
                      onClick={() => setLossLimit(null)}
                      className={`py-1.5 rounded text-xs font-body transition-all border ${
                        lossLimit === null
                          ? "bg-[#35654D] border-[#D4AF37] text-white"
                          : "bg-black/20 border-white/10 text-[#C0C0C0]"
                      }`}
                    >
                      None
                    </button>
                    {[100, 250, 500].map(v => (
                      <button
                        key={v}
                        onClick={() => setLossLimit(v)}
                        className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                          lossLimit === v
                            ? "bg-[#35654D] border-[#D4AF37] text-white"
                            : "bg-black/20 border-white/10 text-[#C0C0C0]"
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
                </div>

                {/* Win Goal */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-green-400" />
                    <label className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">
                      Win Goal
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <button
                      onClick={() => setWinGoal(null)}
                      className={`py-1.5 rounded text-xs font-body transition-all border ${
                        winGoal === null
                          ? "bg-[#35654D] border-[#D4AF37] text-white"
                          : "bg-black/20 border-white/10 text-[#C0C0C0]"
                      }`}
                    >
                      None
                    </button>
                    {[100, 250, 500].map(v => (
                      <button
                        key={v}
                        onClick={() => setWinGoal(v)}
                        className={`py-1.5 rounded text-xs font-numbers font-bold transition-all border ${
                          winGoal === v
                            ? "bg-[#35654D] border-[#D4AF37] text-white"
                            : "bg-black/20 border-white/10 text-[#C0C0C0]"
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
                </div>

                {/* Go Bust */}
                <button
                  onClick={() => setGoBust(!goBust)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    goBust
                      ? "bg-red-900/30 border-red-600/40"
                      : "bg-black/20 border-white/10 hover:border-white/20"
                  }`}
                >
                  <Skull size={18} className={goBust ? "text-red-400" : "text-[#C0C0C0]/40"} />
                  <div className="text-left flex-1">
                    <p className={`font-body font-semibold text-sm ${goBust ? "text-red-300" : "text-[#C0C0C0]"}`}>
                      Play Until Bust
                    </p>
                    <p className="text-[#C0C0C0]/40 font-body text-[10px]">
                      Keep playing until bankroll hits $0
                    </p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all ${goBust ? "bg-red-600" : "bg-white/10"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-all ${goBust ? "ml-5" : "ml-0.5"}`} />
                  </div>
                </button>

                {/* Start button */}
                <button
                  onClick={handleStart}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-xl tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Zap size={20} />
                  START SESSION
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
