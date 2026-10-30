import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Check, Loader2 } from "lucide-react";
import {
  MAX_WAITING_IDEAS,
  MAX_WAITING_STUDENT_LESSONS,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
  studentPagePath,
  type StudentLessonJob,
  type StudentNextPage,
} from "@shared/student-page";
import {
  StudentPageError,
  getStudentPage,
  makeLesson,
  removeIdea,
  removeMadeLesson,
  sendIdea,
  studentPageUrls,
} from "@/lib/student-page-api";
import {
  BackLink,
  StudentPageFrame,
  StudentPageLoading,
  StudentPageProblem,
  useStudentPageTitle,
} from "@/components/student-page/student-page-layout";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const IDEA_STARTERS = ["Job interviews", "Travel plans", "Food and cooking", "Films and TV"];

/** How often the page checks on a lesson being made. */
const CHECK_EVERY_MS = 3000;

type MadeLesson = { id: number; title: string; cefrLevel: string };

type Step =
  | { kind: "write" }
  | { kind: "making"; jobId: string; topic: string }
  | { kind: "ready"; lesson: MadeLesson }
  | { kind: "sent"; topic: string };

const primaryButton =
  "flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-4 text-lg font-bold text-brand-navy hover:bg-brand-yellow-light disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-brand-navy bg-white px-4 text-base font-bold text-brand-navy hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

/** A lesson the student made, or an idea they sent, with a "Remove" that asks first. */
function WaitingRow({ title, detail, href, confirmText, busy, onRemove }: {
  title: string;
  detail: string;
  href?: string;
  confirmText: string;
  busy: boolean;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {href ? (
            <Link href={href} className="text-base font-bold text-brand-navy underline-offset-4 hover:underline">{title}</Link>
          ) : (
            <span className="text-base font-bold">{title}</span>
          )}
          <span className="text-sm font-normal text-gray-600">{detail}</span>
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Remove
          </button>
        )}
      </div>
      {confirming && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3">
          <span className="min-w-[10rem] flex-1 text-sm font-semibold text-red-900">{confirmText}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              onRemove();
            }}
            className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            Yes, remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-brand-navy hover:bg-white"
          >
            Keep it
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * "What should we talk about next?": the student suggests a topic to their
 * teacher or, with an Unlimited teacher, makes the lesson themselves.
 */
