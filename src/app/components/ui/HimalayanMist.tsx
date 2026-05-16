import { motion } from "motion/react";

export function HimalayanMist() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-30">
      <motion.div
        animate={{
          x: ["-10%", "10%"],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/4 -left-1/4 w-[120%] h-[100px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-3xl rotate-12 transform-gpu"
      />
      <motion.div
        animate={{
          x: ["10%", "-10%"],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-2/3 -right-1/4 w-[120%] h-[150px] bg-gradient-to-r from-transparent via-blue-100/10 to-transparent blur-3xl -rotate-12 transform-gpu"
      />
      
      {/* Snow Particles - Reduced for performance */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: -10, 
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: "110vh",
            x: (Math.random() * 100 + 10) + "%",
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 20,
            ease: "linear"
          }}
          className="absolute w-1 h-1 bg-white rounded-full blur-[1px] transform-gpu will-change-transform"
        />
      ))}
    </div>
  );
}
