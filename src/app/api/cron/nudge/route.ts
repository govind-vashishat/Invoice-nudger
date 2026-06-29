import { NextResponse } from "next/server";
import { eq, ne } from "drizzle-orm";
import { db, invoices, nudgeLogs, settings, user } from "@/db";
import { sendNudgeEmail, sendFreelancerNotify } from "@/lib/email";
import type { NudgeTone } from "@/emails/nudge";

const DEFAULT_INTERVALS = [7, 14, 21];

function daysOverdue(dueDate: string, now: Date): number {
  const due = new Date(dueDate + "T00:00:00Z").getTime();
  return Math.floor((now.getTime() - due) / 86_400_000);
}

function pickTone(setting: string, intervalIdx: number): NudgeTone {
  if (setting === "polite" || setting === "firm" || setting === "final") return setting;
  if (intervalIdx === 0) return "polite";
  if (intervalIdx === 1) return "firm";
  return "final";
}

function formatAmount(amount: string, currency: string): string {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      invoice: invoices,
      userEmail: user.email,
      userName: user.name,
      settingsPaymentUrl: settings.paymentUrl,
      settingsSenderName: settings.senderName,
      settingsIntervals: settings.nudgeIntervals,
      settingsTone: settings.tone,
    })
    .from(invoices)
    .innerJoin(user, eq(invoices.userId, user.id))
    .leftJoin(settings, eq(settings.userId, user.id))
    .where(ne(invoices.status, "paid"));

  if (rows.length === 0) {
    return NextResponse.json({ processed: 0, statusUpdated: 0, nudgesSent: 0, errors: [] });
  }

  const allLogs = await db
    .select({ invoiceId: nudgeLogs.invoiceId, intervalDays: nudgeLogs.intervalDays })
    .from(nudgeLogs)
    .innerJoin(invoices, eq(nudgeLogs.invoiceId, invoices.id))
    .where(ne(invoices.status, "paid"));

  const sentByInvoice = new Map<string, Set<number>>();
  for (const log of allLogs) {
    if (!sentByInvoice.has(log.invoiceId)) sentByInvoice.set(log.invoiceId, new Set());
    sentByInvoice.get(log.invoiceId)!.add(log.intervalDays);
  }

  const now = new Date();
  let statusUpdated = 0;
  let nudgesSent = 0;
  const errors: { invoiceId: string; error: string }[] = [];

  for (const row of rows) {
    const inv = row.invoice;
    try {
      const overdueDays = daysOverdue(inv.dueDate, now);

      // Flip pending → overdue if past due date
      if (overdueDays > 0 && inv.status === "pending") {
        await db
          .update(invoices)
          .set({ status: "overdue", updatedAt: now })
          .where(eq(invoices.id, inv.id));
        statusUpdated++;
      }

      if (overdueDays <= 0) continue; // not yet due

      const userIntervals = row.settingsIntervals ?? DEFAULT_INTERVALS;
      const sortedIntervals = [...new Set(userIntervals)].sort((a, b) => a - b);
      const sent = sentByInvoice.get(inv.id) ?? new Set<number>();

      // Find LARGEST crossed interval that hasn't been sent yet
      let chosenInterval: number | null = null;
      let chosenIdx = -1;
      for (let i = sortedIntervals.length - 1; i >= 0; i--) {
        const interval = sortedIntervals[i];
        if (overdueDays >= interval && !sent.has(interval)) {
          chosenInterval = interval;
          chosenIdx = i;
          break;
        }
      }
      if (chosenInterval === null) continue; // nothing to send

      const tone = pickTone(row.settingsTone ?? "auto", chosenIdx);
      const amountFormatted = formatAmount(inv.amount, inv.currency);
      const senderName = row.settingsSenderName ?? row.userName;

      // Send the client nudge
      const resendData = await sendNudgeEmail({
        to: inv.clientEmail,
        tone,
        clientName: inv.clientName,
        amountFormatted,
        daysOverdue: overdueDays,
        payNowUrl: row.settingsPaymentUrl,
        senderName,
        fromName: senderName,
      });

      // Log the nudge (do this BEFORE the freelancer notify, so a notify failure
      // doesn't cause us to re-send the client email next run)
      await db.insert(nudgeLogs).values({
        invoiceId: inv.id,
        userId: inv.userId,
        intervalDays: chosenInterval,
        tone,
        resendId: resendData?.id ?? null,
      });
      nudgesSent++;

      // Notify the freelancer (best-effort)
      try {
        await sendFreelancerNotify({
          to: row.userEmail,
          freelancerName: row.userName,
          clientName: inv.clientName,
          amountFormatted,
          daysOverdue: overdueDays,
          tone,
        });
      } catch (e) {
        console.error(`Failed to notify freelancer for invoice ${inv.id}`, e);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ invoiceId: inv.id, error: msg });
      console.error(`Cron failed for invoice ${inv.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    processed: rows.length,
    statusUpdated,
    nudgesSent,
    errors,
  });
}
