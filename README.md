# PlanWise ESL

**PlanWise ESL** ([planwiseesl.com](https://planwiseesl.com)) makes finished, ready-to-teach English lessons for ESL and EFL teachers and online English tutors. A teacher chooses a CEFR level (A1–C2) and any topic, and in 1–2 minutes PlanWise ESL writes a complete, ready-to-teach lesson. It remembers the vocabulary each student has learned, so lessons build on each other, and it gives every student a private page for practice between classes.

PlanWise ESL was created by [Dave Jackson](https://www.linkedin.com/in/davidjackson113), a working ESL teacher. New accounts get a 14-day free trial with unlimited lessons (no credit card); the Unlimited plan is $19.99/month.

- **Try it:** [planwiseesl.com](https://planwiseesl.com)
- **Free sample lessons at every level:** [planwiseesl.com/esl-lessons](https://planwiseesl.com/esl-lessons)

## Who it is for

- Online ESL tutors on Preply, italki and similar platforms
- Independent English teachers with regular one-to-one students
- Small language schools and agencies

## What a lesson contains

Every lesson follows the same structure, written at the chosen CEFR level:

1. **Warm-up** questions to introduce the topic
2. **Key vocabulary**, pre-taught with definitions, examples, pronunciation and pictures
3. A **levelled reading** that uses the new words
4. **Comprehension** questions
5. **Sentence frames** at three levels of support (emerging, developing, expanding), with model answers
6. **Discussion** questions
7. A **fill-in-the-blank** exercise and a **quiz**
8. Optional **idioms and phrasal verbs** from the reading (A2 and up)
9. **Teacher notes**

Lessons open full screen for screen sharing and can be downloaded for printing or saving as a PDF.

## What makes it different

- **It remembers each student.** Lessons made for a student avoid words they have already learned or have planned, and reuse known words naturally in new readings. When the teacher marks a lesson "We did this", its words join the student's list.
- **Student pages.** Each student can have a private page with finished lessons, a preview of the next lesson, their words and flashcards. Students can suggest topics, and students of Unlimited teachers can make lessons themselves.
- **Checked before it is saved.** Every new lesson is checked section by section; a broken exercise is fixed or written again before the teacher sees it.
- **Consistent structure.** Unlike a general chatbot, PlanWise ESL produces the same complete lesson structure every time and keeps a record of each student.

---

## For developers

PlanWise ESL is a TypeScript web app: React + Vite on the front end, Express on the back end, PostgreSQL via Drizzle ORM. Lessons are written by an LLM through OpenRouter and illustrated with Replicate (FLUX Schnell). Payments use Stripe; email lists use Mailchimp.

### Running locally

Requires Node.js 20+ and PostgreSQL.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run db:push
npm run dev            # http://localhost:5000
```

Main environment variables: `DATABASE_URL`, `SESSION_SECRET`, `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN`, and optionally `PLANWISE_STRIPE_SECRET` / `PLANWISE_STRIPE_PUBLIC`, `MAILCHIMP_API_KEY` / `MAILCHIMP_SERVER_PREFIX` / `MAILCHIMP_LIST_ID`, `INDEXNOW_KEY`.

### Tests

```bash
npm test        # vitest
npm run check   # TypeScript
```

### Project structure

```
client/   React app (pages, components)
server/   Express API, lesson generation, crawler-readable page rendering
shared/   Types, database schema and copy shared by client and server
public/   Static files, including robots.txt and llms.txt
```

Public pages (home, blog, free lessons) are rendered on the server as plain HTML as well, so search engines and AI assistants can read them without running JavaScript. Homepage copy lives in `shared/homepage-content.ts`, and the facts repeated across pages (price, trial, timing) live in `shared/site-facts.ts`; a test keeps `public/llms.txt` in line with them.

## Contact

- **Email:** dave@planwiseesl.com
- **LinkedIn:** [Dave Jackson](https://www.linkedin.com/in/davidjackson113)
- **X:** [@DaveTeacher1](https://x.com/DaveTeacher1)

## License

MIT. See [LICENSE](LICENSE).
