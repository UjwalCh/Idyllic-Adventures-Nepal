import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  CheckCircle2,
  Upload,
  ImageUp,
  Mountain,
  Plus,
  Edit2,
  Trash2,
  Star,
} from "lucide-react";
import { Trek } from "../../data/mockData";
import { toast } from "sonner";
import { useTreks } from "../../data/useRealtimeData";
import { requireAuthenticatedSession } from "../../data/auth";
import {
  createTrek,
  deleteTrek,
  isSupabaseConfigured,
  toggleFeaturedTrek,
  updateTrek,
  uploadTrekImage,
} from "../../data/supabaseData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

type TrekFormState = {
  title: string;
  description: string;
  duration: string;
  difficulty: Trek["difficulty"];
  maxAltitude: string;
  bestSeason: string;
  groupSize: string;
  price: string;
  image: string;
  featured: boolean;
  highlightsText: string;
  itineraryText: string;
  gallery: string[];
};

const defaultFormState: TrekFormState = {
  title: "",
  description: "",
  duration: "",
  difficulty: "Moderate",
  maxAltitude: "",
  bestSeason: "",
  groupSize: "",
  price: "",
  image: "https://images.unsplash.com/photo-1701255136052-b33f78a886a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  featured: false,
  highlightsText: "",
  itineraryText: "",
  gallery: [],
};

const fieldClassName =
  "w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent";

