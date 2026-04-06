// ============================================================
// Place Your Bet – Custom Roulette
// Core data: numbers, colors, payouts, wheel orders
// Supports American (0 + 00) and European (single 0)
// ============================================================

export type TableType = "american" | "european";

// American roulette wheel order (clockwise)
export const AMERICAN_WHEEL_ORDER: (number | string)[] = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
  "00", 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2,
];

// European roulette wheel order (clockwise)
export const EUROPEAN_WHEEL_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function getWheelOrder(table: TableType): (number | string)[] {
  return table === "american" ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
}

// Red numbers on the board
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function getNumberColor(num: number | string): "red" | "black" | "green" {
  if (num === 0 || num === "00" || num === "0") return "green";
  const n = typeof num === "string" ? parseInt(num) : num;
  if (RED_NUMBERS.includes(n)) return "red";
  if (BLACK_NUMBERS.includes(n)) return "black";
  return "green";
}

// Board layout: 3 rows x 12 columns
export const BOARD_ROWS: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

// Bet types
export type BetType =
  | "straight" | "split" | "street" | "corner" | "five"
  | "sixline" | "dozen" | "column"
  | "red" | "black" | "odd" | "even" | "low" | "high";

export interface PayoutInfo {
  type: BetType;
  label: string;
  coverage: number;
  payout: number;
  description: string;
}

export const PAYOUT_TABLE: PayoutInfo[] = [
  { type: "straight", label: "Straight Up", coverage: 1, payout: 35, description: "Any single number" },
  { type: "split", label: "Split", coverage: 2, payout: 17, description: "Two adjacent numbers" },
  { type: "street", label: "Street", coverage: 3, payout: 11, description: "Three numbers in a row" },
  { type: "corner", label: "Corner", coverage: 4, payout: 8, description: "Four numbers in a square" },
  { type: "five", label: "Top Line", coverage: 5, payout: 6, description: "0, 00, 1, 2, 3 (American only)" },
  { type: "sixline", label: "Six Line", coverage: 6, payout: 5, description: "Two adjacent rows" },
  { type: "dozen", label: "Dozen", coverage: 12, payout: 2, description: "1-12, 13-24, or 25-36" },
  { type: "column", label: "Column", coverage: 12, payout: 2, description: "Vertical column of 12" },
  { type: "red", label: "Red", coverage: 18, payout: 1, description: "All red numbers" },
  { type: "black", label: "Black", coverage: 18, payout: 1, description: "All black numbers" },
  { type: "odd", label: "Odd", coverage: 18, payout: 1, description: "All odd numbers" },
  { type: "even", label: "Even", coverage: 18, payout: 1, description: "All even numbers" },
  { type: "low", label: "1-18", coverage: 18, payout: 1, description: "Numbers 1 through 18" },
  { type: "high", label: "19-36", coverage: 18, payout: 1, description: "Numbers 19 through 36" },
];

export interface Bet {
  id: string;
  type: BetType;
  numbers: (number | string)[];
  amount: number;
  label: string;
}

export interface SpinResult {
  number: number | string;
  color: "red" | "black" | "green";
  timestamp: number;
  bets: Bet[];
  totalBet: number;
  totalWin: number;
  netResult: number;
}

export function calculateWin(bet: Bet, resultNumber: number | string): number {
  const resultStr = String(resultNumber);
  const betNumberStrs = bet.numbers.map(String);
  if (betNumberStrs.includes(resultStr)) {
    const payoutInfo = PAYOUT_TABLE.find(p => p.type === bet.type);
    if (payoutInfo) return bet.amount * payoutInfo.payout + bet.amount;
  }
  return 0;
}

export function getOutsideBetNumbers(type: BetType, variant?: number): (number | string)[] {
  switch (type) {
    case "red": return [...RED_NUMBERS];
    case "black": return [...BLACK_NUMBERS];
    case "odd": return Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 1);
    case "even": return Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0);
    case "low": return Array.from({ length: 18 }, (_, i) => i + 1);
    case "high": return Array.from({ length: 18 }, (_, i) => i + 19);
    case "dozen":
      if (variant === 1) return Array.from({ length: 12 }, (_, i) => i + 1);
      if (variant === 2) return Array.from({ length: 12 }, (_, i) => i + 13);
      if (variant === 3) return Array.from({ length: 12 }, (_, i) => i + 25);
      return [];
    case "column":
      if (variant === 1) return [...BOARD_ROWS[2]];
      if (variant === 2) return [...BOARD_ROWS[1]];
      if (variant === 3) return [...BOARD_ROWS[0]];
      return [];
    case "five": return [0, "00", 1, 2, 3];
    default: return [];
  }
}

