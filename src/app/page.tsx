import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Invoice Nudger
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100">
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-emerald-500 px-3 py-1.5 font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <div className="label-eyebrow mb-6">Invoice reminders on autopilot</div>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Stop chasing invoices.
          <span className="block text-zinc-500">Let us do it for you.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
          Log the invoice once. We&apos;ll send polite, firm, and final-notice reminders at day 7, 14,
          and 21 — each with a Pay Now button pointing to your own payment link.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 sm:w-auto"
          >
            Start 7-day free trial
          </Link>
          <a
            href="#how"
            className="w-full rounded-md border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 sm:w-auto"
          >
            See how it works →
          </a>
        </div>
        <p className="mt-6 text-xs text-zinc-500">No card required to start. Cancel anytime.</p>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-[0_0_60px_-15px_rgba(34,197,94,0.15)]">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            <div className="ml-3 text-xs text-zinc-500">app.invoicenudger.com/dashboard</div>
          </div>
          <div className="grid gap-4 py-6 sm:grid-cols-4">
            <MockStat label="Outstanding" value="$12,400" />
            <MockStat label="Paid this month" value="$4,200" />
            <MockStat label="Overdue" value="3" tone="warning" />
            <MockStat label="Next nudge" value="Tomorrow, 9AM" tone="accent" />
          </div>
          <div className="rounded-lg border border-zinc-800/70 p-4">
            <div className="label-eyebrow mb-3">Recent nudges</div>
            <div className="space-y-2 font-mono text-xs">
              <MockRow when="09:03 UTC" client="Acme Studios" days={21} tone="final" />
              <MockRow when="09:03 UTC" client="Northwind" days={14} tone="firm" />
              <MockRow when="09:03 UTC" client="Rivera & Co" days={7} tone="polite" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="label-eyebrow mb-4">Built for freelancers</div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The parts of your practice
              <br />
              you shouldn&apos;t have to touch.
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "One-tap logging",
                body: "Client, amount, dates, notes. Under 30 seconds. Then never think about that invoice again.",
              },
              {
                title: "Escalating tone",
                body: "Polite at day 7, firm at day 14, final notice at day 21. Or pin one tone. Or set your own intervals.",
              },
              {
                title: "Your payment link",
                body: "Paste your Razorpay, PayPal, UPI, or Stripe link once. Every nudge routes clients straight there.",
              },
              {
                title: "Delivery tracking",
                body: "Every nudge logged with a Resend message ID. See exactly what went out and when.",
              },
              {
                title: "One tier, no gotchas",
                body: "$25/month flat. Unlimited invoices. 7-day free trial. Cancel anytime through Dodo.",
              },
              {
                title: "Boring by design",
                body: "No dashboards to learn. No integrations to configure. Just quieter follow-ups.",
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="mb-3 h-px w-8 bg-emerald-500" />
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="label-eyebrow mb-4">How it works</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. That&apos;s the whole product.
          </h2>
          <div className="mt-12 space-y-6">
            {[
              {
                n: "01",
                title: "Log the invoice",
                body: "Client name, email, amount, currency, due date. Notes are optional. Save.",
              },
              {
                n: "02",
                title: "We nudge on your behalf",
                body: "Every day at 9AM UTC our cron picks up any invoice 7, 14, or 21 days overdue and fires an email — from your name, with your Pay Now link.",
              },
              {
                n: "03",
                title: "You get paid, mark it done",
                body: "Client clicks the button, pays through your link. You hit Mark Paid. Nudges stop instantly.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="flex gap-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-6"
              >
                <div className="font-mono text-xl text-zinc-600">{s.n}</div>
                <div>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-md px-6 py-24">
          <div className="label-eyebrow mb-4 text-center">Pricing</div>
          <h2 className="text-center text-3xl font-semibold tracking-tight">One plan. No tiers.</h2>

          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">$25</span>
              <span className="text-zinc-500">/ month</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">7-day free trial. Cancel anytime.</p>

            <ul className="mt-8 space-y-2.5 text-sm text-zinc-300">
              {[
                "Unlimited invoices",
                "Automated nudges at 7 / 14 / 21 days",
                "Configurable intervals + tone",
                "Pay Now button in every email",
                "Nudge history + delivery IDs",
                "Email support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-8 block rounded-md bg-emerald-500 py-3 text-center text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Start 7-day free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your invoices don&apos;t chase themselves.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-400">But we do. Try it free for 7 days.</p>
          <Link
            href="/login"
            className="mt-10 inline-block rounded-md bg-emerald-500 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Start free trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>© {new Date().getFullYear()} Invoice Nudger</span>
          </div>
          <Link href="/login" className="hover:text-zinc-300">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}

function MockStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "accent";
}) {
  const toneClass =
    tone === "warning" ? "text-amber-400" : tone === "accent" ? "text-emerald-400" : "text-zinc-100";
  return (
    <div className="rounded-lg border border-zinc-800/70 p-4">
      <div className="label-eyebrow">{label}</div>
      <div className={`mt-2 font-mono text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function MockRow({
  when,
  client,
  days,
  tone,
}: {
  when: string;
  client: string;
  days: number;
  tone: "polite" | "firm" | "final";
}) {
  const toneClass =
    tone === "final" ? "text-red-400" : tone === "firm" ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="flex items-center justify-between border-b border-zinc-900/80 py-2 last:border-b-0">
      <div className="flex items-center gap-4">
        <span className="text-zinc-600">{when}</span>
        <span className="text-zinc-300">{client}</span>
      </div>
      <span className={toneClass}>
        day {days} · {tone}
      </span>
    </div>
  );
}
