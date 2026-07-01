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
      className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {loading
        ? "Redirecting…"
        : hasTrialed
          ? "Subscribe — $25/month"
          : "Start 7-day free trial"}
    </button>
  );
}
