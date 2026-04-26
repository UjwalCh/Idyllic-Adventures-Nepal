import { createClient } from "@supabase/supabase-js";
import { Trek, Notice, mockTreks, mockNotices } from "./mockData";

// Disposable email domains list
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'trashmail.com', 'yopmail.com', 'fakeinbox.com',
  'temp-mail.org', 'maildrop.cc', 'sharklasers.com'
]);

export interface SiteSettings {
  [key: string]: string;
}

export interface AdminLog {
  id: string;
  action_type: "create" | "update" | "delete" | "toggle";
  entity_type: "site_settings" | "treks" | "notices" | "spam_config" | "journal" | "gallery";
  entity_id: string;
  details: string;
  previous_data: any;
  new_data: any;
  created_at: string;
}

export interface SpamConfig {
  name: string;
  blocked_keywords: string[];
  max_urls_allowed: number;
  check_disposable_emails: boolean;
  use_honeypot: boolean;
  enabled: boolean;
  check_url_limit: boolean;
}

// Get site settings from cache or database
let settingsCache: SiteSettings | null = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSiteSettings(forceRefresh = false): Promise<SiteSettings> {
  const now = Date.now();
  if (!forceRefresh && settingsCache && now - settingsCacheTime < SETTINGS_CACHE_DURATION) {
    return settingsCache;
  }

  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error) throw error;

    const settings: SiteSettings = {};
    (data as Array<{ key: string; value: string }>).forEach(row => {
      settings[row.key] = row.value;
    });

    settingsCache = settings;
    settingsCacheTime = now;
    return settings;
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    return {};
  }
}

export async function updateSiteSettings(values: Record<string, string | undefined | null>): Promise<void> {
  if (!supabase) return;

  // Get current settings for logging
  const previousSettings = await getSiteSettings();

  const rows = Object.entries(values)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      key: key.trim(),
      value: String(value).trim(),
    }));

  if (!rows.length) return;

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    console.error("Supabase Settings Error:", error);
    throw error;
  }

  // Log the action
  await logAdminAction({
    action_type: "update",
    entity_type: "site_settings",
    entity_id: "multiple",
    details: `Updated site settings: ${Object.keys(values).join(", ")}`,
    previous_data: previousSettings,
    new_data: values,
  });

  settingsCache = null;
  settingsCacheTime = 0;
}

export function subscribeToSiteSettings(onChange: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("site-settings-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// Get spam config
let spamConfigCache: SpamConfig | null = null;
let spamConfigCacheTime = 0;
const SPAM_CONFIG_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getSpamConfig(): Promise<SpamConfig | null> {
  const now = Date.now();
  if (spamConfigCache && now - spamConfigCacheTime < SPAM_CONFIG_CACHE_DURATION) {
    return spamConfigCache;
  }

  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('spam_config')
      .select('*')
      .eq('name', 'default')
      .single();

    if (error) {
      console.warn('No spam config found:', error);
      return null;
    }

    spamConfigCache = data as SpamConfig;
    spamConfigCacheTime = now;
    return data as SpamConfig;
  } catch (error) {
    console.error('Failed to fetch spam config:', error);
    return null;
  }
}

export async function updateSpamConfig(config: Partial<SpamConfig>): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("spam_config")
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq("name", "default");

  if (error) {
    throw error;
  }

  spamConfigCache = null;
  spamConfigCacheTime = 0;
}

export async function fetchSubmissionLogs(hours = 24): Promise<Array<{ id: string; ip_address: string; flagged: boolean; spam_reason: string | null; created_at: string }>> {
  if (!supabase) return [];

  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("submission_logs")
    .select("id, ip_address, flagged, spam_reason, created_at")
    .gte("created_at", from)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{ id: string; ip_address: string; flagged: boolean; spam_reason: string | null; created_at: string }>;
}

// Get client IP address
function getClientIP(): string {
  if (typeof window === 'undefined') return 'unknown';
  // This is a simplified version - in production, you'd use headers from server
  return (window as any).__CLIENT_IP__ || 'unknown';
}

// Check if email is valid
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is from disposable domain
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

// Count URLs in text
function countURLs(text: string): number {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches.length : 0;
}

