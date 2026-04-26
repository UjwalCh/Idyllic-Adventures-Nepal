import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path.includes("/managepage/")) return;

    const track = async () => {
      try {
        await trackWebsiteEvent("page_view", path);
      } catch (e: any) {
        // Emergency Signal: Log the error so we can see it on the admin panel
        void trackWebsiteEvent("debug_error", path, 0, e.message || "Unknown error");
      }
    };

    void track();

    const pulse = setInterval(() => {
      void trackWebsiteEvent("stay", path, 30);
    }, 30000);

    return () => clearInterval(pulse);
  }, [location.pathname, location.search]);

  return null;
}
