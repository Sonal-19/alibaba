import type { InsertSiteSettings } from "$/db/schema";

export const siteSettingsSeed: InsertSiteSettings = {
  id: 1,
  artistName: "Sardar Ali",
  tagline: "Punjabi Folk · Sufi Kalam · Live Mehfils",
  bio: [
    "**Sardar Ali** is a Punjabi and Sufi singer known for devotional and traditional tracks like *Nachde Malang* and *Maa Meri*. His music moves between Punjabi folk and Sufi kalam, and he is loved for vibrant live performances at shrines and melas across Punjab.",
    "",
    "Many of his songs are released through **Mera Sai Music**, including *Kulli Da Chirag*, *Deed Maula Mereya*, *Akhiyan Pyasiyan*, *Khota Sikka* and *Sangat Muradan Paundi E*.",
    "",
    "He performs regularly at prominent spiritual gatherings, including **Dera Baba Murad Shah Ji (Nakodar)** and **Darbar Baba Rehmat Shah Qadri Ji**, as well as local melas, private mehfils, weddings and concerts in India and abroad.",
  ].join("\n"),
  heroImagePath: "/uploads/brand/hero-portrait.svg",
  aboutImagePath: "/uploads/brand/about-placeholder.svg",
  gallery: [
    {
      imagePath: "/uploads/gallery/mehfil-1.svg",
      title: "Live Sufi mehfil",
      description: "Kalam, chorus and dhamaal late into the night.",
      icon: "mic",
    },
    {
      imagePath: "/uploads/gallery/mehfil-2.svg",
      title: "At the darbar",
      description: "Devotional sets at dargahs and deras across Punjab.",
      icon: "dargah",
    },
    {
      imagePath: "/uploads/gallery/mehfil-3.svg",
      title: "The band",
      description: "Harmonium, tabla and dhol: the Sardar Ali band on stage.",
      icon: "tabla",
    },
    {
      imagePath: "/uploads/gallery/mehfil-4.svg",
      title: "Mela crowds",
      description: "Open-air melas where thousands sing along.",
      icon: "crowd",
    },
  ],
  // Set a real YouTube link in Admin → Settings → Hero music.
  heroTrackUrl: null,
  heroTrackTitle: "Nachde Malang",
  heroTrackSubtitle: "Sufi kalam",
  bookingIntro:
    "Book Sardar Ali and his band for Sufi nights, weddings, melas, urs, private mehfils and live concerts, in India and abroad. Share your event details and the management team will call you to plan the show.",
  address: "Jalandhar, Punjab, India",
  mapEmbedUrl: "https://www.google.com/maps?q=Nakodar+Punjab&output=embed",
  phone: "+91 93568 94568",
  whatsappNumber: "919356894568",
  email: "sardaralisinger@gmail.com",
  facebookUrl: "https://www.facebook.com/SardarAliMusic",
  instagramUrl: "https://www.instagram.com/sardaralisocial/",
  youtubeUrl: "https://www.youtube.com/channel/UCAD9fcjd-_ZGCpFkw17XXLg",
  xUrl: null,
  spotifyUrl: "https://open.spotify.com/artist/5Nk5xxiNuhvB1HoGfbFlu2",
  appleMusicUrl: "https://music.apple.com/in/artist/sardar-ali/253327936",
  whatsappChannelUrl: null,
  // Placeholder figures: update them in Admin → Settings.
  stats: {
    followers: "1M+",
    views: "100M+",
    years: "20+",
    albums: "100+",
  },
};