// Check rate limit for IP
export async function checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!supabase) return { allowed: true };

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check submissions in last hour
    const { data: hourData, error: hourError } = await supabase
      .from('submission_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (hourError) throw hourError;
    if ((hourData?.length ?? 0) >= 3) {
      return { allowed: false, reason: 'You have reached the submission limit for this hour. Please try again in a while.' };
    }

    // Check submissions in last 24 hours
    const { data: dayData, error: dayError } = await supabase
      .from('submission_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneDayAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (dayError) throw dayError;
    if ((dayData?.length ?? 0) >= 10) {
      return { allowed: false, reason: 'Maximum daily submissions exceeded. Please try again tomorrow.' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    return { allowed: true }; // Allow on error to not block users
  }
}

// Check for spam
export async function checkSpam(formData: {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
}): Promise<{ isSpam: boolean; reason?: string }> {
  const spamConfig = await getSpamConfig();
  if (!spamConfig || !spamConfig.enabled) {
    return { isSpam: false };
  }

  // Check honeypot
  if (spamConfig.use_honeypot && formData.honeypot) {
    return { isSpam: true, reason: 'Honeypot field detected' };
  }

  // Check email validity
  if (!isValidEmail(formData.email)) {
    return { isSpam: true, reason: 'Invalid email format' };
  }

  // Check disposable email
  if (spamConfig.check_disposable_emails && isDisposableEmail(formData.email)) {
    return { isSpam: true, reason: 'Disposable email not allowed' };
  }

  const combinedText = `${formData.name} ${formData.message}`.toLowerCase();

  // Check blocked keywords
  if (spamConfig.blocked_keywords && spamConfig.blocked_keywords.length > 0) {
    for (const keyword of spamConfig.blocked_keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return { isSpam: true, reason: `Blocked keyword detected: ${keyword}` };
      }
    }
  }

  // Check URL count
  const urlCount = countURLs(formData.message);
  if (spamConfig.check_url_limit && urlCount > spamConfig.max_urls_allowed) {
    return { isSpam: true, reason: `Too many URLs (max: ${spamConfig.max_urls_allowed})` };
  }

  return { isSpam: false };
}

// Log submission
export async function logSubmission(
  ipAddress: string,
  inquiryId: string | null,
  flagged: boolean = false,
  spamReason?: string
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('submission_logs').insert({
      ip_address: ipAddress,
      inquiry_id: inquiryId,
      flagged,
      spam_reason: spamReason,
    });
  } catch (error) {
    console.error('Failed to log submission:', error);
  }
}
// Admin Logging System
export async function logAdminAction(log: Omit<AdminLog, "id" | "created_at">): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("admin_logs").insert(log);
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

export async function fetchAdminLogs(limit = 50): Promise<AdminLog[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AdminLog[];
}

export async function revertAdminAction(logId: string): Promise<void> {
  if (!supabase) return;

  // 1. Get the log entry
  const { data: log, error: fetchError } = await supabase
    .from("admin_logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (fetchError || !log) throw new Error("Log entry not found");

  const { entity_type, entity_id, previous_data, action_type } = log as AdminLog;

  // 2. Revert based on type
  if (entity_type === "site_settings") {
    await updateSiteSettings(previous_data);
  } else if (entity_type === "treks") {
    if (action_type === "delete") {
      await createTrek(previous_data);
    } else if (action_type === "create") {
      await deleteTrek(entity_id);
    } else {
      await updateTrek(entity_id, previous_data);
    }
  } else if (entity_type === "notices") {
    if (action_type === "delete") {
      await createNotice(previous_data);
    } else if (action_type === "create") {
      await deleteNotice(entity_id);
    }
  } else if (entity_type === "spam_config") {
    await updateSpamConfig(previous_data);
  }

  // 3. Log the revert itself
  await logAdminAction({
    action_type: "update",
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    details: `Reverted action: ${log.details}`,
    previous_data: log.new_data,
    new_data: log.previous_data,
  });
}

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const TREK_IMAGES_BUCKET = "trek-images";
export const JOURNAL_IMAGES_BUCKET = "journal-images";
export const GALLERY_IMAGES_BUCKET = "gallery-images";

interface TrekRecord {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: Trek["difficulty"];
  max_altitude: string;
  best_season: string;
  group_size: string;
  price: string;
  image: string;
  featured: boolean;
  highlights: string[] | null;
  itinerary: Trek["itinerary"] | null;
  created_at?: string;
}

interface NoticeRecord {
  id: string;
  title: string;
  message: string;
  date: string;
  type: Notice["type"];
  created_at?: string;
}

export interface WebsiteEvent {
  id: string;
  eventType: "page_view" | "cta_click" | "stay" | "debug_error";
  path: string;
  referrer: string | null;
  referrerSource: "Search" | "Social" | "Direct" | "Referral";
  userAgent: string | null;
  sessionId: string;
  duration?: number;
  country: string | null;
  region: string | null;
  city: string | null;
  countryCode: string | null;
  locationLabel: string | null;
  createdAt: string;
}

interface WebsiteEventRecord {
  id: string;
  event_type: "page_view" | "cta_click" | "stay" | "debug_error";
  path: string;
  referrer: string | null;
  referrer_source: string;
  user_agent: string | null;
  session_id: string;
  duration?: number;
  country: string | null;
  region: string | null;
  city: string | null;
  country_code: string | null;
  location_label: string | null;
  created_at: string;
}

interface VisitorLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  countryCode: string | null;
  locationLabel: string | null;
  timezone?: string | null;
}

