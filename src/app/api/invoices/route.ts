import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, invoices } from "@/db";
import { invoiceCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, session.user.id))
    .orderBy(desc(invoices.createdAt));

  return NextResponse.json({ invoices: rows });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = invoiceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const [row] = await db
    .insert(invoices)
    .values({
      userId: session.user.id,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      amount: data.amount.toFixed(2),
      currency: data.currency,
      dateSent: data.dateSent,
      dueDate: data.dueDate,
      notes: data.notes ?? null,
    })
    .returning();

  return NextResponse.json({ invoice: row }, { status: 201 });
}
