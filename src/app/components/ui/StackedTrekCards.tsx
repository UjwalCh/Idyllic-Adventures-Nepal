import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Calendar } from "lucide-react";
import ImageWithFallback from "../figma/ImageWithFallback";
import { MouseEvent } from "react";

interface Trek {
  id: string;
  title: string;
  image: string;
  description: string;
  difficulty?: string;
}

interface StackedTrekCardsProps {
  treks: Trek[];
}

function TrekCard({ trek, index, offset, baseTranslateX, baseTranslateY, baseRotation }: { 
  trek: Trek; 
  index: number; 
  offset: number;
  baseTranslateX: number;
  baseTranslateY: number;
  baseRotation: number;
}) {
  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
      initial={{ opacity: 0, scale: 0.8, x: 0, rotate: 0 }}
      whileInView={{ 
        opacity: 1, 
        scale: 1, 
        x: baseTranslateX, 
        y: baseTranslateY, 
        rotate: baseRotation 
      }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        type: "spring", 
        stiffness: 120, 
        damping: 20, 
        mass: 0.8,
        delay: index * 0.04 
      }}
      style={{ 
        zIndex: 10 - Math.abs(offset),
        position: 'absolute',
        willChange: 'transform, opacity',
        perspective: 1000
      }}
      whileHover={{ 
        rotate: 0, 
        scale: 1.05, 
        y: -40,
        zIndex: 100,
      }}
      className="w-[360px] h-[540px] cursor-pointer group transform-gpu"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        <Link
          to={`/treks/${trek.id}`}
          className="block w-full h-full relative rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_45px_90px_-20px_rgba(0,0,0,0.5)] transition-all duration-400 border border-white/10"
          style={{ transform: "translateZ(0)" }}
        >
          {/* Background Image */}
          <div className="absolute inset-0" style={{ transform: "translateZ(-20px)" }}>
            <ImageWithFallback
              src={trek.image}
              alt={trek.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
          </div>

          {/* Top Badge */}
          <motion.div 
            style={{ transform: "translateZ(50px)" }}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-[11px] font-black uppercase tracking-widest shadow-lg"
          >
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            {trek.difficulty || "Adventure"}
          </motion.div>

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 text-white space-y-3 md:space-y-4" style={{ transform: "translateZ(40px)" }}>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-secondary">
              MARCH, APRIL, MAY
            </p>
            <h3 className="font-heading text-3xl md:text-4xl leading-tight group-hover:text-secondary transition-colors drop-shadow-lg line-clamp-2">
              {trek.title}
            </h3>
            <p className="text-[13px] md:text-sm text-white/70 line-clamp-2 font-medium leading-relaxed group-hover:text-white transition-colors">
              {trek.description}
            </p>
            <div className="pt-4 md:pt-6 flex items-center gap-3 text-xs md:text-sm font-black uppercase tracking-widest">
              <span className="relative pb-1 group-hover:text-secondary transition-colors">
                Explore Adventure
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-500" />
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform text-secondary" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function StackedTrekCards({ treks }: StackedTrekCardsProps) {
  const displayTreks = treks.slice(0, 5);

  return (
    <div className="relative w-full max-w-7xl mx-auto h-[650px] flex items-center justify-center mt-4 mb-16 overflow-visible transform-gpu">
      {displayTreks.map((trek, index) => {
        const centerIndex = Math.floor(displayTreks.length / 2);
        const offset = index - centerIndex;
        
        const baseRotation = offset * 15;
        const baseTranslateX = offset * 320;
        const baseTranslateY = Math.abs(offset) * 40;

        return (
          <TrekCard 
            key={trek.id}
            trek={trek}
            index={index}
            offset={offset}
            baseTranslateX={baseTranslateX}
            baseTranslateY={baseTranslateY}
            baseRotation={baseRotation}
          />
        );
      })}
    </div>
  );
}
