/**
 * A student's own page (shared/student-page.ts): flashcards save each answer
 * and offer the "Not yet" cards again, a planned lesson shows only its
 * reading and new words, and a link that no longer works says so plainly.
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
});

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
