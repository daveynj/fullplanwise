import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WORD_KIND_LABELS, type WordKind } from "@shared/student-page";
import { StudentPageError } from "@/lib/student-page-api";

/**
 * Shared pieces of a student's own page (/s/<code>): phone-first, in the
 * app's navy and yellow, readable without logging in.
 */

export function StudentPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fdfdfd] text-brand-navy">
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </div>
  );
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-nunito text-base font-extrabold ${className}`}>
      <span className="h-3 w-3 rounded bg-brand-yellow" aria-hidden="true" />
      PlanwiseESL
    </span>
  );
}

export function LevelPill({ level }: { level: string }) {
  return (
    <span className="rounded-full bg-brand-yellow px-3 py-1 text-sm font-bold text-brand-navy">Level {level}</span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-brand-navy hover:text-brand-navy-light"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** Sets the browser tab's title, e.g. "Shingo's words". */
export function useStudentPageTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} | PlanwiseESL`;
  }, [title]);
}

/** "Shingo's" (or "Charles'" for names ending in s). */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

export function StudentPageLoading() {
  return (
    <StudentPageFrame>
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    </StudentPageFrame>
  );
}

/** A full-page message for a link that no longer works or a request that failed. */
export function StudentPageProblem({ error, backHref }: { error: unknown; backHref?: string }) {
  const gone = error instanceof StudentPageError && error.status === 404;
  return (
    <StudentPageFrame>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <BrandMark />
        <h1 className="font-nunito text-2xl font-extrabold">
          {gone ? "This page isn't available" : "Something went wrong"}
        </h1>
        <p className="text-base font-normal text-gray-600">
          {gone
            ? error.message
            : "Please check your internet connection and try again."}
        </p>
        {backHref && !gone && <BackLink href={backHref} label="Back to my page" />}
      </div>
    </StudentPageFrame>
  );
}

/** Colours for a word's kind: green for words, pink for idioms and phrasal verbs (as in the lessons). */
export function KindTag({ kind }: { kind: WordKind }) {
  const tint = kind === "word" ? "bg-green-50 text-green-700" : "bg-pink-50 text-pink-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tint}`}>{WORD_KIND_LABELS[kind]}</span>
  );
}
