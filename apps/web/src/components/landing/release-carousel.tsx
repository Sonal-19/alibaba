import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Music,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, call } from "@/lib/api";
import { PLATFORM_META, type ReleasePlatform } from "@/lib/releases";
import { cn, formatDate, ymd } from "@/lib/utils";

export const releasesQuery = queryOptions({
  queryKey: ["public", "releases"] as const,
  queryFn: () => call(api.public.releases.get()),
  staleTime: 5 * 60 * 1000,
});

export type ReleaseCardData = {
  title: string;
  subtitle?: string | null;
  caption: string;
  posterPath: string;
  aspect: "square" | "wide";
  links: { platform: ReleasePlatform; url: string }[];
  releaseDate?: string | Date | null;
};

export function PlatformButton({
  platform,
  url,
  size = "sm",
}: {
  platform: ReleasePlatform;
  url: string;
  size?: "sm" | "lg";
}) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.other;
  const Icon = meta.icon;
  if (size === "lg") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-ivory transition hover:border-gold/50 hover:bg-white/10"
      >
        <Icon className="size-5 shrink-0" style={{ color: meta.color }} />
        <span className="flex-1">{meta.label}</span>
        <span className="text-xs font-medium text-gold-light">Open ↗</span>
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={meta.label}
      aria-label={`Open on ${meta.label}`}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto grid size-8 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:scale-110 hover:border-gold hover:bg-black/70 sm:size-9"
    >
      <Icon className="size-4" style={{ color: meta.color }} />
    </a>
  );
}

/** One poster: album art (1:1) or video thumbnail (16:9), at a shared height
 * so both shapes sit in one row. */