interface IpApiResponse {
  country_name?: string;
  country?: string;
  region?: string;
  city?: string;
  country_code?: string;
  timezone?: string;
}

const VISITOR_LOCATION_CACHE_KEY = "idyllic_visitor_location";
let visitorLocationPromise: Promise<VisitorLocation | null> | null = null;

export interface Inquiry {
  id: string;
  inquiryType: "booking" | "contact" | "inquiry";
  status: "new" | "in_progress" | "closed";
  name: string;
  email: string;
  phone: string | null;
  trek: string | null;
  peopleCount: number | null;
  preferredDate: string | null;
  message: string;
  sourcePath: string | null;
  createdAt: string;
}

interface InquiryRecord {
  id: string;
  inquiry_type: "booking" | "contact" | "inquiry";
  status: "new" | "in_progress" | "closed";
  name: string;
  email: string;
  phone: string | null;
  trek: string | null;
  people_count: number | null;
  preferred_date: string | null;
  message: string;
  source_path: string | null;
  created_at: string;
}

function mapTrekRecordToTrek(record: TrekRecord): Trek {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    duration: record.duration,
    difficulty: record.difficulty,
    maxAltitude: record.max_altitude,
    bestSeason: record.best_season,
    groupSize: record.group_size,
    price: record.price,
    image: record.image,
    featured: record.featured,
    highlights: record.highlights ?? [],
    itinerary: record.itinerary ?? [],
  };
}

function mapTrekToRecord(trek: Trek): Omit<TrekRecord, "created_at"> {
  return {
    id: trek.id,
    title: trek.title,
    description: trek.description,
    duration: trek.duration,
    difficulty: trek.difficulty,
    max_altitude: trek.maxAltitude,
    best_season: trek.bestSeason,
    group_size: trek.groupSize,
    price: trek.price,
    image: trek.image,
    featured: trek.featured,
    highlights: trek.highlights,
    itinerary: trek.itinerary,
  };
}

function mapNoticeRecordToNotice(record: NoticeRecord): Notice {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    date: record.date,
    type: record.type,
  };
}

export async function fetchTreks(): Promise<Trek[]> {
  if (!supabase) {
    return mockTreks;
  }

  const { data, error } = await supabase
    .from("treks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as TrekRecord[]).map(mapTrekRecordToTrek);
}

export async function fetchNotices(): Promise<Notice[]> {
  if (!supabase) {
    return mockNotices;
  }

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as NoticeRecord[]).map(mapNoticeRecordToNotice);
}

