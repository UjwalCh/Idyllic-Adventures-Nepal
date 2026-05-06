import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { Menu, X, Home, Mountain, BookOpen, Image, Info, Phone } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Treks", path: "/treks", icon: Mountain },
  { label: "Journal", path: "/journal", icon: BookOpen },
  { label: "Gallery", path: "/gallery", icon: Image },
  { label: "About", path: "/about", icon: Info },
  { label: "Contact", path: "/contact", icon: Phone },
];

export function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed top-8 right-8 z-[100]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(79,70,229,0.4)] backdrop-blur-md"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Fullscreen Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[90] bg-background/80 flex items-center justify-center"
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                  {NAV_ITEMS.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center gap-6 text-5xl md:text-7xl font-heading transition-all ${
                          location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-10 h-10 md:w-16 md:h-16 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <span className="relative">
                          {item.label}
                          <motion.span 
                            className="absolute -bottom-2 left-0 h-2 bg-accent"
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                          />
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="hidden md:block bg-muted/30 rounded-[3rem] p-12 aspect-square relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="text-4xl font-heading text-primary/40 leading-tight">
                      Explore the world's <br/> highest mountains <br/> with local experts.
                    </div>
                    <div className="space-y-4">
                      <div className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">Follow Our Journey</div>
                      <div className="flex gap-6 text-2xl font-heading">
                        <a href="#" className="hover:text-primary transition-colors">Instagram</a>
                        <a href="#" className="hover:text-primary transition-colors">Facebook</a>
                        <a href="#" className="hover:text-primary transition-colors">YouTube</a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
