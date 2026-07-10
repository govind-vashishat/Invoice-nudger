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
  { value: "auto", label: "Auto", hint: "Escalates from polite to final notice as intervals advance." },
  { value: "polite", label: "Polite", hint: "Keeps every message calm and collaborative." },
  { value: "firm", label: "Firm", hint: "Sets a more direct tone across the whole sequence." },
  { value: "final", label: "Final notice", hint: "Uses your strongest reminder language every time." },
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
      className="metric-panel space-y-6 rounded-[30px] p-6 sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Field
          label="Payment URL"
          hint="This powers the Pay Now CTA in every reminder email."
        >
          <input
            type="url"
            value={paymentUrl}
            onChange={(e) => setPaymentUrl(e.target.value)}
            placeholder="https://razorpay.me/yourname"
            className={inputCls}
          />
        </Field>

        <Field label="Sender name" hint="Shown as the visible sender for your outbound nudges.">
          <input
            type="text"
            maxLength={100}
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Your name or studio"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Nudge intervals"
        hint="Comma-separated days past due. We sort and deduplicate automatically."
      >
        <input
          type="text"
          value={intervalsText}
          onChange={(e) => setIntervalsText(e.target.value)}
          placeholder="7, 14, 21"
          className={inputCls}
        />
      </Field>

      <Field label="Email tone" hint="Choose how assertive the sequence should feel to clients.">
        <div className="grid gap-3 sm:grid-cols-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTone(opt.value)}
              className={`rounded-[22px] border px-4 py-4 text-left shadow-[0_8px_22px_rgba(27,16,89,0.04)] ${
                tone === opt.value
                  ? "border-[rgba(127,69,221,0.36)] bg-[linear-gradient(180deg,#efeaff_0%,#e2dbff_100%)]"
                  : "border-[rgba(140,126,213,0.12)] bg-white/82 hover:bg-white"
              }`}
            >
              <div className="text-sm font-semibold text-[var(--foreground)]">{opt.label}</div>
              <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end border-t border-[rgba(140,126,213,0.14)] pt-6">
        <button
          type="submit"
          disabled={saving}
          className="ui-button px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
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
