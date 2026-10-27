// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { readFile } from "node:fs/promises";

const { getLesson, downloadStoredImage } = vi.hoisted(() => ({
  getLesson: vi.fn(),
  downloadStoredImage: vi.fn(),
}));
vi.mock("./storage", () => ({ storage: { getLesson } }));
vi.mock("./services/image-storage", () => ({ downloadStoredImage }));
import { serveLessonShareImage } from "./lesson-share-image";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=", "base64");
let server: Server;
let baseUrl: string;
beforeAll(async () => {
  const app = express();
  app.get("/api/lessons/:id/share-image", serveLessonShareImage);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
});
beforeEach(() => {
  vi.clearAllMocks();
  getLesson.mockResolvedValue({ id: 42, isPublic: true, isShared: false, content: { sections: [] } });
});
const request = (id = "42") => fetch(`${baseUrl}/api/lessons/${id}/share-image?v=1`);

describe("lesson share images", () => {
  it.each([
    ["public", true, false],
    ["shared by link", false, true],
  ])("returns the lesson's inline PNG for logged-out visitors to a %s lesson", async (_label, isPublic, isShared) => {
    getLesson.mockResolvedValue({
      id: 42, isPublic, isShared,
      content: { sections: [{ type: "vocabulary", words: [{ imageBase64: PNG.toString("base64") }] }] },
    });
    const res = await request();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    expect(res.headers.get("cache-control")).toContain("public");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(PNG);
  });

  it.each(["unassigned", "21", "42"])("supports stored image scope %s without an authenticated session", async scope => {
    getLesson.mockResolvedValue({
      id: 42, isShared: true,
      content: JSON.stringify(JSON.stringify({
        sections: [{ words: [{ imageUrl: `/api/images/lesson-images/${scope}/abc.png` }] }],
      })),
    });
    downloadStoredImage.mockResolvedValue({ buffer: PNG, mime: "image/png" });
    const res = await request();
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer())).toEqual(PNG);
    expect(downloadStoredImage).toHaveBeenCalledWith(`lesson-images/${scope}/abc.png`);
  });

  it("preserves the MIME type of a stored JPEG", async () => {
    getLesson.mockResolvedValue({
      id: 42, isPublic: true,
      content: { sections: [{ imageUrl: "/api/images/lesson-images/42/abc.jpg" }] },
    });
    downloadStoredImage.mockResolvedValue({ buffer: Buffer.from("/9j/", "base64"), mime: "image/jpeg" });
    const res = await request();
    expect(res.headers.get("content-type")).toContain("image/jpeg");
  });

  it("uses the new PNG fallback, not the old homepage graphic, for an imageless lesson", async () => {
    const res = await request();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes).toEqual(await readFile("public/images/lesson-share-card.png"));
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  });

  it("does not expose images from a missing or unshared private lesson", async () => {
    getLesson.mockResolvedValue({ id: 42, isPublic: false, isShared: false, content: { sections: [{ imageBase64: PNG.toString("base64") }] } });
    expect((await request()).status).toBe(404);
    getLesson.mockResolvedValue(undefined);
    expect((await request()).status).toBe(404);
    expect(downloadStoredImage).not.toHaveBeenCalled();
  });

  it.each(["abc", "42abc", "99999999999999999999"])("rejects invalid id %s before loading content", async id => {
    expect((await request(id)).status).toBe(404);
    expect(getLesson).not.toHaveBeenCalled();
  });

  it("does not fetch external URLs, unsafe keys, or images outside lesson sections", async () => {
    getLesson.mockResolvedValue({
      id: 42, isPublic: true,
      content: {
        teacherNotes: { imageBase64: PNG.toString("base64") },
        sections: [{ imageUrl: "https://example.com/private.png" }, { imageUrl: "/api/images/lesson-images/../private.png" }],
      },
    });
    const res = await request();
    expect(Buffer.from(await res.arrayBuffer())).toEqual(await readFile("public/images/lesson-share-card.png"));
    expect(downloadStoredImage).not.toHaveBeenCalled();
  });

  it("uses the inline backup if App Storage is unavailable", async () => {
    getLesson.mockResolvedValue({
      id: 42, isPublic: true,
      content: { sections: [{ imageUrl: "/api/images/lesson-images/42/abc.png", imageBase64: PNG.toString("base64") }] },
    });
    downloadStoredImage.mockRejectedValue(new Error("storage unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await request();
    expect(Buffer.from(await res.arrayBuffer())).toEqual(PNG);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns retryable 503, not a homepage preview, if the lesson lookup fails", async () => {
    getLesson.mockRejectedValue(new Error("database unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request();
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("120");
    error.mockRestore();
  });
});
