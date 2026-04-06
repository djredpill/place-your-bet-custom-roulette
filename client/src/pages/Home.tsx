import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { initSounds, playBallSpin } from "@/lib/sounds";

/*
 * Design: "The Felt" — Skeuomorphic Realism
 * Splash screen with casino atmosphere, app title, and start button
 * Dark theme, gold accents, mahogany warmth
 * Entrance animation: wheel spins with ball sound for ~2.5s before navigating
 */

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663491633720/DqUFf3ivoJ5Ydsv3tGRESy/casino-atmosphere-fQLpxLZZ9qDfoJR2GSzMkF.webp";
const WHEEL_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663491633720/DqUFf3ivoJ5Ydsv3tGRESy/roulette-wheel-closeup-RL3eon72zGQDN9Pfp9HCHP.webp";

export default function Home() {
  const [, navigate] = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const soundInitRef = useRef(false);

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setShowDisclaimer(true);
    }, 2000);
    setHoldTimer(timer);
  };

  const handlePressEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleStartPlaying = () => {
    if (isTransitioning) return;

    // Initialize sounds on this first interaction
    if (!soundInitRef.current) {
      initSounds();
      soundInitRef.current = true;
    }

    setIsTransitioning(true);

    // Play ball spin sound for the entrance animation (~2.5s)
    playBallSpin(2500);

    // Navigate after the spin animation completes
    setTimeout(() => {
      navigate("/play");
    }, 2800);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0d1a]">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Fade-out overlay during transition */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.8 }}
            className="fixed inset-0 bg-[#0d0d1a] z-50"
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        
        {/* Wheel image — spins during entrance transition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
          animate={
            isTransitioning
              ? { opacity: 1, scale: 1.15, rotate: 1080 }
              : { opacity: 1, scale: 1, rotate: 0 }
          }
          transition={
            isTransitioning
              ? { duration: 2.5, ease: [0.25, 0.1, 0.25, 1], rotate: { duration: 2.5, ease: "easeInOut" } }
              : { duration: 1.2, ease: "easeOut" }
          }
          className="mb-6"
        >
          <img 
            src={WHEEL_IMAGE} 
            alt="Roulette Wheel" 
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-2xl border-4 border-[#D4AF37]/40"
            style={{ filter: `drop-shadow(0 0 ${isTransitioning ? '50px' : '30px'} rgba(212,175,55,${isTransitioning ? '0.6' : '0.3'}))` }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={
            isTransitioning
              ? { opacity: 0, y: -20 }
              : { opacity: 1, y: 0 }
          }
          transition={
            isTransitioning
              ? { duration: 0.6 }
              : { delay: 0.4, duration: 0.8 }
          }
          className="text-center mb-2"
        >
          <h1 
            className="font-display text-5xl sm:text-6xl tracking-[0.15em] text-[#D4AF37] leading-tight"
            style={{ textShadow: "0 2px 20px rgba(212,175,55,0.4)" }}
          >
            PLACE YOUR BET
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={
            isTransitioning
              ? { opacity: 0 }
              : { opacity: 1 }
          }
          transition={
            isTransitioning
              ? { duration: 0.3 }
              : { delay: 0.8, duration: 0.8 }
          }
          className="font-body text-[#C0C0C0] text-base sm:text-lg tracking-wider mb-10 text-center"
        >
          Custom Roulette Simulator
        </motion.p>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={
            isTransitioning
              ? { opacity: 0, y: 20, scale: 0.9 }
              : { opacity: 1, y: 0 }
          }
          transition={
            isTransitioning
              ? { duration: 0.4 }
              : { delay: 1.2, duration: 0.6 }
          }
          onClick={handleStartPlaying}
          disabled={isTransitioning}
          className={`px-12 py-4 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1a1a2e] font-display text-2xl tracking-[0.2em] rounded-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 ${
            isTransitioning ? "pointer-events-none" : ""
          }`}
          style={{ boxShadow: "0 4px 30px rgba(212,175,55,0.3)" }}
        >
          START PLAYING
        </motion.button>

        {/* Version & disclaimer trigger */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            isTransitioning
              ? { opacity: 0 }
              : { opacity: 1 }
          }
          transition={
            isTransitioning
              ? { duration: 0.2 }
              : { delay: 1.8 }
          }
          className="mt-12 text-center"
        >
          <p className="text-[#C0C0C0]/30 font-body text-xs mb-1">v1.0</p>
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className="text-[#C0C0C0]/20 font-body text-[10px] hover:text-[#C0C0C0]/40 transition-colors"
          >
            Hold for responsible gaming info
          </button>
        </motion.div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50" 
            onClick={() => setShowDisclaimer(false)} 
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a2e] border-2 border-[#D4AF37] rounded-lg p-6 w-[340px] max-w-[90vw]">
            <h2 className="text-[#D4AF37] font-display text-xl tracking-wider mb-3 text-center">
              RESPONSIBLE GAMING
            </h2>
            <div className="text-[#C0C0C0] font-body text-sm space-y-3">
              <p>
                This is a <strong className="text-white">simulation tool</strong> for educational 
                and entertainment purposes only. No real money is involved.
              </p>
              <p>
                If you or someone you know has a gambling problem, call the 
                National Problem Gambling Helpline:
              </p>
              <p className="text-center text-white font-numbers font-bold text-lg">
                1-800-522-4700
              </p>
              <p className="text-center text-xs text-[#C0C0C0]/60">
                Available 24/7 &bull; Confidential &bull; Free
              </p>
              <p className="text-xs text-[#C0C0C0]/40">
                Gamblers Anonymous: <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener" className="underline hover:text-[#D4AF37]">gamblersanonymous.org</a>
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="mt-4 w-full bg-[#D4AF37] text-[#1a1a2e] font-body font-bold py-2 rounded"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
