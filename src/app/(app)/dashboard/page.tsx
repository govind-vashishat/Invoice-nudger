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
  pending: "status-pill bg-[rgba(119,83,214,0.12)] text-[var(--navy)]",
  overdue: "status-pill bg-[rgba(255,196,95,0.22)] text-[#8a4f00]",
  paid: "status-pill bg-[rgba(118,213,151,0.22)] text-[#1b6b38]",
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
      <section className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Dashboard
        </div>
        <h1 className="text-4xl font-semibold text-[var(--foreground)]">Collections overview</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          A clean view of what is unpaid, what has been collected, and when the next reminder will
          go out.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Outstanding"
          value={
            outstanding.length === 0
              ? "0"
              : outstanding.map((o) => formatAmount(o.total, o.currency)).join(" / ")
          }
          tone="soft"
        />
        <MetricCard
          label="Paid this month"
          value={
            paidThisMonth.length === 0
              ? "-"
              : paidThisMonth.map((o) => formatAmount(o.total, o.currency)).join(" / ")
          }
        />
        <MetricCard label="Overdue invoices" value={String(overdueCount)} />
        <MetricCard
          label="Next nudge"
          value={nextNudgeDate ? fmtDateTime(nextNudgeDate) : "No pending nudges"}
          tone="mint"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Recent invoices" link={{ href: "/invoices", label: "View all" }}>
          {recentInvoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              body="Create your first invoice to start tracking overdue dates and reminders."
              action={{ href: "/invoices/new", label: "Create invoice" }}
            />
          ) : (
            <ul className="space-y-3">
              {recentInvoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-[20px] border border-[rgba(125,110,185,0.12)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{inv.clientName}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">Due {inv.dueDate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {formatAmount(inv.amount, inv.currency)}
                    </div>
                    <span className={STATUS_STYLES[inv.status]}>{inv.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent nudges">
          {recentNudges.length === 0 ? (
            <EmptyState
              title="No nudges sent yet"
              body="Reminders will appear here once invoices move past due and hit your configured intervals."
            />
          ) : (
            <ul className="space-y-3">
              {recentNudges.map((n) => (
                <li key={n.id} className="rounded-[20px] border border-[rgba(125,110,185,0.12)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {n.clientName ?? "Unknown client"}
                    </div>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                      {n.tone}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted)]">
                    Day {n.intervalDays} reminder
                  </div>
                  <div className="mt-3 text-xs text-[var(--muted)]">{fmtDateTime(n.sentAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="metric-panel rounded-[28px] p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Settings snapshot
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SimpleStat label="Tone" value={(settingsRow?.tone ?? "auto").toUpperCase()} />
          <SimpleStat label="Intervals" value={intervals.join(" / ")} />
          <SimpleStat label="Workspace" value={session.user.name ?? "Freelancer"} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "soft" | "mint";
}) {
  const panelClass =
    tone === "soft"
      ? "metric-panel-soft"
      : tone === "mint"
        ? "metric-panel-mint"
        : "metric-panel";

  return (
    <div className={`${panelClass} rounded-[24px] p-5`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold leading-tight text-[var(--foreground)]">{value}</div>
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
    <section className="metric-panel rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        {link ? (
          <Link href={link.href} className="text-sm font-medium text-[var(--violet-strong)] hover:opacity-80">
            {link.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[rgba(125,110,185,0.18)] px-6 py-10 text-center">
      <div className="text-lg font-semibold text-[var(--foreground)]">{title}</div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">{body}</p>
      {action ? (
        <Link href={action.href} className="ui-button mt-5 inline-flex px-5 py-3 text-sm font-semibold">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[rgba(125,110,185,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}