export function subscribeToTreks(onChange: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("treks-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "treks" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToNotices(onChange: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("notices-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notices" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function toggleFeaturedTrek(
  id: string,
  featured: boolean
): Promise<void> {
  if (!supabase) {
    return;
  }

  // Get previous state
  const { data: previousTrek } = await supabase.from("treks").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("treks")
    .update({ featured })
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (previousTrek) {
    await logAdminAction({
      action_type: "update",
      entity_type: "treks",
      entity_id: id,
      details: `Toggled featured status to ${featured} for trek: ${previousTrek.title}`,
      previous_data: previousTrek,
      new_data: { ...previousTrek, featured },
    });
  }
}

export async function deleteTrek(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  // Get current trek for logging
  const { data: previousTrek } = await supabase.from("treks").select("*").eq("id", id).single();

  const { error } = await supabase.from("treks").delete().eq("id", id);
  if (error) {
    throw error;
  }

  if (previousTrek) {
    await logAdminAction({
      action_type: "delete",
      entity_type: "treks",
      entity_id: id,
      details: `Deleted trek: ${previousTrek.title}`,
      previous_data: previousTrek,
      new_data: null,
    });
  }
}

export async function createTrek(trek: Trek): Promise<void> {
  if (!supabase) {
    return;
  }

  const record = mapTrekToRecord(trek);
  const { error } = await supabase.from("treks").insert(record);
  if (error) {
    throw error;
  }

  await logAdminAction({
    action_type: "create",
    entity_type: "treks",
    entity_id: trek.id,
    details: `Created new trek: ${trek.title}`,
    previous_data: null,
    new_data: record,
  });
}

export async function updateTrek(
  id: string,
  patch: Partial<Omit<Trek, "id">>
): Promise<void> {
  if (!supabase) {
    return;
  }

  // Get previous trek for logging
  const { data: previousTrek } = await supabase.from("treks").select("*").eq("id", id).single();

  const payload: Partial<Omit<TrekRecord, "id" | "created_at">> = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.duration !== undefined) payload.duration = patch.duration;
  if (patch.difficulty !== undefined) payload.difficulty = patch.difficulty;
  if (patch.maxAltitude !== undefined) payload.max_altitude = patch.maxAltitude;
  if (patch.bestSeason !== undefined) payload.best_season = patch.bestSeason;
  if (patch.groupSize !== undefined) payload.group_size = patch.groupSize;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.image !== undefined) payload.image = patch.image;
  if (patch.featured !== undefined) payload.featured = patch.featured;
  if (patch.highlights !== undefined) payload.highlights = patch.highlights;
  if (patch.itinerary !== undefined) payload.itinerary = patch.itinerary;

  const { error } = await supabase.from("treks").update(payload).eq("id", id);
  if (error) {
    throw error;
  }

  if (previousTrek) {
    await logAdminAction({
      action_type: "update",
      entity_type: "treks",
      entity_id: id,
      details: `Updated trek: ${patch.title || previousTrek.title}`,
      previous_data: previousTrek,
      new_data: payload,
    });
  }
}

export async function deleteNotice(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  // Get previous notice
  const { data: previousNotice } = await supabase.from("notices").select("*").eq("id", id).single();

  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) {
    throw error;
  }

  if (previousNotice) {
    await logAdminAction({
      action_type: "delete",
      entity_type: "notices",
      entity_id: id,
      details: `Deleted notice: ${previousNotice.title}`,
      previous_data: previousNotice,
      new_data: null,
    });
  }
}

export async function updateNotice(id: string, noticeUpdate: Partial<Omit<Notice, "id">>): Promise<void> {
  if (!supabase) return;

  // Get previous notice
  const { data: previousNotice } = await supabase.from("notices").select("*").eq("id", id).single();

  const { error } = await supabase.from("notices").update(noticeUpdate).eq("id", id);
  if (error) throw error;

  if (previousNotice) {
    await logAdminAction({
      action_type: "update",
      entity_type: "notices",
      entity_id: id,
      details: `Updated notice: ${noticeUpdate.title || previousNotice.title}`,
      previous_data: previousNotice,
      new_data: { ...previousNotice, ...noticeUpdate },
    });
  }
}

export async function createNotice(
  notice: Omit<Notice, "id">
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase.from("notices").insert(notice).select().single();
  if (error) {
    throw error;
  }

  await logAdminAction({
    action_type: "create",
    entity_type: "notices",
    entity_id: data?.id || "new",
    details: `Created new notice: ${notice.title}`,
    previous_data: null,
    new_data: notice,
  });
}

export async function uploadTrekImage(file: File): Promise<string> {
  return uploadImage(file, TREK_IMAGES_BUCKET);
}

