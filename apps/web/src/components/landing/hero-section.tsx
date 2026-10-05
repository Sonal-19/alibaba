import { youtubeId } from "@api/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowDown, CalendarHeart, Loader2, Pause, Play } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FaApple, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa6";
import { SiYoutubemusic } from "react-icons/si";
import { useLiteMotion } from "@/hooks/use-media-query";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { useYoutubeTrack } from "@/hooks/use-youtube-track";
import { SIGNATURE_SONGS, YOUTUBE_MUSIC_URL } from "@/lib/artist";
import { cn } from "@/lib/utils";

/** Words that cycle under the name: the four moods of a Sufi mehfil. */
const MOODS = ["Ishq", "Ibadat", "Malang", "Maula", "Sukoon"];

const DIYAS = [
  { left: "8%", delay: 0, duration: 14, size: 6 },
  { left: "18%", delay: 3, duration: 17, size: 4 },
  { left: "29%", delay: 6, duration: 15, size: 5 },
  { left: "41%", delay: 1.5, duration: 18, size: 3 },
  { left: "57%", delay: 4.5, duration: 16, size: 5 },
  { left: "68%", delay: 7.5, duration: 14, size: 4 },
  { left: "79%", delay: 2.2, duration: 19, size: 6 },
  { left: "91%", delay: 5.4, duration: 15, size: 4 },
];

