"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function InvoiceRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pay" | "delete" | null>(null);
  const [, startTransition] = useTransition();

  async function markPaid() {
    setBusy("pay");
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error("Couldn't mark as paid");
      return;
    }
    toast.success("Marked as paid");
    startTransition(() => router.refresh());
  }

  async function remove() {
    if (!window.confirm("Delete this invoice? This can't be undone.")) return;
    setBusy("delete");
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      toast.error("Couldn't delete invoice");
      return;
    }
    toast.success("Invoice deleted");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "paid" && (
        <button
          onClick={markPaid}
          disabled={busy !== null}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {busy === "pay" ? "…" : "Mark paid"}
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy !== null}
        className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950"
      >
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
