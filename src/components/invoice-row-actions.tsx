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
          className="rounded-full border border-[rgba(118,213,151,0.34)] bg-[rgba(118,213,151,0.16)] px-3 py-2 text-xs font-semibold text-[#1b6b38] hover:bg-[rgba(118,213,151,0.24)] disabled:opacity-50"
        >
          {busy === "pay" ? "Saving..." : "Mark paid"}
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy !== null}
        className="rounded-full border border-[rgba(243,120,120,0.24)] bg-[rgba(255,243,243,0.86)] px-3 py-2 text-xs font-semibold text-[#b53e49] hover:bg-[rgba(255,235,235,0.96)] disabled:opacity-50"
      >
        {busy === "delete" ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
