/**
 * When a teacher's free time ends, the lesson maker and dashboard show what
 * they have built (each student and the words on their list) and one way to
 * keep building, instead of a red "No credits" error. The FOUNDER note only
 * appears while the code is valid.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement as h } from "react";

const analytics = vi.hoisted(() => ({ trackEvent: vi.fn(), trackCta: vi.fn() }));
vi.mock("@/lib/analytics", () => analytics);

import { KeepBuildingCard, studentLine } from "@/components/keep-building-card";

const summary = {
  lessons: 9,
  studentCount: 5,
  students: [
    { id: 2, name: "Maria", cefrLevel: "B1", lessons: 3, words: 18 },
    { id: 3, name: "Ken", cefrLevel: "B2", lessons: 1, words: 0 },
  ],
};

beforeEach(() => {
  analytics.trackEvent.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("studentLine", () => {
  it("reads like a note about the student, leaving out empty counts", () => {
    expect(studentLine(summary.students[0])).toBe("Maria · B1 · 18 words · 3 lessons");
    expect(studentLine(summary.students[1])).toBe("Ken · B2 · 1 lesson");
  });
});

describe("KeepBuildingCard", () => {
  it("shows what the teacher built and links to Unlimited and the free library", () => {
    vi.setSystemTime(new Date("2026-12-11T12:00:00Z"));
    render(h(KeepBuildingCard, { summary, mode: "ended", location: "lesson_maker" }));
    expect(screen.getByText("Keep building your students' lessons")).toBeTruthy();
    // Not every lesson was made for a student, so the totals sit side by side.
    expect(screen.getByText("9 lessons and 5 students")).toBeTruthy();
    expect(screen.getByText("Maria · B1 · 18 words · 3 lessons")).toBeTruthy();
    expect(screen.getByText("and 3 more students")).toBeTruthy();
    const keep = screen.getByText(/Keep building with Unlimited/).closest("a")!;
    expect(keep.getAttribute("href")).toBe("/buy-credits");
    expect(screen.getByText(/Or use the free library/).closest("a")?.getAttribute("href")).toBe("/esl-lessons");
    fireEvent.click(keep);
    expect(analytics.trackEvent).toHaveBeenCalledWith("upgrade_prompt_shown", { location: "lesson_maker", mode: "ended", students: 5 });
    expect(analytics.trackEvent).toHaveBeenCalledWith("upgrade_prompt_clicked", { location: "lesson_maker", mode: "ended" });
  });

  it("mentions FOUNDER until 13 December, and not after", () => {
    vi.setSystemTime(new Date("2026-12-13T20:00:00Z"));
    render(h(KeepBuildingCard, { summary, mode: "ended", location: "dashboard" }));
    expect(screen.getByTestId("founder-offer").textContent).toContain("FOUNDER");
    cleanup();
    vi.setSystemTime(new Date("2026-12-14T00:00:01Z"));
    render(h(KeepBuildingCard, { summary, mode: "ended", location: "dashboard" }));
    expect(screen.queryByTestId("founder-offer")).toBeNull();
  });

  it("works for a teacher with no students yet, and can hide its buttons", () => {
    render(h(KeepBuildingCard, { summary: { lessons: 0, studentCount: 0, students: [] }, mode: "free", location: "payment_page", showActions: false }));
    expect(screen.getByText("What you've built so far")).toBeTruthy();
    expect(screen.getByText("Everything you make stays in your account.")).toBeTruthy();
    expect(screen.queryByText(/Keep building with Unlimited/)).toBeNull();
  });
});
