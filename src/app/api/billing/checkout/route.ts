import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import DodoPayments from "dodopayments";
import { auth } from "@/lib/auth";
import { db, subscriptions } from "@/db";

const TRIAL_DAYS = 7;

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PRODUCT_ID) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 500 });
  }

  // Guard: if user already has an active Dodo subscription, don't create a duplicate.
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);
  if (existing?.status === "active" && existing.dodoSubscriptionId) {
    return NextResponse.json({ checkoutUrl: "/dashboard" });
  }

  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;

  const checkout = await client.checkoutSessions.create({
    product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1 }],
    customer: {
      email: session.user.email,
    },
    subscription_data: { trial_period_days: TRIAL_DAYS },
    return_url: returnUrl,
  });

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);

  await db
    .insert(subscriptions)
    .values({
      userId: session.user.id,
      status: "trialing",
      trialEndsAt,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { status: "trialing", trialEndsAt, updatedAt: new Date() },
    });

  if (!checkout.checkout_url) {
    return NextResponse.json({ error: "checkout_url_missing" }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl: checkout.checkout_url });
}
