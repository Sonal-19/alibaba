import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Logo } from "@/components/common/logo";
import { SocialIconRow } from "@/components/common/social-icons";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { waLink } from "@/lib/utils";

export function SiteFooter() {
  const { data: s } = useSiteSettings();
  return (
    <footer className="relative overflow-hidden bg-night text-ivory/80">
      <div className="pointer-events-none absolute inset-0 bg-jaali opacity-50" />
      <div className="relative h-1 bg-gradient-to-r from-primary via-gold to-maroon" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          <Logo className="h-12" />
          <p className="max-w-md text-sm leading-relaxed text-ivory/70">
            {s?.tagline}. Live Sufi mehfils, weddings, melas and concerts in
            India and abroad.
          </p>
          <SocialIconRow settings={s} />
        </div>
        <div>
          <h3 className="mb-4 font-brand text-sm tracking-widest text-gold-light">
            EXPLORE
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" hash="about" className="hover:text-gold-light">
                About Sardar Ali
              </Link>
            </li>
            <li>
              <Link to="/" hash="releases" className="hover:text-gold-light">
                Latest Releases
              </Link>
            </li>
            <li>
              <Link to="/" hash="book" className="hover:text-gold-light">
                Book a Show
              </Link>
            </li>
            <li>
              <Link to="/book" className="hover:text-gold-light">
                Booking Form
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-gold-light">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/" hash="contact" className="hover:text-gold-light">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-brand text-sm tracking-widest text-gold-light">
            MANAGEMENT
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              {s?.address}
            </li>
            {s?.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
              </li>
            )}
            {s?.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </li>
            )}
            {s?.whatsappNumber && (
              <li className="flex gap-2">
                <FaWhatsapp className="mt-0.5 size-4 shrink-0 text-gold" />
                <a
                  href={waLink(s.whatsappNumber, "Sat Sri Akal 🙏")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ivory/50 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Sardar Ali. All rights reserved.</p>
          <p className="font-urdu text-sm text-gold-light/70">
            ਇਸ਼ਕ ਹਕੀਕੀ · عشق حقیقی
          </p>
        </div>
      </div>
    </footer>
  );
}
