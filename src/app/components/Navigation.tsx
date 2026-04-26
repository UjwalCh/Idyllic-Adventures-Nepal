import { Link, useLocation } from "react-router";
import { Mountain, Menu, X, BookOpen, Image, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteSettings } from "../data/useRealtimeData";
import { useTheme } from "next-themes";
import { getCurrentSession, subscribeToAuthChanges } from "../data/auth";
import { useNavigate } from "react-router";

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Secret Sequence Listener (e.g. "ADMIN" or custom)
  const [keyBuffer, setKeyBuffer] = useState("");
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if typing in an input
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.isContentEditable
      );
      if (isTyping) return;

      // 2. Secret Sequence Logic
      const newBuffer = (keyBuffer + e.key.toUpperCase()).slice(-10);
      setKeyBuffer(newBuffer);

      // 3. Hotkey Logic (Only if not typing)
      if (settings.admin_hotkeys) {
        const keys = settings.admin_hotkeys.split("+").map(k => k.trim().toLowerCase());
        const isShift = keys.includes("shift");
        const isCtrl = keys.includes("ctrl") || keys.includes("control");
        const targetKey = keys.find(k => !["shift", "ctrl", "control", "alt"].includes(k));

        const matchShift = isShift ? e.shiftKey : true;
        const matchCtrl = isCtrl ? (e.ctrlKey || e.metaKey) : true;
        const matchKey = targetKey ? e.key.toLowerCase() === targetKey : true;

        if (matchShift && matchCtrl && matchKey && targetKey) {
          e.preventDefault();
          navigate("/managepage");
        }
      } else if (e.shiftKey && e.key === "A") {
        e.preventDefault();
        navigate("/managepage");
      }

      // Check for secret word sequence (Fallback/Custom)
      if (newBuffer.endsWith("ADMIN")) {
        navigate("/managepage");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, settings.admin_hotkeys, keyBuffer]);

  useEffect(() => {
    setMounted(true);
    void getCurrentSession().then(session => setIsAdmin(!!session));
    
    const unsubscribe = subscribeToAuthChanges((session) => {
      setIsAdmin(!!session);
    });
    return unsubscribe;
  }, []);

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
        className="glass-navbar border-b border-white/5"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-28">
            <Link 
              to="/" 
              onDoubleClick={() => navigate("/managepage")}
              className="flex items-center gap-3 group"
            >
              <div className="flex items-center justify-center overflow-hidden w-20 h-20 transition-transform duration-500 group-hover:scale-105">
                <AnimatePresence mode="wait">
                  {settings.site_logo ? (
                    <motion.img
                      key="logo-img"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={settings.site_logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <motion.div
                      key="logo-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      className="w-10 h-10 bg-primary/20 rounded-full animate-pulse"
                    />
                  )}
                </AnimatePresence>
              </div>
              <div>
                <div className="font-heading text-xl tracking-tight text-primary font-bold leading-tight">
                  Idyllic Adventures
                </div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-[0.3em] uppercase opacity-80">NEPAL</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-sm font-bold tracking-widest uppercase transition-all duration-300 group ${
                    location.pathname === link.path
                      ? "text-accent"
                      : "text-foreground hover:text-accent"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-accent rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-lg -mx-3" />
                </Link>
              ))}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 hover:bg-muted rounded-full transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

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
            className="md:hidden fixed top-24 left-0 right-0 z-40 glass-panel mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
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
              <div className="flex items-center justify-between gap-4">
                {mounted && (
                  <button
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-4 px-6 bg-muted/50 rounded-2xl flex items-center justify-center gap-3 font-bold"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-5 h-5" /> <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5" /> <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                )}

              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
