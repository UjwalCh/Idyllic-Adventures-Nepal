import { useEffect } from "react";
import { useSiteSettings } from "./useRealtimeData";

/**
 * Custom hook to manage dynamic branding (Favicon & SEO Title)
 */
export function useBranding() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Dynamic SEO Updates
    if (settings.seo_title) {
      // For Admin paths, we might want a prefix, but for public it's direct
      const isManagePage = window.location.pathname.includes("/managepage");
      if (isManagePage) {
        document.title = `Admin | ${settings.seo_title}`;
      } else {
        document.title = settings.seo_title;
      }
    }

    // Dynamic Favicon - Works globally
    if (settings.site_logo) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.site_logo;
    }

    // Meta Description & Keywords (SEO)
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    if (settings.seo_description) updateMeta("description", settings.seo_description);
    if (settings.seo_keywords) updateMeta("keywords", settings.seo_keywords);
    
  }, [settings]);

  return { settings };
}
