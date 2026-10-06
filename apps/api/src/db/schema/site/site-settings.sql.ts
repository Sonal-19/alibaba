import { pgTable } from "drizzle-orm/pg-core";

export const galleryIcons = [
  "mic",
  "harmonium",
  "tabla",
  "dargah",
  "crowd",
  "diya",
] as const;
export type GalleryIcon = (typeof galleryIcons)[number];

/** One photo card in the landing page's "Mehfil moments" gallery. */
export type GalleryItem = {
  imagePath: string;
  title: string;
  description: string;
  icon: GalleryIcon;
};

export type SiteStats = {
  followers: string;
  views: string;
  years: string;
  albums: string;
};

/** Where the floating "Book a Show" button sends visitors. Only WhatsApp for
 * now; new channels (email, call…) get added here and in the web renderer. */
export const bookingButtonChannels = ["whatsapp"] as const;
export type BookingButtonChannel = (typeof bookingButtonChannels)[number];

export const bookingButtonRotations = ["first", "random"] as const;
export type BookingButtonRotation = (typeof bookingButtonRotations)[number];

export type BookingButtonNumber = {
  /** Digits with country code, e.g. 919876543210. */
  number: string;
  /** Admin-only note, e.g. "Manager - Amrik". */
  label: string;
  active: boolean;
};

/** Floating "Book a Show" button on the landing page. */
export type BookingButtonSettings = {
  enabled: boolean;
  channel: BookingButtonChannel;
  label: string;
  /** Pre-filled message the visitor only has to send. */
  message: string;
  /** With several active numbers: always the first, or a random one per visit. */
  rotation: BookingButtonRotation;
  /** Empty → falls back to the main WhatsApp number. */
  numbers: BookingButtonNumber[];
};

export const bookingButtonDefaults: BookingButtonSettings = {
  enabled: true,
  channel: "whatsapp",
  label: "Book a Show",
  message: "Sat Sri Akal 🙏 I want to book a show.",
  rotation: "first",
  numbers: [],
};

/** Single-row table (id = 1) holding everything the public site renders
 * that the admin can edit without a deploy. */
export const siteSettingsTable = pgTable("site_settings", (pg) => ({
  id: pg.integer().primaryKey().default(1),
  artistName: pg.text("artist_name").notNull(),
  tagline: pg.text().notNull(),
  bio: pg.text().notNull(),
  heroImagePath: pg.text("hero_image_path"),
  aboutImagePath: pg.text("about_image_path"),
  /** Live performance photos shown on the landing page, in display order. */
  gallery: pg.jsonb("gallery").$type<GalleryItem[]>().notNull().default([]),
  /** YouTube track the hero's music card plays (any YouTube / YT Music URL). */
  heroTrackUrl: pg.text("hero_track_url"),
  heroTrackTitle: pg.text("hero_track_title"),
  /** Small line under the title, e.g. "66 Lakh+ views". */
  heroTrackSubtitle: pg.text("hero_track_subtitle"),
  /** Intro paragraph of the landing page's Book a Show section. */
  bookingIntro: pg.text("booking_intro").notNull(),
  /** Management office address shown in contact and footer. */
  address: pg.text().notNull(),
  mapEmbedUrl: pg.text("map_embed_url"),
  phone: pg.text().notNull(),
  whatsappNumber: pg.text("whatsapp_number").notNull(),
  email: pg.text().notNull(),
  facebookUrl: pg.text("facebook_url"),
  instagramUrl: pg.text("instagram_url"),
  youtubeUrl: pg.text("youtube_url"),
  xUrl: pg.text("x_url"),
  spotifyUrl: pg.text("spotify_url"),
  appleMusicUrl: pg.text("apple_music_url"),
  whatsappChannelUrl: pg.text("whatsapp_channel_url"),
  stats: pg.jsonb().$type<SiteStats>().notNull(),
  bookingButton: pg
    .jsonb("booking_button")
    .$type<BookingButtonSettings>()
    .notNull()
    .default(bookingButtonDefaults),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectSiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;
