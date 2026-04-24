import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchSubmissionLogs,
  getSiteSettings,
  getSpamConfig,
  updateSiteSettings,
  updateSpamConfig,
  type SiteSettings,
  type SpamConfig,
} from "../../data/supabaseData";

const SITE_SETTING_FIELDS: Array<{ key: string; label: string; multiline?: boolean; placeholder?: string }> = [
  { key: "location", label: "Location" },
  { key: "phone_1", label: "Phone 1" },
  { key: "phone_2", label: "Phone 2" },
  { key: "email_main", label: "Main Email" },
  { key: "email_booking", label: "Booking Email" },
  { key: "whatsapp_number", label: "WhatsApp Number" },
  { key: "nav_brand_name", label: "Navigation Brand Name" },
  { key: "nav_brand_tagline", label: "Navigation Brand Tagline" },
  { key: "home_hero_badge", label: "Home Hero Badge" },
  { key: "home_hero_title_line1", label: "Home Hero Title Line 1" },
  { key: "home_hero_title_line2", label: "Home Hero Title Line 2" },
  { key: "home_hero_description", label: "Home Hero Description", multiline: true },
  { key: "home_featured_title", label: "Home Featured Section Title" },
  { key: "home_featured_subtitle", label: "Home Featured Section Subtitle", multiline: true },
  { key: "home_cta_title", label: "Home Bottom CTA Title" },
  { key: "home_cta_description", label: "Home Bottom CTA Description", multiline: true },
  { key: "home_cta_button_label", label: "Home Bottom CTA Button Label" },
  { key: "about_hero_title", label: "About Hero Title" },
  { key: "about_hero_description", label: "About Hero Description", multiline: true },
  { key: "about_story_title", label: "About Story Section Title" },
  { key: "about_values_title", label: "About Values Section Title" },
  { key: "about_values_subtitle", label: "About Values Section Subtitle", multiline: true },
  { key: "about_guide_title", label: "About Guide Section Title" },
  { key: "about_guide_subtitle", label: "About Guide Section Subtitle", multiline: true },
  { key: "contact_hero_title", label: "Contact Hero Title" },
  { key: "contact_hero_description", label: "Contact Hero Description", multiline: true },
  { key: "footer_description", label: "Footer Description", multiline: true },
];

type SubmissionLog = {
  id: string;
  ip_address: string;
  flagged: boolean;
  spam_reason: string | null;
  created_at: string;
};

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingSpam, setSavingSpam] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [spamConfig, setSpamConfig] = useState<SpamConfig | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [logs, setLogs] = useState<SubmissionLog[]>([]);

  const blockedCount24h = useMemo(() => logs.filter((item) => item.flagged).length, [logs]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, spamData, logsData] = await Promise.all([
        getSiteSettings(),
        getSpamConfig(),
        fetchSubmissionLogs(24),
      ]);

      setSiteSettings(settingsData);
      setSpamConfig(spamData);
      setKeywordInput((spamData?.blocked_keywords ?? []).join(", "));
      setLogs(logsData as SubmissionLog[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load settings";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const updateField = (key: string, value: string) => {
    setSiteSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSite = async () => {
    setSavingSite(true);
    try {
      await updateSiteSettings(siteSettings);
      toast.success("Content settings updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save content settings";
      toast.error(message);
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveSpam = async () => {
    if (!spamConfig) return;

    setSavingSpam(true);
    try {
      const keywords = keywordInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await updateSpamConfig({
        ...spamConfig,
        blocked_keywords: keywords,
      });

      toast.success("Spam protection settings updated");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save spam settings";
      toast.error(message);
    } finally {
      setSavingSpam(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-heading text-3xl mb-2">Content and Security Settings</h1>
        <p className="text-sm text-muted-foreground">Manage editable page text, contact information, WhatsApp details, and anti-spam rules.</p>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl">Editable Site Content</h2>
            <p className="text-sm text-muted-foreground">Updates apply instantly on public pages through realtime settings reads.</p>
          </div>
          <button
            onClick={handleSaveSite}
            disabled={savingSite}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
          >
            {savingSite ? "Saving..." : "Save Content"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SITE_SETTING_FIELDS.map((field) => (
            <div key={field.key} className={field.multiline ? "md:col-span-2" : ""}>
              <label className="mb-1 block text-sm text-muted-foreground">{field.label}</label>
              {field.multiline ? (
                <textarea
                  value={siteSettings[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  value={siteSettings[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl">Anti-Spam and Rate-Limit Rules</h2>
            <p className="text-sm text-muted-foreground">Rate limit is fixed at 1 submission per IP per hour and 5 per IP per day.</p>
          </div>
          <button
            onClick={handleSaveSpam}
            disabled={savingSpam || !spamConfig}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
          >
            {savingSpam ? "Saving..." : "Save Spam Rules"}
          </button>
        </div>

        {spamConfig ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={spamConfig.enabled}
                  onChange={(e) => setSpamConfig((prev) => (prev ? { ...prev, enabled: e.target.checked } : prev))}
                />
                Enable spam scoring checks
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={spamConfig.use_honeypot}
                  onChange={(e) => setSpamConfig((prev) => (prev ? { ...prev, use_honeypot: e.target.checked } : prev))}
                />
                Enable honeypot trap field
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={spamConfig.check_disposable_emails}
                  onChange={(e) => setSpamConfig((prev) => (prev ? { ...prev, check_disposable_emails: e.target.checked } : prev))}
                />
                Block disposable email domains
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={spamConfig.check_url_limit}
                  onChange={(e) => setSpamConfig((prev) => (prev ? { ...prev, check_url_limit: e.target.checked } : prev))}
                />
                Check too many URLs in message
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Blocked Keywords (comma separated)</label>
                <textarea
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
                  placeholder="viagra, casino, forex"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Max URLs allowed per message</label>
                <input
                  type="number"
                  min={0}
                  value={spamConfig.max_urls_allowed}
                  onChange={(e) => setSpamConfig((prev) => (prev ? { ...prev, max_urls_allowed: Number(e.target.value) || 0 } : prev))}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">No spam config found. Run schema migration first.</div>
        )}
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl mb-1">Submission Security Logs (24h)</h2>
        <p className="text-sm text-muted-foreground mb-4">Recent submit attempts with spam/rate-limit flags.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase text-muted-foreground">Total submissions</div>
            <div className="text-2xl font-semibold">{logs.length}</div>
          </div>
          <div className="rounded-lg bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase text-muted-foreground">Blocked / flagged</div>
            <div className="text-2xl font-semibold">{blockedCount24h}</div>
          </div>
          <div className="rounded-lg bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase text-muted-foreground">Allowed</div>
            <div className="text-2xl font-semibold">{logs.length - blockedCount24h}</div>
          </div>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-auto">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">IP: {log.ip_address}</span>
                <span className={log.flagged ? "text-red-600" : "text-emerald-600"}>{log.flagged ? "Blocked" : "Allowed"}</span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
              {log.spam_reason ? <div className="text-xs mt-1 text-muted-foreground">Reason: {log.spam_reason}</div> : null}
            </div>
          ))}
          {!logs.length ? <div className="text-sm text-muted-foreground">No submissions logged yet.</div> : null}
        </div>
      </motion.section>
    </div>
  );
}
