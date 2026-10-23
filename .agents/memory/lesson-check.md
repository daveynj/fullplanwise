---
name: Lesson check and repair
description: How new lessons are checked before saving, why "usable" is defined by what the lesson page renders, calibration results, and rules for changing the check.
---
- "Usable" follows what the lesson page renders, not the prompt's wording. Page behaviors that matter: discussion questions given as plain strings are silently skipped; the quiz shows True/False buttons when a question has no options, but a comprehension question without options can't be answered; the sentence-frames page crashes without a grammarFocus array, modelResponses and teachingNotes; the fill-in-the-blank greys out a word once placed, so two gaps needing the same word can't both be filled; the quiz marks correctAnswer first, so a letter like "C" there marks every answer wrong.
- Calibration (October 2026, the 182 lessons stored in the previous 60 days plus 24 test lessons; older lessons use older formats): 39 with 1 of 3 sentence frames, 7 broken fill-in-the-blanks ("[1:___]" placeholders, empty "[1:]" markers, a gap number used twice, the same word in two gaps, a gap word not in the bank), 1 missing vocabulary section, 6 unsolvable unscramble sentences. Every hit was a real problem; no complete lesson was flagged.
- Live retries with glm-5.3-flash all succeeded first time. One section takes about 3–15 s; vocabulary takes about 30 s. One retry per section has been enough.
- Never guess answers to repair a section (for example filling "[1:___]" from an answer list or reordering words). A wrong guess silently marks correct answers wrong, so request the section again instead. In-place fixes must have exactly one right answer, and alternative fill-in-the-blank text is used only when the check rates it better.

**Why:** The check runs on every new lesson. A false positive costs an extra AI call or drops a section that was fine. A rule that ignores what the page does lets broken exercises reach teachers.

**How to apply:** When a lesson component changes how it reads content, update the matching rule in the lesson check. Before tightening or adding a rule, run it read-only over all stored lessons and inspect every new hit. Stored lessons are never rewritten (shared prod DB).
