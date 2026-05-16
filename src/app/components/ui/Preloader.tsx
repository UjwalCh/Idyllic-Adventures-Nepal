import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBranding } from "../../data/useBranding";
import { Mountain, Compass, Wind, Map, Heart, Sparkles } from "lucide-react";

const TREKKING_TIPS = [
  { icon: Mountain, text: "Mount Everest: 8,848.86m of pure majesty." },
  { icon: Wind, text: "Layering is life. Himalayan weather is a chameleon." },
  { icon: Map, text: "Annapurna: The world's most legendary circuit awaits." },
  { icon: Heart, text: "Walk clockwise. Respect the ancient mani walls." },
  { icon: Compass, text: "Hydration is key. The altitude demands it." },
  { icon: Sparkles, text: "8 of the 14 highest peaks are right here in Nepal." },
];

export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false); // Default false until session check
  const { settings } = useBranding() || {};

  // Randomize tips on every interaction
  const shuffledTips = useMemo(() => [...TREKKING_TIPS].sort(() => Math.random() - 0.5), []);

  useEffect(() => {
    // Session check: only show once per visit
    const hasSeenLoader = sessionStorage.getItem("idyllic_loader_seen");
    if (hasSeenLoader) {
      if (onComplete) onComplete();
      return;
    }
    
    setIsVisible(true);
    sessionStorage.setItem("idyllic_loader_seen", "true");

    const TOTAL_LOAD_TIME = 4500; 
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 800); 
          return 100;
        }
        return prev + 1;
      });
    }, TOTAL_LOAD_TIME / 100);

    const tipInterval = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % shuffledTips.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, []);

  // More realistic mountain rain particles
  const rainDrops = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    left: Math.random() * 140 - 20, // Wider range
    top: Math.random() * -30,
    duration: Math.random() * 0.3 + 0.2, // Faster
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
    height: Math.random() * 30 + 30
  })), []);

  if (!isVisible) return null;

  const TipIcon = shuffledTips[tipIdx].icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 1.02, 
          filter: "blur(40px)",
          transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] }
        }}
        className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center text-white overflow-hidden"
      >
        {/* Atmospheric Mountain Rain Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {rainDrops.map((drop) => (
            <motion.div
              key={drop.id}
              initial={{ top: "-10%", left: `${drop.left}%`, opacity: 0 }}
              animate={{ 
                top: "110%", 
                left: `${drop.left + 10}%`, 
                opacity: [0, drop.opacity * 1.5, 0] 
              }}
              transition={{ 
                duration: drop.duration * 1.5, 
                repeat: Infinity, 
                delay: drop.delay,
                ease: "linear"
              }}
              className="absolute w-[1px] bg-gradient-to-b from-accent/40 via-white/20 to-transparent"
              style={{ height: `${drop.height * 1.2}px` }}
            />
          ))}
          {/* Deep atmosphere overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)]" />
        </div>

        {/* Content Container with Height-Aware Scaling */}
        <div className="relative z-10 flex flex-col items-center justify-between w-full max-w-[64rem] px-[1.5rem] py-[2rem] md:py-[4rem] h-full max-h-screen overflow-hidden">
          
          {/* Top Branding - Fades out on very short screens to save space */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-[0.5rem] opacity-50 shrink-0 hidden sm:flex"
          >
            <div className="text-[0.6rem] md:text-[0.75rem] tracking-[0.6em] uppercase font-black text-white/80">Idyllic Adventures</div>
            <div className="w-[3rem] h-[1px] bg-accent/30" />
          </motion.div>

          {/* Center Main Content - Flex shrink ensures it fits */}
          <div className="flex flex-col items-center justify-center gap-[1.5rem] md:gap-[3rem] w-full flex-1 min-h-0">
            
            {/* The Mountain Path Animation - Scaled down for height safety */}
            <div className="relative w-full max-w-[14rem] sm:max-w-[20rem] md:max-w-[28rem] aspect-[16/9] flex items-center justify-center shrink min-h-0">
              {/* Background Path */}
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full text-white/[0.03]">
                <path d="M0 60 L30 20 L50 40 L75 10 L100 60" fill="none" stroke="currentColor" strokeWidth="0.3" />
              </svg>

              {/* Active Path */}
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="peak-gradient-v6" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fff" />
                  </linearGradient>
                  <filter id="glow-v6">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <motion.path 
                  d="M0 60 L30 20 L50 40 L75 10 L100 60" 
                  fill="none" 
                  stroke="url(#peak-gradient-v6)" 
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#glow-v6)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                />
                <motion.circle
                  r="1.2"
                  className="fill-white shadow-[0_0_10px_white]"
                  style={{ 
                    offsetPath: "path('M0 60 L30 20 L50 40 L75 10 L100 60')", 
                    offsetDistance: `${progress}%` 
                  }}
                />
              </svg>

              {/* High Visibility Percentage */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center text-[4rem] sm:text-[6rem] md:text-[8rem] font-black opacity-[0.12] select-none pointer-events-none"
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.4)", color: "transparent" }}
              >
                {progress}
              </motion.div>
            </div>

            {/* Logo and Tips Container */}
            <div className="flex flex-col items-center gap-[1.5rem] md:gap-[2.5rem] w-full min-h-0 shrink">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, 0, -1, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="w-[4rem] h-[4rem] sm:w-[6rem] sm:h-[6rem] md:w-[8rem] md:h-[8rem] relative shrink-0"
              >
                <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full" />
                {settings?.site_logo ? (
                  <img src={settings.site_logo} alt="Logo" className="w-full h-full object-contain relative z-10 filter brightness-110" />
                ) : (
                  <Mountain className="w-full h-full text-accent/30 relative z-10" />
                )}
              </motion.div>

              {/* High Visibility Quotes */}
              <div className="text-center h-auto min-h-[5rem] md:min-h-[8rem] flex items-center justify-center w-full max-w-[40rem] shrink">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tipIdx}
                    initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-[0.75rem] px-[1.5rem]"
                  >
                    <div className="flex items-center gap-[0.5rem] px-[0.8rem] py-[0.3rem] rounded-full bg-white/5 border border-white/10">
                      <TipIcon className="w-[0.8rem] md:w-[0.9rem] h-[0.8rem] md:h-[0.9rem] text-accent" />
                      <span className="text-[0.5rem] md:text-[0.55rem] uppercase tracking-[0.4em] font-black text-white/70">
                        {progress < 30 ? "Setting up Basecamp" : progress < 70 ? "Ascending High Passes" : "Final Approach"}
                      </span>
                    </div>
                    <p className="text-[1rem] sm:text-[1.125rem] md:text-[1.5rem] font-heading tracking-tight text-white font-bold leading-tight italic drop-shadow-lg line-clamp-3">
                      "{shuffledTips[tipIdx].text}"
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Bottom Progress UI - Pushed to absolute bottom on very small heights if needed */}
          <div className="w-full max-w-[20rem] flex flex-col items-center gap-[1rem] mt-auto shrink-0 pb-[1rem]">
            <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-white shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-[0.5rem] md:text-[0.55rem] uppercase tracking-[0.5em] font-black">
              <span className="text-white/40 animate-pulse">Syncing Gear</span>
              <span className="text-accent drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{progress}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
