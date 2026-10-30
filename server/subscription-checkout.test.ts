// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuardedCheckout, type CheckoutUser } from "./subscription-checkout";

const notFound = { code: "resource_missing", statusCode: 404 };
const page = (data: any[] = [], has_more = false) => ({
  data: data.map((row) => row.id.startsWith("cus_") && !row.metadata
    ? { ...row, metadata: { userId: "7" } } : row),
  has_more,
});
function account() {
  return {
    customers: {
      retrieve: vi.fn().mockRejectedValue(notFound),
      list: vi.fn().mockResolvedValue(page()),
      create: vi.fn().mockResolvedValue({ id: "cus_new" }),
    },
    subscriptions: {
      retrieve: vi.fn().mockRejectedValue(notFound),
      list: vi.fn().mockResolvedValue(page()),
    },
    checkout: { sessions: {
      list: vi.fn().mockResolvedValue(page()),
      create: vi.fn().mockResolvedValue({ id: "cs_new", url: "https://checkout.example/new" }),
    } },
  };
}
let primary: ReturnType<typeof account>;
let legacy: ReturnType<typeof account>;
let user: CheckoutUser;
let save: ReturnType<typeof vi.fn>;
const input = { planId: "unlimited_monthly", priceId: "price_mock", baseUrl: "https://app.example" };
const open = {
  id: "cs_open", mode: "subscription", status: "open", created: 10,
  url: "https://checkout.example/open", metadata: { userId: "7" },
};
const canceled = { id: "sub_old", customer: "cus_old", status: "canceled" };
const run = () => createGuardedCheckout(user, [primary, legacy] as any, input, save);

beforeEach(() => {
  primary = account();
  legacy = account();
  save = vi.fn();
  user = {
    id: 7, email: "teacher@example.test", username: "teacher",
    stripeCustomerId: null, stripeSubscriptionId: null, subscriptionTier: "free",
  };
});

