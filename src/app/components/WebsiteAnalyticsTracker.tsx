import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    
    // EXCLUDE ADMIN PATHS BUT ALLOW HOME PAGE
    if (path.startsWith("/managepage/dashboard") || path.startsWith("/managepage/analytics")) return;

    // Track page view immediately
    console.log("📡 Tracking Signal: Page View ->", path);
    void trackWebsiteEvent("page_view", path);

    // Reliable 30s heartbeat
    const interval = setInterval(() => {
      console.log("💓 Tracking Signal: Pulse ->", path);
      void trackWebsiteEvent("stay", path, 30);
    }, 30000);

    return () => clearInterval(interval);
  }, [location.pathname, location.search]);

  return null;
}
