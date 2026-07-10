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
      className="ui-button w-full px-5 py-3.5 text-sm font-semibold disabled:opacity-50"
    >
      {loading ? "Redirecting..." : hasTrialed ? "Subscribe - $25/month" : "Start 7-day free trial"}
    </button>
  );
}
