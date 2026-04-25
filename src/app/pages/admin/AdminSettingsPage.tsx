import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchSubmissionLogs,
  getSiteSettings,
  getSpamConfig,
  updateSiteSettings,
  updateSpamConfig,
  uploadImage,
  revertAdminAction,
  TREK_IMAGES_BUCKET,
  type SiteSettings,
  type SpamConfig,
  type AdminLog,
} from "../../data/supabaseData";
import { useAdminLogs } from "../../data/useRealtimeData";
import { 
  Upload, 
  Loader2, 
  Camera, 
  Info, 
  Layout, 
  ShieldCheck, 
  Globe, 
  History, 
  Save, 
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Image as ImageIcon,
  Undo2,
  AlertCircle
} from "lucide-react";

const TABS = [
  { id: "general", label: "General & Brand", icon: Info },
  { id: "home", label: "Home Page", icon: Layout },
  { id: "about", label: "About & Guide", icon: Info },
  { id: "other", label: "Other Pages", icon: Globe },
  { id: "security", label: "Security & Logs", icon: ShieldCheck },
  { id: "activity", label: "Activity Log", icon: History },
];

const SITE_SETTING_CATEGORIES = [
  {
    id: "general",
    category: "General Information",
    sections: [
      {
        title: "Branding",
        fields: [
          { key: "nav_brand_name", label: "Brand Name", placeholder: "e.g. Idyllic Adventures" },
          { key: "nav_brand_tagline", label: "Tagline", placeholder: "e.g. Explore Nepal" },
          { key: "site_logo", label: "Site Logo URL", isImage: true },
        ]
      },
      {
        title: "Contact Details",
        fields: [
          { key: "location", label: "Office Location", icon: MapPin },
          { key: "phone_1", label: "Primary Phone", icon: Phone },
          { key: "phone_2", label: "Secondary Phone", icon: Phone },
          { key: "email_main", label: "Main Email", icon: Mail },
          { key: "email_booking", label: "Booking Email", icon: Mail },
          { key: "whatsapp_number", label: "WhatsApp Number", placeholder: "+977..." },
        ]
      },
      {
        title: "Social Links",
        fields: [
          { key: "social_facebook", label: "Facebook URL", icon: Facebook },
          { key: "social_instagram", label: "Instagram URL", icon: Instagram },
          { key: "social_twitter", label: "Twitter URL", icon: Twitter },
          { key: "social_youtube", label: "YouTube URL", icon: Youtube },
          { key: "footer_description", label: "Footer Bio / Description", multiline: true },
        ]
      }
    ]
  },
  {
    id: "home",
    category: "Home Page Content",
    sections: [
      {
        title: "Hero Section",
        fields: [
          { key: "home_hero_image", label: "Hero Background Image", isImage: true },
          { key: "home_hero_badge", label: "Hero Badge Text", placeholder: "e.g. Experience of a Lifetime" },
          { key: "home_hero_title_line1", label: "Title Line 1" },
          { key: "home_hero_title_line2", label: "Title Line 2" },
          { key: "home_hero_description", label: "Short Description", multiline: true },
        ]
      },
      {
        title: "Performance Stats",
        fields: [
          { key: "home_stats_years", label: "Years of Experience" },
          { key: "home_stats_trekkers", label: "Happy Trekkers Count" },
          { key: "home_stats_guides", label: "Expert Guides Count" },
        ]
      },
      {
        title: "Sections & CTA",
        fields: [
          { key: "home_featured_title", label: "Featured Section Title" },
          { key: "home_featured_subtitle", label: "Featured Section Subtitle", multiline: true },
          { key: "home_cta_title", label: "Bottom CTA Title" },
          { key: "home_cta_description", label: "Bottom CTA Description", multiline: true },
          { key: "home_cta_button_label", label: "Bottom CTA Button Text" },
        ]
      }
    ]
  },
  {
    id: "about",
    category: "About Page & Guide",
    sections: [
      {
        title: "Hero & Story",
        fields: [
          { key: "about_hero_image", label: "About Hero Image", isImage: true },
          { key: "about_hero_title", label: "Hero Title" },
          { key: "about_hero_description", label: "Hero Description", multiline: true },
          { key: "about_story_title", label: "Story Title" },
          { key: "about_story_description", label: "Our Story Text", multiline: true },
          { key: "about_story_image", label: "Story Image", isImage: true },
        ]
      },
      {
        title: "Values Section",
        fields: [
          { key: "about_values_title", label: "Values Title" },
          { key: "about_values_subtitle", label: "Values Subtitle", multiline: true },
        ]
      },
      {
        title: "Meet the Guide",
        fields: [
          { key: "about_guide_title", label: "Guide Section Heading" },
          { key: "about_guide_subtitle", label: "Section Subheading", multiline: true },
          { key: "about_guide_image", label: "Guide Photo", isImage: true },
          { key: "about_guide_name", label: "Full Name" },
          { key: "about_guide_role", label: "Role / Title" },
          { key: "about_guide_experience", label: "Experience Details" },
        ]
      }
    ]
  },
  {
    id: "other",
    category: "Other Pages",
    sections: [
      {
        title: "Contact Page",
        fields: [
          { key: "contact_hero_image", label: "Contact Hero Image", isImage: true },
          { key: "contact_hero_title", label: "Hero Title" },
          { key: "contact_hero_description", label: "Hero Description", multiline: true },
        ]
      },
      {
        title: "Treks Page",
        fields: [
          { key: "treks_hero_image", label: "Treks Hero Image", isImage: true },
          { key: "treks_hero_title", label: "Hero Title" },
          { key: "treks_hero_description", label: "Hero Description", multiline: true },
        ]
      }
    ]
  }
];

