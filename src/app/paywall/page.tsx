import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { requireSession } from "@/lib/session";
import { SubscribeButton } from "./subscribe-button";
import { SignOutButton } from "@/components/sign-out-button";

export default async function PaywallPage() {
  const session = await requireSession();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const trialEnded = !!sub?.trialEndsAt && new Date(sub.trialEndsAt).getTime() <= now;
  const headline = trialEnded ? "Your trial has ended" : "Start your 7-day free trial";
  const subline = trialEnded
    ? "Subscribe to keep automated nudges firing for your invoices."
    : "Free for 7 days, then $25/month. Cancel anytime.";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10 flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Invoice Nudger
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
          <p className="mt-2 text-sm text-zinc-500">{subline}</p>

          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="label-eyebrow">Invoice Nudger Pro</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">$25</span>
              <span className="text-sm text-zinc-500">/ month</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              {[
                "Unlimited invoices",
                "Automated nudges at 7 / 14 / 21 days",
                "Pay Now button in every email",
                "Configurable intervals + tone",
                "Nudge history + delivery tracking",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <SubscribeButton hasTrialed={trialEnded} />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-5 text-xs text-zinc-500">
            <span>{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
