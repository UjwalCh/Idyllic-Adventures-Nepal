import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    
    // EXCLUDE ADMIN PATHS from analytics to keep data clean for customers
    if (path.startsWith("/managepage")) {
      return;
    }

    // Track every page view for real visitors
    void trackWebsiteEvent("page_view", path);

    // Initial heartbeats for high-accuracy live tracking
    const timeouts = [
      setTimeout(() => void trackWebsiteEvent("stay", path, 10), 10000),
      setTimeout(() => void trackWebsiteEvent("stay", path, 30), 30000),
    ];

    // Sustained heartbeat every 60 seconds
    const interval = setInterval(() => {
      void trackWebsiteEvent("stay", path, 60);
    }, 60000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [location.pathname, location.search]);

  return null;
}
