import { motion } from "motion/react";
import { useMemo } from "react";

export function FloatingParticles() {
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: `${p.x}%`, y: `${p.y}%` }}
          animate={{ 
            opacity: [0, p.opacity, 0],
            y: [`${p.y}%`, `${p.y - 15}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-white/40 blur-[1px]"
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}
