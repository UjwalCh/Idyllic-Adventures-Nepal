import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    void trackWebsiteEvent("page_view", path);

    // Heartbeat to track duration (every 30 seconds)
    let secondsSpent = 0;
    const interval = setInterval(() => {
      secondsSpent += 30;
      void trackWebsiteEvent("stay", path, 30);
    }, 30000);

    return () => clearInterval(interval);
  }, [location.pathname, location.search]);

  return null;
}
