"use client";

import { useState, type FormEvent } from "react";
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
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
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/invoices" className="text-sm text-zinc-500 hover:underline">
          ← Invoices
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Field label="Client name">
          <input
            name="clientName"
            required
            maxLength={200}
            autoFocus
            className={inputCls}
          />
        </Field>

        <Field label="Client email">
          <input
            name="clientEmail"
            type="email"
            required
            maxLength={254}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Amount" className="col-span-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Currency">
            <select name="currency" defaultValue="USD" className={inputCls}>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date sent">
            <input name="dateSent" type="date" defaultValue={todayISO()} required className={inputCls} />
          </Field>
          <Field label="Due date">
            <input name="dueDate" type="date" defaultValue={inDaysISO(30)} required className={inputCls} />
          </Field>
        </div>

        <Field label="Notes (optional)">
          <textarea name="notes" rows={3} maxLength={2000} className={inputCls} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/invoices"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? "Saving…" : "Save invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
