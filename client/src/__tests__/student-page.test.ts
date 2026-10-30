/**
 * A student's own page (shared/student-page.ts): flashcards save each answer
 * and offer the "Not yet" cards again, a planned lesson shows only its
 * reading and new words, a link that no longer works says so plainly, the
 * student sends ideas or makes a lesson, and stars the lesson they want next.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement as h, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import StudentPageFlashcardsPage from "@/pages/student-page-flashcards";
import StudentPageLessonPage from "@/pages/student-page-lesson";
import StudentPageHomePage from "@/pages/student-page-home";
import StudentPageNextPage from "@/pages/student-page-next";

const TOKEN = "k7Qm2xV9pLr4Tz8eR2t8Wq5n";

/** Answers the page's requests from `routes` (path → body), or 404. */
function serve(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") return new Response(JSON.stringify({ ok: true }), { status: 200 });
    const body = routes[url];
    return body === undefined
      ? new Response(JSON.stringify({ message: "This page isn't available. Ask your teacher for a new link." }), { status: 404 })
      : new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function show(path: string, pattern: string, page: ComponentType) {
  const { hook } = memoryLocation({ path });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(h(QueryClientProvider, { client }, h(Router, { hook }, h(Route, { path: pattern, component: page }))));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Answers each request with handle(method, url, body), as JSON. */
function respond(handle: (method: string, url: string, body: any) => [number, unknown]) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const [status, body] = handle(init?.method ?? "GET", url, init?.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const calls = (fetchMock: ReturnType<typeof respond>, method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? "GET") === method)
    .map(([url, init]) => [url, init?.body ? JSON.parse(String(init.body)) : undefined]);

describe("flashcards", () => {
  const card = (id: number, word: string) => ({
    id, word, meaning: `the meaning of ${word}`, kind: "word", example: `I like my **${word}**.`,
    partOfSpeech: "noun", lessonTitle: "Working from Home", imageUrl: null,
  });

  it("shows the word, then its meaning, saves each answer and offers the \"Not yet\" cards again", async () => {
    const fetchMock = serve({ [`/api/student-page/${TOKEN}/flashcards`]: { due: 2, cards: [card(1, "commute"), card(2, "routine")] } });
    show(`/s/${TOKEN}/flashcards`, "/s/:token/flashcards", StudentPageFlashcardsPage);

    expect(await screen.findByRole("heading", { name: "commute" })).toBeTruthy();
    expect(screen.getByText("Card 1 of 2")).toBeTruthy();
    expect(screen.queryByText("the meaning of commute")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show the meaning" }));
    expect(screen.getByText("the meaning of commute")).toBeTruthy();
    expect(screen.getByText("commute", { selector: "strong" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    fireEvent.click(await screen.findByRole("button", { name: "Show the meaning" }));
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));

    expect(await screen.findByRole("heading", { name: "Nice work!" })).toBeTruthy();
    const answers = fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")
      .map(([url, init]) => [url, JSON.parse(String(init!.body)).result]);
    expect(answers).toEqual([
      [`/api/student-page/${TOKEN}/flashcards/1`, "got"],
      [`/api/student-page/${TOKEN}/flashcards/2`, "again"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Practise that card again" }));
    expect(await screen.findByRole("heading", { name: "routine" })).toBeTruthy();
    expect(screen.getByText("Card 1 of 1")).toBeTruthy();
  });
});

describe("a planned lesson", () => {
  it("shows the reading with the new words highlighted, and keeps the activities for class", async () => {
    serve({
      [`/api/student-page/${TOKEN}/lessons/42`]: {
        id: 42, title: "Job Interviews", cefrLevel: "B2", status: "planned", date: "2026-10-29T00:00:00.000Z",
        grammarSpotlight: null, lockedActivities: ["Warm-up", "Quiz"],
        content: {
          title: "Job Interviews",
          sections: [
            { type: "reading", title: "Reading Text: Preparing for an Interview", paragraphs: ["Think about your strengths and a weakness."] },
            { type: "vocabulary", words: [{ term: "strength", definition: "a good quality" }, { term: "weakness", definition: "something you are not good at" }] },
          ],
        },
      },
    });
    show(`/s/${TOKEN}/lessons/42`, "/s/:token/lessons/:lessonId", StudentPageLessonPage);

    expect(await screen.findByRole("heading", { name: "Job Interviews" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Preparing for an Interview" })).toBeTruthy();
    expect(screen.getAllByText(/strengths|weakness/, { selector: "strong" }).map((el) => el.textContent)).toEqual(["strengths", "weakness"]);

    fireEvent.click(screen.getByRole("button", { name: "New words" }));
    expect(screen.getByText("something you are not good at")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Activities" }));
    expect(screen.getByRole("heading", { name: "These open in class" })).toBeTruthy();
    expect(screen.getByText("Quiz")).toBeTruthy();
  });
});

describe("a link that no longer works", () => {
  it("says the page isn't available", async () => {
    serve({});
    show(`/s/${TOKEN}`, "/s/:token", StudentPageHomePage);
    await waitFor(() => expect(screen.getByRole("heading", { name: "This page isn't available" })).toBeTruthy());
    expect(screen.getByText("This page isn't available. Ask your teacher for a new link.")).toBeTruthy();
  });
});

describe("what should we talk about next?", () => {
  const nextPage = (overrides: Record<string, unknown> = {}) => ({
    student: { name: "Shingo", cefrLevel: "B2" },
    teacherName: "Dave",
    canMakeLessons: false,
    ideas: [],
    madeLessons: [],
    making: null,
    dailyLimitReached: false,
    ...overrides,
  });

  it("sends a student's idea to their teacher", async () => {
    const fetchMock = respond((method, url, body) => {
      if (method === "POST") return [201, { id: 10, topic: body.topic, sentAt: "2026-10-30T00:00:00.000Z" }];
      return url.endsWith("/next") ? [200, nextPage()] : [404, {}];
    });
    show(`/s/${TOKEN}/next`, "/s/:token/next", StudentPageNextPage);

    expect(await screen.findByRole("heading", { name: "What should we talk about next?" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Make the lesson now" })).toBeNull();
    const send = screen.getByRole("button", { name: "Send my idea to Dave" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Films and TV" }));
    fireEvent.click(send);
    expect(await screen.findByRole("heading", { name: "Sent to Dave!" })).toBeTruthy();
    expect(calls(fetchMock, "POST")).toEqual([[`/api/student-page/${TOKEN}/ideas`, { topic: "Films and TV" }]]);
  });

  it("makes a lesson for a student of an Unlimited teacher and opens it when it is ready", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let checks = 0;
    const fetchMock = respond((method, url) => {
      if (method === "POST") return [202, { jobId: "sjob_1" }];
      if (url.includes("/making/")) {
        checks++;
        return [200, checks === 1 ? { status: "pending", topic: "My hobbies" } : { status: "complete", lesson: { id: 46, title: "Talking About Hobbies", cefrLevel: "B2" } }];
      }
      return url.endsWith("/next") ? [200, nextPage({ canMakeLessons: true })] : [404, {}];
    });
    show(`/s/${TOKEN}/next`, "/s/:token/next", StudentPageNextPage);

    fireEvent.change(await screen.findByLabelText("Your topic"), { target: { value: "  My   hobbies " } });
    fireEvent.click(screen.getByRole("button", { name: "Make the lesson now" }));
    expect(await screen.findByRole("heading", { name: "Making your lesson…" })).toBeTruthy();
    expect(calls(fetchMock, "POST")).toEqual([[`/api/student-page/${TOKEN}/lessons`, { topic: "My hobbies" }]]);

    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await screen.findByRole("heading", { name: "Your lesson is ready!" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Get ready for this lesson" }).getAttribute("href")).toBe(`/s/${TOKEN}/lessons/46`);
  });

  it("says when making a lesson failed and keeps the topic for another try", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    respond((method, url) => {
      if (method === "POST") return [202, { jobId: "sjob_1" }];
      if (url.includes("/making/")) return [200, { status: "error", message: "Sorry, we couldn't make your lesson. Please try again." }];
      return url.endsWith("/next") ? [200, nextPage({ canMakeLessons: true })] : [404, {}];
    });
    show(`/s/${TOKEN}/next`, "/s/:token/next", StudentPageNextPage);

    fireEvent.change(await screen.findByLabelText("Your topic"), { target: { value: "Travel plans" } });
    fireEvent.click(screen.getByRole("button", { name: "Make the lesson now" }));
    expect(await screen.findByRole("heading", { name: "Making your lesson…" })).toBeTruthy();
    await vi.advanceTimersByTimeAsync(3000);
    expect((await screen.findByRole("alert")).textContent).toBe("Sorry, we couldn't make your lesson. Please try again.");
    expect((screen.getByLabelText("Your topic") as HTMLTextAreaElement).value).toBe("Travel plans");
  });

  it("says when 3 lessons the student made are waiting, and removes one after asking", async () => {
    const madeLessons = [1, 2, 3].map((id) => ({ id, title: `Lesson ${id}`, date: "2026-10-29T00:00:00.000Z" }));
    const fetchMock = respond((method, url) => {
      if (method === "DELETE") return [200, { ok: true }];
      return url.endsWith("/next") ? [200, nextPage({ canMakeLessons: true, madeLessons })] : [404, {}];
    });
    show(`/s/${TOKEN}/next`, "/s/:token/next", StudentPageNextPage);

    fireEvent.change(await screen.findByLabelText("Your topic"), { target: { value: "Travel plans" } });
    expect((screen.getByRole("button", { name: "Make the lesson now" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Just send my idea to Dave" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/You have 3 lessons you made waiting/)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    expect(screen.getByText("Remove this lesson? It will be deleted.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Yes, remove" }));
    await waitFor(() => expect(calls(fetchMock, "DELETE")).toEqual([[`/api/student-page/${TOKEN}/lessons/2`, undefined]]));
  });
});

describe("choosing the next lesson", () => {
  it("stars the coming-up lesson the student wants next", async () => {
    const lesson = (id: number, title: string, madeByYou = false) =>
      ({ id, title, cefrLevel: "B2", date: "2026-10-29T00:00:00.000Z", words: 0, expressions: 0, madeByYou });
    const fetchMock = respond((method, url) => {
      if (method === "PUT") return [200, { ok: true }];
      if (url === `/api/student-page/${TOKEN}`) {
        return [200, {
          student: { name: "Shingo", cefrLevel: "B2" },
          teacherName: "Dave",
          stats: { lessonsDone: 0, words: 0, expressions: 0 },
          practice: { due: 0, new: 0, again: 0 },
          comingUp: [lesson(44, "Talking About Hobbies", true), lesson(42, "Job Interviews")],
          finished: [],
          nextLessonId: 44,
          canMakeLessons: true,
          making: null,
        }];
      }
      return [404, {}];
    });
    show(`/s/${TOKEN}`, "/s/:token", StudentPageHomePage);

    expect(await screen.findByText("Your choice for the next class")).toBeTruthy();
    expect(screen.getByText("Made by you")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Suggest or make a lesson" }).getAttribute("href")).toBe(`/s/${TOKEN}/next`);
    fireEvent.click(screen.getByRole("button", { name: "Choose for the next class" }));
    await waitFor(() => expect(calls(fetchMock, "PUT")).toEqual([[`/api/student-page/${TOKEN}/next-lesson`, { lessonId: 42 }]]));
  });
});
