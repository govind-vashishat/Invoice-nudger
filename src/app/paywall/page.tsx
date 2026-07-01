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

  // Server component runs once per request — Date.now() is safe here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const trialEnded = !!sub?.trialEndsAt && new Date(sub.trialEndsAt).getTime() <= now;
  const headline = trialEnded ? "Your trial has ended" : "Start your 7-day free trial";
  const subline = trialEnded
    ? "Subscribe to keep automated nudges firing for your invoices."
    : "Free for 7 days, then $25/month. Cancel anytime.";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
          <p className="text-sm text-zinc-500">{subline}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 p-5 text-center dark:border-zinc-800">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Invoice Nudger Pro
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            $25 <span className="text-base font-normal text-zinc-500">/ month</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-left text-sm text-zinc-600 dark:text-zinc-400">
            <li>• Unlimited invoices</li>
            <li>• Automated nudges at day 7, 14, 21</li>
            <li>• Pay Now button in every email</li>
            <li>• Nudge history + delivery tracking</li>
          </ul>
        </div>

        <SubscribeButton hasTrialed={trialEnded} />

        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          <span>Signed in as {session.user.email}</span>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