export async function uploadImage(file: File, bucket: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteStoredTrekImage(imageUrl: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const bucketPrefix = `/storage/v1/object/public/${TREK_IMAGES_BUCKET}/`;
  const index = imageUrl.indexOf(bucketPrefix);

  if (index === -1) {
    return;
  }

  const path = imageUrl.slice(index + bucketPrefix.length);
  const { error } = await supabase.storage.from(TREK_IMAGES_BUCKET).remove([path]);
  if (error) {
    throw error;
  }
}



function getSessionId(): string {
  if (typeof window === "undefined") return "server-side";

  const key = "idyllic_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  // Robust universal ID generation
  let newId: string;
  try {
    newId = crypto.randomUUID();
  } catch (e) {
    newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
    
  try {
    window.localStorage.setItem(key, newId);
  } catch (e) {
    // Fallback for private modes where localStorage is disabled
    return `temp-${Date.now()}`;
  }
  return newId;
}

function normalizeLocationPart(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

function buildLocationLabel(country: string | null, region: string | null, city: string | null): string | null {
  const parts = [city, region, country].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(", ") : null;
}

async function loadVisitorLocation(): Promise<VisitorLocation | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = window.sessionStorage.getItem(VISITOR_LOCATION_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as VisitorLocation;
    }
  } catch {
    window.sessionStorage.removeItem(VISITOR_LOCATION_CACHE_KEY);
  }

  if (visitorLocationPromise) {
    return visitorLocationPromise;
  }

  visitorLocationPromise = (async () => {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 2500) : null;

    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller?.signal,
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as IpApiResponse;
      const country = normalizeLocationPart(data.country_name ?? data.country);
      const region = normalizeLocationPart(data.region);
      const city = normalizeLocationPart(data.city);
      const countryCode = normalizeLocationPart(data.country_code)?.toUpperCase() ?? null;
      const timezone = data.timezone ?? null;
      
      const location: VisitorLocation = {
        country,
        region,
        city,
        countryCode,
        timezone,
        locationLabel: buildLocationLabel(country, region, city),
      };

      try {
        window.sessionStorage.setItem(VISITOR_LOCATION_CACHE_KEY, JSON.stringify(location));
      } catch {
        // Ignore storage failures and fall back to best-effort tracking.
      }

      return location;
    } catch {
      return null;
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  })();

  return visitorLocationPromise;
}

export async function trackWebsiteEvent(
  eventType: "page_view" | "cta_click" | "stay",
  path: string,
  duration?: number
): Promise<void> {
  if (!supabase || typeof window === "undefined") return;

  try {
    const trimmedPath = path.trim().slice(0, 300);
    const referrer = document.referrer || null;
    const userAgent = navigator.userAgent;
    
    // Non-blocking location lookup
    // We fire the insert and don't wait for the location if it's not already cached
    const cachedLoc = window.sessionStorage.getItem(VISITOR_LOCATION_CACHE_KEY);
    const loc = cachedLoc ? JSON.parse(cachedLoc) : null;

    const eventData = {
      event_type: eventType,
      path: trimmedPath,
      referrer,
      referrer_source: getReferrerSource(referrer),
      user_agent: userAgent,
      session_id: getSessionId(),
      duration: duration ?? null,
      country: loc?.country || "Global",
      region: loc?.region || "UTC",
      city: loc?.city || "Unknown",
      country_code: loc?.countryCode || null,
      location_label: loc?.timezone || loc?.locationLabel || null,
    };

    // If we don't have location yet, fire it off in the background to cache for NEXT events
    if (!loc) {
      void loadVisitorLocation();
    }

    const { error } = await supabase.from("website_events").insert(eventData);
    if (error) {
      // Log to console but don't crash
      console.warn("Tracking silenced by DB:", error.message);
    }
  } catch (e) {
    // Silent fail to keep site performance high
    console.warn("Analytics standby mode.");
  }
}

function getReferrerSource(referrer: string | null): "Search" | "Social" | "Direct" | "Referral" {
  if (!referrer) return "Direct";
  const refLower = referrer.toLowerCase();
  if (refLower.includes("google") || refLower.includes("bing") || refLower.includes("yahoo") || refLower.includes("duckduckgo")) {
    return "Search";
  } else if (refLower.includes("facebook") || refLower.includes("instagram") || refLower.includes("t.co") || refLower.includes("linkedin") || refLower.includes("whatsapp")) {
    return "Social";
  }
  return "Referral";
}

export async function fetchWebsiteEvents(hours = 24): Promise<WebsiteEvent[]> {
  if (!supabase) {
    return [];
  }

  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // First try to fetch with all columns (new version)
  const { data, error } = await supabase
    .from("website_events")
    .select("*")
    .gte("created_at", from)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  return (data as any[]).map(record => ({
    id: record.id,
    eventType: record.event_type,
    path: record.path,
    referrer: record.referrer,
    referrerSource: record.referrer_source || "Direct",
    userAgent: record.user_agent,
    sessionId: record.session_id,
    duration: record.duration,
    country: record.country || record.location_label?.split(",").pop()?.trim() || null,
    region: record.region || null,
    city: record.city || null,
    countryCode: record.country_code || null,
    locationLabel: record.location_label || "Legacy Data",
    createdAt: record.created_at,
  }));
}

