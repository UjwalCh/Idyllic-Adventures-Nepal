import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path.includes("/managepage/")) return;

    // Direct Tracking Fire
    void trackWebsiteEvent("page_view", path);

    // Lean Heartbeat (30s)
    const pulse = setInterval(() => {
      void trackWebsiteEvent("stay", path, 30);
    }, 30000);

    return () => clearInterval(pulse);
  }, [location.pathname, location.search]);

  return null;
}
