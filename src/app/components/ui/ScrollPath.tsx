import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Mountain, Footprints } from "lucide-react";

export function ScrollPath() {
  const { scrollYProgress } = useScroll();
  
  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Path for a mountain range silhouette
  const path = "M0,100 C150,100 250,20 350,80 C450,140 550,40 650,90 C750,140 850,20 1000,100";

  return (
    <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none z-20 opacity-60 dark:opacity-80 overflow-hidden">
      <svg 
        viewBox="0 0 1000 150" 
        className="w-full h-full preserve-3d" 
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="scroll-path-clip">
            <motion.rect 
              x="0" 
              y="0" 
              height="150" 
              style={{ width: useTransform(smoothProgress, [0, 1], ["0%", "100%"]) }} 
            />
          </clipPath>
        </defs>

        {/* Destination Peak (Everest) */}
        <g transform="translate(940, 60)">
          {/* Simple SVG Peak */}
          <path d="M0 40 L20 0 L40 40 Z" className="fill-primary opacity-30" />
          <motion.circle 
            cx="20"
            cy="20"
            r="4"
            className="fill-accent"
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        </g>

        {/* Background Full Dotted Path (Subtle) */}
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 12"
          className="text-primary opacity-10"
        />
        
        {/* Active Progress Dotted Path */}
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeDasharray="2 12"
          clipPath="url(#scroll-path-clip)"
          className="opacity-100"
        />

        {/* The Tracker (Simple Circle for stability) */}
        <motion.circle
          style={{ 
            cx: useTransform(smoothProgress, [0, 1], [0, 960]),
            cy: useTransform(smoothProgress, (val) => {
              return 85 + Math.sin(val * 10) * 20; 
            })
          }}
          r="6"
          className="fill-accent stroke-white stroke-2 shadow-xl"
        />
      </svg>
    </div>
  );
}
