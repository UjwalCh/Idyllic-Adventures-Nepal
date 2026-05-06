import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Upload, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import {
  getAllMedia,
  MediaAsset,
  uploadImage,
  TREK_IMAGES_BUCKET,
  JOURNAL_IMAGES_BUCKET,
  GALLERY_IMAGES_BUCKET,
  isSupabaseConfigured
} from "../../data/supabaseData";
import { toast } from "sonner";

interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  defaultBucket?: string;
  title?: string;
}

export function MediaPickerModal({ 
  open, 
  onOpenChange, 
  onSelect, 
  defaultBucket = TREK_IMAGES_BUCKET,
  title = "Select Media" 
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buckets = [
    { id: TREK_IMAGES_BUCKET, label: "Trek Images" },
    { id: JOURNAL_IMAGES_BUCKET, label: "Journal Images" },
    { id: GALLERY_IMAGES_BUCKET, label: "Gallery" },
    { id: "external", label: "External Assets" }
  ];

  const fetchMedia = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const data = await getAllMedia();
      setMedia(data);
    } catch (err) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchMedia();
      setBucketFilter("all");
    }
  }, [open]);

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBucket = bucketFilter === "all" || item.bucket === bucketFilter;
      return matchesSearch && matchesBucket;
    });
  }, [media, searchTerm, bucketFilter]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const targetBucket = bucketFilter === "all" ? defaultBucket : bucketFilter;
      const url = await uploadImage(file, targetBucket);
      toast.success("Image uploaded successfully");
      
      // Auto-select the newly uploaded image
      onSelect(url);
      onOpenChange(false);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        <div className="p-6 border-b border-border/50 bg-card/50 flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-2xl font-heading text-primary">{title}</DialogTitle>
            <DialogDescription>
              Select an image from your library or upload a new one.
            </DialogDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
             <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isSupabaseConfigured}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading..." : "Upload New"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none"
            />
          </div>
          <div className="flex bg-background border border-border rounded-xl p-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setBucketFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                bucketFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              All Media
            </button>
            {buckets.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => setBucketFilter(bucket.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  bucketFilter === bucket.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/10 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">No media found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm ? "Try adjusting your search or bucket filter." : "Upload some images to your library to see them here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredMedia.map((asset) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset.url);
                    onOpenChange(false);
                  }}
                  className="group relative aspect-square bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent hover:border-transparent transition-all shadow-sm hover:shadow-md"
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-white mb-2" />
                    <span className="text-white text-xs font-bold truncate w-full px-2">{asset.name}</span>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      {buckets.find(b => b.id === asset.bucket)?.label || asset.bucket}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
