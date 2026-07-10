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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Invoice Nudger
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/invoices">Invoices</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-xs text-zinc-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
    >
      {children}
    </Link>
  );
}
