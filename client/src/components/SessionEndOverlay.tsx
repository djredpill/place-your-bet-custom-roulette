import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { Trophy, TrendingDown, Clock, RotateCcw } from "lucide-react";

export default function SessionEndOverlay() {
  const {
    sessionEnded, sessionEndReason, totalSpins, sessionProfit,
    startingBankroll, bankroll, resetSession,
  } = useGame();

  if (!sessionEnded) return null;

  const isProfit = sessionProfit >= 0;

  return (
    <AnimatePresence>
      {sessionEnded && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[320px] max-w-[95vw]"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`px-4 py-4 text-center ${isProfit ? "bg-green-900/30" : "bg-red-900/30"}`}>
                {isProfit ? (
                  <Trophy size={40} className="text-[#D4AF37] mx-auto mb-2" />
                ) : (
                  <TrendingDown size={40} className="text-red-400 mx-auto mb-2" />
                )}
                <h2 className="font-display text-2xl tracking-wider text-[#D4AF37]">
                  SESSION OVER
                </h2>
                <p className="text-[#C0C0C0] font-body text-sm mt-1">
                  {sessionEndReason}
                </p>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                    <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase">Total Spins</p>
                    <p className="text-white font-numbers font-bold text-2xl">{totalSpins}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                    <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase">Net Result</p>
                    <p className={`font-numbers font-bold text-2xl ${isProfit ? "text-green-400" : "text-red-400"}`}>
                      {isProfit ? "+" : ""}${sessionProfit}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                    <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase">Started With</p>
                    <p className="text-white font-numbers font-bold text-lg">${startingBankroll}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                    <p className="text-[#C0C0C0]/60 font-body text-[10px] uppercase">Ended With</p>
                    <p className={`font-numbers font-bold text-lg ${bankroll >= startingBankroll ? "text-green-400" : "text-red-400"}`}>
                      ${bankroll}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={resetSession}
                    className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-lg tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    NEW SESSION
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
