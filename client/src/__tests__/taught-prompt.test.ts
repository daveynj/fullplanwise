import { describe, expect, it } from "vitest";
import { lastUntaughtLesson } from "@/components/lesson/taught-prompt";

describe("which lesson the lesson maker asks about", () => {
  it("picks the student's most recent lesson that isn't marked done", () => {
    const rows = [
      { id: 1, status: "completed", assignedAt: "2026-11-20T10:00:00Z", lesson: { title: "Old" } },
      { id: 2, status: "planned", assignedAt: "2026-11-21T10:00:00Z", lesson: { title: "Middle" } },
      { id: 3, status: "planned", assignedAt: "2026-11-27T10:00:00Z", lesson: { title: "Latest" } },
    ];
    expect(lastUntaughtLesson(rows)?.id).toBe(3);
  });

  it("ignores lessons the student made themselves, and returns nothing when all are done", () => {
    expect(lastUntaughtLesson([{ id: 4, status: "planned", assignedAt: "2026-11-27T10:00:00Z", madeByStudent: true }])).toBeNull();
    expect(lastUntaughtLesson([{ id: 5, status: "completed", assignedAt: "2026-11-27T10:00:00Z" }])).toBeNull();
  });
});
