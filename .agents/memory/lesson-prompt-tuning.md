---
name: Lesson prompt tuning
description: How the lesson-generation model reacts to prompt wording (template copying, level drift, item counts) and how to compare prompt versions fairly.
---
- The model copies the JSON template closely. Anything interpolated into a template field (e.g. the teacher's raw request) can come back verbatim in student-facing text; this leaked private notes about students into titles. Item counts also follow the template: when the template showed one sentence frame, B2/C1 lessons often returned only one, even with "3 frames" written in the instructions.
- Wording such as "keep everything comfortable/simple" in a section shared by all levels also pulls C1/C2 lessons down. Keep simplification guidance in the per-level notes for A1–B2, and tell C1/C2 explicitly not to simplify.
- Fill-in-the-blank answers must exactly match a word-bank word because the client compares the strings. An inflected form inside the brackets (e.g. "rescued" for "rescue") makes that gap impossible to answer.
- One sample per prompt is not enough. Generation time for the same prompt ranged from 24 s to 117 s, and format slips are random. Compare at least 3 runs per level before drawing conclusions.
- Sentence frames: on 2026-10-22 Dave said "I actually think they're fine" and asked for no changes, so don't rework them unless he asks. If he does, the known weak spot is the B2 top ("expanding") tier: it drifts into IELTS-essay style (live lessons used "Were X to…" / "It could be argued that…"). Some B2 frames also contain the opinion, so the student only fills in adjectives. A2/B1/C1 frames read well.

**Why:** Learned while rewriting the lesson prompt for natural, level-appropriate wording (October 2026). Early single-sample results were misleading.

**How to apply:** Any future change to the lesson or grammar-spotlight prompt. Teacher requests stay out of template fields. Show the required number of items in the template. Re-test advanced levels as well as beginner levels. Comparison scripts were in generated-artifacts/prompt-comparison/; that folder is gitignored and may no longer exist.
