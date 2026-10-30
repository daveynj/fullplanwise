import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { BookOpen, ChevronRight, Layers } from "lucide-react";
import { studentPagePath, type StudentPageHome, type StudentPageLessonSummary } from "@shared/student-page";
import { getStudentPage, studentPageUrls } from "@/lib/student-page-api";
import {
  BrandMark,
  LevelPill,
  StudentPageFrame,
  StudentPageLoading,
  StudentPageProblem,
  possessive,
  useStudentPageTitle,
} from "@/components/student-page/student-page-layout";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function lessonMeta(lesson: StudentPageLessonSummary): string {
  const parts = [formatDay(lesson.date)];
  if (lesson.words) parts.push(plural(lesson.words, "word", "words"));
  if (lesson.expressions) parts.push(plural(lesson.expressions, "idiom or phrasal verb", "idioms and phrasal verbs"));
  return parts.join(" · ");
}

/** The student's own page: their progress, flashcards, next lesson and finished lessons. */
export default function StudentPageHomePage() {
  const { token } = useParams<{ token: string }>();
  const urls = studentPageUrls(token);
  const { data, error, isLoading } = useQuery<StudentPageHome>({
    queryKey: [urls.home],
    queryFn: () => getStudentPage<StudentPageHome>(urls.home),
  });
  useStudentPageTitle(data ? `${possessive(data.student.name)} page` : null);

  if (isLoading) return <StudentPageLoading />;
  if (error || !data) return <StudentPageProblem error={error} />;

  const page = studentPagePath(token);
  const { practice, stats } = data;
  const hasWords = stats.words + stats.expressions > 0;

  return (
    <StudentPageFrame>
      <header className="flex flex-col gap-5 bg-brand-navy px-5 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LevelPill level={data.student.cefrLevel} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-nunito text-3xl font-extrabold leading-tight text-white">Hi {data.student.name}</h1>
          {data.teacherName && (
            <p className="text-base font-normal text-[#d6deea]">Your English lessons with {data.teacherName}</p>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2">
          {[
            [stats.lessonsDone, stats.lessonsDone === 1 ? "lesson done" : "lessons done"],
            [stats.words, stats.words === 1 ? "word learned" : "words learned"],
            [stats.expressions, "idioms and phrasal verbs"],
          ].map(([value, label]) => (
            <div key={String(label)} className="flex flex-col gap-1 rounded-xl bg-[#10305c] p-3">
              <dt className="order-last text-xs font-medium leading-snug text-[#d6deea]">{label}</dt>
              <dd className="font-nunito text-2xl font-extrabold leading-none text-brand-yellow">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <main className="flex flex-col gap-4 p-5">
        <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="practise-heading">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <Layers className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 id="practise-heading" className="font-nunito text-xl font-extrabold">Practise your words</h2>
              <p className="text-sm font-normal text-gray-600">
                {practice.due > 0
                  ? `${plural(Math.min(practice.due, 10), "card", "cards")} ready · about ${Math.max(1, Math.ceil(Math.min(practice.due, 10) / 2))} minutes`
                  : hasWords
                    ? "All done for now. More cards will be ready soon."
                    : `Your words will appear here after your first lesson${data.teacherName ? ` with ${data.teacherName}` : ""}.`}
              </p>
            </div>
          </div>
          {(practice.new > 0 || practice.again > 0) && (
            <div className="flex flex-wrap gap-2">
              {practice.new > 0 && (
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  {practice.new} new
                </span>
              )}
              {practice.again > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                  {practice.again} to practise again
                </span>
              )}
            </div>
          )}
          {practice.due > 0 && (
            <Link
              href={`${page}/flashcards`}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand-yellow text-lg font-bold text-brand-navy hover:bg-brand-yellow-light"
            >
              Start flashcards
            </Link>
          )}
          {hasWords && (
            <Link href={`${page}/words`} className="flex min-h-11 items-center justify-center text-base font-semibold text-brand-navy underline-offset-4 hover:underline">
              See all my words
            </Link>
          )}
        </section>

        {data.comingUp.map((lesson) => (
          <section key={lesson.id} className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-label={`Coming up: ${lesson.title}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Coming up</span>
            <h2 className="font-nunito text-xl font-extrabold">{lesson.title}</h2>
            <p className="text-base font-normal text-gray-700">Read the text and learn the new words before your lesson.</p>
            <Link
              href={`${page}/lessons/${lesson.id}`}
              className="flex min-h-12 items-center justify-center rounded-xl bg-brand-navy text-base font-bold text-white hover:bg-brand-navy-light"
            >
              Get ready for this lesson
            </Link>
          </section>
        ))}

        <section className="flex flex-col gap-3" aria-labelledby="finished-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="finished-heading" className="font-nunito text-xl font-extrabold">Finished lessons</h2>
            {data.finished.length > 0 && (
              <span className="text-sm text-gray-600">{plural(data.finished.length, "lesson", "lessons")}</span>
            )}
          </div>
          {data.finished.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 p-5 text-base font-normal text-gray-600">
              Your lessons will appear here after you do them in class.
            </p>
          ) : (
            data.finished.map((lesson) => (
              <Link
                key={lesson.id}
                href={`${page}/lessons/${lesson.id}`}
                className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-brand-navy hover:border-gray-300"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-bold">{lesson.title}</span>
                  <span className="text-sm font-normal text-gray-600">{lessonMeta(lesson)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
              </Link>
            ))
          )}
        </section>

        <p className="mt-2 text-center text-sm font-normal text-gray-600">
          This is your private page. Please don't share the link.
          <br />
          Made with PlanwiseESL
        </p>
      </main>
    </StudentPageFrame>
  );
}
