import { motion } from "motion/react";
import { Mail, MessageCircle, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router";
import {
  createInquiryWithValidation,
  isSupabaseConfigured,
  trackWebsiteEvent,
} from "../data/supabaseData";
import { useSiteSettings } from "../data/useRealtimeData";
import ImageWithFallback from "../components/figma/ImageWithFallback";

type InquiryType = "booking" | "contact" | "inquiry";

type ContactCard = {
  icon: React.ReactNode;
  title: string;
  details: string[];
  href?: string;
};

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") ?? "contact-page";
  const queryType = searchParams.get("type");
  const preselectedTrek = searchParams.get("trek") ?? "";

  const defaultType: InquiryType =
    queryType === "booking" || queryType === "inquiry" || queryType === "contact"
      ? queryType
      : "contact";

  const { settings, loading } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    inquiryType: defaultType,
    name: "",
    email: "",
    phone: "",
    trek: preselectedTrek,
    peopleCount: "",
    preferredDate: "",
    message: "",
    honeypot: "",
  });

  const getClientIp = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) return "unknown";
      const payload = (await response.json()) as { ip?: string };
      return payload.ip ?? "unknown";
    } catch {
      return "unknown";
    }
  };

  const resetForm = () => {
    setFormData({
      inquiryType: defaultType,
      name: "",
      email: "",
      phone: "",
      trek: preselectedTrek,
      peopleCount: "",
      preferredDate: "",
      message: "",
      honeypot: "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      const clientIp = await getClientIp();
      const status = await createInquiryWithValidation({
        inquiryType: formData.inquiryType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        trek: formData.trek,
        peopleCount: formData.peopleCount ? Number(formData.peopleCount) : undefined,
        preferredDate: formData.preferredDate || undefined,
        message: formData.message,
        sourcePath: source,
        honeypot: formData.honeypot,
        clientIp,
      });

      if (status === "submitted") {
        void trackWebsiteEvent("cta_click", `inquiry-submit:${formData.inquiryType}`);
      }

      toast.success("Submitted successfully. I will contact you soon.");
      resetForm();
    } catch (error) {
      console.error("Submission Error:", error);
      const message = error instanceof Error ? error.message : "Submission failed";
      toast.error(`❌ ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const whatsappNumber = settings.whatsapp_number || "+977 9876543210";
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`;

  const cards: ContactCard[] = [
    {
      icon: <MapPin className="w-6 h-6 text-accent" />,
      title: "Visit Us",
      details: [settings.location || "Pokhara, Nepal"],
    },
    {
      icon: <Phone className="w-6 h-6 text-accent" />,
      title: "Call Us",
      details: [settings.phone_1 || "+977 1234567890", settings.phone_2 || "+977 9876543210"],
    },
    {
      icon: <Mail className="w-6 h-6 text-accent" />,
      title: "Email Us",
      details: [settings.email_main || "info@idyllicadventures.com", settings.email_booking || "booking@idyllicadventures.com"],
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-accent" />,
      title: "WhatsApp",
      details: [whatsappNumber],
      href: whatsappHref,
    },
  ];

  if (loading) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen">
      <section className="relative py-20 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <ImageWithFallback
            src={settings.contact_hero_image || "https://images.unsplash.com/photo-1512100356356-de1b84283e18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxOZXBhbCUyMEhpbWFsYXlhcyUyME1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080"}
            alt="Contact Us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0f172a]/80 to-accent/50" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative text-white text-center">
          <h1 className="font-heading text-5xl md:text-6xl mb-6 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">{settings.contact_hero_title || "Get in Touch"}</h1>
          <p className="text-lg text-white max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {settings.contact_hero_description || "Ready to start your Himalayan adventure? Contact me and I will help you plan the perfect trek."}
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`bg-card rounded-2xl p-6 shadow-sm border border-border ${card.href ? "cursor-pointer hover:shadow-md" : ""}`}
                onClick={() => {
                  if (card.href) window.open(card.href, "_blank");
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-4">{card.icon}</div>
                <h3 className="font-heading text-lg mb-2">{card.title}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {card.details.map((line, i) => (
                    <p key={`${card.title}-${i}`}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1" htmlFor="inquiryType">Request Type *</label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border"
                  required
                >
                  <option value="contact">General Contact</option>
                  <option value="inquiry">Trip Inquiry</option>
                  <option value="booking">Book Now Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="name">Full Name *</label>
                <input id="name" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1" htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1" htmlFor="trek">Interested Trek</label>
                <input id="trek" name="trek" value={formData.trek} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="peopleCount">Group Size</label>
                <input id="peopleCount" name="peopleCount" type="number" min={1} value={formData.peopleCount} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="preferredDate">Preferred Date</label>
              <input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border" />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="message">Message *</label>
              <textarea id="message" name="message" rows={6} required value={formData.message} onChange={handleChange} className="w-full px-4 py-3 bg-input-background rounded-lg border border-border resize-none" />
            </div>

            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent text-accent-foreground px-6 py-4 hover:bg-accent/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{submitting ? "Sending..." : "Send Message"}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
