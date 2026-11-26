---
name: Public lesson URL stability
description: Why public lesson URLs keep the title and level from their first publication.
---

Treat a public lesson's first published URL as permanent, even if its title or CEFR level changes. Unpublishing must not release its URL reservation; if it remains link-shared, the existing URL still opens with noindex.

**Why:** Public lessons have been shared using numeric links. Readable URLs must preserve those shares rather than changing identity whenever a teacher edits or republishes a lesson. Keeping the original level in the path is intentional, not stale metadata.

**How to apply:** New URL, sharing, and search-discovery features should use the persisted public identity, not reconstruct paths from the current title or current level. Only the title may seed a slug; the teacher's original request is private.
