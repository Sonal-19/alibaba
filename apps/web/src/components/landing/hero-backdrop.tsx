import { type CSSProperties, type RefObject, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Night at the dargah: a dusk sky over a domed skyline, brass qandeels that
 * swing when you brush past them, a lantern-light that reveals the jaali
 * wherever the pointer (or finger) goes, rising diya embers and a golden
 * "sur" that ripples under the pointer and swells while the kalam plays.
 *
 * Everything animated runs in one requestAnimationFrame loop that writes to a
 * canvas and to a few element styles, so React never re-renders per frame.
 */

type Lantern = {
  left: number; // % of width
  length: number; // chain length in px (desktop)
  scale: number;
  edge: boolean; // shown on phones, hidden while the 3-column layout is tight
};

const LANTERNS: Lantern[] = [
  // Long chains only at the edges, short ones clear of the text columns.
  { left: 3, length: 170, scale: 0.9, edge: true },
  { left: 12, length: 92, scale: 0.7, edge: false },
  { left: 33, length: 76, scale: 0.55, edge: false },
  { left: 67, length: 76, scale: 0.55, edge: false },
  { left: 88, length: 88, scale: 0.7, edge: false },
  { left: 97, length: 170, scale: 0.9, edge: true },
];

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  phase: number;
};

type Star = { x: number; y: number; r: number; phase: number; speed: number };

const GOLD = "236,217,160";

function makeGlowSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,244,214,1)");
  grad.addColorStop(0.18, "rgba(236,200,120,0.85)");
  grad.addColorStop(0.45, "rgba(201,140,60,0.25)");
  grad.addColorStop(1, "rgba(201,120,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export function HeroBackdrop({
  sectionRef,
  playing,
  reduced,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  playing: boolean;
  reduced: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightRef = useRef<HTMLDivElement | null>(null);
  const skylineRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<HTMLDivElement | null>(null);
  const lanternRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const sprite = makeGlowSprite();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    const embers: Ember[] = [];
    let spawnAcc = 0;

    const pointer = { x: 0, y: 0, vx: 0, active: false, last: 0 };
    const light = { x: 0, y: 0 };
    let bump = 0; // how strongly the sur bends toward the pointer, 0..1
    let energy = 0; // eases toward 1 while playing

    const swing = LANTERNS.map(() => ({ a: 0, v: 0 }));

    const resize = () => {
      const r = section.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 14000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.55,
        r: Math.random() * 1.1 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.5 + 0.5,
      }));
      if (!light.x) {
        light.x = w / 2;
        light.y = h * 0.35;
      }
    };

    const spawn = (x: number, y: number, burst = false) => {
      const max = burst ? 1.6 + Math.random() * 1.4 : 5 + Math.random() * 5;
      embers.push({
        x,
        y,
        vx: burst ? (Math.random() - 0.5) * 120 : (Math.random() - 0.5) * 8,
        vy: burst
          ? -40 - Math.random() * 110
          : -(18 + Math.random() * 30) * (w < 640 ? 0.8 : 1),
        life: 0,
        max,
        size: burst ? 3 + Math.random() * 4 : 3 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const lanternPivot = (i: number) => {
      const el = lanternRefs.current[i];
      if (!el || el.offsetParent === null) return null;
      const L = LANTERNS[i];
      if (!L) return null;
      const len = (w < 640 ? L.length * 0.6 : L.length) + 45 * L.scale;
      return { x: (L.left / 100) * w, y: 0, len };
    };

    const local = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const now = performance.now();
      const dt = Math.max(16, now - pointer.last);
      pointer.vx = pointer.active ? ((p.x - pointer.x) / dt) * 16 : 0;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
      pointer.last = now;
      // Brushing past a qandeel nudges it.
      LANTERNS.forEach((_, i) => {
        const pv = lanternPivot(i);
        const s = swing[i];
        if (!pv || !s) return;
        const bx = pv.x + Math.sin(s.a) * pv.len;
        const by = pv.y + Math.cos(s.a) * pv.len;
        if (Math.hypot(p.x - bx, p.y - by) < 60)
          s.v += Math.max(-0.5, Math.min(0.5, pointer.vx * 0.03));
      });
    };
    const onLeave = () => {
      pointer.active = false;
    };
    // Fingers lift off; a mouse keeps hovering.
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave();
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      let hitLantern = false;
      LANTERNS.forEach((_, i) => {
        const pv = lanternPivot(i);
        const s = swing[i];
        if (!pv || !s) return;
        const bx = pv.x + Math.sin(s.a) * pv.len;
        const by = pv.y + Math.cos(s.a) * pv.len;
        if (Math.hypot(p.x - bx, p.y - by) < 70) {
          s.v += (p.x < bx ? 1 : -1) * 0.9;
          hitLantern = true;
        }
      });
      // A small shower of sparks wherever you tap, like a dua released.
      if (!reduced && !hitLantern)
        for (let i = 0; i < 14; i++) spawn(p.x, p.y, true);
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerdown", onDown, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    section.addEventListener("pointerup", onUp, { passive: true });
    section.addEventListener("pointercancel", onLeave, { passive: true });

    const drawSur = (t: number) => {
      const sky = skylineRef.current?.offsetHeight ?? 0;
      const base = h - sky - 18;
      const strands = [
        { amp: 10, k: 0.006, sp: 0.6, off: 0, alpha: 0.45, lw: 1.3 },
        { amp: 14, k: 0.0042, sp: -0.45, off: 9, alpha: 0.28, lw: 1 },
        { amp: 7, k: 0.009, sp: 0.9, off: -8, alpha: 0.2, lw: 0.8 },
      ];
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, `rgba(${GOLD},0)`);
      grad.addColorStop(0.2, `rgba(${GOLD},1)`);
      grad.addColorStop(0.8, `rgba(${GOLD},1)`);
      grad.addColorStop(1, `rgba(${GOLD},0)`);
      const sigma = Math.max(90, w * 0.09);
      const step = w < 640 ? 6 : 8;
      ctx.strokeStyle = grad;
      for (const s of strands) {
        ctx.globalAlpha = s.alpha * (0.75 + energy * 0.5);
        ctx.lineWidth = s.lw;
        ctx.beginPath();
        for (let x = 0; x <= w + step; x += step) {
          const g = Math.exp(-((x - pointer.x) ** 2) / (2 * sigma * sigma));
          const amp = s.amp * (1 + energy * 1.6) + g * bump * 34;
          const y =
            base +
            s.off +
            Math.sin(x * s.k + t * s.sp * (1 + energy)) * amp +
            Math.sin(x * s.k * 2.3 - t * 0.7) * amp * 0.25 * (1 + energy);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let running = false;
    let prev = performance.now();
    let t = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      t += dt;
      energy += ((playingRef.current ? 1 : 0) - energy) * Math.min(1, dt * 2);
      bump += ((pointer.active ? 1 : 0) - bump) * Math.min(1, dt * 3);

      // Lantern light: follow the pointer, otherwise wander slowly.
      const tx = pointer.active
        ? pointer.x
        : w * (0.5 + Math.sin(t * 0.17) * 0.32);
      const ty = pointer.active
        ? pointer.y
        : h * (0.38 + Math.sin(t * 0.23 + 1) * 0.16);
      light.x += (tx - light.x) * Math.min(1, dt * 4);
      light.y += (ty - light.y) * Math.min(1, dt * 4);
      const nx = w ? light.x / w - 0.5 : 0;
      const ny = h ? light.y / h - 0.5 : 0;
      lightRef.current?.style.setProperty("--lx", `${light.x}px`);
      lightRef.current?.style.setProperty("--ly", `${light.y}px`);
      if (skylineRef.current)
        skylineRef.current.style.transform = `translate3d(${nx * -14}px,0,0)`;
      if (callRef.current)
        callRef.current.style.transform = `translate3d(${nx * 22}px,${ny * 14}px,0)`;

      // Qandeel pendulums (~2.5s period, slow to settle) in a light breeze.
      swing.forEach((s, i) => {
        const breeze = Math.sin(t * 0.6 + i * 1.7) * 0.03;
        s.v += (-6 * Math.sin(s.a - breeze) - 0.6 * s.v) * dt;
        s.a = Math.max(-0.6, Math.min(0.6, s.a + s.v * dt));
        const el = lanternRefs.current[i];
        if (el) el.style.transform = `rotate(${s.a}rad)`;
      });

      ctx.clearRect(0, 0, w, h);

      // Stars
      for (const st of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * st.speed + st.phase));
        ctx.fillStyle = `rgba(247,242,231,${a * 0.7})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSur(t);

      // Embers rise from the dargah's diyas.
      const rate = (w < 640 ? 5 : 11) * (1 + energy * 1.2);
      spawnAcc += rate * dt;
      while (spawnAcc > 1) {
        spawnAcc -= 1;
        spawn(Math.random() * w, h * (0.86 + Math.random() * 0.12));
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        if (!e) continue;
        e.life += dt;
        if (e.life > e.max || e.y < -20) {
          embers.splice(i, 1);
          continue;
        }
        // The pointer stirs embers into a gentle swirl.
        if (pointer.active) {
          const dx = e.x - pointer.x;
          const dy = e.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 140) * 90;
            e.vx += ((dx / d) * f * 0.6 - (dy / d) * f) * dt;
            e.vy += ((dy / d) * f * 0.6 + (dx / d) * f) * dt;
          }
        }
        e.vx *= 1 - dt * 0.9;
        e.vy += (-(22 + energy * 14) - e.vy) * dt * 0.4;
        e.x += (e.vx + Math.sin(t * 1.3 + e.phase) * 10) * dt;
        e.y += e.vy * dt;
        const p = e.life / e.max;
        const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        const flick = 0.8 + 0.2 * Math.sin(t * 9 + e.phase);
        const size = e.size * (1 - p * 0.5) * 2.4;
        ctx.globalAlpha = Math.max(0, alpha * flick * 0.85);
        ctx.drawImage(sprite, e.x - size / 2, e.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) frame(performance.now());
    });
    ro.observe(section);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(section);
    const onVis = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVis);

    if (reduced) {
      // One still frame: stars, the sur and a few resting embers.
      for (let i = 0; i < 24; i++)
        embers.push({
          x: Math.random() * w,
          y: h * (0.45 + Math.random() * 0.5),
          vx: 0,
          vy: 0,
          life: 1,
          max: 4,
          size: 3 + Math.random() * 4,
          phase: Math.random() * 6,
        });
      frame(performance.now());
    } else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerup", onUp);
      section.removeEventListener("pointercancel", onLeave);
    };
  }, [sectionRef, reduced]);

  return (
    <div
      ref={lightRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={
        {
          "--lx": "50%",
          "--ly": "35%",
        } as CSSProperties
      }
    >
      {/* Dusk sky: deep night above, a warm emerald glow on the horizon */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#06120f_0%,#0b1f1c_38%,#123a33_72%,#2a5a45_88%,#4d5a33_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(236,190,110,0.28),transparent_70%)]" />

      {/* Faint jaali everywhere… */}
      <div className="absolute inset-0 bg-jaali opacity-40" />
      {/* …and lit up where the lantern-light falls */}
      <div
        className="absolute inset-0 bg-jaali-lit"
        style={{
          maskImage:
            "radial-gradient(circle min(340px,60vw) at var(--lx) var(--ly), #000 0%, rgba(0,0,0,0.5) 45%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(circle min(340px,60vw) at var(--lx) var(--ly), #000 0%, rgba(0,0,0,0.5) 45%, transparent 75%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle min(420px,70vw) at var(--lx) var(--ly), rgba(236,200,120,0.16), transparent 70%)",
        }}
      />

      {/* Calligraphy in the sky */}
      <div ref={callRef} className="absolute inset-0 will-change-transform">
        <p
          className="absolute top-[16%] -left-4 select-none font-urdu text-[8rem] leading-none text-gold/[0.07] sm:text-[12rem] lg:left-[3%] lg:text-[16rem]"
          dir="rtl"
        >
          عشق
        </p>
        <p className="absolute top-[40%] -right-2 select-none font-gurmukhi text-[4.5rem] leading-none text-gold/[0.06] sm:right-[3%] sm:text-[7rem]">
          ਇਸ਼ਕ
        </p>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Hanging qandeels */}
      {LANTERNS.map((l, i) => (
        <div
          key={l.left}
          ref={(el) => {
            lanternRefs.current[i] = el;
          }}
          className={cn(
            "absolute top-0 origin-top will-change-transform",
            l.edge ? "lg:max-[1399px]:hidden" : "hidden md:block",
          )}
          style={{ left: `${l.left}%` }}
        >
          <Qandeel id={i} length={l.length} scale={l.scale} delay={i * 0.37} />
        </div>
      ))}

      {/* Dargah skyline */}
      <div
        ref={skylineRef}
        className="absolute -inset-x-6 bottom-0 flex flex-col items-center will-change-transform"
      >
        <DargahSkyline />
      </div>
    </div>
  );
}

function Qandeel({
  id,
  length,
  scale,
  delay,
}: {
  id: number;
  length: number;
  scale: number;
  delay: number;
}) {
  return (
    <div
      className="-translate-x-1/2"
      style={{ ["--chain" as string]: `${length}px` }}
    >
      <div className="mx-auto h-[calc(var(--chain)*0.6)] w-px bg-gradient-to-b from-gold/0 via-gold/40 to-gold/70 sm:h-(--chain)" />
      <svg
        viewBox="0 0 40 90"
        width={40 * scale}
        height={90 * scale}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id={`q-glow-${id}`} cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor="#fff1c9" />
            <stop offset="45%" stopColor="#f0b85a" />
            <stop offset="100%" stopColor="#8a4a14" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        {/* halo */}
        <circle
          cx="20"
          cy="50"
          r="34"
          fill="rgba(240,184,90,0.18)"
          className="animate-glow"
          style={{ animationDelay: `${delay}s`, filter: "blur(8px)" }}
        />
        {/* cap */}
        <path d="M20 0 L20 6" stroke="#c9a24a" strokeWidth="1.2" />
        <circle cx="20" cy="7.5" r="2" fill="#c9a24a" />
        <path d="M10 22 Q20 4 30 22 Z" fill="#7a5a22" stroke="#c9a24a" />
        <rect x="8" y="22" width="24" height="3" rx="1" fill="#c9a24a" />
        {/* glowing body with mehrab windows */}
        <path
          d="M9 25 L31 25 L33 58 Q20 70 7 58 Z"
          fill={`url(#q-glow-${id})`}
          className="animate-glow"
          style={{ animationDelay: `${delay}s` }}
        />
        <g fill="none" stroke="#5a3f14" strokeWidth="1.1" opacity="0.85">
          <path d="M9 25 L31 25 L33 58 Q20 70 7 58 Z" />
          <path d="M14 56 L14 36 Q14 30 17 28 Q20 30 20 36 L20 58" />
          <path d="M20 58 L20 36 Q20 30 23 28 Q26 30 26 36 L26 56" />
          <path d="M8 42 L32 42" />
        </g>
        {/* finial */}
        <path d="M14 64 Q20 72 26 64" fill="#c9a24a" />
        <path d="M20 70 L20 82" stroke="#c9a24a" strokeWidth="1.2" />
        <circle cx="20" cy="84" r="2.4" fill="#c9a24a" />
      </svg>
    </div>
  );
}

/**
 * Silhouette of a shrine. The monument keeps its proportions (never cropped)
 * and is sized by --sky-w; the lit arcade beneath is a repeating pattern, so
 * windows stay the same size on every screen width.
 */
function DargahSkyline() {
  return (
    <>
      <svg
        viewBox="130 0 1180 200"
        className="-mb-px block h-auto w-(--sky-w) max-w-none shrink-0"
        style={{ aspectRatio: "1180 / 200" }}
      >
        <defs>
          <linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1b18" />
            <stop offset="100%" stopColor="#081714" />
          </linearGradient>
          <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd98a" />
            <stop offset="100%" stopColor="#b8641c" />
          </linearGradient>
        </defs>
        <g fill="url(#sky-fill)" stroke="rgba(201,162,74,0.45)" strokeWidth="1">
          {/* far small domes */}
          <path d="M250 201 C246 176 270 168 284 150 C298 168 322 176 318 201 Z" />
          <path d="M1122 201 C1118 176 1142 168 1156 150 C1170 168 1194 176 1190 201 Z" />
          {/* minarets */}
          <path d="M168 201 L168 96 L162 96 L162 86 L194 86 L194 96 L188 96 L188 201 Z" />
          <path d="M164 86 C164 66 178 62 178 46 C178 62 192 66 192 86 Z" />
          <path d="M1252 201 L1252 96 L1246 96 L1246 86 L1278 86 L1278 96 L1272 96 L1272 201 Z" />
          <path d="M1248 86 C1248 66 1262 62 1262 46 C1262 62 1276 66 1276 86 Z" />
          {/* side domes */}
          <path d="M420 201 C412 160 452 148 470 118 C488 148 528 160 520 201 Z" />
          <path d="M920 201 C912 160 952 148 970 118 C988 148 1028 160 1020 201 Z" />
          {/* main dome & drum */}
          <rect x="600" y="160" width="240" height="41" />
          <path d="M608 162 C590 108 660 100 690 80 C708 68 714 56 720 38 C726 56 732 68 750 80 C780 100 850 108 832 162 Z" />
        </g>
        {/* finials with crescents */}
        <g stroke="#c9a24a" strokeWidth="1.4" fill="none" opacity="0.8">
          <path d="M720 38 L720 14" />
          <path d="M715 12 A6 6 0 1 0 725 6" />
          <path d="M178 46 L178 30" />
          <path d="M1262 46 L1262 30" />
          <path d="M470 118 L470 102" />
          <path d="M970 118 L970 102" />
        </g>
        {/* minaret balconies */}
        <g fill="none" stroke="rgba(201,162,74,0.5)" strokeWidth="1">
          <path d="M160 140 H196 M160 180 H196" />
          <path d="M1244 140 H1280 M1244 180 H1280" />
        </g>
        {/* drum windows */}
        <g fill="url(#win)">
          {[640, 680, 720, 760, 800].map((c, i) => (
            <path
              key={c}
              d={`M${c - 7} 196 L${c - 7} 180 Q${c - 7} 172 ${c} 169 Q${c + 7} 172 ${c + 7} 180 L${c + 7} 196 Z`}
              className="animate-glow"
              fillOpacity={0.5}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      </svg>
      {/* Arcade: two offset window patterns flickering out of step */}
      <svg className="block h-12 w-full shrink-0" aria-hidden>
        <defs>
          <linearGradient id="arcade-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#081714" />
            <stop offset="100%" stopColor="#06120f" />
          </linearGradient>
          <linearGradient id="arcade-win" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd98a" />
            <stop offset="100%" stopColor="#b8641c" />
          </linearGradient>
          {[0, 44].map((dx) => (
            <pattern
              key={dx}
              id={`arcade-${dx}`}
              width="88"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M${dx + 15} 42 L${dx + 15} 26 Q${dx + 15} 17 ${dx + 22} 13 Q${dx + 29} 17 ${dx + 29} 26 L${dx + 29} 42 Z`}
                fill="url(#arcade-win)"
              />
            </pattern>
          ))}
        </defs>
        <rect width="100%" height="100%" fill="url(#arcade-fill)" />
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          stroke="rgba(201,162,74,0.45)"
        />
        <rect
          width="100%"
          height="100%"
          fill="url(#arcade-0)"
          className="animate-glow"
          fillOpacity={0.4}
        />
        <rect
          width="100%"
          height="100%"
          fill="url(#arcade-44)"
          className="animate-glow"
          fillOpacity={0.28}
          style={{ animationDelay: "1.3s" }}
        />
      </svg>
    </>
  );
}
