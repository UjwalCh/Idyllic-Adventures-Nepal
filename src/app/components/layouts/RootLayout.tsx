import { Outlet } from "react-router";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { WebsiteAnalyticsTracker } from "../WebsiteAnalyticsTracker";
import ScrollToTop from "../ScrollToTop";
import { motion, useScroll } from "motion/react";
import { useNotices } from "../../data/useRealtimeData";
import { useBranding } from "../../data/useBranding";
import { FloatingAction } from "../ui/FloatingAction";
import { ThemeProvider } from "next-themes";
import { Toaster } from "../ui/sonner";
import { useEffect } from "react";

export function RootLayout() {
  const { notices } = useNotices();
  const { settings } = useBranding();

  const { scrollYProgress } = useScroll();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="idyllic-theme">
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <WebsiteAnalyticsTracker />
        
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-accent z-[60] origin-left"
          style={{ scaleX: scrollYProgress }}
        />
        
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
          
          {notices.length > 0 && (
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="bg-accent text-accent-foreground py-2 px-4 text-center text-sm font-medium"
            >
              <div className="container mx-auto flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                {notices[0].message}
              </div>
            </motion.div>
          )}
        </div>

        <main className={`flex-grow ${notices.length > 0 ? "mt-40" : "mt-28"}`}>
          <Outlet />
        </main>
        <Footer />
        <FloatingAction />
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
