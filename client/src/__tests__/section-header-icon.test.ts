/**
 * Lesson tab headers draw their icon in the white circle. lucide-react icons
 * are forwardRef objects, not plain functions, so SectionHeader and
 * SectionCard must draw icon components of either kind, not an empty circle.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, getByText } from "@testing-library/react";
import { createElement as h } from "react";
import { BookOpen, MessageCircle } from "lucide-react";
import { SectionHeader } from "@/components/lesson/shared/section-header";
import { SectionCard } from "@/components/lesson/shared/section-card";

afterEach(cleanup);

describe("SectionHeader icon", () => {
  it("draws a lucide icon component in the circle", () => {
    const { getByTestId } = render(
      h(SectionHeader, { title: "Reading", icon: BookOpen, color: "blue" }),
    );

    const svg = getByTestId("section-header-icon").querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("h-6 w-6 text-blue-500");
  });

  it("still draws an icon passed as an element", () => {
    const { getByTestId } = render(
      h(SectionHeader, {
        title: "Sentence Frames",
        icon: h(MessageCircle, { className: "h-5 w-5" }),
        color: "indigo",
      }),
    );

    const svg = getByTestId("section-header-icon").querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("h-6 w-6 text-indigo-500");
  });
});

describe("SectionCard icon", () => {
  it("draws a lucide icon component next to the title", () => {
    const { container } = render(
      h(SectionCard, { title: "Reading Text", icon: BookOpen, color: "blue" }, "Body"),
    );

    const svg = getByText(container, "Reading Text").querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("h-5 w-5 text-blue-500");
  });
});
