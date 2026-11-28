import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Tag } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { priceText } from "@shared/site-facts";
import { founderOffer, founderOfferActive } from "@shared/founder-offer";

export interface KeepSummaryStudent {
  id: number;
  name: string;
  cefrLevel: string;
  lessons: number;
  words: number;
}

export interface KeepSummary {
  lessons: number;
  studentCount: number;
  students: KeepSummaryStudent[];
}

/** The teacher's lessons and, per student, words learned (GET /api/user/keep-summary). */
export function useKeepSummary(enabled = true) {
  return useQuery<KeepSummary>({
    queryKey: ["/api/user/keep-summary"],
    queryFn: async () => {
      const res = await fetch("/api/user/keep-summary", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load your summary");
      return res.json();
    },
    enabled,
    staleTime: 60_000,
  });
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "Maria · B1 · 18 words · 3 lessons" */
export function studentLine(s: KeepSummaryStudent): string {
  const parts = [s.name, s.cefrLevel];
  if (s.words) parts.push(plural(s.words, "word"));
  if (s.lessons) parts.push(plural(s.lessons, "lesson"));
  return parts.filter(Boolean).join(" · ");
}

export function FounderOfferNote({ className = "" }: { className?: string }) {
  if (!founderOfferActive()) return null;
  return (
    <p className={`flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200 ${className}`} data-testid="founder-offer">
      <Tag className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
      <span>
        Until {founderOffer.endsText}, type <strong>{founderOffer.code}</strong> at checkout: half price for as long as you stay subscribed (first {founderOffer.maxTeachers} teachers).
      </span>
    </p>
  );
}

interface KeepBuildingCardProps {
  summary: KeepSummary | undefined;
  /** "ended": free time is over. "free": still free (payment page, before paying). */
  mode: "ended" | "free";
  /** Where it is shown, for analytics. */
  location: string;
  /** Hide the buttons when the page already has its own (the payment page). */
  showActions?: boolean;
}

/**
 * What the teacher would keep building: their students and the words on each
 * student's list, then one clear next step. Shown when their free time ends
 * (lesson maker, dashboard) and on the payment page.
 */
export function KeepBuildingCard({ summary, mode, location, showActions = true }: KeepBuildingCardProps) {
  useEffect(() => {
    trackEvent("upgrade_prompt_shown", { location, mode, students: summary?.studentCount ?? 0 });
    // Once per place it appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, mode]);

  const students = summary?.students ?? [];
  const lessons = summary?.lessons ?? 0;
  const more = (summary?.studentCount ?? 0) - students.length;
  const heading = mode === "ended"
    ? (students.length ? "Keep building your students' lessons" : "Your free time has ended")
    : "What you've built so far";
  const made = [lessons ? plural(lessons, "lesson") : null, summary?.studentCount ? plural(summary.studentCount, "student") : null]
    .filter(Boolean).join(" for ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="keep-building-card" aria-label={heading}>
      <h2 className="font-nunito text-xl font-bold text-brand-navy">{heading}</h2>
      <p className="mt-1 text-sm text-slate-700">
        {mode === "ended" ? "Your free time has ended. " : ""}
        {made ? <>Everything you made is still in your account: <strong>{made}</strong>.</> : "Everything you make stays in your account."}
      </p>

      {students.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Your students">
          {students.map((s) => (
            <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-brand-navy ring-1 ring-slate-100">
              {studentLine(s)}
            </li>
          ))}
          {more > 0 && <li className="px-3 text-sm text-slate-500">and {plural(more, "more student")}</li>}
        </ul>
      )}

      <p className="mt-3 text-sm text-slate-700">
        {students.length
          ? "With Unlimited, each student's next lesson builds on the words they already know, in 1–2 minutes. "
          : "With Unlimited, you make a finished lesson for any student, on any topic, in 1–2 minutes. "}
        {priceText}, cancel anytime.
      </p>

      <FounderOfferNote className="mt-3" />

      {showActions && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="/buy-credits"
            onClick={() => trackEvent("upgrade_prompt_clicked", { location, mode })}
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-navy shadow hover:bg-amber-300"
          >
            Keep building with Unlimited <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="/esl-lessons"
            onClick={() => trackEvent("upgrade_prompt_library_clicked", { location, mode })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" /> Or use the free library
          </a>
        </div>
      )}
    </section>
  );
}
