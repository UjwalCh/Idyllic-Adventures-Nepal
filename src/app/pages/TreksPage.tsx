import { Link } from "react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Filter } from "lucide-react";
import { useSiteSettings, useTreks } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";

export function TreksPage() {
  const { settings } = useSiteSettings();
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const { treks } = useTreks();

  const difficulties = ["All", "Easy", "Moderate", "Challenging", "Strenuous"];

  const filteredTreks =
    difficultyFilter === "All"
      ? treks
      : treks.filter((trek) => trek.difficulty === difficultyFilter);

  return (
    <div className="min-h-screen">
      <section className="relative h-[50vh] overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src={settings.treks_hero_image || "https://images.unsplash.com/photo-1592623171049-4be9e0f5a501?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
            alt="Treks"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl md:text-6xl text-primary-foreground mb-4">
                {settings.treks_hero_title || "Our Treks"}
              </h1>
              <p className="text-lg text-primary-foreground/90 max-w-2xl">
                {settings.treks_hero_description || "Explore our curated collection of trekking adventures across the magnificent Himalayas of Nepal"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filter by difficulty:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setDifficultyFilter(difficulty)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    difficultyFilter === difficulty
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTreks.map((trek, index) => (
              <motion.div
                key={trek.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/treks/${trek.id}`}
                  className="group block bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={trek.image}
                      alt={trek.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-secondary text-primary text-sm rounded-full">
                      {trek.difficulty}
                    </div>
                    {trek.featured && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-2xl mb-3 group-hover:text-accent transition-colors">
                      {trek.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {trek.description}
                    </p>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{trek.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Altitude:</span>
                        <span>{trek.maxAltitude}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Best Season:</span>
                        <span className="text-right">{trek.bestSeason}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">From</div>
                        <div className="font-semibold text-accent">{trek.price}</div>
                      </div>
                      <div className="flex items-center text-accent group-hover:gap-2 transition-all">
                        <span className="text-sm">View Details</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredTreks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No treks found for the selected difficulty level.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
