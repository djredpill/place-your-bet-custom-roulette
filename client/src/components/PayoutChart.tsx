import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PAYOUT_TABLE, RATING_CATEGORIES } from "@/lib/roulette-data";
import { useGame } from "@/contexts/GameContext";
import { X } from "lucide-react";

interface PayoutChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PayoutChart({ isOpen, onClose }: PayoutChartProps) {
  const { tableType } = useGame();
  const [tab, setTab] = useState<"payouts" | "ratings">("payouts");

  const houseEdge = tableType === "american" ? "5.26%" : "2.70%";
  const tableLabel = tableType === "american" ? "American (0 & 00)" : "European (0 only)";

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[360px] max-w-[95vw] max-h-[85vh] overflow-hidden"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-[#D4AF37]/10 px-4 py-3 border-b border-[#D4AF37]/30 flex items-center justify-between shrink-0">
                <h2 className="text-[#D4AF37] font-display text-xl tracking-wider">
                  INFO
                </h2>
                <button onClick={onClose} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 shrink-0">
                <button
                  onClick={() => setTab("payouts")}
                  className={`flex-1 py-2 text-sm font-body font-semibold transition-colors ${
                    tab === "payouts"
                      ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                      : "text-[#C0C0C0]/60 hover:text-[#C0C0C0]"
                  }`}
                >
                  Payouts
                </button>
                <button
                  onClick={() => setTab("ratings")}
                  className={`flex-1 py-2 text-sm font-body font-semibold transition-colors ${
                    tab === "ratings"
                      ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                      : "text-[#C0C0C0]/60 hover:text-[#C0C0C0]"
                  }`}
                >
                  Rating System
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                {tab === "payouts" ? (
                  <div className="p-3">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D4AF37]/20">
                          <th className="text-left text-[#D4AF37] font-body font-semibold text-xs py-2 px-2">BET TYPE</th>
                          <th className="text-center text-[#D4AF37] font-body font-semibold text-xs py-2 px-2">#</th>
                          <th className="text-center text-[#D4AF37] font-body font-semibold text-xs py-2 px-2">PAYS</th>
                          <th className="text-left text-[#D4AF37] font-body font-semibold text-xs py-2 px-2">COVERS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PAYOUT_TABLE.filter(row => {
                          if (tableType === "european" && row.type === "five") return false;
                          return true;
                        }).map((row, i) => (
                          <tr
                            key={row.type}
                            className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                          >
                            <td className="text-[#FFFDD0] font-body font-semibold text-sm py-2 px-2">
                              {row.label}
                            </td>
                            <td className="text-center text-[#C0C0C0] font-numbers text-sm py-2 px-2">
                              {row.coverage}
                            </td>
                            <td className="text-center text-white font-numbers font-bold text-sm py-2 px-2">
                              {row.payout}:1
                            </td>
                            <td className="text-[#C0C0C0] font-body text-xs py-2 px-2">
                              {row.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 p-2 bg-[#35654D]/20 rounded border border-[#35654D]/30">
                      <p className="text-[#C0C0C0] font-body text-xs text-center">
                        {tableLabel} &bull; House Edge: {houseEdge}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <p className="text-[#C0C0C0] font-body text-sm leading-relaxed">
                      Each strategy is rated on a <span className="text-white font-bold">100-point scale</span> based on 5 categories, each worth up to 20 points. All strategies were demonstrated by The Roulette Master in 15-minute sessions.
                    </p>

                    {RATING_CATEGORIES.map(cat => (
                      <div key={cat.name} className="bg-black/20 rounded-lg border border-white/5 p-3">
                        <h4 className="text-[#D4AF37] font-body font-semibold text-sm mb-1">
                          {cat.name}
                        </h4>
                        <p className="text-[#C0C0C0] font-body text-xs leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    ))}

                    <div className="bg-[#35654D]/20 rounded-lg border border-[#35654D]/30 p-3">
                      <p className="text-[#C0C0C0] font-body text-xs leading-relaxed">
                        <span className="text-[#D4AF37] font-semibold">Note:</span> Demo results shown are from a single session and may not represent typical outcomes. The house always has a mathematical edge. Use these strategies as starting points for your own testing and always set personal loss limits.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
