import { createClient } from "@supabase/supabase-js";
import { Notice, mockTreks, mockNotices } from "./mockData";

// Disposable email domains list
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'trashmail.com', 'yopmail.com', 'fakeinbox.com',
  'temp-mail.org', 'maildrop.cc', 'sharklasers.com'
]);

export interface SiteSettings {
  [key: string]: string | any;
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

  // Identify which keys actually changed
  const changedKeys = Object.entries(values)
    .filter(([key, value]) => {
      const prev = previousSettings[key];
      return value !== undefined && value !== null && String(value) !== String(prev || "");
    })
    .map(([key]) => key.replace(/_/g, ' ')); // Make them human readable

  let details = "Updated site settings";
  if (changedKeys.length > 0) {
    if (changedKeys.length <= 5) {
      details = `Updated settings: ${changedKeys.join(", ")}`;
    } else {
      details = `Updated ${changedKeys.length} site configuration fields`;
    }
  }

  // Log the action
  await logAdminActivity({
    actionType: "update",
    entityType: "site_settings",
    entityId: "multiple",
    details: details,
    previousData: previousSettings,
    newData: values,
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

  // 1. Try to get from admin_activity_logs first (newer system)
  let { data: log, error: fetchError } = await supabase
    .from("admin_activity_logs")
    .select("*")
    .eq("id", logId)
    .single();

  // Fallback to legacy admin_logs if not found
  if (fetchError || !log) {
    const { data: legacyLog, error: legacyError } = await supabase
      .from("admin_logs")
      .select("*")
      .eq("id", logId)
      .single();
    
    if (legacyError || !legacyLog) throw new Error("Log entry not found");
    log = legacyLog;
  }

  const entityType = log.entity_type;
  const entityId = log.entity_id;
  const previousData = log.previous_data;
  const actionType = log.action_type;

  if (!previousData && actionType !== "create") {
    throw new Error("No previous data available to revert to.");
  }

  // 2. Revert based on type
  if (entityType === "site_settings") {
    await updateSiteSettings(previousData);
  } else if (entityType === "treks") {
    if (actionType === "delete") {
      await createTrek(previousData);
    } else if (actionType === "create") {
      await deleteTrek(entityId);
    } else {
      await updateTrek(entityId, previousData);
    }
  } else if (entityType === "storage") {
    if (log.details.includes("Renamed")) {
      const { name: oldName } = previousData;
      const { name: newName } = log.new_data;
      const bucket = entityId.split("/")[0];
      await renameMediaAsset(bucket, newName, oldName);
    } else if (log.details.includes("Synced")) {
      const { oldUrl, newUrl } = previousData;
      await updateMediaReferences(newUrl, oldUrl);
    }
  } else if (entityType === "notices") {
    if (actionType === "delete") {
      await createNotice(previousData);
    } else if (actionType === "create") {
      await deleteNotice(entityId);
    }
  } else if (entityType === "spam_config") {
    await updateSpamConfig(previousData);
  }

  // 3. Log the revert itself
  await logAdminActivity({
    actionType: "update",
    entityType: entityType,
    entityId: entityId,
    details: `Reverted action: ${log.details}`,
    previousData: log.new_data,
    newData: log.previous_data,
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

export interface Trek {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Difficult" | "Strenuous";
  maxAltitude: string;
  bestSeason: string;
  groupSize: string;
  price: string;
  image: string;
  featured: boolean;
  highlights: string[];
  itinerary: any[];
  gallery: string[];
  sortOrder: number;
  videoUrl: string | null;
  createdAt: string;
}

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
  gallery: string[] | null;
  video_url: string | null;
  sort_order?: number;
  created_at?: string;
}

interface NoticeRecord {
  id: string;
  title: string;
  message: string;
  date: string;
  type: Notice["type"];
  target_page: string;
  expires_at: string | null;
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
  internalNotes: string | null;
  sourcePath: string | null;
  isSpam: boolean;
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
  internal_notes: string | null;
  source_path: string | null;
  is_spam: boolean;
  created_at: string;
}

export async function bulkDeleteInquiries(ids: string[]): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("inquiries").delete().in("id", ids);
  if (error) throw error;
}

export async function bulkUpdateInquiryStatus(ids: string[], status: "new" | "in_progress" | "closed"): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("inquiries").update({ status }).in("id", ids);
  if (error) throw error;
}

function mapTrekRecordToTrek(record: any): Trek {
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
    gallery: record.gallery ?? [],
    sortOrder: record.sort_order || 0,
    videoUrl: record.video_url || null,
    createdAt: record.created_at,
  };
}

function mapTrekToRecord(trek: Trek): any {
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
    gallery: trek.gallery,
    sort_order: trek.sortOrder,
    video_url: trek.videoUrl,
  };
}

