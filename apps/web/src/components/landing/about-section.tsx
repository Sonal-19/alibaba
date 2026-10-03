import { motion, useScroll, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { Markdown } from "@/components/common/markdown";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";

const SAFAR = [
  {
    step: "Roots",
    title: "Punjabi folk",
    text: "The rhythm and earthiness of Punjab's folk tradition sit at the base of his sound and his live sets.",
  },
  {
    step: "Kalam",
    title: "Sufi kalam",
    text: "Devotional songs of longing for the Murshid and the Maula, like Deed Maula Mereya and Sangat Muradan Paundi E.",
  },
  {
    step: "Darbar",
    title: "Mehfils at the dargahs",
    text: "A regular voice at Dera Baba Murad Shah Ji (Nakodar), Darbar Baba Rehmat Shah Qadri Ji and the melas of Punjab.",
  },
  {
    step: "Releases",
    title: "Mera Sai Music",
    text: "Nachde Malang, Maa Meri, Kulli Da Chirag, Akhiyan Pyasiyan and Khota Sikka reached listeners across the world.",
  },
  {
    step: "Today",
    title: "Stages around the world",
    text: "Live Sufi nights, weddings and concerts in India, the UK, Canada and beyond, with the full Sardar Ali band.",
  },
];

export function AboutSection({ s }: { s?: SiteSettings }) {
  const timeline = useRef<HTMLOListElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timeline,
    offset: ["start 75%", "end 55%"],
  });
  const thread = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const [active, setActive] = useState(0);

  return (
    <section
      id="about"
      className="relative overflow-x-clip bg-white py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Portrait + bio */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-brand text-xs tracking-[0.3em] text-primary">
              THE SAFAR
            </p>
            <h2 className="mt-2 font-display text-4xl leading-tight text-night sm:text-5xl">
              A voice that sings <em className="text-maroon">for the Yaar</em>
            </h2>
            <div className="mt-8 flex flex-col gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="arch relative w-52 lg:w-62 self-center shrink-0 overflow-hidden border-2 border-gold/60 bg-night p-1 sm:w-40"
              >
                <img
                  src={
                    s?.aboutImagePath ?? "/uploads/brand/about-placeholder.svg"
                  }
                  alt="Sardar Ali performing live"
                  loading="lazy"
                  className="arch aspect-[3/4] w-full object-cover"
                />
              </motion.div>
              <p className="self-center font-display text-2xl leading-snug text-night/80 italic">
                Folk roots. Sufi soul.{" "}
                <span className="text-primary">Live on stage.</span>
              </p>
            </div>
            <Markdown className="mt-8 text-[16.5px] text-foreground/85">
              {s?.bio ?? ""}
            </Markdown>
          </div>

          {/* Journey timeline with a gold thread drawn on scroll */}
          <ol ref={timeline} className="relative space-y-6 pl-10">
            <span className="absolute top-2 bottom-2 left-[15px] w-px bg-gold/25" />
            <motion.span
              style={{ scaleY: thread }}
              className="absolute top-2 bottom-2 left-[15px] w-px origin-top bg-gradient-to-b from-gold via-maroon to-primary"
            />
            {SAFAR.map((m, i) => (
              <motion.li
                key={m.step}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                tabIndex={0}
                className={cn(
                  "relative cursor-default rounded-2xl border p-5 transition-all duration-300 outline-none",
                  active === i
                    ? "border-gold/60 bg-ivory shadow-lg shadow-gold/10"
                    : "border-transparent hover:bg-ivory/60",
                )}
              >
                <span
                  className={cn(
                    "absolute top-6 -left-[33px] grid size-5 place-items-center rounded-full border-2 transition-colors",
                    active === i
                      ? "border-gold bg-gold"
                      : "border-gold/60 bg-white",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-night" />
                </span>
                <p className="font-brand text-[11px] tracking-[0.3em] text-maroon">
                  {String(i + 1).padStart(2, "0")} · {m.step.toUpperCase()}
                </p>
                <h3 className="mt-1 font-display text-2xl text-night">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {m.text}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
