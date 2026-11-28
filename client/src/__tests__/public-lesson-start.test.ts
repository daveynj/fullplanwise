/**
 * A free library lesson opens with one short panel (what's inside, "Start the
 * lesson", "Make it for my student", print the questions) instead of three
 * stacked banners, and ends with a next step once the visitor reaches the last
 * section. Every step is tracked so the daily report can show how far visitors get.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement as h } from "react";

const analytics = vi.hoisted(() => ({ trackEvent: vi.fn(), trackCta: vi.fn() }));
vi.mock("@/lib/analytics", () => analytics);

import { PublicLessonStart, PublicLessonFinish, publicLessonFacts } from "@/components/lesson/public-lesson-start";

const content = {
  title: "Robots at Work",
  estimatedTime: 60,
  sections: [
    { type: "warmup", questions: ["Q1"] },
    { type: "vocabulary", words: [{ term: "a" }, { term: "b" }, { term: "c" }, { term: "d" }, { term: "e" }] },
    { type: "reading", paragraphs: ["Text"] },
    { type: "comprehension", questions: [] },
    { type: "discussion", questions: [{ question: "D1" }, { question: "D2" }, { question: "D3" }] },
  ],
};
const tutorLink = { href: "https://speakwithdave.com/", linkText: "Learn with Dave", belowTaughtLevels: false } as any;

beforeEach(() => analytics.trackEvent.mockClear());
afterEach(cleanup);

describe("publicLessonFacts", () => {
  it("counts words, discussion questions and minutes from the lesson itself", () => {
    expect(publicLessonFacts(content)).toEqual({ words: 5, reading: true, questions: 3, minutes: 60 });
  });

  it("copes with a lesson that has no sections or time", () => {
    expect(publicLessonFacts({ sections: [] })).toEqual({ words: 0, reading: false, questions: 0, minutes: null });
    expect(publicLessonFacts(null)).toEqual({ words: 0, reading: false, questions: 0, minutes: null });
  });
});

describe("PublicLessonStart", () => {
  const props = {
    lessonId: 42, level: "B1", content, remixHref: "/auth?register=true&redirect=%2Fgenerate",
    questionsHref: "/esl-lessons/b1/robots-at-work/questions", tutorLink, onStart: vi.fn(),
  };

  it("shows what the lesson contains as short facts", () => {
    render(h(PublicLessonStart, props));
    for (const fact of ["Free · no login", "5 key words", "A reading", "3 discussion questions", "About 60 min", "Printable PDF"]) {
      expect(screen.getByText(fact)).toBeTruthy();
    }
  });

  it("starts the lesson and records it", () => {
    const onStart = vi.fn();
    render(h(PublicLessonStart, { ...props, onStart }));
    fireEvent.click(screen.getByTestId("public-lesson-start-button"));
    expect(onStart).toHaveBeenCalledOnce();
    expect(analytics.trackEvent).toHaveBeenCalledWith("public_lesson_started", { lesson_id: 42, cefr_level: "B1" });
  });

  it("links to making it for a student and to the printable questions", () => {
    render(h(PublicLessonStart, props));
    expect(screen.getByText("Make it for my student").closest("a")?.getAttribute("href")).toBe(props.remixHref);
    expect(screen.getByText("Print the questions").closest("a")?.getAttribute("href")).toBe(props.questionsHref);
  });

  it("leaves out the print link when the lesson has no public address", () => {
    render(h(PublicLessonStart, { ...props, questionsHref: null }));
    expect(screen.queryByText("Print the questions")).toBeNull();
  });
});

describe("PublicLessonFinish", () => {
  it("offers the next step and more lessons at the same level", () => {
    render(h(PublicLessonFinish, { lessonId: 42, level: "B1", remixHref: "/generate?topic=x", questionsHref: null }));
    expect(screen.getByText("Make it for my student").closest("a")?.getAttribute("href")).toBe("/generate?topic=x");
    expect(screen.getByText(/More free B1 lessons/).closest("a")?.getAttribute("href")).toBe("/esl-lessons/b1");
    fireEvent.click(screen.getByText("Make it for my student"));
    expect(analytics.trackEvent).toHaveBeenCalledWith("public_lesson_remix_clicked", { lesson_id: 42, cefr_level: "B1", location: "finish" });
  });
});
