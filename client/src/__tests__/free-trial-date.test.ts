/**
 * The trial banner shows the same end date as the emails (10 December) to
 * every visitor, whatever their own time zone.
 */
import { describe, it, expect } from "vitest";
import { formatTrialEndDate } from "@shared/free-trial-date";

const END = new Date("2026-12-10T23:59:59Z");

describe("formatTrialEndDate", () => {
  it("gives the UK date, not the visitor's local one", () => {
    expect(formatTrialEndDate(END)).toBe("December 10th, 2026");
    expect(formatTrialEndDate(END, { withYear: false })).toBe("December 10th");
  });

  it("uses UK summer time when it applies", () => {
    // 23:30 UTC on 1 July is 00:30 on 2 July in London (BST).
    expect(formatTrialEndDate(new Date("2026-07-01T23:30:00Z"))).toBe("July 2nd, 2026");
  });

  it("writes ordinals correctly", () => {
    const day = (d: number) => formatTrialEndDate(new Date(Date.UTC(2026, 0, d, 12)), { withYear: false });
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(day)).toEqual([
      "January 1st", "January 2nd", "January 3rd", "January 4th", "January 11th", "January 12th",
      "January 13th", "January 21st", "January 22nd", "January 23rd", "January 31st",
    ]);
  });
});
