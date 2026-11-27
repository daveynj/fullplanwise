// @vitest-environment node
import { describe, expect, it } from "vitest";
import { publicAppUrl } from "./public-app-url";

describe("trusted public application URL", () => {
  it("uses the canonical public URL in production without relying on a request Host", () => {
    expect(publicAppUrl({ NODE_ENV: "production" })).toBe("https://planwiseesl.com");
  });
  it("uses only an explicitly configured public URL when gateway mode is enabled", () => {
    expect(publicAppUrl({
      REGISTRATION_GATEWAY_MODE: "enforce", PUBLIC_APP_URL: "https://staging.example.invalid/",
    })).toBe("https://staging.example.invalid");
    expect(() => publicAppUrl({ REGISTRATION_GATEWAY_MODE: "enforce" })).toThrow("must be configured");
  });
  it("keeps ordinary development checkout returns on the configured development domain", () => {
    expect(publicAppUrl({ NODE_ENV: "development", REPLIT_DEV_DOMAIN: "test.replit.dev" }))
      .toBe("https://test.replit.dev");
  });
  it.each([
    "http://example.invalid", "https://user:password@example.invalid",
    "https://example.invalid/path", "https://example.invalid/?bad=1",
    "https://example.invalid/#bad", "//example.invalid", "not-a-url",
  ])("rejects invalid public URL configuration: %s", (url) => {
    expect(() => publicAppUrl({ PUBLIC_APP_URL: url })).toThrow();
  });
});
