---
name: Lesson image storage pressure
description: Lesson images moved from Base64-in-Postgres to App Storage; legacy content is double-encoded JSON; VACUUM reuses pages but doesn't shrink physical size.
---

- Lesson images historically stored as raw Base64 (no `data:` prefix) in `imageBase64` fields inside the `lessons.content` JSON, making rows 13–22 MB and the DB ~10 GB.
- **Resolution (2026-09-05):** images now uploaded to Replit App Storage (`lesson-images/<lessonId>/<sha16>.png`); lesson JSON stores the serving URL in `imageUrl`. Served via `GET /api/images/lesson-images/*` in routes.ts. Client helper `lessonImageSrc()` (client/src/lib/lesson-image.ts) prefers `imageUrl`, falls back to `imageBase64` — keep both supported since old rows may still carry Base64.
- **Legacy encoding trap:** most legacy lessons are *double-encoded* — the column holds `JSON.stringify(JSON.stringify(lesson))` with literal `\"` sequences. Any content-migration script must parse twice (detect when first parse returns a string) and re-encode the same way on writeback.
- **Why:** publish-time `pg_dump` copies only live data, so shrinking rows to <1 MB makes Replit's production DB copy fit; physical size (`pg_database_size`) stays ~10 GB until a VACUUM FULL — plain VACUUM only makes TOAST pages reusable.
- **App Storage provisioning quirk:** the bucket is NOT auto-provisioned — `@replit/object-storage` fails with "A bucket name is needed" until the user manually creates a bucket in the workspace App Storage tool (All tools → App Storage → Create new bucket). No sidecar endpoint exists before that. Bucket is shared between dev and prod by default.
