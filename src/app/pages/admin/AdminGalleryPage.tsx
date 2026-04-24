import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGallery } from "../../data/useRealtimeData";
import { addGalleryImage, deleteGalleryImage, uploadImage, GALLERY_IMAGES_BUCKET } from "../../data/supabaseData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const fieldClassName = "w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent";

export function AdminGalleryPage() {
  const { images, loading } = useGallery();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    url: "",
    category: "Landscape",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, GALLERY_IMAGES_BUCKET);
      setFormState(prev => ({ ...prev, url: publicUrl }));
      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error("Upload failed. Please check if the bucket exists.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formState.url) {
      toast.error("Please upload an image or provide a URL.");
      return;
    }

    setIsSaving(true);
    try {
      await addGalleryImage(formState);
      toast.success("Image added to gallery!");
      setIsFormOpen(false);
      setFormState({ title: "", description: "", url: "", category: "Landscape" });
    } catch (err) {
      toast.error("Failed to add image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this image from gallery?")) {
      try {
        await deleteGalleryImage(id);
        toast.success("Image removed");
      } catch (err) {
        toast.error("Failed to remove");
      }
    }
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl mb-2">Photo Gallery</h1>
            <p className="text-muted-foreground">Manage high-resolution photos for the site gallery</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map((image) => (
            <motion.div
              key={image.id}
              layout
              className="group relative aspect-square bg-muted rounded-2xl overflow-hidden border border-border shadow-sm"
            >
              <img src={image.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-3 bg-destructive text-white rounded-full hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-white text-xs font-bold truncate">{image.title || "Untitled"}</div>
                <div className="text-white/60 text-[10px] uppercase tracking-wider">{image.category}</div>
              </div>
            </motion.div>
          ))}
          {images.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your gallery is empty. Start by adding some photos!</p>
            </div>
          )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Photo to Gallery</DialogTitle>
              <DialogDescription>Share a new moment from the Himalayas.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Upload Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video bg-muted rounded-2xl border-2 border-dashed border-border hover:border-accent transition-all cursor-pointer overflow-hidden flex items-center justify-center group"
                >
                  {formState.url ? (
                    <>
                      <img src={formState.url} alt="Preview" className="w-full h-full object-cover" />
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
                          <p className="text-xs text-muted-foreground">Click to upload from device</p>
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
                <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">— or provide URL —</div>
                <input
                  value={formState.url}
                  onChange={(e) => setFormState(prev => ({ ...prev, url: e.target.value }))}
                  className={fieldClassName}
                  placeholder="Paste image URL here"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Title</label>
                <input
                  value={formState.title}
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  className={fieldClassName}
                  placeholder="Sunrise at Annapurna"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Category</label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
                  className={fieldClassName}
                >
                  <option value="Landscape">Landscape</option>
                  <option value="Culture">Culture</option>
                  <option value="Trekking">Trekking</option>
                  <option value="Wildlife">Wildlife</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="px-6 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
              >
                {isSaving ? "Adding..." : "Add to Gallery"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
