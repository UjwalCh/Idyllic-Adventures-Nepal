import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";

export function MountainLine() {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate opacity based on scroll
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <div className="fixed inset-y-0 left-8 w-px h-full pointer-events-none z-0 hidden lg:block opacity-20">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <motion.path
          d="M 50 0 L 50 50 L 30 80 L 70 120 L 40 180 L 60 250 L 20 320 L 80 400 L 40 480 L 60 550 L 30 630 L 70 720 L 40 800 L 60 880 L 50 950 L 50 1000"
          fill="none"
          stroke="url(#mountainGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ pathLength, opacity }}
        />
        <defs>
          <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      {/* Small glowing dot at the end of the line */}
      <motion.div
        className="w-3 h-3 bg-secondary rounded-full blur-[2px] absolute left-1/2 -ml-1.5 shadow-[0_0_10px_#f59e0b]"
        style={{ 
          top: useTransform(pathLength, [0, 1], ["0%", "100%"]),
          opacity
        }}
      />
    </div>
  );
}
