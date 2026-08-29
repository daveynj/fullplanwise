---
name: Lesson image storage pressure
description: Why lesson rows consume extreme Neon storage and why deletion alone does not reduce the displayed database size
---

Generated lesson images are stored as Base64 PNG strings inside lesson content. Typical lesson records can therefore reach roughly 13–20 MB, with nearly all space held in PostgreSQL TOAST storage.

**Why:** This can exhaust a fixed Neon project limit even with only hundreds of lessons. Once at the limit, lesson saves, Stripe webhook writes, and even small cleanup updates may fail because PostgreSQL cannot extend another relation.

**How to apply:** Move new images to durable object storage and retain only URLs in lesson JSON. For emergency cleanup, deleting selected lessons followed by ordinary `VACUUM` makes their TOAST pages reusable by future lesson inserts, but does not necessarily shrink `pg_database_size`; physically shrinking the table requires temporary capacity for an online rewrite or `VACUUM FULL`. Preserve dependent vocabulary metadata before deletion when free capacity permits.