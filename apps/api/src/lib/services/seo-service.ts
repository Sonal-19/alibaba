import { and, desc, eq } from "drizzle-orm";
import { db } from "$/db";
import {
  blogPostsTable,
  type SelectSiteSettings,
  siteSettingsTable,
} from "$/db/schema";
import { FRONTEND_DIR, PUBLIC_SITE_URL } from "$/env";

/**
 * Server-side SEO for the SPA: nginx sends every page request (not assets) to
 * `/_page/*`, and we return the built index.html with that page's title,
 * description, canonical, Open Graph tags, JSON-LD and a crawlable text
 * fallback inside #app (React clears it on mount).
 */

const SITE = PUBLIC_SITE_URL.replace(/\/$/, "");
const OG_IMAGE = `${SITE}/og-image.jpg`;

/** Search terms people use for the artist; fed to titles, schema and keywords. */
const NAME_VARIANTS = [
  "Sardar Ali",
  "The Sardar Ali",
  "Sardar Ali Singer",
  "Sardar Ali Sufi Singer",
  "Sardar Ali Official",
  "ਸਰਦਾਰ ਅਲੀ",
  "سردار علی",
];

const KEYWORDS = [
  "Sardar Ali",
  "The Sardar Ali",
  "thesardarali",
  "Sardar Ali singer",
  "Sardar Ali Sufi singer",
  "Sardar Ali Punjabi singer",
  "Sardar Ali songs",
  "Sardar Ali live",
  "Sardar Ali booking",
  "Sardar Ali official website",
  "Sardar Ali Nakodar",
  "Sardar Ali Nachde Malang",
  "Sardar Ali Maa Meri",
  "Sufi kalam",
  "Punjabi Sufi singer",
  "book Sufi singer",
].join(", ");

const SIGNATURE_SONGS = [
  "Nachde Malang",
  "Maa Meri",
  "Kulli Da Chirag",
  "Deed Maula Mereya",
  "Akhiyan Pyasiyan",
  "Khota Sikka",
];

type PageMeta = {
  status: number;
  title: string;
  description: string;
  /** Path only, e.g. "/book". Null for pages that shouldn't be indexed. */
  path: string | null;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: object[];
  /** Plain HTML for crawlers inside #app; React replaces it on mount. */
  body?: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Markdown → plain text, good enough for descriptions and crawler fallback. */
const plain = (md: string) =>
  md
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[*_`>#~]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const clip = (s: string, n = 158) =>
  s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;

const abs = (p: string | null | undefined) =>
  !p ? OG_IMAGE : p.startsWith("http") ? p : `${SITE}${p}`;

// ---- cached inputs ---------------------------------------------------------

let template: { html: string; mtime: number } | null = null;

async function indexHtml(): Promise<string | null> {
  const file = Bun.file(`${FRONTEND_DIR}/index.html`);
  if (!(await file.exists())) return null;
  if (!template || template.mtime !== file.lastModified) {
    template = { html: await file.text(), mtime: file.lastModified };
  }
  return template.html;
}

let settingsCache: { at: number; row: SelectSiteSettings | null } | null = null;

async function settings() {
  if (settingsCache && Date.now() - settingsCache.at < 60_000) {
    return settingsCache.row;
  }
  const [row] = await db.select().from(siteSettingsTable).limit(1);
  settingsCache = { at: Date.now(), row: row ?? null };
  return settingsCache.row;
}

async function publishedPosts(limit = 500) {
  return db
    .select({
      slug: blogPostsTable.slug,
      title: blogPostsTable.title,
      excerpt: blogPostsTable.excerpt,
      publishedAt: blogPostsTable.publishedAt,
      updatedAt: blogPostsTable.updatedAt,
    })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "published"))
    .orderBy(desc(blogPostsTable.publishedAt))
    .limit(limit);
}

// ---- structured data -------------------------------------------------------

function personLd(s: SelectSiteSettings | null) {
  const sameAs = [
    s?.youtubeUrl,
    s?.instagramUrl,
    s?.facebookUrl,
    s?.spotifyUrl,
    s?.appleMusicUrl,
    s?.xUrl,
    "https://music.youtube.com/channel/UCBUseBr-WbaSJjZJbEW4Qug",
  ].filter(Boolean);
  return {
    "@type": "Person",
    "@id": `${SITE}/#sardar-ali`,
    name: "Sardar Ali",
    alternateName: NAME_VARIANTS.slice(1),
    url: `${SITE}/`,
    image: abs(s?.aboutImagePath ?? s?.heroImagePath),
    description: clip(plain(s?.bio ?? ""), 300) || undefined,
    jobTitle: "Punjabi & Sufi Singer",
    nationality: { "@type": "Country", name: "India" },
    homeLocation: {
      "@type": "Place",
      name: s?.address || "Jalandhar, Punjab, India",
    },
    knowsAbout: ["Sufi kalam", "Punjabi folk music", "Qawwali", "Live mehfils"],
    email: s?.email ? `mailto:${s.email}` : undefined,
    telephone: s?.phone || undefined,
    sameAs,
  };
}

