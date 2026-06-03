import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, invoices } from "@/db";
import { invoiceUpdateSchema } from "@/lib/validators";

async function getSessionOrUnauth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await getSessionOrUnauth();
  if ("error" in guard) return guard.error;

  const [row] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, guard.session.user.id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ invoice: row });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await getSessionOrUnauth();
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (d.clientName !== undefined) update.clientName = d.clientName;
  if (d.clientEmail !== undefined) update.clientEmail = d.clientEmail;
  if (d.amount !== undefined) update.amount = d.amount.toFixed(2);
  if (d.currency !== undefined) update.currency = d.currency;
  if (d.dateSent !== undefined) update.dateSent = d.dateSent;
  if (d.dueDate !== undefined) update.dueDate = d.dueDate;
  if (d.notes !== undefined) update.notes = d.notes;
  if (d.status !== undefined) {
    update.status = d.status;
    update.paidAt = d.status === "paid" ? new Date() : null;
  }

  const [row] = await db
    .update(invoices)
    .set(update)
    .where(and(eq(invoices.id, id), eq(invoices.userId, guard.session.user.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ invoice: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await getSessionOrUnauth();
  if ("error" in guard) return guard.error;

  const [row] = await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, guard.session.user.id)))
    .returning({ id: invoices.id });

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
