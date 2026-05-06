import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Loader2, 
  CheckSquare, 
  Square, 
  Video, 
  Settings2, 
  Edit3,
  Download,
  AlertCircle,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useGallery, useSiteSettings } from "../../data/useRealtimeData";
import { 
  addGalleryImage, 
  deleteGalleryImage, 
  bulkDeleteGalleryImages,
  updateGalleryImage,
  uploadImage, 
  GALLERY_IMAGES_BUCKET 
} from "../../data/supabaseData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";

const fieldClassName = "w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent transition-all";

export function AdminGalleryPage() {
  const { images, loading } = useGallery();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [bulkState, setBulkState] = useState({ category: "Landscape", albumName: "General" });
  const [useWatermark, setUseWatermark] = useState(true);
  const [isVideo, setIsVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formState, setFormState] = useState({
    id: "",
    title: "",
    description: "",
    url: "",
    category: "Landscape",
    albumName: "General",
    isVideo: false,
    videoUrl: "",
    isWatermarked: false,
  });

  const filteredImages = useMemo(() => images, [images]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === images.length) setSelectedIds([]);
    else setSelectedIds(images.map(img => img.id));
  };

  const { settings } = useSiteSettings();

  const applyWatermark = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context failed");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Fetch Logo for Watermarking
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = settings.site_logo || "/logo.png"; // Fallback to local logo
        
        logoImg.onload = () => {
          // Draw Logo as Watermark (Bottom Right)
          const logoWidth = canvas.width / 8;
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          const margin = 30;
          
          ctx.globalAlpha = 0.6;
          ctx.drawImage(
            logoImg, 
            canvas.width - logoWidth - margin, 
            canvas.height - logoHeight - margin, 
            logoWidth, 
            logoHeight
          );
          
          // Add Text Backup
          ctx.font = `bold ${Math.max(12, canvas.width / 50)}px Inter`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.textAlign = "right";
          ctx.fillText("IDYLLIC ADVENTURES NEPAL", canvas.width - margin, canvas.height - margin);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject("Blob generation failed");
          }, file.type, 0.92);
        };

        logoImg.onerror = () => {
          // Fallback to text only if logo fails
          ctx.font = `bold ${Math.max(20, canvas.width / 25)}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.textAlign = "right";
          ctx.fillText("© IDYLLIC ADVENTURES NEPAL", canvas.width - 20, canvas.height - 20);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject("Blob generation failed");
          }, file.type, 0.9);
        };
      };
      img.onerror = () => reject("Image load failed");
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    toast.loading(`Processing ${files.length} images...`, { id: "gallery-up" });
    
    try {
      for (const file of files) {
        let finalFile: File | Blob = file;
        if (useWatermark && !isVideo) {
          finalFile = await applyWatermark(file);
        }

        // Convert blob to file if watermarked
        const uploadFile = finalFile instanceof File 
          ? finalFile 
          : new File([finalFile], file.name, { type: file.type });

        const publicUrl = await uploadImage(uploadFile, GALLERY_IMAGES_BUCKET);
        
        await addGalleryImage({
          title: file.name.split(".")[0].replace(/[-_]/g, " "),
          description: "",
          url: publicUrl,
          category: formState.category,
          albumName: formState.albumName || "General",
          isVideo: false,
          isWatermarked: useWatermark,
        } as any);
      }
      toast.success(`Uploaded ${files.length} images successfully!`, { id: "gallery-up" });
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: "gallery-up" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (isVideo && !formState.videoUrl) {
      toast.error("Please provide a video URL");
      return;
    }
    if (!isVideo && !formState.url) {
      toast.error("Please upload an image");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateGalleryImage(formState.id, {
          title: formState.title,
          description: formState.description,
          category: formState.category,
          albumName: formState.albumName,
          isVideo: formState.isVideo,
          videoUrl: formState.videoUrl,
        });
        toast.success("Image updated!");
      } else {
        await addGalleryImage(formState as any);
        toast.success("Added to gallery!");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormState({
      id: "",
      title: "",
      description: "",
      url: "",
      category: "Landscape",
      albumName: "General",
      isVideo: false,
      videoUrl: "",
      isWatermarked: false,
    });
    setIsEditMode(false);
    setIsVideo(false);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      try {
        await bulkDeleteGalleryImages(selectedIds);
        toast.success("Items deleted");
        setSelectedIds([]);
      } catch (err) {
        toast.error("Bulk delete failed");
      }
    }
  };

  const handleBulkUpdate = async () => {
    setIsSaving(true);
    try {
      await Promise.all(selectedIds.map(id => 
        updateGalleryImage(id, { 
          category: bulkState.category, 
          albumName: bulkState.albumName 
        })
      ));
      toast.success(`Updated ${selectedIds.length} items`);
      setIsBulkEditOpen(false);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Bulk update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (img: any) => {
    setFormState({
      id: img.id,
      title: img.title || "",
      description: img.description || "",
      url: img.url,
      category: img.category || "Landscape",
      albumName: img.albumName || "General",
      isVideo: img.isVideo || false,
      videoUrl: img.videoUrl || "",
      isWatermarked: img.isWatermarked || false,
    });
    setIsVideo(img.isVideo || false);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
              <ImageIcon className="w-4 h-4" />
              Media Assets
            </div>
            <h1 className="font-heading text-5xl text-primary mb-2">Photo Gallery</h1>
            <p className="text-muted-foreground">Curate high-resolution visuals and trailers for the Himalayas.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkEditOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  Bulk Edit ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-accent transition-all shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Media
            </button>
          </div>
        </div>

        {/* Gallery Controls */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl mb-8 border border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={selectAll}
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              {selectedIds.length === images.length ? <CheckSquare className="w-5 h-5 text-accent" /> : <Square className="w-5 h-5" />}
              {selectedIds.length === images.length ? "Deselect All" : "Select All"}
            </button>
            <div className="w-px h-6 bg-border" />
            <div className="text-sm font-medium text-muted-foreground">
              Showing {filteredImages.length} items
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={useWatermark} 
                onChange={(e) => setUseWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Auto-Watermark</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative aspect-square bg-muted rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedIds.includes(image.id) ? "border-accent shadow-xl scale-[0.98]" : "border-transparent shadow-sm"
                }`}
              >
                <img 
                  src={image.url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000"} 
                  alt="" 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                    selectedIds.includes(image.id) ? "opacity-40" : ""
                  }`} 
                />
                
                {/* Selection Overlay */}
                <div 
                  onClick={() => toggleSelect(image.id)}
                  className={`absolute top-3 left-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    selectedIds.includes(image.id) ? "bg-accent text-white scale-110" : "bg-black/20 text-white/0 hover:bg-black/40"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  {image.isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {image.isVideo ? "Video" : "Photo"}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                   <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(image); }}
                      className="p-3 bg-white text-primary rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                      title="Edit Media"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGalleryImage(image.id); }}
                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                      title="Delete Media"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                   </div>
                   <div className="text-center px-4">
                      <div className="text-white text-sm font-bold truncate max-w-full">{image.title || "Untitled"}</div>
                      <div className="text-white/60 text-[10px] uppercase tracking-widest mt-1">{image.albumName}</div>
                   </div>
                </div>

                {image.isWatermarked && (
                  <div className="absolute bottom-3 left-3 px-1.5 py-0.5 bg-accent/80 text-white text-[8px] font-bold rounded uppercase">WM</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredImages.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-border/50">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-muted-foreground mb-2">No media found</h3>
              <p className="text-muted-foreground/60 mb-8 max-w-xs mx-auto">Upload some stunning photos or trailers to showcase the Himalayan beauty.</p>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="px-8 py-3 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
              >
                Start Uploading
              </button>
            </div>
          )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] rounded-3xl p-0 overflow-y-auto border-none shadow-2xl custom-scrollbar">
            <div className="bg-primary p-6 md:p-8 text-white sticky top-0 z-10">
              <DialogTitle className="text-2xl md:text-3xl font-heading mb-2">{isEditMode ? "Edit Media Asset" : "Add New Media"}</DialogTitle>
              <DialogDescription className="text-white/70 text-xs md:text-sm">
                {isEditMode ? "Update the details of your gallery item." : "Upload high-quality images or embed video trailers."}
              </DialogDescription>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-background">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-1 bg-muted rounded-xl">
                  <button 
                    onClick={() => setIsVideo(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${!isVideo ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}
                  >
                    <ImageIcon className="w-4 h-4" /> Photo
                  </button>
                  <button 
                    onClick={() => setIsVideo(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${isVideo ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}
                  >
                    <Video className="w-4 h-4" /> Video
                  </button>
                </div>

                {!isVideo ? (
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select or Upload Photo</label>
                    <div 
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="relative aspect-[4/3] bg-muted rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all cursor-pointer overflow-hidden flex items-center justify-center group"
                    >
                      {formState.url ? (
                        <>
                          <img src={formState.url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-white mb-2" />
                            <span className="text-white text-xs font-bold">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <>
                            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-bold text-muted-foreground">Select from Library</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Or upload a new file</p>
                          </>
                        </div>
                      )}
                    </div>

                    {useWatermark && !isEditMode && (
                      <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-xl text-accent">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Auto-watermarking is active</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Video URL</label>
                    <div className="relative group">
                      <input
                        value={formState.videoUrl}
                        onChange={(e) => setFormState(prev => ({ ...prev, videoUrl: e.target.value }))}
                        className={fieldClassName}
                        placeholder="YouTube or Vimeo URL..."
                      />
                      <Video className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    </div>
                    {formState.videoUrl && (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Video Preview Ready</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Media Title</label>
                  <input
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className={fieldClassName}
                    placeholder="e.g. Sunrise over Machhapuchhre"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Album / Collection</label>
                  <div className="relative group">
                    <input
                      value={formState.albumName}
                      onChange={(e) => setFormState(prev => ({ ...prev, albumName: e.target.value }))}
                      className={fieldClassName}
                      placeholder="e.g. Autumn Expedition 2024"
                    />
                    <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
                      className={fieldClassName}
                    >
                      {["Landscape", "Trekking", "Cultural", "Wildlife", "Expedition"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description (Alt Text)</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    className={`${fieldClassName} h-24 resize-none`}
                    placeholder="Describe the moment for accessibility..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-border flex flex-col sm:flex-row items-center gap-4 justify-between bg-muted/10 sticky bottom-0 z-10 backdrop-blur-md">
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="w-full sm:w-auto px-6 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-colors text-sm"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || (isUploading && !isEditMode)}
                className="w-full sm:w-auto px-10 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-accent transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditMode ? "Save Changes" : "Publish to Gallery"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-blue-600 p-8 text-white">
              <DialogTitle className="text-2xl font-heading mb-2">Bulk Update Media</DialogTitle>
              <DialogDescription className="text-white/70">
                Apply these changes to all {selectedIds.length} selected items.
              </DialogDescription>
            </div>
            <div className="p-8 space-y-6 bg-background">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                <select
                  value={bulkState.category}
                  onChange={(e) => setBulkState(prev => ({ ...prev, category: e.target.value }))}
                  className={fieldClassName}
                >
                  {["Landscape", "Trekking", "Cultural", "Wildlife", "Expedition"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Album Name</label>
                <input
                  value={bulkState.albumName}
                  onChange={(e) => setBulkState(prev => ({ ...prev, albumName: e.target.value }))}
                  className={fieldClassName}
                  placeholder="e.g. Winter 2024"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                 <AlertCircle className="w-5 h-5 text-muted-foreground" />
                 <p className="text-[10px] text-muted-foreground leading-tight">
                   This will overwrite the category and album for all selected items. Title and description will remain unchanged.
                 </p>
              </div>
            </div>
            <div className="p-8 border-t border-border flex items-center justify-between bg-muted/10">
              <button 
                onClick={() => setIsBulkEditOpen(false)}
                className="font-bold text-muted-foreground hover:text-red-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={isSaving}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Apply to {selectedIds.length} Items
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <MediaPickerModal 
          open={isMediaPickerOpen} 
          onOpenChange={setIsMediaPickerOpen} 
          onSelect={(url) => setFormState(prev => ({ ...prev, url }))} 
          defaultBucket={GALLERY_IMAGES_BUCKET}
        />
      </motion.div>
    </div>
  );
}