function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: `${SITE}/`,
    name: "Sardar Ali",
    alternateName: [
      "The Sardar Ali",
      "thesardarali.com",
      "Sardar Ali Official",
    ],
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE}/#sardar-ali` },
    about: { "@id": `${SITE}/#sardar-ali` },
  };
}

function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.path}`,
    })),
  };
}

// ---- pages -----------------------------------------------------------------

const nav = `<nav><a href="/">Sardar Ali</a> · <a href="/book">Book a Show</a> · <a href="/blog">Blog</a></nav>`;

async function homePage(): Promise<PageMeta> {
  const s = await settings();
  const posts = await publishedPosts(6);
  const bio = plain(s?.bio ?? "");
  return {
    status: 200,
    path: "/",
    title:
      "Sardar Ali | Official Website of The Sardar Ali · Punjabi & Sufi Singer",
    description:
      "Sardar Ali (The Sardar Ali) official website: Punjabi folk and Sufi singer of Nachde Malang, Maa Meri and Kulli Da Chirag. Latest songs, live mehfils and show bookings.",
    jsonLd: [websiteLd(), personLd(s)],
    body: `${nav}
<h1>Sardar Ali: Official Website</h1>
<p>${esc(s?.tagline ?? "Punjabi Folk · Sufi Kalam · Live Mehfils")}</p>
<p>${esc(bio)}</p>
<h2>Popular songs by Sardar Ali</h2>
<ul>${SIGNATURE_SONGS.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<h2>Book Sardar Ali for a show</h2>
<p>${esc(plain(s?.bookingIntro ?? ""))} <a href="/book">Send a booking request</a>.</p>
${
  posts.length
    ? `<h2>From the blog</h2><ul>${posts.map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></li>`).join("")}</ul>`
    : ""
}`,
  };
}

async function bookPage(): Promise<PageMeta> {
  const s = await settings();
  return {
    status: 200,
    path: "/book",
    title: "Book Sardar Ali Live | Sufi Nights, Weddings & Concerts",
    description:
      "Book Sardar Ali and his band for Sufi nights, weddings, melas, urs, private mehfils and concerts in India and abroad. Share your event details and the team will call you.",
    jsonLd: [
      websiteLd(),
      personLd(s),
      breadcrumbLd([
        { name: "Sardar Ali", path: "/" },
        { name: "Book a Show", path: "/book" },
      ]),
    ],
    body: `${nav}<h1>Book Sardar Ali for a live show</h1><p>${esc(plain(s?.bookingIntro ?? ""))}</p>${
      s?.phone ? `<p>Call ${esc(s.phone)}</p>` : ""
    }`,
  };
}

