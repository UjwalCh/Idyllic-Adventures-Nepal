import { motion } from "motion/react";
import { Shield, Sparkles, Heart, Globe, Compass } from "lucide-react";

const VALUES = [
  { icon: Shield, text: "Uncompromising Safety" },
  { icon: Sparkles, text: "Bespoke Itineraries" },
  { icon: Heart, text: "Local Community Support" },
  { icon: Globe, text: "Eco-Conscious Travel" },
  { icon: Compass, text: "Expert Local Guides" },
];

export function ValuesMarquee({ content }: { content?: string }) {
  const displayValues = content 
    ? content.split("•").map((t, i) => ({ id: i, text: t.trim(), icon: Sparkles }))
    : VALUES;

  if (!displayValues.length) return null;
  return (
    <div className="relative py-8 md:py-12 bg-background overflow-hidden border-y border-border/50">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-16 md:gap-24 pr-16 md:pr-24 overflow-visible"
        >
          {[...displayValues, ...displayValues, ...displayValues].map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className="flex items-center gap-3 md:gap-5 group transform-gpu">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                </div>
                <span className="text-lg md:text-2xl font-heading font-bold tracking-tight text-primary/80 group-hover:text-accent transition-colors duration-500">
                  {val.text}
                </span>
                <span className="text-accent/30 font-black text-xl md:text-3xl ml-4 md:ml-8 select-none">/</span>
              </div>
            );
          })}
        </motion.div>
      </div>
      
      {/* Visual Polish: Side Gradients */}
      <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
}
