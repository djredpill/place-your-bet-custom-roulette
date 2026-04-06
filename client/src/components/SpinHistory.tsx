import { useGame } from "@/contexts/GameContext";
import { getNumberColor } from "@/lib/roulette-data";
import { motion } from "framer-motion";

export default function SpinHistory() {
  const { history, totalSpins, sessionProfit } = useGame();

  const recentHistory = history.slice(0, 50);

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[#C0C0C0] font-body text-xs">
          Spins: <span className="text-white font-numbers font-bold">{totalSpins}</span>
        </span>
        <span className={`font-body text-xs ${sessionProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
          Session: <span className="font-numbers font-bold">
            {sessionProfit >= 0 ? "+" : ""}${sessionProfit}
          </span>
        </span>
      </div>

      {/* Number trail */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {recentHistory.length === 0 ? (
          <div className="text-[#C0C0C0]/40 font-body text-xs italic px-2 py-1">
            No spins yet
          </div>
        ) : (
          recentHistory.map((result, i) => {
            const color = getNumberColor(result.number);
            return (
              <motion.div
                key={result.timestamp}
                initial={i === 0 ? { scale: 0, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  font-numbers font-bold text-xs text-white
                  ${color === "red" ? "bg-[#C41E23]" : color === "black" ? "bg-[#1B1B1B]" : "bg-[#006400]"}
                  ${i === 0 ? "ring-2 ring-[#D4AF37]" : "opacity-80"}
                  border border-white/10
                `}
              >
                {result.number}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detailed last result */}
      {history.length > 0 && (
        <div className="mt-2 bg-black/20 rounded border border-white/5 p-2">
          <div className="flex items-center justify-between text-xs font-body">
            <span className="text-[#C0C0C0]">
              Last: <span className="text-white font-numbers font-bold">{history[0].number}</span>
            </span>
            <span className="text-[#C0C0C0]">
              Bet: <span className="text-white font-numbers">${history[0].totalBet}</span>
            </span>
            <span className="text-[#C0C0C0]">
              Won: <span className="text-[#D4AF37] font-numbers">${history[0].totalWin}</span>
            </span>
            <span className={`font-numbers font-bold ${history[0].netResult >= 0 ? "text-green-400" : "text-red-400"}`}>
              {history[0].netResult >= 0 ? "+" : ""}${history[0].netResult}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
