---
name: Student pages
description: Rules Dave agreed for students' private pages (/s/<code>), planned vs done lessons, ideas and student-made lessons, and what students must never see.
---
Agreed with Dave on 30 October 2026, after he approved clickable mockups (a private Design canvas, "Student Dashboard Mockups", in his claude.ai account):

- Every teacher's students can have a page: it is a selling point for all accounts. The page is named after the student ("Shingo's page").
- A lesson assigned to a student is planned until the teacher presses "We did this"; only then do its words join the student's list (`storage.markStudentLessonDone`; undo with `markStudentLessonPlanned`). This applies to all lessons, whoever made them. New lessons still avoid words from planned lessons (`getPlannedLessonWords`, used through `server/lesson-generation.ts` `wordsToAvoid`).
- Dave said to assume every lesson assigned before this existed had been done: `server/student-page-schema.ts` marked them done once, in the same transaction that added `student_lessons.completed_at`. Never run that marking again.
- Planned lessons show only the reading and new words; activities and answers stay hidden. Finished lessons open in full, without the teacher notes section or `teacherNotes`/`procedure`/`teachingTips`/`teachingNotes`.
- Keep "How <student> is practising" on the teacher's page (Dave asked to keep it).
- Every student can suggest topics ("ideas", `student_ideas`). The teacher sees them on the student's page: "Make this lesson" opens the generator with the topic and level filled in and marks the idea made (`ideaId` in the generate request), or "Dismiss".
- Students of Unlimited teachers can make lessons themselves (`server/student-lesson-making.ts`). Admin accounts count as Unlimited, as they do for the generator. The lesson uses the student's profile level and the lesson form's defaults, never the teacher's notes about the student; it lands in the teacher's library and is planned for the student (`student_lessons.made_by_student`). The teacher can switch it off per student (`students.can_make_lessons`, on by default).
- Dave's worry (30 Oct): students making dozens of lessons so the teacher can't tell which one they want. Built as: at most 3 ideas and 3 student-made lessons waiting (remove one to add another), plus a star the student puts on the coming-up lesson they want next (`students.next_lesson_id`; a lesson they just made is starred for them); the teacher sees the star. Lessons are cheap, so there is no charge, only a hidden safety limit of 10 started per student per day. The star was Claude's suggestion; Dave was to confirm it when testing all three steps together.
- Removing a lesson a student made deletes it from the teacher's library too, unless the teacher has given it to another student or shared it.
- Dave wants to test steps 1–3 together before anything goes on main.

**Why:** Students open the link without logging in, so anything the routes send is public to whoever has the link. Lesson requests and teacher notes often describe the real student (see lesson-topic-privacy.md).

**How to apply:** Student page routes (`server/student-page-routes.ts`) must only send fields built in `server/student-page.ts`; add new fields there and extend `server/student-page-routes.test.ts`'s private-text checks. Schema changes for these tables go in `server/student-page-schema.ts` (start-up DDL), not drizzle push; keep new columns off the `lessons` table (everything reads it). Student lesson jobs live in `student_lesson_jobs`, apart from the teacher's `lesson_generation_jobs`, so a student's job can never be mistaken for the teacher's own pending job. Lesson pictures for students go through `/api/student-page/<code>/lessons/<id>/images/...`; flashcard examples and pictures are read inside the database (`server/lesson-word-details.ts`) so old 15 MB lessons are never downloaded for a card.
