import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/invoices/new", label: "New invoice" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // Server component runs once per request; current time is intentional here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const hasAccess =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    ((sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now) ||
      (sub.trialEndsAt && sub.trialEndsAt.getTime() > now));

  if (!hasAccess) redirect("/paywall");

  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-[rgba(125,110,185,0.12)] bg-white/82 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--navy)] text-sm font-black text-white"
              >
                IN
              </Link>
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">Invoice Nudger</div>
                <div className="text-xs text-[var(--muted)]">Collections workspace</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-[rgba(125,110,185,0.14)] bg-white px-4 py-2 text-sm text-[var(--muted)] sm:block">
                {session.user.email}
              </div>
              <SignOutButton />
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ui-button-secondary px-4 py-2 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
