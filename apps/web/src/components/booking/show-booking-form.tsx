import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Drum,
  Flame,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  Info,
  Landmark,
  MapPin,
  Mic2,
  Moon,
  Music2,
  PartyPopper,
  Phone,
  Plane,
  Sparkles,
  Tent,
  Theater,
  User,
} from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { Spinner } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { api, call } from "@/lib/api";
import {
  type AudienceSize,
  eventLabel,
  SHOW_DURATIONS,
  SHOW_EVENT_TYPES,
  SHOW_LANGUAGES,
  SHOW_REQUIREMENTS,
  type ShowEventType,
  type ShowLanguage,
  type ShowRequirement,
  VENUE_TYPES,
  type VenueType,
} from "@/lib/bookings";
import { cn, formatClock, formatDate, todayIst, waLink } from "@/lib/utils";

const EVENT_ICONS: Record<ShowEventType, typeof Music2> = {
  sufi_mehfil: Moon,
  wedding: Heart,
  live_concert: Mic2,
  dargah_mela: Landmark,
  jagran_urs: Flame,
  private_party: PartyPopper,
  corporate_event: Briefcase,
  college_fest: GraduationCap,
  religious_gathering: HandHeart,
  international_tour: Plane,
  other: Sparkles,
};

const VENUE_ICONS: Record<VenueType, typeof Music2> = {
  dargah_shrine: Landmark,
  banquet_hall: Building2,
  open_ground: Tent,
  home: Home,
  auditorium: Theater,
  other: MapPin,
};

const STATES = [
  "Punjab",
  "Haryana",
  "Himachal Pradesh",
  "Chandigarh",
  "Delhi",
  "Uttar Pradesh",
  "Uttarakhand",
  "Rajasthan",
  "Jammu & Kashmir",
  "Maharashtra",
  "Gujarat",
  "Madhya Pradesh",
  "Bihar",
  "Jharkhand",
  "West Bengal",
  "Karnataka",
  "Telangana",
  "Andhra Pradesh",
  "Tamil Nadu",
  "Kerala",
  "UK / Canada / USA",
  "Other",
];

const REFERRALS = [
  "YouTube",
  "Instagram",
  "Facebook",
  "Family / friends",
  "Mera Sai Music",
  "Attended a live show",
  "Other",
];

const STEPS = [
  { label: "Your details", icon: User },
  { label: "Event", icon: Music2 },
  { label: "Venue & notes", icon: MapPin },
];

const EMPTY = {
  name: "",
  phone: "",
  sameWhatsapp: true,
  whatsapp: "",
  email: "",
  eventType: "" as ShowEventType | "",
  subject: "",
  eventDate: "",
  startTime: "",
  durationHours: 2,
  alternateDate: "",
  language: "either" as ShowLanguage,
  expectedAudience: "" as AudienceSize | "",
  venueType: "" as VenueType | "",
  venueName: "",
  address: "",
  city: "",
  state: "Punjab",
  pincode: "",
  requirements: [] as ShowRequirement[],
  message: "",
  referralSource: "",
  website: "",
};
type FormState = typeof EMPTY;

const digits = (v: string) => v.replace(/\D/g, "");

/** Bring the top of the form back into view after the content swaps
 * (next step, or the success message), below the sticky header. */
function scrollToForm() {
  requestAnimationFrame(() => {
    const el = document.getElementById("booking-form");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    if (Math.abs(window.scrollY - top) > 40)
      window.scrollTo({ top, behavior: "smooth" });
  });
}

