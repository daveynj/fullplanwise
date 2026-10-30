---
name: Student pages
description: Rules Dave agreed for students' private pages (/s/<code>), planned vs done lessons, and what students must never see.
---
Agreed with Dave on 30 October 2026, after he approved clickable mockups (a private Design canvas, "Student Dashboard Mockups", in his claude.ai account):

- Every teacher's students can have a page: it is a selling point for all accounts. The page is named after the student ("Shingo's page").
- A lesson assigned to a student is planned until the teacher presses "We did this"; only then do its words join the student's list (`storage.markStudentLessonDone`; undo with `markStudentLessonPlanned`). This applies to all lessons, whoever made them. New lessons still avoid words from planned lessons (`getPlannedLessonWords`).
- Dave said to assume every lesson assigned before this existed had been done: `server/student-page-schema.ts` marked them done once, in the same transaction that added `student_lessons.completed_at`. Never run that marking again.
- Planned lessons show only the reading and new words; activities and answers stay hidden. Finished lessons open in full, without the teacher notes section or `teacherNotes`/`procedure`/`teachingTips`/`teachingNotes`.
- Keep "How <student> is practising" on the teacher's page (Dave asked to keep it).
- Next steps Dave wants, in order: (2) a topic box where students suggest topics, for all teachers; (3) "make this lesson" for students of Unlimited teachers: one waiting lesson at a time, the student's level from their profile, never the teacher's private notes in the prompt, the lesson lands in the teacher's library marked as made by the student.

**Why:** Students open the link without logging in, so anything the routes send is public to whoever has the link. Lesson requests and teacher notes often describe the real student (see lesson-topic-privacy.md).

**How to apply:** Student page routes (`server/student-page-routes.ts`) must only send fields built in `server/student-page.ts`; add new fields there and extend `server/student-page-routes.test.ts`'s private-text checks. Schema changes for these tables go in `server/student-page-schema.ts` (start-up DDL), not drizzle push. Lesson pictures for students go through `/api/student-page/<code>/lessons/<id>/images/...`; flashcard examples and pictures are read inside the database (`server/lesson-word-details.ts`) so old 15 MB lessons are never downloaded for a card.
