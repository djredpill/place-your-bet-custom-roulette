import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getWheelOrder, getNumberColor, TableType } from "@/lib/roulette-data";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Top-down view of roulette wheel with realistic spin animation
 * Mahogany wood, brass frets, chrome spindle
 */

interface RouletteWheelProps {
  isSpinning: boolean;
  resultNumber: number | string | null;
  onSpinComplete?: () => void;
  size?: number;
  tableType?: TableType;
  spinDuration?: number; // seconds — defaults to 4
}

export default function RouletteWheel({
  isSpinning,
  resultNumber,
  onSpinComplete,
  size = 280,
  tableType = "american",
  spinDuration = 4,
}: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [showBall, setShowBall] = useState(false);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wheelOrder = getWheelOrder(tableType);
  const pocketCount = wheelOrder.length;
  const pocketAngle = 360 / pocketCount;

  useEffect(() => {
    if (isSpinning && resultNumber !== null) {
      setShowBall(true);
      const targetIndex = wheelOrder.findIndex((n: number | string) => String(n) === String(resultNumber));
      const extraSpins = 5 + Math.random() * 3;
      const targetAngle = -(targetIndex * pocketAngle);
      const totalRotation = rotation + (360 * extraSpins) + targetAngle - (rotation % 360);
      setRotation(totalRotation);

      const ballExtraSpins = 8 + Math.random() * 4;
      const ballTargetAngle = targetIndex * pocketAngle;
      setBallAngle(ballTargetAngle + 360 * ballExtraSpins);

      spinTimeoutRef.current = setTimeout(() => {
        onSpinComplete?.();
      }, spinDuration * 1000);
    }
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, [isSpinning, resultNumber]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Outer mahogany ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, #5a3030 0%, #4E2728 40%, #3a1a1a 100%)",
          boxShadow: "0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.3)",
        }}
      />
      {/* Brass track ring */}
      <div
        className="absolute rounded-full"
        style={{
          top: size * 0.04, left: size * 0.04, right: size * 0.04, bottom: size * 0.04,
          background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 50%, #D4AF37 100%)",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)",
        }}
      />
      {/* Spinning wheel face */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{ top: size * 0.06, left: size * 0.06, right: size * 0.06, bottom: size * 0.06 }}
        animate={{ rotate: rotation }}
        transition={{ duration: isSpinning ? spinDuration : 0, ease: [0.15, 0.85, 0.35, 1] }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {wheelOrder.map((num: number | string, i: number) => {
            const startAngle = (i * pocketAngle - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * pocketAngle - 90) * (Math.PI / 180);
            const color = getNumberColor(num);
            const fill = color === "red" ? "#C41E23" : color === "black" ? "#1B1B1B" : "#006400";
            const outerR = size * 0.44;
            const innerR = size * 0.28;
            const cx = size / 2;
            const cy = size / 2;
            const x1 = cx + outerR * Math.cos(startAngle);
            const y1 = cy + outerR * Math.sin(startAngle);
            const x2 = cx + outerR * Math.cos(endAngle);
            const y2 = cy + outerR * Math.sin(endAngle);
            const x3 = cx + innerR * Math.cos(endAngle);
            const y3 = cy + innerR * Math.sin(endAngle);
            const x4 = cx + innerR * Math.cos(startAngle);
            const y4 = cy + innerR * Math.sin(startAngle);
            const midAngle = ((i + 0.5) * pocketAngle - 90) * (Math.PI / 180);
            const textR = size * 0.36;
            const tx = cx + textR * Math.cos(midAngle);
            const ty = cy + textR * Math.sin(midAngle);

            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`}
                  fill={fill} stroke="#D4AF37" strokeWidth="0.5"
                />
                <text
                  x={tx} y={ty} fill="white"
                  fontSize={size * 0.028} fontFamily="'DM Sans', sans-serif" fontWeight="700"
                  textAnchor="middle" dominantBaseline="central"
                  transform={`rotate(${(i + 0.5) * pocketAngle}, ${tx}, ${ty})`}
                >
                  {num}
                </text>
              </g>
            );
          })}
          <circle cx={size / 2} cy={size / 2} r={size * 0.22} fill="#4E2728" />
          <circle cx={size / 2} cy={size / 2} r={size * 0.18} fill="url(#centerGrad)" />
          <circle cx={size / 2} cy={size / 2} r={size * 0.06} fill="#C0C0C0" />
          <circle cx={size / 2} cy={size / 2} r={size * 0.04} fill="url(#chromeGrad)" />
          <defs>
            <radialGradient id="centerGrad">
              <stop offset="0%" stopColor="#5a3030" />
              <stop offset="100%" stopColor="#3a1a1a" />
            </radialGradient>
            <radialGradient id="chromeGrad">
              <stop offset="0%" stopColor="#E0E0E0" />
              <stop offset="50%" stopColor="#A0A0A0" />
              <stop offset="100%" stopColor="#C0C0C0" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Ball */}
      {showBall && (
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-white shadow-lg z-10"
          style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
          animate={{
            x: Math.cos(((ballAngle - 90) * Math.PI) / 180) * (size * 0.38),
            y: Math.sin(((ballAngle - 90) * Math.PI) / 180) * (size * 0.38),
          }}
          transition={{ duration: isSpinning ? spinDuration : 0, ease: [0.15, 0.85, 0.35, 1] }}
        />
      )}

      {/* Result display overlay */}
      {resultNumber !== null && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            font-display text-3xl text-white font-bold
            shadow-lg border-2 border-[#D4AF37]
            ${getNumberColor(resultNumber) === "red" ? "bg-[#C41E23]" :
              getNumberColor(resultNumber) === "black" ? "bg-[#1B1B1B]" : "bg-[#006400]"}
          `}>
            {resultNumber}
          </div>
        </motion.div>
      )}

      {/* Pointer/marker at top */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
        style={{
          width: 0, height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "14px solid #D4AF37",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
}
