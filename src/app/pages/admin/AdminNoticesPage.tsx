import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Megaphone, Calendar, Clock, Target, AlertCircle, Save, Loader2, X } from "lucide-react";
import { Notice } from "../../data/mockData";
import { toast } from "sonner";
import { useNotices } from "../../data/useRealtimeData";
import { requireAuthenticatedSession } from "../../data/auth";
import {
  createNotice,
  deleteNotice,
  updateNotice,
  isSupabaseConfigured,
  supabase,
  updateSiteSettings
} from "../../data/supabaseData";
import { useSiteSettings } from "../../data/useRealtimeData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const inputClassName = "w-full px-4 py-3 bg-input-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all";

export function AdminNoticesPage() {
  const { notices } = useNotices(true);
  const { settings, refresh: refreshSettings } = useSiteSettings();
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    type: "info" as Notice["type"],
    targetPage: "all" as string,
    expiresAt: "",
  });

  const ensureConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live edits");
      return false;
    }
    return true;
  };

  const ensureAdminSession = async () => {
    await requireAuthenticatedSession();
  };

  const resetForm = () => {
    setNewNotice({ 
      title: "", 
      message: "", 
      type: "info", 
      targetPage: "all",
      expiresAt: ""
    });
    setEditingNoticeId(null);
  };

  const openAddDialog = async () => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }
    resetForm();
    setIsFormOpen(true);
  };

  const openEditDialog = async (notice: Notice) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    setEditingNoticeId(notice.id);
    setNewNotice({
      title: notice.title,
      message: notice.message,
      type: notice.type,
      targetPage: notice.targetPage || "all",
      expiresAt: notice.expiresAt || "",
    });
    setIsFormOpen(true);
  };

  const saveNotice = async () => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    if (!newNotice.title.trim() || !newNotice.message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...newNotice,
        date: new Date().toISOString().split("T")[0],
        expires_at: newNotice.expiresAt || null,
        target_page: newNotice.targetPage,
      };

      if (editingNoticeId) {
        await updateNotice(editingNoticeId, payload as any);
        toast.success("Broadcast updated successfully!");
      } else {
        await createNotice(payload as any);
        toast.success("New broadcast deployed!");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to deploy notice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!ensureConfigured()) return;
    if (!confirm("Are you sure you want to remove this notice? It will disappear for all users.")) return;

    try {
      await ensureAdminSession();
      await deleteNotice(id);
      toast.success("Notice removed");
    } catch (error) {
      toast.error("Failed to delete notice");
    }
  };

  const togglePauseSystem = async (key: string, currentValue: string) => {
    if (!ensureConfigured()) return;
    try {
      setIsUpdatingSettings(true);
      await ensureAdminSession();
      const newValue = currentValue === "true" ? "false" : "true";
      await updateSiteSettings({ [key]: newValue });
      await refreshSettings();
      toast.success(`System ${newValue === "true" ? "paused" : "resumed"} successfully`);
    } catch (error) {
      toast.error("Failed to update system status");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
              <Megaphone className="w-4 h-4" />
              Announcements
            </div>
            <h1 className="font-heading text-5xl text-primary mb-2">Notice Board</h1>
            <p className="text-muted-foreground">Broadcast alerts and news across your entire platform.</p>
          </div>
          <button
            onClick={openAddDialog}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-accent hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            <span className="text-lg">New Broadcast</span>
          </button>
        </div>

        {/* System Pause Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className={`glass-panel p-6 border-l-4 transition-all ${settings.notices_paused === "true" ? "border-l-red-500 bg-red-500/5" : "border-l-emerald-500 bg-emerald-500/5"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${settings.notices_paused === "true" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Global Notices</h3>
                  <p className="text-xs text-muted-foreground">
                    {settings.notices_paused === "true" ? "System is currently PAUSED" : "System is currently ACTIVE"}
                  </p>
                </div>
              </div>
              <button
                disabled={isUpdatingSettings}
                onClick={() => togglePauseSystem("notices_paused", settings.notices_paused || "false")}
                className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                  settings.notices_paused === "true" 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                } disabled:opacity-50`}
              >
                {isUpdatingSettings ? "..." : settings.notices_paused === "true" ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          <div className={`glass-panel p-6 border-l-4 transition-all ${settings.news_paused === "true" ? "border-l-red-500 bg-red-500/5" : "border-l-emerald-500 bg-emerald-500/5"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${settings.news_paused === "true" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">News & Updates</h3>
                  <p className="text-xs text-muted-foreground">
                    {settings.news_paused === "true" ? "Journal is currently HIDDEN" : "Journal is currently VISIBLE"}
                  </p>
                </div>
              </div>
              <button
                disabled={isUpdatingSettings}
                onClick={() => togglePauseSystem("news_paused", settings.news_paused || "false")}
                className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                  settings.news_paused === "true" 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                } disabled:opacity-50`}
              >
                {isUpdatingSettings ? "..." : settings.news_paused === "true" ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {notices.map((notice) => {
              const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
              return (
                <motion.div
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-panel p-8 border-l-8 transition-all hover:shadow-xl ${
                    notice.type === "success" ? "border-l-emerald-500" :
                    notice.type === "warning" ? "border-l-amber-500" :
                    "border-l-blue-500"
                  } ${isExpired ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          notice.type === "success" ? "bg-emerald-500/10 text-emerald-600" :
                          notice.type === "warning" ? "bg-amber-500/10 text-amber-600" :
                          "bg-blue-500/10 text-blue-600"
                        }`}>
                          {notice.type}
                        </span>
                        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                          <Target className="w-3.5 h-3.5" />
                          Target: {notice.targetPage === "all" ? "Everywhere" : notice.targetPage}
                        </div>
                        {notice.expiresAt && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                            isExpired ? "bg-red-500/10 text-red-600 border-red-200" : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {isExpired ? "Expired" : `Ends: ${new Date(notice.expiresAt).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                      <h3 className="font-heading text-3xl mb-3 text-primary">{notice.title}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-3xl">{notice.message}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                          <Calendar className="w-4 h-4" />
                          Published {new Date(notice.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col gap-3">
                      <button
                        onClick={() => openEditDialog(notice)}
                        className="p-4 bg-muted/50 hover:bg-accent hover:text-white rounded-2xl transition-all shadow-sm group"
                        title="Edit Broadcast"
                      >
                        <Edit2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-4 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl transition-all shadow-sm group"
                        title="Remove Notice"
                      >
                        <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {notices.length === 0 && (
            <div className="py-32 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-border/50">
              <Megaphone className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-bold text-muted-foreground">No active broadcasts</h3>
              <p className="text-muted-foreground/60 mb-8">Deploy your first message to keep your trekkers informed.</p>
              <button 
                onClick={openAddDialog}
                className="px-10 py-4 bg-primary/10 text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-all"
              >
                Create First Notice
              </button>
            </div>
          )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className={`p-10 text-white ${
              newNotice.type === "success" ? "bg-emerald-600" :
              newNotice.type === "warning" ? "bg-amber-600" :
              "bg-primary"
            } transition-colors duration-500`}>
              <DialogTitle className="text-4xl font-heading mb-2">
                {editingNoticeId ? "Refine Broadcast" : "New Site Notice"}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-lg">
                Craft a message that will grab attention and inform.
              </DialogDescription>
            </div>

            <div className="p-10 space-y-8 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notice Title</label>
                  <input
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className={inputClassName}
                    placeholder="e.g. Flight Schedule Update"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Alert Style</label>
                  <select
                    value={newNotice.type}
                    onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value as any })}
                    className={inputClassName}
                  >
                    <option value="info">Information (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">The Message</label>
                <textarea
                  value={newNotice.message}
                  onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                  className={`${inputClassName} h-32 resize-none leading-relaxed`}
                  placeholder="Keep it concise and clear..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Display Target</label>
                  <select
                    value={newNotice.targetPage}
                    onChange={(e) => setNewNotice({ ...newNotice, targetPage: e.target.value })}
                    className={inputClassName}
                  >
                    <option value="all">Site-wide</option>
                    <option value="home">Home Page</option>
                    <option value="treks">Treks Index</option>
                    <option value="journal">Journal/Blog</option>
                    <option value="contact">Contact/Support</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Expiry Date</label>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">(Optional)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={newNotice.expiresAt}
                      onChange={(e) => setNewNotice({ ...newNotice, expiresAt: e.target.value })}
                      className={`${inputClassName} border-amber-200 focus:ring-amber-500`}
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                 <AlertCircle className="w-5 h-5 text-muted-foreground" />
                 <p className="text-[10px] text-muted-foreground leading-tight">
                   Notices with an expiry date will automatically be archived from the public view once the date passes.
                 </p>
              </div>
            </div>

            <div className="p-8 border-t border-border flex items-center justify-between bg-muted/10">
              <button 
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="px-8 py-3 font-bold text-muted-foreground hover:text-red-500 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={saveNotice}
                disabled={isSaving}
                className="px-12 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-accent transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span className="text-lg">{editingNoticeId ? "Apply Updates" : "Deploy Notice"}</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
