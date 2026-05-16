import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { WebsiteAnalyticsTracker } from "../WebsiteAnalyticsTracker";
import { MaintenancePage } from "../../pages/MaintenancePage";
import { Outlet, useLocation } from "react-router";
import ScrollToTop from "../ScrollToTop";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { useNotices } from "../../data/useRealtimeData";
import { useBranding } from "../../data/useBranding";
import { FloatingAction } from "../ui/FloatingAction";
import { SmoothScroll } from "../ui/SmoothScroll";
import { ThemeProvider } from "next-themes";
import { Toaster } from "../ui/sonner";
import { useState, useEffect } from "react";
import { CursorFollower } from "../ui/CursorFollower";
import { MountainLine } from "../ui/MountainLine";
import { Preloader } from "../ui/Preloader";

export function RootLayout() {
  const { notices = [] } = useNotices() || {};
  const { settings } = useBranding() || {};
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  
  const isGlobalMaintenance = settings?.maintenance_mode === "true";
  const maintenancePages = (settings?.maintenance_pages || "").toLowerCase().split(",").map((p: string) => p.trim());
  
  const currentPath = location.pathname.split("/")[1] || "home";
  const isAdminPath = location.pathname.startsWith("/managepage");
  
  const isMaintenance = !isAdminPath && (isGlobalMaintenance || maintenancePages.includes(currentPath));

  // Filter notices by expiry and target page
  const activeNotices = settings?.notices_paused === "true" ? [] : (notices || []).filter(n => {
    if (!n) return false;
    const isExpired = n.expiresAt && new Date(n.expiresAt) < new Date();
    if (isExpired) return false;
    
    if (n.targetPage && n.targetPage !== "all") {
      const currentPath = location.pathname.split("/")[1] || "home";
      return n.targetPage === currentPath;
    }
    return true;
  });

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  if (isMaintenance) {
    return <MaintenancePage />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="idyllic-theme">
      {/* Preloader stays on top until it exits itself */}
      <Preloader onComplete={() => setShowContent(true)} />
      
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
            className="min-h-screen flex flex-col"
          >
            {!isAdminPath && <CursorFollower />}
            {!isAdminPath && <MountainLine />}
            <ScrollToTop />
            <SmoothScroll />
            <WebsiteAnalyticsTracker />
            
            <motion.div
              className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-white to-accent z-[9999] origin-left shadow-[0_2px_15px_rgba(245,158,11,0.6)] pointer-events-none"
              style={{ scaleX: smoothProgress }}
            />
            
            <div className="fixed top-0 left-0 right-0 z-50">
              <Navigation />
              
              {activeNotices.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className={`text-white py-2.5 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                    activeNotices[0].type === "warning" ? "bg-amber-500" : 
                    activeNotices[0].type === "success" ? "bg-emerald-500" : 
                    "bg-accent"
                  }`}
                >
                  <div className="container mx-auto flex items-center justify-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="truncate">{activeNotices[0].message}</span>
                  </div>
                </motion.div>
              )}
            </div>

            <main className={`flex-grow ${
              activeNotices.length > 0 
                ? "mt-[150px] md:mt-36" 
                : "mt-[90px] md:mt-24"
            }`}>
              <Outlet />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingAction />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