/** First problem with a step, or null when it's complete. */
function stepError(f: FormState, step: number): string | null {
  if (step === 0) {
    if (f.name.trim().length < 2) return "Please enter your name";
    if (digits(f.phone).length < 10)
      return "Please enter a valid mobile number";
    if (!f.sameWhatsapp && digits(f.whatsapp).length < 10)
      return "Please enter a valid WhatsApp number";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email))
      return "Please enter a valid email";
  }
  if (step === 1) {
    if (!f.eventType) return "Please choose the type of event";
    if (f.subject.trim().length < 3) return "Please add a short subject";
    if (!f.eventDate) return "Please pick the event date";
    if (f.eventDate < todayIst()) return "Event date can't be in the past";
    if (!f.startTime) return "Please pick a start time";
    if (f.alternateDate && f.alternateDate < todayIst())
      return "Alternate date can't be in the past";
  }
  if (step === 2) {
    if (!f.venueType) return "Please choose the venue type";
    if (f.address.trim().length < 3) return "Please enter the venue address";
    if (f.city.trim().length < 2) return "Please enter the city";
    if (!f.state) return "Please choose the state";
  }
  return null;
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition",
        active
          ? "border-primary bg-accent/60 text-night"
          : "border-border bg-white text-night/80 hover:border-primary/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StepTitle({
  n,
  title,
  hint,
}: {
  n: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-night font-display text-sm text-gold-light">
        {n}
      </span>
      <div>
        <h3 className="font-display text-xl text-night sm:text-2xl">{title}</h3>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * "Book a Show" request. On phones it's a 3-step wizard; from `lg` up all
 * three sections show at once. No amounts are shown anywhere: the team
 * calls back to plan the show.
 */
export function ShowBookingForm({
  className,
  initialEvent,
}: {
  className?: string;
  initialEvent?: ShowEventType;
}) {
  const { data: settings } = useSiteSettings();
  const [f, setF] = useState<FormState>({
    ...EMPTY,
    eventType: initialEvent ?? "",
  });
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const { data: avail } = useQuery({
    queryKey: ["public", "booking-availability", f.eventDate],
    queryFn: () =>
      call(
        api.public["booking-availability"].get({
          query: { date: f.eventDate },
        }),
      ),
    enabled:
      /^\d{4}-\d{2}-\d{2}$/.test(f.eventDate) && f.eventDate >= todayIst(),
    staleTime: 60_000,
  });

  const submit = useMutation({
    mutationFn: () =>
      call(
        api.public.bookings.post({
          name: f.name.trim(),
          phone: f.phone,
          whatsapp: f.sameWhatsapp ? f.phone : f.whatsapp,
          email: f.email || undefined,
          eventType: f.eventType as ShowEventType,
          subject: f.subject.trim(),
          eventDate: f.eventDate,
          startTime: f.startTime,
          durationHours: f.durationHours,
          alternateDate: f.alternateDate || undefined,
          language: f.language,
          expectedAudience: f.expectedAudience || undefined,
          venueType: f.venueType as VenueType,
          venueName: f.venueName || undefined,
          address: f.address.trim(),
          city: f.city.trim(),
          state: f.state,
          pincode: f.pincode || undefined,
          requirements: f.requirements,
          message: f.message || undefined,
          referralSource: f.referralSource || undefined,
          website: f.website || undefined,
        }),
      ),
    onSuccess: (res) => {
      setDone(res?.id ?? 0);
      scrollToForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const next = () => {
    const err = stepError(f, step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, 2));
    scrollToForm();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const i of [0, 1, 2]) {
      const err = stepError(f, i);
      if (err) {
        setStep(i);
        scrollToForm();
        toast.error(err);
        return;
      }
    }
    submit.mutate();
  };

  if (done !== null) {
    return (
      <div
        id="booking-form"
        className={cn(
          "rounded-3xl border bg-white p-6 text-center shadow-sm sm:p-12",
          className,
        )}
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-9" />
        </div>
        <p className="mt-5 font-gurmukhi text-sm text-primary">ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ</p>
        <h3 className="mt-2 font-display text-2xl text-night sm:text-3xl">
          Your request is received 🙏
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Thank you, {f.name.split(" ")[0]} ji. Your request
          {done ? ` #${done}` : ""} for{" "}
          <strong>{eventLabel(f.eventType)}</strong> on{" "}
          <strong>{formatDate(`${f.eventDate}T00:00:00+05:30`)}</strong> at{" "}
          <strong>{formatClock(f.startTime)}</strong> is with our team. We'll
          call or WhatsApp you within 24 hours to plan the show.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {settings?.whatsappNumber && (
            <Button
              asChild
              className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            >
              <a
                href={waLink(
                  settings.whatsappNumber,
                  `Sat Sri Akal 🙏 I just sent a show booking request (#${done}).`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp /> Message us on WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const section = (i: number) =>
    cn(
      "lg:block",
      step === i ? "block" : "hidden",
      i > 0 && "lg:mt-10 lg:border-t lg:pt-10",
    );

  return (
    <div
      id="booking-form"
      className={cn("grid gap-6 lg:grid-cols-[1fr_320px]", className)}
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="min-w-0 rounded-3xl border bg-white p-5 shadow-sm sm:p-8"
      >
        {/* mobile / tablet stepper */}
        <ol className="mb-8 grid grid-cols-3 gap-2 lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => (i < step ? setStep(i) : undefined)}
                className="flex w-full flex-col items-center gap-2 text-center"
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 text-sm transition",
                    i < step && "border-emerald-500 bg-emerald-500 text-white",
                    i === step && "border-primary bg-primary text-white",
                    i > step && "border-border text-muted-foreground",
                  )}
                >
                  {i < step ? (
                    <Check className="size-4" />
                  ) : (
                    <s.icon className="size-4" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium sm:text-xs",
                    i === step ? "text-night" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* 1 · Your details */}
        <div className={section(0)}>
          <StepTitle
            n={1}
            title="Your details"
            hint="So our team can reach you."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="kname" required>
              <Input
                id="kname"
                autoComplete="name"
                maxLength={120}
                value={f.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Mobile number" htmlFor="kphone" required>
              <Input
                id="kphone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                maxLength={16}
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <div className="space-y-3 sm:col-span-2">
              <label
                htmlFor="ksame"
                className="flex w-fit cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  id="ksame"
                  checked={f.sameWhatsapp}
                  onCheckedChange={(v) => set("sameWhatsapp", v === true)}
                />
                <FaWhatsapp className="text-[#25D366]" /> WhatsApp is on the
                same number
              </label>
              {!f.sameWhatsapp && (
                <Field label="WhatsApp number" htmlFor="kwa" required>
                  <Input
                    id="kwa"
                    type="tel"
                    inputMode="tel"
                    placeholder="98765 43210"
                    maxLength={16}
                    value={f.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </Field>
              )}
            </div>
            <Field label="Email" htmlFor="kemail" className="sm:col-span-2">
              <Input
                id="kemail"
                type="email"
                autoComplete="email"
                placeholder="Optional"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 2 · Event */}
        <div className={section(1)}>
          <StepTitle
            n={2}
            title="Event details"
            hint="What, when and for how long."
          />
          <Field label="Type of event" required>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {SHOW_EVENT_TYPES.map(([v, label]) => {
                const Icon = EVENT_ICONS[v];
                return (
                  <Chip
                    key={v}
                    active={f.eventType === v}
                    onClick={() => set("eventType", v)}
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span className="text-xs leading-tight sm:text-sm">
                      {label}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Subject"
              htmlFor="ksubject"
              required
              className="sm:col-span-2"
              hint="A short line, e.g. “Sufi night for our son’s wedding”."
            >
              <Input
                id="ksubject"
                maxLength={160}
                value={f.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </Field>
            <Field label="Preferred date" htmlFor="kdate" required>
              <Input
                id="kdate"
                type="date"
                min={todayIst()}
                value={f.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
              />
            </Field>
            <Field
              label="Start time"
              htmlFor="ktime"
              required
              hint="Mehfils usually start in the evening, around 7–9 PM."
            >
              <Input
                id="ktime"
                type="time"
                step={900}
                value={f.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </Field>
            {avail?.busy && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">
                <Info className="mt-0.5 size-4 shrink-0" />
                Sardar Ali already has a show on this day. Send your request
                anyway — we'll check timings and call you, or suggest an
                alternate date.
              </p>
            )}
            <Field label="Approx. duration" htmlFor="kdur">
              <NativeSelect
                id="kdur"
                className="h-9 w-full"
                value={f.durationHours}
                onChange={(e) => set("durationHours", Number(e.target.value))}
              >
                {SHOW_DURATIONS.map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h > 1 ? "s" : ""}
                    {h === 6 ? " (half day)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="Alternate date"
              htmlFor="kalt"
              hint="Optional, in case the first date is taken."
            >
              <Input
                id="kalt"
                type="date"
                min={todayIst()}
                value={f.alternateDate}
                onChange={(e) => set("alternateDate", e.target.value)}
              />
            </Field>
            <Field label="Preferred language">
              <div className="flex gap-2">
                {SHOW_LANGUAGES.map(([v, label]) => (
                  <Chip
                    key={v}
                    active={f.language === v}
                    onClick={() => set("language", v)}
                    className="flex-1 justify-center px-2"
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </Field>
            {/* <Field label="Expected audience">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AUDIENCE_SIZES.map(([v, label]) => (
                  <Chip
                    key={v}
                    active={f.expectedAudience === v}
                    onClick={() =>
                      set("expectedAudience", f.expectedAudience === v ? "" : v)
                    }
                    className="justify-center px-2 text-xs sm:text-sm"
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </Field> */}
          </div>
        </div>

        {/* 3 · Venue & notes */}
        <div className={section(2)}>
          <StepTitle
            n={3}
            title="Venue & notes"
            hint="Where the show will be held."
          />
          <Field label="Venue type" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {VENUE_TYPES.map(([v, label]) => {
                const Icon = VENUE_ICONS[v];
                return (
                  <Chip
                    key={v}
                    active={f.venueType === v}
                    onClick={() => set("venueType", v)}
                    className="flex-col justify-center gap-1 px-2 text-center text-xs sm:text-sm"
                  >
                    <Icon className="size-5 text-primary" />
                    {label}
                  </Chip>
                );
              })}
            </div>
          </Field>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Venue name"
              htmlFor="kvenue"
              className="sm:col-span-2"
            >
              <Input
                id="kvenue"
                placeholder="e.g. Royal Palace, Jalandhar"
                maxLength={160}
                value={f.venueName}
                onChange={(e) => set("venueName", e.target.value)}
              />
            </Field>
            <Field
              label="Address"
              htmlFor="kaddr"
              required
              className="sm:col-span-2"
            >
              <Textarea
                id="kaddr"
                rows={2}
                autoComplete="street-address"
                maxLength={400}
                value={f.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="City" htmlFor="kcity" required>
              <Input
                id="kcity"
                autoComplete="address-level2"
                maxLength={80}
                value={f.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Field label="State" htmlFor="kstate" required>
                <NativeSelect
                  id="kstate"
                  className="w-full"
                  value={f.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  {STATES.map((st) => (
                    <option key={st}>{st}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Pincode" htmlFor="kpin">
                <Input
                  id="kpin"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={f.pincode}
                  onChange={(e) => set("pincode", digits(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Arrangements" className="sm:col-span-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {SHOW_REQUIREMENTS.map(([v, label]) => (
                  <label
                    key={v}
                    htmlFor={`kreq-${v}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40"
                  >
                    <Checkbox
                      id={`kreq-${v}`}
                      checked={f.requirements.includes(v)}
                      onCheckedChange={(c) =>
                        set(
                          "requirements",
                          c
                            ? [...f.requirements, v]
                            : f.requirements.filter((x) => x !== v),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
            <Field
              label="Message / special requests"
              htmlFor="kmsg"
              className="sm:col-span-2"
            >
              <Textarea
                id="kmsg"
                rows={3}
                maxLength={2000}
                placeholder="Songs you'd love to hear, occasion, anything we should know…"
                value={f.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </Field>
            <Field label="How did you hear about us?" htmlFor="kref">
              <NativeSelect
                id="kref"
                className="w-full"
                value={f.referralSource}
                onChange={(e) => set("referralSource", e.target.value)}
              >
                <option value="">Select (optional)</option>
                {REFERRALS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </div>

        {/* honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={f.website}
          onChange={(e) => set("website", e.target.value)}
        />

        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            className={cn("lg:hidden", step === 0 && "invisible")}
            onClick={() => {
              setStep((s) => Math.max(s - 1, 0));
              scrollToForm();
            }}
          >
            <ArrowLeft /> Back
          </Button>
          <p className="hidden text-sm text-muted-foreground lg:block">
            <span className="text-primary">*</span> Required fields
          </p>
          {step < 2 && (
            <Button
              type="button"
              className="rounded-full px-6 lg:hidden"
              onClick={next}
            >
              Continue <ArrowRight />
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            className={cn(
              "rounded-full bg-gradient-to-r from-gold to-maroon px-6 font-semibold text-white hover:opacity-90",
              step < 2 && "hidden lg:inline-flex",
            )}
            disabled={submit.isPending}
          >
            {submit.isPending ? <Spinner /> : <HandHeart />} Send booking
            request
          </Button>
        </div>
      </form>

      {/* side panel */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl bg-night p-6 text-ivory">
          <p className="font-brand text-xs tracking-[0.25em] text-gold-light">
            YOUR REQUEST
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ivory/50">Event</dt>
              <dd className="font-medium">
                {f.eventType ? eventLabel(f.eventType) : "Not selected"}
              </dd>
            </div>
            {f.eventDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>
                  {formatDate(`${f.eventDate}T00:00:00+05:30`)}
                  {f.startTime && `, ${formatClock(f.startTime)}`} ·{" "}
                  {f.durationHours}h
                </span>
              </div>
            )}
            {f.city && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>
                  {[f.venueName, f.city, f.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </dl>
        </div>
        <div className="rounded-3xl border bg-white p-6 text-sm">
          <p className="font-semibold text-night">What happens next?</p>
          <ul className="mt-3 space-y-3 text-muted-foreground">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              Our team calls or WhatsApps you within 24 hours.
            </li>
            <li className="flex gap-2.5">
              <Drum className="mt-0.5 size-4 shrink-0 text-primary" />
              We plan the songs, timings and arrangements together.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              The show is confirmed and the team arrives on time.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
