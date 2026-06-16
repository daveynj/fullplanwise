import Stripe from 'stripe';

function getSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Please add it to your Replit secrets.');
  }
  return secretKey;
}

function getPublishableKey(): string {
  const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publishableKey) {
    throw new Error('VITE_STRIPE_PUBLIC_KEY is not configured. Please add it to your Replit secrets.');
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

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = getSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: (process.env.NEON_DATABASE_URL || process.env.DATABASE_URL)!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
