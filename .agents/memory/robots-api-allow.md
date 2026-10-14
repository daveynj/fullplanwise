---
name: Robots.txt and client-side API fetches
description: Why robots.txt allows a few /api/ paths, and the rule for public pages that fetch data after load.
---

Googlebot renders pages with JavaScript. If a public page's React code fetches from a robots-blocked /api/ path, the rendered page is empty, and Google reports Soft 404 or noindex even when the server-prerendered HTML is correct.

**Why:** Google's live test flagged /lessons/:id as Soft 404 and /esl-lessons as noindex for this reason (Oct 2026). Dave chose to allow only `/api/public-lesson-index` and `/api/lessons/` (plus the existing `/api/images/`). `/api/lessons/:id` returns 404 for lessons that are neither public nor shared.

**How to apply:** when a public, indexable page starts fetching a new /api/ endpoint, it needs an Allow line too (ask first; Dave wants the list kept minimal). Client pages must never set noindex or show "not found" on a failed or pending fetch, only on a confirmed empty result or a real 404.
