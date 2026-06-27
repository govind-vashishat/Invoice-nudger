"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Tone = "auto" | "polite" | "firm" | "final";

type Props = {
  initial: {
    paymentUrl: string;
    senderName: string;
    nudgeIntervals: number[];
    tone: Tone;
  };
};

const TONE_OPTIONS: { value: Tone; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Polite → firm → final, escalating per interval" },
  { value: "polite", label: "Polite", hint: "Friendly tone on every nudge" },
  { value: "firm", label: "Firm", hint: "Direct tone on every nudge" },
  { value: "final", label: "Final notice", hint: "Strong tone on every nudge" },
];

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [paymentUrl, setPaymentUrl] = useState(initial.paymentUrl);
  const [senderName, setSenderName] = useState(initial.senderName);
  const [intervalsText, setIntervalsText] = useState(initial.nudgeIntervals.join(", "));
  const [tone, setTone] = useState<Tone>(initial.tone);
  const [saving, setSaving] = useState(false);

  async function save() {
    const intervals = intervalsText
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (intervals.length === 0) {
      toast.error("Add at least one nudge interval (e.g. 7, 14, 21)");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentUrl: paymentUrl.trim(),
        senderName: senderName.trim(),
        nudgeIntervals: intervals,
        tone,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.error === "invalid_input"
          ? "Please check your inputs (payment URL must be a valid URL)"
          : "Couldn't save settings",
      );
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Field
        label="Payment URL"
        hint="Pasted into every nudge as the Pay Now button. Razorpay, PayPal, UPI, Stripe link — anything."
      >
        <input
          type="url"
          value={paymentUrl}
          onChange={(e) => setPaymentUrl(e.target.value)}
          placeholder="https://razorpay.me/yourname"
          className={inputCls}
        />
      </Field>

      <Field label="Sender name" hint="Shown as the From name on emails to clients.">
        <input
          type="text"
          maxLength={100}
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your name or business"
          className={inputCls}
        />
      </Field>

      <Field
        label="Nudge intervals (days past due)"
        hint="Comma-separated. Default is 7, 14, 21 — we'll auto-sort and dedupe."
      >
        <input
          type="text"
          value={intervalsText}
          onChange={(e) => setIntervalsText(e.target.value)}
          placeholder="7, 14, 21"
          className={inputCls}
        />
      </Field>

      <Field label="Email tone">
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTone(opt.value)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                tone === opt.value
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-zinc-500">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
