import Link from "next/link";
import { and, count, desc, eq, gte, lt, ne } from "drizzle-orm";
import { db, invoices, nudgeLogs, settings } from "@/db";
import { requireSession } from "@/lib/session";
import { DEFAULT_NUDGE_INTERVALS } from "@/lib/validators";

function formatAmount(amount: number | string, currency: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function fmtDateTime(d: Date) {
  return (
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(d) + " UTC"
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfNextMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function next9amUTC() {
  const now = new Date();
  const today9 = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0),
  );
  return today9.getTime() > now.getTime() ? today9 : new Date(today9.getTime() + 86_400_000);
}

function sumByCurrency(rows: { currency: string; amount: string }[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.currency, (m.get(r.currency) ?? 0) + Number(r.amount));
  return [...m.entries()].map(([currency, total]) => ({ currency, total }));
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-900 text-zinc-300 border border-zinc-800",
  overdue: "bg-amber-950/40 text-amber-400 border border-amber-900/60",
  paid: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/60",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = todayISO();

  const [settingsRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  const intervals = [...new Set(settingsRow?.nudgeIntervals ?? [...DEFAULT_NUDGE_INTERVALS])].sort(
    (a, b) => a - b,
  );

  const [outstandingRows, paidRows, overdueResult, unpaidInvoices, sentRows, recentInvoices, recentNudges] =
    await Promise.all([
      db
        .select({ currency: invoices.currency, amount: invoices.amount })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), ne(invoices.status, "paid"))),
      db
        .select({ currency: invoices.currency, amount: invoices.amount })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, startOfMonthUTC()),
            lt(invoices.paidAt, startOfNextMonthUTC()),
          ),
        ),
      db
        .select({ count: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            ne(invoices.status, "paid"),
            lt(invoices.dueDate, today),
          ),
        ),
      db
        .select({ id: invoices.id, dueDate: invoices.dueDate })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), ne(invoices.status, "paid"))),
      db
        .select({ invoiceId: nudgeLogs.invoiceId, intervalDays: nudgeLogs.intervalDays })
        .from(nudgeLogs)
        .where(eq(nudgeLogs.userId, userId)),
      db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt))
        .limit(5),
      db
        .select({
          id: nudgeLogs.id,
          sentAt: nudgeLogs.sentAt,
          intervalDays: nudgeLogs.intervalDays,
          tone: nudgeLogs.tone,
          clientName: invoices.clientName,
        })
        .from(nudgeLogs)
        .leftJoin(invoices, eq(nudgeLogs.invoiceId, invoices.id))
        .where(eq(nudgeLogs.userId, userId))
        .orderBy(desc(nudgeLogs.sentAt))
        .limit(5),
    ]);

  const outstanding = sumByCurrency(outstandingRows);
  const paidThisMonth = sumByCurrency(paidRows);
  const overdueCount = Number(overdueResult[0]?.count ?? 0);

  const sentByInvoice = new Map<string, Set<number>>();
  for (const r of sentRows) {
    if (!sentByInvoice.has(r.invoiceId)) sentByInvoice.set(r.invoiceId, new Set());
    sentByInvoice.get(r.invoiceId)!.add(r.intervalDays);
  }

  const cronTime = next9amUTC();
  let nextNudgeDate: Date | null = null;
  for (const inv of unpaidInvoices) {
    const sent = sentByInvoice.get(inv.id) ?? new Set<number>();
    const dueMs = new Date(inv.dueDate + "T09:00:00Z").getTime();
    for (const interval of intervals) {
      if (sent.has(interval)) continue;
      let nudgeDate = new Date(dueMs + interval * 86_400_000);
      if (nudgeDate.getTime() < cronTime.getTime()) nudgeDate = cronTime;
      if (!nextNudgeDate || nudgeDate.getTime() < nextNudgeDate.getTime()) {
        nextNudgeDate = nudgeDate;
      }
      break;
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of outstanding, collected, and scheduled reminders.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={
            outstanding.length === 0
              ? "—"
              : outstanding.map((o) => formatAmount(o.total, o.currency)).join(" · ")
          }
        />
        <StatCard
          label="Paid this month"
          value={
            paidThisMonth.length === 0
              ? "—"
              : paidThisMonth.map((o) => formatAmount(o.total, o.currency)).join(" · ")
          }
          accent="emerald"
        />
        <StatCard label="Overdue" value={String(overdueCount)} accent={overdueCount > 0 ? "amber" : undefined} />
        <StatCard
          label="Next nudge"
          value={nextNudgeDate ? fmtDateTime(nextNudgeDate) : "—"}
          hint={nextNudgeDate ? "cron runs daily at 9AM UTC" : "no pending intervals"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Recent invoices" link={{ href: "/invoices", label: "View all →" }}>
          {recentInvoices.length === 0 ? (
            <Empty title="No invoices yet" action={{ href: "/invoices/new", label: "Create invoice" }} />
          ) : (
            <ul className="divide-y divide-zinc-900">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{inv.clientName}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">Due {inv.dueDate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="mono-nums text-sm font-medium">
                      {formatAmount(inv.amount, inv.currency)}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent nudges">
          {recentNudges.length === 0 ? (
            <Empty title="No nudges sent yet" body="Reminders will appear here once invoices go overdue." />
          ) : (
            <ul className="divide-y divide-zinc-900">
              {recentNudges.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{n.clientName ?? "—"}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      Day {n.intervalDays} · {n.tone}
                    </div>
                  </div>
                  <div className="mono-nums text-xs text-zinc-500">{fmtDateTime(n.sentAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "amber";
}) {
  const valueColor =
    accent === "emerald" ? "text-emerald-400" : accent === "amber" ? "text-amber-400" : "text-zinc-100";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="label-eyebrow">{label}</div>
      <div className={`mono-nums mt-3 text-xl font-semibold tracking-tight ${valueColor}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-zinc-500">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  link,
  children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {link && (
          <Link href={link.href} className="text-xs text-zinc-500 hover:text-zinc-300">
            {link.label}
          </Link>
        )}
      </div>
      <div className="px-5">{children}</div>
    </section>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="py-10 text-center">
      <div className="text-sm font-medium text-zinc-300">{title}</div>
      {body && <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">{body}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
