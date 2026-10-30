import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Check, Layers, Lock } from "lucide-react";
import { studentPagePath, type StudentPageLesson } from "@shared/student-page";
import { getStudentPage, removeMadeLesson, studentPageUrls } from "@/lib/student-page-api";
import { LessonContent } from "@/components/lesson/lesson-content";
import type { ParsedLessonContent } from "../../../types/lessonContentTypes";
import {
  BackLink,
  StudentPageFrame,
  StudentPageLoading,
  StudentPageProblem,
  useStudentPageTitle,
} from "@/components/student-page/student-page-layout";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

interface NewWord {
  term: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  imageUrl: string;
}

/** The reading paragraphs and new words of a planned lesson's content. */
function preparation(content: Record<string, unknown>) {
  const sections = Array.isArray(content.sections) ? content.sections.filter(isRecord) : [];
  const reading = sections.find((section) => section.type === "reading");
  const vocabulary = sections.find((section) => section.type === "vocabulary");
  const paragraphs = Array.isArray(reading?.paragraphs) ? reading!.paragraphs.map(text).filter(Boolean) : [];
  const words: NewWord[] = (Array.isArray(vocabulary?.words) ? vocabulary!.words : [])
    .filter(isRecord)
    .map((word) => ({
      term: text(word.term) || text(word.word),
      partOfSpeech: text(word.partOfSpeech),
      definition: text(word.coreDefinition) || text(word.definition),
      example: text(word.example),
      imageUrl: text(word.imageUrl),
    }))
    .filter((word) => word.term);
  return { readingTitle: text(reading?.title).replace(/^Reading Text:\s*/i, ""), paragraphs, words };
}

/** A paragraph with the lesson's new words highlighted, endings included ("strengths"). */
function Highlighted({ paragraph, words }: { paragraph: string; words: string[] }) {
  const parts = useMemo(() => {
    const terms = words.filter(Boolean).sort((a, b) => b.length - a.length)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!terms.length) return [paragraph];
    return paragraph.split(new RegExp(`\\b((?:${terms.join("|")})\\w*)`, "gi"));
  }, [paragraph, words]);
  return (
    <p className="text-lg font-normal leading-relaxed text-gray-800">
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index} className="rounded bg-yellow-100 px-1 font-bold">{part}</strong> : part,
      )}
    </p>
  );
}

type Tab = "reading" | "words" | "activities";

/** A lesson the student made can be removed until they do it in class (it is deleted). */
function RemoveMadeLesson({ token, lessonId, page }: { token: string; lessonId: number; page: string }) {
  const [confirming, setConfirming] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const urls = studentPageUrls(token);
  const remove = useMutation({
    mutationFn: () => removeMadeLesson(token, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [urls.home] });
      queryClient.invalidateQueries({ queryKey: [urls.next] });
      navigate(page);
    },
  });
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-11 self-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
      >
        Remove this lesson
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3">
      <span className="min-w-[10rem] flex-1 text-sm font-semibold text-red-900">
        {remove.error ? remove.error.message : "Remove this lesson? It will be deleted."}
      </span>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => remove.mutate()}
        className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
      >
        Yes, remove
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-brand-navy hover:bg-white">
        Keep it
      </button>
    </div>
  );
}

