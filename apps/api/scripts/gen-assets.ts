// Generates the Sardar Ali brand SVGs (logo, placeholders, release posters,
// mehfil gallery, blog covers, social thumbnails) into apps/api/uploads/ and the favicon into
// apps/web/public/. Run with `bun run assets` from apps/api.
import { mkdir } from "node:fs/promises";

const NIGHT = "#0b1f1c";
const NIGHT_2 = "#123a33";
const MAROON = "#8a2846";
const GOLD = "#c9a24a";
const GOLD_LIGHT = "#ecd9a0";
const IVORY = "#f7f2e7";
/** Gold for gradients' far stop (MAROON is too dark to read as metal). */
const GOLD_DEEP = "#a8782a";

const UP = new URL("../uploads/", import.meta.url).pathname;
const WEB_PUBLIC = new URL("../../web/public/", import.meta.url).pathname;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    if (`${line} ${w}`.trim().length > max && line) {
      out.push(line);
      line = w;
    } else line = `${line} ${w}`.trim();
  }
  if (line) out.push(line);
  return out;
}

async function write(path: string, svg: string) {
  await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  await Bun.write(path, svg.trim());
  console.info(
    "  ✓",
    path.replace(`${UP}`, "uploads/").replace(WEB_PUBLIC, "web/public/"),
  );
}

// ── Emblem: microphone inside a gold ring with sound waves ──
function emblem(id: string, size = 96) {
  const s = size / 96;
  return `
  <g transform="scale(${s})">
    <defs>
      <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${GOLD_LIGHT}"/>
        <stop offset="0.55" stop-color="${GOLD}"/>
        <stop offset="1" stop-color="${GOLD_DEEP}"/>
      </linearGradient>
      <radialGradient id="${id}-bg" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="${NIGHT_2}"/>
        <stop offset="1" stop-color="${NIGHT}"/>
      </radialGradient>
    </defs>
    <circle cx="48" cy="48" r="46" fill="url(#${id}-bg)"/>
    <circle cx="48" cy="48" r="44" fill="none" stroke="url(#${id}-g)" stroke-width="2.5"/>
    <circle cx="48" cy="48" r="39" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="1.5 3"/>
    <!-- sound waves -->
    <g fill="none" stroke="url(#${id}-g)" stroke-linecap="round">
      <path d="M26 36 Q20 46 26 56" stroke-width="3"/>
      <path d="M19 31 Q10 46 19 61" stroke-width="2.2" stroke-opacity="0.7"/>
      <path d="M70 36 Q76 46 70 56" stroke-width="3"/>
      <path d="M77 31 Q86 46 77 61" stroke-width="2.2" stroke-opacity="0.7"/>
    </g>
    <!-- microphone -->
    <rect x="39" y="20" width="18" height="32" rx="9" fill="url(#${id}-g)"/>
    <g stroke="${NIGHT}" stroke-opacity="0.45" stroke-width="1.2">
      <line x1="41" y1="29" x2="55" y2="29"/><line x1="41" y1="34" x2="55" y2="34"/><line x1="41" y1="39" x2="55" y2="39"/>
    </g>
    <path d="M33 44 Q33 60 48 60 Q63 60 63 44" fill="none" stroke="url(#${id}-g)" stroke-width="3" stroke-linecap="round"/>
    <line x1="48" y1="60" x2="48" y2="70" stroke="url(#${id}-g)" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 72 H58" stroke="url(#${id}-g)" stroke-width="3.2" stroke-linecap="round"/>
  </g>`;
}

function logo(textColor: string, subColor: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" role="img" aria-label="Sardar Ali logo">
  ${emblem("lg")}
  <text x="110" y="50" font-family="'Cinzel Decorative','Cinzel','Cormorant Garamond',Georgia,serif" font-size="34" font-weight="700" textLength="240" lengthAdjust="spacingAndGlyphs" fill="${textColor}">SARDAR ALI</text>
  <line x1="111" y1="62" x2="351" y2="62" stroke="${GOLD}" stroke-width="1.2" stroke-opacity="0.8"/>
  <text x="111" y="80" font-family="'Mukta','Segoe UI',Arial,sans-serif" font-size="13.5" textLength="240" lengthAdjust="spacing" fill="${subColor}">PUNJABI · SUFI SINGER</text>
</svg>`;
}

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Sardar Ali">${emblem("mk")}</svg>`;

// ── Hero pattern: gold rays + mandala ──
function mandala(cx: number, cy: number, r: number, opacity: number) {
  const petals = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 360) / 24;
    return `<ellipse cx="${cx}" cy="${cy - r * 0.62}" rx="${r * 0.09}" ry="${r * 0.3}" transform="rotate(${a} ${cx} ${cy})"/>`;
  }).join("");
  const dots = Array.from({ length: 48 }, (_, i) => {
    const a = (i * Math.PI * 2) / 48;
    return `<circle cx="${(cx + Math.cos(a) * r * 0.98).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.98).toFixed(1)}" r="${r * 0.012}"/>`;
  }).join("");
  return `<g fill="none" stroke="${GOLD}" stroke-opacity="${opacity}" stroke-width="1.2">
    <circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.9}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.3}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.22}"/>
    ${petals}
  </g><g fill="${GOLD}" fill-opacity="${opacity * 1.4}">${dots}</g>`;
}

const heroBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="glow" cx="0.72" cy="0.38" r="0.6">
      <stop offset="0" stop-color="${MAROON}" stop-opacity="0.35"/>
      <stop offset="0.45" stop-color="${NIGHT_2}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${NIGHT}"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="${NIGHT}"/>
  <rect width="1600" height="900" fill="url(#glow)"/>
  <g stroke="${GOLD_LIGHT}" stroke-opacity="0.06" stroke-width="40">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="1150" y1="340" x2="${1150 + Math.cos((i * Math.PI) / 7) * 1400}" y2="${340 + Math.sin((i * Math.PI) / 7) * 1400}"/>`).join("")}
  </g>
  ${mandala(1150, 340, 330, 0.18)}
  ${mandala(120, 820, 220, 0.1)}
</svg>`;

// ── Portrait placeholder: singer silhouette with mic under a dargah arch ──
function portrait(bgA: string, bgB: string) {
  const arch =
    "M110 750 L110 300 C110 170 200 80 300 40 C400 80 490 170 490 300 L490 750 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" role="img" aria-label="Portrait placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLD_LIGHT}"/><stop offset="1" stop-color="${GOLD_DEEP}"/></linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.34" r="0.5"><stop offset="0" stop-color="${GOLD_LIGHT}" stop-opacity="0.5"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="600" height="750" fill="url(#bg)"/>
  ${mandala(300, 260, 260, 0.14)}
  <path d="${arch}" fill="${NIGHT}" fill-opacity="0.55" stroke="url(#gold)" stroke-width="4"/>
  <circle cx="300" cy="250" r="200" fill="url(#halo)"/>
  <!-- silhouette: head, shoulders, raised arm with mic -->
  <g fill="#06120f">
    <ellipse cx="300" cy="250" rx="66" ry="80"/>
    <rect x="272" y="310" width="56" height="60" rx="20"/>
    <path d="M140 750 C150 560 220 410 300 400 C380 410 450 560 460 750 Z"/>
    <path d="M380 440 C430 420 455 380 440 330 L412 338 C420 372 404 396 368 410 Z"/>
  </g>
  <rect x="418" y="280" width="34" height="62" rx="17" fill="url(#gold)" transform="rotate(-18 435 311)"/>
  <!-- shawl -->
  <path d="M220 420 C260 470 340 470 380 420 L360 750 L240 750 Z" fill="${MAROON}" opacity="0.85"/>
  <path d="M220 420 C260 470 340 470 380 420" fill="none" stroke="url(#gold)" stroke-width="5"/>
  <g fill="${GOLD_LIGHT}" opacity="0.8">
    <circle cx="160" cy="180" r="3"/><circle cx="450" cy="150" r="2.5"/><circle cx="200" cy="110" r="2"/><circle cx="420" cy="230" r="2"/>
  </g>
</svg>`;
}

// ── Cards (blog covers + social thumbs) ──
function card(opts: {
  w: number;
  h: number;
  title: string;
  kicker: string;
  hue: [string, string];
  motif: "mic" | "harmonium" | "wave" | "lamp" | "tabla" | "book";
  badge?: string;
  /** Centered motif with no text (release posters get their title from the UI). */
  plain?: boolean;
}) {
  const { w, h, title, kicker, hue, motif } = opts;
  const lines = wrap(title, w > 900 ? 26 : 22).slice(0, 3);
  const fs = w > 900 ? 58 : 46;
  const cx = opts.plain ? w / 2 : w * 0.78;
  const cy = opts.plain ? h * 0.4 : h * 0.42;
  const motifs: Record<typeof motif, string> = {
    mic: `<rect x="${cx - 40}" y="${cy - 90}" width="80" height="140" rx="40" fill="url(#g)"/><path d="M${cx - 70} ${cy + 10} Q${cx - 70} ${cy + 90} ${cx} ${cy + 90} Q${cx + 70} ${cy + 90} ${cx + 70} ${cy + 10}" fill="none" stroke="url(#g)" stroke-width="10"/>`,
    harmonium: `<rect x="${cx - 120}" y="${cy - 30}" width="240" height="110" rx="10" fill="url(#g)"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${cx - 112 + i * 19}" y="${cy + 30}" width="15" height="42" fill="${IVORY}"/>`).join("")}<g stroke="${NIGHT}" stroke-opacity="0.4" stroke-width="4">${Array.from({ length: 5 }, (_, i) => `<line x1="${cx - 110}" y1="${cy - 20 + i * 10}" x2="${cx + 110}" y2="${cy - 20 + i * 10}"/>`).join("")}</g>`,
    wave: `<g fill="none" stroke="url(#g)" stroke-width="8" stroke-linecap="round">${Array.from({ length: 4 }, (_, i) => `<path d="M${cx - 160} ${cy + i * 28 - 40} Q${cx - 80} ${cy - 80 + i * 28} ${cx} ${cy + i * 28 - 40} T${cx + 160} ${cy + i * 28 - 40}" stroke-opacity="${1 - i * 0.2}"/>`).join("")}</g>`,
    lamp: `<path d="M${cx - 90} ${cy + 40} Q${cx} ${cy + 110} ${cx + 90} ${cy + 40} Z" fill="url(#g)"/><path d="M${cx} ${cy - 90} C${cx + 35} ${cy - 40} ${cx + 25} ${cy + 10} ${cx} ${cy + 25} C${cx - 25} ${cy + 10} ${cx - 35} ${cy - 40} ${cx} ${cy - 90} Z" fill="${MAROON}"/><circle cx="${cx}" cy="${cy - 10}" r="120" fill="${GOLD_LIGHT}" opacity="0.12"/>`,
    tabla: `<ellipse cx="${cx - 60}" cy="${cy - 20}" rx="60" ry="20" fill="${IVORY}"/><path d="M${cx - 120} ${cy - 20} L${cx - 110} ${cy + 80} Q${cx - 60} ${cy + 100} ${cx - 10} ${cy + 80} L${cx} ${cy - 20}" fill="url(#g)"/><ellipse cx="${cx + 70}" cy="${cy}" rx="70" ry="24" fill="${IVORY}"/><path d="M${cx} ${cy} Q${cx - 10} ${cy + 110} ${cx + 70} ${cy + 110} Q${cx + 150} ${cy + 110} ${cx + 140} ${cy}" fill="url(#g)"/>`,
    book: `<path d="M${cx - 140} ${cy - 60} Q${cx - 70} ${cy - 90} ${cx} ${cy - 60} Q${cx + 70} ${cy - 90} ${cx + 140} ${cy - 60} L${cx + 140} ${cy + 80} Q${cx + 70} ${cy + 50} ${cx} ${cy + 80} Q${cx - 70} ${cy + 50} ${cx - 140} ${cy + 80} Z" fill="${IVORY}"/><line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy + 80}" stroke="${GOLD}" stroke-width="4"/><path d="M${cx - 140} ${cy + 80} Q${cx - 70} ${cy + 50} ${cx} ${cy + 80} Q${cx + 70} ${cy + 50} ${cx + 140} ${cy + 80}" fill="none" stroke="url(#g)" stroke-width="8"/>`,
  };
  const badge = opts.badge
    ? `<rect x="${w - 190}" y="${h - 80}" width="150" height="46" rx="23" fill="#000" fill-opacity="0.45"/><text x="${w - 115}" y="${h - 49}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="22" fill="${IVORY}">${esc(opts.badge)}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hue[0]}"/><stop offset="1" stop-color="${hue[1]}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLD_LIGHT}"/><stop offset="1" stop-color="${GOLD_DEEP}"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${mandala(cx, cy, Math.min(w, h) * 0.42, 0.14)}
  ${motifs[motif]}
  ${
    opts.plain
      ? ""
      : `<text x="60" y="${h * 0.2}" font-family="'Mukta',Arial,sans-serif" font-size="${fs * 0.42}" letter-spacing="4" fill="${GOLD_LIGHT}">${esc(kicker.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="60" y="${h * 0.2 + 70 + i * fs * 1.15}" font-family="'Cormorant Garamond',Georgia,serif" font-weight="700" font-size="${fs}" fill="${IVORY}">${esc(l)}</text>`).join("")}
  <rect x="60" y="${h - 60}" width="90" height="5" rx="2" fill="url(#g)"/>`
  }
  ${opts.plain ? "" : badge}
</svg>`;
}

const HUES: [string, string][] = [
  [NIGHT, NIGHT_2],
  ["#3a1220", "#7a2340"],
  ["#0e2a25", "#1d5a4d"],
  ["#2b1a0c", "#6b4a1e"],
  ["#14213a", "#2a3f6b"],
  ["#1d0f1f", "#4a2350"],
];
const MOTIFS = ["lamp", "mic", "wave", "book", "harmonium", "tabla"] as const;

async function main() {
  console.info("Generating brand assets…");
  await write(`${UP}brand/logo.svg`, logo(IVORY, GOLD_LIGHT));
  await write(`${UP}brand/logo-dark.svg`, logo(NIGHT, "#8a6a2a"));
  await write(`${UP}brand/logo-mark.svg`, markSvg);
  await write(`${WEB_PUBLIC}logo.svg`, logo(IVORY, GOLD_LIGHT));
  await write(`${WEB_PUBLIC}logo-dark.svg`, logo(NIGHT, "#8a6a2a"));
  await write(`${WEB_PUBLIC}favicon.svg`, markSvg);
  await write(`${WEB_PUBLIC}hero-bg.svg`, heroBg);
  await write(`${UP}brand/hero-bg.svg`, heroBg);
  await write(`${UP}brand/hero-portrait.svg`, portrait(NIGHT_2, NIGHT));
  await write(
    `${UP}brand/about-placeholder.svg`,
    portrait("#3a1220", "#160709"),
  );
  await write(
    `${WEB_PUBLIC}og-image.svg`,
    card({
      w: 1200,
      h: 630,
      title: "Sardar Ali",
      kicker: "Punjabi Folk · Sufi Kalam",
      hue: [NIGHT, NIGHT_2],
      motif: "mic",
    }),
  );

  const { releaseSeed } = await import("../src/db/seed/release-data");
  for (const [i, r] of releaseSeed.entries()) {
    const wide = r.aspect === "wide";
    await write(
      `${UP}${r.posterPath.replace("/uploads/", "")}`,
      card({
        w: wide ? 1280 : 1000,
        h: wide ? 720 : 1000,
        title: r.title,
        kicker: r.subtitle ?? "New release",
        hue: HUES[(i + 1) % HUES.length] as [string, string],
        motif: MOTIFS[i % MOTIFS.length] ?? "lamp",
        badge: wide ? "▶ WATCH" : "♫ LISTEN",
        plain: true,
      }),
    );
  }

  const { siteSettingsSeed } = await import("../src/db/seed/site-data");
  for (const [i, g] of (siteSettingsSeed.gallery ?? []).entries()) {
    await write(
      `${UP}${g.imagePath.replace("/uploads/", "")}`,
      card({
        w: 1200,
        h: 800,
        title: g.title,
        kicker: "Mehfil moments",
        hue: HUES[(i + 3) % HUES.length] as [string, string],
        motif: MOTIFS[(i + 3) % MOTIFS.length] ?? "harmonium",
        plain: true,
      }),
    );
  }

  const { blogSeed } = await import("../src/db/seed/blog-data");
  for (const [i, b] of blogSeed.entries()) {
    await write(
      `${UP}blog/cover-${i + 1}.svg`,
      card({
        w: 1200,
        h: 675,
        title: b.title,
        kicker: b.tags[0] ?? "blog",
        hue: HUES[i % HUES.length] as [string, string],
        motif: MOTIFS[i % MOTIFS.length] ?? "mic",
      }),
    );
  }

  const { socialSeedData } = await import("../src/db/seed/social-data");
  const counters = { youtube: 0, facebook: 0, instagram: 0 };
  for (const p of socialSeedData) {
    counters[p.platform] += 1;
    const n = counters[p.platform];
    const prefix =
      p.platform === "youtube" ? "yt" : p.platform === "facebook" ? "fb" : "ig";
    const square = p.platform === "instagram";
    await write(
      `${UP}social/${prefix}-${n}.svg`,
      card({
        w: square ? 800 : 1280,
        h: square ? 800 : 720,
        title:
          p.platform === "youtube"
            ? p.caption.replace(/^.*?[–-]\s*/, "")
            : (p.caption.split(/[.!🙏—]/u)[0]?.slice(0, 60) ?? ""),
        kicker: p.platform === "youtube" ? "Sardar Ali · Sufi" : p.platform,
        hue: HUES[(n + (square ? 2 : 0)) % HUES.length] as [string, string],
        motif: MOTIFS[(n + 1) % MOTIFS.length] ?? "mic",
        badge: p.platform === "youtube" ? "▶ Watch" : undefined,
      }),
    );
  }
  console.info("Done.");
}

await main();
