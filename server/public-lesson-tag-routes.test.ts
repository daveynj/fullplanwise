// @vitest-environment node
import express from "express";
import session from "express-session";
import type { Server } from "http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IStorage } from "./storage";
import { registerPublicLessonTagRoutes } from "./public-lesson-tag-routes";
import { publicTagFingerprint, TagReviewConflict } from "./public-lesson-tags";

const source = { id: 5, title: "Travel plans", cefrLevel: "B1", publicReading: "We travel to a hotel." };
const store = {
  getUser: vi.fn(),
  getPublicTagCandidates: vi.fn(),
  applyReviewedPublicTags: vi.fn(),
};
let server: Server;
let url: string;
let user: number | null = 1;
let cookie = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test-only-session-secret", resave: false, saveUninitialized: false }));
  app.use((req: any, _res, next) => { req.user = user ? { id: user } : undefined; next(); });
  registerPublicLessonTagRoutes(app, store as unknown as IStorage, (req, res, next) => {
    if (!req.user) return void res.status(401).json({ message: "Sign in" });
    next();
  });
  server = await new Promise<Server>((resolve) => { const running = app.listen(0, () => resolve(running)); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing port");
  url = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });
beforeEach(() => {
  vi.resetAllMocks();
  cookie = "";
  user = 1;
  store.getUser.mockResolvedValue({ id: 1, isAdmin: true });
  store.getPublicTagCandidates.mockResolvedValue([source]);
  store.applyReviewedPublicTags.mockResolvedValue(1);
});

async function post(path: string, body: unknown, useCookie = true) {
  const res = await fetch(`${url}/api/admin/public-lesson-tags/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(useCookie && cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: res.status, body: await res.json(), cache: res.headers.get("cache-control") };
}
async function preview() { return (await post("preview", {})).body; }
function approve(reviewToken: string, id = source.id) {
  return { reviewToken, approvals: [{ id, reviewed: true, tags: ["food"] }] };
}

describe("admin public tag review", () => {
  it("requires sign-in and current admin privileges on both operations", async () => {
    user = null;
    expect((await post("preview", {})).status).toBe(401);
    expect((await post("apply", approve("a".repeat(48)))).status).toBe(401);
    user = 1;
    store.getUser.mockResolvedValue({ id: 1, isAdmin: false });
    expect((await post("preview", {})).status).toBe(403);
    expect((await post("apply", approve("a".repeat(48)))).status).toBe(403);
    expect(store.getPublicTagCandidates).not.toHaveBeenCalled();
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("previews without writing, strips unexpected private fields and is not cacheable", async () => {
    store.getPublicTagCandidates.mockResolvedValue([{ ...source, topic: "private student data", notes: "private note" }]);
    const result = await post("preview", {});
    expect(result.status).toBe(200);
    expect(result.cache).toBe("no-store");
    expect(result.body.lessons[0]).toMatchObject({ id: 5, title: source.title, publicExcerpt: source.publicReading, suggestedTags: ["travel"] });
    expect(JSON.stringify(result.body)).not.toContain("private");
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("paginates all untagged lessons, including lessons without suggestions", async () => {
    store.getPublicTagCandidates.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({
      ...source, id: i + 10, title: "An unusual day", publicReading: "",
    })));
    const result = await post("preview", { afterId: 9 });
    expect(store.getPublicTagCandidates).toHaveBeenCalledWith(9, 11);
    expect(result.body.lessons).toHaveLength(10);
    expect(result.body.nextAfterId).toBe(19);
    expect(result.body.lessons[0].suggestedTags).toEqual([]);
  });

  it("saves only explicitly approved IDs and accepts edited curated tags", async () => {
    store.getPublicTagCandidates.mockResolvedValue([source, { ...source, id: 6 }]);
    const review = await preview();
    expect((await post("apply", approve(review.reviewToken))).body).toEqual({ updated: 1 });
    expect(store.applyReviewedPublicTags).toHaveBeenCalledWith([{ id: 5, tags: ["food"], fingerprint: publicTagFingerprint(source) }]);
    expect((await post("apply", approve(review.reviewToken))).status).toBe(409);
  });

  it("rejects IDs that were not previewed, before any write", async () => {
    const review = await preview();
    expect((await post("apply", approve(review.reviewToken, 99))).status).toBe(409);
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("rejects unchecked approvals and arbitrary tags", async () => {
    const review = await preview();
    for (const tags of [[], ["arbitrary"]]) {
      expect((await post("apply", { reviewToken: review.reviewToken, approvals: [{ id: 5, reviewed: true, tags }] })).status).toBe(400);
    }
    expect((await post("apply", { reviewToken: review.reviewToken, approvals: [{ id: 5, tags: ["travel"] }] })).status).toBe(400);
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("binds review tokens to the admin session and the most recent preview", async () => {
    const first = await preview();
    expect((await post("apply", approve(first.reviewToken), false)).status).toBe(409);
    await preview();
    expect((await post("apply", approve(first.reviewToken))).status).toBe(409);
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("expires previews after 30 minutes", async () => {
    const review = await preview();
    const clock = vi.spyOn(Date, "now").mockReturnValue(review.expiresAt + 1);
    try {
      expect((await post("apply", approve(review.reviewToken))).status).toBe(409);
      expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
    } finally { clock.mockRestore(); }
  });

  it("reports stale/removed/tagged lessons instead of overwriting them", async () => {
    const review = await preview();
    store.applyReviewedPublicTags.mockRejectedValue(new TagReviewConflict("Lesson changed; preview again."));
    const result = await post("apply", approve(review.reviewToken));
    expect(result.status).toBe(409);
    expect(result.body.message).toContain("preview again");
  });
});
