/**
 * The dashboard checklist walks a teacher through the steps that make
 * PlanWise useful (a student, a lesson for them, their second lesson, their page), ticks each off
 * from their data, can be hidden, and disappears once everything is done.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement as h } from "react";

const analytics = vi.hoisted(() => ({ trackEvent: vi.fn(), trackCta: vi.fn() }));
vi.mock("@/lib/analytics", () => analytics);

import { GettingStartedChecklist } from "@/components/getting-started-checklist";

const none = { hasStudent: false, hasLessonForStudent: false, hasSecondLessonForStudent: false, hasStudentPage: false };

beforeEach(() => {
  window.localStorage.clear();
  analytics.trackEvent.mockClear();
});
afterEach(cleanup);

describe("getting started checklist", () => {
  it("starts with adding a student, and offers only the next step's button", () => {
    render(h(GettingStartedChecklist, { userId: 7, state: none }));
    expect(screen.getByText(/0 of 4 done/)).toBeTruthy();
    const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.includes("Add a student"));
    expect(buttons).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Make a lesson/ })).toBeNull();
  });

  it("ticks off what the teacher has done and moves to the next step", () => {
    render(h(GettingStartedChecklist, { userId: 7, state: { ...none, hasStudent: true } }));
    expect(screen.getByText(/1 of 4 done/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Make a lesson/ })).toBeTruthy();
    const items = document.querySelectorAll("li[data-done]");
    expect([...items].map((li) => li.getAttribute("data-done"))).toEqual(["true", "false", "false", "false"]);
  });

  it("can be hidden, and stays hidden for that teacher", () => {
    render(h(GettingStartedChecklist, { userId: 7, state: none }));
    fireEvent.click(screen.getByRole("button", { name: "Hide this checklist" }));
    expect(screen.queryByTestId("getting-started-checklist")).toBeNull();
    cleanup();
    render(h(GettingStartedChecklist, { userId: 7, state: none }));
    expect(screen.queryByTestId("getting-started-checklist")).toBeNull();
    cleanup();
    render(h(GettingStartedChecklist, { userId: 8, state: none }));
    expect(screen.getByTestId("getting-started-checklist")).toBeTruthy();
  });

  it("disappears when every step is done and records it once", () => {
    const all = { hasStudent: true, hasLessonForStudent: true, hasSecondLessonForStudent: true, hasStudentPage: true };
    render(h(GettingStartedChecklist, { userId: 7, state: all }));
    expect(screen.queryByTestId("getting-started-checklist")).toBeNull();
    cleanup();
    render(h(GettingStartedChecklist, { userId: 7, state: all }));
    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith("onboarding_completed");
  });
});
