/**
 * Moves inline Base64 lesson images out of the database and into App
 * Storage, replacing them with serving URLs. Idempotent: a lesson whose
 * images already have imageUrl values is skipped by the candidate query,
 * and storage keys are content-hashed so re-runs overwrite in place.
 *
 * Usage:
 *   npx tsx scripts/migrate-lesson-images.ts --dry-run       # count only
 *   npx tsx scripts/migrate-lesson-images.ts --lesson=234    # single lesson
 *   npx tsx scripts/migrate-lesson-images.ts                 # all lessons
 */
import { pool } from "../server/db";
import { uploadLessonImage } from "../server/services/image-storage";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const lessonArg = args.find((a) => a.startsWith("--lesson="));
const ONLY_LESSON = lessonArg ? Number(lessonArg.split("=")[1]) : null;
const UPLOAD_CONCURRENCY = 3;

async function extractLessonImages(
  lessonId: number,
  content: string,
): Promise<{ lesson: unknown; uploaded: number; doubleEncoded: boolean }> {
  // Most legacy lessons are double-encoded: the column holds
  // JSON.stringify(JSON.stringify(lesson)), with literal \" sequences.
  let lesson: unknown = JSON.parse(content);
  let doubleEncoded = false;
  if (typeof lesson === "string") {
    lesson = JSON.parse(lesson);
    doubleEncoded = true;
  }
  const targets: Record<string, unknown>[] = [];

  (function collect(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const b64 = record.imageBase64;
    if (typeof b64 === "string" && b64.length > 10000 && !record.imageUrl) {
      targets.push(record);
    }
    Object.values(record).forEach(collect);
  })(lesson);

  if (!DRY_RUN) {
    for (let i = 0; i < targets.length; i += UPLOAD_CONCURRENCY) {
      await Promise.all(
        targets.slice(i, i + UPLOAD_CONCURRENCY).map(async (record) => {
          const b64 = record.imageBase64 as string;
          const url = await uploadLessonImage(b64, lessonId);
          record.imageUrl = url;
          record.imageBase64 = null;
        }),
      );
    }
  }

  return { lesson, uploaded: targets.length, doubleEncoded };
}

async function main(): Promise<void> {
  const candidates = ONLY_LESSON
    ? await pool.query(
        "SELECT id, octet_length(content) AS size FROM lessons WHERE id = $1",
        [ONLY_LESSON],
      )
    : await pool.query(
        `SELECT id, octet_length(content) AS size FROM lessons
         WHERE position('iVBORw0KGgo' in content) > 0
            OR position('/9j/' in content) > 0
         ORDER BY id`,
      );

  console.log(
    `Found ${candidates.rows.length} lessons with embedded Base64 images` +
      (DRY_RUN ? " (dry run — nothing will be written)" : ""),
  );

  let done = 0;
  let failed = 0;
  let totalImages = 0;

  for (const row of candidates.rows) {
    try {
      const full = await pool.query(
        "SELECT content FROM lessons WHERE id = $1",
        [row.id],
      );
      const content: string | undefined = full.rows[0]?.content;
      if (!content) continue;

      const { lesson, uploaded, doubleEncoded } = await extractLessonImages(
        row.id,
        content,
      );

      if (uploaded > 0 && !DRY_RUN) {
        const serialized = JSON.stringify(lesson);
        await pool.query("UPDATE lessons SET content = $1 WHERE id = $2", [
          doubleEncoded ? JSON.stringify(serialized) : serialized,
          row.id,
        ]);
      }

      done++;
      totalImages += uploaded;
      console.log(
        `[${done + failed}/${candidates.rows.length}] lesson ${row.id}: ${uploaded} images ${DRY_RUN ? "found" : "moved"} (row was ${(row.size / 1048576).toFixed(1)} MB${doubleEncoded ? ", double-encoded" : ""})`,
      );
    } catch (error: any) {
      failed++;
      console.error(`lesson ${row.id} FAILED:`, error?.message || error);
    }
  }

  console.log(
    `MIGRATION_${failed === 0 ? "COMPLETE" : "FINISHED_WITH_FAILURES"}: ${done} lessons, ${totalImages} images, ${failed} failures`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error("Migration aborted:", error);
  process.exit(1);
});
