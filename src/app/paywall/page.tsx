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

  // Server component runs once per request; current time is intentional here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const trialEnded = !!sub?.trialEndsAt && new Date(sub.trialEndsAt).getTime() <= now;
  const headline = trialEnded ? "Your trial has ended" : "Start your 7-day free trial";
  const subline = trialEnded
    ? "Subscribe to keep automated nudges firing for your invoices."
    : "Free for 7 days, then $25/month. Cancel anytime.";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,69,221,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(145,233,177,0.18),transparent_28%),linear-gradient(180deg,#faf9ff_0%,#f2f1ff_100%)]" />

      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel rounded-[34px] p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Billing
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--foreground)]">
            {headline}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{subline}</p>

          <div className="mt-8 grid gap-4">
            <Feature title="Unlimited invoice tracking" />
            <Feature title="Automated reminders at your chosen intervals" />
            <Feature title="Payment links baked into every client email" />
            <Feature title="Nudge history plus recent collections visibility" />
          </div>
        </section>

        <section className="metric-panel rounded-[34px] p-8">
          <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--navy)_0%,#2b1f8e_55%,var(--violet)_100%)] p-7 text-white shadow-[0_22px_50px_rgba(29,16,92,0.22)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/64">
              Invoice Nudger Pro
            </div>
            <div className="mt-4 text-5xl font-semibold">
              $25 <span className="text-lg font-medium text-white/72">/ month</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/76">
              Designed for freelancers who want calmer collections and fewer manual follow-ups.
            </p>
          </div>

          <div className="mt-6 rounded-[26px] border border-[rgba(140,126,213,0.14)] bg-[rgba(239,234,255,0.58)] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
              Signed in
            </div>
            <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{session.user.email}</div>
          </div>

          <div className="mt-6">
            <SubscribeButton hasTrialed={trialEnded} />
          </div>

          <div className="mt-6 flex justify-end border-t border-[rgba(140,126,213,0.14)] pt-6">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(140,126,213,0.14)] bg-white/72 px-4 py-4 text-sm font-medium text-[var(--foreground)]">
      {title}
    </div>
  );
}
