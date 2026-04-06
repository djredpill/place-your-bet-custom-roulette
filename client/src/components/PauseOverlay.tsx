import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { Play } from "lucide-react";

export default function PauseOverlay() {
  const { sessionPaused, resumeSession, totalSpins, sessionProfit, bankroll } = useGame();

  return (
    <AnimatePresence>
      {sessionPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center"
          onClick={resumeSession}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg p-6 shadow-2xl">
              <h2 className="font-display text-3xl tracking-wider text-[#D4AF37] mb-2">
                PAUSED
              </h2>
              <div className="flex items-center justify-center gap-4 mb-4 text-sm font-numbers">
                <span className="text-[#C0C0C0]">{totalSpins} spins</span>
                <span className="text-[#C0C0C0]">|</span>
                <span className={sessionProfit >= 0 ? "text-green-400" : "text-red-400"}>
                  {sessionProfit >= 0 ? "+" : ""}${sessionProfit}
                </span>
                <span className="text-[#C0C0C0]">|</span>
                <span className="text-white">${bankroll}</span>
              </div>
              <button
                onClick={resumeSession}
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-xl tracking-wider px-8 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Play size={20} />
                RESUME
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
