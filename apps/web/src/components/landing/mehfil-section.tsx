import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { GALLERY_ICONS } from "@/components/common/gallery-icons";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { DARBARS } from "@/lib/artist";
import { cn } from "@/lib/utils";

/** "Mehfil moments": admin gallery as expanding arch panels, then the
 * darbars where Sardar Ali sings. */
export function MehfilSection({ s }: { s?: SiteSettings }) {
  const gallery = s?.gallery ?? [];
  const [open, setOpen] = useState(0);

  return (
    <section
      id="mehfils"
      className="relative overflow-hidden bg-night py-20 text-ivory sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-jaali opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-brand text-xs tracking-[0.3em] text-gold-light">
            MEHFIL MOMENTS
          </p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">
            Where the <span className="text-gold-gradient">dhamaal</span> begins
          </h2>
          <p className="mt-3 text-ivory/70">
            From dargah courtyards to concert stages: a glimpse of the nights
            the sangat sings along.
          </p>
        </div>

        {gallery.length > 0 && (
          <div className="mt-12 flex h-[440px] flex-col gap-3 sm:h-[420px] sm:flex-row">
            {gallery.map((g, i) => {
              const Icon = GALLERY_ICONS[g.icon] ?? GALLERY_ICONS.mic;
              const isOpen = open === i;
              return (
                <motion.button
                  key={`${g.title}-${i}`}
                  type="button"
                  layout
                  onClick={() => setOpen(i)}
                  onMouseEnter={() => setOpen(i)}
                  onFocus={() => setOpen(i)}
                  transition={{ type: "spring", stiffness: 160, damping: 24 }}
                  className={cn(
                    "group relative min-h-0 min-w-0 overflow-hidden rounded-3xl border text-left sm:rounded-t-[999px]",
                    isOpen
                      ? "flex-[4] border-gold/70"
                      : "flex-1 border-white/10",
                  )}
                >
                  <img
                    src={g.imagePath}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent transition-opacity",
                      isOpen ? "opacity-90" : "opacity-70",
                    )}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:p-6">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/90 text-night">
                      <Icon className="size-5" />
                    </span>
                    <div
                      className={cn(
                        "min-w-0 transition-opacity duration-300",
                        isOpen ? "opacity-100" : "opacity-0 sm:opacity-0",
                      )}
                    >
                      <h3 className="truncate font-display text-2xl">
                        {g.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-ivory/75">
                        {g.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DARBARS.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="arch-pointed relative bg-gradient-to-b from-night-2 to-night px-5 pt-14 pb-6 ring-1 ring-gold/20"
            >
              <span className="absolute top-5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gold animate-flicker shadow-[0_0_12px_4px_rgba(236,217,160,0.45)]" />
              <h3 className="text-center font-display text-xl text-gold-light">
                {d.name}
              </h3>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ivory/60">
                <MapPin className="size-3" /> {d.place}
              </p>
              <p className="mt-3 text-center text-sm text-ivory/75">{d.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
