/**
 * "Who is this lesson for?" in the lesson maker: teachers without students
 * type a first name, which creates the student with the lesson; an empty name
 * is asked for once and then skipped; teachers with students pick one.
 */
import { describe, it, expect, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement as h } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const api = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  invalidateQueries: vi.fn(async () => {}),
}));
vi.mock("@/lib/queryClient", () => ({
  apiRequest: api.apiRequest,
  queryClient: { invalidateQueries: api.invalidateQueries },
}));
vi.mock("@/hooks/use-trial-status", () => ({
  useTrialStatus: () => ({ canGenerateLessons: true, isInTrial: true, isSubscriber: false, freeCreditsRemaining: 0 }),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: 1, isAdmin: false } }) }));

import { LessonForm } from "@/components/lesson/lesson-form";
import { initialStudentMode } from "@/components/lesson/student-mode";

function renderForm(props: Record<string, unknown>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, queryFn: async () => [] } } });
  return render(h(QueryClientProvider, { client }, h(LessonForm as any, props)));
}

const typeTopic = () =>
  fireEvent.change(screen.getByPlaceholderText(/^e\.g\., /), { target: { value: "Working from home" } });
const generate = () => fireEvent.click(screen.getByRole("button", { name: /Generate Lesson/ }));

beforeEach(() => {
  api.apiRequest.mockReset();
  api.invalidateQueries.mockClear();
});
afterEach(cleanup);

describe("who is this lesson for", () => {
  it("starts by asking for a name when the teacher has no students", () => {
    expect(initialStudentMode(0)).toBe("new");
    expect(initialStudentMode(3)).toBe("existing");
    expect(initialStudentMode(0, "12")).toBe("existing");
  });

  it("creates the student from a first name and makes the lesson for them", async () => {
    api.apiRequest.mockResolvedValue({ json: async () => ({ id: 42 }) });
    const onSubmit = vi.fn();
    renderForm({ students: [], onSubmit });
    typeTopic();
    fireEvent.change(screen.getByLabelText("Student’s first name"), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText("About the student (optional)"), { target: { value: "nurse, loves football" } });
    generate();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(api.apiRequest).toHaveBeenCalledWith("POST", "/api/students", { name: "Maria", cefrLevel: "B1", notes: "nurse, loves football" });
    expect(onSubmit.mock.calls[0][0].studentId).toBe(42);
  });

  it("asks once for a name, then makes the lesson without a student", async () => {
    const onSubmit = vi.fn();
    renderForm({ students: [], onSubmit });
    typeTopic();
    generate();
    await screen.findByText(/Add their first name so PlanWise can remember their words/);
    expect(onSubmit).not.toHaveBeenCalled();
    generate();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].studentId).toBeUndefined();
    expect(api.apiRequest).not.toHaveBeenCalled();
  });

  it("offers the teacher's students, a new one, or just exploring", () => {
    renderForm({ students: [{ id: 5, name: "Tom", cefrLevel: "A2" }], onSubmit: vi.fn() });
    expect(screen.getByTestId("who-is-this-for")).toBeTruthy();
    expect(screen.queryByLabelText("Student’s first name")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add a new student" }));
    expect(screen.getByLabelText("Student’s first name")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Choose one of my students" }));
    expect(screen.queryByLabelText("Student’s first name")).toBeNull();
  });
});
