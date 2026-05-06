import { motion } from "motion/react";
import { ShieldAlert, Globe, Layout, CheckCircle2, AlertCircle, Save, Loader2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "../../data/supabaseData";

const PAGES = [
  { id: "home", label: "Home Page", description: "Hero, Features, and Highlights" },
  { id: "treks", label: "Trekking Packages", description: "All trek listings and details" },
  { id: "gallery", label: "Gallery & Media", description: "Photos and visual assets" },
  { id: "journal", label: "Stories & Journal", description: "Blog posts and articles" },
  { id: "contact", label: "Contact & Booking", description: "Inquiry forms and maps" },
];

export function AdminMaintenancePage() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const isGlobal = settings.maintenance_mode === "true";
  const maintenancePages = (settings.maintenance_pages || "").toLowerCase().split(",").map(p => p.trim()).filter(Boolean);

  const toggleGlobal = () => {
    setSettings(prev => ({ ...prev, maintenance_mode: isGlobal ? "false" : "true" }));
  };

  const togglePage = (pageId: string) => {
    let newPages;
    if (maintenancePages.includes(pageId)) {
      newPages = maintenancePages.filter(p => p !== pageId);
    } else {
      newPages = [...maintenancePages, pageId];
    }
    setSettings(prev => ({ ...prev, maintenance_pages: newPages.join(", ") }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteSettings(settings);
      toast.success("Maintenance settings published!");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
          <ShieldAlert className="w-4 h-4" />
          System Guard
        </div>
        <h1 className="font-heading text-5xl text-primary mb-4">Maintenance Mode</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Control site availability with surgical precision. Put specific pages or the entire platform under maintenance while you work.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Global Toggle */}
          <div className={`glass-panel p-8 transition-all duration-500 border-2 ${isGlobal ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]" : "border-transparent"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl mb-1">Global Maintenance</h2>
                <p className="text-sm text-muted-foreground italic">Puts the entire website offline (except admin).</p>
              </div>
              <button 
                onClick={toggleGlobal}
                className={`relative w-20 h-10 rounded-full transition-all duration-500 ${isGlobal ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-muted"}`}
              >
                <div className={`absolute top-1.5 left-1.5 w-7 h-7 bg-white rounded-full transition-all duration-500 transform ${isGlobal ? "translate-x-10" : ""}`} />
              </button>
            </div>
            
            {isGlobal && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600"
              >
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-bold uppercase tracking-widest">Global Lock is Active</p>
              </motion.div>
            )}
          </div>

          {/* Granular Selection */}
          <div className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-8">
              <Layout className="w-6 h-6 text-accent" />
              <h2 className="font-heading text-2xl">Page-Specific Control</h2>
            </div>
            
            <div className={`grid grid-cols-1 gap-4 ${isGlobal ? "opacity-30 pointer-events-none" : ""}`}>
              {PAGES.map((page) => {
                const isActive = maintenancePages.includes(page.id);
                return (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all text-left group ${
                      isActive 
                        ? "border-amber-500 bg-amber-500/5 shadow-xl" 
                        : "border-border hover:border-accent hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isActive ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"
                      }`}>
                        {isActive ? <ShieldAlert className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg mb-0.5">{page.label}</div>
                        <div className="text-xs text-muted-foreground">{page.description}</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? "bg-amber-500 border-amber-500 scale-110" : "border-border"
                    }`}>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {isGlobal && (
              <p className="text-xs text-center mt-6 text-red-500 font-bold uppercase tracking-widest">
                Granular controls disabled while Global Lock is active.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-primary text-primary-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Status Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary-foreground/10">
                <span className="text-sm opacity-70 italic font-heading">Global Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isGlobal ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                  {isGlobal ? "Locked" : "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-primary-foreground/10">
                <span className="text-sm opacity-70 italic font-heading">Affected Pages</span>
                <span className="font-bold text-lg">{isGlobal ? "ALL" : maintenancePages.length}</span>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-8 flex items-center justify-center gap-3 py-4 bg-accent text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-accent/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Publish Changes
            </button>
          </div>

          <div className="glass-panel p-6 border-dashed border-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 italic">Live Preview</h3>
            <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center p-4 text-center overflow-hidden">
               {isGlobal || maintenancePages.length > 0 ? (
                 <div className="space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto text-amber-500 animate-bounce" />
                    <div className="font-bold text-sm">Under Maintenance</div>
                    <div className="text-[10px] text-muted-foreground">This section is currently being improved.</div>
                 </div>
               ) : (
                 <div className="space-y-2">
                    <Globe className="w-8 h-8 mx-auto text-emerald-500" />
                    <div className="font-bold text-sm">System Normal</div>
                    <div className="text-[10px] text-muted-foreground">All pages are accessible to public.</div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
