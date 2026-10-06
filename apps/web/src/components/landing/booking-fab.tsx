import { useMemo } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { waLink } from "@/lib/utils";

type ButtonConfig = SiteSettings["bookingButton"];

function pickNumber(cfg: ButtonConfig, fallback: string) {
  const list = cfg.numbers.length ? cfg.numbers : [fallback].filter(Boolean);
  if (cfg.rotation === "random" && list.length > 1) {
    return list[Math.floor(Math.random() * list.length)];
  }
  return list[0];
}

/** Where the button goes for each channel. Add email/call/etc. here. */
function hrefFor(cfg: ButtonConfig, number: string) {
  switch (cfg.channel) {
    case "whatsapp":
      return waLink(number, cfg.message);
  }
}

/** Floating "Book a Show" button: a plain link, so it works without JS
 * handlers and crawlers see it. Toggled from Admin → Settings. */
export function BookingFab({ s }: { s?: SiteSettings }) {
  // Picked once per settings load so a random number doesn't flip on re-render.
  const number = useMemo(
    () => (s ? pickNumber(s.bookingButton, s.whatsappNumber) : undefined),
    [s],
  );
  if (!s?.bookingButton.enabled || !number) return null;
  const cfg = s.bookingButton;

  return (
    <a
      href={hrefFor(cfg, number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${cfg.label} on WhatsApp`}
      className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-14 items-center gap-2.5 rounded-full bg-[#25D366] pr-5 pl-4 font-semibold text-white shadow-lg shadow-black/25 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[#1ebe5a] focus-visible:ring-4 focus-visible:ring-[#25D366]/40 focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <span className="relative grid size-8 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30 motion-reduce:hidden" />
        <FaWhatsapp className="relative size-7" />
      </span>
      {cfg.label}
    </a>
  );
}
