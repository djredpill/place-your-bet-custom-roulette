import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, ArrowRight, Check, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { useGame } from "@/contexts/GameContext";

/*
 * PlayModeGuide — step-by-step strategy coaching overlay
 * When a strategy is loaded in manual play, shows:
 *   - Current step in the progression
 *   - What to bet next based on win/loss history
 *   - Visual progression tracker
 *   - Collapsible so it doesn't block the board
 */

export default function PlayModeGuide() {
  const { activeStrategy, history, bets } = useGame();
  const [isExpanded, setIsExpanded] = useState(true);
  const [progressionStep, setProgressionStep] = useState(0);

  // Track wins/losses since strategy was loaded
  const strategyHistory = useMemo(() => {
    if (!activeStrategy) return [];
    // Get history entries that happened while this strategy was active
    return history.slice().reverse();
  }, [history, activeStrategy]);

  // Calculate current state based on history
  const guideState = useMemo(() => {
    if (!activeStrategy) return null;

    const totalSpins = strategyHistory.length;
    const wins = strategyHistory.filter(h => h.netResult > 0).length;
    const losses = strategyHistory.filter(h => h.netResult < 0).length;
    const lastResult = strategyHistory.length > 0 ? strategyHistory[strategyHistory.length - 1] : null;
    const lastWon = lastResult ? lastResult.netResult > 0 : null;
    const currentStreak = (() => {
      let streak = 0;
      let streakType: "win" | "loss" | null = null;
      for (let i = strategyHistory.length - 1; i >= 0; i--) {
        const r = strategyHistory[i];
        if (r.netResult > 0) {
          if (streakType === "loss") break;
          streakType = "win";
          streak++;
        } else if (r.netResult < 0) {
          if (streakType === "win") break;
          streakType = "loss";
          streak++;
        } else break;
      }
      return { count: streak, type: streakType };
    })();

    // Determine progression step based on strategy type
    let step = 0;
    let instruction = "";
    let nextAction = "";
    let betSuggestion = "";
    const unitSize = activeStrategy.unitSize;
    const stratId = activeStrategy.id;

    if (stratId === "barney") {
      // Barney's: increase losing dozen by $5 after loss, decrease winning dozen after win
      if (totalSpins === 0) {
        instruction = "Place your initial bets: $5 on 1st 12 and $5 on 2nd 12";
        nextAction = "Place bets and SPIN";
        betSuggestion = `$${unitSize} on each of 2 dozens`;
        step = 0;
      } else if (lastWon) {
        instruction = "You won! Decrease the winning dozen by $5 (minimum $5). Keep the other dozen the same.";
        nextAction = "Adjust bets down and SPIN";
        betSuggestion = "Reduce winning bet, keep losing bet";
        step = 1;
      } else {
        instruction = "Loss. Increase the losing dozen by $5. Keep the winning dozen the same.";
        nextAction = "Increase losing bet by $5 and SPIN";
        betSuggestion = `Add $${unitSize} to the losing dozen`;
        step = 2;
      }
    } else if (stratId === "mod-fib") {
      // Fibonacci: sequence 1,1,2,3,5,8,13,21,34,55
      const fibSeq = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      let fibIndex = 0;
      for (const h of strategyHistory) {
        if (h.netResult < 0) {
          fibIndex = Math.min(fibIndex + 1, fibSeq.length - 1);
        } else if (h.netResult > 0) {
          fibIndex = Math.max(0, fibIndex - 2);
        }
      }
      const currentMultiplier = fibSeq[fibIndex];
      const currentBet = currentMultiplier * unitSize;
      instruction = totalSpins === 0
        ? `Start with $${unitSize} on RED (or any even-money bet)`
        : lastWon
          ? `Win! Move back 2 steps in Fibonacci. Now bet $${currentBet} (${currentMultiplier}x unit)`
          : `Loss. Move forward 1 step. Now bet $${currentBet} (${currentMultiplier}x unit)`;
      nextAction = `Place $${currentBet} on your even-money bet`;
      betSuggestion = `$${currentBet} on RED/BLACK/ODD/EVEN`;
      step = fibIndex;
    } else if (stratId === "martingale-lite") {
      // Martingale: double after loss, reset after win, cap at 4 doubles
      let doublings = 0;
      for (const h of strategyHistory) {
        if (h.netResult < 0) {
          doublings = Math.min(doublings + 1, 4);
        } else if (h.netResult > 0) {
          doublings = 0;
        }
      }
      const currentBet = unitSize * Math.pow(2, doublings);
      instruction = totalSpins === 0
        ? `Start with $${unitSize} on any even-money bet`
        : lastWon
          ? `Win! Reset to base bet of $${unitSize}`
          : doublings >= 4
            ? `4 losses in a row — STOP. Take a break or reset. Max exposure reached.`
            : `Loss #${doublings}. Double your bet to $${currentBet}`;
      nextAction = doublings >= 4 ? "Consider resetting" : `Place $${currentBet}`;
      betSuggestion = `$${currentBet}`;
      step = doublings;
    } else if (stratId === "candles") {
      // Candles: straight-up bets on 4-21, blow out candles on recovery wins
      if (totalSpins === 0) {
        instruction = "Place $5 on each number from 4 through 21 (18 straight-up bets)";
        nextAction = "Load strategy bets and SPIN";
        betSuggestion = "$5 x 18 numbers = $90 total";
      } else if (lastWon) {
        instruction = "Win! If you're in recovery (not yet in profit), blow out a candle — remove the highest active number bet.";
        nextAction = "Remove highest number or keep playing";
        betSuggestion = "Remove top number, re-spin";
      } else {
        instruction = "Loss. Increase bets according to recovery chart. Stay disciplined.";
        nextAction = "Increase bets per recovery rules";
        betSuggestion = "Follow recovery progression";
      }
      step = losses > 0 ? Math.min(losses, 5) : 0;
    } else {
      // Generic guide for other strategies
      if (totalSpins === 0) {
        instruction = `Load "${activeStrategy.name}" bets and start spinning. Base unit: $${unitSize}`;
        nextAction = "Place your bets and SPIN";
        betSuggestion = activeStrategy.bets.map(b => `$${b.amount} on ${b.label}`).join(", ");
      } else if (lastWon) {
        instruction = activeStrategy.progression.includes("decrease") || activeStrategy.progression.includes("reduce")
          ? "Win! Follow the strategy's win rule — typically reduce or reset your bet."
          : "Win! Maintain your current bet level or follow the strategy progression.";
        nextAction = "Adjust bets per strategy rules";
        betSuggestion = `Follow: ${activeStrategy.progression.slice(0, 80)}...`;
      } else {
        instruction = activeStrategy.progression.includes("increase") || activeStrategy.progression.includes("double")
          ? "Loss. Follow the strategy's loss rule — typically increase your bet."
          : "Loss. Maintain discipline and follow the progression rules.";
        nextAction = "Adjust bets per strategy rules";
        betSuggestion = `Follow: ${activeStrategy.progression.slice(0, 80)}...`;
      }
      step = totalSpins;
    }

    return {
      totalSpins,
      wins,
      losses,
      lastWon,
      currentStreak,
      step,
      instruction,
      nextAction,
      betSuggestion,
    };
  }, [activeStrategy, strategyHistory]);

  // Reset when strategy changes
  useEffect(() => {
    setProgressionStep(0);
    setIsExpanded(true);
  }, [activeStrategy?.id]);

  if (!activeStrategy || !guideState) return null;

  return (
    <div className="mx-2 mb-2">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        className="bg-gradient-to-b from-[#35654D]/20 to-[#35654D]/5 border border-[#35654D]/30 rounded-lg overflow-hidden"
      >
        {/* Header — always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#35654D]" />
            <span className="text-[#35654D] font-display text-[10px] tracking-wider uppercase">
              Strategy Guide
            </span>
            {guideState.totalSpins > 0 && (
              <span className="text-[#C0C0C0]/40 font-numbers text-[10px]">
                Spin #{guideState.totalSpins}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {guideState.totalSpins > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-green-400 font-numbers text-[10px]">
                  W:{guideState.wins}
                </span>
                <span className="text-red-400 font-numbers text-[10px]">
                  L:{guideState.losses}
                </span>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp size={14} className="text-[#C0C0C0]/40" />
            ) : (
              <ChevronDown size={14} className="text-[#C0C0C0]/40" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                {/* Current streak indicator */}
                {guideState.currentStreak.count >= 2 && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-body ${
                    guideState.currentStreak.type === "win"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {guideState.currentStreak.type === "win" ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {guideState.currentStreak.count}x {guideState.currentStreak.type} streak
                  </div>
                )}

                {/* Main instruction */}
                <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ArrowRight size={14} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-body text-xs leading-relaxed">
                        {guideState.instruction}
                      </p>
                      {guideState.betSuggestion && (
                        <p className="text-[#D4AF37] font-body text-[11px] mt-1.5 font-semibold">
                          {guideState.betSuggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Next action badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
                    <Check size={10} className="text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-body text-[10px] font-semibold">
                      {guideState.nextAction}
                    </span>
                  </div>
                </div>

                {/* How it works reminder (collapsed) */}
                <details className="group">
                  <summary className="text-[#C0C0C0]/30 font-body text-[9px] cursor-pointer hover:text-[#C0C0C0]/50 transition-colors list-none flex items-center gap-1">
                    <ChevronDown size={10} className="group-open:rotate-180 transition-transform" />
                    How this strategy works
                  </summary>
                  <p className="text-[#C0C0C0]/40 font-body text-[10px] mt-1 leading-relaxed pl-3.5">
                    {activeStrategy.howItWorks}
                  </p>
                  <p className="text-[#C0C0C0]/30 font-body text-[9px] mt-1 leading-relaxed pl-3.5 italic">
                    Progression: {activeStrategy.progression}
                  </p>
                </details>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
