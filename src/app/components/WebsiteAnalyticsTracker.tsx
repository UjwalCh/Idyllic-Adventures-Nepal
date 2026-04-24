import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackWebsiteEvent } from "../data/supabaseData";

export function WebsiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    void trackWebsiteEvent("page_view", path);
  }, [location.pathname, location.search]);

  return null;
}
