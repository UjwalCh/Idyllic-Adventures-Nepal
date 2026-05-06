import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useGallery } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { Maximize2, X } from "lucide-react";

export function GalleryPage() {
  const { images, loading } = useGallery();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const categories = ["All", ...Array.from(new Set(images.map((img) => img.category).filter(Boolean)))];
  const filteredImages = selectedCategory === "All" 
    ? images 
    : images.filter((img) => img.category === selectedCategory);

  const renderVideoEmbed = (url: string) => {
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
      embedUrl = url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
      embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
    } else if (url.includes("vimeo.com/")) {
      embedUrl = url.replace("vimeo.com/", "player.vimeo.com/video/");
    }
    return (
      <iframe
        src={embedUrl}
        className="w-full aspect-video rounded-3xl shadow-2xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative h-[50dvh] min-h-[400px] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Himalayan Moments" 
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-6xl md:text-7xl mb-6 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">Himalayan Moments</h1>
            <p className="text-xl text-white max-w-2xl mx-auto font-light leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              A collection of memories captured through the lens of our guides and trekkers across the majestic landscapes of Nepal.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4 lg:px-8">
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category!)}
              className={`px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all ${
                selectedCategory === category
                  ? "bg-accent text-white shadow-xl shadow-accent/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="relative group cursor-pointer rounded-[2rem] overflow-hidden break-inside-avoid shadow-lg hover:shadow-2xl transition-all duration-500 transform-gpu mb-6"
                  onClick={() => setSelectedItem(image)}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.title || "Gallery Image"}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  
                  {/* Glass Reveal Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 backdrop-blur-[2px] group-hover:backdrop-blur-none">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                      
                      {image.title && (
                        <h3 className="text-white text-2xl font-heading mb-2 drop-shadow-md">
                          {image.title}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-3">
                        {image.category && (
                          <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">{image.category}</span>
                        )}
                        {image.isVideo && (
                          <span className="px-3 py-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/10">
                            Trailer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Play Badge (Static) */}
                  {image.isVideo && (
                    <div className="absolute top-6 left-6 w-10 h-10 bg-accent/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                       <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32 space-y-4">
            <div className="text-4xl">📸</div>
            <h3 className="text-2xl font-heading text-primary">No moments found</h3>
            <p className="text-muted-foreground">Try selecting a different category.</p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedItem(null)}
          >
            <button 
              className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors z-[110] p-2 hover:bg-white/10 rounded-full"
              onClick={() => setSelectedItem(null)}
            >
              <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.isVideo ? (
                <div className="w-full">
                   {renderVideoEmbed(selectedItem.videoUrl)}
                </div>
              ) : (
                <img
                  src={selectedItem.url}
                  alt="Fullscreen view"
                  className="max-w-full max-h-[80dvh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
                />
              )}
              
              <div className="text-center text-white">
                <h2 className="text-3xl font-heading mb-2">{selectedItem.title || "Himalayan Moment"}</h2>
                <p className="text-white/60 font-light max-w-2xl">{selectedItem.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
