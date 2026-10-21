# Sardar Ali: Portfolio + CRM

Official website of **Sardar Ali**, Punjabi & Sufi singer (thesardarali.com), plus the admin CRM
for leads, show bookings, release posters, follow-ups, blog and WhatsApp outreach.

- `apps/api`: Bun + Elysia + Drizzle (Postgres). Port **4300**.
- `apps/web`: React 19 + Vite 8 + Tailwind v4 + TanStack Router/Query/Table. Port **3300**.
  Public site at `/`, admin at `/admin` (login at `/admin-login`).

## First run

```bash
bun install
createdb sardarali
cp apps/api/.env.example apps/api/.env      # adjust DATABASE_URL if needed
cd apps/api
bun run db:migrate                         # create tables
bun run assets                             # generate logo/placeholder SVGs into uploads/
bun run db:seed                            # wipes & seeds demo data
cd ../.. && bun run dev                    # api :4300 + web :3300
```

Seeded admin: `admin@sardarali.com` / `ChangeMe123!`. **Change it** in Admin → Settings before going live.

## What's where

| Area | Backend | Frontend |
| --- | --- | --- |
| Public site data | `controllers/public-controller.ts` | `routes/index.tsx`, `components/landing/*` |
| Kalam Collection (releases) | `GET /api/public/releases`, `admin-releases-controller.ts` | `components/landing/release-carousel.tsx`, `/admin/releases` |
| Book a Show form | `POST /api/public/bookings` | `components/booking/show-booking-form.tsx`, `/book?event=…` |
| Leads, remarks, timeline | `admin-leads-controller.ts`, `lib/services/lead-service.ts` | `/admin/leads`, `/admin/leads/$id` |
| Follow-ups & calendar | `admin-follow-ups-controller.ts` | `/admin/calendar` |
| Show bookings review | `admin-bookings-controller.ts` | `/admin/bookings` |
| WhatsApp lists/templates/broadcasts/channel | `admin-whatsapp-controller.ts`, `lib/services/whatsapp/wa-sender.ts` | `/admin/whatsapp` |
| Social feed (FB/IG/YT) | `lib/services/social/*` | `/admin/social`, landing "Latest" section |
| Blog | `admin-blog-controller.ts` | `/admin/blog` |

## Going live with integrations

- **YouTube**: set `YOUTUBE_API_KEY` (YouTube Data API v3) in `apps/api/.env`, then add channels by
  handle in Admin → Social Feed (test, pick videos / Shorts / live, order, rename, pause, pin). Videos
  are cached in `social_posts`; the site only reads that cache. A background check refreshes it at the
  interval chosen in the admin (default 6h, about 3 quota units per channel per refresh).
- **Facebook / Instagram**: set `FB_PAGE_ID`+`FB_PAGE_TOKEN`, `IG_USER_ID`+`IG_TOKEN` in
  `apps/api/.env`. Each switches from demo data to its live provider automatically. Until then, hide
  their tabs with "Show on website" in Admin → Social Feed.
- **WhatsApp**: messages currently open in WhatsApp via `wa.me` links (click-to-send). A
  `WaCloudApiSender` is ready in `wa-sender.ts` for the Meta Cloud API once a business number is verified.
- **Email alerts** for new queries/bookings: set `SMTP_*` and `ADMIN_NOTIFY_EMAIL`.

## Notes

- `apps/api/uploads/` is git-ignored. Run `bun run assets` on a fresh machine to regenerate brand art;
  admin uploads (converted to WebP) are stored there too, so back it up in production.
- All times are Indian Standard Time (helpers in `apps/api/src/lib/utils/time.ts`).

## Theme

Sufi palette in `apps/web/src/styles.css`: `night` (dargah green-black), `night-2`, `primary`
(emerald), `gold` / `gold-light`, `maroon` and `ivory`, plus `.bg-jaali`, `.arch` and
`.arch-pointed` utilities. Fixed artist facts (alternate booking line, team Instagram handles,
signature songs, darbars) live in `apps/web/src/lib/artist.ts`.
