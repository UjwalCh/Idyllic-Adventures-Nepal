import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useGallery } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { Maximize2, X } from "lucide-react";

export function GalleryPage() {
  const { images, loading } = useGallery();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(images.map((img) => img.category).filter(Boolean)))];
  const filteredImages = selectedCategory === "All" 
    ? images 
    : images.filter((img) => img.category === selectedCategory);

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
        ) : (
          <motion.div 
            layout
            className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="relative group cursor-pointer break-inside-avoid rounded-3xl overflow-hidden"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.title || "Gallery Image"}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                    <div className="absolute top-6 right-6">
                      <Maximize2 className="w-6 h-6 text-white/70" />
                    </div>
                    {image.title && <h3 className="text-white text-xl font-heading mb-2">{image.title}</h3>}
                    {image.category && (
                      <span className="text-accent text-xs font-bold uppercase tracking-widest">{image.category}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-10 h-10" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-6xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Fullscreen view"
                className="w-full h-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
