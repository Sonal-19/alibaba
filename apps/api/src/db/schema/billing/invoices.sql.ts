import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import {
  type InvoiceSeller,
  paymentMethodValues,
} from "../../../lib/utils/gst";

export const invoiceStatuses = ["issued", "cancelled"] as const;
export const invoiceStatusEnum = pgEnum("invoice_status", invoiceStatuses);
export const invoicePaymentMethodEnum = pgEnum(
  "invoice_payment_method",
  paymentMethodValues,
);

/** Last used running number per financial-year batch ("26-27" → 12). */
export const invoiceCountersTable = pgTable("invoice_counters", (pg) => ({
  batch: pg.text().primaryKey(),
  lastSeq: pg.integer("last_seq").notNull(),
}));

/** GST tax invoices issued to show clients. Money is stored in paise. */
export const invoicesTable = pgTable("invoices", (pg) => ({
  id: pg.serial().primaryKey(),
  /** e.g. "SAP/26-27/0001" */
  invoiceNo: pg.text("invoice_no").notNull().unique(),
  batch: pg.text().notNull(),
  seq: pg.integer().notNull(),
  invoiceDate: pg.date("invoice_date", { mode: "string" }).notNull(),
  clientName: pg.text("client_name").notNull(),
  clientStateCode: pg.text("client_state_code").notNull(),
  clientState: pg.text("client_state").notNull(),
  clientAddress: pg.text("client_address"),
  clientMobile: pg.text("client_mobile"),
  clientGstin: pg.text("client_gstin"),
  description: pg.text().notNull(),
  sac: pg.text().notNull(),
  paymentMethod: invoicePaymentMethodEnum("payment_method")
    .notNull()
    .default("bank"),
  totalPaise: pg.bigint("total_paise", { mode: "number" }).notNull(),
  taxablePaise: pg.bigint("taxable_paise", { mode: "number" }).notNull(),
  cgstPaise: pg.bigint("cgst_paise", { mode: "number" }).notNull().default(0),
  sgstPaise: pg.bigint("sgst_paise", { mode: "number" }).notNull().default(0),
  igstPaise: pg.bigint("igst_paise", { mode: "number" }).notNull().default(0),
  /** Seller block at time of issue, so reprints never change. */
  seller: pg.jsonb().$type<InvoiceSeller>().notNull(),
  status: invoiceStatusEnum().notNull().default("issued"),
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

export type SelectInvoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = typeof invoicesTable.$inferInsert;
