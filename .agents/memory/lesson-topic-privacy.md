---
name: Lesson topic is private
description: The lessons.topic field is the teacher's raw request and must never appear on public or shared views.
---

`lessons.topic` stores the teacher's original generation request, which often describes a real student (age, personality, job). Visitors (anyone not the owner or an admin) must see the title in its place; notes and studentId are private too.

**Why:** Dave found a public library lesson whose request described the student as "very intelligent"; he said showing these prompts is not appropriate.

**How to apply:** any new public surface (library cards, /esl-lessons, prerendered lesson HTML, meta/JSON-LD, sitemap, copy endpoint, shared links) must use the title, never the topic, and public search must not match on topic.
