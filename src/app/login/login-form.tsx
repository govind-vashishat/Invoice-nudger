"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const err = params.get("error");
    if (!err) return;
    const message =
      err === "oauth"
        ? "Google sign-in failed. Please try again."
        : "Sign-in failed. Please try again.";
    toast.error(message);
    router.replace("/login");
  }, [params, router]);

  async function sendMagicLink() {
    setStatus("sending");
    const { error } = await signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });
    if (error) {
      setStatus("idle");
      toast.error(error.message ?? "Failed to send magic link");
      return;
    }
    setStatus("sent");
    toast.success(`Magic link sent to ${email}`);
  }

  async function handleGoogle() {
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/login?error=oauth",
    });
    if (error) toast.error(error.message ?? "Google sign-in failed");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,69,221,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(145,233,177,0.18),transparent_28%),linear-gradient(180deg,#faf9ff_0%,#f2f1ff_100%)]" />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel hidden rounded-[34px] p-8 lg:block">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full bg-[rgba(127,69,221,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--violet-strong)]">
              Invoice Nudger
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] text-[var(--foreground)]">
              Late payments handled with dashboard-grade calm.
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--muted)]">
              Track invoices, automate reminders, and turn collections into a clean operating
              rhythm instead of an emotional tax on your week.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <FeatureCard title="Soft lavender UI" body="The product stays readable and premium even when the data gets busy." />
            <FeatureCard title="Automated nudges" body="Polite, firm, and final reminders move on your timeline." />
            <FeatureCard title="Payment links" body="Drop in any checkout URL and turn emails into direct payment paths." />
            <FeatureCard title="Freelancer-first" body="Built to reduce awkward client follow-up loops." />
          </div>
        </section>

        <section className="metric-panel rounded-[34px] p-8 shadow-[0_24px_60px_rgba(27,16,89,0.12)]">
          <div className="space-y-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Welcome back
            </div>
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">Sign in</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Open your receivables dashboard and keep the reminders moving.
            </p>
          </div>

          <button
            onClick={handleGoogle}
            className="ui-button-secondary mt-8 flex w-full items-center justify-center gap-3 px-4 py-3 text-sm font-semibold"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(140,126,213,0.18)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              or
            </span>
            <div className="h-px flex-1 bg-[rgba(140,126,213,0.18)]" />
          </div>

          {status === "sent" ? (
            <div className="rounded-[24px] border border-[rgba(118,213,151,0.28)] bg-[rgba(203,244,216,0.62)] p-5 text-sm text-[#174b2b]">
              Check <strong>{email}</strong> for a sign-in link.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMagicLink();
              }}
              className="space-y-4"
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ui-input w-full px-4 py-3 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={status === "sending"}
                className="ui-button w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[26px] border border-[rgba(140,126,213,0.14)] bg-white/72 p-5">
      <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
