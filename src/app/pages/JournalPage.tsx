import { motion } from "motion/react";
import { Link } from "react-router";
import { Calendar, User, Tag, ArrowRight } from "lucide-react";
import { useJournal } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";

import ParallaxHero from "../components/ui/ParallaxHero";

export function JournalPage() {
  const { entries, loading } = useJournal();

  return (
    <div className="min-h-screen bg-background">
      <ParallaxHero
        badge="Journal"
        title={
          <span className="font-heading text-6xl md:text-8xl drop-shadow-2xl text-white">
            Himalayan Journal
          </span>
        }
        subtitle="Stories from the high passes, local insights, and updates from our trekking adventures in the heart of Nepal."
        image="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000"
      />

      <section className="pb-32 container mx-auto px-4 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
            <h3 className="text-2xl font-heading mb-2">No stories yet</h3>
            <p className="text-muted-foreground">Check back soon for updates from the trail!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {entries.map((entry, index) => (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group flex flex-col bg-card rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-border/50"
              >
                <Link to={`/journal/${entry.slug}`} className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={entry.image || "https://images.unsplash.com/photo-1544735716-392fe2489ffa"}
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {entry.category && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-accent/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-full">
                      {entry.category}
                    </div>
                  )}
                </Link>
                
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 font-medium uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <h2 className="font-heading text-3xl mb-4 group-hover:text-accent transition-colors leading-tight">
                    <Link to={`/journal/${entry.slug}`}>{entry.title}</Link>
                  </h2>
                  
                  <p className="text-muted-foreground mb-8 line-clamp-3 leading-relaxed flex-1">
                    {entry.excerpt}
                  </p>

                  <Link
                    to={`/journal/${entry.slug}`}
                    className="inline-flex items-center gap-2 text-accent font-bold group-hover:gap-4 transition-all"
                  >
                    <span>Read Full Story</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
