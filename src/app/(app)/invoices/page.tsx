import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, invoices } from "@/db";
import { requireSession } from "@/lib/session";
import { InvoiceRowActions } from "@/components/invoice-row-actions";

function formatAmount(amount: string, currency: string) {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function daysFromNow(dateStr: string) {
  const due = new Date(dateStr + "T00:00:00Z").getTime();
  const now = Date.now();
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

const STATUS_STYLES: Record<string, string> = {
  pending: "status-pill bg-[rgba(123,92,228,0.14)] text-[var(--navy)]",
  overdue: "status-pill bg-[rgba(255,196,95,0.26)] text-[#8a4f00]",
  paid: "status-pill bg-[rgba(118,213,151,0.24)] text-[#1b6b38]",
};

export default async function InvoicesPage() {
  const session = await requireSession();
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, session.user.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              Collections
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Invoices</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Track each client, see what&apos;s slipping overdue, and close out payments without
              bouncing between tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill label="Total invoices" value={String(rows.length)} />
            <Link href="/invoices/new" className="ui-button inline-flex items-center px-5 py-3 text-sm font-semibold">
              New invoice
            </Link>
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="metric-panel rounded-[30px] px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--lavender),#d7d0ff)] text-[var(--violet-strong)] shadow-[0_10px_24px_rgba(27,16,89,0.08)]">
            <InvoiceStackIcon />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-[var(--foreground)]">No invoices yet</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            Add your first client invoice and the dashboard will start calculating due dates,
            automation windows, and payment progress.
          </p>
          <Link href="/invoices/new" className="ui-button mt-6 inline-flex px-5 py-3 text-sm font-semibold">
            Create invoice
          </Link>
        </section>
      ) : (
        <section className="metric-panel overflow-hidden rounded-[30px]">
          <div className="border-b border-[rgba(140,126,213,0.14)] px-6 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              Ledger
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              Client receivables table
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[rgba(239,234,255,0.58)]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => {
                  const days = daysFromNow(inv.dueDate);
                  const isPaid = inv.status === "paid";
                  return (
                    <tr
                      key={inv.id}
                      className="border-t border-[rgba(140,126,213,0.1)] bg-white/72 align-top"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--lavender),#d7d0ff)] text-sm font-bold text-[var(--navy)]">
                            {inv.clientName
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--foreground)]">
                              {inv.clientName}
                            </div>
                            <div className="mt-1 text-xs text-[var(--muted)]">{inv.clientEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          {formatAmount(inv.amount, inv.currency)}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{inv.currency}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          {inv.dueDate}
                        </div>
                        {!isPaid && days > 0 && (
                          <div className="mt-1 text-xs font-medium text-[#8a4f00]">{days}d overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={STATUS_STYLES[inv.status]}>{inv.status}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <InvoiceRowActions id={inv.id} status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(140,126,213,0.14)] bg-white/82 px-4 py-3 shadow-[0_8px_24px_rgba(27,16,89,0.06)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function InvoiceStackIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h9l2 2v14l-2-1-2 1-2-1-2 1-2-1-2 1V3h1Zm3 5h5M10 12h5M10 16h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
