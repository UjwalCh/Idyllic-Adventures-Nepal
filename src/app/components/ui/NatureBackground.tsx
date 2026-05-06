import { motion, useSpring, useTransform, useMotionValue } from "motion/react";
import { useEffect } from "react";

export function NatureBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]));
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-20, 20]));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-[0.15] dark:opacity-[0.25]">
      <motion.div 
        style={{ 
          x: parallaxX, 
          y: parallaxY,
          backgroundImage: `url('https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=2000')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="absolute inset-[-40px] grayscale contrast-125"
      />
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
    </div>
  );
}
