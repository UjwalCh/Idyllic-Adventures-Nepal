import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Clock, Mountain, Sun } from "lucide-react";
import ImageWithFallback from "../figma/ImageWithFallback";
import { MouseEvent, useRef } from "react";

interface Trek {
  id: string;
  title: string;
  image: string;
  description: string;
  difficulty?: string;
  duration?: string;
  maxAltitude?: string;
  bestSeason?: string;
  price?: string;
  featured?: boolean;
}

export function ThreeDTrekCard({ trek, index }: { trek: Trek; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  // Glare/Glow Position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ perspective: 1000 }}
      className="relative group h-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="h-full transform-gpu transition-all duration-200 ease-out"
      >
        <Link
          to={`/treks/${trek.id}`}
          className="relative block h-full bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_rgba(79,70,229,0.2)] transition-all duration-500"
        >
          {/* Glare Effect */}
          <motion.div 
            style={{ 
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: useTransform(mouseXSpring, [-0.5, 0.5], [0, 1]) // Only show glare on interaction
            }}
            className="absolute inset-0 z-20 pointer-events-none" 
          />

          {/* Top Image Section */}
          <div className="relative h-72 overflow-hidden" style={{ transform: "translateZ(20px)" }}>
            <ImageWithFallback
              src={trek.image}
              alt={trek.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2" style={{ transform: "translateZ(50px)" }}>
              <div className="px-4 py-1.5 bg-secondary/90 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                {trek.difficulty}
              </div>
              {trek.featured && (
                <div className="px-4 py-1.5 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-6" style={{ transform: "translateZ(40px)" }}>
            <div>
              <h3 className="font-heading text-3xl mb-2 group-hover:text-primary transition-colors leading-tight">
                {trek.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {trek.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-border/50 py-6">
              <div className="text-center">
                <Clock className="w-4 h-4 mx-auto mb-2 text-secondary" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Days</div>
                <div className="text-sm font-bold">{trek.duration?.split(' ')[0] || '--'}</div>
              </div>
              <div className="text-center border-x border-border/50">
                <Mountain className="w-4 h-4 mx-auto mb-2 text-secondary" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Peak</div>
                <div className="text-sm font-bold">{trek.maxAltitude?.split(' ')[0] || '--'}m</div>
              </div>
              <div className="text-center">
                <Sun className="w-4 h-4 mx-auto mb-2 text-secondary" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Best</div>
                <div className="text-sm font-bold truncate px-1">{trek.bestSeason?.split(' ')[0] || '--'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div style={{ transform: "translateZ(30px)" }}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">From</div>
                <div className="text-2xl font-black text-primary">{trek.price}</div>
              </div>
              
              <div 
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all"
                style={{ transform: "translateZ(50px)" }}
              >
                <span>View</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
