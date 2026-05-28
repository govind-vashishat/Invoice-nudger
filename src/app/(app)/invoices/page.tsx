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
  pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  overdue: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No invoices yet. Click <strong>New invoice</strong> to add one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((inv) => {
                const days = daysFromNow(inv.dueDate);
                const isPaid = inv.status === "paid";
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.clientName}</div>
                      <div className="text-xs text-zinc-500">{inv.clientEmail}</div>
                    </td>
                    <td className="px-4 py-3">{formatAmount(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <div>{inv.dueDate}</div>
                      {!isPaid && days > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {days}d overdue
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[inv.status]
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <InvoiceRowActions id={inv.id} status={inv.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
