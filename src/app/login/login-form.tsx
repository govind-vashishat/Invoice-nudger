"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-10 flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-400 hover:text-zinc-200">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Invoice Nudger
        </Link>

        <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-zinc-500">Continue to your dashboard.</p>
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-900"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {status === "sent" ? (
            <div className="rounded-md border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-300">
              Check <strong className="text-emerald-200">{email}</strong> for a sign-in link.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMagicLink();
              }}
              className="space-y-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
