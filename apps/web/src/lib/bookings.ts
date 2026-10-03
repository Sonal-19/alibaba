/** Labels for the Book a Show form and the admin Show Bookings page.
 * Values mirror the enums in apps/api/src/db/schema/bookings/. */

export const SHOW_EVENT_TYPES = [
  ["sufi_mehfil", "Sufi Mehfil / Qawwali Night"],
  ["wedding", "Wedding / Sangeet"],
  ["live_concert", "Live Concert"],
  ["dargah_mela", "Dargah Mela"],
  ["jagran_urs", "Urs / Jagran"],
  ["private_party", "Private Party / Birthday"],
  ["corporate_event", "Corporate Event"],
  ["college_fest", "College Fest"],
  ["religious_gathering", "Religious Gathering / Satsang"],
  ["international_tour", "International Show (UK / Canada / USA)"],
  ["other", "Other Event"],
] as const;
export type ShowEventType = (typeof SHOW_EVENT_TYPES)[number][0];

export const VENUE_TYPES = [
  ["dargah_shrine", "Dargah / Darbar"],
  ["banquet_hall", "Banquet / Marriage Palace"],
  ["open_ground", "Open Ground / Pandal"],
  ["home", "Home / Farmhouse"],
  ["auditorium", "Auditorium / Stadium"],
  ["other", "Other"],
] as const;
export type VenueType = (typeof VENUE_TYPES)[number][0];

export const AUDIENCE_SIZES = [
  ["under_100", "Under 100"],
  ["100_500", "100 – 500"],
  ["500_2000", "500 – 2,000"],
  ["2000_plus", "2,000+"],
] as const;
export type AudienceSize = (typeof AUDIENCE_SIZES)[number][0];

export const SHOW_LANGUAGES = [
  ["either", "Any"],
  ["punjabi", "Punjabi"],
  ["hindi", "Hindi"],
  ["urdu", "Urdu / Sufi Kalam"],
] as const;
export type ShowLanguage = (typeof SHOW_LANGUAGES)[number][0];

export const SHOW_REQUIREMENTS = [
  ["sound_available", "We have sound & lights"],
  ["need_sound_light", "Team to bring sound & lights"],
  ["stage_setup", "Stage setup required"],
  ["live_stream", "Live stream / recording"],
  ["full_band", "Full band (dhol, tabla, harmonium)"],
] as const;
export type ShowRequirement = (typeof SHOW_REQUIREMENTS)[number][0];

export const SHOW_DURATIONS = [1, 2, 3, 4, 6] as const;

export const SHOW_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;
export type ShowStatus = (typeof SHOW_STATUSES)[number];

const toMap = (list: readonly (readonly [string, string])[]) =>
  Object.fromEntries(list) as Record<string, string>;
const EVENT_LABEL = toMap(SHOW_EVENT_TYPES);
const VENUE_LABEL = toMap(VENUE_TYPES);
const AUDIENCE_LABEL = toMap(AUDIENCE_SIZES);
const LANGUAGE_LABEL = toMap(SHOW_LANGUAGES);
const REQUIREMENT_LABEL = toMap(SHOW_REQUIREMENTS);

export const eventLabel = (v: string) => EVENT_LABEL[v] ?? v;
export const venueLabel = (v: string) => VENUE_LABEL[v] ?? v;
export const audienceLabel = (v?: string | null) =>
  v ? (AUDIENCE_LABEL[v] ?? v) : "";
export const languageLabel = (v: string) => LANGUAGE_LABEL[v] ?? v;
export const requirementLabel = (v: string) => REQUIREMENT_LABEL[v] ?? v;
