import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface MountainDividerProps {
  color?: string;
  flip?: boolean;
  intensity?: number;
}

export function MountainDivider({ color = "var(--background)", flip = false, intensity = 20 }: MountainDividerProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Subtle parallax shift
  const y = useTransform(scrollYProgress, [0, 1], [intensity, -intensity]);

  return (
    <div 
      ref={ref}
      className={`relative w-full overflow-hidden pointer-events-none z-20 ${flip ? "-mt-1" : "-mb-1"}`}
      style={{ height: "120px" }}
    >
      <motion.svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-[150%] left-0"
        style={{ 
          fill: color, 
          y,
          transform: flip ? "rotate(180deg)" : "none"
        }}
      >
        <path d="M0,0 L0,120 L1200,120 L1200,0 C1050,40 900,10 750,60 C600,110 450,20 300,70 C150,120 50,20 0,0 Z" />
      </motion.svg>
      
      {/* Subtle Mist/Atmosphere at the peak line */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-50"
        style={{ y: useTransform(y, v => v * 0.5) }}
      />
    </div>
  );
}
