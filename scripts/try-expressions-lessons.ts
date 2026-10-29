/**
 * Generates trial lessons with the idioms & phrasal verbs switch on, so the
 * new section can be judged on real AI output before release. Nothing is
 * saved to the database, no images are made and no credits are used; each
 * lesson is written to generated-artifacts/expressions-trials/ (gitignored).
 *
 * For every lesson it prints the expressions, whether each one was found in
 * the reading, the quiz question it added, and how long the extra request
 * took. Lesson check messages ("Lesson repair FAILED", "fixed in place")
 * appear in the log as they do on the server.
 *
 * Needs OPENROUTER_API_KEY. Usage:
 *   npx tsx scripts/try-expressions-lessons.ts                      # 3 lessons at each level, A2–C2
 *   npx tsx scripts/try-expressions-lessons.ts --levels=A2,B1 --runs=2
 *   npx tsx scripts/try-expressions-lessons.ts --levels=B2 --topic="Working from home"
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { LessonGenerateParams } from "../shared/schema";
import { expressionItemsOf, withoutMarks } from "../shared/lesson-expressions";
import { DEFAULT_MODEL, OpenRouterService } from "../server/services/openRouter";

const args = process.argv.slice(2);
const option = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const LEVELS = (option("levels") ?? "A2,B1,B2,C1,C2").split(",").map((level) => level.trim().toUpperCase());
const RUNS = Number(option("runs") ?? 3);
const TOPICS = option("topic") ? [option("topic")!] : ["Working from home", "Planning a holiday with friends", "Eating well on a budget"];
const FORM_COMPONENTS = ["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"];

/** Times the idioms & phrasal verbs requests, which run after the main lesson request. */
class TimedService extends OpenRouterService {
  expressionsMs = 0;
  expressionRequests = 0;

  async writeExpressionsSection(...request: Parameters<OpenRouterService["writeExpressionsSection"]>): Promise<unknown> {
    const started = Date.now();
    this.expressionRequests++;
    try {
      return await super.writeExpressionsSection(...request);
    } finally {
      this.expressionsMs += Date.now() - started;
    }
  }
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const outDir = path.join("generated-artifacts", "expressions-trials", new Date().toISOString().replace(/[:.]/g, "-"));
  mkdirSync(outDir, { recursive: true });
  const summary: string[] = [];

  for (const level of LEVELS) {
    for (let run = 1; run <= RUNS; run++) {
      const topic = TOPICS[(run - 1) % TOPICS.length];
      const params = {
        cefrLevel: level, topic, focus: "general", lessonLength: 60,
        components: [...FORM_COMPONENTS, "expressions"], generateImages: false,
        useStudentHistory: false, aiProvider: "gemini", category: "general", tags: [],
      } as LessonGenerateParams;
      const service = new TimedService(apiKey);
      const label = `${level} #${run} "${topic}"`;
      console.log(`\n=== ${label}`);

      const started = Date.now();
      try {
        const lesson = await service.generateLesson(params, [], DEFAULT_MODEL, { logPrefix: `[${level} #${run}]` });
        const seconds = (Date.now() - started) / 1000;
        const reading = (lesson.sections.find((s: any) => s?.type === "reading")?.paragraphs ?? []).join(" ");
        const section = lesson.sections.find((s: any) => s?.type === "expressions");
        const items = expressionItemsOf(section);
        const quiz = lesson.sections.find((s: any) => s?.type === "quiz")?.questions ?? [];

        const lines = [
          `${label}: ${seconds.toFixed(0)} s in total, ${(service.expressionsMs / 1000).toFixed(0)} s for the expressions (${service.expressionRequests} request${service.expressionRequests === 1 ? "" : "s"})`,
          `  Title: ${lesson.title}`,
          section ? `  Tab: ${section.title} (${items.length} expressions)` : "  Tab: NONE (the section was left out)",
          ...items.map((item) => {
            const found = item.fromText ? "from the reading" : "NOT in the reading";
            return `   - ${item.expression} [${item.kind}${item.tone ? `, ${item.tone}` : ""}] ${found}\n       meaning: ${item.meaning}${item.similar ? ` (similar: ${item.similar})` : ""}\n       example: ${withoutMarks(item.example)}\n       your turn: ${item.yourTurn}`;
          }),
          `  Quiz questions: ${quiz.length}${quiz.length > 5 ? ` (added: ${quiz[quiz.length - 1]?.question})` : ""}`,
          `  Reading: ${reading.slice(0, 300)}${reading.length > 300 ? "…" : ""}`,
        ];
        console.log(lines.join("\n"));
        summary.push(lines.join("\n"));
        writeFileSync(path.join(outDir, `${level}-${run}.json`), JSON.stringify(lesson, null, 2));
      } catch (error) {
        const line = `${label}: FAILED after ${((Date.now() - started) / 1000).toFixed(0)} s: ${error instanceof Error ? error.message : String(error)}`;
        console.error(line);
        summary.push(line);
      }
    }
  }

  writeFileSync(path.join(outDir, "summary.txt"), `${summary.join("\n\n")}\n`);
  console.log(`\nSaved the lessons and summary.txt in ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