export function AdminTreksPage() {
  const { treks } = useTreks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrekId, setEditingTrekId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDropActive, setIsDropActive] = useState(false);
  const [formState, setFormState] = useState<TrekFormState>(defaultFormState);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const livePreview = useMemo<Trek>(() => {
    const itinerary = formState.itineraryText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [titlePart, descriptionPart] = line.split("|").map((part) => part.trim());
        return {
          day: index + 1,
          title: titlePart || `Day ${index + 1}`,
          description: descriptionPart || "Plan details here.",
        };
      });

    return {
      id: editingTrekId ?? "preview",
      title: formState.title || "Trek Title Preview",
      description:
        formState.description ||
        "A clear trek summary will appear here as you type the content for your website.",
      duration: formState.duration || "Duration",
      difficulty: formState.difficulty,
      maxAltitude: formState.maxAltitude || "Max altitude",
      bestSeason: formState.bestSeason || "Best season",
      groupSize: formState.groupSize || "Group size",
      price: formState.price || "Price",
      image: formState.image,
      featured: formState.featured,
      highlights: formState.highlightsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      itinerary,
    };
  }, [editingTrekId, formState]);

  useEffect(() => {
    return () => {
      if (formState.image.startsWith("blob:")) {
        URL.revokeObjectURL(formState.image);
      }
    };
  }, [formState.image]);

  const ensureConfigured = () => {
    if (!isSupabaseConfigured) {
      toast.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live edits");
      return false;
    }
    return true;
  };

  const ensureAdminSession = async () => {
    await requireAuthenticatedSession();
  };

  const parseHighlights = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const parseItinerary = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [titlePart, descriptionPart] = line.split("|").map((part) => part.trim());
        return {
          day: index + 1,
          title: titlePart || `Day ${index + 1}`,
          description: descriptionPart || "Plan details here.",
        };
      });

  const openAddDialog = async () => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    setEditingTrekId(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleDeviceImageUpload = async (file: File | null) => {
    if (!file) return;
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(12);
      const publicUrl = await uploadTrekImage(file);
      setUploadProgress(82);
      setFormState((prev) => ({ ...prev, image: publicUrl }));
      setUploadProgress(100);
      toast.success("Image uploaded from your device");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
      window.setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    await handleDeviceImageUpload(file);
  };

  const openEditDialog = async (trek: Trek) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    setEditingTrekId(trek.id);
    setFormState({
      title: trek.title,
      description: trek.description,
      duration: trek.duration,
      difficulty: trek.difficulty,
      maxAltitude: trek.maxAltitude,
      bestSeason: trek.bestSeason,
      groupSize: trek.groupSize,
      price: trek.price,
      image: trek.image,
      featured: trek.featured,
      highlightsText: trek.highlights.join("\n"),
      itineraryText: trek.itinerary.map((day) => `${day.title} | ${day.description}`).join("\n"),
      gallery: trek.gallery || [],
    });
    setIsFormOpen(true);
  };

  const saveTreksForm = async () => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    const payload: Trek = {
      id: editingTrekId ?? crypto.randomUUID(),
      title: formState.title.trim(),
      description: formState.description.trim(),
      duration: formState.duration.trim(),
      difficulty: formState.difficulty,
      maxAltitude: formState.maxAltitude.trim(),
      bestSeason: formState.bestSeason.trim(),
      groupSize: formState.groupSize.trim(),
      price: formState.price.trim(),
      image: formState.image.trim(),
      featured: formState.featured,
      highlights: parseHighlights(formState.highlightsText),
      itinerary: parseItinerary(formState.itineraryText),
      gallery: formState.gallery,
    };

    if (!payload.title || !payload.description || !payload.duration || !payload.maxAltitude || !payload.bestSeason || !payload.groupSize || !payload.price || !payload.image) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingTrekId) {
        await updateTrek(editingTrekId, payload);
        toast.success("Trek updated successfully");
      } else {
        await createTrek(payload);
        toast.success("Trek created successfully");
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save trek");
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
    if (confirm("Are you sure you want to delete this trek?")) {
      try {
        await deleteTrek(id);
        toast.success("Trek deleted successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete trek");
      }
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }
    try {
      await toggleFeaturedTrek(id, !featured);
      toast.success("Trek updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update trek");
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
            <h1 className="font-heading text-3xl mb-2">Manage Treks</h1>
            <p className="text-muted-foreground">
              Add, edit, or remove trek packages from your website
            </p>
          </div>
          <button
            onClick={() => void openAddDialog()}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Trek</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-50 bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 mb-8 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                {selectedIds.length}
              </div>
              <span className="font-bold">Treks Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (confirm(`Feature ${selectedIds.length} treks?`)) {
                    for (const id of selectedIds) await toggleFeaturedTrek(id, true);
                    setSelectedIds([]);
                    toast.success("Bulk update successful");
                  }
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all"
              >
                Feature All
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Delete ${selectedIds.length} treks permanently?`)) {
                    for (const id of selectedIds) await deleteTrek(id);
                    setSelectedIds([]);
                    toast.success("Bulk delete successful");
                  }
                }}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-sm font-bold transition-all"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedIds.length === treks.length && treks.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(treks.map((t) => t.id));
                        else setSelectedIds([]);
                      }}
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-sm">Trek</th>
                  <th className="text-left px-6 py-4 text-sm">Duration</th>
                  <th className="text-left px-6 py-4 text-sm">Difficulty</th>
                  <th className="text-left px-6 py-4 text-sm">Price</th>
                  <th className="text-left px-6 py-4 text-sm">Status</th>
                  <th className="text-right px-6 py-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {treks.map((trek) => (
                  <tr key={trek.id} className={`border-b border-border last:border-0 transition-colors ${selectedIds.includes(trek.id) ? "bg-accent/5" : ""}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedIds.includes(trek.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((prev) => [...prev, trek.id]);
                          else setSelectedIds((prev) => prev.filter((id) => id !== trek.id));
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={trek.image}
                            alt={trek.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-sm mb-1">{trek.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {trek.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{trek.duration}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          trek.difficulty === "Easy"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : trek.difficulty === "Moderate"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : trek.difficulty === "Challenging"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {trek.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{trek.price}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => void handleToggleFeatured(trek.id, trek.featured)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          trek.featured
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Star
                          className={`w-3 h-3 ${
                            trek.featured ? "fill-accent" : ""
                          }`}
                        />
                        <span>{trek.featured ? "Featured" : "Regular"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void openEditDialog(trek)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-accent" />
                        </button>
                        <button
                          onClick={() => void handleDelete(trek.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {treks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No treks available. Add your first trek!</p>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Configure Supabase environment variables to enable live edits.
            </p>
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[96vw] max-w-[96vw] h-[96vh] overflow-hidden p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingTrekId ? "Edit Trek" : "Add New Trek"}</DialogTitle>
              <DialogDescription>
                Fill in the trek details, highlights, and itinerary. Changes save directly to Supabase.
              </DialogDescription>
            </DialogHeader>

            <div className="grid h-[calc(96vh-9rem)] min-h-0 gap-5 overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
              <div className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4">
                <section className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-accent" />
                    <h3 className="font-heading text-lg">Trek Basics</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-2">Title *</label>
                      <input
                        value={formState.title}
                        onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                        className={fieldClassName}
                        placeholder="Everest Base Camp Trek"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm mb-2">Description *</label>
                      <textarea
                        value={formState.description}
                        onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className={`${fieldClassName} resize-none`}
                        placeholder="Short trek description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Duration *</label>
                      <input
                        value={formState.duration}
                        onChange={(e) => setFormState((prev) => ({ ...prev, duration: e.target.value }))}
                        className={fieldClassName}
                        placeholder="14 Days"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Difficulty *</label>
                      <Select
                        value={formState.difficulty}
                        onValueChange={(value) =>
                          setFormState((prev) => ({ ...prev, difficulty: value as Trek["difficulty"] }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Challenging">Challenging</SelectItem>
                          <SelectItem value="Strenuous">Strenuous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Max Altitude *</label>
                      <input
                        value={formState.maxAltitude}
                        onChange={(e) => setFormState((prev) => ({ ...prev, maxAltitude: e.target.value }))}
                        className={fieldClassName}
                        placeholder="5,364m / 17,598ft"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Best Season *</label>
                      <input
                        value={formState.bestSeason}
                        onChange={(e) => setFormState((prev) => ({ ...prev, bestSeason: e.target.value }))}
                        className={fieldClassName}
                        placeholder="March-May, Sept-Nov"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Group Size *</label>
                      <input
                        value={formState.groupSize}
                        onChange={(e) => setFormState((prev) => ({ ...prev, groupSize: e.target.value }))}
                        className={fieldClassName}
                        placeholder="2-12 people"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Price *</label>
                      <input
                        value={formState.price}
                        onChange={(e) => setFormState((prev) => ({ ...prev, price: e.target.value }))}
                        className={fieldClassName}
                        placeholder="$1,450 per person"
                      />
                    </div>
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    <h3 className="font-heading text-lg">Content Details</h3>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm">Image URL *</label>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-60"
                        >
                          <ImageUp className="h-4 w-4" />
                          {isUploadingImage ? "Uploading..." : "Upload from Device"}
                        </button>
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleDeviceImageUpload(e.target.files?.[0] ?? null)}
                      />
                      <div
                        onDragEnter={() => setIsDropActive(true)}
                        onDragLeave={() => setIsDropActive(false)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDropActive(true);
                        }}
                        onDrop={handleDrop}
                        className={`mb-3 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                          isDropActive
                            ? "border-accent bg-accent/5"
                            : "border-border bg-muted/10"
                        }`}
                      >
                        <Upload className="mx-auto mb-2 h-5 w-5 text-accent" />
                        <p className="text-sm font-medium">Drag and drop an image here</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Or use the upload button above to pick a file from your device.
                        </p>
                      </div>
                      <input
                        value={formState.image}
                        onChange={(e) => setFormState((prev) => ({ ...prev, image: e.target.value }))}
                        className={fieldClassName}
                        placeholder="https://..."
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Use the button to upload an image from your device, or paste a public URL.
                      </p>
                      {isUploadingImage && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Uploading image</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${Math.max(uploadProgress, 10)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Highlights</label>
                      <textarea
                        value={formState.highlightsText}
                        onChange={(e) => setFormState((prev) => ({ ...prev, highlightsText: e.target.value }))}
                        rows={4}
                        className={`${fieldClassName} resize-none`}
                        placeholder="One highlight per line"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Itinerary</label>
                      <textarea
                        value={formState.itineraryText}
                        onChange={(e) => setFormState((prev) => ({ ...prev, itineraryText: e.target.value }))}
                        rows={6}
                        className={`${fieldClassName} resize-none`}
                        placeholder="Day title | Day description, one line per day"
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <input
                        id="featured"
                        type="checkbox"
                        checked={formState.featured}
                        onChange={(e) => setFormState((prev) => ({ ...prev, featured: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="featured" className="text-sm">
                        Mark as featured trek
                      </label>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/10 p-5 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ImageUp className="w-5 h-5 text-accent" />
                          <h4 className="font-bold">Trek Gallery</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="text-xs px-3 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 font-bold"
                        >
                          Add Photos
                        </button>
                        <input
                          ref={galleryInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            toast.loading(`Uploading ${files.length} photos...`);
                            const urls = await Promise.all(files.map(f => uploadTrekImage(f)));
                            setFormState(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
                            toast.dismiss();
                            toast.success("Gallery updated");
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {formState.gallery.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-border">
                            <img src={url} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setFormState(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="w-3 h-3 rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <h3 className="font-heading text-lg">Live Preview</h3>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-md">
                  <div className="relative h-[20rem] xl:h-[22rem]">
                    <img src={livePreview.image} alt={livePreview.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white text-sm">
                      <span>{livePreview.duration}</span>
                      <span>{livePreview.difficulty}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-heading text-2xl leading-tight">{livePreview.title}</h4>
                      {livePreview.featured && (
                        <span className="rounded-full bg-accent/15 px-2 py-1 text-xs text-accent">Featured</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{livePreview.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="mb-1 uppercase tracking-wide">Altitude</div>
                        <div className="text-foreground">{livePreview.maxAltitude}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="mb-1 uppercase tracking-wide">Season</div>
                        <div className="text-foreground">{livePreview.bestSeason}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="mb-1 uppercase tracking-wide">Group</div>
                        <div className="text-foreground">{livePreview.groupSize}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="mb-1 uppercase tracking-wide">Price</div>
                        <div className="text-foreground">{livePreview.price}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="mb-2 text-sm font-semibold">Highlights</h4>
                  {livePreview.highlights.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {livePreview.highlights.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Add highlights line by line to see them here.</p>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="mb-2 text-sm font-semibold">Image Source</h4>
                  <p className="text-sm text-muted-foreground break-all">{formState.image}</p>
                </div>
              </aside>
            </div>

            <DialogFooter className="flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveTreksForm()}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Saving..." : editingTrekId ? "Update Trek" : "Create Trek"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
