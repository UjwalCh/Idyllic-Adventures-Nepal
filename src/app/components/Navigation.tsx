import { Link, useLocation } from "react-router";
import { Mountain, Menu, X, BookOpen, Image, Sun, Moon, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteSettings } from "../data/useRealtimeData";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import Magnetic from "./ui/Magnetic";

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const [keyBuffer, setKeyBuffer] = useState("");
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.isContentEditable
      );
      if (isTyping) return;

      const newBuffer = (keyBuffer + e.key.toUpperCase()).slice(-10);
      setKeyBuffer(newBuffer);

      if (settings.admin_hotkeys) {
        const keys = settings.admin_hotkeys.split("+").map((k: string) => k.trim().toLowerCase());
        const isShift = keys.includes("shift");
        const isCtrl = keys.includes("ctrl") || keys.includes("control");
        const targetKey = keys.find((k: string) => !["shift", "ctrl", "control", "alt"].includes(k));

        const matchShift = isShift ? e.shiftKey : true;
        const matchCtrl = isCtrl ? (e.ctrlKey || e.metaKey) : true;
        const matchKey = targetKey ? e.key.toLowerCase() === targetKey : true;

        if (matchShift && matchCtrl && matchKey && targetKey) {
          e.preventDefault();
          navigate("/managepage");
        }
      }

      if (newBuffer.endsWith("ADMIN")) {
        navigate("/managepage");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, settings.admin_hotkeys, keyBuffer]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) setActiveSection(id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ["hero", "treks", "journal", "gallery", "about", "contact"];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { path: "/", label: "Home", id: "hero" },
    { path: "/treks", label: "Treks", id: "treks" },
    { path: "/journal", label: "Journal", icon: BookOpen, id: "journal" },
    { path: "/gallery", label: "Gallery", icon: Image, id: "gallery" },
    { path: "/about", label: "About", id: "about" },
    { path: "/contact", label: "Contact", id: "contact" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ${
        isScrolled 
          ? "bg-background/90 backdrop-blur-2xl py-0.5 shadow-2xl border-b border-border/50" 
          : "bg-background/80 backdrop-blur-xl py-2 border-b border-border/10"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Magnetic strength={0.2}>
            <Link to="/" className="flex items-center gap-2 md:gap-4 group">
              <div className="flex items-center justify-center overflow-hidden w-12 h-12 md:w-16 md:h-16 transition-transform duration-500 group-hover:scale-105 shrink-0">
                <AnimatePresence mode="wait">
                  {settings.site_logo ? (
                    <motion.img
                      key="logo-img"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={settings.site_logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <motion.div
                      key="logo-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col">
                <div className="font-heading text-lg md:text-2xl tracking-tighter text-primary font-black leading-none mb-0.5">
                  Idyllic Adventures
                </div>
                <div className="text-[9px] md:text-[10px] text-muted-foreground font-black tracking-[0.4em] uppercase opacity-60">NEPAL</div>
              </div>
            </Link>
          </Magnetic>

          <div className="hidden md:flex flex-1 items-center justify-end gap-x-8 lg:gap-x-12 pr-8">
            {navLinks.map((link) => (
              <div 
                key={link.path}
                className="relative"
              >
                <Magnetic strength={0.3}>
                  <Link
                    to={link.path}
                    className={`relative py-2 px-1 text-[13px] font-black tracking-[0.2em] uppercase transition-all duration-300 group ${
                      location.pathname === link.path || activeSection === link.id
                        ? "text-accent"
                        : "text-foreground hover:text-accent"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {(location.pathname === link.path || activeSection === link.id) && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full shadow-[0_2px_10px_rgba(59,130,246,0.5)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </Magnetic>

              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            {mounted && (
              <Magnetic strength={0.4}>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 hover:bg-muted rounded-full transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </Magnetic>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-xl transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-20 left-0 right-0 z-40 glass-panel mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
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
                  <span className="font-heading text-xl">{link.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
