---
name: Lesson prompt tuning
description: How the lesson-generation model reacts to prompt wording (template copying, level drift, item counts) and how to compare prompt versions fairly.
---
- The model copies the JSON template closely. Anything interpolated into a template field (e.g. the teacher's raw request) can come back verbatim in student-facing text; this leaked private notes about students into titles. Item counts also follow the template: when the template showed one sentence frame, B2/C1 lessons often returned only one, even with "3 frames" written in the instructions.
- Wording such as "keep everything comfortable/simple" in a section shared by all levels also pulls C1/C2 lessons down. Keep simplification guidance in the per-level notes for A1–B2, and tell C1/C2 explicitly not to simplify.
- Keep asking for exact word-bank words inside fill-in-the-blank brackets. The app now copes with changed forms like "rescued" for "rescue" (see cloze-gap-matching.md), but it cannot fix gaps whose answer is an unrelated word or a "___" placeholder.
- One sample per prompt is not enough. Generation time for the same prompt ranged from 24 s to 117 s, and format slips are random. Compare at least 3 runs per level before drawing conclusions.
- Sentence frames (only rework them if Dave asks; see User Preferences in replit.md): the known weak spot is the B2 top ("expanding") tier. It drifts into IELTS-essay style (live lessons used "Were X to…" / "It could be argued that…"). Some B2 frames also contain the opinion, so the student only fills in adjectives. A2/B1/C1 frames read well.

**Why:** Learned while rewriting the lesson prompt for natural, level-appropriate wording (October 2026). Early single-sample results were misleading.

**How to apply:** Any future change to the lesson or grammar-spotlight prompt. Teacher requests stay out of template fields. Show the required number of items in the template. Re-test advanced levels as well as beginner levels. Comparison scripts were in generated-artifacts/prompt-comparison/; that folder is gitignored and may no longer exist.
