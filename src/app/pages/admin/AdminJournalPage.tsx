import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, Calendar, Tag, CheckCircle2, BookOpen, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useJournal } from "../../data/useRealtimeData";
import { createJournalEntry, deleteJournalEntry, updateJournalEntry, JournalEntry, uploadImage, JOURNAL_IMAGES_BUCKET } from "../../data/supabaseData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type JournalFormState = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  category: string;
  published: boolean;
};

const defaultFormState: JournalFormState = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
  category: "Adventure",
  published: true,
};

const fieldClassName = "w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent";

export function AdminJournalPage() {
  const { entries, loading } = useJournal(false); // fetch all including unpublished
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formState, setFormState] = useState<JournalFormState>(defaultFormState);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, JOURNAL_IMAGES_BUCKET);
      setFormState(prev => ({ ...prev, image: publicUrl }));
      toast.success("Cover image uploaded!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormState(prev => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug
    }));
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setFormState({
      title: entry.title,
      slug: entry.slug,
      content: entry.content,
      excerpt: entry.excerpt || "",
      image: entry.image || "",
      category: entry.category || "",
      published: entry.published,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formState.title || !formState.slug || !formState.content) {
      toast.error("Please fill in the title, slug, and content.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateJournalEntry(editingId, formState);
        toast.success("Journal entry updated!");
      } else {
        await createJournalEntry(formState);
        toast.success("Journal entry created!");
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      try {
        await deleteJournalEntry(id);
        toast.success("Entry deleted");
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl mb-2">Himalayan Journal</h1>
            <p className="text-muted-foreground">Manage your blog posts and stories</p>
          </div>
          <button
            onClick={openAddDialog}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Story</span>
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm">Story</th>
                <th className="px-6 py-4 text-sm">Category</th>
                <th className="px-6 py-4 text-sm">Status</th>
                <th className="px-6 py-4 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        <img src={entry.image || ""} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">/{entry.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">{entry.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${entry.published ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      {entry.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditDialog(entry)} className="p-2 hover:bg-muted rounded-lg text-accent">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-muted rounded-lg text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && !loading && (
            <div className="py-20 text-center text-muted-foreground">
              No journal entries found. Start by writing your first story!
            </div>
          )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Story" : "New Story"}</DialogTitle>
              <DialogDescription>Write and publish your Himalayan adventure.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm mb-2">Title</label>
                  <input
                    value={formState.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={fieldClassName}
                    placeholder="The Hidden Valleys of Mustang"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm mb-2">Slug</label>
                  <input
                    value={formState.slug}
                    onChange={(e) => setFormState(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    className={fieldClassName}
                    placeholder="hidden-valleys-mustang"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Cover Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-48 bg-muted rounded-2xl border-2 border-dashed border-border hover:border-accent transition-all cursor-pointer overflow-hidden flex items-center justify-center group"
                >
                  {formState.image ? (
                    <>
                      <img src={formState.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">Upload from device</p>
                        </>
                      )}
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </div>
                <input
                  value={formState.image}
                  onChange={(e) => setFormState(prev => ({ ...prev, image: e.target.value }))}
                  className={fieldClassName}
                  placeholder="Or paste image URL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Category</label>
                  <input
                    value={formState.category}
                    onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
                    className={fieldClassName}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="published"
                    type="checkbox"
                    checked={formState.published}
                    onChange={(e) => setFormState(prev => ({ ...prev, published: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="published" className="text-sm">Published</label>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Excerpt (Short Summary)</label>
                <textarea
                  value={formState.excerpt}
                  onChange={(e) => setFormState(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                  className={fieldClassName}
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Content</label>
                <textarea
                  value={formState.content}
                  onChange={(e) => setFormState(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  className={fieldClassName}
                  placeholder="Tell your story..."
                />
              </div>
            </div>

            <DialogFooter>
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="px-6 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingId ? "Update Story" : "Publish Story"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
