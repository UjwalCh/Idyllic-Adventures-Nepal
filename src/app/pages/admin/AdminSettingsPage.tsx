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
  downloadSiteBackup,
  exportToCSV,
  TREK_IMAGES_BUCKET,
  type SiteSettings,
  type SpamConfig,
  type AdminLog,
  type AdminActivityLog,
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
  Download,
  Trash2, 
  Plus, 
  Search, 
  BookOpen,
  Database
} from "lucide-react";
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";

const TABS = [
  { id: "general", label: "General & Brand", icon: Info },
  { id: "home", label: "Home Page", icon: Layout },
  { id: "about", label: "About & Guide", icon: Info },
  { id: "other", label: "Other Pages", icon: Layout },
  { id: "seo", label: "SEO & Meta", icon: Globe },
  { id: "security", label: "Security & System", icon: ShieldCheck },
  { id: "activity", label: "Admin Activity", icon: History },
] as const;

type TabId = typeof TABS[number]["id"];

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  isImage?: boolean;
  isToggle?: boolean;
}

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
    category: "Security & System",
    sections: [
      {
        title: "Access Control",
        fields: [
          { key: "admin_hotkeys", label: "Secret Hotkeys", placeholder: "e.g. Shift+A" },
          { key: "maintenance_mode", label: "Global Maintenance Mode", isToggle: true },
          { key: "maintenance_pages", label: "Pages Under Maintenance (Granular)" }
        ]
      },
      {
        title: "Spam Protection",
        fields: [
          { key: "spam_sensitivity", label: "Sensitivity Level", placeholder: "low, medium, high" },
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
      },
      {
        title: "Journal Page",
        fields: [
          { key: "journal_hero_image", label: "Journal Hero Image", isImage: true },
          { key: "news_paused", label: "Pause Journal / News Section", isToggle: true },
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
  email_main: "chapagaiujwal@gmail.com",
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
  enquiry_notifications_enabled: "true",
  enquiry_email: "chapagaiujwal@gmail.com",
};

type SubmissionLog = {
  id: string;
  ip_address: string;
  flagged: boolean;
  spam_reason: string | null;
  created_at: string;
};

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
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
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{open: boolean, key: string | null}>({open: false, key: null});
  
  const [searchActivity, setSearchActivity] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "create" | "update" | "delete">("all");
  const [activityEntityFilter, setActivityEntityFilter] = useState<string>("all");

  const filteredActivity = useMemo(() => {
    return adminLogs.filter(log => {
      const matchesSearch = !searchActivity || 
        log.details?.toLowerCase().includes(searchActivity.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchActivity.toLowerCase());
      
      const matchesAction = activityFilter === "all" || log.action_type === activityFilter;
      const matchesEntity = activityEntityFilter === "all" || log.entity_type === activityEntityFilter;
      
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [adminLogs, searchActivity, activityFilter, activityEntityFilter]);

  const entityTypes = useMemo(() => {
    const types = new Set(adminLogs.map(l => l.entity_type));
    return Array.from(types);
  }, [adminLogs]);

  const exportLogs = (format: "csv" | "json") => {
    if (format === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminLogs, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `activity_logs_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else {
      exportToCSV(adminLogs, "activity-logs");
    }
  };

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
      // If we are in security tab, we might also want to save spam config
      if (activeTab === "security") {
        await handleSaveSpam();
      }
      
      await updateSiteSettings(siteSettings);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSavingSite(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      toast.loading("Preparing backup...");
      await downloadSiteBackup();
      toast.dismiss();
      toast.success("Backup downloaded!");
    } catch (err) {
      toast.error("Backup failed");
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
        {activeTab !== "activity" && (
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
                    <h2 className="font-heading text-2xl">Advanced System Controls</h2>
                    <p className="text-sm text-muted-foreground">Manage high-level security and system behavior.</p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    One-Click Backup
                  </button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg border-b pb-2">Spam Engine Config</h3>
                    {spamConfig && (
                      <div className="grid grid-cols-1 gap-4">
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
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-lg border-b pb-2">System Access</h3>
                    <div className="space-y-4">
                      {SITE_SETTING_CATEGORIES.find(c => c.id === "security")?.sections.map(section => 
                        section.fields.map((field: any) => (
                          <div key={field.key} className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{field.label}</label>
                             {field.isToggle ? (
                               <div className="flex items-center justify-between p-4 rounded-2xl border border-border">
                                 <span className="text-sm font-medium">Toggle {field.label}</span>
                                 <button 
                                    onClick={() => updateField(field.key, siteSettings[field.key] === "true" ? "false" : "true")}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${siteSettings[field.key] === "true" ? "bg-accent" : "bg-muted"}`}
                                  >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${siteSettings[field.key] === "true" ? "translate-x-6" : ""}`} />
                                  </button>
                               </div>
                             ) : field.key === "admin_hotkeys" ? (
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
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl font-mono text-center outline-none focus:border-accent transition-all cursor-pointer"
                                  />
                                </div>
                             ) : field.key === "maintenance_pages" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                  {["home", "treks", "gallery", "journal", "contact"].map(page => {
                                    const activePages = (siteSettings[field.key] || "").toLowerCase().split(",").map(p => p.trim()).filter(Boolean);
                                    const isChecked = activePages.includes(page);
                                    return (
                                      <label key={page} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isChecked ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                                        <input 
                                          type="checkbox"
                                          className="w-4 h-4 rounded text-accent"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            let newPages;
                                            if (e.target.checked) {
                                              newPages = Array.from(new Set([...activePages, page])).filter(Boolean);
                                            } else {
                                              newPages = activePages.filter(p => p !== page);
                                            }
                                            updateField(field.key, newPages.join(", "));
                                          }}
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest capitalize">{page}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                             ) : (
                               <input 
                                  value={siteSettings[field.key] || ""}
                                  onChange={(e) => updateField(field.key, e.target.value)}
                                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                             )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                   <h3 className="font-bold text-lg mb-6">Security Fine-tuning</h3>
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
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold">Max URLs per message</label>
                            <input
                              type="number"
                              value={spamConfig.max_urls_allowed}
                              onChange={(e) => setSpamConfig({ ...spamConfig, max_urls_allowed: Number(e.target.value) })}
                              className="w-full p-4 rounded-2xl border border-border bg-input-background focus:ring-2 focus:ring-accent outline-none"
                            />
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="glass-panel p-8">
                 {/* Logs remain same */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-heading text-2xl flex items-center gap-3">
                      <History className="w-6 h-6 text-accent" />
                      Security Logs
                    </h2>
                    <p className="text-sm text-muted-foreground">Recent submission attempts and blocks (last 24h).</p>
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-heading text-3xl">System Activity</h2>
                  <p className="text-muted-foreground text-sm">Comprehensive track of all administrative actions.</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => exportLogs("csv")}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border rounded-xl text-xs font-bold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button 
                    onClick={() => exportLogs("json")}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border rounded-xl text-xs font-bold transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    JSON
                  </button>
                  <button 
                    onClick={() => void refreshAdminLogs()}
                    className="p-2 hover:bg-muted rounded-full transition-colors ml-2"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Activity Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-muted/20 p-4 rounded-2xl border border-border">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent"
                   />
                </div>
                <div className="flex items-center gap-2 p-1 bg-background border border-border rounded-xl overflow-x-auto">
                  {(["all", "create", "update", "delete"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setActivityFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activityFilter === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <select 
                  value={activityEntityFilter}
                  onChange={(e) => setActivityEntityFilter(e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent appearance-none capitalize"
                >
                  <option value="all">All Entities</option>
                  {entityTypes.map(t => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredActivity.map((log) => (
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

                    {/* Undo removed for now */}
                  </motion.div>
                ))}
                
                {filteredActivity.length === 0 && (
                  <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                    <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No activity matching your filters.</p>
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
                    {section.fields.map((field: any) => {
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
                              <div className="relative group/img w-48 h-32 rounded-2xl bg-muted overflow-hidden border-2 border-dashed border-border hover:border-accent transition-colors flex-shrink-0 cursor-pointer" onClick={() => setMediaPickerConfig({open: true, key: field.key})}>
                                {value ? (
                                  <img src={value} className="w-full h-full object-cover" alt={field.label} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                  <Upload className="w-6 h-6 mb-1" />
                                  <span className="text-[10px] font-bold uppercase">Select / Upload</span>
                                </div>
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
                          ) : field.isToggle ? (
                            <button 
                              onClick={() => updateField(field.key, value === "true" ? "false" : "true")}
                              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${value === "true" ? "bg-accent shadow-[0_0_15px_rgba(var(--accent),0.4)]" : "bg-muted"}`}
                            >
                              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 transform ${value === "true" ? "translate-x-7" : ""}`} />
                            </button>
                          ) : field.key === "maintenance_pages" ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                              {["home", "treks", "gallery", "journal", "contact"].map(page => {
                                const activePages = (value || "").toLowerCase().split(",").map(p => p.trim()).filter(Boolean);
                                const isChecked = activePages.includes(page);
                                return (
                                  <label key={page} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isChecked ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                                    <input 
                                      type="checkbox"
                                      className="w-4 h-4 rounded text-accent"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let newPages;
                                        if (e.target.checked) {
                                          newPages = Array.from(new Set([...activePages, page])).filter(Boolean);
                                        } else {
                                          newPages = activePages.filter(p => p !== page);
                                        }
                                        updateField(field.key, newPages.join(", "));
                                      }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-widest capitalize">{page}</span>
                                  </label>
                                );
                              })}
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
            </div>
          )}



        </motion.div>
      </AnimatePresence>

      {/* Sticky Save Bar - Always visible except for activity logs */}
      {activeTab !== "activity" && (
        <div className="sticky bottom-8 mt-12 bg-background/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">You have unsaved changes in {TABS.find(t => t.id === activeTab)?.label}</span>
          </div>
          <button
            onClick={handleSaveSite}
            disabled={savingSite}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {savingSite ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Publish Changes
          </button>
        </div>
      )}
      <MediaPickerModal 
        open={mediaPickerConfig.open} 
        onOpenChange={(open) => setMediaPickerConfig(prev => ({...prev, open}))} 
        onSelect={(url) => {
          if (mediaPickerConfig.key) updateField(mediaPickerConfig.key, url);
        }} 
        defaultBucket={TREK_IMAGES_BUCKET}
      />
    </div>
  );
}
