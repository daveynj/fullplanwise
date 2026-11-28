import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canSendGaEvent, gaClientId, gaSessionId, sendGaEvent } from "./ga-measurement";

const cookies = "foo=1; _ga=GA1.1.123456789.1732780000; _ga_ZEF2MFWWF6=GS2.1.s1732780123$o5$g1$t1732780200$j0$l0$h0";

describe("reading GA's own cookies", () => {
  it("finds the visitor id", () => {
    expect(gaClientId(cookies)).toBe("123456789.1732780000");
    expect(gaClientId("_ga=GA1.2.42.99")).toBe("42.99");
  });

  it("ignores missing or malformed cookies", () => {
    expect(gaClientId(undefined)).toBeNull();
    expect(gaClientId("other=1")).toBeNull();
    expect(gaClientId("_ga=GA1.1.abc.def")).toBeNull();
  });

  it("finds the session id in both cookie formats", () => {
    expect(gaSessionId(cookies)).toBe("1732780123");
    expect(gaSessionId("_ga_ZEF2MFWWF6=GS1.1.1732780555.5.1.1732780600.0.0.0")).toBe("1732780555");
    expect(gaSessionId("_ga_OTHER=GS1.1.1732780555.5.1")).toBeNull();
  });
});

describe("sending events", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is switched off without an API secret", async () => {
    vi.stubEnv("GA_API_SECRET", "");
    expect(canSendGaEvent(cookies)).toBe(false);
    expect(await sendGaEvent(cookies, "sign_up")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing when the browser has no GA cookie (GA blocked there)", async () => {
    expect(await sendGaEvent("other=1", "sign_up", {}, { apiSecret: "s" })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the event for the same visitor and session, with no personal details", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    expect(await sendGaEvent(cookies, "purchase", { transaction_id: "cs_1", value: 19.99, currency: "USD" }, { apiSecret: "secret" })).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://www.google-analytics.com/mp/collect?measurement_id=G-ZEF2MFWWF6&api_secret=secret");
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      client_id: "123456789.1732780000",
      events: [{ name: "purchase", params: { transaction_id: "cs_1", value: 19.99, currency: "USD", session_id: "1732780123", engagement_time_msec: 1 } }],
    });
  });

  it("never throws, and reports failure", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await sendGaEvent(cookies, "sign_up", {}, { apiSecret: "s" })).toBe(false);
    fetchMock.mockResolvedValue({ ok: false });
    expect(await sendGaEvent(cookies, "sign_up", {}, { apiSecret: "s" })).toBe(false);
  });
});
