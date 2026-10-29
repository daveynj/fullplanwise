import { useState, type ElementType, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  MessageCircle,
  Quote,
  X,
} from "lucide-react";
import { SectionHeader } from "./shared/section-header";
import { expressionItemsOf, markedParts, type MarkedPart } from "@shared/lesson-expressions";
import type { LessonSection } from "../../../../types/lessonContentTypes";

interface ExpressionsSectionProps {
  section?: LessonSection;
}

const DEFAULT_TITLE = "Idioms & Phrasal Verbs";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** A sentence with its expression highlighted. */
function Marked({ parts, className }: { parts: MarkedPart[]; className: string }) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={index} className={part.marked ? className : undefined}>
          {part.text}
        </span>
      ))}
    </>
  );
}

/** A white card with a blue sub-header, like the cards in Vocab Intro. */
function InfoCard({ icon: Icon, title, className = "", children }: {
  icon: ElementType;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-3 border-b border-blue-200 bg-blue-50 p-4">
        <Icon className="h-6 w-6 flex-shrink-0 text-blue-600" />
        <h4 className="text-xl font-semibold text-blue-700">{title}</h4>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * The idioms & phrasal verbs tab, one expression at a time. The student sees
 * the sentence from the reading and guesses what the expression means; then
 * the teacher shows the meaning, an example, tips and a speaking question.
 */
export function ExpressionsSection({ section }: ExpressionsSectionProps) {
  const items = expressionItemsOf(section);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (items.length === 0) {
    return <p className="p-4 text-gray-500">No idioms or phrasal verbs available</p>;
  }

  const current = Math.min(index, items.length - 1);
  const item = items[current];
  const title = typeof section?.title === "string" && section.title.trim() ? section.title : DEFAULT_TITLE;
  const fromReading = Boolean(item.fromText);
  const go = (next: number) => {
    setIndex(next);
    setRevealed(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Quote}
        title={title}
        description="Find each expression in the reading, guess what it means, then use it to talk about yourself."
        color="pink"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-pink-700">
          Expression {current + 1} of {items.length}
        </span>
        <div className="flex flex-wrap gap-2">
          {items.map((entry, i) => (
            <button
              key={`${entry.expression}-${i}`}
              type="button"
              onClick={() => go(i)}
              aria-pressed={i === current}
              className={`min-h-[44px] rounded-full border px-4 py-1.5 text-base font-semibold transition-colors ${
                i === current
                  ? "border-pink-300 bg-pink-100 text-pink-800"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-pink-50"
              }`}
            >
              {entry.expression}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-3xl font-bold text-gray-800">{item.expression}</h3>
          <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-sm font-semibold text-pink-800">
            {capitalize(item.kind)}
          </span>
          {item.tone && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-700">
              {capitalize(item.tone)}
            </span>
          )}
        </div>

        <div className="rounded-lg border border-pink-100 bg-pink-50 px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-pink-700">
            {fromReading ? <BookOpen className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            <span className="text-lg font-semibold">{fromReading ? "From the reading" : "In a sentence"}</span>
          </div>
          <p className="text-xl font-bold leading-7 text-gray-800">
            “<Marked
              parts={markedParts(item.fromText || item.example, item.expression)}
              className="text-pink-700 underline decoration-2 underline-offset-4"
            />”
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xl font-bold text-gray-800">What do you think it means?</p>
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            aria-expanded={revealed}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-md border px-5 py-2 text-lg font-semibold transition-colors ${
              revealed
                ? "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
                : "border-pink-600 bg-pink-600 text-white hover:bg-pink-700"
            }`}
          >
            {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            {revealed ? "Hide meaning" : "Show meaning"}
          </button>
        </div>
      </div>

      {revealed && (
        <>
          <div className="flex flex-wrap gap-4">
            <InfoCard icon={BookOpen} title="Meaning" className="flex-[1_1_320px]">
              <p className="text-xl font-bold leading-7 text-gray-800">{item.meaning}</p>
              {item.similar && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Similar to</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-lg font-bold text-blue-800">{item.similar}</span>
                </div>
              )}
            </InfoCard>
            {fromReading && (
              <InfoCard icon={MessageCircle} title="Example" className="flex-[1_1_320px]">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xl font-bold leading-7 text-gray-800">
                    <Marked parts={markedParts(item.example, item.expression)} className="text-blue-600" />
                  </p>
                </div>
              </InfoCard>
            )}
          </div>

          {item.notes.length > 0 && (
            <InfoCard icon={Lightbulb} title="Good to know">
              <div className="space-y-3">
                {item.notes.map((note, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md bg-blue-50 px-4 py-3 text-xl font-bold leading-7 text-gray-800"
                  >
                    {note.text && <span>{note.text}</span>}
                    {note.right && note.wrong && (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-green-700">
                          <Check className="h-5 w-5" aria-hidden="true" />
                          <span className="sr-only">Correct: </span>
                          {note.right}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-red-700">
                          <X className="h-5 w-5" aria-hidden="true" />
                          <span className="sr-only">Wrong: </span>
                          <span className="line-through">{note.wrong}</span>
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          <div className="flex items-start gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-indigo-500 shadow-sm">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-nunito text-xl font-bold text-indigo-700">Your turn</p>
              <p className="mt-1.5 text-xl font-bold leading-7 text-gray-800">{item.yourTurn}</p>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-pink-200 bg-white px-6 py-3 text-lg font-medium text-pink-600 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous expression
        </button>
        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === items.length - 1}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-pink-200 bg-white px-6 py-3 text-lg font-medium text-pink-600 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next expression
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
