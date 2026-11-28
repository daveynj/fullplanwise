import type { Express, Request, Response } from "express";
import { lessonPath } from "@shared/lesson-url";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { CEFR_LEVEL_NAMES } from "@shared/lesson-public-metadata";
import { PUBLIC_LESSON_TAGS, publicTags, type PublicLessonTag } from "@shared/public-lesson-tags";
import { siteFacts, priceText, trialText } from "@shared/site-facts";
import { sectionsOf, sectionsHtml } from "./lesson-prerender";

/**
 * A connector AI assistants (Claude, ChatGPT and other MCP clients) can add
 * at https://planwiseesl.com/mcp to search and open the free lesson library.
 *
 * It is read-only and needs no login. It shows exactly what the public lesson
 * pages show: lesson text comes from the same renderer as those pages
 * (sectionsHtml), so quiz answers, the teacher's original request and private
 * notes never leave the app, and only lessons published to the library
 * (isPublic) can be opened.
 *
 * The protocol is MCP over "Streamable HTTP" without sessions: each POST is
 * one JSON-RPC message (or batch) and gets a plain JSON reply.
 */

const BASE_URL = siteFacts.url;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const THEME_KEYS = Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[];
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const CACHE_MS = 60_000;
const MAX_CACHED_LESSONS = 100;

interface LessonSummary {
  id: number;
  title: string;
  cefrLevel: string;
  publicCategory: string | null;
  publicSlug?: string | null;
  publicLevel?: string | null;
  tags?: string[] | null;
}

interface PublicLesson extends LessonSummary {
  isPublic: boolean;
  content: unknown;
}

/** The two storage reads the connector needs. */
export interface McpLessonStore {
  getPublicLessonSummaries(cefrLevel?: string): Promise<LessonSummary[]>;
  getLessonByPublicSlug(slug: string): Promise<PublicLesson | undefined>;
  getLesson(id: number): Promise<PublicLesson | undefined>;
}

const categoryLabel = (category: string | null | undefined): string =>
  (category && (PUBLIC_LIBRARY_LABELS as Record<string, string>)[category]) || "";

const lessonUrl = (lesson: LessonSummary): string => `${BASE_URL}${lessonPath(lesson)}`;

// ---------------------------------------------------------------------------
// Lesson text
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  "&mdash;": "—", "&middot;": "·", "&rsaquo;": "›", "&nbsp;": " ",
};

