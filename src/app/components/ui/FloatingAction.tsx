import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "../../data/useRealtimeData";

export function FloatingAction() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSiteSettings();

  const whatsappNumber = settings?.whatsapp || "9779800000000";

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-24 right-0 w-72 bg-card/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-border/50 origin-bottom-right"
          >
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-2xl mb-3 text-foreground">Plan Your Trek</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Our Himalayan experts are online to help you customize your journey.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-3 w-full px-4 py-5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#25D366]/20 group"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Chat on WhatsApp</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-18 h-18 md:w-20 md:h-20 ${isOpen ? "bg-card text-foreground" : "bg-[#25D366] text-white"} rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(37,211,102,0.3)] hover:shadow-[#25D366]/50 transition-all border-4 border-white/10`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8 fill-white/10" />}
      </motion.button>
    </div>
  );
}
