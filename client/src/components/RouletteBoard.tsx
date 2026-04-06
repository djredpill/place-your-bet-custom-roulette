import { useState, useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { getNumberColor, getOutsideBetNumbers, BOARD_ROWS } from "@/lib/roulette-data";
import type { BetType } from "@/lib/roulette-data";
import { playChipPlace } from "@/lib/sounds";
import BetKeypad from "./BetKeypad";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Single CSS Grid for the entire board.
 * 14 columns: [zero] [12 number cols] [2:1 col]
 * 5 rows: [3 number rows] [dozens] [even-money]
 */

interface SelectedPosition {
  label: string;
  type: BetType;
  numbers: (number | string)[];
}

// Casino chip colors based on denomination
function getChipColor(amount: number): { bg: string; border: string; text: string; stripe: string } {
  if (amount >= 500) return { bg: "#6B21A8", border: "#A855F7", text: "#FFFFFF", stripe: "#9333EA" }; // Purple
  if (amount >= 100) return { bg: "#111111", border: "#555555", text: "#FFFFFF", stripe: "#333333" }; // Black
  if (amount >= 50) return { bg: "#1D4ED8", border: "#60A5FA", text: "#FFFFFF", stripe: "#3B82F6" }; // Blue
  if (amount >= 25) return { bg: "#15803D", border: "#4ADE80", text: "#FFFFFF", stripe: "#22C55E" }; // Green
  if (amount >= 10) return { bg: "#B45309", border: "#FBBF24", text: "#FFFFFF", stripe: "#F59E0B" }; // Orange
  if (amount >= 5) return { bg: "#B91C1C", border: "#F87171", text: "#FFFFFF", stripe: "#EF4444" }; // Red
  return { bg: "#EEEEEE", border: "#CCCCCC", text: "#333333", stripe: "#DDDDDD" }; // White ($1)
}

function CasinoChip({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  const colors = getChipColor(amount);
  const displayAmt = amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k` : String(amount);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div
        className="relative flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: "26px",
          height: "26px",
          background: `radial-gradient(circle at 35% 35%, ${colors.border}, ${colors.bg} 60%)`,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)`,
        }}
      >
        {/* Edge stripes */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `repeating-conic-gradient(from 0deg, transparent 0deg, transparent 20deg, ${colors.stripe}44 20deg, ${colors.stripe}44 25deg)`,
          }}
        />
        {/* Inner circle */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: "18px",
            height: "18px",
            background: colors.bg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <span
            className="font-numbers font-bold leading-none"
            style={{
              fontSize: displayAmt.length > 3 ? "6px" : displayAmt.length > 2 ? "7px" : "8px",
              color: colors.text,
              textShadow: "0 1px 1px rgba(0,0,0,0.5)",
            }}
          >
            {displayAmt}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RouletteBoard() {
  const { bets, addBet, removeBet, updateBetAmount, lastResult, tableType, soundEnabled } = useGame();
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);
  const [keypadOpen, setKeypadOpen] = useState(false);

  const betMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bet of bets) {
      const key = `${bet.type}-${[...bet.numbers].sort().join(",")}`;
      map[key] = (map[key] || 0) + bet.amount;
    }
    return map;
  }, [bets]);

  const getBetAmount = (type: BetType, numbers: (number | string)[]) => {
    const key = `${type}-${[...numbers].sort().join(",")}`;
    return betMap[key] || 0;
  };

  const handleCellClick = (label: string, type: BetType, numbers: (number | string)[]) => {
    setSelectedPosition({ label, type, numbers });
    setKeypadOpen(true);
  };

  const handleBetConfirm = (amount: number) => {
    if (!selectedPosition) return;
    const existing = bets.find(b =>
      b.type === selectedPosition.type &&
      JSON.stringify([...b.numbers].sort()) === JSON.stringify([...selectedPosition.numbers].sort())
    );
    if (amount === 0 && existing) {
      removeBet(existing.id);
    } else if (existing) {
      updateBetAmount(existing.id, amount);
      if (soundEnabled) playChipPlace();
    } else if (amount > 0) {
      addBet({
        type: selectedPosition.type,
        numbers: selectedPosition.numbers,
        amount,
        label: selectedPosition.label,
      });
      if (soundEnabled) playChipPlace();
    }
  };

  const isWinningNumber = (num: number | string) => {
    if (!lastResult) return false;
    return String(lastResult.number) === String(num);
  };

  const isAmerican = tableType === "american";

  // Build all cells as positioned grid items
  const cells: React.ReactNode[] = [];

  // --- ZERO SECTION (col 1) ---
  if (isAmerican) {
    cells.push(
      <button
        key="zero-0"
        onClick={() => handleCellClick("0", "straight", [0])}
        style={{ gridColumn: 1, gridRow: "1 / 2" }}
        className={`relative flex items-center justify-center bg-[#006400] border border-[#D4AF37]/30 font-numbers font-bold text-white text-xs sm:text-sm hover:brightness-125 active:scale-95 transition-all ${isWinningNumber(0) ? "animate-pulse ring-2 ring-white" : ""}`}
      >
        0
        <CasinoChip amount={getBetAmount("straight", [0])} />
      </button>
    );
    cells.push(
      <button
        key="zero-00"
        onClick={() => handleCellClick("00", "straight", ["00"])}
        style={{ gridColumn: 1, gridRow: "2 / 3" }}
        className={`relative flex items-center justify-center bg-[#006400] border border-[#D4AF37]/30 font-numbers font-bold text-white text-xs sm:text-sm hover:brightness-125 active:scale-95 transition-all ${isWinningNumber("00") ? "animate-pulse ring-2 ring-white" : ""}`}
      >
        00
        <CasinoChip amount={getBetAmount("straight", ["00"])} />
      </button>
    );
    cells.push(
      <div key="zero-empty" style={{ gridColumn: 1, gridRow: 3 }} className="bg-[#35654D] border border-[#D4AF37]/10" />
    );
  } else {
    cells.push(
      <button
        key="zero-0"
        onClick={() => handleCellClick("0", "straight", [0])}
        style={{ gridColumn: 1, gridRow: "1 / 4" }}
        className={`relative flex items-center justify-center bg-[#006400] border border-[#D4AF37]/30 font-numbers font-bold text-white text-sm hover:brightness-125 active:scale-95 transition-all ${isWinningNumber(0) ? "animate-pulse ring-2 ring-white" : ""}`}
      >
        0
        <CasinoChip amount={getBetAmount("straight", [0])} />
      </button>
    );
  }

  // --- NUMBER CELLS (cols 2-13, rows 1-3) ---
  BOARD_ROWS.forEach((row, rowIdx) => {
    row.forEach((num, colIdx) => {
      const color = getNumberColor(num);
      const betAmt = getBetAmount("straight", [num]);
      const isWinner = isWinningNumber(num);
      const bgColor = color === "red" ? "bg-[#C41E23]" : color === "black" ? "bg-[#1B1B1B]" : "bg-[#006400]";

      cells.push(
        <button
          key={`num-${num}`}
          onClick={() => handleCellClick(String(num), "straight", [num])}
          style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1 }}
          className={`relative flex items-center justify-center ${bgColor} border border-[#D4AF37]/30 font-numbers font-bold text-white text-xs sm:text-sm hover:brightness-125 active:scale-95 transition-all ${isWinner ? "animate-pulse ring-2 ring-white" : ""}`}
        >
          {num}
          <CasinoChip amount={betAmt} />
        </button>
      );
    });
  });

  // --- COLUMN 2:1 BETS (col 14, rows 1-3) ---
  const colVariants = [3, 2, 1];
  colVariants.forEach((variant, rowIdx) => {
    const nums = getOutsideBetNumbers("column", variant);
    const betAmt = getBetAmount("column", nums);
    cells.push(
      <button
        key={`col-${variant}`}
        onClick={() => handleCellClick("2:1", "column", nums)}
        style={{ gridColumn: 14, gridRow: rowIdx + 1 }}
        className="relative flex items-center justify-center bg-[#35654D]/80 border border-[#D4AF37]/30 font-body font-semibold text-[#FFFDD0] text-[10px] sm:text-xs hover:brightness-110 active:scale-95 transition-all"
      >
        2:1
        <CasinoChip amount={betAmt} />
      </button>
    );
  });

  // --- DOZEN BETS (row 4, cols 2-13 split into 3) ---
  const dozenData = [
    { label: "1st 12", variant: 1, colStart: 2, colEnd: 6 },
    { label: "2nd 12", variant: 2, colStart: 6, colEnd: 10 },
    { label: "3rd 12", variant: 3, colStart: 10, colEnd: 14 },
  ];
  dozenData.forEach(d => {
    const nums = getOutsideBetNumbers("dozen", d.variant);
    const betAmt = getBetAmount("dozen", nums);
    cells.push(
      <button
        key={`dozen-${d.variant}`}
        onClick={() => handleCellClick(d.label, "dozen", nums)}
        style={{ gridColumn: `${d.colStart} / ${d.colEnd}`, gridRow: 4 }}
        className="relative flex items-center justify-center bg-[#35654D]/80 border border-[#D4AF37]/30 font-body font-semibold text-[#FFFDD0] text-[10px] sm:text-xs hover:brightness-110 active:scale-95 transition-all"
      >
        {d.label}
        <CasinoChip amount={betAmt} />
      </button>
    );
  });

  // --- EVEN MONEY BETS (row 5, cols 2-13 split into 6) ---
  const evenMoneyData: { label: string; type: BetType; colStart: number; colEnd: number; bg?: string }[] = [
    { label: "1-18", type: "low", colStart: 2, colEnd: 4 },
    { label: "EVEN", type: "even", colStart: 4, colEnd: 6 },
    { label: "RED", type: "red", colStart: 6, colEnd: 8, bg: "bg-[#C41E23]" },
    { label: "BLK", type: "black", colStart: 8, colEnd: 10, bg: "bg-[#1B1B1B]" },
    { label: "ODD", type: "odd", colStart: 10, colEnd: 12 },
    { label: "19-36", type: "high", colStart: 12, colEnd: 14 },
  ];
  evenMoneyData.forEach(d => {
    const nums = getOutsideBetNumbers(d.type);
    const betAmt = getBetAmount(d.type, nums);
    cells.push(
      <button
        key={`em-${d.type}`}
        onClick={() => handleCellClick(d.label, d.type, nums)}
        style={{ gridColumn: `${d.colStart} / ${d.colEnd}`, gridRow: 5 }}
        className={`relative flex items-center justify-center ${d.bg || "bg-[#35654D]/80"} border border-[#D4AF37]/30 font-body font-semibold text-[#FFFDD0] text-[10px] sm:text-xs hover:brightness-110 active:scale-95 transition-all`}
      >
        {d.label}
        <CasinoChip amount={betAmt} />
      </button>
    );
  });

  return (
    <>
      <div className="w-full max-w-[680px] mx-auto select-none px-2">
        {/* Mahogany rail border */}
        <div className="bg-gradient-to-b from-[#4E2728] via-[#6B3A3B] to-[#4E2728] p-1.5 rounded-lg shadow-xl">
          {/* Felt surface */}
          <div className="bg-[#35654D] rounded overflow-hidden p-0.5">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "36px repeat(12, 1fr) 36px",
                gridTemplateRows: "34px 34px 34px 28px 28px",
                gap: "1px",
              }}
            >
              {cells}
            </div>
          </div>
        </div>
      </div>

      <BetKeypad
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onConfirm={handleBetConfirm}
        label={selectedPosition?.label || ""}
        currentAmount={
          selectedPosition
            ? getBetAmount(selectedPosition.type, selectedPosition.numbers)
            : 0
        }
        maxAmount={99999}
      />
    </>
  );
}
