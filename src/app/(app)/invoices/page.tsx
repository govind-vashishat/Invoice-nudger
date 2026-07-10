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
  pending: "bg-zinc-900 text-zinc-300 border border-zinc-800",
  overdue: "bg-amber-950/40 text-amber-400 border border-amber-900/60",
  paid: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/60",
};

export default async function InvoicesPage() {
  const session = await requireSession();
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, session.user.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rows.length === 0
              ? "Add your first invoice to start automated reminders."
              : `${rows.length} total`}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-20 text-center">
          <div className="text-sm font-medium text-zinc-300">No invoices yet</div>
          <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
            Log your first invoice and we&apos;ll start tracking overdue windows automatically.
          </p>
          <Link
            href="/invoices/new"
            className="mt-6 inline-block rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Create invoice
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {rows.map((inv) => {
                  const days = daysFromNow(inv.dueDate);
                  const isPaid = inv.status === "paid";
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-900/50">
                      <td className="px-5 py-4">
                        <div className="font-medium">{inv.clientName}</div>
                        <div className="mt-0.5 text-xs text-zinc-500">{inv.clientEmail}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="mono-nums font-medium">
                          {formatAmount(inv.amount, inv.currency)}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">{inv.currency}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="mono-nums">{inv.dueDate}</div>
                        {!isPaid && days > 0 && (
                          <div className="mt-0.5 text-xs text-amber-400">{days}d overdue</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[inv.status]}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <InvoiceRowActions id={inv.id} status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
