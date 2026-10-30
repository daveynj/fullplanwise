import type Stripe from "stripe";
import type { BillingAccountHealth, BillingHealth, BillingHealthStatus } from "@shared/billing-health";
import { CHECKOUT_PRICES, LEGACY_STRIPE_ACCOUNT_ID } from "./billing-config";
import { getBillingHealthAccounts } from "./stripeClient";
import { processBillingAlerts } from "./billing-alerts";

type Account = { account: BillingAccountHealth["account"]; client: Stripe | null };

/** Never return/log provider messages: Stripe auth errors can contain key material. */
export function billingFailureStatus(error: unknown, checkingPrice = false): BillingHealthStatus {
  const e = error as { statusCode?: number; type?: string; code?: string } | null;
  if (e?.statusCode === 401 || e?.type === "StripeAuthenticationError" || e?.code === "api_key_expired") {
    return "invalid_credentials";
  }
  if (e?.statusCode === 403 || e?.type === "StripePermissionError") return "permission_denied";
  if (e?.statusCode === 429 || (e?.statusCode && e.statusCode >= 500)
    || e?.type === "StripeConnectionError" || e?.type === "StripeAPIError") return "provider_unavailable";
  if (checkingPrice && (e?.statusCode === 404 || e?.code === "resource_missing")) return "price_invalid";
  return "check_failed";
}

async function checkAccount({ account, client }: Account): Promise<BillingAccountHealth> {
  if (!client) return { account, status: "not_configured" };
  let checkingPrice = false;
  try {
    // GET /v1/account authenticates against this specific merchant.
    const merchant = await client.accounts.retrieve();
    if (account === "legacy" && merchant.id !== LEGACY_STRIPE_ACCOUNT_ID) {
      return { account, status: "account_mismatch" };
    }
    // Legacy only serves existing subscribers; checkout prices belong to primary.
    if (account === "primary") {
      checkingPrice = true;
      for (const id of Object.values(CHECKOUT_PRICES)) {
        const price = await client.prices.retrieve(id, { expand: ["product"] });
        const product = price.product;
        if (!price.active || !price.livemode || price.type !== "recurring"
          || price.recurring?.interval !== "month"
          || !product || typeof product === "string" || product.deleted || !product.active) {
          return { account, status: "price_invalid" };
        }
      }
    }
    return { account, status: "healthy" };
  } catch (error) {
    return { account, status: billingFailureStatus(error, checkingPrice) };
  }
}

export const BILLING_HEALTH_CACHE_MS = 60_000;
export const BILLING_HEALTH_INTERVAL_MS = 5 * 60_000;

export function createBillingHealthMonitor(
  accounts: () => Account[] = () => getBillingHealthAccounts(),
  now: () => number = Date.now,
) {
  let cached: BillingHealth | undefined;
  let pending: Promise<BillingHealth> | undefined;
  return {
    async check(): Promise<BillingHealth> {
      if (cached && now() - Date.parse(cached.checkedAt) < BILLING_HEALTH_CACHE_MS) return cached;
      if (pending) return pending;
      pending = (async () => {
        const results = await Promise.all(accounts().map(checkAccount));
        cached = {
          checkedAt: new Date(now()).toISOString(),
          healthy: results.every((a) => a.status === "healthy"),
          accounts: results,
        };
        return cached;
      })();
      try {
        return await pending;
      } finally {
        pending = undefined;
      }
    },
  };
}

export const billingHealthMonitor = createBillingHealthMonitor();

/** Production checks run without requiring a customer to attempt checkout. */
export function startBillingHealthChecks(
  monitor = billingHealthMonitor,
  report: (message: string) => void = (message) => console.warn(message),
  notify: (health: BillingHealth, report: (message: string) => void) => Promise<void> = processBillingAlerts,
): () => void {
  let previous = "";
  const run = async () => {
    try {
      const result = await monitor.check();
      const summary = result.accounts.map((a) => `${a.account}=${a.status}`).join(", ");
      if (summary !== previous) {
        // Only fixed labels and enum statuses. No errors, credentials or account objects.
        report(`[BillingHealth] ${summary}`);
        previous = summary;
      }
      await notify(result, report);
    } catch {
      report("[BillingHealth] Health check could not complete");
    }
  };
  const first = setTimeout(run, 20_000);
  const repeat = setInterval(run, BILLING_HEALTH_INTERVAL_MS);
  first.unref();
  repeat.unref();
  return () => { clearTimeout(first); clearInterval(repeat); };
}
