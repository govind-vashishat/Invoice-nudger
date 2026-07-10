import { eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { requireSession } from "@/lib/session";
import { DEFAULT_NUDGE_INTERVALS } from "@/lib/validators";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await requireSession();
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, session.user.id))
    .limit(1);

  const initial = row ?? {
    paymentUrl: "",
    senderName: session.user.name ?? "",
    nudgeIntervals: [...DEFAULT_NUDGE_INTERVALS],
    tone: "auto" as const,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Configuration
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Reminder settings</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          These controls shape every client email: the link they click, the sender they see, the
          cadence of reminders, and how assertive the copy feels over time.
        </p>
      </section>

      <SettingsForm
        initial={{
          paymentUrl: initial.paymentUrl ?? "",
          senderName: initial.senderName ?? "",
          nudgeIntervals: initial.nudgeIntervals,
          tone: initial.tone,
        }}
      />
    </div>
  );
}
