import Stripe from 'stripe';

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

function getDatabaseUrl(): string {
  // Same rule as server/db.ts: in production, DATABASE_URL is overridden by
  // Replit's internal "helium" database and must not be used.
  const dbUrl = isProduction
    ? process.env.NEON_DATABASE_URL
    : process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('NEON_DATABASE_URL must be set in production for Stripe sync.');
  }
  return dbUrl;
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

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = getSecretKey();
    const dbUrl = getDatabaseUrl();

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