export default function StudentPageNextPage() {
  const { token } = useParams<{ token: string }>();
  const urls = studentPageUrls(token);
  const page = studentPagePath(token);
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<StudentNextPage>({
    queryKey: [urls.next],
    queryFn: () => getStudentPage<StudentNextPage>(urls.next),
  });
  useStudentPageTitle("What should we talk about next?");

  const [topic, setTopic] = useState("");
  const [step, setStep] = useState<Step>({ kind: "write" });
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [urls.next] });
    queryClient.invalidateQueries({ queryKey: [urls.home] });
  };

  // A lesson already being made when the page opens is followed, once.
  const followedMaking = useRef(false);
  useEffect(() => {
    if (data?.making && !followedMaking.current) {
      followedMaking.current = true;
      setStep({ kind: "making", jobId: data.making.jobId, topic: data.making.topic });
    }
  }, [data]);

  // While a lesson is being made, check on it every few seconds. If it fails,
  // the topic goes back in the box so trying again is one tap.
  const makingJobId = step.kind === "making" ? step.jobId : null;
  const makingTopic = step.kind === "making" ? step.topic : "";
  useEffect(() => {
    if (!makingJobId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const job = await getStudentPage<StudentLessonJob>(urls.making(makingJobId));
        if (stopped) return;
        if (job.status === "complete") {
          setStep({ kind: "ready", lesson: job.lesson });
          refresh();
          return;
        }
        if (job.status === "error") {
          setProblem(job.message);
          setTopic(makingTopic);
          setStep({ kind: "write" });
          refresh();
          return;
        }
      } catch (checkError) {
        if (stopped) return;
        if (checkError instanceof StudentPageError && checkError.status === 404) {
          setProblem(checkError.message);
          setStep({ kind: "write" });
          return;
        }
        // Anything else (a dropped connection): try again next time.
      }
      timer = setTimeout(check, CHECK_EVERY_MS);
    };
    timer = setTimeout(check, CHECK_EVERY_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makingJobId]);

  const make = useMutation({
    mutationFn: (value: string) => makeLesson(token, value),
    onSuccess: ({ jobId }, value) => {
      setProblem(null);
      setTopic("");
      setStep({ kind: "making", jobId, topic: value });
    },
    onError: (makeError: Error) => setProblem(makeError.message),
  });

  const send = useMutation({
    mutationFn: (value: string) => sendIdea(token, value),
    onSuccess: (idea) => {
      setProblem(null);
      setTopic("");
      setStep({ kind: "sent", topic: idea.topic });
      refresh();
    },
    onError: (sendError: Error) => setProblem(sendError.message),
  });

  const removeLesson = useMutation({
    mutationFn: (lessonId: number) => removeMadeLesson(token, lessonId),
    onSuccess: refresh,
    onError: (removeError: Error) => setProblem(removeError.message),
  });

  const removeSentIdea = useMutation({
    mutationFn: (ideaId: number) => removeIdea(token, ideaId),
    onSuccess: refresh,
    onError: (removeError: Error) => setProblem(removeError.message),
  });

  if (isLoading) return <StudentPageLoading />;
  if (error || !data) return <StudentPageProblem error={error} backHref={page} />;

  const teacher = data.teacherName ?? "your teacher";
  const Teacher = data.teacherName ?? "Your teacher";
  const level = data.student.cefrLevel;

  if (step.kind === "making") {
    return (
      <StudentPageFrame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-brand-navy" aria-hidden="true" />
          <h1 className="font-nunito text-2xl font-extrabold">Making your lesson…</h1>
          <p className="text-lg font-semibold">"{step.topic}" · Level {level}</p>
          <p className="text-base font-normal text-gray-600">
            This usually takes about 2 minutes. You can leave this page: your lesson will be on your page when it's ready.
          </p>
          <BackLink href={page} label="Back to my page" />
        </div>
      </StudentPageFrame>
    );
  }

  if (step.kind === "ready") {
    return (
      <StudentPageFrame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
          </span>
          <h1 className="font-nunito text-2xl font-extrabold">Your lesson is ready!</h1>
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 text-left">
            <span className="self-start rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-900">Made by you</span>
            <h2 className="font-nunito text-xl font-extrabold">{step.lesson.title}</h2>
            <p className="text-base font-normal text-gray-600">Level {step.lesson.cefrLevel}</p>
          </div>
          <p className="text-base font-normal text-gray-600">{Teacher} can see it too, and will look at it before your class.</p>
          <Link href={`${page}/lessons/${step.lesson.id}`} className={primaryButton}>Get ready for this lesson</Link>
          <BackLink href={page} label="Back to my page" />
        </div>
      </StudentPageFrame>
    );
  }

  if (step.kind === "sent") {
    return (
      <StudentPageFrame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
          </span>
          <h1 className="font-nunito text-2xl font-extrabold">Sent to {teacher}!</h1>
          <p className="text-base font-normal text-gray-600">
            {Teacher} will see "{step.topic}" and can make it into a lesson for you.
          </p>
          <Link href={page} className={primaryButton}>Back to my page</Link>
          <button type="button" onClick={() => setStep({ kind: "write" })} className={secondaryButton}>
            Suggest another topic
          </button>
        </div>
      </StudentPageFrame>
    );
  }

  const cleaned = topic.replace(/\s+/g, " ").trim();
  const topicReady = cleaned.length >= TOPIC_MIN_LENGTH;
  const busy = make.isPending || send.isPending;
  const lessonsFull = data.madeLessons.length >= MAX_WAITING_STUDENT_LESSONS;
  const ideasFull = data.ideas.length >= MAX_WAITING_IDEAS;
  const canMakeNow = data.canMakeLessons && !lessonsFull && !data.dailyLimitReached;

  let makeNote = `Your lesson will be at your level (${level}). You can have ${MAX_WAITING_STUDENT_LESSONS} lessons you made waiting at a time.`;
  if (lessonsFull) makeNote = `You have ${MAX_WAITING_STUDENT_LESSONS} lessons you made waiting. Remove one below to make another, or do one with ${teacher} first.`;
  else if (data.dailyLimitReached) makeNote = "You've made a lot of lessons today. You can make more tomorrow.";
  const sendNote = ideasFull
    ? `You have ${MAX_WAITING_IDEAS} ideas waiting. Remove one below to send another.`
    : `${Teacher} sees your ideas straight away.`;

  return (
    <StudentPageFrame>
      <div className="flex flex-col gap-5 px-5 pb-10 pt-3">
        <BackLink href={page} label="My page" />
        <div className="flex flex-col gap-2">
          <h1 className="font-nunito text-3xl font-extrabold leading-tight">What should we talk about next?</h1>
          <p className="text-base font-normal text-gray-600">
            {data.canMakeLessons ? `Make the lesson yourself, or send your idea to ${teacher}.` : `Your idea goes straight to ${teacher}.`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="student-topic" className="text-base font-bold">Your topic</label>
          <textarea
            id="student-topic"
            value={topic}
            maxLength={TOPIC_MAX_LENGTH}
            rows={3}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="For example: talking about my hobbies"
            className="w-full resize-none rounded-xl border-2 border-gray-300 bg-white p-3 text-lg font-normal text-brand-navy focus:border-brand-navy focus:outline-none"
          />
          <span className="self-end text-sm font-normal text-gray-600">{topic.length}/{TOPIC_MAX_LENGTH}</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-gray-700">Need an idea?</h2>
          <div className="flex flex-wrap gap-2">
            {IDEA_STARTERS.map((idea) => (
              <button
                key={idea}
                type="button"
                aria-pressed={cleaned === idea}
                onClick={() => setTopic(idea)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${cleaned === idea ? "border-brand-navy bg-brand-navy text-white" : "border-gray-300 bg-white text-brand-navy hover:border-gray-400"}`}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {problem && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base font-semibold text-red-900">{problem}</p>
        )}

        {data.canMakeLessons ? (
          <div className="flex flex-col gap-3">
            <button type="button" disabled={!topicReady || busy || !canMakeNow} onClick={() => make.mutate(cleaned)} className={primaryButton}>
              Make the lesson now
            </button>
            <button type="button" disabled={!topicReady || busy || ideasFull} onClick={() => send.mutate(cleaned)} className={secondaryButton}>
              Just send my idea to {teacher}
            </button>
            <p className="text-sm font-normal text-gray-600">{makeNote}</p>
            {ideasFull && <p className="text-sm font-normal text-gray-600">{sendNote}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button type="button" disabled={!topicReady || busy || ideasFull} onClick={() => send.mutate(cleaned)} className={primaryButton}>
              Send my idea to {teacher}
            </button>
            <p className="text-sm font-normal text-gray-600">{sendNote}</p>
          </div>
        )}

        <section className="flex flex-col gap-3" aria-labelledby="waiting-heading">
          <h2 id="waiting-heading" className="font-nunito text-xl font-extrabold">Waiting for {teacher}</h2>
          {data.madeLessons.length === 0 && data.ideas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 p-5 text-base font-normal text-gray-600">
              {data.canMakeLessons ? "Lessons you make and ideas you send will appear here." : "Ideas you send will appear here."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.madeLessons.map((lesson) => (
                <WaitingRow
                  key={`lesson-${lesson.id}`}
                  title={lesson.title}
                  detail={`Lesson you made · ${formatDay(lesson.date)}`}
                  href={`${page}/lessons/${lesson.id}`}
                  confirmText="Remove this lesson? It will be deleted."
                  busy={removeLesson.isPending}
                  onRemove={() => removeLesson.mutate(lesson.id)}
                />
              ))}
              {data.ideas.map((idea) => (
                <WaitingRow
                  key={`idea-${idea.id}`}
                  title={`"${idea.topic}"`}
                  detail={`Idea · sent ${formatDay(idea.sentAt)}`}
                  confirmText="Remove this idea?"
                  busy={removeSentIdea.isPending}
                  onRemove={() => removeSentIdea.mutate(idea.id)}
                />
              ))}
            </ul>
          )}
          <p className="text-sm font-normal text-gray-600">
            {data.canMakeLessons || data.madeLessons.length > 0
              ? `Lessons you made: ${data.madeLessons.length} of ${MAX_WAITING_STUDENT_LESSONS} · Ideas: ${data.ideas.length} of ${MAX_WAITING_IDEAS}`
              : `Ideas: ${data.ideas.length} of ${MAX_WAITING_IDEAS}`}
          </p>
        </section>
      </div>
    </StudentPageFrame>
  );
}