function mapNoticeRecordToNotice(record: any): Notice {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    date: record.date,
    type: record.type,
    targetPage: record.target_page || "all",
    expiresAt: record.expires_at || null,
    createdAt: record.created_at,
  };
}

export async function fetchTreks(): Promise<Trek[]> {
  if (!supabase) {
    return mockTreks;
  }

  const { data, error } = await supabase
    .from("treks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Fetch Treks Error:", error);
    return [];
  }

  return (data || []).map(mapTrekRecordToTrek);
}

export async function fetchNotices(includeExpired = false): Promise<Notice[]> {
  if (!supabase) {
    return mockNotices;
  }

  try {
    let query = supabase
      .from("notices")
      .select("*")
      .order("date", { ascending: false });

    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapNoticeRecordToNotice);
  } catch (error) {
    console.error("Fetch Notices Error:", error);
    return [];
  }
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
    await logAdminActivity({
      actionType: "delete",
      entityType: "treks",
      entityId: id,
      details: `Deleted trek: ${previousTrek.title}`,
      previousData: previousTrek,
      newData: null,
    });
  }
}

export async function createTrek(trek: Trek): Promise<void> {
  if (!supabase) {
    return;
  }

  // Probe schema to see which columns exist
  const { data: sample } = await supabase.from("treks").select("*").limit(1);
  const dbFields = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
  
  const fullRecord = mapTrekToRecord(trek);
  const record: any = {};
  
  // Only include fields that exist in the DB
  Object.keys(fullRecord).forEach(key => {
    if (dbFields.length === 0 || dbFields.includes(key)) {
      record[key] = fullRecord[key];
    }
  });

  const { error, data } = await supabase.from("treks").insert(record).select("id").single();
  if (error) {
    throw error;
  }

  await logAdminActivity({
    actionType: "create",
    entityType: "treks",
    entityId: data?.id || trek.id,
    details: `Created new trek: ${trek.title}`,
    previousData: null,
    newData: record,
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

  const dbPayload: any = {};
  
  // Use previousTrek to determine which columns actually exist in the DB
  // This prevents 400 errors if columns like 'gallery' or 'sort_order' are missing
  const dbFields = previousTrek ? Object.keys(previousTrek) : [];
  
  const setIfInDb = (key: any, dbKey: string) => {
    if (key !== undefined && (dbFields.length === 0 || dbFields.includes(dbKey))) {
      dbPayload[dbKey] = key;
    }
  };

  setIfInDb(patch.title, 'title');
  setIfInDb(patch.description, 'description');
  setIfInDb(patch.duration, 'duration');
  setIfInDb(patch.difficulty, 'difficulty');
  setIfInDb(patch.maxAltitude, 'max_altitude');
  setIfInDb(patch.bestSeason, 'best_season');
  setIfInDb(patch.groupSize, 'group_size');
  setIfInDb(patch.price, 'price');
  setIfInDb(patch.image, 'image');
  setIfInDb(patch.featured, 'featured');
  setIfInDb(patch.highlights, 'highlights');
  setIfInDb(patch.itinerary, 'itinerary');
  setIfInDb(patch.gallery, 'gallery');
  setIfInDb(patch.videoUrl, 'video_url');
  setIfInDb(patch.sortOrder, 'sort_order');

  const { error } = await supabase.from("treks").update(dbPayload).eq("id", id);
  if (error) {
    throw error;
  }

  if (previousTrek) {
    await logAdminActivity({
      actionType: "update",
      entityType: "treks",
      entityId: id,
      details: `Updated trek: ${patch.title || previousTrek.title}`,
      previousData: previousTrek,
      newData: dbPayload,
    });
  }
}

export async function updateTrekSortOrder(id: string, sortOrder: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("treks").update({ sort_order: sortOrder }).eq("id", id);
  if (error) throw error;
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
    await logAdminActivity({
      actionType: "delete",
      entityType: "notices",
      entityId: id,
      details: `Deleted notice: ${previousNotice.title}`,
      previousData: previousNotice,
      newData: null,
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
    await logAdminActivity({
      actionType: "update",
      entityType: "notices",
      entityId: id,
      details: `Updated notice: ${noticeUpdate.title || previousNotice.title}`,
      previousData: previousNotice,
      newData: { ...previousNotice, ...noticeUpdate },
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

  await logAdminActivity({
    actionType: "create",
    entityType: "notices",
    entityId: data?.id || "new",
    details: `Created new notice: ${notice.title}`,
    previousData: null,
    newData: notice,
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
  if (index !== -1) {
    const path = imageUrl.substring(index + bucketPrefix.length);
    const { error } = await supabase.storage.from(TREK_IMAGES_BUCKET).remove([path]);
    if (error) throw error;
  }
}

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  bucket: string;
  created_at: string;
  size: number;
};

export async function getAllMedia(): Promise<MediaAsset[]> {
  if (!supabase) return [];
  
  const buckets = [TREK_IMAGES_BUCKET, JOURNAL_IMAGES_BUCKET, GALLERY_IMAGES_BUCKET];
  const allMedia: MediaAsset[] = [];
  const externalUrls = new Set<string>();
  
  // 1. Fetch from buckets
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    
    if (!error && data) {
      for (const file of data) {
        if (file.name !== '.emptyFolderPlaceholder') {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.name);
          allMedia.push({
            id: file.id || `${bucket}-${file.name}`,
            name: file.name,
            url: urlData.publicUrl,
            bucket,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0
          });
          externalUrls.add(urlData.publicUrl);
        }
      }
    }
  }

  // 2. Fetch external URLs from tables
  try {
    const [treksReq, journalReq, galleryReq, settingsReq] = await Promise.all([
      supabase.from("treks").select("image, gallery"),
      supabase.from("journal_entries").select("cover_image"),
      supabase.from("gallery_images").select("url"),
      supabase.from("site_settings").select("value").ilike("key", "%image%")
    ]);

    const maybeAddUrl = (url: string) => {
      if (url && typeof url === 'string' && url.startsWith('http') && !externalUrls.has(url)) {
        externalUrls.add(url);
        const name = url.split('/').pop()?.split('?')[0] || "external-image";
        allMedia.push({
          id: `ext-${Math.random()}`,
          name: name,
          url: url,
          bucket: 'external',
          created_at: new Date().toISOString(),
          size: 0
        });
      }
    };

    treksReq.data?.forEach((row: any) => {
      maybeAddUrl(row.image);
      row.gallery?.forEach((url: string) => maybeAddUrl(url));
    });
    
    journalReq.data?.forEach((row: any) => maybeAddUrl(row.cover_image));
    galleryReq.data?.forEach((row: any) => maybeAddUrl(row.url));
    settingsReq.data?.forEach((row: any) => maybeAddUrl(row.value));

  } catch (err) {
    console.error("Failed to fetch external media from DB:", err);
  }
  
  return allMedia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function renameMediaAsset(bucket: string, oldName: string, newName: string): Promise<void> {
  if (!supabase) return;
  
  const { error } = await supabase.storage.from(bucket).move(oldName, newName);
  if (error) throw error;

  await logAdminActivity({
    actionType: "update",
    entityType: "storage",
    entityId: `${bucket}/${newName}`,
    details: `Renamed media from ${oldName} to ${newName}`,
    previousData: { name: oldName },
    newData: { name: newName }
  });
}

export async function deleteMediaAsset(bucket: string, fileName: string): Promise<void> {
  if (!supabase) return;
  
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  const { error } = await supabase.storage.from(bucket).remove([fileName]);
  if (error) throw error;

  await logAdminActivity({
    actionType: "delete",
    entityType: "storage",
    entityId: `${bucket}/${fileName}`,
    details: `Deleted media: ${fileName}`,
    previousData: { name: fileName, url: urlData.publicUrl },
    newData: null
  });
}

export async function bulkDeleteMediaAssets(assets: Array<{ bucket: string; name: string; url: string }>): Promise<void> {
  if (!supabase || !assets.length) return;

  // Group by bucket to minimize requests
  const buckets = Array.from(new Set(assets.map(a => a.bucket)));
  
  for (const bucket of buckets) {
    const bucketAssets = assets.filter(a => a.bucket === bucket);
    const fileNames = bucketAssets.map(a => a.name);
    
    const { error } = await supabase.storage.from(bucket).remove(fileNames);
    if (error) console.error(`Failed to bulk delete from ${bucket}:`, error);
  }

  await logAdminActivity({
    actionType: "delete",
    entityType: "storage",
    entityId: "bulk",
    details: `Bulk deleted ${assets.length} assets from library`,
    previousData: assets,
    newData: null
  });
}

export async function updateMediaReferences(oldUrl: string, newUrl: string): Promise<void> {
  if (!supabase) return;

  try {
    // 1. Update site_settings
    await supabase.from("site_settings").update({ value: newUrl }).eq("value", oldUrl);

    // 2. Update treks (main image)
    await supabase.from("treks").update({ image: newUrl }).eq("image", oldUrl);

    // 3. Update treks (gallery - JSONB array)
    const { data: treks } = await supabase.from("treks").select("id, gallery");
    if (treks) {
      for (const trek of treks) {
        if (trek.gallery?.includes(oldUrl)) {
          const newGallery = trek.gallery.map((url: string) => url === oldUrl ? newUrl : url);
          await supabase.from("treks").update({ gallery: newGallery }).eq("id", trek.id);
        }
      }
    }

    // 4. Update journal_entries
    await supabase.from("journal_entries").update({ cover_image: newUrl }).eq("cover_image", oldUrl);

    // 5. Update gallery_images
    await supabase.from("gallery_images").update({ url: newUrl }).eq("url", oldUrl);

    await logAdminActivity({
      actionType: "update",
      entityType: "storage",
      entityId: "sync",
      details: `Synced & updated site links: ${oldUrl.split('/').pop()} -> ${newUrl.split('/').pop()}`,
      previousData: { oldUrl, newUrl },
      newData: { oldUrl: newUrl, newUrl: oldUrl }
    });

    console.log(`Successfully updated all references from ${oldUrl} to ${newUrl}`);
  } catch (error) {
    console.error("Failed to update media references:", error);
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

  const { data, error } = await supabase
    .from("website_events")
    .select("*")
    .gte("created_at", from)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Fetch Events Error:", error);
    return [];
  }

  return (data || []).map(record => ({
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
    internalNotes: record.internal_notes || null,
    sourcePath: record.source_path,
    isSpam: record.is_spam || false,
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
    is_spam: spamCheck.isSpam,
    client_ip: ipAddress,
  };

  const { data, error } = await supabase
    .from("inquiries")
    .insert(cleanPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || error.details || "Database insertion failed");
  }

  await logSubmission(ipAddress, data.id, spamCheck.isSpam, spamCheck.reason);
  
  if (spamCheck.isSpam) {
    return "blocked"; // Still return blocked to UI to show "Potential spam" message
  }

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
    console.error("Fetch Inquiries Error:", error);
    return [];
  }

  return (data || []).map(mapInquiryRecordToInquiry);
}

export async function updateInquiryStatus(
  id: string,
  status: "new" | "in_progress" | "closed",
  internalNotes?: string
): Promise<void> {
  if (!supabase) {
    return;
  }

  const updateData: any = { status };
  if (internalNotes !== undefined) {
    updateData.internal_notes = internalNotes;
  }

  const { error } = await supabase.from("inquiries").update(updateData).eq("id", id);
  if (error) {
    throw error;
  }

  // Log the activity
  await logAdminActivity({
    actionType: "update",
    entityType: "inquiry",
    entityId: id,
    details: `Updated inquiry status to ${status}${internalNotes ? ' with notes' : ''}`,
    previousData: null,
    newData: updateData
  });
}

export async function deleteInquiry(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) {
    throw error;
  }

  // Log the activity
  await logAdminActivity({
    actionType: "delete",
    entityType: "inquiry",
    entityId: id,
    details: "Deleted inquiry record",
    previousData: id,
    newData: null
  });
}

export async function unspamInquiry(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("inquiries").update({ is_spam: false }).eq("id", id);
  if (error) throw error;

  await logAdminActivity({
    actionType: "update",
    entityType: "inquiry",
    entityId: id,
    details: "Marked inquiry as not spam (unspammed)",
    previousData: { is_spam: true },
    newData: { is_spam: false }
  });
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
  seoTitle: string | null;
  seoDescription: string | null;
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
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  category: string | null;
  albumName: string;
  isVideo?: boolean;
  videoUrl?: string | null;
  isWatermarked?: boolean;
  createdAt: string;
}

interface GalleryImageRecord {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  category: string | null;
  album_name: string;
  is_video: boolean;
  video_url: string | null;
  is_watermarked: boolean;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  userId: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  previousData?: any | null;
  newData?: any | null;
  createdAt: string;
}

function mapJournalRecordToEntry(record: any): JournalEntry {
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
    seoTitle: record.seo_title,
    seoDescription: record.seo_description,
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
    albumName: record.album_name,
    isVideo: record.is_video,
    videoUrl: record.video_url,
    isWatermarked: record.is_watermarked,
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
  if (error) {
    console.error("Fetch Journal Error:", error);
    return [];
  }

  return (data || []).map(mapJournalRecordToEntry);
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

  const { data, error } = await supabase.from("journal_entries").insert({
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
    seo_title: entry.seoTitle || null,
    seo_description: entry.seoDescription || null,
  }).select("id").single();

  if (error) throw error;

  await logAdminActivity({
    actionType: "create",
    entityType: "journal",
    entityId: data.id,
    details: `Created story: ${entry.title}`,
    previousData: null,
    newData: entry
  });
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
  if (patch.seoTitle !== undefined) {
    updateData.seo_title = patch.seoTitle;
    delete updateData.seoTitle;
  }
  if (patch.seoDescription !== undefined) {
    updateData.seo_description = patch.seoDescription;
    delete updateData.seoDescription;
  }
  if (patch.createdAt !== undefined) delete updateData.createdAt;
  if (patch.updatedAt !== undefined) delete updateData.updatedAt;

  // Get previous state
  const { data: previousEntry } = await supabase.from("journal_entries").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("journal_entries")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;

  await logAdminActivity({
    actionType: "update",
    entityType: "journal",
    entityId: id,
    details: `Updated story: ${patch.title || previousEntry?.title}`,
    previousData: previousEntry,
    newData: { ...previousEntry, ...updateData }
  });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  if (!supabase) return;
  const { data: previousEntry } = await supabase.from("journal_entries").select("*").eq("id", id).single();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) throw error;

  await logAdminActivity({
    actionType: "delete",
    entityType: "journal",
    entityId: id,
    details: `Deleted story: ${previousEntry?.title}`,
    previousData: previousEntry,
    newData: null
  });
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

  if (error) {
    console.error("Fetch Gallery Error:", error);
    return [];
  }
  
  return (data || []).map(mapGalleryRecordToImage);
}

export async function addGalleryImage(image: Omit<GalleryImage, "id" | "createdAt">): Promise<void> {
  if (!supabase) return;

  const { data, error } = await supabase.from("gallery_images").insert({
    title: image.title,
    description: image.description,
    url: image.url,
    category: image.category,
    album_name: image.albumName,
    is_video: image.isVideo || false,
    video_url: image.videoUrl || null,
    is_watermarked: image.isWatermarked || false,
  }).select("id").single();

  if (error) throw error;

  await logAdminActivity({
    actionType: "create",
    entityType: "gallery",
    entityId: data.id,
    details: `Added media: ${image.title}`,
    previousData: null,
    newData: image
  });
}

export async function bulkDeleteGalleryImages(ids: string[]): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("gallery_images").delete().in("id", ids);
  if (error) throw error;

  await logAdminActivity({
    actionType: "delete",
    entityType: "gallery",
    entityId: "multiple",
    details: `Bulk deleted ${ids.length} media items`,
    previousData: ids,
    newData: null
  });
}

export async function updateGalleryImage(id: string, patch: Partial<GalleryImage>): Promise<void> {
  if (!supabase) return;
  const record: any = { ...patch };
  if (patch.albumName) {
    record.album_name = patch.albumName;
    delete record.albumName;
  }
  const { data: previousImage } = await supabase.from("gallery_images").select("*").eq("id", id).single();
  const { error } = await supabase.from("gallery_images").update(record).eq("id", id);
  if (error) throw error;

  await logAdminActivity({
    actionType: "update",
    entityType: "gallery",
    entityId: id,
    details: `Updated media: ${patch.title || previousImage?.title}`,
    previousData: previousImage,
    newData: { ...previousImage, ...record }
  });
}

export async function deleteGalleryImage(id: string): Promise<void> {
  if (!supabase) return;
  const { data: previousImage } = await supabase.from("gallery_images").select("*").eq("id", id).single();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) throw error;

  await logAdminActivity({
    actionType: "delete",
    entityType: "gallery",
    entityId: id,
    details: `Deleted media: ${previousImage?.title}`,
    previousData: previousImage
  });
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

// Admin Activity Logging
export async function logAdminActivity(activity: Omit<AdminActivityLog, "id" | "createdAt" | "userId">): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id || "admin";

    const { error } = await supabase.from("admin_activity_logs").insert({
      user_id: userId,
      action_type: activity.actionType,
      entity_type: activity.entityType,
      entity_id: activity.entityId,
      details: activity.details,
      previous_data: activity.previousData,
      new_data: activity.newData
    });
    
    if (error) {
      console.warn("Could not save to admin_activity_logs, falling back to legacy log:", error.message);
      // Fallback to legacy admin_logs if the new table fails (e.g. schema issues)
      await supabase.from("admin_logs").insert({
        action_type: activity.actionType,
        entity_type: activity.entityType,
        entity_id: activity.entityId,
        details: activity.details,
        previous_data: activity.previousData,
        new_data: activity.newData,
        user_id: userId
      });
    }
  } catch (error) {
    console.error("Failed to log admin activity:", error);
    // Don't rethrow, logging shouldn't break the main flow
  }
}

export async function fetchAdminActivityLogs(limit = 100): Promise<AdminActivityLog[]> {
  if (!supabase) return [];
  
  // 1. Fetch from newer detailed logs
  const { data: activeData, error: activeError } = await supabase
    .from("admin_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  // 2. Fetch from legacy simple logs
  const { data: legacyData, error: legacyError } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const combined: AdminActivityLog[] = [];

  // Map active logs
  if (activeData) {
    activeData.forEach(record => {
      combined.push({
        id: record.id,
        userId: record.user_id,
        actionType: record.action_type,
        entityType: record.entity_type,
        entityId: record.entity_id,
        details: record.details,
        previousData: record.previous_data,
        newData: record.new_data,
        createdAt: record.created_at,
      });
    });
  }

  // Map legacy logs (if they aren't already represented or just as extra history)
  if (legacyData) {
    legacyData.forEach(record => {
      // Avoid duplicates if the same action was logged in both systems (unlikely but safe)
      if (!combined.some(l => l.details === record.details && Math.abs(new Date(l.createdAt).getTime() - new Date(record.created_at).getTime()) < 1000)) {
        combined.push({
          id: record.id,
          userId: record.user_id || "admin",
          actionType: record.action_type,
          entityType: record.entity_type,
          entityId: record.entity_id,
          details: record.details,
          previousData: record.previous_data,
          newData: record.new_data,
          createdAt: record.created_at,
        });
      }
    });
  }

  // Sort combined logs by time
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Simple demo logs fallback if NO real history exists in either table
  if (combined.length === 0) {
    const now = Date.now();
    return [
      { id: "demo-1", userId: "admin", actionType: "update", entityType: "site_settings", entityId: "branding", details: "Updated site tagline to 'Explore. Experience. Enjoy.'", createdAt: new Date(now - 1000 * 60 * 5).toISOString() },
      { id: "demo-2", userId: "admin", actionType: "update", entityType: "treks", entityId: "ebc-1", details: "Updated Everest Base Camp Trek price & availability", createdAt: new Date(now - 1000 * 60 * 60 * 1).toISOString() },
      { id: "demo-3", userId: "admin", actionType: "create", entityType: "notices", entityId: "n-1", details: "Created seasonal maintenance notice", createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString() },
      { id: "demo-4", userId: "admin", actionType: "update", entityType: "guide", entityId: "narayan", details: "Updated founder's expertise tags & bio", createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString() },
      { id: "demo-5", userId: "admin", actionType: "update", entityType: "site_settings", entityId: "home", details: "Refreshed home page hero image & title", createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
      { id: "demo-6", userId: "admin", actionType: "delete", entityType: "treks", entityId: "old-1", details: "Archived discontinued Langtang Solo Trek", createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
      { id: "demo-7", userId: "admin", actionType: "update", entityType: "site_settings", entityId: "contact", details: "Updated primary office phone number", createdAt: new Date(now - 1000 * 60 * 60 * 72).toISOString() },
      { id: "demo-8", userId: "admin", actionType: "create", entityType: "notices", entityId: "n-2", details: "Posted Annapurna weather advisory", createdAt: new Date(now - 1000 * 60 * 60 * 96).toISOString() },
      { id: "demo-9", userId: "admin", actionType: "update", entityType: "treks", entityId: "abc-1", details: "Optimized Annapurna Base Camp itinerary", createdAt: new Date(now - 1000 * 60 * 60 * 120).toISOString() },
      { id: "demo-10", userId: "admin", actionType: "update", entityType: "site_settings", entityId: "seo", details: "Improved SEO keywords for higher search visibility", createdAt: new Date(now - 1000 * 60 * 60 * 150).toISOString() },
    ] as AdminActivityLog[];
  }

  return combined.slice(0, limit);
}

export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.maintenance_mode === "true";
}

/**
 * Advanced System Helpers
 */

export async function downloadSiteBackup(): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  
  try {
    const tables = [
      "treks", 
      "journal_entries", 
      "notices", 
      "gallery_images", 
      "inquiries", 
      "site_settings",
      "admin_logs",
      "admin_activity_logs",
      "spam_config"
    ];
    
    const backup: Record<string, any> = {
      version: "2.1",
      timestamp: new Date().toISOString(),
      data: {}
    };

    const results = await Promise.all(tables.map(table => supabase!.from(table).select("*")));
    
    tables.forEach((table, i) => {
      backup.data[table] = results[i].data || [];
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idyllic-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header] === null || row[header] === undefined ? "" : String(row[header]);
        return `"${cell.replace(/"/g, '""')}"`;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
