"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function inDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit(fd: FormData) {
    setSubmitting(true);
    const payload = {
      clientName: fd.get("clientName"),
      clientEmail: fd.get("clientEmail"),
      amount: fd.get("amount"),
      currency: fd.get("currency"),
      dateSent: fd.get("dateSent"),
      dueDate: fd.get("dueDate"),
      notes: fd.get("notes") || null,
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error === "invalid_input" ? "Please check your inputs" : "Couldn't save invoice");
      return;
    }

    toast.success("Invoice created");
    router.push("/invoices");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <Link href="/invoices" className="text-sm font-medium text-[var(--violet-strong)] hover:underline">
          Back to invoices
        </Link>
        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              New record
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Log invoice</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Add the client, amount, due date, and any helpful notes. Once saved, this invoice can
              be nudged automatically when it becomes overdue.
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(140,126,213,0.14)] bg-white/82 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Default sequence
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">7 / 14 / 21 days</div>
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
        className="metric-panel space-y-6 rounded-[30px] p-6 sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Field label="Client name" hint="Who should receive the reminders?">
            <input name="clientName" required maxLength={200} autoFocus className={inputCls} />
          </Field>

          <Field label="Client email" hint="Used for reminder delivery.">
            <input name="clientEmail" type="email" required maxLength={254} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Field label="Amount" hint="Invoice total before the reminder sequence begins.">
            <input name="amount" type="number" step="0.01" min="0.01" required className={inputCls} />
          </Field>

          <Field label="Currency" hint="Displayed everywhere this invoice appears.">
            <select name="currency" defaultValue="USD" className={inputCls}>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Field label="Date sent" hint="When you originally sent the invoice.">
            <input name="dateSent" type="date" defaultValue={todayISO()} required className={inputCls} />
          </Field>

          <Field label="Due date" hint="The system starts calculating overdue windows from this date.">
            <input name="dueDate" type="date" defaultValue={inDaysISO(30)} required className={inputCls} />
          </Field>
        </div>

        <Field label="Notes" hint="Optional internal notes for context or follow-up history.">
          <textarea name="notes" rows={5} maxLength={2000} className={`${inputCls} resize-none`} />
        </Field>

        <div className="flex flex-col gap-3 border-t border-[rgba(140,126,213,0.14)] pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/invoices"
            className="ui-button-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="ui-button px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "ui-input w-full px-4 py-3 text-sm";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      {children}
      <span className="block text-xs leading-5 text-[var(--muted)]">{hint}</span>
    </label>
  );
}