/** Turns the lesson pages' own HTML (a small, fixed set of tags) into Markdown. */
export function htmlToMarkdown(html: string): string {
  let out = "";
  const lists: Array<{ ordered: boolean; n: number }> = [];
  for (const m of html.matchAll(/<(\/?)([a-z0-9]+)[^>]*>|([^<]+)/gi)) {
    if (m[3] !== undefined) {
      const text = m[3].replace(/&[a-z#0-9]+;/gi, (ent) => ENTITIES[ent] ?? ent);
      // Line breaks between tags are layout, not lesson text.
      out += text.trim() === "" ? (text.includes("\n") ? "" : " ") : text;
      continue;
    }
    const close = m[1] === "/";
    const inList = lists.length > 0;
    switch (m[2].toLowerCase()) {
      case "h1":
      case "h2":
        out += close ? "\n\n" : "\n\n## ";
        break;
      case "h3":
        out += close ? "\n\n" : "\n\n### ";
        break;
      case "p":
        if (inList) {
          // A paragraph inside a list item stays on the item's own lines.
          if (!close && !/(?:- |\d\. )$/.test(out)) out += `\n${"  ".repeat(lists.length)}`;
        } else {
          out += "\n\n";
        }
        break;
      case "ul":
      case "ol":
        if (close) {
          lists.pop();
          if (!lists.length) out += "\n\n";
        } else {
          lists.push({ ordered: m[2].toLowerCase() === "ol", n: 0 });
        }
        break;
      case "li":
        if (!close && inList) {
          const list = lists[lists.length - 1];
          out += `\n${"  ".repeat(lists.length - 1)}${list.ordered ? `${++list.n}. ` : "- "}`;
        }
        break;
      case "strong":
      case "b":
        out += "**";
        break;
      case "em":
      case "i":
        out += "*";
        break;
      default:
        break;
    }
  }
  return out
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function lessonMarkdown(lesson: PublicLesson): string {
  const level = lesson.cefrLevel;
  const levelName = CEFR_LEVEL_NAMES[level];
  const label = categoryLabel(lesson.publicCategory);
  const themes = publicTags(lesson.tags).map((t) => PUBLIC_LESSON_TAGS[t]);
  const url = lessonUrl(lesson);
  const facts = [
    `CEFR ${level}${levelName ? ` (${levelName})` : ""}`,
    label,
    themes.length ? `Themes: ${themes.join(", ")}` : "",
  ].filter(Boolean);
  return [
    `# ${lesson.title}`,
    facts.join(" · "),
    `Free lesson page with pictures, full-screen teaching mode and a printable Vocabulary Review PDF (no login): ${url}`,
    htmlToMarkdown(sectionsHtml(sectionsOf(lesson.content))),
    "---",
    `Source: ${siteFacts.brand}, by ${siteFacts.founder} (${siteFacts.founderRole}). ${url}`,
    `This text leaves out quiz answers; the interactive lesson page checks them. To get this topic at another level or adapted to a student, teachers can make their own lesson at ${BASE_URL} (${trialText}, then ${priceText}).`,
  ].join("\n\n");
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "an", "and", "about", "esl", "efl", "english", "for", "free", "in", "lesson", "lessons", "my", "of", "on",
  "plan", "plans", "student", "students", "the", "to", "with", "class", "conversation", "topic",
]);

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    // "interviews" should find "interview".
    .map((t) => (t.length > 3 ? t.replace(/(es|s)$/, "") : t));
}

function searchText(lesson: LessonSummary): string {
  const tags = publicTags(lesson.tags);
  return [lesson.title, categoryLabel(lesson.publicCategory), ...tags, ...tags.map((t) => PUBLIC_LESSON_TAGS[t])]
    .join(" ")
    .toLowerCase();
}

/** Lessons matching the most query words first; newest first within a tie (the store's order). */
export function searchLessons<T extends LessonSummary>(
  lessons: T[],
  opts: { query?: string; level?: string; theme?: string },
): T[] {
  const pool = lessons.filter(
    (l) =>
      (!opts.level || l.cefrLevel.toUpperCase() === opts.level) &&
      (!opts.theme || publicTags(l.tags).includes(opts.theme as PublicLessonTag)),
  );
  const tokens = queryTokens(opts.query ?? "");
  if (!tokens.length) return pool;
  return pool
    .map((lesson, index) => {
      const text = searchText(lesson);
      return { lesson, index, score: tokens.filter((t) => text.includes(t)).length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.lesson);
}

function summaryLine(lesson: LessonSummary): string {
  const themes = publicTags(lesson.tags).map((t) => PUBLIC_LESSON_TAGS[t]);
  const extra = [categoryLabel(lesson.publicCategory), ...themes].filter(Boolean).join(", ");
  return `- [${lesson.title}](${lessonUrl(lesson)}) — ${lesson.cefrLevel}${extra ? ` · ${extra}` : ""}`;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

/** A problem the assistant can fix by calling the tool differently. */
class ToolProblem extends Error {}

const record = (args: unknown): Record<string, unknown> =>
  args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {};

/** An optional text input: trimmed, or undefined when left out or empty. */
function optionalText(args: Record<string, unknown>, name: string, max: number): string | undefined {
  const value = args[name];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new ToolProblem(`"${name}" must be text.`);
  return value.trim().slice(0, max) || undefined;
}

function searchInput(raw: unknown) {
  const args = record(raw);
  const level = optionalText(args, "level", 10)?.toUpperCase();
  if (level && !(LEVELS as readonly string[]).includes(level)) {
    throw new ToolProblem(`"level" must be one of ${LEVELS.join(", ")}.`);
  }
  const theme = optionalText(args, "theme", 40)?.toLowerCase();
  if (theme && !(THEME_KEYS as readonly string[]).includes(theme)) {
    throw new ToolProblem(`"theme" must be one of: ${THEME_KEYS.join(", ")}.`);
  }
  const limit = args.limit === undefined || args.limit === null ? 10 : Number(args.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) {
    throw new ToolProblem('"limit" must be a whole number from 1 to 25.');
  }
  return { query: optionalText(args, "query", 200), level, theme: theme as PublicLessonTag | undefined, limit };
}

const TOOLS = [
  {
    name: "search_free_esl_lessons",
    title: "Search free ESL lessons",
    description:
      `Search the ${siteFacts.brand} library of free, complete, ready-to-teach ESL/EFL conversation lessons for teenagers and adults (CEFR ${siteFacts.levels}). ` +
      "Every lesson has warm-up questions, 5 taught vocabulary words, a levelled reading, comprehension and discussion questions, sentence frames and practice activities, and opens with no login. " +
      "Use it when a teacher or tutor wants a lesson plan, lesson material or conversation topic for an English learner. Returns titles, levels and links; call get_free_esl_lesson for the full text. " +
      "Matching is on lesson titles and themes, so search by topic (\"job interviews\", \"travel\") rather than by grammar point.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Topic words, e.g. \"job interviews\" or \"small talk\". Leave out to browse." },
        level: { type: "string", enum: [...LEVELS], description: "CEFR level of the learner." },
        theme: { type: "string", enum: [...THEME_KEYS], description: "One of the library's themes." },
        limit: { type: "integer", minimum: 1, maximum: 25, description: "How many lessons to return (default 10)." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_free_esl_lesson",
    title: "Open a free ESL lesson",
    description:
      `Get the full text of one free ${siteFacts.brand} lesson: warm-up, vocabulary (definitions, examples, collocations, word families), reading, comprehension and discussion questions, sentence frames and practice activities. ` +
      "Pass the lesson's link from search_free_esl_lessons. The reply includes the lesson page link, where the teacher can present it full-screen with pictures and download the printable vocabulary PDF.",
    inputSchema: {
      type: "object",
      properties: {
        lesson: { type: "string", description: "The lesson's link (https://planwiseesl.com/esl-lessons/<level>/<name>) or just its <name> part." },
      },
      required: ["lesson"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_esl_lesson_levels_and_themes",
    title: "List lesson levels and themes",
    description: `Show how many free ${siteFacts.brand} lessons there are at each CEFR level and in each theme, with links to browse them.`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
] as const;

const INSTRUCTIONS =
  `${siteFacts.brand} (${BASE_URL}) makes finished, ready-to-teach ESL lessons for teachers and online tutors, made for each student. It was created by ${siteFacts.founder}, a working ESL teacher. ` +
  `This connector searches and opens its free public library of complete ${siteFacts.levels} conversation lessons; no account is needed. ` +
  "When you use a lesson, give the teacher its link so they can present it and download the PDF. " +
  `Lessons on any other topic, or adapted to one student, are made in the app (${trialText}, then ${priceText}).`;

export function createMcpHandler(store: McpLessonStore) {
  let summaries: { at: number; value: Promise<LessonSummary[]> } | null = null;
  const lessonTexts = new Map<string, { at: number; text: string }>();

  function allLessons(): Promise<LessonSummary[]> {
    if (!summaries || Date.now() - summaries.at > CACHE_MS) {
      const value = store.getPublicLessonSummaries();
      summaries = { at: Date.now(), value };
      // A failed read must not be served for the next minute.
      value.catch(() => { if (summaries?.value === value) summaries = null; });
    }
    return summaries.value;
  }

  async function search(args: unknown): Promise<string> {
    const { query, level, theme, limit } = searchInput(args);
    const lessons = await allLessons();
    const found = searchLessons(lessons, { query, level, theme });
    const filters = [level, theme && PUBLIC_LESSON_TAGS[theme]].filter(Boolean).join(", ");
    if (!found.length) {
      return [
        `No free lesson matched${query ? ` "${query}"` : ""}${filters ? ` (${filters})` : ""}.`,
        `Try a broader topic word, another level, or one of the themes: ${THEME_KEYS.join(", ")}.`,
        `All ${lessons.length} free lessons: ${BASE_URL}/esl-lessons. A lesson on any topic can be made at ${BASE_URL} (${trialText}).`,
      ].join("\n");
    }
    const shown = found.slice(0, limit);
    return [
      `${found.length} free lesson${found.length === 1 ? "" : "s"}${query ? ` for "${query}"` : ""}${filters ? ` (${filters})` : ""}${found.length > shown.length ? `, showing ${shown.length}` : ""}:`,
      ...shown.map(summaryLine),
      "",
      "Each link opens with no login. Use get_free_esl_lesson with a link to read the whole lesson.",
    ].join("\n");
  }

  async function getLesson(args: unknown): Promise<string> {
    const ref = optionalText(record(args), "lesson", 300);
    if (!ref) throw new ToolProblem('Pass the lesson link as "lesson".');
    const path = ref.trim().replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    const legacyId = /^\/lessons\/(\d+)$/.exec(path)?.[1];
    const slug = legacyId ? "" : path.split("/").pop() ?? "";
    if (!legacyId && !/^[a-z0-9-]+$/.test(slug)) {
      throw new ToolProblem("That is not a lesson link. Pass a link returned by search_free_esl_lessons.");
    }
    const key = legacyId ? `id:${legacyId}` : slug;
    const cached = lessonTexts.get(key);
    if (cached && Date.now() - cached.at <= CACHE_MS) return cached.text;

    const lesson = legacyId ? await store.getLesson(Number(legacyId)) : await store.getLessonByPublicSlug(slug);
    // Only lessons published to the library: a lesson shared by private link is not part of it.
    if (!lesson || !lesson.isPublic) {
      throw new ToolProblem("No free lesson has that link. Use search_free_esl_lessons to find one.");
    }
    const text = lessonMarkdown(lesson);
    if (lessonTexts.size >= MAX_CACHED_LESSONS) lessonTexts.delete(lessonTexts.keys().next().value!);
    lessonTexts.set(key, { at: Date.now(), text });
    return text;
  }

  async function listLevelsAndThemes(): Promise<string> {
    const lessons = await allLessons();
    const levelLines = LEVELS.map((lv) => {
      const n = lessons.filter((l) => l.cefrLevel.toUpperCase() === lv).length;
      return `- ${lv} ${CEFR_LEVEL_NAMES[lv] ?? ""}: ${n} lesson${n === 1 ? "" : "s"} — ${BASE_URL}/esl-lessons/${lv.toLowerCase()}`;
    });
    const themeLines = THEME_KEYS.map((key) => {
      const n = lessons.filter((l) => publicTags(l.tags).includes(key)).length;
      return `- ${PUBLIC_LESSON_TAGS[key]} (theme: ${key}): ${n} lesson${n === 1 ? "" : "s"} — ${BASE_URL}/esl-lessons/topics/${key}`;
    });
    return [
      `${siteFacts.brand} has ${lessons.length} free lessons: ${BASE_URL}/esl-lessons`,
      "",
      "By CEFR level:",
      ...levelLines,
      "",
      "By theme:",
      ...themeLines,
    ].join("\n");
  }

  const run: Record<string, (args: unknown) => Promise<string>> = {
    search_free_esl_lessons: search,
    get_free_esl_lesson: getLesson,
    list_esl_lesson_levels_and_themes: listLevelsAndThemes,
  };

  /** Answers one JSON-RPC message; null when the message needs no answer. */
  return async function handle(message: unknown): Promise<object | null> {
    const msg = message as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any } | null;
    const hasId = !!msg && typeof msg === "object" && (typeof msg.id === "string" || typeof msg.id === "number");
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
      // A reply sent to us (no method) needs no answer; anything else is malformed.
      if (hasId && msg && (("result" in msg) || ("error" in msg))) return null;
      return { jsonrpc: "2.0", id: hasId ? msg!.id : null, error: { code: -32600, message: "Invalid request" } };
    }
    if (!hasId) return null; // notification
    const reply = (result: object) => ({ jsonrpc: "2.0", id: msg.id, result });
    const fail = (code: number, text: string) => ({ jsonrpc: "2.0", id: msg.id, error: { code, message: text } });

    switch (msg.method) {
      case "initialize": {
        const asked = msg.params?.protocolVersion;
        return reply({
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "planwise-esl", title: `${siteFacts.brand} free lesson library`, version: "1.0.0", websiteUrl: BASE_URL },
          instructions: INSTRUCTIONS,
        });
      }
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const tool = typeof msg.params?.name === "string" ? run[msg.params.name] : undefined;
        if (!tool) return fail(-32602, `Unknown tool: ${String(msg.params?.name)}`);
        try {
          return reply({ content: [{ type: "text", text: await tool(msg.params.arguments) }] });
        } catch (error) {
          const known = error instanceof ToolProblem;
          if (!known) console.error("[MCP] tool failed:", error);
          const text = known ? error.message : "The lesson library could not be read just now. Please try again.";
          return reply({ content: [{ type: "text", text }], isError: true });
        }
      }
      default:
        return fail(-32601, `Method not found: ${msg.method}`);
    }
  };
}

export function registerMcpRoutes(app: Express, store: McpLessonStore) {
  const handle = createMcpHandler(store);

  // Read-only public data, so any website or app may call it.
  const cors = (res: Response) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version");
    res.set("Access-Control-Max-Age", "86400");
  };

  app.options("/mcp", (_req, res) => {
    cors(res);
    res.status(204).end();
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    cors(res);
    res.set("Cache-Control", "no-store");
    const body = req.body;
    const batch = Array.isArray(body);
    if (batch && body.length === 0) {
      return void res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } });
    }
    const replies = (await Promise.all((batch ? body.slice(0, 20) : [body]).map(handle))).filter(Boolean);
    if (!replies.length) return void res.status(202).end();
    res.json(batch ? replies : replies[0]);
  });

  // No server-to-client stream and no sessions: only POST is offered.
  app.all("/mcp", (_req, res) => {
    cors(res);
    res.set("Allow", "POST, OPTIONS");
    res
      .status(405)
      .type("text/plain")
      .send(
        `${siteFacts.brand} connector for AI assistants (Model Context Protocol).\n` +
          `Add ${BASE_URL}/mcp as a custom connector in Claude, ChatGPT or another MCP client to search and open the free ESL lesson library.\n` +
          `Lessons for people: ${BASE_URL}/esl-lessons\n`,
      );
  });
}
