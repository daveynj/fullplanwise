import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivationStep {
  key: string;
  label: string;
  count: number;
  percent: number;
}

interface ActivationReport {
  cohorts: Array<{ key: string; label: string; steps: ActivationStep[] }>;
  signupDatesEstimated: boolean;
}

/**
 * How far teachers get towards PlanWise's main benefit: a second lesson for
 * the same student that builds on their word list. Counts only.
 */
export function ActivationFunnelCard() {
  const { data, isLoading, isError } = useQuery<ActivationReport>({ queryKey: ["/api/admin/activation"] });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Activation: do teachers reach a second lesson for the same student?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded bg-gray-100" />
        ) : isError || !data ? (
          <p className="text-sm text-red-700">The activation report could not be loaded.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-semibold">Step</th>
                    {data.cohorts.map((c) => (
                      <th key={c.key} className="py-2 pr-4 font-semibold">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts[0]?.steps.map((step, i) => (
                    <tr key={step.key} className="border-b last:border-0">
                      <td className="py-2 pr-4">{step.label}</td>
                      {data.cohorts.map((c) => {
                        const s = c.steps[i];
                        return (
                          <td key={c.key} className="py-2 pr-4 tabular-nums">
                            {s.count}
                            {i > 0 && <span className="ml-1 text-gray-500">({s.percent}%)</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Percentages are of teachers who signed up in that group. Admin accounts are excluded.
              {data.signupDatesEstimated &&
                " Sign-up dates for accounts created before 28 Nov 2026 are estimated from their trial end date."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
