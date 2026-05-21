export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 bg-zinc-50 dark:bg-black">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Invoice Nudger
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Automatic, polite-to-firm payment reminders for freelancers. Log the invoice once — we&apos;ll chase it for you.
        </p>
      </div>
    </main>
  );
}
