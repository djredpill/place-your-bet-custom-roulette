import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, BarChart3, Trophy, TrendingDown, Zap, RotateCcw } from "lucide-react";
import { STRATEGIES, generateRandomNumber, getNumberColor, getOutsideBetNumbers, type Strategy, type BetType, type Bet } from "@/lib/roulette-data";
import { useGame } from "@/contexts/GameContext";

/*
 * StrategyComparison — run 2 strategies side-by-side with same conditions
 * Same random numbers for both, compare bankroll curves and stats
 * Accessible from Strategy Library
 */

interface StrategyComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimResult {
  bankrollHistory: number[];
  finalBankroll: number;
  profit: number;
  wins: number;
  losses: number;
  pushes: number;
  peakBankroll: number;
  lowestBankroll: number;
  bestWin: number;
  worstLoss: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

function simulateStrategy(
  strategy: Strategy,
  spinResults: (number | string)[],
  startingBankroll: number
): SimResult {
  let bankroll = startingBankroll;
  const bankrollHistory = [bankroll];
  let wins = 0, losses = 0, pushes = 0;
  let peakBankroll = bankroll, lowestBankroll = bankroll;
  let bestWin = 0, worstLoss = 0;
  let maxWinStreak = 0, maxLossStreak = 0;
  let curWinStreak = 0, curLossStreak = 0;

  for (const spinNum of spinResults) {
    if (bankroll <= 0) {
      bankrollHistory.push(0);
      continue;
    }

    // Calculate total bet
    const totalBet = strategy.bets.reduce((s, b) => s + b.amount, 0);
    if (totalBet > bankroll) {
      bankrollHistory.push(bankroll);
      continue;
    }

    bankroll -= totalBet;

    // Check each bet for wins
    let totalWin = 0;
    for (const bet of strategy.bets) {
      const numMatch = bet.numbers.some(n => String(n) === String(spinNum));
      if (numMatch) {
        const payout = getPayout(bet.type, bet.numbers.length);
        totalWin += bet.amount * (payout + 1);
      }
    }

    bankroll += totalWin;
    const netResult = totalWin - totalBet;

    if (netResult > 0) {
      wins++;
      curWinStreak++;
      curLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, curWinStreak);
      bestWin = Math.max(bestWin, netResult);
    } else if (netResult < 0) {
      losses++;
      curLossStreak++;
      curWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, curLossStreak);
      worstLoss = Math.min(worstLoss, netResult);
    } else {
      pushes++;
      curWinStreak = 0;
      curLossStreak = 0;
    }

    peakBankroll = Math.max(peakBankroll, bankroll);
    lowestBankroll = Math.min(lowestBankroll, bankroll);
    bankrollHistory.push(bankroll);
  }

  return {
    bankrollHistory,
    finalBankroll: bankroll,
    profit: bankroll - startingBankroll,
    wins,
    losses,
    pushes,
    peakBankroll,
    lowestBankroll,
    bestWin,
    worstLoss,
    maxWinStreak,
    maxLossStreak,
  };
}

function getPayout(type: BetType, numCount: number): number {
  switch (type) {
    case "straight": return 35;
    case "split": return 17;
    case "street": return 11;
    case "corner": return 8;
    case "five": return 6;
    case "sixline": return 5;
    case "dozen": case "column": return 2;
    case "red": case "black": case "odd": case "even": case "low": case "high": return 1;
    default: return 0;
  }
}

