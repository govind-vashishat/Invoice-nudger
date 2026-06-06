import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 bg-zinc-50 dark:bg-black">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Invoice Nudger
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Automatic, polite-to-firm payment reminders for freelancers. Log the invoice once — we&apos;ll chase it for you.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in to get started
        </Link>
      </div>
    </main>
  );
}
