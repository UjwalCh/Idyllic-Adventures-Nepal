import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, Trash2, Search, Image as ImageIcon, Replace, Folder, Copy, Filter, CheckCircle2, Loader2, Link } from "lucide-react";
import { toast } from "sonner";
import {
  isSupabaseConfigured,
  TREK_IMAGES_BUCKET,
  JOURNAL_IMAGES_BUCKET,
  GALLERY_IMAGES_BUCKET,
  getAllMedia,
  MediaAsset,
  deleteMediaAsset,
  uploadImage,
  renameMediaAsset
} from "../../data/supabaseData";
import { Edit } from "lucide-react";

export function AdminImagesPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAllMedia();
      setMedia(data);
    } catch (err) {
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMedia();
  }, []);

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBucket = bucketFilter === "all" || item.bucket === bucketFilter;
      return matchesSearch && matchesBucket;
    });
  }, [media, searchTerm, bucketFilter]);

  const handleUploadClick = (bucket: string) => {
    setBucketFilter(bucket); // auto select bucket
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // determine which bucket to upload to
    const targetBucket = bucketFilter === "all" ? TREK_IMAGES_BUCKET : bucketFilter;
    
    setIsUploading(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadImage(files[i], targetBucket);
        successCount++;
      }
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image(s)`);
        await fetchMedia();
      }
    } catch (error) {
      toast.error("Some uploads failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (bucket: string, name: string) => {
    if (bucket === "external") {
      toast.error("Cannot delete external assets directly. They must be removed from the respective database entries.");
      return;
    }
    if (confirm("Are you sure you want to delete this asset? This cannot be undone and may break links on the site.")) {
      try {
        await deleteMediaAsset(bucket, name);
        toast.success("Image deleted");
        setMedia(prev => prev.filter(m => m.name !== name));
      } catch (err) {
        toast.error("Failed to delete image");
      }
    }
  };

  const handleRename = async (bucket: string, oldName: string) => {
    if (bucket === "external") {
      toast.error("Cannot rename external assets");
      return;
    }
    const newName = prompt("Enter new filename (include extension):", oldName);
    if (!newName || newName === oldName) return;

    try {
      await renameMediaAsset(bucket, oldName, newName);
      toast.success("Image renamed successfully");
      await fetchMedia();
    } catch (err) {
      toast.error("Failed to rename image. Ensure the name is unique.");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
              <Folder className="w-4 h-4" />
              Global Storage
            </div>
            <h1 className="font-heading text-5xl text-primary mb-2">Media Library</h1>
            <p className="text-muted-foreground">Manage all your uploaded assets across treks, journal entries, and gallery.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
             <button
              onClick={() => handleUploadClick(bucketFilter === "all" ? TREK_IMAGES_BUCKET : bucketFilter)}
              disabled={isUploading || !isSupabaseConfigured}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all border border-transparent disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isUploading ? "Uploading..." : `Upload to ${bucketFilter === "all" ? "Trek Images" : buckets.find(b => b.id === bucketFilter)?.label}`}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 bg-muted/30 rounded-3xl border border-border mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="pl-12 pr-6 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent w-64 transition-all"
              />
            </div>
            
            <div className="flex p-1 bg-background border border-border rounded-xl">
              <button
                onClick={() => setBucketFilter("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  bucketFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All Media
              </button>
              {buckets.map((bucket) => (
                <button
                  key={bucket.id}
                  onClick={() => setBucketFilter(bucket.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    bucketFilter === bucket.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm font-bold text-muted-foreground px-4">
            {filteredMedia.length} Assets
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div className="py-20 text-center bg-blue-50/50 rounded-[3rem] border-4 border-dashed border-blue-200">
            <ImageIcon className="w-16 h-16 mx-auto text-blue-300 mb-6" />
            <h3 className="text-2xl font-bold text-blue-900">Supabase Not Configured</h3>
            <p className="text-blue-700/80">Set your environment variables to enable the global media library.</p>
          </div>
        ) : loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-accent" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="py-20 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-border/50">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
            <h3 className="text-2xl font-bold text-muted-foreground">Library is empty</h3>
            <p className="text-muted-foreground/60">Upload some images to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredMedia.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-xl transition-all"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button
                      onClick={() => copyToClipboard(asset.url)}
                      className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center gap-2"
                      title="Copy URL"
                    >
                      <Link className="w-4 h-4" />
                      <span className="text-xs font-bold">Copy URL</span>
                    </button>
                    <div className="flex gap-2 w-full px-8">
                      <button
                        onClick={() => handleRename(asset.bucket, asset.name)}
                        className="flex-1 p-3 bg-blue-500/80 hover:bg-blue-600 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center justify-center gap-2"
                        title="Rename"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-xs font-bold">Rename</span>
                      </button>
                      <button
                        onClick={() => handleDelete(asset.bucket, asset.name)}
                        className="p-3 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xs font-bold mb-1 truncate" title={asset.name}>{asset.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {buckets.find(b => b.id === asset.bucket)?.label || asset.bucket}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatSize(asset.size)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
