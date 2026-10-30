// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BillingHealth, BillingHealthStatus } from "@shared/billing-health";
import {
  ALERT_OBSERVATION_GAP_MS, createBillingAlertProcessor, createBillingWebhookDelivery,
  processBillingAlerts, type BillingAlert, type BillingAlertState, type BillingAlertStore,
} from "./billing-alerts";

function health(status: BillingHealthStatus = "healthy", legacy: BillingHealthStatus = "healthy"): BillingHealth {
  return { checkedAt: new Date().toISOString(), healthy: status === "healthy" && legacy === "healthy",
    accounts: [{ account: "primary", status }, { account: "legacy", status: legacy }] };
}

function fixture() {
  let persisted: BillingAlertState = { accounts: {}, pending: [] };
  let time = Date.parse("2026-10-30T12:00:00Z");
  let locked = false;
  const write = vi.fn(async (state: BillingAlertState) => { persisted = structuredClone(state); });
  const store: BillingAlertStore = {
    async exclusive(work) {
      if (locked) return;
      locked = true;
      try {
        await work({ now: time, read: async () => structuredClone(persisted), write });
      } finally { locked = false; }
    },
  };
  const deliver = vi.fn<(event: BillingAlert) => Promise<void>>().mockResolvedValue(undefined);
  const report = vi.fn();
  const create = () => createBillingAlertProcessor(store, deliver, report);
  return { store, write, deliver, report, create,
    state: () => structuredClone(persisted),
    advance: (ms = ALERT_OBSERVATION_GAP_MS) => { time += ms; },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("persistent billing alert transitions", () => {
  it("confirms initial failure, deduplicates repeats and survives new processor instances", async () => {
    const f = fixture();
    await f.create()(health("invalid_credentials"));
    expect(f.deliver).not.toHaveBeenCalled();
    // Other instances in the same interval cannot confirm the failure.
    await Promise.all([f.create()(health("invalid_credentials")), f.create()(health("invalid_credentials"))]);
    expect(f.state().accounts.primary?.count).toBe(1);
    f.advance();
    await f.create()(health("invalid_credentials"));
    expect(f.deliver).toHaveBeenCalledOnce();
    expect(f.deliver.mock.calls[0][0]).toMatchObject({
      type: "billing_health.failure", account: "primary",
      previousStatus: "healthy", status: "invalid_credentials", category: "credentials",
    });
    f.advance();
    await f.create()(health("invalid_credentials"));
    expect(f.deliver).toHaveBeenCalledOnce();
    expect(f.state().pending).toEqual([]);
  });

  it("silences healthy startup and one-off failures; confirms recovery separately per merchant", async () => {
    const f = fixture();
    const run = f.create();
    await run(health());
    f.advance();
    await run(health("provider_unavailable"));
    f.advance();
    await run(health());
    expect(f.deliver).not.toHaveBeenCalled();
    f.advance();
    await run(health("healthy", "invalid_credentials"));
    f.advance();
    await run(health("healthy", "invalid_credentials"));
    f.advance();
    await f.create()(health());
    expect(f.deliver).toHaveBeenCalledOnce(); // one healthy sample isn't recovery
    f.advance();
    await f.create()(health());
    expect(f.deliver).toHaveBeenCalledTimes(2);
    expect(f.deliver.mock.calls[1][0]).toMatchObject({
      account: "legacy", type: "billing_health.recovery",
      previousStatus: "invalid_credentials", status: "healthy", category: "recovery",
    });
    f.advance();
    await run(health());
    expect(f.deliver).toHaveBeenCalledTimes(2);
  });

  it("does not confuse a confirmed provider outage with credential failure", async () => {
    const f = fixture();
    await f.create()(health("provider_unavailable"));
    f.advance();
    await f.create()(health("provider_unavailable"));
    expect(f.deliver.mock.calls[0][0].category).toBe("provider_outage");
    f.advance();
    await f.create()(health("invalid_credentials"));
    f.advance();
    await f.create()(health("invalid_credentials"));
    expect(f.deliver.mock.calls[1][0]).toMatchObject({
      previousStatus: "provider_unavailable", status: "invalid_credentials", category: "credentials",
    });
  });

  it("retries failed delivery with the same ID, preserving recovery order across restart", async () => {
    const f = fixture();
    f.deliver.mockRejectedValue(new Error("SECRET_MUST_NOT_ESCAPE https://private-destination"));
    await f.create()(health("permission_denied"));
    f.advance();
    await f.create()(health("permission_denied"));
    const id = f.state().pending[0].id;
    f.advance();
    await f.create()(health());
    f.advance();
    await f.create()(health());
    expect(f.state().pending.map((e) => e.type)).toEqual(["billing_health.failure", "billing_health.recovery"]);
    f.deliver.mockResolvedValue(undefined);
    await f.create()(health());
    expect(f.deliver.mock.calls.slice(-2).map(([e]) => e.type)).toEqual(["billing_health.failure", "billing_health.recovery"]);
    expect(f.deliver.mock.calls.slice(0, -1).every(([e]) => e.id === id)).toBe(true);
    expect(f.state().pending).toEqual([]);
    expect(JSON.stringify(f.report.mock.calls)).not.toContain("SECRET_MUST_NOT_ESCAPE");
    expect(JSON.stringify(f.report.mock.calls)).not.toContain("private-destination");
  });

  it("does not deliver before durable enqueue succeeds, then retries the transition", async () => {
    const f = fixture();
    await f.create()(health("not_configured"));
    f.advance();
    f.write.mockRejectedValueOnce(new Error("database connection secret"));
    await f.create()(health("not_configured"));
    expect(f.deliver).not.toHaveBeenCalled();
    await f.create()(health("not_configured"));
    expect(f.deliver).toHaveBeenCalledOnce();
    expect(JSON.stringify(f.report.mock.calls)).not.toContain("database connection secret");
  });

  it("reuses the event ID if acknowledgment fails after receiver acceptance", async () => {
    const f = fixture();
    await f.create()(health("price_invalid"));
    f.advance();
    f.deliver.mockImplementationOnce(async () => {
      // Enqueue already succeeded; fail only the acknowledgment write.
      f.write.mockRejectedValueOnce(new Error("ack failed"));
    });
    await f.create()(health("price_invalid"));
    expect(f.state().pending).toHaveLength(1);
    const id = f.state().pending[0].id;
    await f.create()(health("price_invalid"));
    expect(f.deliver.mock.calls.map(([e]) => e.id)).toEqual([id, id]);
    expect(f.state().pending).toEqual([]);
  });

  it("does not deliver when the shared store is unavailable", async () => {
    const deliver = vi.fn();
    const report = vi.fn();
    await createBillingAlertProcessor({
      exclusive: async () => { throw new Error("SECRET_MUST_NOT_ESCAPE"); },
    }, deliver, report)(health("invalid_credentials"));
    expect(deliver).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith("[BillingHealth] Alert state could not be processed; will retry");
  });
});

describe("webhook delivery", () => {
  const event: BillingAlert = {
    id: "stable-event-id", type: "billing_health.failure", account: "primary",
    previousStatus: "healthy", status: "invalid_credentials", category: "credentials",
    confirmedAt: "2026-10-30T12:00:00.000Z",
  };

  it("sends only sanitized fields, a stable idempotency key, and a bounded request", async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await createBillingWebhookDelivery("https://alerts.example.test/billing", send)(event);
    const [, options] = send.mock.calls[0];
    expect(options.headers["Idempotency-Key"]).toBe(event.id);
    expect(JSON.parse(options.body)).toEqual(event);
    expect(options.redirect).toBe("error");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([400, 429, 500, 302])("rejects delivery response %s without exposing its body", async (status) => {
    const send = vi.fn().mockResolvedValue(new Response("SECRET_MUST_NOT_ESCAPE", { status }));
    await expect(createBillingWebhookDelivery("https://alerts.example.test", send)(event))
      .rejects.toThrow("Billing alert delivery was not accepted");
  });

  it.each(["http://alerts.example.test", "https://user:secret@alerts.example.test", "https://alerts.example.test/#token"])
  ("rejects unsafe destination %s", (url) => {
    expect(() => createBillingWebhookDelivery(url)).toThrow("Billing alert destination must be an HTTPS URL");
  });

  it("propagates a timeout to the persistent retry handler", async () => {
    const send = vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
    await expect(createBillingWebhookDelivery("https://alerts.example.test", send)(event)).rejects.toThrow("Timed out");
  });

  it("explicitly warns when no destination is configured and never exposes invalid URL material", async () => {
    const report = vi.fn();
    vi.stubEnv("BILLING_ALERT_WEBHOOK_URL", "");
    await processBillingAlerts(health(), report);
    expect(report).toHaveBeenCalledWith(expect.stringContaining("External alerts disabled"));
    vi.stubEnv("BILLING_ALERT_WEBHOOK_URL", "SECRET_MUST_NOT_ESCAPE");
    await processBillingAlerts(health(), report);
    expect(report).toHaveBeenLastCalledWith("[BillingHealth] Alert configuration or initialization failed; will retry");
    expect(JSON.stringify(report.mock.calls)).not.toContain("SECRET_MUST_NOT_ESCAPE");
  });
});
