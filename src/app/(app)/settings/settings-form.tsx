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
  { value: "auto", label: "Auto", hint: "Polite → firm → final per interval" },
  { value: "polite", label: "Polite", hint: "Friendly on every nudge" },
  { value: "firm", label: "Firm", hint: "Direct on every nudge" },
  { value: "final", label: "Final notice", hint: "Strong on every nudge" },
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
          ? "Please check your inputs (payment URL must be valid)"
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
      className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950 p-6"
    >
      <Field label="Payment URL" hint="Pasted into every nudge as the Pay Now button.">
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

      <Field label="Nudge intervals" hint="Comma-separated days past due. Default 7, 14, 21.">
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
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                tone === opt.value
                  ? "border-emerald-800 bg-emerald-950/30 text-zinc-100"
                  : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end border-t border-zinc-900 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none";

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
      <span className="label-eyebrow">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
