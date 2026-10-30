import type Stripe from "stripe";

export class CheckoutGuardError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export interface CheckoutUser {
  id: number;
  email: string;
  username: string;
  fullName?: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionTier: string | null;
}

// Only terminal subscriptions may be replaced. Paused/unpaid subscriptions
// can still recover and must not get a second subscription alongside them.
const ended = new Set(["canceled", "incomplete_expired"]);
const unavailable = () => new CheckoutGuardError(503, "BILLING_UNAVAILABLE",
  "We couldn't safely confirm your billing status. Your access has not changed. Please contact support before trying again.");
const alreadySubscribed = () => new CheckoutGuardError(409, "ALREADY_SUBSCRIBED",
  "You already have a subscription. Manage it from your account instead of subscribing again.");
const missing = (error: any) => error?.code === "resource_missing" || error?.statusCode === 404;

// Read every page: an old canceled subscription must not hide a newer active one.
async function allPages<T extends { id: string }>(
  list: (params: any) => Promise<{ data: T[]; has_more: boolean }>,
  params: Record<string, unknown>,
): Promise<T[]> {
  const rows: T[] = [];
  let after: string | undefined;
  do {
    const page = await list({ ...params, limit: 100, ...(after ? { starting_after: after } : {}) });
    rows.push(...page.data);
    if (!page.has_more) return rows;
    if (!page.data.length) throw unavailable();
    after = page.data[page.data.length - 1].id;
  } while (true);
}

/**
 * Called while holding a shared per-user database lock. No access changes, no
 * clearing legacy links, and no new checkout on an uncertain billing lookup.
 * The first client is always the account used for new purchases.
 */
export async function createGuardedCheckout(
  user: CheckoutUser,
  accounts: Stripe[],
  input: { planId: string; priceId: string; baseUrl: string },
  saveCustomer: (customerId: string) => Promise<unknown>,
) {
  const primary = accounts[0];
  if (!primary) throw unavailable();
  let linkedFound = !user.stripeSubscriptionId;
  let linkedEnded = false;
  let customerFound = !user.stripeCustomerId;
  let primaryCustomer: string | undefined;
  let pending: Stripe.Checkout.Session | undefined;
  let lastSession: Stripe.Checkout.Session | undefined;

  for (const [index, stripe] of accounts.entries()) {
    const customerIds = new Set<string>();
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.metadata?.userId && subscription.metadata.userId !== String(user.id)) throw unavailable();
        linkedFound = true;
        if (!ended.has(subscription.status)) throw alreadySubscribed();
        linkedEnded = true;
        const customer = subscription.customer;
        customerIds.add(typeof customer === "string" ? customer : customer.id);
      } catch (error) {
        if (!missing(error)) throw error;
      }
    }
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted && customer.metadata?.userId && customer.metadata.userId !== String(user.id)) {
          throw unavailable();
        }
        customerFound = true;
        if (!customer.deleted) {
          customerIds.add(customer.id);
        }
      } catch (error) {
        if (!missing(error)) throw error;
      }
    }
    // Email is a discovery hint, never ownership proof: app users and Stripe
    // customers can share it. Only our explicit user metadata can recover a link.
    const customers = await allPages<Stripe.Customer>(
      (params) => stripe.customers.list(params), { email: user.email },
    );
    for (const customer of customers) {
      if (customer.metadata?.userId === String(user.id)) customerIds.add(customer.id);
    }

    for (const customerId of customerIds) {
      const subscriptions = await allPages<Stripe.Subscription>(
        (params) => stripe.subscriptions.list(params), { customer: customerId, status: "all" },
      );
      if (subscriptions.some((subscription) => !ended.has(subscription.status))) {
        throw alreadySubscribed();
      }
      const sessions = await allPages<Stripe.Checkout.Session>(
        (params) => stripe.checkout.sessions.list(params), { customer: customerId },
      );
      for (const session of sessions) {
        if (session.mode !== "subscription") continue;
        if (session.status === "open") {
          if (session.metadata?.userId !== String(user.id)) throw unavailable();
          if (index !== 0 || !session.url) throw unavailable();
          // Never create another session while one can still be completed.
          pending ??= session;
        }
        // Completed asynchronous payments must settle before any new purchase.
        if (session.status === "complete" && session.payment_status === "unpaid") throw unavailable();
        if (session.status === "complete") {
          // Checkout completion and subscription-list visibility can race.
          // Confirm its subscription directly before allowing another purchase.
          if (!session.subscription) throw unavailable();
          const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(id);
          if (!ended.has(subscription.status)) throw alreadySubscribed();
        }
        if (index === 0 && (!lastSession || session.created > lastSession.created)) lastSession = session;
      }
      if (index === 0) primaryCustomer ??= customerId;
    }
  }

  if (!linkedFound || !customerFound) throw unavailable();
  // Hand-granted access and unresolved paid accounts must not be charged.
  // A positively ended subscription can return even if local tier sync is late.
  if (user.subscriptionTier === "unlimited" && !linkedEnded) throw alreadySubscribed();
  if (pending) return { sessionId: pending.id, url: pending.url };

  if (!primaryCustomer) {
    const customer = await primary.customers.create({
      email: user.email, name: user.fullName || user.username,
      metadata: { userId: String(user.id) },
    }, { idempotencyKey: `subscription-customer-${user.id}` });
    primaryCustomer = customer.id;
    // Keep the old subscription reference: "missing in primary" isn't canceled.
    await saveCustomer(primaryCustomer);
  }
  const session = await primary.checkout.sessions.create({
    customer: primaryCustomer,
    payment_method_types: ["card"],
    line_items: [{ price: input.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${input.baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${input.planId}`,
    cancel_url: `${input.baseUrl}/buy-credits`,
    metadata: { userId: String(user.id), planId: input.planId },
    subscription_data: { metadata: { userId: String(user.id), planId: input.planId } },
  }, {
    // Stable across retries/restarts if Stripe accepted a request but its
    // response was lost. A terminal session permits a fresh purchase attempt.
    idempotencyKey: `subscription-checkout-${user.id}-${primaryCustomer}-${lastSession?.id ?? "first"}`,
  });
  if (!session.url) throw unavailable();
  return { sessionId: session.id, url: session.url };
}
