import { z } from "zod";

export const invoiceCreateSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(254),
  amount: z.coerce.number().positive().max(99_999_999.99),
  currency: z.string().length(3).toUpperCase().default("USD"),
  dateSent: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).optional().nullable(),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  status: z.enum(["pending", "overdue", "paid"]).optional(),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const settingsUpdateSchema = z.object({
  paymentUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  senderName: z.string().max(100).nullable().optional(),
  nudgeIntervals: z
    .array(z.coerce.number().int().positive().max(365))
    .min(1)
    .max(10),
  tone: z.enum(["auto", "polite", "firm", "final"]),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const DEFAULT_NUDGE_INTERVALS = [7, 14, 21] as const;