export function generateRandomNumber(table: TableType = "american"): number | string {
  if (table === "european") {
    return Math.floor(Math.random() * 37); // 0-36
  }
  const allNumbers: (number | string)[] = [0, "00", ...Array.from({ length: 36 }, (_, i) => i + 1)];
  return allNumbers[Math.floor(Math.random() * allNumbers.length)];
}

// ============================================================
// Strategy data — 10 pre-loaded strategies rated 75+
// ============================================================
export interface RatingBreakdown {
  coverage: number;     // 0-20
  riskReward: number;   // 0-20
  bankrollEff: number;  // 0-20
  recovery: number;     // 0-20
  discipline: number;   // 0-20
}

export interface Strategy {
  id: string;
  name: string;
  rating: number;
  riskLevel: "Conservative" | "Moderate" | "Aggressive";
  bankrollRequired: number;
  unitSize: number;
  demoProfit: number;
  demoDuration: string;
  youtubeUrl: string;
  ratings: RatingBreakdown;
  howItWorks: string;
  progression: string;
  bets: Bet[];
}

export const STRATEGIES: Strategy[] = [
  {
    id: "candles",
    name: "Blowing Out the Candles on the Upside Down Cake",
    rating: 88,
    riskLevel: "Aggressive",
    bankrollRequired: 2500,
    unitSize: 5,
    demoProfit: 1950,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/Pip7D7_BPJU",
    ratings: { coverage: 15, riskReward: 16, bankrollEff: 14, recovery: 20, discipline: 18 },
    howItWorks: "Place straight-up bets on numbers 4 through 21 (18 numbers total). Each number gets a $5 bet. When you win during recovery but aren't in profit yet, you 'blow out a candle' by removing the highest number bet — up to 5 candles can be blown out.",
    progression: "After a loss, increase bets according to the recovery chart. After a win during recovery, remove the highest active number (blow out a candle). After reaching profit, reset all bets to base.",
    bets: Array.from({ length: 18 }, (_, i) => ({
      id: `candles-${i}`,
      type: "straight" as BetType,
      numbers: [i + 4],
      amount: 5,
      label: String(i + 4),
    })),
  },
  {
    id: "barney",
    name: "Barney's System",
    rating: 85,
    riskLevel: "Conservative",
    bankrollRequired: 500,
    unitSize: 5,
    demoProfit: 305,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/dtLGwBfF8tA?t=600",
    ratings: { coverage: 16, riskReward: 18, bankrollEff: 17, recovery: 16, discipline: 18 },
    howItWorks: "Bet on 2 dozens simultaneously. Start with $5 on each dozen. After a loss, increase the losing dozen by one unit. After a win, decrease by one unit (minimum $5).",
    progression: "Increase losing dozen by $5 after loss. Decrease winning dozen by $5 after win. Never go below $5 base bet.",
    bets: [
      { id: "barney-1", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 1), amount: 5, label: "1st 12" },
      { id: "barney-2", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 13), amount: 5, label: "2nd 12" },
    ],
  },
  {
    id: "mod-fib",
    name: "Modified Fibonacci Even Money",
    rating: 84,
    riskLevel: "Moderate",
    bankrollRequired: 800,
    unitSize: 5,
    demoProfit: 330,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/y2BKQvrXZPo",
    ratings: { coverage: 18, riskReward: 16, bankrollEff: 16, recovery: 17, discipline: 17 },
    howItWorks: "Bet on any even-money position (Red/Black, Odd/Even, High/Low). Follow the Fibonacci sequence (1,1,2,3,5,8,13...) but move back TWO steps after a win instead of one.",
    progression: "After a loss, move to next Fibonacci number. After a win, move back TWO steps. If you reach the beginning, start over.",
    bets: [
      { id: "fib-1", type: "red", numbers: [...RED_NUMBERS], amount: 5, label: "RED" },
    ],
  },
  {
    id: "royal-profit",
    name: "Royal Profit System",
    rating: 82,
    riskLevel: "Moderate",
    bankrollRequired: 600,
    unitSize: 5,
    demoProfit: 475,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/kcWnYu5Gayo",
    ratings: { coverage: 14, riskReward: 17, bankrollEff: 16, recovery: 17, discipline: 18 },
    howItWorks: "Place corner bets covering a group of numbers. As you win, reduce the number of active corners to lock in profit. Start with 6 corners, reduce to 4, then 2 as profit grows.",
    progression: "Start with 6 corner bets at $5 each. After accumulating $30+ profit, reduce to 4 corners. After $60+ profit, reduce to 2 corners. Reset if bankroll drops below starting amount.",
    bets: [
      { id: "royal-1", type: "corner", numbers: [1, 2, 4, 5], amount: 5, label: "1-2-4-5" },
      { id: "royal-2", type: "corner", numbers: [8, 9, 11, 12], amount: 5, label: "8-9-11-12" },
      { id: "royal-3", type: "corner", numbers: [13, 14, 16, 17], amount: 5, label: "13-14-16-17" },
      { id: "royal-4", type: "corner", numbers: [20, 21, 23, 24], amount: 5, label: "20-21-23-24" },
      { id: "royal-5", type: "corner", numbers: [25, 26, 28, 29], amount: 5, label: "25-26-28-29" },
      { id: "royal-6", type: "corner", numbers: [32, 33, 35, 36], amount: 5, label: "32-33-35-36" },
    ],
  },
  {
    id: "john-b",
    name: "John B's New Roulette System",
    rating: 80,
    riskLevel: "Moderate",
    bankrollRequired: 700,
    unitSize: 5,
    demoProfit: 390,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/b8eL7gvqQno?t=500",
    ratings: { coverage: 17, riskReward: 15, bankrollEff: 15, recovery: 16, discipline: 17 },
    howItWorks: "Combine a dozen bet with straight-up bets on key numbers from the uncovered sections. Provides broad coverage while maintaining high payout potential on the straight-ups.",
    progression: "Flat bet the dozen. Increase straight-up bets by one unit after 3 consecutive losses. Reset after any straight-up win.",
    bets: [
      { id: "jb-1", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 1), amount: 10, label: "1st 12" },
      { id: "jb-2", type: "straight", numbers: [17], amount: 5, label: "17" },
      { id: "jb-3", type: "straight", numbers: [20], amount: 5, label: "20" },
      { id: "jb-4", type: "straight", numbers: [26], amount: 5, label: "26" },
      { id: "jb-5", type: "straight", numbers: [32], amount: 5, label: "32" },
    ],
  },
  {
    id: "5-double-street",
    name: "5 Double Street with Recovery",
    rating: 79,
    riskLevel: "Moderate",
    bankrollRequired: 900,
    unitSize: 5,
    demoProfit: 520,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/OIgqq8Xmwxk",
    ratings: { coverage: 16, riskReward: 15, bankrollEff: 14, recovery: 17, discipline: 17 },
    howItWorks: "Bet on 5 double streets (six-line bets), covering 30 of 38 numbers. Each six-line pays 5:1. Only 8 numbers can beat you (including 0 and 00).",
    progression: "Start at $5 per six-line ($25 total). After a loss, increase each by $5. After a win, decrease each by $5 (minimum $5). The high coverage means wins are frequent.",
    bets: [
      { id: "ds-1", type: "sixline", numbers: [1, 2, 3, 4, 5, 6], amount: 5, label: "1-6" },
      { id: "ds-2", type: "sixline", numbers: [7, 8, 9, 10, 11, 12], amount: 5, label: "7-12" },
      { id: "ds-3", type: "sixline", numbers: [13, 14, 15, 16, 17, 18], amount: 5, label: "13-18" },
      { id: "ds-4", type: "sixline", numbers: [19, 20, 21, 22, 23, 24], amount: 5, label: "19-24" },
      { id: "ds-5", type: "sixline", numbers: [31, 32, 33, 34, 35, 36], amount: 5, label: "31-36" },
    ],
  },
  {
    id: "two-up",
    name: "Two Up System",
    rating: 78,
    riskLevel: "Conservative",
    bankrollRequired: 400,
    unitSize: 5,
    demoProfit: 280,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/dtLGwBfF8tA",
    ratings: { coverage: 18, riskReward: 16, bankrollEff: 16, recovery: 14, discipline: 14 },
    howItWorks: "Bet on an even-money position. After two consecutive wins, increase your bet by one unit. After any loss, return to base bet. The idea is to ride winning streaks while limiting losses.",
    progression: "Base bet $5. After 2 wins in a row, bet $10. After 3 wins, bet $15. Any loss resets to $5.",
    bets: [
      { id: "twoup-1", type: "black", numbers: [...BLACK_NUMBERS], amount: 5, label: "BLACK" },
    ],
  },
  {
    id: "blackley-24",
    name: "Charles Blackley's 24 Number Modification",
    rating: 77,
    riskLevel: "Moderate",
    bankrollRequired: 600,
    unitSize: 5,
    demoProfit: 410,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/z5vtWHeryBc",
    ratings: { coverage: 17, riskReward: 14, bankrollEff: 15, recovery: 15, discipline: 16 },
    howItWorks: "Bet on 2 dozens simultaneously — the last dozen that hit plus the dozen that has been 'sleeping' the longest. This covers 24 of 38 numbers (63% coverage).",
    progression: "Flat bet $5 on each of the two selected dozens ($10 total). Switch dozens based on the last result. If the same dozen hits twice, keep it and swap the other.",
    bets: [
      { id: "bl-1", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 1), amount: 5, label: "1st 12" },
      { id: "bl-2", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 25), amount: 5, label: "3rd 12" },
    ],
  },
  {
    id: "three-kings",
    name: "Three Wise Kings",
    rating: 76,
    riskLevel: "Moderate",
    bankrollRequired: 750,
    unitSize: 5,
    demoProfit: 345,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/70KEP_2CBXE",
    ratings: { coverage: 14, riskReward: 15, bankrollEff: 14, recovery: 16, discipline: 17 },
    howItWorks: "Start with 3 corner bets (the 'three kings'). After each loss, add one more corner bet to expand coverage. After a win, remove the last added corner. Maximum 6 corners active.",
    progression: "Start: 3 corners at $5 each. Loss: add 1 corner ($5). Win: remove last added corner. Max 6 corners. If all 6 lose, reset to 3.",
    bets: [
      { id: "kings-1", type: "corner", numbers: [5, 6, 8, 9], amount: 5, label: "5-6-8-9" },
      { id: "kings-2", type: "corner", numbers: [17, 18, 20, 21], amount: 5, label: "17-18-20-21" },
      { id: "kings-3", type: "corner", numbers: [29, 30, 32, 33], amount: 5, label: "29-30-32-33" },
    ],
  },
  {
    id: "romanosky",
    name: "Romanosky System",
    rating: 75,
    riskLevel: "Conservative",
    bankrollRequired: 500,
    unitSize: 5,
    demoProfit: 265,
    demoDuration: "15 minutes",
    youtubeUrl: "https://youtu.be/b8eL7gvqQno",
    ratings: { coverage: 19, riskReward: 14, bankrollEff: 14, recovery: 13, discipline: 15 },
    howItWorks: "Combine 2 dozen bets with corner bets from the uncovered dozen to achieve maximum coverage (32 of 38 numbers). Only 6 numbers can beat you. Small but consistent wins.",
    progression: "Flat betting only. $5 on each of 2 dozens plus $5 on 2 corners from the 3rd dozen. Total bet: $20 per spin. Win pays $5 profit on dozen hits, $20 on corner hits.",
    bets: [
      { id: "rom-1", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 1), amount: 5, label: "1st 12" },
      { id: "rom-2", type: "dozen", numbers: Array.from({ length: 12 }, (_, i) => i + 13), amount: 5, label: "2nd 12" },
      { id: "rom-3", type: "corner", numbers: [25, 26, 28, 29], amount: 5, label: "25-26-28-29" },
      { id: "rom-4", type: "corner", numbers: [32, 33, 35, 36], amount: 5, label: "32-33-35-36" },
    ],
  },
];

// Rating category descriptions for the info panel
export const RATING_CATEGORIES = [
  {
    name: "Board Coverage",
    description: "How many numbers does the strategy cover per spin? More coverage means more frequent wins.",
  },
  {
    name: "Risk / Reward Balance",
    description: "How steep is the bet progression? Flat betting scores high. Aggressive doubling scores low.",
  },
  {
    name: "Bankroll Efficiency",
    description: "How much starting money does this strategy require to work properly? A strategy that needs $2,500 to function scores lower because it demands more capital upfront. A strategy that works with $200 scores higher because it's more accessible. The recommended bankroll is not the same as your loss limit — you can always set a personal loss limit and walk away before risking your full bankroll.",
  },
  {
    name: "Recovery Logic",
    description: "Does the strategy have a smart way to recover from losses? Creative recovery systems score higher.",
  },
  {
    name: "Session Discipline",
    description: "Does the strategy have built-in stop points, time limits, or win goals? Strategies with clear exit rules score higher.",
  },
];