type SubmissionLog = {
  id: string;
  ip_address: string;
  flagged: boolean;
  spam_reason: string | null;
  created_at: string;
};

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingSpam, setSavingSpam] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [spamConfig, setSpamConfig] = useState<SpamConfig | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [logs, setLogs] = useState<SubmissionLog[]>([]);
  const { logs: adminLogs, refresh: refreshAdminLogs } = useAdminLogs(50);
  const [isReverting, setIsReverting] = useState<string | null>(null);

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
      toast.error("Failed to load settings");
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

  const handleImageUpload = async (key: string, file: File) => {
    try {
      toast.loading("Uploading image...", { id: "upload" });
      const publicUrl = await uploadImage(file, TREK_IMAGES_BUCKET);
      updateField(key, publicUrl);
      toast.success("Image uploaded!", { id: "upload" });
    } catch (err) {
      toast.error("Upload failed", { id: "upload" });
    }
  };

  const handleSaveSite = async () => {
    setSavingSite(true);
    try {
      await updateSiteSettings(siteSettings);
      toast.success("All site content updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveSpam = async () => {
    if (!spamConfig) return;
    setSavingSpam(true);
    try {
      const keywords = keywordInput.split(",").map((item) => item.trim()).filter(Boolean);
      await updateSpamConfig({ ...spamConfig, blocked_keywords: keywords });
      toast.success("Security settings updated");
      await loadAll();
    } catch (error) {
      toast.error("Failed to save security settings");
    } finally {
      setSavingSpam(false);
    }
  };

  const handleRevert = async (logId: string) => {
    setIsReverting(logId);
    try {
      await revertAdminAction(logId);
      toast.success("Action reverted successfully!");
      await Promise.all([loadAll(), refreshAdminLogs()]);
    } catch (error) {
      toast.error("Failed to revert action");
    } finally {
      setIsReverting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-heading text-4xl text-primary mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your website content, branding, and security.</p>
        </div>
        {activeTab !== "security" && (
          <button
            onClick={handleSaveSite}
            disabled={savingSite}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {savingSite ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Save All Changes</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-muted-foreground hover:text-primary hover:bg-white/50"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-accent" : ""}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "security" ? (
            <div className="space-y-8">
              <div className="glass-panel p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-heading text-2xl">Spam Protection</h2>
                    <p className="text-sm text-muted-foreground">Configure how the system handles inquiries.</p>
                  </div>
                  <button
                    onClick={handleSaveSpam}
                    disabled={savingSpam}
                    className="px-6 py-2 bg-accent text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {savingSpam ? "Saving..." : "Update Security"}
                  </button>
                </div>

                {spamConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {[
                      { key: "enabled", label: "Enable Spam Scoring" },
                      { key: "use_honeypot", label: "Use Honeypot Trap" },
                      { key: "check_disposable_emails", label: "Block Temp Emails" },
                      { key: "check_url_limit", label: "Enforce URL Limit" },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-accent transition-colors cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-md border-border text-accent focus:ring-accent"
                          checked={(spamConfig as any)[opt.key]}
                          onChange={(e) => setSpamConfig({ ...spamConfig, [opt.key]: e.target.checked })}
                        />
                        <span className="font-medium group-hover:text-primary transition-colors">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Blocked Keywords</label>
                    <textarea
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none min-h-[100px]"
                      placeholder="Enter keywords separated by commas (e.g. crypto, casino, help)"
                    />
                  </div>
                  {spamConfig && (
                    <div>
                      <label className="block text-sm font-bold mb-2">Max URLs per message</label>
                      <input
                        type="number"
                        value={spamConfig.max_urls_allowed}
                        onChange={(e) => setSpamConfig({ ...spamConfig, max_urls_allowed: Number(e.target.value) })}
                        className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none max-w-[200px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-heading text-2xl flex items-center gap-3">
                      <History className="w-6 h-6 text-accent" />
                      Security Logs
                    </h2>
                    <p className="text-sm text-muted-foreground">Recent submission attempts and blocks (last 24h).</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4">
                      <div className="text-2xl font-bold text-red-500">{blockedCount24h}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Blocked</div>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div className="text-center px-4">
                      <div className="text-2xl font-bold text-emerald-500">{logs.length - blockedCount24h}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Allowed</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${log.flagged ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                        <div>
                          <div className="font-bold text-sm">IP: {log.ip_address}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      {log.spam_reason && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">{log.spam_reason}</div>
                      )}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground italic">No logs found for the last 24 hours.</div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "activity" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-heading text-3xl">Activity History</h2>
                  <p className="text-muted-foreground">Track all administrative changes and revert if needed.</p>
                </div>
                <button 
                  onClick={() => void refreshAdminLogs()}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <History className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {adminLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${
                        log.action_type === "create" ? "bg-emerald-500/10 text-emerald-500" :
                        log.action_type === "delete" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {log.action_type === "create" ? <ImageIcon className="w-6 h-6" /> :
                         log.action_type === "delete" ? <AlertCircle className="w-6 h-6" /> :
                         <Layout className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg capitalize">{log.action_type} {log.entity_type.replace("_", " ")}</div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded-md text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => void handleRevert(log.id)}
                      disabled={isReverting === log.id}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl font-bold transition-all border border-primary/10 disabled:opacity-50"
                    >
                      {isReverting === log.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Undo2 className="w-4 h-4" />
                      )}
                      Undo Change
                    </button>
                  </motion.div>
                ))}
                
                {adminLogs.length === 0 && (
                  <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                    <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No activity recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {SITE_SETTING_CATEGORIES.find(c => c.id === activeTab)?.sections.map((section, sIdx) => (
                <div key={section.title} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="font-heading text-2xl">{section.title}</h2>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {section.fields.map((field) => {
                      const value = siteSettings[field.key] || "";
                      return (
                        <div key={field.key} className={`${field.multiline ? "md:col-span-2" : ""} group`}>
                          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-muted-foreground group-focus-within:text-accent transition-colors">
                            {field.icon && <field.icon className="w-4 h-4" />}
                            {field.label}
                          </label>
                          
                          {field.isImage ? (
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                              <div className="relative w-full md:w-64 aspect-video rounded-3xl bg-muted border border-border overflow-hidden group/img">
                                {value ? (
                                  <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-[10px] font-bold uppercase">No Image</span>
                                  </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                  <Camera className="w-10 h-10 text-white" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) void handleImageUpload(field.key, file);
                                    }}
                                  />
                                </label>
                              </div>
                              <div className="flex-1 w-full">
                                <input
                                  value={value}
                                  onChange={(e) => updateField(field.key, e.target.value)}
                                  className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none text-sm"
                                  placeholder="Paste Image URL or upload →"
                                />
                                <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest px-2">Image URL for {field.label}</p>
                              </div>
                            </div>
                          ) : field.multiline ? (
                            <textarea
                              value={value}
                              onChange={(e) => updateField(field.key, e.target.value)}
                              rows={4}
                              className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
                              placeholder={field.placeholder || `Enter ${field.label}...`}
                            />
                          ) : (
                            <div className="relative">
                              <input
                                value={value}
                                onChange={(e) => updateField(field.key, e.target.value)}
                                className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
                                placeholder={field.placeholder || `Enter ${field.label}...`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Sticky Mobile/Desktop Save Hint */}
      <div className="fixed bottom-8 right-8 z-50 md:hidden">
        <button
          onClick={handleSaveSite}
          disabled={savingSite}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-accent transition-all"
        >
          {savingSite ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
