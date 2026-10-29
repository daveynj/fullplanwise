/**
 * The lesson form's idioms & phrasal verbs switch follows the level's default
 * until the teacher changes it, is never offered for A1, and adds
 * "expressions" to the request's components only when it is on.
 */
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement as h } from "react";

// jsdom has no ResizeObserver, which the Radix switch uses to measure itself.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

vi.mock("@/hooks/use-trial-status", () => ({
  useTrialStatus: () => ({ canGenerateLessons: true, isInTrial: true, isSubscriber: false, freeCreditsRemaining: 0 }),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: 1, isAdmin: false } }) }));

import { LessonForm } from "@/components/lesson/lesson-form";

afterEach(cleanup);

const expressionsSwitch = () => screen.getByRole("switch", { name: "Idioms & phrasal verbs" });
const isOn = () => expressionsSwitch().getAttribute("aria-checked") === "true";
const pickLevel = (level: string) => fireEvent.click(screen.getByRole("button", { name: level }));

async function submit(onSubmit: ReturnType<typeof vi.fn>) {
  fireEvent.change(screen.getByPlaceholderText(/^e\.g\., /), { target: { value: "Working from home" } });
  fireEvent.click(screen.getByRole("button", { name: /Generate Lesson/ }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  return onSubmit.mock.calls[0][0] as { cefrLevel: string; components: string[] };
}

describe("lesson form idioms & phrasal verbs switch", () => {
  it("is on by default from B1, off at A2 and not offered at A1", () => {
    render(h(LessonForm, { students: [], onSubmit: vi.fn() }));

    expect(isOn()).toBe(true);
    expect(screen.getByText(/Adds 3 phrasal verbs and everyday expressions from the reading/)).toBeTruthy();

    pickLevel("C1");
    expect(isOn()).toBe(true);
    expect(screen.getByText(/Adds 4 idioms and phrasal verbs from the reading/)).toBeTruthy();

    pickLevel("A2");
    expect(isOn()).toBe(false);
    expect(screen.getByText(/Off by default at A2/)).toBeTruthy();

    pickLevel("A1");
    expect(isOn()).toBe(false);
    expect((expressionsSwitch() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Not offered for A1 lessons/)).toBeTruthy();
  });

  it("keeps the teacher's choice when the level changes", () => {
    render(h(LessonForm, { students: [], onSubmit: vi.fn() }));

    fireEvent.click(expressionsSwitch());
    expect(isOn()).toBe(false);
    pickLevel("B2");
    expect(isOn()).toBe(false);

    pickLevel("A2");
    fireEvent.click(expressionsSwitch());
    expect(isOn()).toBe(true);
  });

  it("asks for the section only when the switch is on", async () => {
    const onSubmit = vi.fn();
    render(h(LessonForm, { students: [], onSubmit }));

    const request = await submit(onSubmit);

    expect(request.cefrLevel).toBe("B1");
    expect(request.components).toEqual(["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz", "expressions"]);
  });

  it("sends today's components when the switch is off", async () => {
    const onSubmit = vi.fn();
    render(h(LessonForm, { students: [], onSubmit }));
    pickLevel("A1");

    const request = await submit(onSubmit);

    expect(request.components).toEqual(["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"]);
  });
});
