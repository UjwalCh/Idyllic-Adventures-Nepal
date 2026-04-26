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
  ArrowRight,
  Monitor,
  Image as ImageIcon,
  Settings,
  Undo2,
  Layout as LayoutIcon,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  AlertCircle,
  Lock,
} from "lucide-react";

const TABS = [
  { id: "general", label: "General & Brand", icon: Info },
  { id: "home", label: "Home Page", icon: Layout },
  { id: "about", label: "About & Guide", icon: Info },
  { id: "other", label: "Other Pages", icon: Layout },
  { id: "seo", label: "SEO & Meta", icon: Globe },
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
          { key: "home_stats_years_label", label: "Years Label" },
          { key: "home_stats_years", label: "Years Value" },
          { key: "home_stats_trekkers_label", label: "Trekkers Label" },
          { key: "home_stats_trekkers", label: "Trekkers Value" },
          { key: "home_stats_guides_label", label: "Guides Label" },
          { key: "home_stats_guides", label: "Guides Value" },
          { key: "home_stats_safety_label", label: "Performance Label (e.g. Safety First)" },
          { key: "home_stats_safety", label: "Performance Value (e.g. 100%)" },
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
    id: "seo",
    category: "Search Engine Optimization",
    sections: [
      {
        title: "Site-wide SEO",
        fields: [
          { key: "seo_title", label: "Main Site Title", placeholder: "e.g. Idyllic Adventures Nepal - Trekking Specialists" },
          { key: "seo_description", label: "Meta Description", multiline: true, placeholder: "Describe your site for Google search results..." },
          { key: "seo_keywords", label: "Keywords", placeholder: "trekking, nepal, himalayas, adventure" },
          { key: "seo_share_image", label: "Social Media Share Image", isImage: true },
        ]
      }
    ]
  },
  {
    id: "security",
    category: "Security",
    sections: [
      {
        title: "Admin Access",
        fields: [
          { key: "admin_hotkeys", label: "Secret Hotkeys", placeholder: "e.g. Shift+A or Ctrl+Shift+M" },
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

// Provide defaults so the UI is never blank
const DEFAULT_SITE_SETTINGS: Record<string, string> = {
  nav_brand_name: "Idyllic Adventures",
  nav_brand_tagline: "Explore. Experience. Enjoy.",
  location: "Kathmandu, Nepal",
  email_main: "info@idyllicadventuresnepal.com",
  phone_1: "+977 1234567890",
  home_hero_image: "https://images.unsplash.com/photo-1690122601365-77d6ee21e998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  home_hero_badge: "Explore the Himalayas",
  home_hero_title_line1: "Discover Your",
  home_hero_title_line2: "Idyllic Adventure",
  home_hero_description: "Trek through the world's highest mountains with a dedicated local trek leader. Create memories that last a lifetime.",
  home_stats_years: "15+",
  home_stats_trekkers: "2,500+",
  home_stats_guides: "14+",
  home_featured_title: "Featured Treks",
  home_featured_subtitle: "Handpicked adventures for the ultimate Himalayan experience",
  home_cta_title: "Your Himalayan Story Starts Here",
  home_cta_description: "Contact me today to start planning your bespoke journey. I will guide you through every pass and valley of the majestic Himalayas.",
  home_cta_button_label: "Begin Your Adventure",
  about_hero_title: "Our Story",
  about_guide_name: "Ujwal Chhetri",
  about_guide_role: "Lead Guide",
  seo_title: "Idyllic Adventures Nepal",
  admin_hotkeys: "Shift+A",
};

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
  const [searchQuery, setSearchQuery] = useState("");

  const blockedCount24h = useMemo(() => logs.filter((item) => item.flagged).length, [logs]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, spamData] = await Promise.all([
        getSiteSettings(),
        getSpamConfig(),
      ]);

      // Merge defaults with loaded data (ignore empty strings from DB)
      const mergedSettings = { ...DEFAULT_SITE_SETTINGS };
      Object.entries(settingsData || {}).forEach(([key, val]) => {
        if (val) mergedSettings[key] = val;
      });
      setSiteSettings(mergedSettings);
      setSpamConfig(spamData);
      if (spamData && spamData.blocked_keywords) {
        setKeywordInput(spamData.blocked_keywords.join(", "));
      }

      // Load logs separately so they don't block the settings UI if they fail
      try {
        const logsData = await fetchSubmissionLogs(24);
        setLogs(logsData as SubmissionLog[]);
      } catch (logError) {
        console.warn("Failed to load submission logs:", logError);
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
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
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Settings className="w-4 h-4" />
            Configuration
          </div>
          <h1 className="font-heading text-5xl text-primary mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your website content, branding, and security with live preview.</p>
        </div>
        {activeTab !== "security" && activeTab !== "activity" && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleSaveSite}
              disabled={savingSite}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-accent hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 disabled:opacity-50"
            >
              {savingSite ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="text-lg">Apply All Changes</span>
            </button>
          </div>
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
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-primary hover:bg-muted"
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

                <div className="space-y-12">
                  {/* Spam Section */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold">Blocked Keywords</label>
                        <textarea
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none min-h-[120px] resize-none"
                          placeholder="e.g. crypto, casino, help"
                        />
                      </div>
                      {spamConfig && (
                        <div className="space-y-2">
                          <label className="block text-sm font-bold">Max URLs per message</label>
                          <input
                            type="number"
                            value={spamConfig.max_urls_allowed}
                            onChange={(e) => setSpamConfig({ ...spamConfig, max_urls_allowed: Number(e.target.value) })}
                            className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none"
                          />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Limits links in contact forms.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hotkeys Section */}
                  <div className="pt-12 border-t border-border">
                    {SITE_SETTING_CATEGORIES.find(c => c.id === "security")?.sections.map((section) => (
                      <div key={section.title}>
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h2 className="font-heading text-2xl">{section.title}</h2>
                            <p className="text-sm text-muted-foreground">Manage your secret login shortcuts.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {section.fields.map((field) => (
                            <div key={field.key} className="space-y-4">
                              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{field.label}</label>
                              
                              <div className="relative group">
                                <input 
                                  readOnly
                                  value={siteSettings[field.key] || ""}
                                  placeholder="Click to record hotkey..."
                                  onKeyDown={(e) => {
                                    e.preventDefault();
                                    const keys = [];
                                    if (e.ctrlKey) keys.push("Ctrl");
                                    if (e.shiftKey) keys.push("Shift");
                                    if (e.altKey) keys.push("Alt");
                                    if (e.metaKey) keys.push("Meta");
                                    
                                    const key = e.key;
                                    if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
                                      keys.push(key.toUpperCase());
                                      updateField(field.key, keys.join("+"));
                                    }
                                  }}
                                  className="w-full px-5 py-4 bg-primary/5 border-2 border-dashed border-border rounded-2xl text-lg font-mono text-center focus:border-accent focus:bg-accent/5 outline-none transition-all cursor-pointer"
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center">
                                  <div className="px-2 py-1 bg-muted rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">REC</div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <p className="text-[10px] text-muted-foreground w-full">Current Sequence: <span className="text-accent font-bold">{siteSettings[field.key] || "None"}</span></p>
                                <button 
                                  onClick={() => updateField(field.key, "Shift+A")}
                                  className="text-[10px] bg-muted px-2 py-1 rounded hover:bg-accent hover:text-white transition-colors"
                                >
                                  Default (Shift+A)
                                </button>
                                <button 
                                  onClick={() => updateField(field.key, "")}
                                  className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                        <p className="text-sm text-muted-foreground mb-3">{log.details}</p>
                        
                        {/* Diff Viewer */}
                        {log.action_type === "update" && log.previous_data && log.new_data && (
                          <div className="space-y-2 mb-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                            {Object.entries(log.new_data as Record<string, any>).map(([key, newValue]) => {
                              const oldValue = (log.previous_data as Record<string, any>)[key];
                              if (oldValue === newValue || (oldValue === undefined && !newValue)) return null;
                              
                              // Handle complex objects like highlights or itinerary
                              const displayOld = typeof oldValue === "object" ? JSON.stringify(oldValue).slice(0, 50) + "..." : oldValue;
                              const displayNew = typeof newValue === "object" ? JSON.stringify(newValue).slice(0, 50) + "..." : newValue;

                              return (
                                <div key={key} className="text-xs grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2">
                                  <span className="font-bold text-muted-foreground uppercase tracking-tight">{key.replace(/_/g, " ")}</span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-600 rounded line-through opacity-70 truncate max-w-[150px]">{displayOld || "None"}</span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium truncate max-w-[200px]">{displayNew || "None"}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

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
            <div className="space-y-8">
              {SITE_SETTING_CATEGORIES.find(c => c.id === activeTab)?.sections.map((section) => (
                <div key={section.title} className="glass-panel p-8">
                  <h2 className="font-heading text-2xl mb-2">{section.title}</h2>
                  <div className="w-12 h-1 bg-accent rounded-full mb-8" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map((field) => {
                      const value = siteSettings[field.key] || "";
                      return (
                        <div key={field.key} className={`space-y-2 ${field.multiline || field.isImage ? "md:col-span-2" : ""}`}>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              {field.icon && <field.icon className="w-3.5 h-3.5" />}
                              {field.label}
                            </label>
                            {DEFAULT_SITE_SETTINGS[field.key] && value !== DEFAULT_SITE_SETTINGS[field.key] && (
                              <button 
                                onClick={() => updateField(field.key, DEFAULT_SITE_SETTINGS[field.key])}
                                className="text-[10px] font-bold text-accent uppercase hover:underline"
                              >
                                Reset to Default
                              </button>
                            )}
                          </div>
                          
                          {field.isImage ? (
                            <div className="flex items-start gap-6">
                              <div className="relative group/img w-48 h-32 rounded-2xl bg-muted overflow-hidden border-2 border-dashed border-border hover:border-accent transition-colors flex-shrink-0">
                                {value ? (
                                  <img src={value} className="w-full h-full object-cover" alt={field.label} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                  </div>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                  <Upload className="w-6 h-6 mb-1" />
                                  <span className="text-[10px] font-bold uppercase">Upload New</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleImageUpload(field.key, file);
                                  }} />
                                </label>
                              </div>
                              <div className="flex-1 space-y-2">
                                <input 
                                  value={value}
                                  onChange={(e) => updateField(field.key, e.target.value)}
                                  placeholder="Or paste an image URL..."
                                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                                />
                                <p className="text-[10px] text-muted-foreground">Upload a file or paste a direct URL to the image.</p>
                              </div>
                            </div>
                          ) : field.multiline ? (
                            <textarea 
                              value={value}
                              onChange={(e) => updateField(field.key, e.target.value)}
                              rows={4}
                              placeholder={field.placeholder || ""}
                              className="w-full p-4 bg-input-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all leading-relaxed resize-none"
                            />
                          ) : (
                            <input 
                              value={value}
                              onChange={(e) => updateField(field.key, e.target.value)}
                              placeholder={field.placeholder || ""}
                              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Sticky Save Bar */}
              <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm text-muted-foreground font-medium">You have unsaved changes</span>
                </div>
                <button
                  onClick={handleSaveSite}
                  disabled={savingSite}
                  className="flex items-center gap-3 px-10 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                >
                  {savingSite ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Publish Changes
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
