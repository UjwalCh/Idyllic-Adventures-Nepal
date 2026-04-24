import { Link, useLocation } from "react-router";
import { Mountain, Menu, X, BookOpen, Image } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteSettings } from "../data/useRealtimeData";

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/treks", label: "Treks" },
    { path: "/journal", label: "Journal", icon: BookOpen },
    { path: "/gallery", label: "Gallery", icon: Image },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-navbar"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-primary rounded-lg group-hover:bg-accent transition-all duration-300 transform group-hover:rotate-6 shadow-lg shadow-primary/20">
                <Mountain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-heading text-xl tracking-tight text-primary">
                  {settings.nav_brand_name || "Idyllic Adventures"}
                </div>
                <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{settings.nav_brand_tagline || "Explore Nepal"}</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 group ${
                    location.pathname === link.path
                      ? "text-accent"
                      : "text-foreground/70 hover:text-accent"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="absolute inset-0 bg-accent/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-md -mx-2" />
                </Link>
              ))}
              <Link
                to="/admin"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all hover:shadow-xl hover:shadow-accent/20"
              >
                Admin
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-xl transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-20 left-0 right-0 z-40 glass-panel mx-4 overflow-hidden"
          >
            <nav className="px-4 py-8 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-4 px-6 rounded-2xl transition-all flex items-center gap-4 ${
                    location.pathname === link.path
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "hover:bg-white/10"
                  }`}
                >
                  {link.icon && <link.icon className="w-5 h-5 opacity-70" />}
                  <span className="font-heading text-xl">{link.label}</span>
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 px-6 bg-accent text-accent-foreground rounded-2xl font-bold transition-all text-center shadow-lg shadow-accent/20"
              >
                Admin Panel
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
