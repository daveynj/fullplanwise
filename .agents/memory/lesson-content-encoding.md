---
name: Lesson content encoding
description: lessons.content storage format — text column, canonical single-encoded JSON, legacy double-encoded rows decoded by the Drizzle column type.
---

`lessons.content` is a Postgres `text` column. Canonical format: one layer of JSON (`{...}`). Most rows written before Oct 2026 are legacy double-encoded (`"{\"title\"...`) — ~690 of 700 in the shared Neon DB at the time; they were NOT rewritten in bulk.

The schema declares a custom column type that decodes either format on read and always writes canonical JSON (strings passed in are decoded first, so double-encoding can't recur). Application code always sees an object.

**Why:** schema once said jsonb while the DB was text and code saved `JSON.stringify(...)`, producing double-encoding; the public prerender then rendered zero sections (Google soft 404s). A bulk rewrite was skipped because the Neon DB is shared with production and rewriting multi-MB TOAST rows grows physical storage (see lesson-image-storage-pressure.md).

**How to apply:** Pass lesson content to Drizzle as an object — never `JSON.stringify` it yourself. Raw SQL/scripts must decode with the shared lesson-content helpers (handle both layers) and write back with its encoder. Do not switch the column to jsonb via drizzle push. Postgres `jsonb_*` functions fail on legacy rows. Estimated duration lives at `estimatedTime` (minutes, number).
