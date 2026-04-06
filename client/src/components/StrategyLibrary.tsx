import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STRATEGIES, RATING_CATEGORIES, type Strategy } from "@/lib/roulette-data";
import { useGame } from "@/contexts/GameContext";
import { X, ExternalLink, Play, Star, ChevronRight, BookOpen, Eye } from "lucide-react";
import { toast } from "sonner";

interface StrategyLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchMode?: (strategy: Strategy) => void;
}

function RatingBar({ value, max = 20 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#D4AF37" : pct >= 40 ? "#f59e0b" : "#ef4444",
        }}
      />
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Conservative: "bg-green-800/60 text-green-300 border-green-600/40",
    Moderate: "bg-yellow-800/40 text-yellow-300 border-yellow-600/40",
    Aggressive: "bg-red-800/40 text-red-300 border-red-600/40",
  };
  return (
    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded border ${colors[level] || colors.Moderate}`}>
      {level}
    </span>
  );
}

function StrategyDetail({ strategy, onLoad, onWatch, onClose }: { strategy: Strategy; onLoad: () => void; onWatch?: () => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="bg-[#1a1a2e]"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#1a1a2e] border-b border-[#D4AF37]/30 px-4 py-3 flex items-center gap-2 z-10">
        <button onClick={onClose} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h3 className="text-[#D4AF37] font-display text-base tracking-wider flex-1 truncate">
          {strategy.name}
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Rating + Risk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-center">
              <span className="text-3xl font-numbers font-bold text-[#D4AF37]">{strategy.rating}</span>
            </div>
            <div>
              <RiskBadge level={strategy.riskLevel} />
              <p className="text-[#C0C0C0] font-body text-[10px] mt-1">out of 100</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#C0C0C0] font-body text-xs">Demo Profit</p>
            <p className="text-green-400 font-numbers font-bold text-xl">+${strategy.demoProfit}</p>
            <p className="text-[#C0C0C0]/60 font-body text-[10px]">{strategy.demoDuration}</p>
          </div>
        </div>

        {/* Rating breakdown */}
        <div className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
          <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider">Rating Breakdown</h4>
          {RATING_CATEGORIES.map((cat, i) => {
            const values = [
              strategy.ratings.coverage,
              strategy.ratings.riskReward,
              strategy.ratings.bankrollEff,
              strategy.ratings.recovery,
              strategy.ratings.discipline,
            ];
            return (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-[#C0C0C0] font-body text-[11px] w-24 shrink-0">{cat.name}</span>
                <RatingBar value={values[i]} />
                <span className="text-white font-numbers text-xs w-6 text-right">{values[i]}</span>
              </div>
            );
          })}
        </div>

        {/* Bankroll */}
        <div className="flex items-center justify-between bg-black/20 rounded-lg border border-white/5 p-3">
          <div>
            <p className="text-[#C0C0C0] font-body text-xs">Recommended Bankroll</p>
            <p className="text-white font-numbers font-bold text-lg">${strategy.bankrollRequired}</p>
          </div>
          <div className="text-right">
            <p className="text-[#C0C0C0] font-body text-xs">Unit Size</p>
            <p className="text-white font-numbers font-bold text-lg">${strategy.unitSize}</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-black/20 rounded-lg border border-white/5 p-3">
          <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider mb-2">How It Works</h4>
          <p className="text-[#C0C0C0] font-body text-sm leading-relaxed">{strategy.howItWorks}</p>
        </div>

        {/* Progression */}
        <div className="bg-black/20 rounded-lg border border-white/5 p-3">
          <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider mb-2">Progression Rules</h4>
          <p className="text-[#C0C0C0] font-body text-sm leading-relaxed">{strategy.progression}</p>
        </div>

        {/* Bets preview */}
        <div className="bg-black/20 rounded-lg border border-white/5 p-3">
          <h4 className="text-[#D4AF37] font-body font-semibold text-xs uppercase tracking-wider mb-2">
            Starting Bets ({strategy.bets.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {strategy.bets.map(bet => (
              <span key={bet.id} className="bg-[#35654D]/40 border border-[#35654D]/60 text-[#FFFDD0] font-numbers text-xs px-2 py-1 rounded">
                {bet.label} — ${bet.amount}
              </span>
            ))}
          </div>
        </div>

        {/* Demo disclaimer */}
        <p className="text-[#C0C0C0]/40 font-body text-[10px] italic text-center">
          Demo results shown are from a single session and may not represent typical outcomes.
        </p>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onLoad}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-base tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              LOAD
            </button>
            {onWatch && (
              <button
                onClick={onWatch}
                className="bg-[#35654D] hover:bg-[#35654D]/80 text-white font-display text-base tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                WATCH
              </button>
            )}
          </div>
          <a
            href={strategy.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#8B0000]/60 hover:bg-[#8B0000]/80 text-white font-body font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ExternalLink size={14} />
            Watch Tutorial on YouTube
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function StrategyLibrary({ isOpen, onClose, onWatchMode }: StrategyLibraryProps) {
  const { loadStrategy } = useGame();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const handleLoad = (strategy: Strategy) => {
    loadStrategy(strategy);
    setSelectedStrategy(null);
    onClose();
    toast.success(`${strategy.name} loaded! Bankroll set to $${strategy.bankrollRequired}`);
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
            onClick={() => { setSelectedStrategy(null); onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[360px] max-w-[95vw] h-[85vh] overflow-hidden"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg shadow-2xl h-full flex flex-col relative">
              {/* Header */}
              <div className="bg-[#D4AF37]/10 px-4 py-3 border-b border-[#D4AF37]/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-[#D4AF37]" />
                  <h2 className="text-[#D4AF37] font-display text-xl tracking-wider">STRATEGIES</h2>
                </div>
                <button onClick={() => { setSelectedStrategy(null); onClose(); }} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
                  <X size={20} />
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-auto relative">
                <AnimatePresence mode="wait">
                  {!selectedStrategy ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-2 space-y-1"
                    >
                      {STRATEGIES.map(strategy => (
                        <button
                          key={strategy.id}
                          onClick={() => setSelectedStrategy(strategy)}
                          className="w-full text-left bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#D4AF37]/30 rounded-lg p-3 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[#FFFDD0] font-body font-semibold text-sm group-hover:text-[#D4AF37] transition-colors flex-1 pr-2">
                              {strategy.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[#D4AF37] font-numbers font-bold text-lg">{strategy.rating}</span>
                              <ChevronRight size={16} className="text-[#C0C0C0]/40 group-hover:text-[#D4AF37]" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={strategy.riskLevel} />
                            <span className="text-[#C0C0C0]/60 font-body text-[10px]">
                              ${strategy.bankrollRequired} bankroll
                            </span>
                            <span className="text-green-400/60 font-numbers text-[10px] ml-auto">
                              +${strategy.demoProfit} demo
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <StrategyDetail
                      key="detail"
                      strategy={selectedStrategy}
                      onLoad={() => handleLoad(selectedStrategy)}
                      onWatch={onWatchMode ? () => {
                        const s = selectedStrategy;
                        setSelectedStrategy(null);
                        onClose();
                        onWatchMode(s);
                      } : undefined}
                      onClose={() => setSelectedStrategy(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
