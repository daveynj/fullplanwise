import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { lessonPath } from "@shared/lesson-url";
import { PUBLIC_LESSON_TAGS, publicTags } from "@shared/public-lesson-tags";
import { relatedLessonGroups, type BrowsableLesson } from "@shared/library-browse";

interface LibraryLesson extends BrowsableLesson {
  publicSlug?: string | null;
  publicLevel?: string | null;
}

/**
 * "More like this" under a public library lesson: other lessons at this level
 * (same theme first), the theme at other levels, and where to browse on. The
 * same grouping the crawler HTML gets (server/lesson-prerender.ts), so readers
 * and search engines see the same links.
 */
export function RelatedPublicLessons({ lesson }: { lesson: BrowsableLesson }) {
  const { data } = useQuery<{ lessons: LibraryLesson[] }>({
    queryKey: ["public-lesson-index", "all"],
    queryFn: async () => {
      const res = await fetch("/api/public-lesson-index");
      if (!res.ok) throw new Error("Failed to load lessons");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const all = data?.lessons ?? [];
  if (!all.length) return null;
  const groups = relatedLessonGroups(lesson, all);
  if (!groups.sameLevel.length && !groups.otherLevels.length) return null;
  const mainTag = publicTags(lesson.tags)[0];
  const level = lesson.cefrLevel.toUpperCase();

  return (
    <section aria-labelledby="related-lessons-heading" className="my-8 max-w-4xl mx-auto rounded-xl border border-slate-200 bg-white p-5 print:hidden">
      <h2 id="related-lessons-heading" className="text-lg font-semibold text-brand-navy mb-3">More like this</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {groups.sameLevel.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">More {level} lessons</h3>
            <ul className="space-y-1.5 text-sm">
              {groups.sameLevel.map((l) => (
                <li key={l.id}>
                  <Link href={lessonPath(l)} className="text-brand-navy underline decoration-slate-300 underline-offset-2 hover:decoration-brand-yellow">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {groups.otherLevels.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {mainTag ? PUBLIC_LESSON_TAGS[mainTag] : "This theme"} at other levels
            </h3>
            <ul className="space-y-1.5 text-sm">
              {groups.otherLevels.map((l) => (
                <li key={l.id}>
                  <Link href={lessonPath(l)} className="text-brand-navy underline decoration-slate-300 underline-offset-2 hover:decoration-brand-yellow">
                    {l.title}
                  </Link>{" "}
                  <span className="text-slate-500">({l.cefrLevel})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {groups.browse.length > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          Browse:{" "}
          {groups.browse.map((b, i) => (
            <span key={b.href}>
              {i > 0 && " · "}
              <Link href={b.href} className="font-medium text-brand-navy underline underline-offset-2">{b.label}</Link>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
