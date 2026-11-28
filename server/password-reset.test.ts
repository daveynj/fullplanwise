// @vitest-environment node
/**
 * Forgotten passwords. Until December 2026 the reset page said "a reset link
 * has been sent" but no email was ever sent, so a teacher who forgot their
 * password could not get back in. These tests cover the real routes: the
 * email goes out with a working link, the answer never reveals whether an
 * address has an account, and setting the password signs the teacher in.
 */
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUsersByEmail: vi.fn(),
  getUserByUsername: vi.fn(),
  getUser: vi.fn(),
  getUserByResetToken: vi.fn(),
  updateUser: vi.fn(),
  updateLastLogin: vi.fn(),
  sendMail: vi.fn(),
  configured: true,
}));
vi.mock("./storage", () => ({ storage: mocks }));
vi.mock("./services/mailchimp.service", () => ({ mailchimpService: { addMember: vi.fn() } }));
vi.mock("./mailer", async (original) => ({
  ...await original<typeof import("./mailer")>(),
  mailConfig: () => (mocks.configured ? { host: "h", port: 465, user: "dave@planwiseesl.com", pass: "p", from: "PlanWise ESL <dave@planwiseesl.com>" } : null),
  sendMail: mocks.sendMail,
}));
import { setupAuth } from "./auth";
import { buildPasswordResetEmail, firstName, RecentLimit } from "./password-reset-email";

const teacher = {
  id: 7, username: "maria_7", email: "maria@example.test", fullName: "Maria Silva", password: "x.y",
  isAdmin: false, subscriptionTier: "free", resetPasswordToken: null as string | null, resetPasswordExpires: null as Date | null,
};
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  setupAuth(app);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured = true;
  mocks.sendMail.mockResolvedValue(undefined);
  mocks.getUsersByEmail.mockResolvedValue([]);
  mocks.getUserByUsername.mockResolvedValue(undefined);
  mocks.getUser.mockResolvedValue(teacher);
  mocks.getUserByResetToken.mockResolvedValue([]);
  mocks.updateUser.mockImplementation(async (_id, updates) => ({ ...teacher, ...updates }));
  mocks.updateLastLogin.mockResolvedValue(undefined);
});
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const forgot = (email: unknown) => post("/api/forgot-password", { email });
const SENT = "If an account with that email exists, a password reset link has been sent.";

describe("asking for a reset link", () => {
  it("emails the teacher a link that works for an hour, and never returns the link itself", async () => {
    mocks.getUsersByEmail.mockResolvedValue([teacher]);
    const res = await forgot("  Maria@Example.test ");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: SENT });
    // Capital letters and spaces are the storage lookup's job; it gets the trimmed address.
    expect(mocks.getUsersByEmail).toHaveBeenCalledWith("Maria@Example.test");

    const [id, saved] = mocks.updateUser.mock.calls[0];
    expect(id).toBe(7);
    expect(saved.resetPasswordToken).toMatch(/^[0-9a-f-]{36}$/);
    const minutes = (saved.resetPasswordExpires.getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(58);
    expect(minutes).toBeLessThanOrEqual(60);

    expect(mocks.sendMail).toHaveBeenCalledOnce();
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toBe("maria@example.test"); // the stored address, not what was typed
    expect(mail.text).toContain(`https://planwiseesl.com/reset-password/${saved.resetPasswordToken}`);
    expect(mail.html).toContain(`https://planwiseesl.com/reset-password/${saved.resetPasswordToken}`);
    expect(mail.text).toContain("Hi Maria,");
  });

  it("gives the same answer for an address with no account, and sends nothing", async () => {
    const res = await forgot("nobody@example.test");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: SENT });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("does not look up something that is not an email address", async () => {
    const res = await forgot("maria@example.test\r\nBcc: x@y.co");
    expect(res.status).toBe(200);
    expect(mocks.getUsersByEmail).not.toHaveBeenCalled();
    expect((await forgot("")).status).toBe(400);
  });

  it("sends at most three emails an hour to one address, still answering the same", async () => {
    const other = { ...teacher, id: 8, email: "ken@example.test", fullName: "Ken" };
    mocks.getUsersByEmail.mockResolvedValue([other]);
    for (let i = 0; i < 4; i++) {
      const res = await forgot(i % 2 ? "KEN@example.test" : "ken@example.test");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: SENT });
    }
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
  });

  it("still answers when email sending is not set up or fails, and says so in the server log only", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUsersByEmail.mockResolvedValue([{ ...teacher, id: 9, email: "ana@example.test" }]);
    mocks.configured = false;
    expect(await (await forgot("ana@example.test")).json()).toEqual({ message: SENT });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(logged.mock.calls.flat().join(" ")).toContain("NOT sent");

    mocks.configured = true;
    mocks.sendMail.mockRejectedValue(new Error("Email not sent (sign-in, 535): bad credentials"));
    expect(await (await forgot("ana@example.test")).json()).toEqual({ message: SENT });
    await new Promise((r) => setTimeout(r, 10));
    expect(logged.mock.calls.flat().join(" ")).toContain("Reset email FAILED for user 9");
    // The link is never written to the log.
    expect(logged.mock.calls.flat().join(" ")).not.toContain("/reset-password/");
    logged.mockRestore();
  });
});

