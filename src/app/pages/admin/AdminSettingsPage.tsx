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
  supabase,
} from "../../data/supabaseData";
import { useAdminActivityLogs } from "../../data/useRealtimeData";
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
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  AlertCircle,
  Download,
  Plus, 
  Search, 
  BookOpen,
  Users
} from "lucide-react";

const DEFAULT_FAQS = [
  { q: "What is the best time to visit Nepal?", a: "The best times are spring (March to May) and autumn (September to November) for the clearest skies and best trekking conditions." },
  { q: "Do I need a visa for Nepal?", a: "Yes, most nationalities require a visa. You can get a visa on arrival at Kathmandu airport or apply at a Nepalese consulate abroad." },
  { q: "Is trekking in Nepal safe?", a: "Yes, trekking is generally very safe. We provide experienced guides, proper equipment, and handle all logistics to ensure your safety." },
  { q: "What should I pack for a trek?", a: "Key items include trekking boots, warm layers, a good sleeping bag, sun protection, and a basic first aid kit. We provide a detailed packing list." }
];
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";

const TABS = [
  { id: "general", label: "Branding & Contact", icon: Globe },
  { id: "home", label: "Home Page", icon: Layout },
  { id: "about", label: "About Page", icon: BookOpen },
  { id: "guide", label: "Team & Founder", icon: Users },
  { id: "other", label: "Other Pages", icon: Layout },
  { id: "seo", label: "SEO & Social", icon: Search },
  { id: "faqs", label: "FAQs Management", icon: Info },
  { id: "security", label: "Security & System", icon: ShieldCheck },
  { id: "activity", label: "Admin Activity", icon: History },
] as const;

type TabId = typeof TABS[number]["id"];

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
        title: "Promotional Section",
        fields: [
          { key: "home_promo_image", label: "Promo Background Image", isImage: true },
          { key: "home_promo_title", label: "Section Title", placeholder: "e.g. Local Expertise, Global Standards" },
          { key: "home_promo_description", label: "Description / Philosophy", multiline: true },
          { key: "home_promo_feat1", label: "Feature 1 Label", placeholder: "e.g. Bespoke Itineraries" },
          { key: "home_promo_feat2", label: "Feature 2 Label", placeholder: "e.g. Safety Certified" },
          { key: "home_promo_feat3", label: "Feature 3 Label", placeholder: "e.g. Local Communities" },
          { key: "home_marquee_text", label: "Values Marquee Content", placeholder: "e.g. Bespoke Itineraries • Eco-Conscious Travel" },
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
    category: "About Page Content",
    sections: [
      {
        title: "Hero Section",
        fields: [
          { key: "about_hero_image", label: "About Hero Image", isImage: true },
          { key: "about_hero_title", label: "Hero Title" },
          { key: "about_hero_description", label: "Hero Description", multiline: true },
        ]
      },
      {
        title: "Our Story",
        fields: [
          { key: "about_story_title", label: "Story Title" },
          { key: "about_story_description", label: "Our Story Text", multiline: true },
          { key: "about_story_image", label: "Story Image", isImage: true },
        ]
      },
      {
        title: "Company Values",
        fields: [
          { key: "about_values_title", label: "Values Section Title" },
          { key: "about_values_subtitle", label: "Values Section Subtitle", multiline: true },
        ]
      }
    ]
  },
  {
    id: "guide",
    category: "Team & Founder Profile",
    sections: [
      {
        title: "Founder Details",
        fields: [
          { key: "about_guide_image", label: "Founder Photo", isImage: true },
          { key: "about_guide_name", label: "Full Name" },
          { key: "about_guide_role", label: "Official Role" },
          { key: "about_guide_label", label: "Badge / Small Title", placeholder: "e.g. Founder & Lead" },
        ]
      },
      {
        title: "Professional Profile",
        fields: [
          { key: "about_guide_experience", label: "Experience Summary" },
          { key: "about_guide_saying", label: "Founder's Quote", multiline: true },
          { key: "guide_expertise_tags", label: "Expertise Tags (Separate with •)", placeholder: "e.g. 15+ Peaks Mastered • Wilderness First Aid" },
        ]
      },
      {
        title: "Display Options",
        fields: [
          { key: "home_guide_display", label: "Show Founder Profile on Home Page", isToggle: true },
        ]
      }
    ]
  },
  {
    id: "other",
    category: "Other Pages",
    sections: [
      {
        title: "Treks Page",
        fields: [
          { key: "treks_hero_image", label: "Treks Hero Image", isImage: true },
          { key: "treks_hero_title", label: "Hero Title" },
          { key: "treks_hero_description", label: "Hero Description", multiline: true },
        ]
      },
      {
        title: "Contact Page",
        fields: [
          { key: "contact_hero_image", label: "Contact Hero Image", isImage: true },
          { key: "contact_hero_title", label: "Hero Title" },
          { key: "contact_hero_description", label: "Hero Description", multiline: true },
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
          { key: "seo_title", label: "Main Site Title", placeholder: "e.g. Idyllic Adventures Nepal" },
          { key: "seo_description", label: "Meta Description", multiline: true },
          { key: "seo_keywords", label: "Keywords", placeholder: "trekking, nepal, adventure" },
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
        ]
      },
      {
        title: "Backup & Recovery",
        fields: [
          { key: "last_backup_at", label: "Last System Backup", disabled: true },
        ]
      }
    ]
  }
];

