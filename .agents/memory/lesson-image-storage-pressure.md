---
name: Lesson image storage pressure
description: Lesson images moved from Base64-in-Postgres to App Storage; legacy content is double-encoded JSON; VACUUM reuses pages but doesn't shrink physical size.
---

- Lesson images historically stored as raw Base64 (no `data:` prefix) in `imageBase64` fields inside the `lessons.content` JSON, making rows 13–22 MB and the DB ~10 GB.
- **Resolution (2026-09-05):** images now uploaded to Replit App Storage (`lesson-images/<lessonId>/<sha16>.png`); lesson JSON stores the serving URL in `imageUrl`. Served via `GET /api/images/lesson-images/*` in routes.ts. Client helper `lessonImageSrc()` (client/src/lib/lesson-image.ts) prefers `imageUrl`, falls back to `imageBase64` — keep both supported since old rows may still carry Base64.
- **Legacy encoding:** many lessons are still double-encoded in the DB; see lesson-content-encoding.md for the canonical format and shared decode/encode helpers.
- **Why:** publish-time `pg_dump` copies only live data, so shrinking rows to <1 MB makes Replit's production DB copy fit; physical size (`pg_database_size`) stays ~10 GB until a VACUUM FULL — plain VACUUM only makes TOAST pages reusable.
- **App Storage provisioning quirk:** the bucket is NOT auto-provisioned — `@replit/object-storage` fails with "A bucket name is needed" until the user manually creates a bucket in the workspace App Storage tool (All tools → App Storage → Create new bucket). No sidecar endpoint exists before that. Bucket is shared between dev and prod by default.
- **Leftover Base64 (2026-10-14):** generation keeps Base64 when an App Storage upload fails, so a few new lessons keep picking up 1–2 MB inline images (20 found in Oct 2026, including the homepage showcase lesson). Run `scripts/migrate-lesson-images.ts --dry-run` during perf/SEO work and migrate any found.
- **Homepage showcase:** `shared/homepage-content.ts` `showcase.lessonId` must point at a lesson that is public; if it goes private the homepage shows "Unable to load lesson preview" and links to a 404.
