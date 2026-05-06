import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Users, 
  ChevronRight, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Edit3, 
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  Download,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useInquiries } from "../../data/useRealtimeData";
import { 
  updateInquiryStatus, 
  deleteInquiry, 
  bulkDeleteInquiries, 
  bulkUpdateInquiryStatus,
  exportToCSV,
  unspamInquiry,
  updateSiteSettings
} from "../../data/supabaseData";
import { InquiriesKanbanBoard } from "./InquiriesKanbanBoard";
import { useSiteSettings } from "../../data/useRealtimeData";

export function AdminInquiriesPage() {
  const { inquiries, loading } = useInquiries();
  const { settings, refresh: refreshSettings } = useSiteSettings();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [filter, setFilter] = useState<"all" | "new" | "in_progress" | "closed" | "spam">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const toggleEmailAlerts = async () => {
    try {
      setIsUpdatingSettings(true);
      const isEnabled = settings.enquiry_notifications_enabled === "true";
      await updateSiteSettings({ 
        enquiry_notifications_enabled: isEnabled ? "false" : "true" 
      });
      await refreshSettings();
      toast.success(`Notifications ${isEnabled ? "disabled" : "enabled"}`);
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const updateAlertEmail = async (email: string) => {
    try {
      await updateSiteSettings({ enquiry_email: email });
      await refreshSettings();
      toast.success("Notification email updated");
    } catch (error) {
      toast.error("Failed to update email");
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter((inq) => {
        if (filter === "spam") return inq.isSpam;
        if (inq.isSpam) return false; // Hide spam from regular filters
        return filter === "all" || inq.status === filter;
      })
      .filter((inq) => 
        inq.name.toLowerCase().includes(search.toLowerCase()) ||
        inq.email.toLowerCase().includes(search.toLowerCase()) ||
        (inq.trek || "").toLowerCase().includes(search.toLowerCase())
      );
  }, [inquiries, filter, search]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredInquiries.length) setSelectedIds([]);
    else setSelectedIds(filteredInquiries.map(inq => inq.id));
  };

  const handleStatusUpdate = async (id: string, status: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateInquiryStatus(id, status);
      toast.success(`Inquiry marked as ${status.replace("_", " ")}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkStatusUpdate = async (status: "new" | "in_progress" | "closed") => {
    try {
      await bulkUpdateInquiryStatus(selectedIds, status);
      toast.success(`Bulk updated ${selectedIds.length} inquiries`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} inquiries? This cannot be undone.`)) {
      try {
        await bulkDeleteInquiries(selectedIds);
        toast.success("Inquiries deleted");
        setSelectedIds([]);
      } catch (error) {
        toast.error("Bulk delete failed");
      }
    }
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0 
      ? inquiries.filter(i => selectedIds.includes(i.id))
      : filteredInquiries;
    
    exportToCSV(dataToExport, "idyllic-leads");
    toast.success("Lead data exported!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Alert Configuration Bar */}
      <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Lead Notifications</h3>
            <p className="text-xs text-muted-foreground">Receive instant email alerts for new trek inquiries.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="email"
              placeholder="alert@email.com"
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
              value={settings.enquiry_email || ""}
              onBlur={(e) => updateAlertEmail(e.target.value)}
              onChange={(e) => updateSiteSettings({ enquiry_email: e.target.value })}
            />
            <Edit3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          
          <button
            onClick={toggleEmailAlerts}
            disabled={isUpdatingSettings}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
              settings.enquiry_notifications_enabled === "true"
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${settings.enquiry_notifications_enabled === "true" ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
            {settings.enquiry_notifications_enabled === "true" ? "Notifications Active" : "Enable Alerts"}
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
              <Users className="w-4 h-4" />
              Lead Management
            </div>
            <h1 className="font-heading text-5xl text-primary mb-2">Inquiries</h1>
            <p className="text-muted-foreground">Manage bookings, contacts, and potential trekker requests.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-muted text-primary rounded-xl font-bold hover:bg-muted/80 transition-all border border-border"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 bg-muted/30 rounded-3xl border border-border mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="pl-12 pr-6 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent w-64 transition-all"
              />
            </div>
            
            <div className="flex p-1 bg-background border border-border rounded-xl mr-4">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="flex p-1 bg-background border border-border rounded-xl">
              {(["all", "new", "in_progress", "closed", "spam"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    filter === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  } ${tab === "spam" && filter !== "spam" ? "text-red-500/70" : ""}`}
                >
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedIds.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="text-xs font-bold text-accent mr-2 uppercase tracking-widest">{selectedIds.length} Selected</div>
                <div className="flex bg-background border border-border rounded-xl p-1 gap-1">
                  <button 
                    onClick={() => handleBulkStatusUpdate("new")}
                    className="p-2 hover:bg-muted rounded-lg text-blue-500" title="Mark New"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleBulkStatusUpdate("in_progress")}
                    className="p-2 hover:bg-muted rounded-lg text-amber-500" title="Mark In Progress"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleBulkStatusUpdate("closed")}
                    className="p-2 hover:bg-muted rounded-lg text-emerald-500" title="Mark Closed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-8 bg-border mx-1" />
                  <button 
                    onClick={handleBulkDelete}
                    className="p-2 hover:bg-red-500 hover:text-white rounded-lg text-red-500 transition-colors" title="Delete Bulk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="p-2.5 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-4">
                 <button 
                  onClick={selectAll}
                  className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  Select All Visible
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {viewMode === "kanban" && filter !== "spam" ? (
          <InquiriesKanbanBoard 
            inquiries={filteredInquiries}
            onStatusChange={async (id, status) => {
              try {
                await updateInquiryStatus(id, status);
                toast.success(`Moved to ${status.replace("_", " ")}`);
              } catch (err) {
                toast.error("Failed to move");
              }
            }}
            onInquiryClick={(id) => {
              setViewMode("list");
              setExpandedId(id);
              // Small delay to let list view render
              setTimeout(() => {
                const element = document.getElementById(`inquiry-${id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
          />
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <motion.div
                key={inquiry.id}
                id={`inquiry-${inquiry.id}`}
                layout
              className={`glass-panel border-l-8 transition-all duration-300 ${
                expandedId === inquiry.id ? "shadow-2xl ring-1 ring-primary/10" : "hover:shadow-lg"
              } ${
                inquiry.isSpam ? "border-l-red-500 opacity-80" :
                inquiry.status === "new" ? "border-l-blue-500" :
                inquiry.status === "in_progress" ? "border-l-amber-500" :
                "border-l-emerald-500"
              } ${selectedIds.includes(inquiry.id) ? "bg-accent/5 ring-2 ring-accent/20" : ""}`}
            >
              <div 
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
                className="p-6 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div 
                      onClick={(e) => toggleSelect(inquiry.id, e)}
                      className={`mt-1 p-1 rounded-md transition-colors ${
                        selectedIds.includes(inquiry.id) ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {selectedIds.includes(inquiry.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-primary">{inquiry.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] ${
                          inquiry.inquiryType === "booking" ? "bg-primary text-primary-foreground" :
                          inquiry.inquiryType === "inquiry" ? "bg-accent text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {inquiry.inquiryType}
                        </span>
                        {inquiry.status === "new" && !inquiry.isSpam && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        {inquiry.isSpam && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                             <AlertCircle className="w-3 h-3" />
                             Flagged Spam
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-accent" />
                          {inquiry.email}
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-accent" />
                            {inquiry.phone}
                          </div>
                        )}
                        {inquiry.trek && (
                          <div className="flex items-center gap-2 font-bold text-primary">
                            <MapPin className="w-4 h-4 text-accent" />
                            {inquiry.trek}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 lg:border-l lg:pl-10 border-border/50">
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</div>
                      <div className={`text-xs font-bold flex items-center gap-2 justify-end ${
                        inquiry.status === "new" ? "text-blue-500" :
                        inquiry.status === "in_progress" ? "text-amber-500" :
                        "text-emerald-500"
                      }`}>
                        {inquiry.status === "new" ? <Clock className="w-3.5 h-3.5" /> :
                         inquiry.status === "in_progress" ? <ArrowUpDown className="w-3.5 h-3.5" /> :
                         <CheckCircle2 className="w-3.5 h-3.5" />}
                        {inquiry.status.replace("_", " ").toUpperCase()}
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${expandedId === inquiry.id ? "rotate-90" : ""}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === inquiry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 mt-8 border-t border-border grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-6">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                              <Edit3 className="w-3.5 h-3.5" />
                              Client Message
                            </h4>
                            <div className="p-6 bg-muted/30 rounded-2xl text-lg leading-relaxed italic text-primary">
                              "{inquiry.message}"
                            </div>
                          </div>
                          
                          {inquiry.internalNotes && (
                            <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-2xl">
                              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Internal CRM Notes
                              </h4>
                              <p className="text-amber-900 text-sm">{inquiry.internalNotes}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lead Intelligence</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="text-xs font-medium">Preferred Date</span>
                                <span className="text-xs font-bold text-primary">{inquiry.preferredDate || "Not set"}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="text-xs font-medium">Group Size</span>
                                <span className="text-xs font-bold text-primary">{inquiry.peopleCount ? `${inquiry.peopleCount} People` : "Personal"}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="text-xs font-medium">Lead Source</span>
                                <span className="text-xs font-bold text-accent truncate max-w-[120px]">{inquiry.sourcePath || "/"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                             <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</h4>
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={(e) => handleStatusUpdate(inquiry.id, "in_progress", e)}
                                  className="flex items-center justify-center gap-2 p-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all"
                                >
                                  Process
                                </button>
                                <button 
                                  onClick={(e) => handleStatusUpdate(inquiry.id, "closed", e)}
                                  className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                                >
                                  Finish
                                </button>
                                 {inquiry.isSpam && (
                                   <button 
                                      onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        try {
                                          await unspamInquiry(inquiry.id);
                                          toast.success("Message recovered from spam");
                                        } catch (err) {
                                          toast.error("Failed to unspam");
                                        }
                                      }}
                                      className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all col-span-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Mark as Not Spam
                                    </button>
                                 )}
                                 <button 
                                  onClick={(e) => { e.stopPropagation(); deleteInquiry(inquiry.id); }}
                                  className={`flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all ${inquiry.isSpam ? 'col-span-2' : 'col-span-2'}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Lead
                                </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
          
          {filteredInquiries.length === 0 && !loading && (
            <div className="py-40 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-border/50">
              <Mail className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-bold text-muted-foreground">Inbox is empty</h3>
              <p className="text-muted-foreground/60">No inquiries match your current filters.</p>
            </div>
          )}
        </div>
        )}
      </motion.div>
    </div>
  );
}

