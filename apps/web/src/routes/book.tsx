import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Landmark, Mic2 } from "lucide-react";
import { ShowBookingForm } from "@/components/booking/show-booking-form";
import { PublicLayout } from "@/components/layout/public-layout";
import { SHOW_EVENT_TYPES, type ShowEventType } from "@/lib/bookings";

const EVENT_KEYS = SHOW_EVENT_TYPES.map(([k]) => k) as string[];

export const Route = createFileRoute("/book")({
  validateSearch: (q: Record<string, unknown>): { event?: ShowEventType } =>
    typeof q.event === "string" && EVENT_KEYS.includes(q.event)
      ? { event: q.event as ShowEventType }
      : {},
  component: BookShowPage,
});

function BookShowPage() {
  const { event } = Route.useSearch();
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-night px-4 pt-28 pb-14 text-center text-ivory">
        <div className="pointer-events-none absolute inset-0 bg-jaali opacity-60" />
        <div className="relative">
          <p className="font-urdu text-lg text-gold-light" dir="rtl">
            محفل
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            Book <span className="text-gold-gradient">Sardar Ali</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-ivory/75">
            Sufi nights, weddings, melas, concerts and private mehfils, in India
            and abroad.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { icon: Mic2, text: "Live with full band" },
              { icon: Landmark, text: "Dargah melas & urs" },
              { icon: Globe2, text: "UK · Canada · USA tours" },
            ].map((b) => (
              <span
                key={b.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-light"
              >
                <b.icon className="size-3.5" /> {b.text}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-ivory py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ShowBookingForm key={event ?? "none"} initialEvent={event} />
        </div>
      </section>
    </PublicLayout>
  );
}
