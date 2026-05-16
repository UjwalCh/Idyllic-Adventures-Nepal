import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import ImageWithFallback from "../figma/ImageWithFallback";
import { FloatingParticles } from "./FloatingParticles";

interface ParallaxHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  badge?: string;
  image: string;
  video?: string;
  children?: React.ReactNode;
}

export default function ParallaxHero({ title, subtitle, badge, image, video, children }: ParallaxHeroProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const rawBackgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const rawTextY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const backgroundY = useSpring(rawBackgroundY, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const textY = useSpring(rawTextY, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] md:h-[100dvh] overflow-hidden flex items-center justify-center py-20 md:py-0">
      <FloatingParticles />
      {/* Background Layer */}
      <motion.div 
        style={{ y: backgroundY, translateZ: 0 }} 
        className="absolute inset-0 z-0 transform-gpu will-change-transform"
      >
        {video ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <ImageWithFallback
            src={image}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
      </motion.div>

      {/* Content Layer */}
      <motion.div 
        style={{ y: textY, opacity, translateZ: 0 }}
        className="relative z-10 container mx-auto px-4 lg:px-8 text-center pt-24 pb-16 transform-gpu will-change-transform"
      >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-8 py-2 bg-[#38BDF8] text-[#020617] rounded-full mb-6 backdrop-blur-md border border-white/20 shadow-xl shadow-blue-500/20"
          >
            <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase">{badge}</span>
          </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-white drop-shadow-2xl mb-6"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 font-light leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6"
        >
          {children}
        </motion.div>
      </motion.div>

      {/* Dynamic Overlay Elements - Reduced Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-[#020617]/90 z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617]/20 to-transparent z-20 pointer-events-none" />
      
      {/* Animated Mist Drift */}
      <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-10 opacity-30">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          <div className="w-[1000px] h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] blur-3xl" />
          <div className="w-[1000px] h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] blur-3xl" />
          <div className="w-[1000px] h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
