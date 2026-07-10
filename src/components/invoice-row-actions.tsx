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
          className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 disabled:opacity-50"
        >
          {busy === "pay" ? "…" : "Mark paid"}
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy !== null}
        className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50"
      >
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
