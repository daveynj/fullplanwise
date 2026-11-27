/**
 * The dashboard asks every teacher who has made enough lessons for an honest
 * public review, with nothing offered in return, and stays hidden once they
 * close it. Reviews are the gap every AI assistant named when asked about
 * PlanWise ESL in November 2026, and a neutral invitation to everyone is the
 * only way to get them within G2's and Trustpilot's rules.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement as h } from "react";

const analytics = vi.hoisted(() => ({ trackEvent: vi.fn(), trackCta: vi.fn() }));
vi.mock("@/lib/analytics", () => analytics);

import { ReviewRequestCard, REVIEW_CARD_MIN_LESSONS, reviewLinks } from "@/components/review-request-card";

beforeEach(() => {
  window.localStorage.clear();
  analytics.trackEvent.mockClear();
});
afterEach(cleanup);

describe("review request card", () => {
  it("waits until the teacher has made enough lessons to have an opinion", () => {
    render(h(ReviewRequestCard, { userId: 7, totalLessons: REVIEW_CARD_MIN_LESSONS - 1 }));
    expect(screen.queryByTestId("review-request-card")).toBeNull();
  });

  it("links to G2 and Trustpilot, asks for honest words and offers nothing in return", () => {
    render(h(ReviewRequestCard, { userId: 7, totalLessons: 12 }));
    expect(screen.getByText(/You've made 12 lessons/)).toBeTruthy();
    expect(screen.getByText(/good or bad/)).toBeTruthy();
    for (const link of reviewLinks) {
      const a = screen.getByRole("link", { name: `Review on ${link.name}` });
      expect(a.getAttribute("href")).toBe(link.href);
      expect(a.getAttribute("rel")).toContain("noopener");
    }
    const text = screen.getByTestId("review-request-card").textContent ?? "";
    for (const bribe of ["discount", "free month", "reward", "gift", "5 stars", "five stars"]) {
      expect(text.toLowerCase()).not.toContain(bribe);
    }
  });

  it("records which review site the teacher chose", () => {
    render(h(ReviewRequestCard, { userId: 7, totalLessons: 6 }));
    fireEvent.click(screen.getByRole("link", { name: "Review on G2" }));
    expect(analytics.trackEvent).toHaveBeenCalledWith("review_link_clicked", { site: "G2" });
  });

  it("stays hidden for that teacher once closed, but not for another teacher", () => {
    render(h(ReviewRequestCard, { userId: 7, totalLessons: 6 }));
    fireEvent.click(screen.getByRole("button", { name: /Hide this request/ }));
    expect(screen.queryByTestId("review-request-card")).toBeNull();
    cleanup();

    render(h(ReviewRequestCard, { userId: 7, totalLessons: 6 }));
    expect(screen.queryByTestId("review-request-card")).toBeNull();
    cleanup();

    render(h(ReviewRequestCard, { userId: 8, totalLessons: 6 }));
    expect(screen.getByTestId("review-request-card")).toBeTruthy();
  });
});
