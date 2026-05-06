import { Link } from "react-router";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowRight, Mountain, Users, Award, Shield } from "lucide-react";
import { useSiteSettings, useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { trackWebsiteEvent } from "../data/supabaseData";
import { LiveCounter } from "../components/ui/LiveCounter";
import ParallaxHero from "../components/ui/ParallaxHero";
import { HimalayanMist } from "../components/ui/HimalayanMist";
import { StackedTrekCards } from "../components/ui/StackedTrekCards";
import { MountainDivider } from "../components/ui/MountainDivider";
import { ScrollPath } from "../components/ui/ScrollPath";

export function HomePage() {
  const { treks } = useTreks();
  const { settings } = useSiteSettings();
  const featuredTreks = treks.filter((trek) => trek.featured);
  const { scrollYProgress } = useScroll();
  const marqueeX = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]), { stiffness: 50, damping: 20 });

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HimalayanMist />

      <motion.div
        initial={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
      >
        <ParallaxHero
          badge={settings.home_hero_badge || "Explore the Himalayas"}
          title={
            <div className="flex flex-col gap-0 md:gap-2">
              <motion.span 
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 0.8 }}
                className="font-heading text-4xl md:text-7xl lg:text-8xl leading-tight block font-black tracking-tight"
              >
                {settings.home_hero_title_line1 || "Discover Your"}
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 1 }}
                className="text-secondary italic font-heading text-5xl md:text-8xl lg:text-[9rem] leading-[0.9] block drop-shadow-xl"
              >
                {settings.home_hero_title_line2 || "Idyllic Adventure"}
              </motion.span>
            </div>
          }
          subtitle={settings.home_hero_description || "Trek through the world's highest mountains with a dedicated local trek leader. Create memories that last a lifetime."}
          image={settings.home_hero_image || "https://images.unsplash.com/photo-1690122601365-77d6ee21e998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8TmVwYWwlMjBIaW1hbGF5YXMlMjBtb3VudGFpbnMlMjBFdmVyZXN0JTIwdHJla3xlbnwxfHx8fDE3NzY5Mjk4NDR8MA&ixlib=rb-4.1.0&q=80&w=1080"}
        >
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/treks"
            className="group px-8 py-4 bg-secondary hover:bg-secondary/90 text-slate-900 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-secondary/20 font-bold"
          >
            <span>Explore Treks</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/contact?type=inquiry&source=home-hero-contact"
            onClick={() => {
              void trackWebsiteEvent("cta_click", "home-hero-contact");
            }}
            className="px-8 py-4 bg-white hover:bg-white/90 text-slate-900 rounded-lg transition-all border border-white/20 shadow-lg font-bold"
          >
            Contact Us
          </Link>
        </div>
      </ParallaxHero>
      </motion.div>
      <MountainDivider color="var(--background)" />

      <section className="py-12 md:py-20 bg-background relative z-10 -mt-10 md:-mt-20 transform-gpu">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Mountain, label: settings.home_stats_years_label || "Years of Trek Leadership", value: settings.home_stats_years || "15+" },
              { icon: Users, label: settings.home_stats_trekkers_label || "Happy Trekkers", value: settings.home_stats_trekkers || "2,500+" },
              { icon: Award, label: settings.home_stats_guides_label || "Expert Guides", value: settings.home_stats_guides || "14+" },
              { icon: Shield, label: settings.home_stats_safety_label || "Safety First", value: settings.home_stats_safety || "100%" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.9 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
                }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="glass-card rounded-3xl p-8 text-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div 
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-2xl mb-6 relative z-10 shadow-inner"
                >
                  <stat.icon className="w-10 h-10 text-accent" />
                </motion.div>
                <div className="font-heading text-5xl mb-2 text-primary relative z-10">
                  <LiveCounter targetValue={stat.value} />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold relative z-10">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      <MountainDivider color="rgba(241, 245, 249, 0.2)" flip />

      <motion.section 
        initial={{ opacity: 0, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.2 }}
        className="py-12 md:py-20 bg-muted/20 relative transform-gpu overflow-hidden"
      >
        {/* Horizontal Scroll Marquee */}
        <div className="absolute top-20 left-0 w-full overflow-hidden pointer-events-none select-none opacity-10 dark:opacity-5">
          <motion.div 
            style={{ 
              x: marqueeX,
              WebkitTextStroke: "1px var(--muted-foreground)", 
              fill: "transparent" 
            }}
            className="whitespace-nowrap font-black text-[12rem] md:text-[20rem] leading-none text-muted-foreground transform-gpu will-change-transform"
          >
            EXPLORE THE HIMALAYAS • ADVENTURE AWAITS • DISCOVER NEPAL • 
          </motion.div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center mb-10 md:mb-12"
          >
            <h2 className="font-heading text-5xl md:text-7xl mb-4">{settings.home_featured_title || "Featured Treks"}</h2>
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              {settings.home_featured_subtitle || "Handpicked adventures for the ultimate Himalayan experience"}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative py-12 md:py-20"
          >
            <StackedTrekCards treks={featuredTreks} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <Link
              to="/treks"
              className="group inline-flex items-center gap-4 px-12 py-6 bg-primary text-primary-foreground rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-primary/30"
            >
              <span className="text-xl font-bold">Discover More Treks</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <MountainDivider color="#020617" />

      <section className="relative py-32 md:py-52 overflow-hidden text-white transform-gpu">
        {/* Background Image with Layered Parallax */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000" 
            alt="Mountain Sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <h2 className="font-heading text-5xl md:text-9xl mb-10 md:mb-14 leading-tight tracking-tight drop-shadow-2xl">
                {settings.home_cta_title || "Your Himalayan Story Starts Here"}
              </h2>
              <p className="text-xl md:text-3xl mb-12 md:mb-16 opacity-80 font-light leading-relaxed max-w-3xl mx-auto">
                {settings.home_cta_description || "Contact me today to start planning your bespoke journey. I will guide you through every pass and valley of the majestic Himalayas."}
              </p>
              <Link
                to="/contact?type=inquiry&source=home-footer-cta"
                onClick={() => {
                  void trackWebsiteEvent("cta_click", "home-footer-cta");
                }}
                className="group inline-flex items-center gap-4 px-14 py-7 bg-secondary text-slate-900 font-black rounded-3xl hover:bg-white hover:scale-110 transition-all shadow-[0_30px_60px_rgba(245,158,11,0.4)]"
              >
                <span className="text-2xl uppercase tracking-tighter">{settings.home_cta_button_label || "Begin Your Adventure"}</span>
                <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
