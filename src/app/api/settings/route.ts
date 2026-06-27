import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, settings } from "@/db";
import { settingsUpdateSchema, DEFAULT_NUDGE_INTERVALS } from "@/lib/validators";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [row] = await db.select().from(settings).where(eq(settings.userId, session.user.id)).limit(1);

  return NextResponse.json({
    settings:
      row ?? {
        userId: session.user.id,
        paymentUrl: null,
        senderName: null,
        nudgeIntervals: [...DEFAULT_NUDGE_INTERVALS],
        tone: "auto" as const,
      },
  });
}

export async function PUT(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data;
  const normalized = {
    paymentUrl: d.paymentUrl ? d.paymentUrl : null,
    senderName: d.senderName ? d.senderName : null,
    nudgeIntervals: [...new Set(d.nudgeIntervals)].sort((a, b) => a - b),
    tone: d.tone,
  };

  const [row] = await db
    .insert(settings)
    .values({
      userId: session.user.id,
      ...normalized,
    })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { ...normalized, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ settings: row });
}
