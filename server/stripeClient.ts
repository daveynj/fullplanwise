import Stripe from 'stripe';
import { resolveDatabaseConfig } from './database-url';

const isProduction = process.env.NODE_ENV === 'production';

function getSecretKey(): string {
  // In production, only the user-owned PLANWISE_* secrets are safe:
  // STRIPE_SECRET_KEY is owned by the Replit Stripe integration and
  // user-set values under that name are silently ignored in prod.
  const secretKey = isProduction
    ? process.env.PLANWISE_STRIPE_SECRET
    : process.env.PLANWISE_STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Please add PLANWISE_STRIPE_SECRET to your Replit secrets.');
  }
  return secretKey;
}

function getPublishableKey(): string {
  const publishableKey = isProduction
    ? process.env.PLANWISE_STRIPE_PUBLIC
    : process.env.PLANWISE_STRIPE_PUBLIC || process.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key not configured. Please add PLANWISE_STRIPE_PUBLIC to your Replit secrets.');
  }
  return publishableKey;
}

export async function getUncachableStripeClient() {
  return new Stripe(getSecretKey(), {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function getStripePublishableKey() {
  return getPublishableKey();
}

export async function getStripeSecretKey() {
  return getSecretKey();
}

/** User-owned name works in production; integration injection remains a dev fallback. */
export function getLegacyStripeSecretKey(): string | undefined {
  return process.env.PLANWISE_STRIPE_LEGACY_SECRET || process.env.STRIPE_SECRET_KEY;
}

/** Independent, bounded read-only probes; never fall back to another merchant. */
export function getBillingHealthAccounts() {
  const options = {
    apiVersion: '2025-08-27.basil' as any,
    timeout: 8000,
    maxNetworkRetries: 0,
  };
  // Unlike the development checkout fallback, the primary health check must
  // report a missing primary credential, not call the legacy account healthy.
  const primaryKey = process.env.PLANWISE_STRIPE_SECRET;
  const legacyKey = getLegacyStripeSecretKey();
  return [
    { account: "primary" as const, client: primaryKey ? new Stripe(primaryKey, options) : null },
    { account: "legacy" as const, client: legacyKey ? new Stripe(legacyKey, options) : null },
  ];
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = getSecretKey();
    const { connectionString: dbUrl } = resolveDatabaseConfig();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: dbUrl,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
