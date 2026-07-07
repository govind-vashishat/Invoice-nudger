import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const hasAccess =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    ((sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now) ||
      (sub.trialEndsAt && sub.trialEndsAt.getTime() > now));

  if (!hasAccess) redirect("/paywall");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
              Invoice Nudger
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Dashboard
              </Link>
              <Link href="/invoices" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Invoices
              </Link>
              <Link href="/settings" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
