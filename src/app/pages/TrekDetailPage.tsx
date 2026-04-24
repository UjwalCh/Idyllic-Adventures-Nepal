import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Mountain as MountainIcon,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { trackWebsiteEvent } from "../data/supabaseData";

export function TrekDetailPage() {
  const { id } = useParams();
  const { treks } = useTreks();
  const trek = treks.find((t) => t.id === id);

  if (!trek) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-3xl mb-4">Trek Not Found</h1>
          <Link to="/treks" className="text-accent hover:underline">
            Back to Treks
          </Link>
        </div>
      </div>
    );
  }

  const details = [
    { icon: Clock, label: "Duration", value: trek.duration },
    { icon: TrendingUp, label: "Difficulty", value: trek.difficulty },
    { icon: MountainIcon, label: "Max Altitude", value: trek.maxAltitude },
    { icon: Calendar, label: "Best Season", value: trek.bestSeason },
    { icon: Users, label: "Group Size", value: trek.groupSize },
    { icon: DollarSign, label: "Price", value: trek.price },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={trek.image}
            alt={trek.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        </motion.div>

        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 lg:px-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                to="/treks"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Treks</span>
              </Link>
              <div className="flex items-center gap-3 mb-4">
                {trek.featured && (
                  <div className="px-3 py-1 bg-secondary text-primary text-sm rounded-full">
                    Featured
                  </div>
                )}
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  {trek.difficulty}
                </div>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">
                {trek.title}
              </h1>
              <p className="text-lg text-white/90 max-w-3xl">{trek.description}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {details.map((detail, index) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-3">
                  <detail.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-xs text-muted-foreground mb-1">{detail.label}</div>
                <div className="text-sm">{detail.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {trek.highlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-heading text-3xl mb-6">Trek Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trek.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {trek.itinerary.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-heading text-3xl mb-6">Itinerary</h2>
                  <div className="space-y-6">
                    {trek.itinerary.map((day) => (
                      <div
                        key={day.day}
                        className="flex gap-6 pb-6 border-b border-border last:border-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                            <span className="text-sm">Day {day.day}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading text-lg mb-2">{day.title}</h3>
                          <p className="text-muted-foreground">{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="sticky top-24"
              >
                <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
                  <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-2">Starting from</div>
                    <div className="font-heading text-4xl text-accent">{trek.price}</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{trek.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <span>{trek.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Group Size</span>
                      <span>{trek.groupSize}</span>
                    </div>
                  </div>

                  <Link
                    to={`/contact?type=booking&source=trek-book-now&trek=${encodeURIComponent(trek.title)}`}
                    onClick={() => {
                      void trackWebsiteEvent("cta_click", `book_now:${trek.id}`);
                    }}
                    className="block w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-center"
                  >
                    Book This Trek
                  </Link>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Contact us for group discounts and custom itineraries
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-heading text-3xl mb-4">Have Questions?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              I am ready to help you plan your perfect trek
            </p>
            <Link
              to={`/contact?type=inquiry&source=trek-inquiry&trek=${encodeURIComponent(trek.title)}`}
              onClick={() => {
                void trackWebsiteEvent("cta_click", `inquiry:${trek.id}`);
              }}
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
