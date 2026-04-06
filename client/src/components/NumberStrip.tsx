import { useRef, useEffect } from "react";
import { getNumberColor } from "@/lib/roulette-data";
import { motion, AnimatePresence } from "framer-motion";

/*
 * NumberStrip — Casino-style horizontal scrolling number display
 * Design: Single row of color-coded pills, padded from edges.
 * Newest number on the right, older ones scroll off the left.
 * Overflow is hidden (no scrollbar), numbers just disappear off the edge.
 * All numbers remain recorded in data regardless of visual display.
 */

interface SpinResult {
  number: number | string;
  timestamp: number;
}

interface NumberStripProps {
  history: SpinResult[];
}

export default function NumberStrip({ history }: NumberStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right (newest) whenever history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [history.length]);

  if (history.length === 0) return null;

  return (
    <div className="w-full px-4">
      <div
        ref={containerRef}
        className="flex gap-1.5 overflow-hidden py-1.5"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Spacer to push numbers right as they fill */}
        <div className="flex-1 min-w-0" />

        {history.slice().reverse().map((result, i) => {
          const color = getNumberColor(result.number);
          const isNewest = i === history.length - 1;

          return (
            <motion.div
              key={result.timestamp}
              initial={isNewest ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`
                flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                font-numbers font-bold text-[11px] text-white
                ${color === "red"
                  ? "bg-[#C41E23]"
                  : color === "black"
                    ? "bg-[#1B1B1B] border border-white/15"
                    : "bg-[#006400]"
                }
                ${isNewest ? "ring-1 ring-[#D4AF37]/60" : ""}
              `}
            >
              {result.number}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
