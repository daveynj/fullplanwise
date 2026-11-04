import type { Request, Response } from "express";
import type Stripe from "stripe";
import { storage } from "./storage";
import { getBillingHealthAccounts } from "./stripeClient";
import { isFreeTrialActive } from "./features";

const unavailable = {
  code: "CANCELLATION_UNAVAILABLE",
  message: "We couldn't safely locate your subscription. It was not cancelled and your access has not changed. Please contact support.",
};

/** Only mutate after every merchant lookup succeeds and exactly one owns the link. */
export async function subscriptionCancelRoute(req: Request, res: Response) {
  if (isFreeTrialActive()) {
    return res.status(403).json({ message: "Subscriptions are disabled during the free trial period." });
  }
  let cancellationAttempted = false;
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active subscription found" });
    }

    // These independently configured, bounded clients have no main->legacy
    // credential fallback. Checkout's account selection remains untouched.
    const accounts = getBillingHealthAccounts();
    if (accounts.some(({ client }) => !client)) return res.status(503).json(unavailable);
    const matches: Array<{ stripe: Stripe; subscription: Stripe.Subscription }> = [];
    for (const { client } of accounts) {
      const stripe = client!;
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        matches.push({ stripe, subscription });
      } catch (error: unknown) {
        const e = error as { code?: string; statusCode?: number };
        // Only a positively missing resource permits searching another merchant.
        if (e?.code !== "resource_missing" || e?.statusCode !== 404) throw error;
      }
    }
    if (matches.length !== 1) {
      return res.status(matches.length ? 409 : 404).json({
        ...unavailable,
        code: matches.length ? "CANCELLATION_AMBIGUOUS" : "SUBSCRIPTION_NOT_FOUND",
      });
    }
    const { stripe, subscription } = matches[0];
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (subscription.id !== user.stripeSubscriptionId
      || (user.stripeCustomerId && customerId !== user.stripeCustomerId)
      || (subscription.metadata?.userId && subscription.metadata.userId !== String(userId))) {
      return res.status(409).json(unavailable);
    }
    if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      return res.status(409).json({
        code: "SUBSCRIPTION_ENDED",
        message: "This subscription has already ended. Your account has not been changed. Please refresh or contact support.",
      });
    }
    // Support both item-level (new API) and subscription-level period ends.
    const periodEnd: unknown = subscription.items?.data?.[0]?.current_period_end
      ?? (subscription as any).current_period_end;
    const endDate = typeof periodEnd === "number" ? new Date(periodEnd * 1000) : new Date(NaN);
    if (typeof periodEnd !== "number" || !Number.isFinite(periodEnd) || periodEnd <= 0 || !Number.isFinite(endDate.getTime())) {
      return res.status(500).json({
        message: "Could not determine the billing period end for this subscription. The subscription was not cancelled; please try again or contact support.",
      });
    }
    if (!subscription.cancel_at_period_end) {
      cancellationAttempted = true;
      await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
    }
    // Never clear billing links or downgrade the tier: access lasts until expiry.
    // Repeating an already scheduled cancellation can repair a failed local save.
    cancellationAttempted = true;
    await storage.updateUser(userId, {
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: endDate,
    });
    return res.json({
      message: "Subscription scheduled for cancellation at the end of the current billing period",
      endDate: endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      endTimestamp: periodEnd,
    });
  } catch {
    // Provider errors can contain credential fragments. Never return or log them.
    console.error("Subscription cancellation could not be confirmed");
    return res.status(503).json(cancellationAttempted ? {
      code: "CANCELLATION_UNCONFIRMED",
      message: "We couldn't confirm that cancellation was saved. Your access has not changed. Please refresh your account or contact support to confirm whether your subscription will renew.",
    } : unavailable);
  }
}
