import { motion } from "motion/react";
import { Mail, Phone, CalendarDays, UserRoundSearch, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useInquiries } from "../../data/useRealtimeData";
import {
  deleteInquiry,
  isSupabaseConfigured,
  supabase,
  updateInquiryStatus,
} from "../../data/supabaseData";
import { requireAuthenticatedSession } from "../../data/auth";

export function AdminInquiriesPage() {
  const { inquiries } = useInquiries();

  const ensureConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live inquiries.");
      return false;
    }
    return true;
  };

  const ensureAdminSession = async () => {
    await requireAuthenticatedSession();
  };

  const handleStatusChange = async (
    inquiryId: string,
    status: "new" | "in_progress" | "closed"
  ) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
      await updateInquiryStatus(inquiryId, status);
      toast.success("Inquiry status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update inquiry");
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!ensureConfigured()) return;
    try {
      await ensureAdminSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please sign in");
      return;
    }

    if (!confirm("Delete this inquiry?")) return;

    try {
      await deleteInquiry(inquiryId);
      toast.success("Inquiry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete inquiry");
    }
  };

  const typeLabel = (type: "booking" | "contact" | "inquiry") => {
    if (type === "booking") return "Booking";
    if (type === "contact") return "Contact";
    return "Inquiry";
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mb-8">
          <h1 className="font-heading text-3xl mb-2">Booking and Inquiry Leads</h1>
          <p className="text-muted-foreground">
            All Book Now, Contact, and Inquiry form submissions arrive here in realtime.
          </p>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center text-muted-foreground">
            No inquiries yet. Submit a form from the public website to test live lead capture.
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
                        {typeLabel(inquiry.inquiryType)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-lg">{inquiry.name}</h3>

                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{inquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{inquiry.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserRoundSearch className="h-4 w-4" />
                        <span>{inquiry.trek || "General inquiry"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{inquiry.preferredDate || "No preferred date"}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/20 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                      {inquiry.message}
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-2 lg:flex-col lg:items-end">
                    <select
                      value={inquiry.status}
                      onChange={(e) =>
                        void handleStatusChange(
                          inquiry.id,
                          e.target.value as "new" | "in_progress" | "closed"
                        )
                      }
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => void handleDelete(inquiry.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
