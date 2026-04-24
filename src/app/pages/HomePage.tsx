import { Link } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Mountain, Users, Award, Shield } from "lucide-react";
import { useNotices, useSiteSettings, useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { trackWebsiteEvent } from "../data/supabaseData";
import { LiveCounter } from "../components/ui/LiveCounter";
import ParallaxHero from "../components/ui/ParallaxHero";

export function HomePage() {
  const { treks } = useTreks();
  const { notices } = useNotices();
  const { settings } = useSiteSettings();
  const featuredTreks = treks.filter((trek) => trek.featured);

  return (
    <div className="min-h-screen">
      {notices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/10 border-b border-secondary/20 relative z-50"
        >
          <div className="container mx-auto px-4 lg:px-8 py-3">
            {notices.map((notice) => (
              <p key={notice.id} className="text-sm text-center">
                <span className="font-semibold">{notice.title}:</span> {notice.message}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      <ParallaxHero
        badge={settings.home_hero_badge || "Explore the Himalayas"}
        title={
          <>
            <span className="font-heading text-5xl md:text-7xl lg:text-9xl leading-tight block">
              {settings.home_hero_title_line1 || "Discover Your"}
            </span>
            <span className="text-secondary italic font-heading text-6xl md:text-8xl lg:text-[10rem]">
              {settings.home_hero_title_line2 || "Idyllic Adventure"}
            </span>
          </>
        }
        subtitle={settings.home_hero_description || "Trek through the world's highest mountains with a dedicated local trek leader. Create memories that last a lifetime."}
        image={settings.home_hero_image || "https://images.unsplash.com/photo-1690122601365-77d6ee21e998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8TmVwYWwlMjBIaW1hbGF5YXMlMjBtb3VudGFpbnMlMjBFdmVyZXN0JTIwdHJla3xlbnwxfHx8fDE3NzY5Mjk4NDR8MA&ixlib=rb-4.1.0&q=80&w=1080"}
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/treks"
            className="group px-8 py-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-secondary/20"
          >
            <span>Explore Treks</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/contact?type=inquiry&source=home-hero-contact"
            onClick={() => {
              void trackWebsiteEvent("cta_click", "home-hero-contact");
            }}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-lg transition-all border border-white/20 shadow-lg"
          >
            Contact Us
          </Link>
        </div>
      </ParallaxHero>

      <section className="py-24 bg-background relative z-10 -mt-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Mountain, label: "Years of Trek Leadership", value: settings.home_stats_years || "15+" },
              { icon: Users, label: "Happy Trekkers", value: settings.home_stats_trekkers || "2,500+" },
              { icon: Award, label: "Expert Guides", value: settings.home_stats_guides || "14+" },
              { icon: Shield, label: "Safety First", value: "100%" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card rounded-3xl p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <stat.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="font-heading text-4xl mb-2 text-primary">
                  <LiveCounter targetValue={stat.value} />
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-muted/20 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-heading text-5xl md:text-6xl mb-6">{settings.home_featured_title || "Featured Treks"}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {settings.home_featured_subtitle || "Handpicked adventures for the ultimate Himalayan experience"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {featuredTreks.map((trek, index) => (
              <motion.div
                key={trek.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
              >
                <Link
                  to={`/treks/${trek.id}`}
                  className="group block bg-card rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-border/50"
                >
                  <div className="relative h-80 overflow-hidden">
                    <ImageWithFallback
                      src={trek.image}
                      alt={trek.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-6 right-6 px-4 py-2 bg-secondary/90 backdrop-blur-md text-primary text-sm font-semibold rounded-full border border-white/20">
                      {trek.difficulty}
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="font-heading text-3xl mb-4 group-hover:text-accent transition-colors">
                      {trek.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 line-clamp-2 text-lg">
                      {trek.description}
                    </p>
                    <div className="flex items-center justify-between pb-6 border-b border-border/30">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Duration</div>
                        <div className="font-medium">{trek.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Price</div>
                        <div className="font-bold text-accent text-xl">{trek.price}</div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-accent font-semibold group-hover:gap-2 transition-all">
                      <span>View Full Itinerary</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <Link
              to="/treks"
              className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/20"
            >
              <span className="text-lg">Discover More Treks</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-40 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 overflow-hidden">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-6xl md:text-7xl mb-10 leading-tight">
                {settings.home_cta_title || "Your Himalayan Story Starts Here"}
              </h2>
              <p className="text-xl md:text-2xl mb-12 opacity-80 font-light leading-relaxed">
                {settings.home_cta_description || "Contact me today to start planning your bespoke journey. I will guide you through every pass and valley of the majestic Himalayas."}
              </p>
              <Link
                to="/contact?type=inquiry&source=home-footer-cta"
                onClick={() => {
                  void trackWebsiteEvent("cta_click", "home-footer-cta");
                }}
                className="inline-flex items-center gap-3 px-12 py-6 bg-secondary text-primary font-bold rounded-2xl hover:bg-white hover:scale-105 transition-all shadow-2xl"
              >
                <span className="text-xl">{settings.home_cta_button_label || "Begin Your Adventure"}</span>
                <ArrowRight className="w-6 h-6" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
