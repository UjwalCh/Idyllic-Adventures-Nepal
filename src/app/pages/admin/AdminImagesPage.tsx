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
  bulkDeleteMediaAssets,
  uploadImage,
  renameMediaAsset,
  updateMediaReferences
} from "../../data/supabaseData";
import { Edit } from "lucide-react";

export function AdminImagesPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameModal, setRenameModal] = useState<{open: boolean, bucket: string, oldName: string, newName: string}>({
    open: false, bucket: "", oldName: "", newName: ""
  });
  const [deleteModal, setDeleteModal] = useState<{open: boolean, count: number, onConfirm: () => void | Promise<void>}>({
    open: false, count: 0, onConfirm: () => {}
  });
  const [isDeleting, setIsDeleting] = useState(false);
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
    let result = media.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBucket = bucketFilter === "all" || item.bucket === bucketFilter;
      return matchesSearch && matchesBucket;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "size") {
        comparison = (a.size || 0) - (b.size || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [media, searchTerm, bucketFilter, sortBy, sortOrder]);

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
      toast.error("This is an External Link. You can't delete it from storage, but you can change it in the Trek/Page settings where it is used.");
      return;
    }
    
    setDeleteModal({
      open: true,
      count: 1,
      onConfirm: async () => {
        try {
          await deleteMediaAsset(bucket, name);
          toast.success("Image deleted");
          setMedia(prev => prev.filter(m => m.name !== name));
          setSelectedIds(prev => {
            const next = new Set(prev);
            // find the id for this name
            const assetToDelete = media.find(m => m.name === name && m.bucket === bucket);
            if (assetToDelete) next.delete(assetToDelete.id);
            return next;
          });
        } catch (err) {
          toast.error("Failed to delete image");
        }
      }
    });
  };

  const handleRenameClick = (bucket: string, name: string) => {
    if (bucket === "external") {
      toast.error("This is an External Link. To rename it, use the 'Import' feature to add it to your library first.");
      return;
    }
    setRenameModal({ open: true, bucket, oldName: name, newName: name });
  };

  const confirmRename = async () => {
    const { bucket, oldName, newName } = renameModal;
    if (!newName || newName === oldName) {
      setRenameModal(prev => ({ ...prev, open: false }));
      return;
    }

    try {
      await renameMediaAsset(bucket, oldName, newName);
      toast.success("Image renamed successfully");
      await fetchMedia();
    } catch (err) {
      toast.error("Failed to rename image. Ensure the name is unique.");
    } finally {
      setRenameModal(prev => ({ ...prev, open: false }));
    }
  };

  const handleImportExternal = async (url: string, name: string) => {
    if (isImporting) return;
    setIsImporting(true);
    const toastId = toast.loading("Importing image to your library...");
    
    try {
      // 1. Fetch image as blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 2. Create file from blob
      const extension = url.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
      const fileName = name.includes('.') ? name : `${name}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });
      
      // 3. Upload to Trek Images bucket by default
      const newUrl = await uploadImage(file, TREK_IMAGES_BUCKET);
      
      // 4. Update references across the site
      await updateMediaReferences(url, newUrl);
      
      toast.success("Successfully imported and updated site links!", { id: toastId });
      await fetchMedia();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import image. The remote server may be blocking direct access.", { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setDeleteModal({
      open: true,
      count,
      onConfirm: async () => {
        setIsDeleting(true);
        const toastId = toast.loading(`Deleting ${count} assets...`);
        
        try {
          const assetsToDelete = Array.from(selectedIds)
            .map(id => media.find(m => m.id === id))
            .filter(a => a && a.bucket !== "external") as MediaAsset[];

          await bulkDeleteMediaAssets(assetsToDelete);
          
          toast.success(`Deleted ${assetsToDelete.length} assets`, { id: toastId });
          setSelectedIds(new Set());
          await fetchMedia();
        } catch (error) {
          toast.error("Failed to delete some assets", { id: toastId });
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleBulkImport = async () => {
    const externalAssets = Array.from(selectedIds)
      .map(id => media.find(m => m.id === id))
      .filter(m => m?.bucket === "external") as MediaAsset[];
      
    if (externalAssets.length === 0) {
      toast.error("No external links selected for import");
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading(`Importing ${externalAssets.length} images...`);
    let success = 0;

    for (const asset of externalAssets) {
      try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        const extension = asset.url.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
        const fileName = asset.name.includes('.') ? asset.name : `${asset.name}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type });
        const newUrl = await uploadImage(file, TREK_IMAGES_BUCKET);
        
        // Update references for each imported asset
        await updateMediaReferences(asset.url, newUrl);
        success++;
      } catch (e) { /* ignore */ }
    }

    toast.success(`Imported & Synced ${success} images`, { id: toastId });
    setSelectedIds(new Set());
    setIsImporting(false);
    await fetchMedia();
  };

  const handleBulkCopy = () => {
    const urls = Array.from(selectedIds)
      .map(id => media.find(m => m.id === id)?.url)
      .filter(Boolean)
      .join("\n");
    
    navigator.clipboard.writeText(urls);
    toast.success(`Copied ${selectedIds.size} URLs to clipboard`);
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

            <div className="flex items-center gap-2 px-4 py-1.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Sort</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <button 
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="p-1 hover:bg-muted rounded-md transition-all ml-1"
                title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
              >
                <Filter className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "" : "rotate-180"}`} />
              </button>
            </div>

            <button
              onClick={selectAll}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold transition-all"
            >
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <div className="w-4 h-4 border-2 border-muted-foreground rounded-sm" />}
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? "Deselect All" : "Select All"}
            </button>
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
                <div 
                  className={`relative aspect-square overflow-hidden bg-muted cursor-pointer ${selectedIds.has(asset.id) ? "ring-4 ring-accent ring-inset" : ""}`}
                  onClick={() => toggleSelect(asset.id)}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Selection Overlay */}
                  <div className={`absolute top-2 right-2 p-1 rounded-full transition-all ${selectedIds.has(asset.id) ? "bg-accent text-white scale-110 shadow-lg" : "bg-black/20 text-white/50 opacity-0 group-hover:opacity-100"}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  {asset.bucket === "external" && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg shadow-lg flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      External
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 pointer-events-none group-hover:pointer-events-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(asset.url); }}
                      className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center gap-2"
                      title="Copy URL"
                    >
                      <Link className="w-4 h-4" />
                      <span className="text-xs font-bold">Copy URL</span>
                    </button>
                    <div className="flex gap-2 w-full px-8">
                      {asset.bucket === "external" ? (
                        <button
                          onClick={() => handleImportExternal(asset.url, asset.name)}
                          disabled={isImporting}
                          className="flex-1 p-3 bg-amber-500/80 hover:bg-amber-600 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center justify-center gap-2"
                          title="Import to Library"
                        >
                          <Replace className="w-4 h-4" />
                          <span className="text-xs font-bold">Import</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRenameClick(asset.bucket, asset.name)}
                          className="flex-1 p-3 bg-blue-500/80 hover:bg-blue-600 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center justify-center gap-2"
                          title="Rename"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs font-bold">Rename</span>
                        </button>
                      )}
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

        {/* Custom Rename Modal */}
        {renameModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-heading mb-2">Rename Asset</h3>
              <p className="text-sm text-muted-foreground mb-6">Enter a new name for your file. Include the file extension.</p>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Name</label>
                  <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground truncate">{renameModal.oldName}</div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary">New Filename</label>
                  <input
                    autoFocus
                    value={renameModal.newName}
                    onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                    className="w-full p-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                    onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setRenameModal(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-3 px-6 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRename}
                  className="flex-1 py-3 px-6 rounded-xl text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg"
                >
                  Confirm Rename
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110]">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Selection</span>
                <span className="text-xl font-heading leading-none">{selectedIds.size} Assets</span>
              </div>
              
              <div className="h-8 w-px bg-white/20" />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all text-xs disabled:opacity-50"
                >
                  <Replace className="w-4 h-4" />
                  Bulk Import
                </button>
                
                <button
                  onClick={handleBulkCopy}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all text-xs"
                >
                  <Copy className="w-4 h-4" />
                  Copy URLs
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-4 p-3 text-white/60 hover:text-white transition-colors"
                  title="Deselect All"
                >
                  <CheckCircle2 className="w-5 h-5 opacity-40 hover:opacity-100" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-heading mb-2">Delete {deleteModal.count > 1 ? `${deleteModal.count} Assets` : "Asset"}?</h3>
              <p className="text-sm text-muted-foreground mb-8">This action is permanent and cannot be undone. It may break links if these images are in use.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    await deleteModal.onConfirm();
                    setDeleteModal(prev => ({ ...prev, open: false }));
                  }}
                  disabled={isDeleting}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
                <button
                  onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))}
                  disabled={isDeleting}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-bold bg-muted hover:bg-muted/80 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
