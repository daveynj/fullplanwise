import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import type { Express, Request, Response } from "express";

vi.mock("./storage", () => ({ storage: {} }));
vi.mock("./blog-prerender", () => ({ injectBlogPrerender: vi.fn() }));
import { injectBlogPrerender } from "./blog-prerender";
import { serveStatic } from "./vite";

afterEach(() => vi.restoreAllMocks());

describe("production blog HTML serving", () => {
  function setup() {
    const template = fs.readFileSync("client/index.html", "utf8");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(template);
    const routes = new Map<string, Function>();
    const app = {
      get: (path: string, handler: Function) => { routes.set(path, handler); },
      use: vi.fn(),
    };
    serveStatic(app as unknown as Express);
    const res = {
      locals: { blogPost: { slug: "speaking", isPublished: true } },
      status: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), end: vi.fn(),
    };
    const next = vi.fn();
    return { handler: routes.get("/blog/:slug")!, res, next, template };
  }

  it("serves article HTML for shared URLs with tracking parameters", async () => {
    const { handler, res, next, template } = setup();
    vi.mocked(injectBlogPrerender).mockResolvedValue("<html>Article metadata</html>");
    await handler({ originalUrl: "/blog/speaking?utm_source=social" } as Request, res as unknown as Response, next);
    expect(injectBlogPrerender).toHaveBeenCalledWith(template, "/blog/speaking", res.locals.blogPost);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalledWith("<html>Article metadata</html>");
    expect(next).not.toHaveBeenCalled();
  });

  it("never falls back to a cacheable homepage preview when article prerendering fails", async () => {
    const { handler, res, next } = setup();
    vi.mocked(injectBlogPrerender).mockResolvedValue(null);
    await handler({ originalUrl: "/blog/speaking/" } as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ "Cache-Control": "no-store", "Retry-After": "120" }));
    expect(res.end.mock.calls[0][0]).toContain('name="robots" content="noindex"');
    expect(res.end.mock.calls[0][0]).not.toContain('og:url');
    expect(next).not.toHaveBeenCalled();
  });
});
