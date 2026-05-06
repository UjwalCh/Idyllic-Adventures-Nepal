import { Link } from "react-router";
import { motion, useScroll, useVelocity, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSiteSettings, useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { ThreeDTrekCard } from "../components/ui/ThreeDTrekCard";

export function TreksPage() {
  const { settings } = useSiteSettings();
  const { treks } = useTreks();

  // Scroll Velocity Skew Effect
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skewVelocity = useSpring(scrollVelocity, {
    stiffness: 100,
    damping: 30
  });
  const skew = useTransform(skewVelocity, [-3000, 3000], [-5, 5]);

  return (
    <div className="min-h-screen">
      <section className="relative h-[45dvh] min-h-[350px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={settings.treks_hero_image || "https://images.unsplash.com/photo-1592623171049-4be9e0f5a501?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
            alt="Treks"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/60" />
        </div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl md:text-7xl text-white mb-4 drop-shadow-lg">
                {settings.treks_hero_title || "Our Treks"}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl drop-shadow-md font-light">
                {settings.treks_hero_description || "Explore our curated collection of trekking adventures across the magnificent Himalayas of Nepal"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-20 relative pt-4 md:pt-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {treks.map((trek, index) => (
              <ThreeDTrekCard key={trek.id} trek={trek} index={index} />
            ))}
          </div>

          {treks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No treks found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

