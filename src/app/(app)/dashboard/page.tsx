import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-zinc-500">
        Stats will live here. For now, head to{" "}
        <Link href="/invoices" className="underline">
          Invoices
        </Link>{" "}
        to log your first one.
      </p>
    </div>
  );
}
