import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BetKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  label: string;
  currentAmount?: number;
  maxAmount?: number;
}

export default function BetKeypad({
  isOpen,
  onClose,
  onConfirm,
  label,
  currentAmount = 0,
  maxAmount = 99999,
}: BetKeypadProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(currentAmount > 0 ? String(currentAmount) : "");
    }
  }, [isOpen, currentAmount]);

  const handleKey = (key: string) => {
    if (key === "backspace") {
      setValue(prev => prev.slice(0, -1));
    } else if (key === "clear") {
      setValue("");
    } else {
      const newVal = value + key;
      const num = parseInt(newVal);
      if (num <= maxAmount) {
        setValue(newVal);
      }
    }
  };

  const handleConfirm = () => {
    const amount = parseInt(value) || 0;
    if (amount > 0) {
      onConfirm(amount);
    }
    onClose();
  };

  const handleRemove = () => {
    onConfirm(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          {/* Keypad */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px]"
          >
            <div className="bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-[#D4AF37]/10 px-4 py-3 border-b border-[#D4AF37]/30">
                <p className="text-[#D4AF37] font-display text-lg tracking-wider text-center">
                  {label}
                </p>
              </div>

              {/* Display */}
              <div className="px-4 py-3">
                <div className="bg-black/40 rounded border border-[#D4AF37]/20 px-4 py-3 text-right">
                  <span className="text-3xl font-numbers font-bold text-cream tracking-wider" style={{ color: '#FFFDD0' }}>
                    ${value || "0"}
                  </span>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="px-4 pb-2 grid grid-cols-4 gap-1.5">
                {[5, 10, 25, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setValue(String(amt))}
                    className="bg-[#35654D] hover:bg-[#35654D]/80 text-white text-sm font-numbers font-bold py-1.5 rounded transition-colors"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Number pad */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKey(String(num))}
                    className="bg-[#2a2a3e] hover:bg-[#3a3a4e] active:bg-[#4a4a5e] text-white text-xl font-numbers font-bold py-3 rounded transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleKey("clear")}
                  className="bg-[#8B0000]/60 hover:bg-[#8B0000]/80 text-white text-sm font-body font-semibold py-3 rounded transition-colors"
                >
                  CLR
                </button>
                <button
                  onClick={() => handleKey("0")}
                  className="bg-[#2a2a3e] hover:bg-[#3a3a4e] active:bg-[#4a4a5e] text-white text-xl font-numbers font-bold py-3 rounded transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => handleKey("backspace")}
                  className="bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white text-lg font-body py-3 rounded transition-colors"
                >
                  ←
                </button>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {currentAmount > 0 && (
                  <button
                    onClick={handleRemove}
                    className="col-span-2 bg-[#8B0000] hover:bg-[#8B0000]/80 text-white font-body font-semibold py-2.5 rounded transition-colors text-sm"
                  >
                    Remove Bet
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-body font-semibold py-2.5 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-[#1a1a2e] font-body font-bold py-2.5 rounded transition-colors"
                >
                  Place Bet
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
