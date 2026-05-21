import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  date,
  numeric,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const invoiceStatus = pgEnum("invoice_status", ["pending", "overdue", "paid"]);
export const tonePref = pgEnum("tone_pref", ["auto", "polite", "firm", "final"]);
export const nudgeTone = pgEnum("nudge_tone", ["polite", "firm", "final"]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  dateSent: date("date_sent").notNull(),
  dueDate: date("due_date").notNull(),
  notes: text("notes"),
  status: invoiceStatus("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nudgeLogs = pgTable("nudge_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull(),
  userId: text("user_id").notNull(),
  intervalDays: integer("interval_days").notNull(),
  tone: nudgeTone("tone").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  resendId: text("resend_id"),
});

export const settings = pgTable(
  "settings",
  {
    userId: text("user_id").primaryKey(),
    paymentUrl: text("payment_url"),
    senderName: text("sender_name"),
    nudgeIntervals: jsonb("nudge_intervals").$type<number[]>().notNull().default([7, 14, 21]),
    tone: tonePref("tone").notNull().default("auto"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("settings_user_id_idx").on(t.userId)],
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type NudgeLog = typeof nudgeLogs.$inferSelect;
export type NewNudgeLog = typeof nudgeLogs.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
