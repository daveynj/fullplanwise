---
name: Idioms & phrasal verbs section
description: How the optional expressions section is generated, checked and shown, and the rules that keep lessons without it unchanged.
---
- The lesson form's switch adds "expressions" to the generate request's components. The level rules are in shared/lesson-expressions.ts: never at A1; 3 phrasal verbs at A2 (off by default); 3 phrasal verbs and expressions at B1; 4 idioms and phrasal verbs at B2–C2. The tab title follows the level.
- It is not one of LESSON_SECTION_TYPES. It is written by its own AI request after the lesson check (server/services/lesson-expressions.ts), which gets the finished reading so the expressions come from it. It is added before the lesson is saved: the teacher receives the lesson once, and only images are added later.
- With the switch off, or at A1, the lesson prompt is exactly as before (tests check this). With the switch on, A2 and B1 readings get one extra line asking for a few everyday phrasal verbs.
- "Usable" follows what the tab renders: `expressionItemsOf` (expression, meaning, example, speaking question). A quoted reading sentence that is not in the reading is cleared, and the card then shows the example instead. The section is requested once more if needed, and left out (logged "Lesson repair FAILED") when neither version is usable. Its quiz question is added to the quiz only when the quiz can mark it.
- Expressions are saved to student_vocabulary as ordinary rows when a lesson is assigned, so later lessons don't repeat them.
- Dave tests new lesson features by generating real lessons in Replit (he can roll back to an earlier Replit build, and credits don't matter), so trial scripts aren't needed.

**Why:** Dave wanted the module only for newly generated lessons, with all existing lessons staying exactly the same (October 2026).

**How to apply:** Never add the section to stored lessons. Keep the tab, public page block and summary conditional on the section existing. The next planned step is adding the expressions to the vocabulary download.