/** Concentric star rosette, the kind carved into dargah ceilings. */
function Rosette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("fill-none stroke-gold", className)}
      aria-hidden
    >
      <circle
        cx="200"
        cy="200"
        r="196"
        strokeWidth="0.6"
        strokeDasharray="2 5"
      />
      <circle cx="200" cy="200" r="176" strokeWidth="0.8" />
      <circle
        cx="200"
        cy="200"
        r="120"
        strokeWidth="0.6"
        strokeDasharray="4 4"
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 200 200)`} strokeWidth="0.8">
          <path d="M200 24 L222 120 L200 176 L178 120 Z" />
          <path d="M200 176 Q240 150 262 96" strokeOpacity="0.6" />
          <circle cx="200" cy="40" r="3" />
        </g>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="150"
          y="150"
          width="100"
          height="100"
          transform={`rotate(${i * 11.25} 200 200)`}
          strokeWidth="0.5"
          strokeOpacity="0.7"
        />
      ))}
    </svg>
  );
}

export function HeroSection({ s }: { s?: SiteSettings }) {
  const lite = useLiteMotion();
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { margin: "80px" });
  const animate = !lite && inView;

  const videoId = youtubeId(s?.heroTrackUrl) ?? "";
  const trackTitle = s?.heroTrackTitle || "Nachde Malang";
  const trackSubtitle = s?.heroTrackSubtitle || "Sufi kalam";
  const player = useYoutubeTrack(videoId);

  // Mouse parallax and interactive cursor spotlight
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cursorX = useMotionValue(50);
  const cursorY = useMotionValue(40);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const scX = useSpring(cursorX, { stiffness: 45, damping: 20 });
  const scY = useSpring(cursorY, { stiffness: 45, damping: 20 });
  const farX = useTransform(sx, (v) => v * -24);
  const farY = useTransform(sy, (v) => v * -24);
  const nearX = useTransform(sx, (v) => v * 14);
  const nearY = useTransform(sy, (v) => v * 10);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cursorX.set(px * 100);
    cursorY.set(py * 100);
    mx.set(px - 0.5);
    my.set(py - 0.5);
  };

  const onTouch = (e: React.TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (t.clientX - r.left) / r.width;
    const py = (t.clientY - r.top) / r.height;
    cursorX.set(px * 100);
    cursorY.set(py * 100);
    mx.set(px - 0.5);
    my.set(py - 0.5);
  };

  const [mood, setMood] = useState(0);
  useEffect(() => {
    if (lite) return;
    const t = setInterval(() => setMood((m) => (m + 1) % MOODS.length), 2600);
    return () => clearInterval(t);
  }, [lite]);

  const [hoverSong, setHoverSong] = useState<string | null>(null);

  const listen = [
    { href: s?.youtubeUrl, label: "YouTube", Icon: FaYoutube },
    { href: YOUTUBE_MUSIC_URL, label: "YT Music", Icon: SiYoutubemusic },
    { href: s?.spotifyUrl, label: "Spotify", Icon: FaSpotify },
    { href: s?.appleMusicUrl, label: "Apple Music", Icon: FaApple },
    { href: s?.instagramUrl, label: "Instagram", Icon: FaInstagram },
  ].filter((l) => l.href);

  const stats = [
    { value: s?.stats?.views ?? "10M+", label: "Views" },
    { value: s?.stats?.followers ?? "500K+", label: "Followers" },
    { value: s?.stats?.years ?? "15+", label: "Years on stage" },
    { value: s?.stats?.albums ?? "50+", label: "Songs" },
  ];

  const playing = player.isPlaying;

  return (
    <section
      id="home"
      ref={ref}
      onMouseMove={lite ? undefined : onMove}
      onTouchMove={lite ? undefined : onTouch}
      // className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night pt-24 pb-10 text-ivory"
      className="relative isolate flex  flex-col overflow-hidden bg-night pt-24 pb-10 text-ivory"
    >
      {/* Background: interactive ambient light, lattice, rosette, sacred geometry & acoustic ripples */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Deep emerald-night base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#1d5a4d_0%,#0f2e28_38%,#0b1f1c_70%)]" />

        {/* Dynamic interactive cursor/touch spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background: useTransform(
              [scX, scY],
              ([x, y]) =>
                `radial-gradient(750px circle at ${x}% ${y}%, rgba(201,162,74,0.22) 0%, rgba(29,90,77,0.3) 38%, transparent 72%)`,
            ),
          }}
        />

        {/* Celestial divine light beam from top */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_0%,rgba(236,217,160,0.16),transparent_70%)]" />

        {/* Sacred jaali pattern illuminated by the light */}
        <div className="absolute inset-0 bg-jaali opacity-60" />

        {/* Concentric acoustic resonance waves behind portrait */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%]">
          {[0, 1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/15"
              style={{
                width: 380 + ring * 160,
                height: 380 + ring * 160,
              }}
              animate={
                animate
                  ? {
                      scale: playing ? [0.94, 1.15, 0.94] : [0.98, 1.05, 0.98],
                      opacity: playing ? [0.45, 0.1, 0.45] : [0.22, 0.07, 0.22],
                    }
                  : undefined
              }
              transition={{
                duration: playing ? 2.8 : 6,
                delay: ring * 0.7,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Whirling rosette */}
        <motion.div
          style={lite ? undefined : { x: farX, y: farY }}
          className="absolute top-1/2 left-1/2 size-[760px] -translate-x-1/2 -translate-y-[46%] sm:size-[900px] lg:size-[1100px]"
        >
          <Rosette
            className={cn(
              "size-full opacity-[0.14]",
              animate && "animate-whirl",
            )}
          />
        </motion.div>

        {/* Mystical Calligraphy */}
        <motion.p
          style={lite ? undefined : { x: farX, y: farY }}
          className="absolute top-[18%] -left-6 select-none font-urdu text-[9rem] leading-none text-gold/[0.07] sm:text-[13rem] lg:left-[4%] lg:text-[17rem]"
          dir="rtl"
          aria-hidden
        >
          عشق
        </motion.p>
        <motion.p
          style={lite ? undefined : { x: farX, y: farY }}
          className="absolute right-[2%] bottom-[16%] select-none font-gurmukhi text-[5rem] leading-none text-gold/[0.06] sm:text-[8rem]"
          aria-hidden
        >
          ਇਸ਼ਕ
        </motion.p>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />

        {/* Organic rising golden diya sparks with horizontal sway */}
        {animate &&
          DIYAS.map((d, i) => (
            <motion.span
              key={i}
              initial={{ y: 0, opacity: 0 }}
              animate={{
                y: [-10, -660],
                x: [0, (i % 2 === 0 ? 1 : -1) * 14, 0],
                opacity: [0, 0.9, 0.7, 0],
                scale: [0.8, 1.2, 0.9, 0.4],
              }}
              transition={{
                duration: playing ? d.duration * 0.6 : d.duration,
                delay: d.delay,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
              style={{ left: d.left, width: d.size, height: d.size * 1.5 }}
              className="absolute bottom-0 rounded-full bg-gradient-to-t from-maroon via-gold to-gold-light shadow-[0_0_16px_5px_rgba(236,217,160,0.4)]"
            />
          ))}
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8 xl:gap-12">
        {/* Left: name & call to action */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 text-center lg:order-1 lg:text-left"
        >
          <p className="inline-flex items-center gap-2 font-urdu text-lg text-gold-light/90">
            <span className="h-px w-8 bg-gold/60" />
            ਸੂਫ਼ੀ · صوفی · Sufi
            <span className="h-px w-8 bg-gold/60" />
          </p>
          <h1 className="mt-3 font-brand text-5xl leading-[0.95] tracking-wide sm:text-6xl xl:text-7xl">
            <span className="text-gold-gradient">Sardar</span>
            <br />
            <span className="text-ivory">Ali</span>
          </h1>
          <div className="mt-4 flex h-9 items-center justify-center gap-2 whitespace-nowrap font-display text-2xl text-ivory/80 italic lg:justify-start">
            <span>the voice of</span>
            <span className="inline-block min-w-[6ch] text-left">
              <AnimatePresence mode="wait">
                <motion.span
                  key={MOODS[mood]}
                  initial={{ y: 18, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.45 }}
                  className="inline-block font-semibold text-gold-light not-italic"
                >
                  {MOODS[mood]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ivory/70 lg:mx-0">
            {s?.tagline ?? "Punjabi Folk · Sufi Kalam · Live Mehfils"}
          </p>

          <div className="mt-7 flex items-center gap-3 justify-center lg:justify-start">
            <Link
              to="/book"
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-gold px-5 sm:px-7 font-semibold text-night shadow-[0_10px_30px_-8px_rgba(201,162,74,0.7)] transition hover:bg-gold-light"
            >
              <CalendarHeart className="size-4 transition group-hover:-rotate-12" />
              Book a Mehfil
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <a
              href="#releases"
              className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-gold/40 px-4 sm:px-6 font-semibold text-gold-light transition hover:border-gold hover:bg-gold/10"
            >
              Hear the Kalam <ArrowDown className="size-4" />
            </a>
          </div>

          {/* Mobile-only stats strip */}
          <dl className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2 md:hidden">
            {stats.map((st) => (
              <div
                key={st.label}
                className="rounded-xl border border-gold/20 bg-night-2/70 px-1.5 py-2 text-center shadow-lg"
              >
                <dt className="font-display text-base font-bold text-gold-light">
                  {st.value}
                </dt>
                <dd className="text-[9px] leading-tight text-ivory/60">
                  {st.label}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Centre: mehrab portrait with the play disc */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={lite ? undefined : { x: nearX, y: nearY }}
          className="relative order-1 mx-auto w-[260px] sm:w-[320px] lg:order-2 lg:w-[360px]"
        >
          <div className="relative">
            {/* Halo rings that breathe with the music */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                animate={
                  animate
                    ? {
                        scale: playing ? [1, 1.25] : [1, 1.06, 1],
                        opacity: playing ? [0.5, 0] : [0.35, 0.15, 0.35],
                      }
                    : undefined
                }
                transition={{
                  duration: playing ? 2.4 : 6,
                  delay: i * (playing ? 0.8 : 1.2),
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeOut",
                }}
                className="arch absolute -inset-4 border border-gold/40"
              />
            ))}
            <div className="arch relative overflow-hidden border-2 border-gold/60 bg-gradient-to-b from-night-2 to-night p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="arch relative aspect-[3/4] overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#2a6b5c,#0b1f1c_75%)]">
                <img
                  src={s?.heroImagePath ?? "/uploads/brand/hero-portrait.svg"}
                  alt={s?.artistName ?? "Sardar Ali"}
                  fetchPriority="high"
                  className="size-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/90 to-transparent" />
                <div className="absolute inset-x-0 bottom-4 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.35em] text-gold-light/80 uppercase">
                    Now in the mehfil
                  </p>
                  <p className="font-display text-lg text-ivory">
                    {hoverSong ?? trackTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Play disc: spins like a record while the kalam plays */}
            {videoId ? (
              <button
                type="button"
                onClick={player.toggle}
                aria-label={
                  playing ? `Pause ${trackTitle}` : `Play ${trackTitle}`
                }
                className="group absolute -bottom-9 left-1/2 grid size-20 -translate-x-1/2 place-items-center rounded-full bg-night ring-2 ring-gold/70 transition hover:ring-gold-light focus-visible:outline-none focus-visible:ring-4"
              >
                <span
                  className={cn(
                    "absolute inset-1.5 rounded-full bg-[repeating-radial-gradient(circle,#123a33_0_2px,#0b1f1c_2px_4px)]",
                    playing && "animate-[spin_3s_linear_infinite]",
                  )}
                />
                <span className="relative grid size-10 place-items-center rounded-full bg-gold text-night shadow-lg transition group-hover:scale-110">
                  {player.pending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : playing ? (
                    <Pause className="size-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 size-5 fill-current" />
                  )}
                </span>
              </button>
            ) : (
              s?.youtubeUrl && (
                <a
                  href={s.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Listen on YouTube"
                  className="absolute -bottom-7 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-gold text-night ring-4 ring-night transition hover:scale-110"
                >
                  <Play className="ml-0.5 size-6 fill-current" />
                </a>
              )
            )}
          </div>
          {videoId && (
            <iframe
              id={player.iframeId}
              src={player.src}
              title="Background kalam"
              allow="autoplay; encrypted-media"
              className="pointer-events-none absolute size-px opacity-0"
              tabIndex={-1}
              aria-hidden
            />
          )}
          <p className="mt-12 text-center text-xs text-ivory/55">
            {playing ? (
              <span className="inline-flex items-center gap-1.5 text-gold-light">
                <span className="flex h-3 items-end gap-0.5">
                  {[0, 1, 2, 3].map((b) => (
                    <motion.span
                      key={b}
                      animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
                      transition={{
                        duration: 1.1,
                        delay: b * 0.15,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      className="w-0.5 rounded-full bg-gold-light"
                    />
                  ))}
                </span>
                Playing · {trackSubtitle}
              </span>
            ) : videoId ? (
              "Tap the disc to listen"
            ) : (
              "Listen on YouTube"
            )}
          </p>
        </motion.div>

        {/* Right: signature songs + stats */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="hidden md:block order-3 lg:justify-self-end"
        >
          <p className="text-center font-brand text-xs tracking-[0.3em] text-gold-light lg:text-right">
            RUHANI HITS
          </p>
          <ul className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-2 lg:max-w-xs lg:flex-col lg:items-end">
            {SIGNATURE_SONGS.map((song, i) => (
              <motion.li
                key={song}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
              >
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`Sardar Ali ${song}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={() => setHoverSong(song)}
                  onMouseLeave={() => setHoverSong(null)}
                  onFocus={() => setHoverSong(song)}
                  onBlur={() => setHoverSong(null)}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-ivory/80 transition hover:border-gold/60 hover:bg-gold/10 hover:text-gold-light lg:flex-row-reverse"
                >
                  <span className="font-display text-xs text-gold/70 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {song}
                  <Play className="size-3 opacity-0 transition group-hover:opacity-100" />
                </a>
              </motion.li>
            ))}
          </ul>
          <dl className="mx-auto mt-6 grid max-w-md grid-cols-4 gap-2 lg:max-w-xs">
            {stats.map((st) => (
              <div
                key={st.label}
                className="rounded-xl border border-gold/20 bg-night-2/60 px-1 py-2 text-center"
              >
                <dt className="font-display text-lg font-bold text-gold-light">
                  {st.value}
                </dt>
                <dd className="text-[10px] leading-tight text-ivory/60">
                  {st.label}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>

      {/* Listen-on chain */}
      {listen.length > 0 && (
        <div className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4">
          <span className="mr-1 text-[11px] font-semibold tracking-[0.25em] text-ivory/50 uppercase">
            Listen on
          </span>
          {listen.map(({ href, label, Icon }) => (
            <motion.a
              key={label}
              href={href ?? "#"}
              target="_blank"
              rel="noreferrer"
              whileHover={{ y: -3 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-1.5 text-xs font-medium text-ivory/80 transition-colors hover:border-gold hover:text-gold-light"
            >
              <Icon className="size-3.5 text-gold" /> {label}
            </motion.a>
          ))}
        </div>
      )}
    </section>
  );
}
