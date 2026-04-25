import { Link } from "react-router";
import { Mountain, Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "../data/useRealtimeData";

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt="Logo" className="w-10 h-10 object-contain invert brightness-0" />
              ) : (
                <Mountain className="w-8 h-8" />
              )}
              <div>
                <div className="font-heading text-xl">Idyllic Adventures</div>
                <div className="text-xs text-primary-foreground/70">Nepal</div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              {settings.footer_description || "Your trusted solo guide to exploring the majestic Himalayas. Personally leading unforgettable trekking experiences since 2010."}
            </p>
          </div>

          <div>
            <h3 className="font-heading mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Home
              </Link>
              <Link to="/treks" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Treks
              </Link>
              <Link to="/about" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-heading mb-4">Contact Info</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-sm text-primary-foreground/80">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{settings.location || "Pokhara, Nepal"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{settings.phone_1 || "+977 1234567890"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{settings.email_main || "info@idyllicadventures.com"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading mb-4">Follow Us</h3>
            <div className="flex gap-4">
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.social_twitter && (
                <a
                  href={settings.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 3.869H5.078z" />
                  </svg>
                </a>
              )}
              {settings.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M21.582 6.186a2.684 2.684 0 00-1.884-1.892c-1.663-.448-8.324-.448-8.324-.448s-6.661 0-8.324.448A2.684 2.684 0 001.166 6.186C.714 7.857.714 12 .714 12s0 4.143.452 5.814a2.684 2.684 0 001.884 1.892c1.663.448 8.324.448 8.324.448s6.661 0 8.324-.448a2.684 2.684 0 001.884-1.892c.452-1.671.452-5.814.452-5.814s0-4.143-.452-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Idyllic Adventures Nepal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