function mapWebsiteEventRecordToEvent(record: WebsiteEventRecord): WebsiteEvent {
  return {
    id: record.id,
    eventType: record.event_type,
    path: record.path,
    referrer: record.referrer,
    referrerSource: record.referrer_source as any,
    userAgent: record.user_agent,
    sessionId: record.session_id,
    duration: record.duration,
    country: record.country,
    region: record.region,
    city: record.city,
    countryCode: record.country_code,
    locationLabel: record.location_label,
    createdAt: record.created_at,
  };
}

export function subscribeToWebsiteEvents(onChange: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("website-events-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "website_events" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function mapInquiryRecordToInquiry(record: InquiryRecord): Inquiry {
  return {
    id: record.id,
    inquiryType: record.inquiry_type,
    status: record.status,
    name: record.name,
    email: record.email,
    phone: record.phone,
    trek: record.trek,
    peopleCount: record.people_count,
    preferredDate: record.preferred_date,
    message: record.message,
    sourcePath: record.source_path,
    createdAt: record.created_at,
  };
}

export async function createInquiry(payload: {
  inquiryType: "booking" | "contact" | "inquiry";
  name: string;
  email: string;
  phone?: string;
  trek?: string;
  peopleCount?: number;
  preferredDate?: string;
  message: string;
  sourcePath?: string;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const cleanPayload = {
    inquiry_type: payload.inquiryType,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || null,
    trek: payload.trek?.trim() || null,
    people_count:
      typeof payload.peopleCount === "number" && Number.isFinite(payload.peopleCount)
        ? payload.peopleCount
        : null,
    preferred_date: payload.preferredDate || null,
    message: payload.message.trim(),
    source_path: payload.sourcePath?.trim().slice(0, 300) || null,
  };

  const { error } = await supabase.from("inquiries").insert(cleanPayload);
  if (error) {
    throw error;
  }
}

export async function createInquiryWithValidation(payload: {
  inquiryType: "booking" | "contact" | "inquiry";
  name: string;
  email: string;
  phone?: string;
  trek?: string;
  peopleCount?: number;
  preferredDate?: string;
  message: string;
  sourcePath?: string;
  honeypot?: string;
  clientIp: string;
}): Promise<"submitted" | "blocked"> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const ipAddress = payload.clientIp.trim() || "unknown";
  const rateLimit = await checkRateLimit(ipAddress);
  if (!rateLimit.allowed) {
    await logSubmission(ipAddress, null, true, rateLimit.reason);
    throw new Error(rateLimit.reason ?? "Rate limit reached.");
  }

  const spamCheck = await checkSpam({
    name: payload.name,
    email: payload.email,
    message: payload.message,
    honeypot: payload.honeypot,
  });

  if (spamCheck.isSpam) {
    await logSubmission(ipAddress, null, true, spamCheck.reason);
    return "blocked";
  }

  const cleanPayload = {
    inquiry_type: payload.inquiryType,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || null,
    trek: payload.trek?.trim() || null,
    people_count:
      typeof payload.peopleCount === "number" && Number.isFinite(payload.peopleCount)
        ? payload.peopleCount
        : null,
    preferred_date: payload.preferredDate || null,
    message: payload.message.trim(),
    source_path: payload.sourcePath?.trim().slice(0, 300) || null,
  };

  const { data, error } = await supabase
    .from("inquiries")
    .insert(cleanPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || error.details || "Database insertion failed");
  }

  await logSubmission(ipAddress, data.id, false);
  return "submitted";
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  return (data as InquiryRecord[]).map(mapInquiryRecordToInquiry);
}

