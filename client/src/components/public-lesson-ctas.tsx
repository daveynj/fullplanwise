import { BookOpen } from "lucide-react";

interface TopRemixBannerProps {
  title: string;
  href: string;
}

export function TopRemixBanner({ title, href }: TopRemixBannerProps) {
  return (
    <aside className="my-5 max-w-4xl mx-auto rounded-lg border border-[#edc437]/40 bg-[#051d40] px-4 py-3 text-[#fdfdfd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
      <p className="text-sm">
        Teaching <span className="font-semibold text-[#edc437]">{title}</span> to one student? Start from this title, choose the student in the generator, and PlanWise ESL makes a new version at their level that avoids words they&apos;ve already learned. You can also change the CEFR level or adapt it to their job.
      </p>
      <a
        href={href}
        className="shrink-0 rounded-md bg-[#edc437] px-3.5 py-1.5 text-sm font-semibold text-[#051d40] hover:opacity-90 transition"
      >
        Make this lesson for your student
      </a>
    </aside>
  );
}

interface VocabFlashcardCTAProps {
  href: string;
}

export function VocabFlashcardCTA({ href }: VocabFlashcardCTAProps) {
  return (
    <div className="my-6 max-w-4xl mx-auto rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
      <div>
        <p className="text-sm font-semibold text-[#051d40]">
          Help students remember these words beyond today&apos;s lesson.
        </p>
        <p className="text-xs text-slate-600 mt-0.5">
          Mark lessons complete from a student&apos;s page to add their vocabulary to spaced-repetition flashcards and recycle it in future lessons.
        </p>
      </div>
      <a
        href={href}
        className="shrink-0 rounded-md border border-[#051d40] px-3 py-1.5 text-xs font-semibold text-[#051d40] hover:bg-[#051d40] hover:text-white transition"
      >
        <BookOpen className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
        Try PlanWise ESL free
      </a>
    </div>
  );
}
