import Elysia from "elysia";
import { seoService } from "$/lib/services/seo-service";

/** Mounted at the root (not /api): nginx forwards page requests here. */
export const seoController = new Elysia({ name: "seo_controller" })
  .get("/sitemap.xml", async ({ set }) => {
    set.headers["Content-Type"] = "application/xml; charset=utf-8";
    set.headers["Cache-Control"] = "public, max-age=3600";
    return seoService.sitemap();
  })
  .get("/_page/*", async ({ params, set }) => {
    const page = await seoService.renderPage(params["*"] ?? "");
    if (!page) {
      set.status = 503;
      return "Site is being updated, please refresh in a moment.";
    }
    set.status = page.status;
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    set.headers["Cache-Control"] = "no-cache";
    return page.html;
  });
