import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Compass, Shield, Heart } from "lucide-react";

interface FloatingPromoProps {
  image?: string;
  title?: string;
  description?: string;
  feat1?: string;
  feat2?: string;
  feat3?: string;
}

export function FloatingPromo({ 
  image = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
  title = "Local Expertise, Global Standards",
  description = "With over 15 years of experience leading expeditions across the Himalayas, we provide an unparalleled journey through the heart of Nepal.",
  feat1,
  feat2,
  feat3
}: FloatingPromoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  const features = [
    { icon: Compass, text: feat1 || "Bespoke Itineraries" },
    { icon: Shield, text: feat2 || "Safety Certified" },
    { icon: Heart, text: feat3 || "Local Communities" }
  ];

  return (
    <section ref={containerRef} className="relative py-24 md:py-40 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Floating Image Container */}
          <motion.div 
            style={{ y: imageY, rotate }}
            className="relative z-10"
          >
            <div className="relative aspect-[4/5] md:aspect-[4/3] rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl">
              <img 
                src={image} 
                alt="Promo" 
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-white shadow-2xl"
              >
                <div className="text-4xl font-black mb-1">15+</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">Years Excellence</div>
              </motion.div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary/20 blur-3xl rounded-full" />
          </motion.div>

          {/* Text Content */}
          <motion.div 
            style={{ y: textY }}
            className="relative z-20 flex flex-col gap-8"
          >
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent mb-6"
              >
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Our Philosophy</span>
              </motion.div>
              
              <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl mb-8 leading-[1.1]">
                {title}
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed mb-10">
                {description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {features.map((feature, i) => (
                  <div key={i} className="flex flex-col gap-3 p-6 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group">
                    <feature.icon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      
      {/* Background Decorative Text */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03] select-none">
        <div className="whitespace-nowrap font-black text-[15rem] leading-none">
          LOCAL GUIDES • HIMALAYAN PEAKS • MOUNTAIN SPIRIT •
        </div>
      </div>
    </section>
  );
}
