import { sql } from "drizzle-orm";
import { db } from "./db";
import { availableLessonSlug } from "@shared/lesson-url";

// Publishing and migration use the same transaction lock across app instances.
export const LESSON_URL_LOCK = 420003;
let ready: Promise<void> | undefined;

/** Additive, restart-safe migration; reads titles only, never lesson prompts/content. */
export function ensureLessonUrlSchema(): Promise<void> {
  if (!ready) {
    ready = db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${LESSON_URL_LOCK})`);
      // Avoid an ACCESS EXCLUSIVE table lock on every subsequent startup.
      const columns = await tx.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'lessons'
          AND column_name IN ('public_slug', 'public_level')
      `);
      const names = new Set(columns.rows.map((r) => r.column_name));
      if (!names.has("public_slug")) await tx.execute(sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS public_slug text`);
      if (!names.has("public_level")) await tx.execute(sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS public_level text`);
      await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS lessons_public_slug_unique ON lessons(public_slug)`);
      const existing = await tx.execute(sql`SELECT public_slug FROM lessons WHERE public_slug IS NOT NULL`);
      const used = new Set(existing.rows.map((r) => String(r.public_slug)));
      const missing = await tx.execute(sql`
        SELECT id, title, cefr_level FROM lessons
        WHERE is_public = true AND public_slug IS NULL ORDER BY id
      `);
      const assignments = [];
      for (const row of missing.rows) {
        const slug = availableLessonSlug(String(row.title), Number(row.id), used);
        const level = String(row.cefr_level).toLowerCase();
        if (!/^[abc][12]$/.test(level)) throw new Error(`Invalid public lesson level for ${row.id}`);
        assignments.push(sql`(${Number(row.id)}::integer, ${slug}::text, ${level}::text)`);
        used.add(slug);
      }
      // Batch writes: don't hold the schema lock through a network round trip
      // per lesson, and stay comfortably below PostgreSQL's parameter limit.
      for (let offset = 0; offset < assignments.length; offset += 500) {
        await tx.execute(sql`
          UPDATE lessons AS l SET public_slug = v.slug, public_level = v.level
          FROM (VALUES ${sql.join(assignments.slice(offset, offset + 500), sql`, `)}) AS v(id, slug, level)
          WHERE l.id = v.id AND l.public_slug IS NULL
        `);
      }
    }).then(() => undefined).catch((error) => {
      ready = undefined;
      throw error;
    });
  }
  return ready;
}
