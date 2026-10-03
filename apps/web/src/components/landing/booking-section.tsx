import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  Flame,
  Heart,
  Landmark,
  Mic2,
  Moon,
  Music2,
  Phone,
  Plane,
  ScrollText,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { ALT_BOOKING_PHONE } from "@/lib/artist";
import type { ShowEventType } from "@/lib/bookings";
import { cn, waLink } from "@/lib/utils";

const EVENTS: {
  type: ShowEventType;
  icon: typeof Moon;
  title: string;
  text: string;
  points: string[];
}[] = [
  {
    type: "sufi_mehfil",
    icon: Moon,
    title: "Sufi Mehfil",
    text: "An evening of kalam, qawwali-style chorus and dhamaal that builds till the whole crowd is on its feet.",
    points: ["2–4 hour set", "Full band", "Kalam on request"],
  },
  {
    type: "wedding",
    icon: Heart,
    title: "Wedding & Sangeet",
    text: "Punjabi folk, boliyan and the songs your family loves, for the sangeet, jaago or reception.",
    points: ["Folk + Sufi mix", "Family requests", "Dhol entry"],
  },
  {
    type: "live_concert",
    icon: Mic2,
    title: "Live Concert",
    text: "A ticketed or open show with stage, sound and light design built around the big singalongs.",
    points: ["Large stages", "Tech rider", "Promo support"],
  },
  {
    type: "dargah_mela",
    icon: Landmark,
    title: "Dargah Mela & Urs",
    text: "Devotional mehfils for melas, urs and Thursday gatherings at darbars and deras.",
    points: ["Devotional kalam", "Open-air ready", "Long sets"],
  },
  {
    type: "corporate_event",
    icon: Briefcase,
    title: "Corporate & Private",
    text: "Intimate unplugged sets or full shows for corporate nights, birthdays and private parties.",
    points: ["Unplugged option", "Flexible timing", "Any venue"],
  },
  {
    type: "international_tour",
    icon: Plane,
    title: "International Shows",
    text: "Tours and one-off shows in the UK, Canada, USA and beyond, with the team handling visas and travel.",
    points: ["UK · Canada · USA", "Diaspora events", "Tour planning"],
  },
];

const STEPS = [
  {
    icon: ScrollText,
    title: "Send a request",
    text: "Event, date, city and venue.",
  },
  {
    icon: Phone,
    title: "Team calls you",
    text: "Within 24 hours, to plan it.",
  },
  {
    icon: CalendarCheck,
    title: "Date locked",
    text: "Set list, timing and rider fixed.",
  },
  {
    icon: Music2,
    title: "Mehfil night",
    text: "Sardar Ali and the band on stage.",
  },
];

export function BookingSection({ s }: { s?: SiteSettings }) {
  const [sel, setSel] = useState(0);
  const ev = EVENTS[sel] ?? EVENTS[0]!;

  return (
    <section
      id="book"
      className="relative overflow-hidden bg-ivory py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[520px] rounded-full bg-maroon/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-brand text-xs tracking-[0.3em] text-primary">
            BOOK A SHOW
          </p>
          <h2 className="mt-2 font-display text-4xl text-night sm:text-5xl">
            Bring the mehfil to your celebration
          </h2>
          {s?.bookingIntro && (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {s.bookingIntro}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Event picker */}
          <div
            role="tablist"
            aria-label="Event type"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible"
          >
            {EVENTS.map((e, i) => (
              <button
                key={e.type}
                type="button"
                role="tab"
                aria-selected={sel === i}
                onClick={() => setSel(i)}
                className={cn(
                  "relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  sel === i
                    ? "text-ivory"
                    : "text-night/75 hover:bg-white hover:text-night",
                )}
              >
                {sel === i && (
                  <motion.span
                    layoutId="event-pill"
                    className="absolute inset-0 rounded-2xl bg-night shadow-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <e.icon
                  className={cn(
                    "relative size-5",
                    sel === i ? "text-gold-light" : "text-primary",
                  )}
                />
                <span className="relative whitespace-nowrap">{e.title}</span>
              </button>
            ))}
          </div>

          {/* Detail card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-night text-ivory shadow-2xl shadow-night/20">
            <div className="pointer-events-none absolute inset-0 bg-jaali opacity-60" />
            <AnimatePresence mode="wait">
              <motion.div
                key={ev.type}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <ev.icon className="size-10 text-gold" />
                  <h3 className="mt-4 font-display text-3xl sm:text-4xl">
                    {ev.title}
                  </h3>
                  <p className="mt-3 max-w-lg leading-relaxed text-ivory/75">
                    {ev.text}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {ev.points.map((p) => (
                      <li
                        key={p}
                        className="rounded-full border border-gold/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-light"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/book"
                      search={{ event: ev.type }}
                      className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 font-semibold text-night transition hover:bg-gold-light"
                    >
                      Request this show
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                    {s?.whatsappNumber && (
                      <a
                        href={waLink(
                          s.whatsappNumber,
                          `Sat Sri Akal 🙏 I'd like to book Sardar Ali for a ${ev.title}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#25D366]/60 px-6 font-semibold text-ivory transition hover:bg-white/5"
                      >
                        <FaWhatsapp className="text-[#25D366]" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                <div className="hidden w-48 flex-col justify-center gap-3 md:flex">
                  <p className="font-brand text-[11px] tracking-[0.25em] text-gold-light">
                    BOOKING LINES
                  </p>
                  {[s?.phone, ALT_BOOKING_PHONE].filter(Boolean).map((p) => (
                    <a
                      key={p}
                      href={`tel:${p?.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-gold/50"
                    >
                      <Phone className="size-4 text-gold" /> {p}
                    </a>
                  ))}
                  <p className="flex items-center gap-1.5 text-xs text-ivory/50">
                    <Flame className="size-3.5 text-gold animate-flicker" />
                    Dates fill fast in wedding season
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* How it works */}
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((st, i) => (
            <motion.li
              key={st.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <st.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-maroon">
                  Step {i + 1}
                </p>
                <p className="font-semibold text-night">{st.title}</p>
                <p className="text-sm text-muted-foreground">{st.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
