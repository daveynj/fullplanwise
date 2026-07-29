/**
 * One-time cleanup for legacy malformed grammarSpotlight payloads.
 *
 * Lessons generated before generation-time validation may hold JSON in
 * lessons.grammar_spotlight that fails validateGrammarSpotlightForStorage.
 * This script normalizes salvageable payloads in place and nulls out
 * unparseable/unrenderable ones.
 *
 * Run with: npx tsx scripts/cleanup-grammar-spotlight.ts [--dry-run]
 */
import { db } from "../server/db";
import { lessons } from "../shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { validateGrammarSpotlightForStorage } from "../types/lessonContentTypes";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const rows = await db
    .select({ id: lessons.id, grammarSpotlight: lessons.grammarSpotlight })
    .from(lessons)
    .where(isNotNull(lessons.grammarSpotlight));

  let ok = 0;
  let normalized = 0;
  let nulled = 0;

  for (const row of rows) {
    const raw = row.grammarSpotlight!;
    let next: string | null;

    try {
      const parsed = JSON.parse(raw);
      const validated = validateGrammarSpotlightForStorage(parsed);
      next = validated ? JSON.stringify(validated) : null;
    } catch {
      next = null; // unparseable JSON
    }

    if (next === raw) {
      ok++;
      continue;
    }

    if (next === null) {
      nulled++;
      console.log(`Lesson ${row.id}: nulling malformed grammarSpotlight`);
    } else {
      normalized++;
      console.log(`Lesson ${row.id}: normalizing grammarSpotlight`);
    }

    if (!dryRun) {
      await db
        .update(lessons)
        .set({ grammarSpotlight: next })
        .where(eq(lessons.id, row.id));
    }
  }

  console.log(
    `Done${dryRun ? " (dry run)" : ""}: ${rows.length} lessons checked, ` +
      `${ok} already valid, ${normalized} normalized, ${nulled} nulled.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
