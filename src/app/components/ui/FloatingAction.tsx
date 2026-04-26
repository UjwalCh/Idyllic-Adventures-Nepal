import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export function FloatingAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 w-72 bg-card/95 backdrop-blur-xl p-7 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border/50 origin-bottom-right"
          >
            <h3 className="font-heading text-xl mb-2 text-foreground">Need Help Planning?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Talk to our local experts and customize your Himalayan dream trek.
            </p>
            <Link
              to="/contact?type=inquiry&source=floating_btn"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-colors"
            >
              Start an Inquiry
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-accent/50 transition-all border-2 border-white/10 dark:border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
