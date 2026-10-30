import type { Request, Response } from "express";
import Stripe from "stripe";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool } from "./db";
import { storage } from "./storage";
import { subscriptionSchema } from "@shared/schema";
import { CHECKOUT_PRICES } from "./billing-config";
import { getLegacyStripeSecretKey, getStripeSecretKey } from "./stripeClient";
import { isFreeTrialActive } from "./features";
import { CheckoutGuardError, createGuardedCheckout } from "./subscription-checkout";

export async function subscriptionCheckoutRoute(req: Request, res: Response) {
  if (isFreeTrialActive()) {
    return res.status(403).json({ message: "Subscriptions are disabled during the free trial period." });
  }
  let connection: PoolClient | undefined;
  let locked = false;
  try {
    const { planId, priceId } = subscriptionSchema.parse(req.body);
    const actualPriceId = CHECKOUT_PRICES[priceId];
    if (!actualPriceId) return res.status(400).json({ message: "Unknown subscription price." });
    const userId = req.user!.id;
    connection = await pool.connect();
    // Session lock on a dedicated connection: protects every app instance, not
    // only this Node process. Refuse concurrent attempts rather than queue them.
    const result = await connection.query(
      "SELECT pg_try_advisory_lock(734921, $1) AS locked", [userId],
    );
    locked = result.rows[0]?.locked === true;
    if (!locked) return res.status(409).json({
      code: "CHECKOUT_IN_PROGRESS", message: "Checkout is already being opened. Please wait before trying again.",
    });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const key = await getStripeSecretKey();
    const legacyKey = getLegacyStripeSecretKey();
    const options = { apiVersion: "2025-08-27.basil" as any, timeout: 8000, maxNetworkRetries: 1 };
    const accounts = [new Stripe(key, options)];
    if (legacyKey && legacyKey !== key) accounts.push(new Stripe(legacyKey, options));
    const protocol = req.get("x-forwarded-proto") === "https" ? "https" : req.protocol;
    const data = await createGuardedCheckout(user, accounts, {
      planId, priceId: actualPriceId, baseUrl: `${protocol}://${req.get("host")}`,
    // updateUserStripeInfo also grants access for any non-null subscription
    // link. Opening checkout must only persist the customer, never activate or
    // clear the old subscription (even when that subscription has ended).
    }, (customerId) => storage.updateUser(userId, { stripeCustomerId: customerId }));
    return res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
    }
    if (error instanceof CheckoutGuardError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    // Do not log provider messages, which may contain credential fragments.
    console.error("Subscription creation failed", {
      userId: req.user?.id, type: error?.type, code: error?.code, statusCode: error?.statusCode,
    });
    return res.status(503).json({
      code: "BILLING_UNAVAILABLE",
      message: "We couldn't safely open checkout. Your access has not changed. Please contact support before trying again.",
    });
  } finally {
    if (connection) {
      let broken = false;
      if (locked) {
        try {
          await connection.query("SELECT pg_advisory_unlock(734921, $1)", [req.user!.id]);
        } catch {
          broken = true;
        }
      }
      connection.release(broken);
    }
  }
}
