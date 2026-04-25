import { motion } from "motion/react";
import { useParams, Link, useNavigate } from "react-router";
import { Calendar, User, Tag, ArrowLeft, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchJournalEntryBySlug, JournalEntry } from "../data/supabaseData";
import ImageWithFallback from "../components/figma/ImageWithFallback";

export function JournalEntryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntry() {
      if (!slug) return;
      try {
        const data = await fetchJournalEntryBySlug(slug);
        if (data) {
          setEntry(data);
        } else {
          navigate("/journal");
        }
      } catch (err) {
        console.error("Failed to fetch journal entry:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadEntry();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  if (!entry) return null;

  return (
    <article className="min-h-screen bg-background pb-32">
      {/* Hero Header */}
      <section className="relative h-[70dvh] min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src={entry.image || "https://images.unsplash.com/photo-1544735716-392fe2489ffa"}
          alt={entry.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 lg:px-8 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Journal</span>
              </Link>
              
              {entry.category && (
                <div className="px-4 py-2 bg-accent text-white inline-block rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  {entry.category}
                </div>
              )}
              
              <h1 className="font-heading text-5xl md:text-7xl text-white mb-8 leading-tight">
                {entry.title}
              </h1>

              <div className="flex flex-wrap items-center gap-8 text-white/80 text-sm font-medium uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary" />
                  {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-secondary" />
                  Written by Idyllic Guide
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 bg-card rounded-[3rem] p-8 md:p-16 shadow-2xl border border-border/50"
          >
            <div className="prose prose-xl prose-stone max-w-none prose-headings:font-heading prose-a:text-accent">
              {entry.content.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i} className="mb-6 leading-relaxed text-muted-foreground">{paragraph}</p> : <br key={i} />
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-border/30 flex items-center justify-between">
              <div className="flex gap-4">
                <button className="p-3 bg-muted/50 hover:bg-muted rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <Link
                to="/contact"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-accent transition-all"
              >
                Plan Your Trek Like This
              </Link>
            </div>
          </motion.div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="glass-panel p-8">
              <h3 className="font-heading text-2xl mb-6">About the Author</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" alt="Guide" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold">Ujwal Sharma</div>
                  <div className="text-sm text-muted-foreground">Lead Trek Guide</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sharing my love for the mountains and the unique culture of Nepal through stories and photographs.
              </p>
            </div>

            <div className="glass-panel p-8">
              <h3 className="font-heading text-2xl mb-6">Want to visit?</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Every story in this journal is based on a real trek we offer. Interested in seeing these views for yourself?
              </p>
              <Link
                to="/treks"
                className="w-full py-4 bg-secondary text-primary font-bold rounded-xl text-center block hover:scale-105 transition-transform"
              >
                View Our Treks
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
