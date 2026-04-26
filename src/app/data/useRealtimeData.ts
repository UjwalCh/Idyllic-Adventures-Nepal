import { useCallback, useEffect, useState } from "react";
import { Notice, Trek, mockNotices, mockTreks } from "./mockData";
import {
  fetchInquiries,
  getSiteSettings,
  fetchWebsiteEvents,
  fetchNotices,
  fetchTreks,
  Inquiry,
  isSupabaseConfigured,
  SiteSettings,
  subscribeToInquiries,
  subscribeToNotices,
  subscribeToSiteSettings,
  subscribeToTreks,
  subscribeToWebsiteEvents,
  WebsiteEvent,
  fetchJournalEntries,
  fetchGalleryImages,
  subscribeToJournal,
  subscribeToGallery,
  fetchAdminLogs,
  JournalEntry,
  GalleryImage,
  AdminLog,
} from "./supabaseData";

export function useTreks() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadTreks = useCallback(async () => {
    try {
      const data = await fetchTreks();
      setTreks(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch treks";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTreks();
    const unsubscribe = subscribeToTreks(() => {
      void loadTreks();
    });
    return unsubscribe;
  }, [loadTreks]);

  return { treks, loading, error, refresh: loadTreks };
}

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      const data = await fetchNotices();
      setNotices(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch notices";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
    const unsubscribe = subscribeToNotices(() => {
      void loadNotices();
    });
    return unsubscribe;
  }, [loadNotices]);

  return { notices, loading, error, refresh: loadNotices };
}

export function useWebsiteAnalytics(hours = 24) {
  const [events, setEvents] = useState<WebsiteEvent[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchWebsiteEvents(hours);
      setEvents(data);
      setError(null);
      return { events: data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch website analytics";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void loadEvents();
    const unsubscribe = subscribeToWebsiteEvents(() => {
      void loadEvents();
    });
    return unsubscribe;
  }, [loadEvents]);

  return { events, loading, error, refresh: loadEvents };
}

export function useInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    try {
      const data = await fetchInquiries();
      setInquiries(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch inquiries";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
    const unsubscribe = subscribeToInquiries(() => {
      void loadInquiries();
    });
    return unsubscribe;
  }, [loadInquiries]);

  return { inquiries, loading, error, refresh: loadInquiries };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("idyllic_site_settings");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return {};
        }
      }
    }
    return {};
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async (force = false) => {
    try {
      const data = await getSiteSettings(force);
      setSettings(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("idyllic_site_settings", JSON.stringify(data));
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch site settings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    const unsubscribe = subscribeToSiteSettings(() => {
      void loadSettings(true);
    });
    return unsubscribe;
  }, [loadSettings]);

  return { settings, loading, error, refresh: loadSettings };
}

export function useJournal(onlyPublished = true) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const data = await fetchJournalEntries(onlyPublished);
      if (data.length > 0) {
        setEntries(data);
      } else {
        // Fallback to mock data for a better "WOW" factor if DB is empty
        const { mockJournalEntries } = await import("./mockData");
        setEntries(mockJournalEntries.filter(e => !onlyPublished || e.published));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch journal entries");
    } finally {
      setLoading(false);
    }
  }, [onlyPublished]);

  useEffect(() => {
    void loadEntries();
    const unsubscribe = subscribeToJournal(() => {
      void loadEntries();
    });
    return unsubscribe;
  }, [loadEntries]);

  return { entries, loading, error, refresh: loadEntries };
}

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    try {
      const data = await fetchGalleryImages();
      setImages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gallery images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
    const unsubscribe = subscribeToGallery(() => {
      void loadImages();
    });
    return unsubscribe;
  }, [loadImages]);

  return { images, loading, error, refresh: loadImages };
}

export function useAdminLogs(limit = 50) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchAdminLogs(limit);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch admin logs");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void loadLogs();
    // For simplicity, we'll just poll or rely on manual refresh for logs
    // since they aren't critical for real-time visitor experience
  }, [loadLogs]);

  return { logs, loading, error, refresh: loadLogs };
}