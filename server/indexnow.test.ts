// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  submitToIndexNow,
  notifyIndexNow,
  toIndexNowUrls,
  lessonIndexNowPaths,
  blogIndexNowPaths,
  INDEXNOW_ENDPOINT,
} from "./indexnow";

const KEY = "0123456789abcdef0123456789abcdef";
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("INDEXNOW_KEY", KEY);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("URL helpers", () => {
  it("builds the lesson, browse and level pages for a lesson", () => {
    expect(lessonIndexNowPaths({ id: 42, cefrLevel: "B2" })).toEqual(["/lessons/42", "/esl-lessons", "/esl-lessons/b2"]);
  });

  it("builds the post and blog index pages for a post", () => {
    expect(blogIndexNowPaths({ slug: "hello" })).toEqual(["/blog/hello", "/blog"]);
  });

  it("makes absolute planwiseesl.com URLs, dedupes, and drops other hosts", () => {
    expect(toIndexNowUrls(["/a", "/a", "b", "https://planwiseesl.com/c", "https://evil.com/x", ""])).toEqual([
      "https://planwiseesl.com/a",
      "https://planwiseesl.com/b",
      "https://planwiseesl.com/c",
    ]);
  });
});

describe("submitToIndexNow", () => {
  it("POSTs the IndexNow JSON payload", async () => {
    const result = await submitToIndexNow(["/lessons/1", "/esl-lessons"]);
    expect(result).toEqual({ ok: true, submitted: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      host: "planwiseesl.com",
      key: KEY,
      keyLocation: `https://planwiseesl.com/${KEY}.txt`,
      urlList: ["https://planwiseesl.com/lessons/1", "https://planwiseesl.com/esl-lessons"],
    });
  });

  it("treats 202 Accepted as success", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 202 }));
    expect(await submitToIndexNow(["/x"])).toEqual({ ok: true, submitted: 1 });
  });

  it("reports an error status instead of throwing", async () => {
    fetchMock.mockResolvedValue(new Response("Key not valid", { status: 403 }));
    const result = await submitToIndexNow(["/x"]);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("403");
  });

  it("reports a network failure instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const result = await submitToIndexNow(["/x"]);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("ECONNRESET");
  });

  it("does nothing outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await submitToIndexNow(["/x"]);
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing without a valid key", async () => {
    vi.stubEnv("INDEXNOW_KEY", "");
    expect((await submitToIndexNow(["/x"])).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("notifyIndexNow", () => {
  it("returns immediately and swallows failures", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    expect(() => notifyIndexNow(["/x"])).not.toThrow();
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
  });

  it("is a no-op outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    notifyIndexNow(["/x"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