describe("setting the new password", () => {
  const valid = { ...teacher, resetPasswordToken: "tok-1", resetPasswordExpires: new Date(Date.now() + 30 * 60000) };

  it("saves the password, uses the link up and signs the teacher in", async () => {
    mocks.getUserByResetToken.mockResolvedValue([valid]);
    const res = await post("/api/reset-password/tok-1", { password: "new-password-1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Password successfully reset", signedIn: true });

    const [id, saved] = mocks.updateUser.mock.calls[0];
    expect(id).toBe(7);
    expect(saved.resetPasswordToken).toBeNull();
    expect(saved.resetPasswordExpires).toBeNull();
    expect(saved.password).not.toContain("new-password-1"); // stored hashed

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    const me = await fetch(`${base}/api/user`, { headers: { Cookie: cookie!.split(";")[0] } });
    expect(me.status).toBe(200);
    expect((await me.json()).email).toBe("maria@example.test");
  });

  it("refuses a used, unknown or expired link and a password that is too short", async () => {
    expect((await post("/api/reset-password/unknown", { password: "new-password-1" })).status).toBe(400);
    mocks.getUserByResetToken.mockResolvedValue([{ ...valid, resetPasswordExpires: new Date(Date.now() - 1000) }]);
    expect((await post("/api/reset-password/tok-1", { password: "new-password-1" })).status).toBe(400);
    mocks.getUserByResetToken.mockResolvedValue([valid]);
    const short = await post("/api/reset-password/tok-1", { password: "short" });
    expect(short.status).toBe(400);
    expect((await short.json()).message).toContain("8 characters");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});

describe("the admin email test", () => {
  it("is for signed-in admins only", async () => {
    expect((await post("/api/admin/mail-test", {})).status).toBe(401);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});

describe("too many requests from one visitor", () => {
  it("is refused after ten in an hour", async () => {
    // Earlier tests in this file already used some of the ten.
    let refused: Response | undefined;
    for (let i = 0; i < 11 && !refused; i++) {
      const res = await forgot(`visitor${i}@example.test`);
      if (res.status === 429) refused = res;
    }
    expect(refused?.status).toBe(429);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});

describe("the reset email", () => {
  it("is short, has the link twice (button and plain) and says what happens next", () => {
    const mail = buildPasswordResetEmail("t@example.test", "Tom O'Neil", "https://planwiseesl.com/reset-password/abc");
    expect(mail.subject).toBe("Set a new PlanWise ESL password");
    expect(mail.text).toContain("Hi Tom,");
    expect(mail.text).toContain("60 minutes");
    expect(mail.text).toContain("If you didn't ask for this, ignore this email");
    expect(mail.html!.match(/https:\/\/planwiseesl\.com\/reset-password\/abc/g)).toHaveLength(3);
    expect(mail.html).toContain("Set a new password");
  });

  it("greets without a name when the name isn't a plain first name", () => {
    expect(firstName("maria@example.test")).toBe("");
    expect(firstName("<script>")).toBe("");
    expect(firstName(null)).toBe("");
    expect(firstName("  Zoë Müller")).toBe("Zoë");
    expect(buildPasswordResetEmail("t@example.test", "", "https://x.test/r").text).toContain("Hi there,");
  });
});

describe("RecentLimit", () => {
  it("allows a few events per key in the window, then again once the window has passed", () => {
    const limit = new RecentLimit(2, 1000);
    expect(limit.allow("a", 0)).toBe(true);
    expect(limit.allow("a", 100)).toBe(true);
    expect(limit.allow("a", 200)).toBe(false);
    expect(limit.allow("b", 200)).toBe(true);
    expect(limit.allow("a", 1101)).toBe(true);
  });
});
