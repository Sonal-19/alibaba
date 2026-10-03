import type { SocialPlatform } from "$/db/schema";
import type { SocialPostInput } from "$/lib/services/social/social-provider";

const ytSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`Sardar Ali ${q}`)}`;

/**
 * Dummy feed used by MockSocialProvider until the Facebook / Instagram /
 * YouTube APIs are connected. YouTube titles are real songs; links go to a
 * YouTube search because we don't store the real video ids yet.
 */
export const socialSeedData: (SocialPostInput & {
  platform: SocialPlatform;
})[] = [
  // YouTube
  ...[
    "Nachde Malang",
    "Maa Meri",
    "Kulli Da Chirag",
    "Deed Maula Mereya",
    "Akhiyan Pyasiyan",
    "Khota Sikka",
  ].map((song, i) => ({
    platform: "youtube" as const,
    externalId: `yt-${song.toLowerCase().replace(/\s+/g, "-")}`,
    caption: `Sardar Ali – ${song}`,
    mediaType: "video" as const,
    mediaUrl: null,
    thumbnailUrl: `/uploads/social/yt-${i + 1}.svg`,
    permalink: ytSearch(song),
    publishedAt: new Date(Date.now() - (i + 1) * 30 * 86_400_000),
    stats: {},
  })),
  // Facebook
  ...[
    "Sat Sri Akal ji 🙏 Tonight's Sufi mehfil starts at 8 PM. Everyone is welcome.",
    "Bookings for the wedding season are open. Use the Book a Show form on our website 🙏",
    "Thank you for all the love on Nachde Malang ❤️",
    "Behind the scenes from the latest shoot with the band 🎥",
    "Mela dates for this month are up on Instagram.",
    "Rehearsal day: harmonium, tabla and dhol ready 🥁",
  ].map((caption, i) => ({
    platform: "facebook" as const,
    externalId: `fb-demo-${i + 1}`,
    caption,
    mediaType: "image" as const,
    mediaUrl: `/uploads/social/fb-${i + 1}.svg`,
    thumbnailUrl: `/uploads/social/fb-${i + 1}.svg`,
    permalink: "https://www.facebook.com/SardarAliMusic",
    publishedAt: new Date(Date.now() - (i + 1) * 9 * 86_400_000),
    stats: {},
  })),
  // Instagram
  ...[
    "Nachde Malang 💫 #sufi #sardarali",
    "Darbar di raunak 🙏",
    "Mela nights in Punjab ✨",
    "Kalam, chorus and dhamaal 🥁",
    "New song coming soon… stay tuned",
    "On stage with the band 🎶",
  ].map((caption, i) => ({
    platform: "instagram" as const,
    externalId: `ig-demo-${i + 1}`,
    caption,
    mediaType: "image" as const,
    mediaUrl: `/uploads/social/ig-${i + 1}.svg`,
    thumbnailUrl: `/uploads/social/ig-${i + 1}.svg`,
    permalink: "https://www.instagram.com/sardaralisocial/",
    publishedAt: new Date(Date.now() - (i + 1) * 6 * 86_400_000),
    stats: {},
  })),
];
