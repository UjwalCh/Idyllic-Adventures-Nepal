import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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
} from "../../data/supabaseData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export function AdminNoticesPage() {
  const { notices } = useNotices();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    type: "info" as Notice["type"],
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
    setNewNotice({ title: "", message: "", type: "info" });
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
      if (editingNoticeId) {
        await updateNotice(editingNoticeId, {
          title: newNotice.title.trim(),
          message: newNotice.message.trim(),
          type: newNotice.type,
        });
        toast.success("Notice updated successfully");
      } else {
        await createNotice({
          title: newNotice.title.trim(),
          message: newNotice.message.trim(),
          date: new Date().toISOString().slice(0, 10),
          type: newNotice.type,
        });
        toast.success("Notice added successfully");
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save notice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }
    if (confirm("Are you sure you want to delete this notice?")) {
      try {
        await deleteNotice(id);
        toast.success("Notice deleted successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete notice");
      }
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl mb-2">Manage Notices</h1>
            <p className="text-muted-foreground">
              Create and update notices displayed on your website
            </p>
          </div>
          <button
            onClick={() => void openAddDialog()}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Notice</span>
          </button>
        </div>

        <div className="space-y-4">
          {notices.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg">{notice.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        notice.type === "success"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : notice.type === "warning"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {notice.type}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3">{notice.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Published: {new Date(notice.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void openEditDialog(notice)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-accent" />
                  </button>
                  <button
                    onClick={() => void handleDelete(notice.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {notices.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">
              No notices available. Add your first notice!
            </p>
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNoticeId ? "Edit Notice" : "Add New Notice"}</DialogTitle>
              <DialogDescription>
                Create a notice for the homepage banner or update an existing one.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Title *</label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) =>
                    setNewNotice((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Notice title"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Message *</label>
                <textarea
                  value={newNotice.message}
                  onChange={(e) =>
                    setNewNotice((prev) => ({ ...prev, message: e.target.value }))
                  }
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Notice message"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Type</label>
                <select
                  value={newNotice.type}
                  onChange={(e) =>
                    setNewNotice((prev) => ({
                      ...prev,
                      type: e.target.value as Notice["type"],
                    }))
                  }
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveNotice()}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Saving..." : editingNoticeId ? "Update Notice" : "Create Notice"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Configure Supabase environment variables to enable live edits.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
