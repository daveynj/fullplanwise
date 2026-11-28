import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();
vi.mock("./db", () => ({ db: { execute: (...args: unknown[]) => execute(...args) } }));

import { ACTIVATION_COHORTS, ACTIVATION_STEPS, shapeActivationReport } from "./activation-funnel";

function sqlText(call: unknown[]): string {
  const query = call[0] as { queryChunks?: Array<{ value?: string[] } | string> };
  return (query.queryChunks ?? [])
    .map((chunk) => (typeof chunk === "string" ? chunk : (chunk.value ?? []).join("")))
    .join("");
}

describe("activation report shape", () => {
  it("lists every step for every group, in order, with a share of sign-ups", () => {
    const report = shapeActivationReport(
      [
        { cohort: "all", signed_up: "200", made_lesson: "120", added_student: "60", student_lesson: "50", marked_taught: "20", second_same_student: "15", memory_lesson: "10", student_page: "8", paid: "3" },
        { cohort: "since_checklist", signed_up: 4, made_lesson: 3, added_student: 2, student_lesson: 2, marked_taught: 1, second_same_student: 1, memory_lesson: 1, student_page: 0, paid: 0 },
      ],
      true,
    );
    expect(report.cohorts.map((c) => c.key)).toEqual(ACTIVATION_COHORTS.map((c) => c.key));
    expect(report.cohorts[0].steps.map((s) => s.key)).toEqual(ACTIVATION_STEPS.map((s) => s.key));
    const all = report.cohorts[0].steps;
    expect(all.find((s) => s.key === "second_same_student")).toMatchObject({ count: 15, percent: 8 });
    expect(all.find((s) => s.key === "signed_up")).toMatchObject({ count: 200, percent: 100 });
    expect(report.signupDatesEstimated).toBe(true);
  });

  it("shows zeros, not errors, for a group with no sign-ups yet", () => {
    const report = shapeActivationReport([], false);
    const last30 = report.cohorts.find((c) => c.key === "last_30_days")!;
    expect(last30.steps.every((s) => s.count === 0 && s.percent === 0)).toBe(true);
  });
});

describe("sign-up date column", () => {
  beforeEach(() => {
    execute.mockReset();
    vi.resetModules();
  });

  it("adds the column without a default, then sets the default, so existing accounts are not stamped with today", async () => {
    execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValue({ rows: [] });
    const { ensureUserSignupDate } = await import("./user-signup-date-schema");
    await ensureUserSignupDate();
    const statements = execute.mock.calls.map(sqlText);
    const add = statements.find((s) => /ADD COLUMN/i.test(s))!;
    expect(add).toMatch(/created_at timestamp/);
    expect(add).not.toMatch(/DEFAULT/i);
    expect(statements.some((s) => /ALTER COLUMN created_at SET DEFAULT now\(\)/.test(s))).toBe(true);
  });

  it("does nothing when the column and its default already exist", async () => {
    execute.mockResolvedValueOnce({ rows: [{ column_default: "now()" }] });
    const { ensureUserSignupDate } = await import("./user-signup-date-schema");
    await ensureUserSignupDate();
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