async function blogIndexPage(): Promise<PageMeta> {
  const posts = await publishedPosts(50);
  return {
    status: 200,
    path: "/blog",
    title: "Sardar Ali Blog | Sufi Kalam, Mehfils & Stories",
    description:
      "Stories, Sufi kalam guides and news from Sardar Ali: mehfils, melas, darbars and the music behind the songs.",
    jsonLd: [
      websiteLd(),
      breadcrumbLd([
        { name: "Sardar Ali", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
    body: `${nav}<h1>Sardar Ali Blog</h1><ul>${posts
      .map(
        (p) =>
          `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a><p>${esc(p.excerpt)}</p></li>`,
      )
      .join("")}</ul>`,
  };
}

async function blogPostPage(slug: string): Promise<PageMeta> {
  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(
      and(
        eq(blogPostsTable.slug, slug),
        eq(blogPostsTable.status, "published"),
      ),
    )
    .limit(1);
  if (!post) return notFound();
  const path = `/blog/${post.slug}`;
  const description = clip(
    plain(post.seoDescription || post.excerpt || post.body),
  );
  const image = abs(post.coverImagePath);
  return {
    status: 200,
    path,
    type: "article",
    image,
    title: `${post.seoTitle || post.title} | Sardar Ali`,
    description,
    jsonLd: [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image,
        url: `${SITE}${path}`,
        mainEntityOfPage: `${SITE}${path}`,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        keywords: post.tags.join(", ") || undefined,
        author: { "@id": `${SITE}/#sardar-ali`, name: "Sardar Ali" },
        publisher: { "@id": `${SITE}/#sardar-ali`, name: "Sardar Ali" },
      },
      breadcrumbLd([
        { name: "Sardar Ali", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path },
      ]),
    ],
    body: `${nav}<article><h1>${esc(post.title)}</h1>${plain(post.body)
      .split(/\n{2,}/)
      .map((para) => `<p>${esc(para)}</p>`)
      .join("")}</article>`,
  };
}

const adminPage = (): PageMeta => ({
  status: 200,
  path: null,
  noindex: true,
  title: "Admin · Sardar Ali",
  description: "Sardar Ali admin portal.",
});

const notFound = (): PageMeta => ({
  status: 404,
  path: null,
  noindex: true,
  title: "Page not found · Sardar Ali",
  description: "This page could not be found.",
  body: `${nav}<h1>Page not found</h1>`,
});

async function metaFor(rawPath: string): Promise<PageMeta> {
  const path = `/${rawPath.replace(/^\/+|\/+$/g, "")}`;
  if (path === "/") return homePage();
  if (path === "/book") return bookPage();
  if (path === "/blog") return blogIndexPage();
  const post = path.match(/^\/blog\/([^/]+)$/);
  if (post?.[1]) return blogPostPage(decodeURIComponent(post[1]));
  if (path === "/admin-login" || path.startsWith("/admin")) return adminPage();
  return notFound();
}

function headTags(m: PageMeta) {
  const url = m.path ? `${SITE}${m.path === "/" ? "/" : m.path}` : null;
  const image = m.image ?? OG_IMAGE;
  const ld = m.jsonLd?.length
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@graph": m.jsonLd,
      }).replace(/</g, "\\u003c")}</script>`
    : "";
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="keywords" content="${esc(KEYWORDS)}" />`,
    `<meta name="author" content="Sardar Ali" />`,
    `<meta name="robots" content="${m.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"}" />`,
    url ? `<link rel="canonical" href="${url}" />` : "",
    `<meta property="og:type" content="${m.type ?? "website"}" />`,
    `<meta property="og:site_name" content="Sardar Ali" />`,
    `<meta property="og:locale" content="en_IN" />`,
    url ? `<meta property="og:url" content="${url}" />` : "",
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:alt" content="Sardar Ali, Punjabi &amp; Sufi singer" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ld,
  ]
    .filter(Boolean)
    .join("\n    ");
}

const FALLBACK_STYLE =
  "max-width:48rem;margin:0 auto;padding:6rem 1rem;font-family:Georgia,serif;color:#efe6cf;background:#0b1f1c;min-height:100vh";

export const seoService = {
  async renderPage(rawPath: string) {
    const html = await indexHtml();
    if (!html) return null;
    const m = await metaFor(rawPath);
    const out = html
      .replace(
        /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
        `<!--seo:start-->\n    ${headTags(m)}\n    <!--seo:end-->`,
      )
      .replace(
        '<div id="app"></div>',
        m.body
          ? `<div id="app"><div data-seo-fallback style="${FALLBACK_STYLE}">${m.body}</div></div>`
          : '<div id="app"></div>',
      );
    return { status: m.status, html: out };
  },

  async sitemap() {
    const posts = await publishedPosts();
    const latest = posts[0]?.updatedAt ?? new Date();
    const urls = [
      { loc: "/", lastmod: latest, priority: "1.0", freq: "weekly" },
      { loc: "/book", lastmod: latest, priority: "0.9", freq: "monthly" },
      { loc: "/blog", lastmod: latest, priority: "0.7", freq: "weekly" },
      ...posts.map((p) => ({
        loc: `/blog/${encodeURIComponent(p.slug)}`,
        lastmod: p.updatedAt,
        priority: "0.6",
        freq: "monthly",
      })),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
  },
};
