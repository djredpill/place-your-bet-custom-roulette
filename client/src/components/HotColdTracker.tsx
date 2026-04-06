import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, ChevronDown, ChevronUp } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { getNumberColor } from "@/lib/roulette-data";

/*
 * HotColdTracker — shows which numbers are hitting most/least frequently
 * Collapsible panel, sits near the board
 * Hot = most frequent, Cold = least frequent (or never hit)
 * Only shows data after 10+ spins for statistical relevance
 */

interface HotColdTrackerProps {
  externalHistory?: { number: number | string }[];
}

export default function HotColdTracker({ externalHistory }: HotColdTrackerProps) {
  const { history: gameHistory } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const history = externalHistory || gameHistory;

  const { hotNumbers, coldNumbers, totalSpins } = useMemo(() => {
    if (history.length < 10) {
      return { hotNumbers: [], coldNumbers: [], totalSpins: history.length };
    }

    // Count frequency of each number
    const counts: Record<string, number> = {};
    history.forEach(h => {
      const key = String(h.number);
      counts[key] = (counts[key] || 0) + 1;
    });

    // Build all possible numbers (0, 00, 1-36)
    const allNumbers: (number | string)[] = [0, "00", ...Array.from({ length: 36 }, (_, i) => i + 1)];

    // Sort by frequency
    const sorted = allNumbers.map(n => ({
      number: n,
      count: counts[String(n)] || 0,
      color: getNumberColor(n),
    })).sort((a, b) => b.count - a.count);

    // Top 5 hot, bottom 5 cold
    const hot = sorted.slice(0, 5).filter(n => n.count > 0);
    const cold = sorted.slice(-5).reverse();

    return { hotNumbers: hot, coldNumbers: cold, totalSpins: history.length };
  }, [history]);

  if (totalSpins < 10) {
    return (
      <div className="flex items-center justify-between px-4 py-1">
        <div className="flex items-center gap-1.5">
          <Flame size={12} className="text-[#C0C0C0]/20" />
          <span className="text-[#C0C0C0]/30 font-body text-[9px] uppercase tracking-wider">
            Hot/Cold — {10 - totalSpins} more spins needed
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-1 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Flame size={12} className="text-orange-400" />
          <span className="text-[#C0C0C0]/40 font-body text-[9px] uppercase tracking-wider">
            Hot / Cold Numbers
          </span>
          <span className="text-[#C0C0C0]/20 font-body text-[9px]">
            ({totalSpins} spins)
          </span>
        </div>
        {isOpen ? <ChevronUp size={12} className="text-[#C0C0C0]/30" /> : <ChevronDown size={12} className="text-[#C0C0C0]/30" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-3">
              {/* Hot numbers */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-orange-400 font-display text-xs tracking-wider">HOT</span>
                </div>
                <div className="flex gap-2">
                  {hotNumbers.map((n, i) => (
                    <div key={`hot-${i}`} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-numbers font-bold text-sm border-2 ${
                          n.color === "red"
                            ? "bg-[#8B0000] border-orange-400/50 text-white"
                            : n.color === "black"
                            ? "bg-[#1a1a1a] border-orange-400/50 text-white"
                            : "bg-[#35654D] border-orange-400/50 text-white"
                        }`}
                      >
                        {String(n.number)}
                      </div>
                      <span className="text-orange-400/80 font-numbers text-[10px] font-bold">
                        {n.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 my-2" />

              {/* Cold numbers */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Snowflake size={14} className="text-blue-400" />
                  <span className="text-blue-400 font-display text-xs tracking-wider">COLD</span>
                </div>
                <div className="flex gap-2">
                  {coldNumbers.map((n, i) => (
                    <div key={`cold-${i}`} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-numbers font-bold text-sm border-2 ${
                          n.color === "red"
                            ? "bg-[#8B0000] border-blue-400/50 text-white"
                            : n.color === "black"
                            ? "bg-[#1a1a1a] border-blue-400/50 text-white"
                            : "bg-[#35654D] border-blue-400/50 text-white"
                        } ${n.count === 0 ? "opacity-50" : ""}`}
                      >
                        {String(n.number)}
                      </div>
                      <span className="text-blue-400/80 font-numbers text-[10px] font-bold">
                        {n.count === 0 ? "—" : `${n.count}x`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
