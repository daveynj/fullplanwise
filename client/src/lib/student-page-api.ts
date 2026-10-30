import type { PracticeResult } from "@shared/student-page";

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