/** A planned lesson: the reading and new words to prepare, with the activities kept for class. */
function GetReady({ lesson, page, token }: { lesson: StudentPageLesson; page: string; token: string }) {
  const [tab, setTab] = useState<Tab>("reading");
  const { readingTitle, paragraphs, words } = useMemo(() => preparation(lesson.content), [lesson.content]);
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "reading", label: "Reading" },
    { id: "words", label: "New words" },
    { id: "activities", label: "Activities" },
  ];
  let body: ReactNode;
  if (tab === "reading") {
    body = (
      <article className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        {readingTitle && <h2 className="font-nunito text-xl font-extrabold">{readingTitle}</h2>}
        {paragraphs.map((paragraph, index) => (
          <Highlighted key={index} paragraph={paragraph} words={words.map((word) => word.term)} />
        ))}
        {paragraphs.length === 0 && <p className="text-base font-normal text-gray-600">This lesson has no reading text.</p>}
        {words.length > 0 && <p className="text-sm font-normal text-gray-600">The highlighted words are explained under "New words".</p>}
      </article>
    );
  } else if (tab === "words") {
    body = (
      <ul className="flex flex-col gap-3">
        {words.map((word) => (
          <li key={word.term} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            {word.imageUrl && (
              <img src={word.imageUrl} alt="" className="h-40 w-full rounded-xl bg-gray-50 object-contain" />
            )}
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold">{word.term}</span>
              {word.partOfSpeech && <span className="text-sm font-normal text-gray-600">{word.partOfSpeech}</span>}
            </div>
            {word.definition && <p className="text-base font-normal text-gray-700">{word.definition}</p>}
            {word.example && <p className="rounded-lg bg-gray-50 px-3 py-2 text-base font-normal text-gray-800">{word.example}</p>}
          </li>
        ))}
        {words.length === 0 && <li className="text-base font-normal text-gray-600">This lesson has no new words.</li>}
      </ul>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="font-nunito text-lg font-extrabold leading-snug">These open in class</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {lesson.lockedActivities.map((activity) => (
            <li key={activity} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-base font-semibold text-gray-700">
              <Lock className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              {activity}
            </li>
          ))}
        </ul>
        <p className="text-sm font-normal text-gray-600">The answers stay hidden until your lesson, so nothing is spoiled.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col gap-3 px-5 pb-4 pt-3">
        <BackLink href={page} label="My page" />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">Coming up</span>
          {lesson.madeByYou && <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-900">Made by you</span>}
        </div>
        <h1 className="font-nunito text-3xl font-extrabold leading-tight">{lesson.title}</h1>
        <p className="text-base font-normal text-gray-600">Level {lesson.cefrLevel} · Read the text and learn the new words before your lesson.</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1" role="group" aria-label="Show">
          {tabs.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={tab === option.id}
              onClick={() => setTab(option.id)}
              className={`min-h-11 rounded-lg text-sm font-bold ${tab === option.id ? "bg-brand-navy text-white" : "text-brand-navy"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-4">
        {body}
        {lesson.madeByYou && <RemoveMadeLesson token={token} lessonId={lesson.id} page={page} />}
      </div>
      <div className="flex items-center gap-3 border-t border-gray-200 bg-white px-5 pb-6 pt-3">
        <Layers className="h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
        <span className="text-sm font-normal text-gray-700">After your class, these words join your list and your flashcards.</span>
      </div>
    </div>
  );
}

/** One of the student's lessons: getting ready for a planned one, or the whole of a finished one. */
export default function StudentPageLessonPage() {
  const { token, lessonId } = useParams<{ token: string; lessonId: string }>();
  const urls = studentPageUrls(token);
  const page = studentPagePath(token);
  const { data, error, isLoading } = useQuery<StudentPageLesson>({
    queryKey: [urls.lesson(lessonId)],
    queryFn: () => getStudentPage<StudentPageLesson>(urls.lesson(lessonId)),
  });
  useStudentPageTitle(data?.title);

  if (isLoading) return <StudentPageLoading />;
  if (error || !data) return <StudentPageProblem error={error} backHref={page} />;

  if (data.status === "planned") {
    return (
      <StudentPageFrame>
        <GetReady lesson={data} page={page} token={token} />
      </StudentPageFrame>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-brand-navy">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 pb-2 pt-3 md:px-6">
        <BackLink href={page} label="My page" />
        <span className="flex items-center gap-1.5 self-start rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          Done · {formatDay(data.date)}
        </span>
      </div>
      <LessonContent content={{ ...data.content, grammarSpotlight: data.grammarSpotlight ?? undefined } as ParsedLessonContent} />
    </div>
  );
}
