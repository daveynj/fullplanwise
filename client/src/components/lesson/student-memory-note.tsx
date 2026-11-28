import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react";

interface StudentMemoryNote {
  studentName: string;
  earlierWords: number;
  reusedInReading: string[];
}

/**
 * Teacher-only note at the top of a student's lesson: the moment PlanWise's
 * word memory becomes visible. On a first lesson it says what to do so the
 * next one builds on it.
 */
export function StudentMemoryNoteBanner({ lessonId, studentId }: { lessonId: number; studentId: number }) {
  const { data } = useQuery<StudentMemoryNote>({ queryKey: [`/api/lessons/${lessonId}/student-memory`] });
  if (!data) return null;
  const name = data.studentName;

  return (
    <aside className="my-4 max-w-4xl mx-auto rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 print:hidden">
      <p className="flex items-start gap-2">
        <Brain className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {data.earlierWords > 0 ? (
          <span>
            <strong>Built on {name}’s earlier lessons:</strong> {data.earlierWords} word{data.earlierWords === 1 ? "" : "s"} {name} has
            already met {data.earlierWords === 1 ? "is" : "are"} not taught again as new words.
            {data.reusedInReading.length > 0 && (
              <> Back in today’s reading: <strong>{data.reusedInReading.join(", ")}</strong>.</>
            )}
          </span>
        ) : (
          <span>
            <strong>{name}’s first lesson.</strong> After class, press “We did this” on{" "}
            <a className="underline underline-offset-2" href={`/students/${studentId}`}>{name}’s page</a> and their next lesson will
            build on these words instead of teaching them again.
          </span>
        )}
      </p>
    </aside>
  );
}