describe("duplicate subscription guard (all Stripe operations mocked)", () => {
  it.each(["active", "trialing", "past_due", "incomplete", "paused", "unpaid"])("blocks a linked %s subscription", async (status) => {
    user.stripeSubscriptionId = "sub_old";
    primary.subscriptions.retrieve.mockResolvedValue({ ...canceled, status, cancel_at_period_end: true });
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED", status: 409 });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("finds active subscriptions in the legacy account instead of replacing its customer", async () => {
    user.stripeCustomerId = "cus_old";
    user.stripeSubscriptionId = "sub_old";
    legacy.subscriptions.retrieve.mockResolvedValue({ ...canceled, status: "active" });
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.customers.create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("finds active customers by email when the stored link has been lost", async () => {
    legacy.customers.list.mockResolvedValue(page([{ id: "cus_older" }]));
    legacy.subscriptions.list.mockResolvedValue(page([{ id: "sub_active", status: "active" }]));
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it.each(["paused", "unpaid"])("blocks a discovered %s subscription", async (status) => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.subscriptions.list.mockResolvedValue(page([{ id: "sub_recoverable", status }]));
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("never reuses another user's customer or checkout just because their email matches", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_someone_else", metadata: { userId: "999" } }]));
    primary.checkout.sessions.list.mockResolvedValue(page([{ ...open, metadata: { userId: "999" } }]));
    await expect(run()).resolves.toMatchObject({ sessionId: "cs_new" });
    expect(primary.subscriptions.list).not.toHaveBeenCalled();
    expect(primary.checkout.sessions.list).not.toHaveBeenCalled();
    expect(primary.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" }), expect.anything(),
    );
  });

  it("does not select an untagged shared-email customer for a new purchase", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_untagged", metadata: {} }]));
    await expect(run()).resolves.toMatchObject({ sessionId: "cs_new" });
    expect(primary.customers.create).toHaveBeenCalledTimes(1);
    expect(primary.checkout.sessions.list).not.toHaveBeenCalled();
  });

  it.each([{ userId: "999" }, {}])("refuses an open checkout without matching ownership: %j", async (metadata) => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.list.mockResolvedValue(page([{ ...open, metadata }]));
    await expect(run()).rejects.toMatchObject({ code: "BILLING_UNAVAILABLE" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("refuses a stored customer link explicitly owned by another user", async () => {
    user.stripeCustomerId = "cus_foreign";
    primary.customers.retrieve.mockResolvedValue({ id: "cus_foreign", metadata: { userId: "999" } });
    await expect(run()).rejects.toMatchObject({ code: "BILLING_UNAVAILABLE" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("checks later subscription pages instead of trusting the first canceled result", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.subscriptions.list
      .mockResolvedValueOnce(page([canceled], true))
      .mockResolvedValueOnce(page([{ id: "sub_active", status: "active" }]));
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.subscriptions.list).toHaveBeenLastCalledWith(expect.objectContaining({ starting_after: "sub_old" }));
  });

  it("allows a canceled customer to return even before a stale paid tier is synced", async () => {
    Object.assign(user, { stripeCustomerId: "cus_old", stripeSubscriptionId: "sub_old", subscriptionTier: "unlimited" });
    primary.customers.retrieve.mockResolvedValue({ id: "cus_old" });
    primary.subscriptions.retrieve.mockResolvedValue(canceled);
    primary.subscriptions.list.mockResolvedValue(page([canceled]));
    await expect(run()).resolves.toMatchObject({ sessionId: "cs_new" });
    expect(primary.customers.create).not.toHaveBeenCalled();
    expect(primary.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it("allows a confirmed canceled legacy subscriber to return without clearing the old subscription link", async () => {
    Object.assign(user, { stripeCustomerId: "cus_old", stripeSubscriptionId: "sub_old" });
    legacy.customers.retrieve.mockResolvedValue({ id: "cus_old" });
    legacy.subscriptions.retrieve.mockResolvedValue(canceled);
    await expect(run()).resolves.toMatchObject({ sessionId: "cs_new" });
    expect(save).toHaveBeenCalledWith("cus_new");
  });

  it("reuses an open checkout on repeated requests without creating another", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.list.mockResolvedValue(page([open]));
    await expect(run()).resolves.toEqual({ sessionId: "cs_open", url: open.url });
    await expect(run()).resolves.toEqual({ sessionId: "cs_open", url: open.url });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("does not create a second checkout while a legacy checkout is pending", async () => {
    legacy.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    legacy.checkout.sessions.list.mockResolvedValue(page([open]));
    await expect(run()).rejects.toMatchObject({ code: "BILLING_UNAVAILABLE" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("allows an expired checkout to be replaced, with a new stable idempotency key", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.list.mockResolvedValue(page([{ ...open, status: "expired" }]));
    await run();
    expect(primary.checkout.sessions.create).toHaveBeenCalledWith(expect.anything(), {
      idempotencyKey: "subscription-checkout-7-cus_old-cs_open",
    });
  });

  it("blocks a completed payment whose subscription is not yet visible in the list", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.list.mockResolvedValue(page([{
      ...open, status: "complete", payment_status: "paid", subscription: "sub_recent",
    }]));
    primary.subscriptions.retrieve.mockResolvedValue({ id: "sub_recent", status: "active" });
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("blocks unsettled asynchronous payments", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.list.mockResolvedValue(page([{
      ...open, status: "complete", payment_status: "unpaid",
    }]));
    await expect(run()).rejects.toMatchObject({ code: "BILLING_UNAVAILABLE" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("does not downgrade or reset a paid user when neither account finds the linked subscription", async () => {
    Object.assign(user, { subscriptionTier: "unlimited", stripeSubscriptionId: "sub_missing", stripeCustomerId: "cus_missing" });
    await expect(run()).rejects.toMatchObject({ code: "BILLING_UNAVAILABLE" });
    expect(user.subscriptionTier).toBe("unlimited");
    expect(save).not.toHaveBeenCalled();
    expect(primary.customers.create).not.toHaveBeenCalled();
  });

  it("does not charge hand-granted unlimited users", async () => {
    user.subscriptionTier = "unlimited";
    await expect(run()).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it.each(["primary", "legacy"])("stops on %s API uncertainty, without changing access", async (which) => {
    user.subscriptionTier = "unlimited";
    (which === "primary" ? primary : legacy).customers.list.mockRejectedValue(new Error("timeout"));
    await expect(run()).rejects.toThrow("timeout");
    expect(save).not.toHaveBeenCalled();
    expect(user.subscriptionTier).toBe("unlimited");
    expect(primary.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("uses the same idempotency key after an ambiguous session-creation timeout", async () => {
    primary.customers.list.mockResolvedValue(page([{ id: "cus_old" }]));
    primary.checkout.sessions.create.mockRejectedValueOnce(new Error("timeout"));
    await expect(run()).rejects.toThrow("timeout");
    await run();
    const calls = primary.checkout.sessions.create.mock.calls;
    expect(calls[0][1]).toEqual(calls[1][1]);
    expect(calls[0][1]).toEqual({ idempotencyKey: "subscription-checkout-7-cus_old-first" });
  });
});
