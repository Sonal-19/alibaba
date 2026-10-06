CREATE TYPE "invoice_status" AS ENUM('issued', 'cancelled');--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"batch" text PRIMARY KEY,
	"last_seq" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY,
	"invoice_no" text NOT NULL UNIQUE,
	"batch" text NOT NULL,
	"seq" integer NOT NULL,
	"invoice_date" date NOT NULL,
	"client_name" text NOT NULL,
	"client_state_code" text NOT NULL,
	"client_state" text NOT NULL,
	"client_address" text,
	"client_mobile" text,
	"client_gstin" text,
	"description" text NOT NULL,
	"sac" text NOT NULL,
	"total_paise" bigint NOT NULL,
	"taxable_paise" bigint NOT NULL,
	"cgst_paise" bigint DEFAULT 0 NOT NULL,
	"sgst_paise" bigint DEFAULT 0 NOT NULL,
	"igst_paise" bigint DEFAULT 0 NOT NULL,
	"seller" jsonb NOT NULL,
	"status" "invoice_status" DEFAULT 'issued'::"invoice_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