const DEFAULT_SITE_SETTINGS: Record<string, string> = {
  // General & Branding
  nav_brand_name: "Idyllic Adventures",
  nav_brand_tagline: "Explore. Experience. Enjoy.",
  site_logo: "",
  location: "Kathmandu, Nepal",
  phone_1: "+977-9841234567",
  email_main: "chapagaiujwal@gmail.com",
  footer_description: "Professional trekking service run by a dedicated local guide with 15+ years of experience in the Himalayas.",
  
  // Home Hero
  home_hero_image: "https://images.unsplash.com/photo-1690122601365-77d6ee21e998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  home_hero_badge: "Explore the Himalayas",
  home_hero_title_line1: "Discover Your",
  home_hero_title_line2: "Idyllic Adventure",
  home_hero_description: "Trek through the world's highest mountains with a dedicated local trek leader. Create memories that last a lifetime.",
  
  // Home Stats
  home_stats_years_label: "Years of Trek Leadership",
  home_stats_years: "15+",
  home_stats_trekkers_label: "Happy Trekkers",
  home_stats_trekkers: "2,500+",
  home_stats_guides_label: "Expert Guides",
  home_stats_guides: "14+",
  home_stats_safety_label: "Safety First",
  home_stats_safety: "100%",

  // Home Promotional Section
  home_promo_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
  home_promo_title: "Local Expertise, Global Standards",
  home_promo_description: "With over 15 years of experience leading expeditions across the Himalayas, we provide an unparalleled journey through the heart of Nepal.",
  home_promo_feat1: "Bespoke Itineraries",
  home_promo_feat2: "Safety Certified",
  home_promo_feat3: "Local Communities",
  home_marquee_text: "Bespoke Itineraries • Eco-Conscious Travel • Safety Certified • Local Cultural Expertise",

  // Home Featured & CTA
  home_featured_title: "Featured Treks",
  home_featured_subtitle: "Handpicked adventures for the ultimate Himalayan experience",
  home_cta_title: "Your Himalayan Story Starts Here",
  home_cta_description: "Contact me today to start planning your bespoke journey. I will guide you through every pass and valley of the majestic Himalayas.",
  home_cta_button_label: "Begin Your Adventure",

  // Guide Information (Home & About)
  home_guide_display: "true",
  about_guide_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800",
  about_guide_label: "Founder & Lead",
  about_guide_name: "Mr. Narayan Prasad Chapagain",
  about_guide_role: "Expert Expedition Leader",
  about_guide_experience: "20+ years of Himalayan trekking experience",
  about_guide_saying: "The mountains are not just peaks to be conquered, but teachers to be respected.",
  guide_expertise_tags: "15+ Peaks Mastered • Wilderness First Aid • 20+ Years Experience • Local Cultural Expert",

  // About Page Hero & Story
  about_hero_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  about_hero_title: "About Idyllic Adventures",
  about_hero_description: "A personal trekking service run by one dedicated local guide",
  about_story_title: "My Story",
  about_story_description: "Founded in 2010, Idyllic Adventures Nepal was built from a personal passion for the Himalayas and a desire to share their magnificence with fellow trekkers.",
  about_story_image: "https://images.unsplash.com/photo-1701255136052-b33f78a886a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  about_values_title: "My Values",
  about_values_subtitle: "The principles that guide every trek I organize",
  about_guide_title: "Meet Your Guide",
  about_guide_subtitle: "A dedicated local trek leader focused on making your journey unforgettable",

  // Treks Page Hero
  treks_hero_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  treks_hero_title: "Himalayan Treks",
  treks_hero_description: "Explore my handpicked collection of the finest treks in Nepal.",

  // Contact Page Hero
  contact_hero_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  contact_hero_title: "Contact Me",
  contact_hero_description: "Ready to start your adventure? Reach out and I'll get back to you shortly.",

  // SEO & Security
  seo_title: "Idyllic Adventures Nepal",
  seo_description: "Experience the ultimate Himalayan adventure with a dedicated local guide.",
  seo_keywords: "trekking, nepal, adventure, himalayas, guide",
  maintenance_mode: "false",
};

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [spamConfig, setSpamConfig] = useState<SpamConfig | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const { logs: adminLogs, refresh: refreshAdminLogs } = useAdminActivityLogs(100);
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{open: boolean, key: string | null}>({open: false, key: null});
  
  const [searchActivity, setSearchActivity] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "create" | "update" | "delete">("all");
  const [activityEntityFilter, setActivityEntityFilter] = useState<string>("all");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, spamData] = await Promise.all([
        getSiteSettings(),
        getSpamConfig(),
      ]);

      const mergedSettings = { ...DEFAULT_SITE_SETTINGS };
      Object.entries(settingsData || {}).forEach(([key, val]) => {
        if (val) mergedSettings[key] = val;
      });
      
      // Parse FAQs if they are stored as string or handle default
      let parsedFaqs = [];
      if (typeof mergedSettings.faqs === 'string' && mergedSettings.faqs.trim() !== '') {
        try {
          parsedFaqs = JSON.parse(mergedSettings.faqs);
        } catch (e) {
          parsedFaqs = [...DEFAULT_FAQS];
        }
      } else if (Array.isArray(mergedSettings.faqs)) {
        parsedFaqs = mergedSettings.faqs;
      } else {
        parsedFaqs = [...DEFAULT_FAQS];
      }
      
      setSiteSettings({ ...mergedSettings, faqs: parsedFaqs });
      setSpamConfig(spamData);
      if (spamData?.blocked_keywords) setKeywordInput(spamData.blocked_keywords.join(", "));

      const logsData = await fetchSubmissionLogs(24);
      setLogs(logsData);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  const updateField = (key: string, value: string) => {
    setSiteSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSite = async () => {
    setSavingSite(true);
    try {
      if (activeTab === "security" && spamConfig) {
        const keywords = keywordInput.split(",").map(k => k.trim()).filter(Boolean);
        await updateSpamConfig({ ...spamConfig, blocked_keywords: keywords });
      }
      
      // Stringify FAQs for database storage
      const settingsToSave = { ...siteSettings };
      if (Array.isArray(settingsToSave.faqs)) {
        settingsToSave.faqs = JSON.stringify(settingsToSave.faqs);
      }
      
      await updateSiteSettings(settingsToSave);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSavingSite(false);
    }
  };

  const handleUndo = async (logId: string) => {
    try {
      await revertAdminAction(logId);
      toast.success("Action reverted successfully!");
      void refreshAdminLogs();
      void loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revert action");
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all activity history? This cannot be undone.")) return;
    try {
      await supabase?.from("admin_activity_logs").delete().neq("id", "");
      await supabase?.from("admin_logs").delete().neq("id", "");
      toast.success("History cleared");
      void refreshAdminLogs();
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const formatDetails = (details: string) => {
    // If it's a long list of comma separated technical keys, simplify it
    if (details.includes(",") && details.length > 100) {
      return "Updated multiple site configuration fields";
    }
    // Remove technical prefixes if they exist
    return details.replace("Updated site settings: ", "Updated: ");
  };

  const filteredActivity = useMemo(() => {
    return adminLogs.filter((log: AdminActivityLog) => {
      const matchesSearch = !searchActivity || log.details?.toLowerCase().includes(searchActivity.toLowerCase());
      const matchesAction = activityFilter === "all" || log.actionType === activityFilter;
      const matchesEntity = activityEntityFilter === "all" || log.entityType === activityEntityFilter;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [adminLogs, searchActivity, activityFilter, activityEntityFilter]);

  const entityTypes = useMemo(() => Array.from(new Set(adminLogs.map((l: AdminActivityLog) => l.entityType))), [adminLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background relative">
      <aside className="w-full lg:w-64 border-r border-border bg-card/50 backdrop-blur-md p-6 overflow-y-auto lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8">
          <Settings className="w-4 h-4" />
          System Control
        </div>
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-muted-foreground hover:text-primary hover:bg-muted"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-accent" : ""}`} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4" />}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 pb-32 overflow-x-hidden">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-6 md:px-12 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-heading text-3xl text-primary">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-muted-foreground">Manage your {activeTab} content and configurations.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => void loadAll()} className="p-3 hover:bg-muted rounded-full transition-colors group" title="Refresh/Reload">
              <History className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            {activeTab !== "activity" && (
              <button 
                onClick={handleSaveSite} 
                disabled={savingSite} 
                className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {savingSite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            )}
          </div>
        </header>

        <div className="p-6 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "faqs" ? (
                <div className="space-y-8">
                  <div className="glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="font-heading text-2xl">Manage FAQs</h2>
                        <p className="text-sm text-muted-foreground">Add or edit questions that appear on the homepage.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const currentFaqs = Array.isArray(siteSettings.faqs) ? [...siteSettings.faqs] : [];
                          setSiteSettings(prev => ({
                            ...prev,
                            faqs: [...currentFaqs, { q: "New Question?", a: "New Answer text here." }]
                          } as SiteSettings));
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold"
                      >
                        <Plus className="w-4 h-4" /> Add FAQ
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(Array.isArray(siteSettings.faqs) ? siteSettings.faqs : []).map((faq: any, i: number) => (
                        <div key={i} className="p-6 bg-muted/30 rounded-2xl border border-border/50 group relative">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => {
                                  if (i === 0) return;
                                  const newFaqs = [...(siteSettings.faqs as any[])];
                                  [newFaqs[i - 1], newFaqs[i]] = [newFaqs[i], newFaqs[i - 1]];
                                  setSiteSettings(prev => ({ ...prev, faqs: newFaqs } as SiteSettings));
                                }}
                                disabled={i === 0}
                                className={`p-1 rounded-md transition-all ${i === 0 ? "opacity-20" : "hover:bg-accent hover:text-white"}`}
                              >
                                <Plus className="w-3 h-3 rotate-[225deg]" />
                              </button>
                              <button 
                                onClick={() => {
                                  const faqs = (siteSettings.faqs as any[]) || [];
                                  if (i === faqs.length - 1) return;
                                  const newFaqs = [...faqs];
                                  [newFaqs[i + 1], newFaqs[i]] = [newFaqs[i], newFaqs[i + 1]];
                                  setSiteSettings(prev => ({ ...prev, faqs: newFaqs } as SiteSettings));
                                }}
                                disabled={i === ((siteSettings.faqs as any[]) || []).length - 1}
                                className={`p-1 rounded-md transition-all ${i === ((siteSettings.faqs as any[]) || []).length - 1 ? "opacity-20" : "hover:bg-accent hover:text-white"}`}
                              >
                                <Plus className="w-3 h-3 rotate-[45deg]" />
                              </button>
                            </div>
                            <input 
                              value={faq.q} 
                              onChange={(e) => {
                                const newFaqs = [...(siteSettings.faqs as any[])];
                                newFaqs[i].q = e.target.value;
                                setSiteSettings(prev => ({ ...prev, faqs: newFaqs } as SiteSettings));
                              }}
                              className="flex-1 bg-transparent font-bold text-primary outline-none"
                              placeholder="Question"
                            />
                            <button 
                              onClick={() => {
                                const newFaqs = (siteSettings.faqs as any[]).filter((_: any, idx: number) => idx !== i);
                                setSiteSettings(prev => ({ ...prev, faqs: newFaqs } as SiteSettings));
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Undo2 className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                          <textarea 
                            value={faq.a} 
                            onChange={(e) => {
                              const newFaqs = [...(siteSettings.faqs as any[])];
                              newFaqs[i].a = e.target.value;
                              setSiteSettings(prev => ({ ...prev, faqs: newFaqs } as SiteSettings));
                            }}
                            className="w-full bg-transparent text-sm text-muted-foreground outline-none resize-none"
                            rows={3}
                            placeholder="Answer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeTab === "activity" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="relative md:col-span-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        value={searchActivity} 
                        onChange={(e) => setSearchActivity(e.target.value)} 
                        placeholder="Search logs..." 
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all" 
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button 
                        onClick={handleClearLogs}
                        className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all"
                      >
                        <History className="w-4 h-4" />
                        Clear History
                      </button>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-40">Time</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-28">Action</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-24">Options</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredActivity.length > 0 ? (
                            filteredActivity.map((log: AdminActivityLog) => (
                              <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-xs font-bold text-primary">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                    log.actionType === "create" ? "text-emerald-600 bg-emerald-500/10" :
                                    log.actionType === "delete" ? "text-rose-600 bg-rose-500/10" :
                                    "text-blue-600 bg-blue-500/10"
                                  }`}>
                                    {log.actionType}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-primary leading-snug">{formatDetails(log.details || "")}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold opacity-50">{log.entityType?.replace("_", " ")}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {log.actionType !== "create" && (
                                    <button
                                      onClick={() => handleUndo(log.id)}
                                      className="text-xs font-black text-secondary hover:text-secondary/80 hover:underline transition-all"
                                    >
                                      Undo
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-24 text-center">
                                <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground font-medium">No activity logs found matching your criteria.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
                              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                {field.label}
                              </label>
                              {field.isImage ? (
                                <div className="flex items-start gap-4">
                                  <div className="w-32 h-20 bg-muted rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setMediaPickerConfig({open: true, key: field.key})}>
                                    {value && <img src={value} className="w-full h-full object-cover" />}
                                  </div>
                                  <input value={value} onChange={(e) => updateField(field.key, e.target.value)} className="flex-1 px-4 py-2 bg-input-background border border-border rounded-xl text-sm" />
                                </div>
                              ) : field.isToggle ? (
                                <button onClick={() => updateField(field.key, value === "true" ? "false" : "true")} className={`relative w-12 h-6 rounded-full transition-colors ${value === "true" ? "bg-accent" : "bg-muted"}`}>
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value === "true" ? "translate-x-6" : ""}`} />
                                </button>
                              ) : field.multiline ? (
                                <textarea value={value} onChange={(e) => updateField(field.key, e.target.value)} rows={4} className="w-full p-4 bg-input-background border border-border rounded-xl text-sm resize-none" />
                              ) : (
                                <input value={value} onChange={(e) => updateField(field.key, e.target.value)} className="w-full px-4 py-2 bg-input-background border border-border rounded-xl text-sm" />
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
        </div>

        {/* Floating Save Button Removed in favor of Header Button */}
      </main>

      <MediaPickerModal open={mediaPickerConfig.open} onOpenChange={(o) => setMediaPickerConfig(p => ({...p, open: o}))} onSelect={(url) => { if (mediaPickerConfig.key) updateField(mediaPickerConfig.key, url); }} defaultBucket={TREK_IMAGES_BUCKET} />
    </div>
  );
}