export default function StrategyComparison({ isOpen, onClose }: StrategyComparisonProps) {
  const { tableType } = useGame();
  const [strategyA, setStrategyA] = useState<Strategy | null>(null);
  const [strategyB, setStrategyB] = useState<Strategy | null>(null);
  const [spinCount, setSpinCount] = useState(100);
  const [startingBankroll, setStartingBankroll] = useState(1000);
  const [results, setResults] = useState<{ a: SimResult; b: SimResult } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRefA = useRef<HTMLCanvasElement>(null);
  const canvasRefB = useRef<HTMLCanvasElement>(null);

  const runComparison = useCallback(() => {
    if (!strategyA || !strategyB) return;
    setIsRunning(true);

    // Generate same random numbers for both
    const spinResults: (number | string)[] = [];
    for (let i = 0; i < spinCount; i++) {
      spinResults.push(generateRandomNumber(tableType));
    }

    // Simulate both
    const resultA = simulateStrategy(strategyA, spinResults, startingBankroll);
    const resultB = simulateStrategy(strategyB, spinResults, startingBankroll);

    setResults({ a: resultA, b: resultB });
    setIsRunning(false);
  }, [strategyA, strategyB, spinCount, startingBankroll, tableType]);

  // Draw bankroll charts
  useEffect(() => {
    if (!results) return;

    const drawChart = (canvas: HTMLCanvasElement | null, data: number[], color: string) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);

      const allData = [...results.a.bankrollHistory, ...results.b.bankrollHistory];
      const maxVal = Math.max(...allData) * 1.1;
      const minVal = Math.min(0, Math.min(...allData) * 1.1);
      const range = maxVal - minVal;

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = h * (i / 4);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Starting line
      const startY = h - ((startingBankroll - minVal) / range) * h;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.lineTo(w, startY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Data line
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((val - minVal) / range) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill under
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color.replace("1)", "0.15)"));
      grad.addColorStop(1, color.replace("1)", "0)"));
      ctx.fillStyle = grad;
      ctx.fill();
    };

    drawChart(canvasRefA.current, results.a.bankrollHistory, "rgba(212,175,55,1)");
    drawChart(canvasRefB.current, results.b.bankrollHistory, "rgba(100,200,150,1)");
  }, [results, startingBankroll]);

  const formatMoney = (n: number) => n >= 0 ? `+$${n.toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`;

  const winner = useMemo(() => {
    if (!results) return null;
    if (results.a.profit > results.b.profit) return "a";
    if (results.b.profit > results.a.profit) return "b";
    return "tie";
  }, [results]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-2 z-50 bg-[#0d0d1a] border-2 border-[#D4AF37]/30 rounded-xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/20 bg-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#D4AF37]" />
            <h2 className="text-[#D4AF37] font-display text-sm tracking-wider">STRATEGY COMPARISON</h2>
          </div>
          <button onClick={onClose} className="text-[#C0C0C0]/40 hover:text-[#C0C0C0]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Strategy selectors */}
          <div className="grid grid-cols-2 gap-3">
            {/* Strategy A */}
            <div className="space-y-2">
              <label className="text-[#D4AF37] font-display text-[10px] tracking-wider uppercase flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                Strategy A
              </label>
              <select
                value={strategyA?.id || ""}
                onChange={e => setStrategyA(STRATEGIES.find(s => s.id === e.target.value) || null)}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white font-body text-xs focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="">Select...</option>
                {STRATEGIES.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === strategyB?.id}>
                    {s.name} ({s.rating})
                  </option>
                ))}
              </select>
            </div>

            {/* Strategy B */}
            <div className="space-y-2">
              <label className="text-green-400 font-display text-[10px] tracking-wider uppercase flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Strategy B
              </label>
              <select
                value={strategyB?.id || ""}
                onChange={e => setStrategyB(STRATEGIES.find(s => s.id === e.target.value) || null)}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white font-body text-xs focus:outline-none focus:border-green-400/50"
              >
                <option value="">Select...</option>
                {STRATEGIES.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === strategyA?.id}>
                    {s.name} ({s.rating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Settings */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[#C0C0C0]/50 font-body text-[10px]">Spins</label>
              <div className="flex gap-1.5 mt-1">
                {[50, 100, 200, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => setSpinCount(n)}
                    className={`flex-1 py-1.5 rounded text-xs font-numbers font-bold transition-colors ${
                      spinCount === n
                        ? "bg-[#D4AF37] text-[#1a1a2e]"
                        : "bg-white/5 text-[#C0C0C0]/60 hover:bg-white/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[#C0C0C0]/50 font-body text-[10px]">Starting Bankroll</label>
              <div className="flex gap-1.5 mt-1">
                {[500, 1000, 2500, 5000].map(n => (
                  <button
                    key={n}
                    onClick={() => setStartingBankroll(n)}
                    className={`flex-1 py-1.5 rounded text-xs font-numbers font-bold transition-colors ${
                      startingBankroll === n
                        ? "bg-[#D4AF37] text-[#1a1a2e]"
                        : "bg-white/5 text-[#C0C0C0]/60 hover:bg-white/10"
                    }`}
                  >
                    ${n >= 1000 ? `${n / 1000}k` : n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runComparison}
            disabled={!strategyA || !strategyB || isRunning}
            className={`w-full py-3 rounded-lg font-display text-sm tracking-wider transition-all ${
              !strategyA || !strategyB || isRunning
                ? "bg-[#2a2a3e] text-[#C0C0C0]/40 cursor-not-allowed"
                : "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] active:scale-[0.98]"
            }`}
          >
            {isRunning ? "RUNNING..." : results ? "RUN AGAIN" : "RUN COMPARISON"}
          </button>

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Winner banner */}
              {winner && winner !== "tie" && (
                <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent">
                  <Trophy size={16} className="text-[#D4AF37]" />
                  <span className="text-[#D4AF37] font-display text-xs tracking-wider">
                    {winner === "a" ? strategyA?.name : strategyB?.name} WINS
                  </span>
                  <Trophy size={16} className="text-[#D4AF37]" />
                </div>
              )}
              {winner === "tie" && (
                <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                  <span className="text-[#C0C0C0] font-display text-xs tracking-wider">TIE</span>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#D4AF37] font-body text-[10px] font-semibold truncate">
                      {strategyA?.name}
                    </span>
                    <span className={`font-numbers text-xs font-bold ${results.a.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatMoney(results.a.profit)}
                    </span>
                  </div>
                  <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-1 h-24">
                    <canvas ref={canvasRefA} className="w-full h-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-400 font-body text-[10px] font-semibold truncate">
                      {strategyB?.name}
                    </span>
                    <span className={`font-numbers text-xs font-bold ${results.b.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatMoney(results.b.profit)}
                    </span>
                  </div>
                  <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-1 h-24">
                    <canvas ref={canvasRefB} className="w-full h-full" />
                  </div>
                </div>
              </div>

              {/* Stats comparison table */}
              <div className="bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-[10px] font-body">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-[#C0C0C0]/50 px-3 py-2 font-normal">Metric</th>
                      <th className="text-right text-[#D4AF37] px-3 py-2 font-semibold">A</th>
                      <th className="text-right text-green-400 px-3 py-2 font-semibold">B</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#C0C0C0]">
                    {[
                      ["Final Bankroll", `$${results.a.finalBankroll.toLocaleString()}`, `$${results.b.finalBankroll.toLocaleString()}`],
                      ["Net Profit", formatMoney(results.a.profit), formatMoney(results.b.profit)],
                      ["Win Rate", `${((results.a.wins / spinCount) * 100).toFixed(1)}%`, `${((results.b.wins / spinCount) * 100).toFixed(1)}%`],
                      ["Wins / Losses", `${results.a.wins} / ${results.a.losses}`, `${results.b.wins} / ${results.b.losses}`],
                      ["Peak Bankroll", `$${results.a.peakBankroll.toLocaleString()}`, `$${results.b.peakBankroll.toLocaleString()}`],
                      ["Lowest Bankroll", `$${results.a.lowestBankroll.toLocaleString()}`, `$${results.b.lowestBankroll.toLocaleString()}`],
                      ["Best Win", `+$${results.a.bestWin}`, `+$${results.b.bestWin}`],
                      ["Worst Loss", `-$${Math.abs(results.a.worstLoss)}`, `-$${Math.abs(results.b.worstLoss)}`],
                      ["Win Streak", String(results.a.maxWinStreak), String(results.b.maxWinStreak)],
                      ["Loss Streak", String(results.a.maxLossStreak), String(results.b.maxLossStreak)],
                    ].map(([label, valA, valB], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                        <td className="px-3 py-1.5 text-[#C0C0C0]/60">{label}</td>
                        <td className="px-3 py-1.5 text-right font-numbers">{valA}</td>
                        <td className="px-3 py-1.5 text-right font-numbers">{valB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Run again */}
              <div className="flex gap-2">
                <button
                  onClick={runComparison}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-body text-xs rounded-lg border border-white/10 transition-colors"
                >
                  <RotateCcw size={14} />
                  Run Again (New Numbers)
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
