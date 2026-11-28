import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isLessonDone, LESSON_STATUS_DONE } from "@shared/student-page";

interface StudentLessonRow {
  id: number;
  status: string | null;
  assignedAt: string;
  madeByStudent?: boolean | null;
  lesson?: { title?: string | null } | null;
}

/** The student's most recent lesson that is still planned (not marked "We did this"). */
export function lastUntaughtLesson(rows: StudentLessonRow[]): StudentLessonRow | null {
  const planned = rows.filter((r) => !isLessonDone(r.status) && !r.madeByStudent);
  planned.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  return planned[0] ?? null;
}

/**
 * In the lesson maker, before a student's next lesson: "Did you teach the last
 * one?" One click marks it done, so its words join the student's list and the
 * flashcards, instead of relying on the teacher to find "We did this" later.
 */
export function TaughtPrompt({ studentId, studentName }: { studentId: number; studentName: string }) {
  const [dismissed, setDismissed] = useState(false);
  const { data: rows } = useQuery<StudentLessonRow[]>({ queryKey: [`/api/students/${studentId}/lessons`] });
  const mark = useMutation({
    mutationFn: async (assignmentId: number) => {
      const res = await apiRequest("PUT", `/api/students/lessons/${assignmentId}/status`, { status: LESSON_STATUS_DONE });
      return (await res.json()) as { wordsAdded?: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/lessons`] });
      void queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/vocabulary`] });
    },
  });

  const last = rows ? lastUntaughtLesson(rows) : null;
  if (mark.isSuccess) {
    const added = mark.data?.wordsAdded ?? 0;
    return (
      <p className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Done. {added > 0 ? `${added} words were added to ${studentName}’s list` : `${studentName}’s list is up to date`}, so this
          lesson won’t teach them again.
        </span>
      </p>
    );
  }
  if (!last || dismissed) return null;

  const title = last.lesson?.title?.trim() || "the last lesson";
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <p>
        Did you teach <strong>“{title}”</strong> with {studentName}? Marking it adds its words to {studentName}’s list and flashcards,
        and the new lesson builds on them.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => mark.mutate(last.id)} disabled={mark.isPending}>
          {mark.isPending ? "Saving…" : "Yes, we did it"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setDismissed(true)}>
          Not yet
        </Button>
      </div>
      {mark.isError && <p className="mt-2 text-red-700">That didn’t save. You can also mark it on {studentName}’s page.</p>}
    </div>
  );
}
