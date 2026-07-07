import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">Invoice Nudger</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Stop chasing invoices.
          <br />
          Let us do it for you.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Log the invoice once. We&apos;ll send polite, firm, and final-notice reminders on autopilot —
          each with a Pay Now button pointing to your own payment link.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start 7-day free trial
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-white dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-500">No card required for signup. Cancel anytime.</p>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Every freelancer knows this pain
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Awkward follow-ups",
              body: "You dread writing that third \"just checking in\" email. So you don't. And the invoice sits.",
            },
            {
              title: "Cash flow drought",
              body: "30% of freelance invoices are paid late. You're financing your clients' businesses for free.",
            },
            {
              title: "Time lost tracking",
              body: "Spreadsheets, calendar reminders, sticky notes. You're running an unpaid A/R department.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Log the invoice",
              body: "Client name, email, amount, due date. Under 30 seconds. That's it.",
            },
            {
              step: "2",
              title: "We nudge",
              body: "At day 7, 14, and 21 past due — polite, firm, then final notice. Each with your Pay Now link.",
            },
            {
              step: "3",
              title: "Get paid",
              body: "Client clicks the button, pays via your Razorpay/PayPal/UPI link. Mark it paid. Done.",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                {s.step}
              </div>
              <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-md px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">One plan. No gotchas.</h2>
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Invoice Nudger Pro
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight">
            $25 <span className="text-base font-normal text-zinc-500">/ month</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">7-day free trial. Cancel anytime.</p>
          <ul className="mt-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li>✓ Unlimited invoices</li>
            <li>✓ Automated nudges at day 7, 14, 21</li>
            <li>✓ Pay Now button in every email</li>
            <li>✓ Configurable intervals + tone</li>
            <li>✓ Nudge history + delivery tracking</li>
            <li>✓ Email support</li>
          </ul>
          <Link
            href="/login"
            className="mt-8 block rounded-lg bg-zinc-900 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start 7-day free trial
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Your invoices don&apos;t chase themselves.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
          But we do. Try it free for 7 days.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Start free trial
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Invoice Nudger</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-300">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