export async function updateInquiryStatus(
  id: string,
  status: "new" | "in_progress" | "closed"
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) {
    throw error;
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export function subscribeToInquiries(onChange: () => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("inquiries-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inquiries" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  category: string | null;
  published: boolean;
  authorName: string | null;
  authorRole: string | null;
  authorBio: string | null;
  authorImage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JournalEntryRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  category: string | null;
  published: boolean;
  author_name: string | null;
  author_role: string | null;
  author_bio: string | null;
  author_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  category: string | null;
  createdAt: string;
}

interface GalleryImageRecord {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  category: string | null;
  created_at: string;
}

function mapJournalRecordToEntry(record: JournalEntryRecord): JournalEntry {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    content: record.content,
    excerpt: record.excerpt,
    image: record.image,
    category: record.category,
    published: record.published,
    authorName: record.author_name,
    authorRole: record.author_role,
    authorBio: record.author_bio,
    authorImage: record.author_image,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapGalleryRecordToImage(record: GalleryImageRecord): GalleryImage {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    url: record.url,
    category: record.category,
    createdAt: record.created_at,
  };
}

export async function fetchJournalEntries(onlyPublished = true): Promise<JournalEntry[]> {
  if (!supabase) return [];

  let query = supabase.from("journal_entries").select("*").order("created_at", { ascending: false });

  if (onlyPublished) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as JournalEntryRecord[]).map(mapJournalRecordToEntry);
}

export async function fetchJournalEntryBySlug(slug: string): Promise<JournalEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return mapJournalRecordToEntry(data as JournalEntryRecord);
}

export async function createJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("journal_entries").insert({
    title: entry.title,
    slug: entry.slug,
    content: entry.content,
    excerpt: entry.excerpt,
    image: entry.image,
    category: entry.category,
    published: entry.published,
    author_name: entry.authorName,
    author_role: entry.authorRole,
    author_bio: entry.authorBio,
    author_image: entry.authorImage,
  });

  if (error) throw error;
}

export async function updateJournalEntry(id: string, patch: Partial<JournalEntry>): Promise<void> {
  if (!supabase) return;

  const updateData: any = { ...patch };
  
  // Map camelCase to snake_case and remove original keys to avoid DB errors
  if (patch.authorName !== undefined) {
    updateData.author_name = patch.authorName;
    delete updateData.authorName;
  }
  if (patch.authorRole !== undefined) {
    updateData.author_role = patch.authorRole;
    delete updateData.authorRole;
  }
  if (patch.authorBio !== undefined) {
    updateData.author_bio = patch.authorBio;
    delete updateData.authorBio;
  }
  if (patch.authorImage !== undefined) {
    updateData.author_image = patch.authorImage;
    delete updateData.authorImage;
  }
  if (patch.createdAt !== undefined) delete updateData.createdAt;
  if (patch.updatedAt !== undefined) delete updateData.updatedAt;

  const { error } = await supabase
    .from("journal_entries")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToJournal(onChange: () => void): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("journal-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "journal_entries" }, onChange)
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

export async function fetchGalleryImages(): Promise<GalleryImage[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as GalleryImageRecord[]).map(mapGalleryRecordToImage);
}

export async function addGalleryImage(image: Omit<GalleryImage, "id" | "createdAt">): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("gallery_images").insert({
    title: image.title,
    description: image.description,
    url: image.url,
    category: image.category,
  });

  if (error) throw error;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToGallery(onChange: () => void): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("gallery-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "gallery_images" }, onChange)
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

/**
 * Verifies if the required storage buckets exist and attempts to create them if possible.
 * Returns a list of buckets that are missing or inaccessible.
 */
export async function checkAndSetupStorage(): Promise<{
  missing: string[];
  errors: Record<string, string>;
}> {
  if (!supabase) return { missing: [], errors: {} };

  const requiredBuckets = [TREK_IMAGES_BUCKET, JOURNAL_IMAGES_BUCKET, GALLERY_IMAGES_BUCKET];
  const missing: string[] = [];
  const errors: Record<string, string> = {};

  for (const bucket of requiredBuckets) {
    try {
      const { data: bucketData, error: getError } = await supabase.storage.getBucket(bucket);
      
      // If we can see the bucket, it's fine
      if (bucketData) continue;

      // If we get an error, check if it's because it's missing (404)
      // Note: Supabase storage errors sometimes come in different shapes
      const errorMsg = getError?.message?.toLowerCase() || "";
      const isMissing = errorMsg.includes("not found") || (getError as any)?.status === 404;

      if (isMissing) {
        // Attempt to create it (will only work if service role or specific RLS allow it)
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });

        if (createError) {
          missing.push(bucket);
          errors[bucket] = createError.message;
        }
      } else if (getError) {
        // It's a permission error or something else, but the bucket likely exists
        // console.warn(`Storage check for ${bucket} returned: ${getError.message}`);
      }
    } catch (err: any) {
      // Catch-all, but don't alarm if it's just a permission issue
      if (err.message?.toLowerCase().includes("not found")) {
        missing.push(bucket);
      }
    }
  }

  return { missing, errors };
}