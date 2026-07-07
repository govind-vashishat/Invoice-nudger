import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { eq } from "drizzle-orm";
import { db, subscriptions, user } from "@/db";

export async function POST(req: Request) {
  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 500 });
  }

  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });

  const rawBody = await req.text();
  let event: ReturnType<typeof client.webhooks.unwrap>;
  try {
    event = client.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  console.log(`[dodo webhook] ${event.type}`);

  const data = event.data as {
    subscription_id?: string;
    customer?: { email?: string; customer_id?: string };
    next_billing_date?: string;
    current_period_end?: string;
  };

  const email = data.customer?.email;
  const dodoCustomerId = data.customer?.customer_id;
  const dodoSubscriptionId = data.subscription_id;

  // Find our user: prefer existing sub row by dodoCustomerId, fall back to user email
  let userId: string | null = null;
  if (dodoCustomerId) {
    const [row] = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.dodoCustomerId, dodoCustomerId))
      .limit(1);
    if (row) userId = row.userId;
  }
  if (!userId && email) {
    const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    if (u) userId = u.id;
  }
  if (!userId) {
    console.error(`[dodo webhook] no user match for ${event.type}`);
    return NextResponse.json({ received: true }); // ack so Dodo stops retrying
  }

  let status: "active" | "on_hold" | "past_due" | "canceled" | null = null;
  switch (event.type) {
    case "subscription.active":
    case "subscription.renewed":
      status = "active";
      break;
    case "subscription.on_hold":
      status = "on_hold";
      break;
    case "subscription.failed":
      status = "past_due";
      break;
    case "subscription.cancelled":
      status = "canceled";
      break;
    default:
      return NextResponse.json({ received: true });
  }

  const periodEndStr = data.next_billing_date ?? data.current_period_end;
  const currentPeriodEnd = periodEndStr ? new Date(periodEndStr) : null;

  await db
    .insert(subscriptions)
    .values({
      userId,
      status,
      dodoSubscriptionId: dodoSubscriptionId ?? null,
      dodoCustomerId: dodoCustomerId ?? null,
      currentPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        status,
        dodoSubscriptionId: dodoSubscriptionId ?? undefined,
        dodoCustomerId: dodoCustomerId ?? undefined,
        currentPeriodEnd: currentPeriodEnd ?? undefined,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ received: true });
}
