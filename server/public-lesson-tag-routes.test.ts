// @vitest-environment node
import express from "express";
import session from "express-session";
import type { Server } from "http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IStorage } from "./storage";
import { registerPublicLessonTagRoutes } from "./public-lesson-tag-routes";
import { publicTagFingerprint, publicTagEditFingerprint, TagReviewConflict } from "./public-lesson-tags";

const source = { id: 5, title: "Travel plans", cefrLevel: "B1", publicReading: "We travel to a hotel." };
const store = {
  getUser: vi.fn(),
  getPublicTagCandidates: vi.fn(),
  applyReviewedPublicTags: vi.fn(),
  findPublicTagLessons: vi.fn(),
  getPublicTagEditSource: vi.fn(),
  editReviewedPublicTags: vi.fn(),
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
  store.findPublicTagLessons.mockResolvedValue([{ ...source, tags: ["travel"] }]);
  store.getPublicTagEditSource.mockResolvedValue({ ...source, tags: ["travel"] });
  store.editReviewedPublicTags.mockResolvedValue(undefined);
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

describe("reviewed editing of public tags", () => {
  const editBody = (reviewToken: string, tags: string[] = ["culture"]) => ({ id: source.id, reviewed: true, reviewToken, tags });
  async function editPreview() { return (await post("edit-preview", { id: source.id })).body; }

  it.each(["find", "edit-preview", "edit"])("requires authentication and current admin access for %s", async (path) => {
    user = null;
    expect((await post(path, {})).status).toBe(401);
    user = 1;
    store.getUser.mockResolvedValue({ isAdmin: false });
    expect((await post(path, {})).status).toBe(403);
    expect(store.findPublicTagLessons).not.toHaveBeenCalled();
    expect(store.getPublicTagEditSource).not.toHaveBeenCalled();
    expect(store.editReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("finds a bounded page, returning only public fields and curated current labels", async () => {
    store.findPublicTagLessons.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({
      ...source, id: i + 20, tags: ["travel", "PRIVATE LABEL"], topic: "PRIVATE REQUEST",
    })));
    const result = await post("find", { search: "  Travel  ", afterId: 19 });
    expect(result.status).toBe(200);
    expect(result.cache).toBe("no-store");
    expect(store.findPublicTagLessons).toHaveBeenCalledWith("Travel", 19, 11);
    expect(result.body.lessons).toHaveLength(10);
    expect(result.body.nextAfterId).toBe(29);
    expect(result.body.lessons[0]).toEqual({ id: 20, title: source.title, cefrLevel: "B1", tags: ["travel"] });
    expect(JSON.stringify(result.body)).not.toContain("PRIVATE");
  });

  it("previews only allowlisted public source, bounds the excerpt, and never writes", async () => {
    store.getPublicTagEditSource.mockResolvedValue({
      ...source, publicReading: "x".repeat(1000), tags: ["travel", "PRIVATE LABEL"],
      topic: "PRIVATE REQUEST", notes: "PRIVATE NOTE",
    });
    const result = await post("edit-preview", { id: source.id });
    expect(result.cache).toBe("no-store");
    expect(result.body).toMatchObject({ tags: ["travel"], hasOtherTags: true, publicExcerpt: "x".repeat(900) });
    expect(Object.keys(result.body).sort()).toEqual(["id", "title", "cefrLevel", "publicExcerpt", "tags", "hasOtherTags", "reviewToken", "expiresAt"].sort());
    expect(JSON.stringify(result.body)).not.toContain("PRIVATE");
    expect(store.editReviewedPublicTags).not.toHaveBeenCalled();
  });

  it.each([{ tags: ["culture"] }, { tags: [] }])("saves explicitly reviewed replacements including clearing: %j", async ({ tags }) => {
    const review = await editPreview();
    const result = await post("edit", editBody(review.reviewToken, tags));
    expect(result.status).toBe(200);
    expect(result.body.tags).toEqual(tags);
    expect(store.editReviewedPublicTags).toHaveBeenCalledWith({
      id: source.id, tags, fingerprint: publicTagEditFingerprint({ ...source, tags: ["travel"] }),
    });
    expect((await post("edit", editBody(review.reviewToken, tags))).status).toBe(409);
    expect(store.editReviewedPublicTags).toHaveBeenCalledTimes(1);
    expect(store.applyReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("keeps backfill and edit reviews separate", async () => {
    const edit = await editPreview();
    await preview();
    expect((await post("edit", editBody(edit.reviewToken))).status).toBe(200);
  });

  it("rejects missing, wrong-session, replaced, wrong-ID and expired reviews", async () => {
    expect((await post("edit", editBody("a".repeat(48)))).status).toBe(409);
    const first = await editPreview();
    expect((await post("edit", editBody(first.reviewToken), false)).status).toBe(409);
    const latest = await editPreview();
    expect((await post("edit", editBody(first.reviewToken))).status).toBe(409);
    expect((await post("edit", { ...editBody(latest.reviewToken), id: 6 })).status).toBe(409);
    const time = vi.spyOn(Date, "now").mockReturnValue(latest.expiresAt + 1);
    try {
      expect((await post("edit", editBody(latest.reviewToken))).status).toBe(409);
    } finally { time.mockRestore(); }
    expect(store.editReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("rejects unchecked, unknown, duplicate or excessive tags before writing", async () => {
    const review = await editPreview();
    for (const invalid of [
      { ...editBody(review.reviewToken), reviewed: false },
      { ...editBody(review.reviewToken), reviewed: undefined },
      editBody(review.reviewToken, ["private label"]),
      editBody(review.reviewToken, ["travel", "travel"]),
      editBody(review.reviewToken, ["travel", "food", "work", "health", "money"]),
      { ...editBody(review.reviewToken), topic: "private request" },
    ]) {
      expect((await post("edit", invalid)).status).toBe(400);
    }
    expect(store.editReviewedPublicTags).not.toHaveBeenCalled();
  });

  it("reports missing/nonpublic lessons and stale writes without claiming success", async () => {
    store.getPublicTagEditSource.mockResolvedValueOnce(undefined);
    expect((await post("edit-preview", { id: source.id })).status).toBe(404);
    const review = await editPreview();
    store.editReviewedPublicTags.mockRejectedValueOnce(new TagReviewConflict("Tags changed; review again."));
    expect((await post("edit", editBody(review.reviewToken))).status).toBe(409);
  });
});

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
