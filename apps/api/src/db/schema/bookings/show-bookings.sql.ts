import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { leadsTable } from "../crm/leads.sql";

export const showEventTypes = [
  "sufi_mehfil",
  "wedding",
  "live_concert",
  "dargah_mela",
  "jagran_urs",
  "private_party",
  "corporate_event",
  "college_fest",
  "religious_gathering",
  "international_tour",
  "other",
] as const;
export type ShowEventType = (typeof showEventTypes)[number];
export const showEventTypeEnum = pgEnum("show_event_type", showEventTypes);

export const venueTypes = [
  "dargah_shrine",
  "banquet_hall",
  "open_ground",
  "home",
  "auditorium",
  "other",
] as const;
export type VenueType = (typeof venueTypes)[number];
export const venueTypeEnum = pgEnum("venue_type", venueTypes);

export const audienceSizes = [
  "under_100",
  "100_500",
  "500_2000",
  "2000_plus",
] as const;
export type AudienceSize = (typeof audienceSizes)[number];
export const audienceSizeEnum = pgEnum("audience_size", audienceSizes);

export const showLanguages = ["punjabi", "hindi", "urdu", "either"] as const;
export type ShowLanguage = (typeof showLanguages)[number];
export const showLanguageEnum = pgEnum("show_language", showLanguages);

export const showRequirements = [
  "sound_available",
  "need_sound_light",
  "stage_setup",
  "live_stream",
  "full_band",
] as const;
export type ShowRequirement = (typeof showRequirements)[number];

export const showBookingStatuses = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;
export type ShowBookingStatus = (typeof showBookingStatuses)[number];
export const showBookingStatusEnum = pgEnum(
  "show_booking_status",
  showBookingStatuses,
);

/** A "Book a Show" request from the public site. The admin calls the
 * host / organiser, then confirms and schedules the performance. */
export const showBookingsTable = pgTable("show_bookings", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .references(() => leadsTable.id, { onDelete: "set null" }),
  // who
  name: pg.text().notNull(),
  phone: pg.text().notNull(),
  whatsapp: pg.text(),
  email: pg.text(),
  // what
  eventType: showEventTypeEnum("event_type").notNull(),
  subject: pg.text().notNull(),
  language: showLanguageEnum().notNull().default("either"),
  expectedAudience: audienceSizeEnum("expected_audience"),
  requirements: pg.text().array().notNull().default([]),
  message: pg.text(),
  referralSource: pg.text("referral_source"),
  // when
  eventDate: pg.date("event_date", { mode: "string" }).notNull(),
  startTime: pg.text("start_time").notNull(),
  durationHours: pg.smallint("duration_hours").notNull().default(2),
  alternateDate: pg.date("alternate_date", { mode: "string" }),
  scheduledStart: pg.timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: pg.timestamp("scheduled_end", { withTimezone: true }),
  // where
  venueType: venueTypeEnum("venue_type").notNull().default("banquet_hall"),
  venueName: pg.text("venue_name"),
  address: pg.text().notNull(),
  city: pg.text().notNull(),
  state: pg.text().notNull(),
  pincode: pg.text(),
  status: showBookingStatusEnum().notNull().default("new"),
  adminRemark: pg.text("admin_remark"),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectShowBooking = typeof showBookingsTable.$inferSelect;
export type InsertShowBooking = typeof showBookingsTable.$inferInsert;