export function ReleaseCard({
  r,
  isNew,
  onOpen,
  className,
}: {
  r: ReleaseCardData;
  isNew?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group/card relative h-48 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-night-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-gold/10 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_18px_50px_-12px_rgba(201,162,74,0.35)] sm:h-60 lg:h-72",
        r.aspect === "wide" ? "aspect-video" : "aspect-square",
        className,
      )}
    >
      <img
        src={r.posterPath}
        alt={r.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      />
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${r.title}: details and links`}
          className="absolute inset-0 z-0 cursor-pointer"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {isNew && (
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-maroon px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-night shadow sm:text-xs">
          <Music className="size-3" /> NEW
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
        {r.subtitle && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light sm:text-xs">
            {r.subtitle}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-1 font-display text-base font-bold text-ivory sm:text-lg">
          {r.title}
        </h3>
        {r.caption && (
          <p className="mt-0.5 hidden text-xs leading-snug text-ivory/75 sm:line-clamp-2">
            {r.caption}
          </p>
        )}
        {r.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.links.slice(0, 5).map((l) => (
              <PlatformButton
                key={`${l.platform}-${l.url}`}
                platform={l.platform}
                url={l.url}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ReleaseDialog({
  r,
  onClose,
}: {
  r: ReleaseCardData | null;
  onClose: () => void;
}) {
  const [cached, setCached] = useState<ReleaseCardData | null>(r);
  useEffect(() => {
    if (r) setCached(r);
  }, [r]);

  const data = r ?? cached;

  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] gap-0 overflow-hidden border-gold/20 bg-night p-0 text-ivory shadow-2xl sm:max-w-lg"
      >
        {/* Prominent, accessible, high-contrast close button */}
        <DialogClose
          className="absolute top-3.5 right-3.5 z-50 flex size-9 items-center justify-center rounded-full border border-gold/40 bg-night/90 text-ivory shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-gold hover:bg-gold hover:text-night focus:outline-none focus:ring-2 focus:ring-gold sm:top-4 sm:right-4 sm:size-10 cursor-pointer"
          aria-label="Close details dialog"
        >
          <X className="size-5" />
        </DialogClose>

        <div className="max-h-[92dvh] overflow-y-auto">
          {data && (
            <>
              <div className="relative bg-black/40">
                <img
                  src={data.posterPath}
                  alt={data.title}
                  className={cn(
                    "mx-auto w-full object-contain",
                    data.aspect === "wide" ? "aspect-video" : "aspect-square",
                  )}
                />
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  {data.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
                      {data.subtitle}
                    </p>
                  )}
                  <DialogTitle className="mt-1 font-display text-2xl text-ivory">
                    {data.title}
                  </DialogTitle>
                  {data.releaseDate && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ivory/60">
                      <CalendarDays className="size-3.5" />
                      Released{" "}
                      {formatDate(`${ymd(data.releaseDate)}T00:00:00+05:30`)}
                    </p>
                  )}
                </div>
                <DialogDescription className="text-sm leading-relaxed text-ivory/80">
                  {data.caption || "Listen on your favourite platform."}
                </DialogDescription>
                <div className="grid gap-2">
                  {data.links.map((l) => (
                    <PlatformButton
                      key={`${l.platform}-${l.url}`}
                      platform={l.platform}
                      url={l.url}
                      size="lg"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Admin-managed releases as a "Kalam Collection": a large spotlight of the
 * picked release and an arch-card shelf to pick from. Hidden when empty. */
export function ReleasesSection() {
  const { data } = useQuery(releasesQuery);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<ReleaseCardData | null>(null);
  const shelf = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScroll = useRef(false);
  const normalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const initializedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const items = (data ?? []) as ReleaseCardData[];
  const newest = useMemo(() => {
    let best: { i: number; d: string } | null = null;
    items.forEach((r, i) => {
      const d = r.releaseDate ? ymd(r.releaseDate) : "";
      if (d && (!best || d > best.d)) best = { i, d };
    });
    return (best as { i: number; d: string } | null)?.i ?? 0;
  }, [items]);

  // Repeat items for seamless, infinite wrap-around scrolling
  const repeatCount = useMemo(() => {
    if (items.length <= 1) return 1;
    return Math.max(3, Math.ceil(15 / items.length));
  }, [items.length]);

  const middleSet = Math.floor(repeatCount / 2);
  const baseOffset = middleSet * items.length;

  const allCards = useMemo(() => {
    if (items.length <= 1) {
      return items.map((item, idx) => ({
        item,
        virtualIndex: idx,
        originalIndex: idx,
      }));
    }
    return Array.from({ length: repeatCount }, (_, setIdx) =>
      items.map((item, itemIdx) => ({
        item,
        virtualIndex: setIdx * items.length + itemIdx,
        originalIndex: itemIdx,
      })),
    ).flat();
  }, [items, repeatCount]);

  const [virtualIndex, setVirtualIndex] = useState<number>(0);

  const currentOriginalIndex =
    items.length > 0
      ? ((virtualIndex % items.length) + items.length) % items.length
      : 0;
  const current = items[currentOriginalIndex] ?? items[0];

  const scrollToVirtualIndex = useCallback(
    (idx: number, smooth = true) => {
      const container = shelf.current;
      if (!container) return;
      const cards = container.children;
      const targetCard = cards[idx] as HTMLElement | undefined;
      if (!targetCard) return;

      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollTarget = cardLeft - (containerWidth - cardWidth) / 2;

      isProgrammaticScroll.current = true;
      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: smooth && !reduceMotion ? "smooth" : "auto",
      });

      const timeout = smooth && !reduceMotion ? 600 : 50;
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, timeout);
    },
    [reduceMotion],
  );

  const scheduleNormalize = useCallback(
    (targetIdx: number) => {
      if (normalizeTimerRef.current) {
        clearTimeout(normalizeTimerRef.current);
      }

      const minSafe = baseOffset;
      const maxSafe = baseOffset + items.length - 1;
      if (targetIdx >= minSafe && targetIdx <= maxSafe) {
        return;
      }

      normalizeTimerRef.current = setTimeout(() => {
        const container = shelf.current;
        if (!container || items.length <= 1) return;

        const normalizedOriginal =
          ((targetIdx % items.length) + items.length) % items.length;
        const normalizedVirtual = baseOffset + normalizedOriginal;

        const cards = container.children;
        const currentCard = cards[targetIdx] as HTMLElement | undefined;
        const targetCard = cards[normalizedVirtual] as HTMLElement | undefined;

        if (currentCard && targetCard) {
          const offsetDiff = currentCard.offsetLeft - targetCard.offsetLeft;
          isProgrammaticScroll.current = true;
          container.scrollLeft -= offsetDiff;
          setVirtualIndex(normalizedVirtual);
          setTimeout(() => {
            isProgrammaticScroll.current = false;
          }, 50);
        }
      }, 650);
    },
    [baseOffset, items.length],
  );

  const goToIndex = useCallback(
    (targetIdx: number) => {
      if (items.length <= 1) return;
      const container = shelf.current;
      let nextIdx = targetIdx;

      if (container && (nextIdx >= allCards.length - 2 || nextIdx <= 1)) {
        const currentOriginal =
          ((virtualIndex % items.length) + items.length) % items.length;
        const centeredVirtual = baseOffset + currentOriginal;
        const cards = container.children;
        const currentCard = cards[virtualIndex] as HTMLElement | undefined;
        const centeredCard = cards[centeredVirtual] as HTMLElement | undefined;
        if (currentCard && centeredCard) {
          const offsetDiff = currentCard.offsetLeft - centeredCard.offsetLeft;
          container.scrollLeft -= offsetDiff;
          nextIdx = centeredVirtual + (targetIdx - virtualIndex);
        }
      }

      setVirtualIndex(nextIdx);
      scrollToVirtualIndex(nextIdx, true);
      scheduleNormalize(nextIdx);
    },
    [
      items.length,
      allCards.length,
      baseOffset,
      virtualIndex,
      scrollToVirtualIndex,
      scheduleNormalize,
    ],
  );

  const goToNext = useCallback(() => {
    goToIndex(virtualIndex + 1);
  }, [goToIndex, virtualIndex]);

  const goToPrev = useCallback(() => {
    goToIndex(virtualIndex - 1);
  }, [goToIndex, virtualIndex]);

  // Initial scroll to newest release in middle set
  useEffect(() => {
    if (items.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      const initialVirtual = baseOffset + newest;
      setVirtualIndex(initialVirtual);
      const frame = requestAnimationFrame(() => {
        scrollToVirtualIndex(initialVirtual, false);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [items.length, baseOffset, newest, scrollToVirtualIndex]);

  // Automatic infinite scroll interval
  useEffect(() => {
    if (items.length <= 1 || isPaused || open !== null || reduceMotion) {
      return;
    }

    const interval = setInterval(() => {
      setVirtualIndex((prev) => {
        const next = prev + 1;
        scrollToVirtualIndex(next, true);
        scheduleNormalize(next);
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [
    items.length,
    isPaused,
    open,
    reduceMotion,
    scrollToVirtualIndex,
    scheduleNormalize,
  ]);

  // Sync spotlight if user manually scrolls or touches the shelf
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current || items.length <= 1) return;

    if (scrollDebounceTimer.current) {
      clearTimeout(scrollDebounceTimer.current);
    }

    scrollDebounceTimer.current = setTimeout(() => {
      const container = shelf.current;
      if (!container || isProgrammaticScroll.current) return;

      const centerX = container.scrollLeft + container.clientWidth / 2;
      const cards = container.children;
      let nearestIdx = virtualIndex;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(centerX - cardCenter);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== virtualIndex) {
        setVirtualIndex(nearestIdx);
        scheduleNormalize(nearestIdx);
      }
    }, 120);
  }, [items.length, virtualIndex, scheduleNormalize]);

  useEffect(() => {
    return () => {
      if (normalizeTimerRef.current) clearTimeout(normalizeTimerRef.current);
      if (scrollDebounceTimer.current)
        clearTimeout(scrollDebounceTimer.current);
    };
  }, []);

  if (!current) return null;

  return (
    <section
      id="releases"
      className="relative overflow-hidden bg-ivory py-20 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-jaali opacity-70" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="flex items-center gap-2 font-brand text-xs tracking-[0.3em] text-primary">
            <Disc3 className="size-4 animate-[spin_6s_linear_infinite] text-maroon" />
            KALAM COLLECTION
          </p>
          <h2 className="font-display text-4xl text-night sm:text-5xl">
            Latest releases
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Sufi kalam and Punjabi songs on YouTube, YouTube Music, Spotify and
            Apple Music. Pick one to hear it.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Spotlight */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.title}
              initial={{ opacity: 0, y: 16, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -16, rotate: 1 }}
              transition={{ duration: 0.4 }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="mx-auto w-full max-w-sm lg:max-w-none"
            >
              <div className="arch relative overflow-hidden border-2 border-gold/60 bg-night p-2 shadow-2xl shadow-night/30">
                <div className="arch relative aspect-[4/5] overflow-hidden">
                  <img
                    src={current.posterPath}
                    alt={current.title}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                    {current.subtitle && (
                      <p className="text-xs font-semibold tracking-[0.2em] text-gold-light uppercase">
                        {current.subtitle}
                      </p>
                    )}
                    <h3 className="mt-1 font-display text-3xl font-bold">
                      {current.title}
                    </h3>
                    {current.caption && (
                      <p className="mt-1 line-clamp-2 text-sm text-ivory/75">
                        {current.caption}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {current.links.slice(0, 5).map((l) => (
                        <PlatformButton
                          key={`${l.platform}-${l.url}`}
                          platform={l.platform}
                          url={l.url}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setOpen(current)}
                        className="ml-auto rounded-full border border-gold/50 px-3 py-1 text-xs font-semibold text-gold-light transition hover:bg-gold hover:text-night cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Shelf */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-night">
                {items.length} release{items.length === 1 ? "" : "s"}
              </p>
              <div
                className="flex items-center gap-2"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Previous release"
                  className="grid size-10 place-items-center rounded-full border border-gold/50 text-night transition hover:bg-night hover:text-gold-light cursor-pointer"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Next release"
                  className="grid size-10 place-items-center rounded-full border border-gold/50 text-night transition hover:bg-night hover:text-gold-light cursor-pointer"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
            <div
              ref={shelf}
              onScroll={handleScroll}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pt-4 pb-6 [scrollbar-width:none]"
            >
              {allCards.map(
                ({ item: r, virtualIndex: vIdx, originalIndex: oIdx }) => {
                  const active = vIdx === virtualIndex;
                  return (
                    <motion.button
                      key={`${r.title}-${vIdx}`}
                      type="button"
                      onClick={() => goToIndex(vIdx)}
                      whileHover={
                        reduceMotion ? undefined : { y: -8, rotate: -1.5 }
                      }
                      whileTap={{ scale: 0.97 }}
                      aria-pressed={active}
                      className={cn(
                        "arch group relative w-40 shrink-0 snap-center overflow-hidden border-2 bg-night text-left shadow-lg transition-all duration-300 sm:w-48 cursor-pointer",
                        active
                          ? "border-gold shadow-gold/40 ring-2 ring-gold/50 scale-[1.02]"
                          : "border-transparent hover:border-gold/50 opacity-80 hover:opacity-100",
                      )}
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={r.posterPath}
                          alt=""
                          loading="lazy"
                          draggable={false}
                          className="size-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/10 to-transparent" />
                      {oIdx === newest && (
                        <span className="absolute top-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-night">
                          <Music className="size-3" /> NEW
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="line-clamp-2 font-display text-base leading-tight font-bold text-ivory">
                          {r.title}
                        </p>
                        {r.subtitle && (
                          <p className="mt-0.5 truncate text-[10px] tracking-wider text-gold-light uppercase">
                            {r.subtitle}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      <ReleaseDialog r={open} onClose={() => setOpen(null)} />
    </section>
  );
}
