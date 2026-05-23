CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'overdue', 'paid');--> statement-breakpoint
CREATE TYPE "public"."nudge_tone" AS ENUM('polite', 'firm', 'final');--> statement-breakpoint
CREATE TYPE "public"."tone_pref" AS ENUM('auto', 'polite', 'firm', 'final');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"date_sent" date NOT NULL,
	"due_date" date NOT NULL,
	"notes" text,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nudge_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"interval_days" integer NOT NULL,
	"tone" "nudge_tone" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resend_id" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"payment_url" text,
	"sender_name" text,
	"nudge_intervals" jsonb DEFAULT '[7,14,21]'::jsonb NOT NULL,
	"tone" "tone_pref" DEFAULT 'auto' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "settings_user_id_idx" ON "settings" USING btree ("user_id");