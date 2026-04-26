import { Link } from "react-router";
import { Mountain, Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "../data/useRealtimeData";

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-[#020617] text-white">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-white/80">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <Mountain className="w-8 h-8 text-white" />
              )}
              <div>
                <div className="font-heading text-xl text-white">Idyllic Adventures</div>
                <div className="text-xs text-white/60 uppercase tracking-widest">Nepal</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {settings.footer_description || "Your trusted solo guide to exploring the majestic Himalayas. Personally leading unforgettable trekking experiences since 2010."}
            </p>
          </div>

          <div>
            <h3 className="font-heading mb-4 text-white uppercase tracking-widest text-sm font-bold">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm hover:text-accent transition-colors">Home</Link>
              <Link to="/treks" className="text-sm hover:text-accent transition-colors">Treks</Link>
              <Link to="/about" className="text-sm hover:text-accent transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm hover:text-accent transition-colors">Contact</Link>
            </nav>
          </div>

          <div>
            <h3 className="font-heading mb-4 text-white uppercase tracking-widest text-sm font-bold">Contact Info</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span>{settings.location || "Pokhara, Nepal"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-accent" />
                <span>{settings.phone_1 || "+977 1234567890"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0 text-accent" />
                <span>{settings.email_main || "chapagaiujwal@gmail.com"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading mb-4 text-white uppercase tracking-widest text-sm font-bold">Follow Us</h3>
            <div className="flex gap-4">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-accent">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-accent">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-white/40 uppercase tracking-[0.2em]">
          <p>&copy; {new Date().getFullYear()} Idyllic Adventures Nepal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
