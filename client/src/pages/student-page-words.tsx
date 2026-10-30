import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Search } from "lucide-react";
import { studentPagePath, type StudentPageWord, type WordStatus } from "@shared/student-page";
import { getStudentPage, studentPageUrls } from "@/lib/student-page-api";
import {
  BackLink,
  KindTag,
  StudentPageFrame,
  StudentPageLoading,
  StudentPageProblem,
  useStudentPageTitle,
} from "@/components/student-page/student-page-layout";

type Filter = "all" | "words" | "expressions";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "words", label: "Words" },
  { id: "expressions", label: "Idioms & phrasal verbs" },
];

const STATUS: Record<WordStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-50 text-blue-800" },
  practising: { label: "Practising", className: "bg-amber-100 text-amber-900" },
  known: { label: "Got it", className: "bg-green-100 text-green-800" },
};

/** Every word and expression from the student's finished lessons. */
export default function StudentPageWordsPage() {
  const { token } = useParams<{ token: string }>();
  const urls = studentPageUrls(token);
  const page = studentPagePath(token);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const { data, error, isLoading } = useQuery<StudentPageWord[]>({
    queryKey: [urls.words],
    queryFn: () => getStudentPage<StudentPageWord[]>(urls.words),
  });
  useStudentPageTitle("My words");

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data ?? []).filter((word) =>
      (filter === "all" || (filter === "words") === (word.kind === "word")) &&
      (!query || word.word.toLowerCase().includes(query) || (word.definition ?? "").toLowerCase().includes(query)),
    );
  }, [data, filter, search]);

  if (isLoading) return <StudentPageLoading />;
  if (error || !data) return <StudentPageProblem error={error} backHref={page} />;

  const words = data.filter((word) => word.kind === "word").length;
  const expressions = data.length - words;

  return (
    <StudentPageFrame>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-col gap-3 px-5 pb-3 pt-3">
          <BackLink href={page} label="My page" />
          <h1 className="font-nunito text-3xl font-extrabold">My words</h1>
          <p className="text-base font-normal text-gray-600">
            {expressions > 0
              ? `${words} ${words === 1 ? "word" : "words"}, plus ${expressions} ${expressions === 1 ? "idiom or phrasal verb" : "idioms and phrasal verbs"}, from your finished lessons.`
              : `${words} ${words === 1 ? "word" : "words"} from your finished lessons.`}
          </p>
          <div className="relative">
            <label htmlFor="word-search" className="sr-only">Search my words</label>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-600" aria-hidden="true" />
            <input
              id="word-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search my words"
              className="h-12 w-full rounded-xl border border-gray-400 bg-white pl-11 pr-3 text-base font-normal text-brand-navy placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`min-h-11 rounded-full border border-brand-navy px-4 text-sm font-semibold ${
                  filter === option.id ? "bg-brand-navy text-white" : "bg-white text-brand-navy"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2.5 px-5 pb-4">
          {shown.map((word) => (
            <li key={word.id} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{word.word}</span>
                  <KindTag kind={word.kind} />
                </div>
                {word.definition && <span className="text-base font-normal text-gray-700">{word.definition}</span>}
                {word.lessonTitle && <span className="text-sm font-normal text-gray-600">From: {word.lessonTitle}</span>}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${STATUS[word.status].className}`}>
                {STATUS[word.status].label}
              </span>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="py-8 text-center text-base font-normal text-gray-600">
              {data.length === 0 ? "Your words will appear here after your first lesson." : "No words match your search."}
            </li>
          )}
        </ul>

        {data.length > 0 && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 pb-6 pt-3">
            <Link
              href={`${page}/flashcards`}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand-yellow text-lg font-bold text-brand-navy hover:bg-brand-yellow-light"
            >
              Practise with flashcards
            </Link>
          </div>
        )}
      </div>
    </StudentPageFrame>
  );
}
