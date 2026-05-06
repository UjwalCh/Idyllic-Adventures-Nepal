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
                left: `${drop.left + 15}%`, 
                opacity: [0, drop.opacity, 0] 
              }}
              transition={{ 
                duration: drop.duration, 
                repeat: Infinity, 
                delay: drop.delay,
                ease: "linear"
              }}
              className="absolute w-[1.5px] bg-gradient-to-b from-white/40 to-transparent transform -rotate-[15deg]"
              style={{ height: `${drop.height}px` }}
            />
          ))}
          {/* Mist overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617] opacity-40" />
        </div>

        {/* Content Container with Zoom Safety */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-12 w-full max-w-4xl px-8 h-full">
          
          {/* Top Branding */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1 opacity-40 mb-auto pt-12"
          >
            <div className="text-[10px] tracking-[0.6em] uppercase font-black text-white/60">Idyllic Adventures</div>
          </motion.div>

          {/* Center Main Content */}
          <div className="flex flex-col items-center justify-center gap-12 md:gap-20 w-full mb-auto">
            
            {/* The Mountain Path Animation */}
            <div className="relative w-full max-w-[320px] md:max-w-[500px] aspect-[16/9] flex items-center justify-center">
              {/* Background Path */}
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full text-white/[0.05]">
                <path d="M0 60 L30 20 L50 40 L75 10 L100 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </svg>

              {/* Active Path */}
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="peak-gradient-v3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="#fff" />
                  </linearGradient>
                </defs>
                <motion.path 
                  d="M0 60 L30 20 L50 40 L75 10 L100 60" 
                  fill="none" 
                  stroke="url(#peak-gradient-v3)" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  className="drop-shadow-[0_0_25px_rgba(245,158,11,1)]"
                />
                <motion.circle
                  r="1.5"
                  className="fill-white"
                  style={{ 
                    offsetPath: "path('M0 60 L30 20 L50 40 L75 10 L100 60')", 
                    offsetDistance: `${progress}%` 
                  }}
                />
              </svg>

              {/* Enhanced Percentage */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center text-7xl md:text-[14rem] font-black opacity-10 select-none pointer-events-none"
                style={{ WebkitTextStroke: "1.5px white", color: "transparent" }}
              >
                {progress}%
              </motion.div>
            </div>

            {/* Logo and Tips Container */}
            <div className="flex flex-col items-center gap-8 w-full">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 md:w-40 md:h-40"
              >
                {settings?.site_logo ? (
                  <img src={settings.site_logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Mountain className="w-full h-full text-accent/20" />
                )}
              </motion.div>

              {/* High Visibility Quotes */}
              <div className="text-center h-24 md:h-32 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tipIdx}
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex items-center gap-3 text-accent shadow-accent/20">
                      <TipIcon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-[8px] md:text-[10px] uppercase tracking-[0.5em] font-black">Everest Expedition</span>
                    </div>
                    <p className="text-base md:text-2xl font-heading tracking-tight text-white font-medium leading-tight px-4 max-w-2xl italic">
                      "{shuffledTips[tipIdx].text}"
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Bottom Progress UI */}
          <div className="w-full max-w-sm px-8 flex flex-col items-center gap-5 mt-auto pb-12">
            <div className="w-full h-[1px] bg-white/10 relative">
              <motion.div 
                className="absolute top-[-0.5px] left-0 h-[2px] bg-accent shadow-[0_0_25px_rgba(245,158,11,1)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-[8px] uppercase tracking-[0.4em] font-black text-white/40">
              <span className="animate-pulse">Loading Adventure</span>
              <span className="text-accent">{progress}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
