import { describe, expect, it } from "vitest";
import { registrationErrorMessage } from "./registration-error";

describe("signup error messages", () => {
  it.each([403, 503])("shows the JSON message without raw JSON or HTTP status (%s)", (status) => {
    expect(registrationErrorMessage(new Error(`${status}: {"code":"REGISTRATION_REGION_RESTRICTED","message":"New accounts are unavailable in your region."}`)))
      .toBe("New accounts are unavailable in your region.");
  });
  it("preserves normal network messages", () => {
    expect(registrationErrorMessage(new Error("Failed to fetch"))).toBe("Failed to fetch");
  });
  it.each(['503: <html>upstream error</html>', '400: {"internal":"not a user message"}', ""])(
    "provides a readable fallback for %s", (message) => {
      expect(registrationErrorMessage(new Error(message))).toBe("We couldn't create your account. Please try again later.");
    },
  );
});
