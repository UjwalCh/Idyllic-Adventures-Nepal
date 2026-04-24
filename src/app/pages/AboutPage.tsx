import { motion } from "motion/react";
import { Award, Heart, Shield, Users } from "lucide-react";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { useSiteSettings } from "../data/useRealtimeData";

export function AboutPage() {
  const { settings } = useSiteSettings();
  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description:
        "Your safety is my top priority, and every trek follows strict safety protocols.",
    },
    {
      icon: Heart,
      title: "Passion for Mountains",
      description:
        "I am a mountain enthusiast who loves sharing the beauty of the Himalayas.",
    },
    {
      icon: Users,
      title: "Local Expertise",
      description:
        "I bring years of local route knowledge, cultural context, and trail experience.",
    },
    {
      icon: Award,
      title: "Quality Service",
      description:
        "I maintain high standards in accommodation, equipment, and overall trekking experience.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-[50vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={settings.about_hero_image || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw5fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
            alt="About Us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </motion.div>

        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-3xl"
            >
              <h1 className="font-heading text-5xl md:text-6xl text-white mb-6">
                {settings.about_hero_title || "About Idyllic Adventures"}
              </h1>
              <p className="text-lg text-white/90">
                {settings.about_hero_description || "A personal trekking service run by one dedicated local guide"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-heading text-4xl mb-6">{settings.about_story_title || "My Story"}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {settings.about_story_description || `Founded in 2010, Idyllic Adventures Nepal was built from a personal passion for the Himalayas and a desire to share their magnificence with fellow trekkers.

Over the years, I have guided trekkers from around the globe through Nepal's most spectacular mountain trails, combining technical experience with deep local cultural knowledge.

I believe in sustainable tourism that respects local communities and preserves the natural environment. Every trek I organize is designed to contribute responsibly to local livelihoods.`}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-96 rounded-2xl overflow-hidden"
            >
              <ImageWithFallback
                src={settings.about_story_image || "https://images.unsplash.com/photo-1701255136052-b33f78a886a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
                alt="Solo Guide"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl mb-4">{settings.about_values_title || "My Values"}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {settings.about_values_subtitle || "The principles that guide every trek I organize"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                  <value.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-heading text-xl mb-3">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl mb-4">{settings.about_guide_title || "Meet Your Guide"}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {settings.about_guide_subtitle || "A dedicated local trek leader focused on making your journey unforgettable"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto bg-card rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="relative h-80">
              <ImageWithFallback
                src={settings.about_guide_image || "https://images.unsplash.com/photo-1554710869-95f3df6a3197?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
                alt="Lead Guide"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl mb-1">{settings.about_guide_name || "Tenzing Sherpa"}</h3>
              <p className="text-accent mb-2">{settings.about_guide_role || "Founder and Lead Trek Guide"}</p>
              <p className="text-sm text-muted-foreground">{settings.about_guide_experience || "15 years of Himalayan trekking experience"}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
