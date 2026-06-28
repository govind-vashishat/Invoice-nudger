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
  pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  overdue: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding">
          {outstanding.length === 0 ? (
            <Big>—</Big>
          ) : (
            <div className="space-y-0.5">
              {outstanding.map((o) => (
                <Big key={o.currency}>{formatAmount(o.total, o.currency)}</Big>
              ))}
            </div>
          )}
        </StatCard>
        <StatCard label="Paid this month">
          {paidThisMonth.length === 0 ? (
            <Big>—</Big>
          ) : (
            <div className="space-y-0.5">
              {paidThisMonth.map((o) => (
                <Big key={o.currency}>{formatAmount(o.total, o.currency)}</Big>
              ))}
            </div>
          )}
        </StatCard>
        <StatCard label="Overdue">
          <Big>{overdueCount}</Big>
          <div className="text-xs text-zinc-500">invoices past due date</div>
        </StatCard>
        <StatCard label="Next nudge">
          <Big>{nextNudgeDate ? fmtDateTime(nextNudgeDate) : "—"}</Big>
          <div className="text-xs text-zinc-500">cron runs daily at 9 AM UTC</div>
        </StatCard>
      </div>

      <Section title="Recent invoices" link={{ href: "/invoices", label: "View all →" }}>
        {recentInvoices.length === 0 ? (
          <Empty>
            No invoices yet.{" "}
            <Link href="/invoices/new" className="underline">
              Log one
            </Link>
            .
          </Empty>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{inv.clientName}</div>
                  <div className="text-xs text-zinc-500">Due {inv.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">{formatAmount(inv.amount, inv.currency)}</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent nudges">
        {recentNudges.length === 0 ? (
          <Empty>No nudges sent yet. They&apos;ll appear here once invoices go overdue.</Empty>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentNudges.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{n.clientName ?? "—"}</div>
                  <div className="text-xs text-zinc-500">
                    Day {n.intervalDays} · {n.tone}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">{fmtDateTime(n.sentAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <div className="text-2xl font-semibold tracking-tight">{children}</div>;
}

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h2>
        {link && (
          <Link href={link.href} className="text-xs text-zinc-500 hover:underline">
            {link.label}
          </Link>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
        {children}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-zinc-500">{children}</div>;
}
