// Shared by checkout and its read-only health check so they cannot drift.
export const CHECKOUT_PRICES: Record<string, string> = {
  price_unlimited_monthly: "price_1Timp4Bnt8Mku7BYBMYUVYrF",
};

// Verified read-only against the existing "Teacher Dave" merchant account.
// Account IDs are public identifiers, not credentials. Never learn this from
// the key being checked: a valid replacement key can belong to the wrong merchant.
export const LEGACY_STRIPE_ACCOUNT_ID = "acct_1RAwBpAsWPZqDtgQ";
