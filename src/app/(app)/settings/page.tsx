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
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          These power every reminder we send on your behalf.
        </p>
      </div>
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
