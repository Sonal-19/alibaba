import type { InsertRelease } from "$/db/schema";

const YTM = "https://music.youtube.com/channel/UCBUseBr-WbaSJjZJbEW4Qug";
const SPOTIFY = "https://open.spotify.com/artist/5Nk5xxiNuhvB1HoGfbFlu2";
const APPLE = "https://music.apple.com/in/artist/sardar-ali/253327936";
const yt = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`Sardar Ali ${q}`)}`;

const SONGS: [title: string, subtitle: string, caption: string][] = [
  [
    "Nachde Malang",
    "Sufi · Mera Sai Music",
    "The malangs dance for their Murshid: a mehfil favourite.",
  ],
  [
    "Maa Meri",
    "Punjabi · Devotional",
    "A tribute to a mother's love and prayers.",
  ],
  ["Kulli Da Chirag", "Sufi Kalam", "A lamp lit in the hut of the faqir."],
  [
    "Deed Maula Mereya",
    "Sufi Kalam",
    "A longing for one glimpse of the Maula.",
  ],
  [
    "Akhiyan Pyasiyan",
    "Sufi · Mera Sai Music",
    "Eyes that thirst for the beloved.",
  ],
  [
    "Khota Sikka",
    "Punjabi · Sufi",
    "Even the counterfeit coin is accepted at the Pir's door.",
  ],
  [
    "Sangat Muradan Paundi E",
    "Devotional · Live",
    "The sangat whose wishes are fulfilled at the darbar.",
  ],
];

/** Starter releases; the admin swaps posters and exact links under Releases. */
export const releaseSeed: InsertRelease[] = SONGS.map(
  ([title, subtitle, caption], i) => ({
    title,
    subtitle,
    caption,
    posterPath: `/uploads/releases/release-${i + 1}.svg`,
    aspect: "square" as const,
    links: [
      { platform: "youtube" as const, url: yt(title) },
      { platform: "youtube_music" as const, url: YTM },
      { platform: "spotify" as const, url: SPOTIFY },
      { platform: "apple_music" as const, url: APPLE },
    ],
    releaseDate: null,
    sortOrder: i,
  }),
);
