// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({ db: {}, pool: {} }));
const mailchimpClient = vi.hoisted(() => ({
  setConfig: vi.fn(),
  lists: { updateListMemberTags: vi.fn() },
}));
vi.mock("@mailchimp/mailchimp_marketing", () => ({ default: mailchimpClient }));

import { applyPlanTags, shouldHaveUnlimitedTag, UNLIMITED_TAG, type PlanTagTarget } from "./mailchimp-plan-tags";
import { MailchimpService, subscriberHash } from "./services/mailchimp.service";

function fakeService(outcomes: Record<string, any> = {}) {
  return {
    isInitialized: vi.fn(() => true),
    setMemberTag: vi.fn(async (email: string) => {
      const outcome = outcomes[email];
      if (outcome instanceof Error) throw outcome;
      return outcome ?? { success: true };
    }),
  };
}

const row = (id: number, email: string | null, subscriptionTier: string | null): PlanTagTarget => ({ id, email, subscriptionTier });

describe("shouldHaveUnlimitedTag", () => {
  it("is true only for the unlimited tier", () => {
    expect(shouldHaveUnlimitedTag("unlimited")).toBe(true);
    expect(shouldHaveUnlimitedTag("free")).toBe(false);
    expect(shouldHaveUnlimitedTag(null)).toBe(false);
    expect(shouldHaveUnlimitedTag(undefined)).toBe(false);
  });
});

describe("applyPlanTags", () => {
  it("adds the tag for unlimited accounts and removes it for everyone else", async () => {
    const service = fakeService();
    const result = await applyPlanTags([row(1, "paid@example.com", "unlimited"), row(2, "ended@example.com", "free")], service);
    expect(service.setMemberTag).toHaveBeenCalledWith("paid@example.com", UNLIMITED_TAG, true);
    expect(service.setMemberTag).toHaveBeenCalledWith("ended@example.com", UNLIMITED_TAG, false);
    expect(result).toEqual({ tagged: 1, untagged: 1, notOnList: 0, failed: 0 });
  });

  it("skips accounts without an email and counts people who are not on the list", async () => {
    const service = fakeService({ "gone@example.com": { success: false, notOnList: true } });
    const result = await applyPlanTags([row(1, null, "unlimited"), row(2, "gone@example.com", "unlimited")], service);
    expect(service.setMemberTag).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tagged: 0, untagged: 0, notOnList: 1, failed: 0 });
  });

  it("never throws: failures are counted and the remaining accounts still get updated", async () => {
    const service = fakeService({
      "error@example.com": { success: false, error: "Mailchimp is down" },
      "throws@example.com": new Error("network"),
    });
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await applyPlanTags(
      [row(1, "error@example.com", "unlimited"), row(2, "throws@example.com", "unlimited"), row(3, "ok@example.com", "unlimited")],
      service,
    );
    expect(result).toEqual({ tagged: 1, untagged: 0, notOnList: 0, failed: 2 });
    expect(service.setMemberTag).toHaveBeenCalledWith("ok@example.com", UNLIMITED_TAG, true);
    errorLog.mockRestore();
  });

  it("does nothing when Mailchimp is not configured", async () => {
    const service = fakeService();
    service.isInitialized.mockReturnValue(false);
    const result = await applyPlanTags([row(1, "paid@example.com", "unlimited")], service);
    expect(service.setMemberTag).not.toHaveBeenCalled();
    expect(result).toEqual({ tagged: 0, untagged: 0, notOnList: 0, failed: 0 });
  });
});

describe("MailchimpService.setMemberTag", () => {
  beforeEach(() => {
    mailchimpClient.lists.updateListMemberTags.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("hashes the lower-cased, trimmed email the way Mailchimp expects", () => {
    expect(subscriberHash("  Test@Example.com ")).toBe("55502f40dc8b7c769880b10874abc9d0");
  });

  it("sets the tag status on the member", async () => {
    mailchimpClient.lists.updateListMemberTags.mockResolvedValue(undefined);
    const service = new MailchimpService("key-us20", "us20", "list1");
    await expect(service.setMemberTag("Test@Example.com", "Unlimited", true)).resolves.toEqual({ success: true });
    expect(mailchimpClient.lists.updateListMemberTags).toHaveBeenCalledWith("list1", "55502f40dc8b7c769880b10874abc9d0", {
      tags: [{ name: "Unlimited", status: "active" }],
    });
    await service.setMemberTag("test@example.com", "Unlimited", false);
    expect(mailchimpClient.lists.updateListMemberTags).toHaveBeenLastCalledWith("list1", expect.any(String), {
      tags: [{ name: "Unlimited", status: "inactive" }],
    });
  });

  it("reports people who are not on the list instead of throwing", async () => {
    mailchimpClient.lists.updateListMemberTags.mockRejectedValue(Object.assign(new Error("Not Found"), { status: 404 }));
    const service = new MailchimpService("key-us20", "us20", "list1");
    await expect(service.setMemberTag("test@example.com", "Unlimited", true)).resolves.toEqual({ success: false, notOnList: true });
  });

  it("reports other errors instead of throwing", async () => {
    mailchimpClient.lists.updateListMemberTags.mockRejectedValue(Object.assign(new Error("Server error"), { status: 500 }));
    const service = new MailchimpService("key-us20", "us20", "list1");
    await expect(service.setMemberTag("test@example.com", "Unlimited", true)).resolves.toEqual({
      success: false,
      error: "Server error",
    });
  });

  it("does not call Mailchimp when it is not configured", async () => {
    const service = new MailchimpService();
    await expect(service.setMemberTag("test@example.com", "Unlimited", true)).resolves.toEqual({
      success: false,
      error: "Service not initialized",
    });
    expect(mailchimpClient.lists.updateListMemberTags).not.toHaveBeenCalled();
  });
});
