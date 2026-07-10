"use client";

import { useState } from "react";
import { toast } from "sonner";

export function SubscribeButton({ hasTrialed }: { hasTrialed: boolean }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.checkoutUrl) {
      setLoading(false);
      toast.error(data.error ?? "Couldn't start checkout. Try again.");
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
    >
      {loading
        ? "Redirecting…"
        : hasTrialed
          ? "Subscribe — $25/month"
          : "Start 7-day free trial"}
    </button>
  );
}
