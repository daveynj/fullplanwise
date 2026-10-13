---
name: Lesson content encoding
description: lessons.content is a text column holding double-encoded JSON; any server-side reader must unwrap string layers.
---

The `lessons.content` DB column is actually `text` (schema.ts declares jsonb), and generation saves `JSON.stringify(content)` into it. Drizzle's jsonb mapping parses once, so server code receives a JSON **string**, not an object. Raw SQL sees a double-encoded string starting with `"{\"title\"...`.

**Why:** Public lesson prerender only accepted objects, so every real lesson rendered zero sections and Google flagged the pages as soft 404s.

**How to apply:** Any server code reading lesson content (prerender, PDF, vocab extraction, SEO) must accept object, JSON string, or twice-encoded string. Postgres `jsonb_*` functions fail on this column; cast carefully. Estimated duration lives at `estimatedTime` (minutes, number).
