import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Pause, Play, Square } from "lucide-react";

export default function SessionTimer() {
  const {
    sessionActive, sessionPaused, sessionSettings,
    getRemainingSeconds, getElapsedMinutes,
    pauseSession, resumeSession, endSession,
    totalSpins, sessionProfit,
  } = useGame();

  const [displayTime, setDisplayTime] = useState<string>("--:--");
  const [timerColor, setTimerColor] = useState<string>("#22c55e"); // green

  useEffect(() => {
    if (!sessionActive) return;

    const update = () => {
      if (sessionSettings.timeLimit) {
        const remaining = getRemainingSeconds();
        if (remaining === null) return;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setDisplayTime(`${mins}:${secs.toString().padStart(2, "0")}`);

        // Traffic light colors
        const totalSecs = sessionSettings.timeLimit * 60;
        const pct = remaining / totalSecs;
        if (pct > 0.5) {
          setTimerColor("#22c55e"); // green
        } else if (pct > 0.2) {
          setTimerColor("#eab308"); // yellow
        } else {
          setTimerColor("#ef4444"); // red
        }
      } else {
        // No time limit — show elapsed
        const elapsed = getElapsedMinutes();
        const mins = Math.floor(elapsed);
        const secs = Math.floor((elapsed - mins) * 60);
        setDisplayTime(`${mins}:${secs.toString().padStart(2, "0")}`);
        setTimerColor("#22c55e");
      }
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [sessionActive, sessionPaused, sessionSettings, getRemainingSeconds, getElapsedMinutes]);

  if (!sessionActive) return null;

  return (
    <div className="bg-[#1a1a2e]/80 border-b border-white/5 px-3 py-1.5">
      <div className="flex items-center justify-between max-w-[720px] mx-auto">
        {/* Timer display */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: timerColor }}
          />
          <span
            className="font-numbers font-bold text-xl tracking-wider"
            style={{ color: timerColor }}
          >
            {sessionPaused ? "PAUSED" : displayTime}
          </span>
          {sessionSettings.timeLimit && (
            <span className="text-[#C0C0C0]/40 font-body text-[10px]">
              / {sessionSettings.timeLimit}m
            </span>
          )}
        </div>

        {/* Session stats */}
        <div className="flex items-center gap-3 text-xs font-numbers">
          <span className="text-[#C0C0C0]">
            {totalSpins} <span className="text-[#C0C0C0]/40 font-body">spins</span>
          </span>
          <span className={sessionProfit >= 0 ? "text-green-400" : "text-red-400"}>
            {sessionProfit >= 0 ? "+" : ""}${sessionProfit}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={sessionPaused ? resumeSession : pauseSession}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#C0C0C0] transition-colors"
            title={sessionPaused ? "Resume" : "Pause"}
          >
            {sessionPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={() => endSession("Session stopped manually")}
            className="p-1.5 rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
            title="Stop Session"
          >
            <Square size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
