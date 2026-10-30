import type { PracticeResult, StudentIdeaSummary } from "@shared/student-page";

/**
 * Requests for a student's own page (shared/student-page.ts). The page code
 * in the address is the only key: students don't log in.
 */

export class StudentPageError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const studentPageUrls = (token: string) => {
  const base = `/api/student-page/${encodeURIComponent(token)}`;
  return {
    home: base,
    words: `${base}/words`,
    flashcards: `${base}/flashcards`,
    flashcard: (wordId: number) => `${base}/flashcards/${wordId}`,
    lesson: (lessonId: number | string) => `${base}/lessons/${encodeURIComponent(String(lessonId))}`,
    next: `${base}/next`,
    ideas: `${base}/ideas`,
    idea: (ideaId: number) => `${base}/ideas/${ideaId}`,
    makeLesson: `${base}/lessons`,
    making: (jobId: string) => `${base}/making/${encodeURIComponent(jobId)}`,
    nextLesson: `${base}/next-lesson`,
  };
};

async function read<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      message = (await res.json()).message || message;
    } catch {
      // Not JSON: keep the general message.
    }
    throw new StudentPageError(res.status, message);
  }
  return res.json();
}

export async function getStudentPage<T>(url: string): Promise<T> {
  return read<T>(await fetch(url, { headers: { Accept: "application/json" } }));
}

export async function sendFlashcardResult(token: string, wordId: number, result: PracticeResult): Promise<void> {
  await read(await fetch(studentPageUrls(token).flashcard(wordId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  }));
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  return read<T>(await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
}

export const sendIdea = (token: string, topic: string) =>
  send<StudentIdeaSummary>(studentPageUrls(token).ideas, "POST", { topic });

export const removeIdea = (token: string, ideaId: number) => send(studentPageUrls(token).idea(ideaId), "DELETE");

/** Removes a lesson the student made and hasn't done yet. */
export const removeMadeLesson = (token: string, lessonId: number) => send(studentPageUrls(token).lesson(lessonId), "DELETE");

/** Stars the coming-up lesson the student wants to do next. */
export const chooseNextLesson = (token: string, lessonId: number) =>
  send(studentPageUrls(token).nextLesson, "PUT", { lessonId });

/**
 * Starts making a lesson from the student's topic and returns the job to
 * follow. If a lesson is already being made, that one is followed instead.
 */
export async function makeLesson(token: string, topic: string): Promise<{ jobId: string }> {
  const res = await fetch(studentPageUrls(token).makeLesson, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  if (res.status === 409) {
    const body = await res.clone().json().catch(() => ({}));
    if (typeof body.jobId === "string") return { jobId: body.jobId };
  }
  return read<{ jobId: string }>(res);
}
