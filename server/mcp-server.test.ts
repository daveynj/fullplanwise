// @vitest-environment node
import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storage: {} }));

import { htmlToMarkdown, registerMcpRoutes, searchLessons, type McpLessonStore } from "./mcp-server";

const summaries = [
  { id: 1, title: "Getting Ready for an English Job Interview", cefrLevel: "B1", publicCategory: "workplace-communication", publicSlug: "job-interview", publicLevel: "b1", tags: ["work"] },
  { id: 2, title: "Dealing with Lost Luggage", cefrLevel: "A2", publicCategory: "general-english", publicSlug: "lost-luggage", publicLevel: "a2", tags: ["travel", "a teacher's private label"] },
  { id: 3, title: "Interview Small Talk", cefrLevel: "B2", publicCategory: null, publicSlug: "interview-small-talk", publicLevel: "b2", tags: [] },
];

const lesson = {
  ...summaries[0],
  isPublic: true,
  topic: "for my student Anna, who failed her last interview",
  notes: "private teacher note",
  content: {
    sections: [
      { type: "warmup", title: "Warm-up", questions: ["Have you had a job interview?"] },
      { type: "reading", title: "Reading", paragraphs: ["Tom has an interview on Monday."] },
      { type: "quiz", title: "Quiz", questions: [{ question: "When is the interview?", options: ["Monday", "Friday"], correctAnswer: "Monday-is-the-answer" }] },
    ],
  },
};

const store = {
  getPublicLessonSummaries: vi.fn(async () => summaries),
  getLessonByPublicSlug: vi.fn(async (slug: string) => (slug === "job-interview" ? lesson : slug === "link-shared" ? { ...lesson, isPublic: false, isShared: true } : undefined)),
  getLesson: vi.fn(async () => undefined),
};

let server: Server;
let url: string;
let nextId = 1;

async function rpc(method: string, params?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  return { status: res.status, body: (await res.json()) as any };
}

async function call(name: string, args: unknown = {}) {
  const { body } = await rpc("tools/call", { name, arguments: args });
  return { text: body.result.content[0].text as string, isError: !!body.result.isError };
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerMcpRoutes(app, store as unknown as McpLessonStore);
  await new Promise<void>((resolve) => { server = app.listen(0, resolve); });
  url = `http://127.0.0.1:${(server.address() as any).port}/mcp`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => vi.clearAllMocks());

describe("connector for AI assistants (/mcp)", () => {
  it("answers the opening handshake with the version the assistant asked for", async () => {
    const { body } = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    expect(body.result.protocolVersion).toBe("2025-03-26");
    expect(body.result.capabilities.tools).toBeDefined();
    expect(body.result.serverInfo.name).toBe("planwise-esl");
  });

  it("offers a version it knows when the assistant asks for one it doesn't", async () => {
    const { body } = await rpc("initialize", { protocolVersion: "1999-01-01" });
    expect(body.result.protocolVersion).toMatch(/^20\d\d-\d\d-\d\d$/);
  });

  it("accepts notifications without replying", async () => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) });
    expect(res.status).toBe(202);
  });

  it("lists three read-only tools", async () => {
    const { body } = await rpc("tools/list");
    expect(body.result.tools.map((t: any) => t.name)).toEqual(["search_free_esl_lessons", "get_free_esl_lesson", "list_esl_lesson_levels_and_themes"]);
    for (const tool of body.result.tools) expect(tool.annotations.readOnlyHint).toBe(true);
  });

  it("finds lessons by topic and level, with links", async () => {
    const { text } = await call("search_free_esl_lessons", { query: "job interviews", level: "b1" });
    expect(text).toContain("https://planwiseesl.com/esl-lessons/b1/job-interview");
    expect(text).not.toContain("Lost Luggage");
    expect(text).not.toContain("Interview Small Talk"); // B2
  });

  it("never shows a teacher's own labels, only the curated themes", async () => {
    const { text } = await call("search_free_esl_lessons", { theme: "travel" });
    expect(text).toContain("Lost Luggage");
    expect(text).not.toContain("private label");
  });

  it("explains a bad level instead of failing", async () => {
    const { text, isError } = await call("search_free_esl_lessons", { level: "Z9" });
    expect(isError).toBe(true);
    expect(text).toContain("A1, A2, B1, B2, C1, C2");
  });

  it("opens a lesson from its link without answers, the teacher's request or notes", async () => {
    const { text, isError } = await call("get_free_esl_lesson", { lesson: "https://planwiseesl.com/esl-lessons/b1/job-interview?utm_source=x" });
    expect(isError).toBe(false);
    expect(text).toContain("# Getting Ready for an English Job Interview");
    expect(text).toContain("Tom has an interview on Monday.");
    expect(text).toContain("When is the interview?");
    expect(text).not.toContain("Monday-is-the-answer");
    expect(text).not.toContain("Anna");
    expect(text).not.toContain("private teacher note");
  });

  it("does not open a lesson that is only shared by private link", async () => {
    const { text, isError } = await call("get_free_esl_lesson", { lesson: "link-shared" });
    expect(isError).toBe(true);
    expect(text).not.toContain("Tom has an interview");
  });

  it("rejects things that are not lesson links", async () => {
    expect((await call("get_free_esl_lesson", { lesson: "/esl-lessons/b1/../../etc/passwd!" })).isError).toBe(true);
    expect(store.getLessonByPublicSlug).not.toHaveBeenCalled();
  });

  it("counts lessons by level and theme", async () => {
    const { text } = await call("list_esl_lesson_levels_and_themes");
    expect(text).toContain("3 free lessons");
    expect(text).toContain("B1 Intermediate: 1 lesson ");
    expect(text).toContain("https://planwiseesl.com/esl-lessons/topics/travel");
  });

  it("reads the lesson list once for several requests", async () => {
    await call("search_free_esl_lessons", { query: "luggage" });
    await call("list_esl_lesson_levels_and_themes");
    expect(store.getPublicLessonSummaries.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("reports unknown tools and methods as errors", async () => {
    expect((await rpc("tools/call", { name: "delete_everything" })).body.error.code).toBe(-32602);
    expect((await rpc("resources/list")).body.error.code).toBe(-32601);
  });

  it("only offers POST", async () => {
    const res = await fetch(url);
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toContain("POST");
  });
});

describe("searchLessons", () => {
  it("puts lessons matching more of the words first", () => {
    const found = searchLessons(summaries, { query: "job interview" });
    expect(found.map((l) => l.id)).toEqual([1, 3]);
  });
  it("returns everything in the filters when there are no topic words", () => {
    expect(searchLessons(summaries, { query: "free ESL lessons", level: "A2" }).map((l) => l.id)).toEqual([2]);
  });
});

describe("htmlToMarkdown", () => {
  it("keeps headings, numbered questions and nested options", () => {
    const md = htmlToMarkdown("<section><h2>Quiz</h2><ol><li>Tom &amp; Ann?<ul><li>Yes</li><li>No</li></ul></li><li><strong>Why</strong>?</li></ol></section>");
    expect(md).toBe("## Quiz\n\n1. Tom & Ann?\n  - Yes\n  - No\n2. **Why**?");
  });
});
