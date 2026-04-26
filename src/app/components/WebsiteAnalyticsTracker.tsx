import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path.startsWith("/managepage")) return;

    // Direct Tracking Fire
    void trackWebsiteEvent("page_view", path);

    // Progressive Heartbeat
    // 10s for the first minute, 30s thereafter
    let count = 0;
    const pulse = setInterval(() => {
      count++;
      const interval = count <= 6 ? 10 : 30;
      void trackWebsiteEvent("stay", path, interval);
      
      // If we crossed the threshold, we need to reset the interval
      if (count === 6) {
        clearInterval(pulse);
        startLongPulse();
      }
    }, 10000);

    const startLongPulse = () => {
      setInterval(() => {
        void trackWebsiteEvent("stay", path, 30);
      }, 30000);
    };

    return () => {
      clearInterval(pulse);
    };
  }, [location.pathname, location.search]);

  return null;
}
