"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function createCheckoutSession(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pricing");

  const stripe = getStripeClient();

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    const { prisma } = await import("@/lib/prisma");
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: { userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://morning-money.app"}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://morning-money.app"}/pricing`,
  });

  if (session.url) redirect(session.url);
}

export async function createPortalSession(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.stripeCustomerId) redirect("/pricing");

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://morning-money.app"}/dashboard`,
  });

  if (session.url) redirect(session.url);
}
