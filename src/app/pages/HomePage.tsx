import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Mountain, Users, Award, Shield } from "lucide-react";
import { useNotices, useSiteSettings, useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { trackWebsiteEvent } from "../data/supabaseData";
import { LiveCounter } from "../components/ui/LiveCounter";

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
          className="bg-secondary/10 border-b border-secondary/20"
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

      <section className="relative h-[90vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={settings.home_hero_image || "https://images.unsplash.com/photo-1690122601365-77d6ee21e998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8TmVwYWwlMjBIaW1hbGF5YXMlMjBtb3VudGFpbnMlMjBFdmVyZXN0JTIwdHJla3xlbnwxfHx8fDE3NzY5Mjk4NDR8MA&ixlib=rb-4.1.0&q=80&w=1080"}
            alt="Himalayas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </motion.div>

        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-block px-4 py-2 bg-secondary/90 text-primary rounded-full mb-6 backdrop-blur-sm">
                  <span className="text-sm tracking-wide">{settings.home_hero_badge || "Explore the Himalayas"}</span>
                </div>
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
                  {settings.home_hero_title_line1 || "Discover Your"}
                  <br />
                  <span className="text-secondary italic">{settings.home_hero_title_line2 || "Idyllic Adventure"}</span>
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                  {settings.home_hero_description || "Trek through the world's highest mountains with a dedicated local trek leader. Create memories that last a lifetime in the majestic landscapes of Nepal."}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/treks"
                    className="group px-8 py-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg transition-all flex items-center gap-2"
                  >
                    <span>Explore Treks</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/contact?type=inquiry&source=home-hero-contact"
                    onClick={() => {
                      void trackWebsiteEvent("cta_click", "home-hero-contact");
                    }}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-lg transition-all border border-white/20"
                  >
                    Contact Us
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Mountain, label: "Years of Trek Leadership", value: settings.home_stats_years || "15+" },
              { icon: Users, label: "Happy Trekkers", value: settings.home_stats_trekkers || "2,500+" },
              { icon: Award, label: "Expert Guides", value: settings.home_stats_guides || "14+" },
              { icon: Shield, label: "Safety First", value: "100%" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="font-heading text-3xl mb-1 text-primary">
                  <LiveCounter targetValue={stat.value} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl md:text-5xl mb-4">{settings.home_featured_title || "Featured Treks"}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {settings.home_featured_subtitle || "Handpicked adventures for the ultimate Himalayan experience"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredTreks.map((trek, index) => (
              <motion.div
                key={trek.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Link
                  to={`/treks/${trek.id}`}
                  className="group block bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className="relative h-72 overflow-hidden">
                    <ImageWithFallback
                      src={trek.image}
                      alt={trek.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-secondary text-primary text-sm rounded-full">
                      {trek.difficulty}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-2xl mb-3 group-hover:text-accent transition-colors">
                      {trek.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {trek.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div>{trek.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">From</div>
                        <div className="font-semibold text-accent">{trek.price}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-accent group-hover:gap-2 transition-all">
                      <span className="text-sm">View Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            className="text-center mt-12"
          >
            <Link
              to="/treks"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span>View All Treks</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-accent text-accent-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-4xl md:text-5xl mb-6">
                {settings.home_cta_title || "Ready for Your Next Adventure?"}
              </h2>
              <p className="text-lg mb-8 opacity-90">
                {settings.home_cta_description || "Contact me today to start planning your unforgettable journey through the Himalayas. I will personally help you every step of the way."}
              </p>
              <Link
                to="/contact?type=inquiry&source=home-footer-cta"
                onClick={() => {
                  void trackWebsiteEvent("cta_click", "home-footer-cta");
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-lg hover:bg-white/90 transition-colors"
              >
                <span>{settings.home_cta_button_label || "Get in Touch"}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
