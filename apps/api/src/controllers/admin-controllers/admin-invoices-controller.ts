import { desc, eq, ilike, or, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  invoiceCountersTable,
  invoicesTable,
  siteSettingsTable,
} from "$/db/schema";
import { renderInvoicePdf } from "$/lib/services/invoice-pdf-service";
import { fail, ok } from "$/lib/utils";
import {
  DEFAULT_INVOICE_DESCRIPTION,
  DEFAULT_SAC,
  financialYearBatch,
  formatInvoiceNo,
  GSTIN_REGEX,
  gstStateCodes,
  gstStateName,
  paymentMethodValues,
  SELLER,
  splitGst,
  toPaise,
} from "$/lib/utils/gst";
import { tEnum } from "$/lib/utils/schema";
import { IST_TZ } from "$/lib/utils/time";
import { protectedAdmin } from "$/pre-processor";

const todayIst = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: IST_TZ });

const invoiceBody = t.Object({
  clientName: t.String({ minLength: 1, maxLength: 160 }),
  clientStateCode: tEnum(gstStateCodes),
  /** Final amount received, GST included (rupees). */
  amount: t.Number({ exclusiveMinimum: 0, maximum: 100_000_000 }),
  clientAddress: t.Optional(t.Nullable(t.String({ maxLength: 400 }))),
  clientMobile: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
  clientGstin: t.Optional(
    t.Nullable(
      t.String({
        pattern: GSTIN_REGEX.source,
        error: "GSTIN must be a valid 15-character GST number",
      }),
    ),
  ),
  paymentMethod: t.Optional(tEnum(paymentMethodValues)),
  description: t.Optional(t.Nullable(t.String({ maxLength: 300 }))),
  invoiceDate: t.Optional(
    t.Nullable(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
  ),
});

export const adminInvoicesController = new Elysia({
  name: "admin_invoices_controller",
  prefix: "/invoices",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const q = query.q?.trim();
      const rows = await db
        .select()
        .from(invoicesTable)
        .where(
          q
            ? or(
                ilike(invoicesTable.clientName, `%${q}%`),
                ilike(invoicesTable.invoiceNo, `%${q}%`),
              )
            : undefined,
        )
        .orderBy(desc(invoicesTable.id))
        .limit(500);
      return ok(rows);
    },
    { query: t.Object({ q: t.Optional(t.String()) }) },
  )
  .post(
    "/",
    async ({ body, status }) => {
      const totalPaise = toPaise(body.amount);
      if (totalPaise <= 0)
        return status(400, fail("Amount must be greater than zero"));
      const invoiceDate = body.invoiceDate || todayIst();
      const batch = financialYearBatch(invoiceDate);

      const row = await db.transaction(async (tx) => {
        const [settings] = await tx
          .select({
            phone: siteSettingsTable.phone,
            email: siteSettingsTable.email,
          })
          .from(siteSettingsTable)
          .limit(1);

        // Atomic per-batch counter: concurrent submits never share a number.
        const [counter] = await tx
          .insert(invoiceCountersTable)
          .values({ batch, lastSeq: 1 })
          .onConflictDoUpdate({
            target: invoiceCountersTable.batch,
            set: { lastSeq: sql`${invoiceCountersTable.lastSeq} + 1` },
          })
          .returning({ seq: invoiceCountersTable.lastSeq });
        const seq = counter?.seq ?? 1;

        const { intra: _, ...amounts } = splitGst(
          totalPaise,
          body.clientStateCode,
        );
        const [inserted] = await tx
          .insert(invoicesTable)
          .values({
            invoiceNo: formatInvoiceNo(batch, seq),
            batch,
            seq,
            invoiceDate,
            clientName: body.clientName.trim(),
            clientStateCode: body.clientStateCode,
            clientState: gstStateName(body.clientStateCode),
            clientAddress: body.clientAddress?.trim() || null,
            clientMobile: body.clientMobile?.trim() || null,
            clientGstin: body.clientGstin?.trim().toUpperCase() || null,
            description:
              body.description?.trim() || DEFAULT_INVOICE_DESCRIPTION,
            sac: DEFAULT_SAC,
            paymentMethod: body.paymentMethod ?? "bank",
            ...amounts,
            seller: {
              ...SELLER,
              addressLines: [...SELLER.addressLines],
              phone: settings?.phone || null,
              email: settings?.email || null,
            },
          })
          .returning();
        return inserted;
      });
      if (!row) return status(500, fail("Could not create invoice"));
      return ok(row, `Invoice ${row.invoiceNo} created`);
    },
    { body: invoiceBody },
  )
  .get(
    "/:id/pdf",
    async ({ params, query, status }) => {
      const [row] = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.id, Number(params.id)))
        .limit(1);
      if (!row) return status(404, fail("Invoice not found"));
      const pdf = await renderInvoicePdf(row);
      const filename = `${row.invoiceNo.replaceAll("/", "-")}.pdf`;
      return new Response(new Blob([pdf as Uint8Array<ArrayBuffer>]), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `${query.inline ? "inline" : "attachment"}; filename="${filename}"`,
          "cache-control": "private, no-store",
        },
      });
    },
    { query: t.Object({ inline: t.Optional(t.String()) }) },
  )
  .patch("/:id/cancel", async ({ params, status }) => {
    const [row] = await db
      .update(invoicesTable)
      .set({ status: "cancelled" })
      .where(eq(invoicesTable.id, Number(params.id)))
      .returning();
    if (!row) return status(404, fail("Invoice not found"));
    return ok(row, `Invoice ${row.invoiceNo} cancelled`);
  });
