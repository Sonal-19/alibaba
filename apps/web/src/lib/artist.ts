/** Fixed artist facts that aren't (yet) editable in Admin → Settings. */

export const ALT_BOOKING_PHONE = "+91 98176 01919";

export const TEAM_HANDLES = [
  {
    handle: "@sardaralisocial",
    role: "Official",
    url: "https://www.instagram.com/sardaralisocial/",
  },
  {
    handle: "@harpinder_malhi",
    role: "Management",
    url: "https://www.instagram.com/harpinder_malhi/",
  },
  {
    handle: "@sardar_ali_band",
    role: "Band",
    url: "https://www.instagram.com/sardar_ali_band/",
  },
] as const;

export const YOUTUBE_MUSIC_URL =
  "https://music.youtube.com/channel/UCBUseBr-WbaSJjZJbEW4Qug";

/** Songs the sangat asks for most; used for the hero's "Ruhani hits" list. */
export const SIGNATURE_SONGS = [
  "Nachde Malang",
  "Maa Meri",
  "Kulli Da Chirag",
  "Deed Maula Mereya",
  "Akhiyan Pyasiyan",
  "Khota Sikka",
  "Sangat Muradan Paundi E",
] as const;

/** Dargahs and darbars where Sardar Ali regularly performs. */
export const DARBARS = [
  {
    name: "Dera Baba Murad Shah Ji",
    place: "Nakodar, Punjab",
    note: "Annual mela and Thursday mehfils",
  },
  {
    name: "Darbar Baba Rehmat Shah Qadri Ji",
    place: "Punjab",
    note: "Urs celebrations and Sufi nights",
  },
  {
    name: "Punjab's Sufi Melas",
    place: "Jalandhar · Kapurthala · Hoshiarpur",
    note: "Open-air melas with thousands of devotees",
  },
  {
    name: "International Stages",
    place: "UK · Canada · USA",
    note: "Concert tours for the Punjabi diaspora",
  },
] as const;
