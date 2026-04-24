import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Upload, Trash2, Search, Image as ImageIcon, Replace } from "lucide-react";
import { toast } from "sonner";
import { useTreks } from "../../data/useRealtimeData";
import {
  deleteStoredTrekImage,
  isSupabaseConfigured,
  supabase,
  TREK_IMAGES_BUCKET,
  uploadTrekImage,
  updateTrek,
} from "../../data/supabaseData";
import { requireAuthenticatedSession } from "../../data/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export function AdminImagesPage() {
  const { treks } = useTreks();
  const images = useMemo(
    () =>
      treks.map((trek) => ({
      id: trek.id,
      url: trek.image,
      title: trek.title,
      uploadDate: "2026-04-15",
      })),
    [treks]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredImages = images.filter((img) =>
    img.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTrek = treks.find((trek) => trek.id === selectedTrekId) ?? null;

  const ensureAdminSession = async () => {
    await requireAuthenticatedSession();
  };

  const handleOpenUpload = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable uploads.");
      return;
    }

    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    setSelectedTrekId(treks[0]?.id ?? "");
    setSelectedFile(null);
    setIsUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedTrek || !selectedFile) {
      toast.error("Choose a trek and image file first.");
      return;
    }

    try {
      setIsUploading(true);
      const publicUrl = await uploadTrekImage(selectedFile);
      await updateTrek(selectedTrek.id, { image: publicUrl });
      toast.success("Image uploaded and trek updated successfully");
      setIsUploadOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplace = async (imageUrl: string) => {
    if (!selectedTrek) {
      toast.error("Choose a trek first.");
      return;
    }

    try {
      setIsUploading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${selectedTrek.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`, {
        type: blob.type || "image/jpeg",
      });
      const publicUrl = await uploadTrekImage(file);
      await updateTrek(selectedTrek.id, { image: publicUrl });
      toast.success("Existing image replaced for selected trek");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Replace failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        const trek = treks.find((item) => item.id === id);
        if (trek?.image?.includes(TREK_IMAGES_BUCKET)) {
          await deleteStoredTrekImage(trek.image);
        }
        toast.success("Image deleted successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete image");
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
            <h1 className="font-heading text-3xl mb-2">Manage Images</h1>
            <p className="text-muted-foreground">
              Upload and organize images for your trek packages
            </p>
          </div>
          <button
            onClick={() => void handleOpenUpload()}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Images</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images..."
              className="w-full pl-11 pr-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-3 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm mb-1 line-clamp-1">{image.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Uploaded: {image.uploadDate}
                </p>
                <button
                  onClick={() => void handleReplace(image.url)}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-accent hover:underline"
                >
                  <Replace className="h-3.5 w-3.5" />
                  Replace for selected trek
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {searchTerm ? "No images match your search." : "No images available."}
            </p>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Create a public storage bucket named <strong>{TREK_IMAGES_BUCKET}</strong> in Supabase Storage.
            </p>
          </div>
        )}

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Trek Image</DialogTitle>
              <DialogDescription>
                Upload a file to Supabase Storage and connect it to a trek record immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Select Trek</label>
                <Select value={selectedTrekId} onValueChange={setSelectedTrekId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a trek" />
                  </SelectTrigger>
                  <SelectContent>
                    {treks.map((trek) => (
                      <SelectItem key={trek.id} value={trek.id}>
                        {trek.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-2">Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
                />
              </div>

              {selectedFile && selectedTrek && (
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    <h3 className="font-semibold">Upload Preview</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[180px_1fr] items-start">
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt={selectedFile.name}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Selected trek:</strong> {selectedTrek.title}</p>
                      <p><strong>File:</strong> {selectedFile.name}</p>
                      <p><strong>Bucket:</strong> {TREK_IMAGES_BUCKET}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Upload and Attach"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
