import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import type { StudentPracticeStats } from "@shared/student-page";
import type { Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { possessive } from "@/components/student-page/student-page-layout";

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** How the student has practised their words on their own page, for the teacher. */
export function StudentPracticeCard({ student }: { student: Student }) {
  const { data } = useQuery<StudentPracticeStats>({
    queryKey: [`/api/students/${student.id}/practice`],
  });
  if (!data) return null;
  const name = student.name;

  return (
    <Card data-testid="student-practice-card">
      <CardHeader>
        <CardTitle className="font-nunito flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
          How {name} is practising
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data.lastPractisedAt ? (
          <p className="text-base font-normal text-gray-600">
            {name} hasn't practised with flashcards yet.{" "}
            {student.pageToken && student.pageEnabled
              ? `Send ${name} the page link so they can review their words between lessons.`
              : `Create ${possessive(name)} page so they can review their words between lessons.`}
          </p>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Last practised", formatDay(data.lastPractisedAt)],
                ["Cards this week", String(data.cardsThisWeek)],
                ["Days practised", `${data.daysPractisedThisWeek} of 7`],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm font-normal text-gray-600">{label}</dt>
                  <dd className="font-nunito text-xl font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
            {data.stillLearning.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold">Still learning</h3>
                <ul className="flex flex-wrap gap-2">
                  {data.stillLearning.map((word) => (
                    <li key={word} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                      {word}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-normal text-gray-600">Good words to bring back in your next lesson.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
