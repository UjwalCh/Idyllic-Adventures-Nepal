import { motion } from "motion/react";
import { Quote } from "lucide-react";
import ImageWithFallback from "../figma/ImageWithFallback";

interface GuideShowcaseProps {
  image?: string;
  label?: string;
  name?: string;
  role?: string;
  saying?: string;
}

export function GuideShowcase({ image, label, name, role, saying, tags }: GuideShowcaseProps & { tags?: string }) {
  const defaultImage = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800";
  const displayLabel = label || "Founder & Lead";
  const displayName = name || "Mr. Narayan Prasad Chapagain";
  const displayRole = role || "Expert Expedition Leader";
  const displaySaying = saying || "The mountains are not just peaks to be conquered, but teachers to be respected.";
  const displayTags = (tags || "15+ Peaks Mastered • Wilderness First Aid • 20+ Years Experience • Local Cultural Expert").split("•");

  return (
    <div className="relative py-8 md:py-16 flex flex-col items-center px-4 md:px-8 z-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-7xl glass-card rounded-[3rem] py-8 md:py-12 px-8 md:px-16 flex flex-col md:flex-row items-center gap-10 md:gap-20 relative overflow-hidden group shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] bg-background/40 backdrop-blur-2xl border border-white/10"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

        {/* Floating Image Container - Bigger & Round */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative shrink-0"
        >
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-br from-accent/40 via-secondary/40 to-accent/40 shadow-2xl transition-transform duration-500">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-background bg-muted">
              <ImageWithFallback
                src={image || defaultImage}
                alt={displayName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>
          {/* Decorative Ring */}
          <div className="absolute -inset-4 rounded-full border border-accent/10 animate-pulse-slow" />
        </motion.div>

        {/* Content Container */}
        <div className="flex-1 text-center md:text-left space-y-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="w-10 h-[1px] bg-accent/40" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-accent">{displayLabel}</span>
            </div>
            <h2 className="font-heading text-4xl md:text-6xl text-primary tracking-tight leading-none mb-2">
              {displayName}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-bold tracking-[0.3em] uppercase opacity-60">
              {displayRole}
            </p>
          </div>

          <div className="relative max-w-3xl">
            <Quote className="absolute -top-4 -left-8 w-12 h-12 text-accent/10 -rotate-12" />
            <p className="text-lg md:text-3xl font-heading leading-tight text-foreground/90 pl-6 italic tracking-tight">
              "{displaySaying}"
            </p>
          </div>
        </div>
      </motion.div>

      {/* Expertise Marquee - Smoother and Smaller */}
      <div className="w-full max-w-5xl mt-10 overflow-hidden pointer-events-none opacity-40">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...displayTags, ...displayTags, ...displayTags, ...displayTags].map((tag, i) => (
            <span key={i} className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-6">
              {tag.trim()}
              <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
