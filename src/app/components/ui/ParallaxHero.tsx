import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import ImageWithFallback from "../figma/ImageWithFallback";

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

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] h-[100dvh] overflow-hidden flex items-center justify-center">
      {/* Background Layer */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
      </motion.div>

      {/* Content Layer */}
      <motion.div 
        style={{ y: textY, opacity }}
        className="relative z-10 container mx-auto px-4 lg:px-8 text-center pt-32 pb-24"
      >
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-6 py-2 bg-secondary/90 text-[#020617] rounded-full mb-6 backdrop-blur-md border border-white/20 shadow-xl"
          >
            <span className="text-sm font-bold tracking-[0.2em] uppercase">{badge}</span>
          </motion.div>
        )}
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-white drop-shadow-2xl mb-8"
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

      {/* Dynamic Overlay Elements */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20" />
    </section>
  );
}
