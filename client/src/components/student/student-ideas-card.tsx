import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Lightbulb, Wand2 } from "lucide-react";
import type { Student } from "@shared/schema";
import type { StudentIdeaSummary } from "@shared/student-page";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Topics the student suggested on their page (shared/student-page.ts). The
 * teacher makes a lesson from one (the generator opens with the topic and the
 * student's level filled in) or dismisses it. Hidden while there are none.
 */
export function StudentIdeasCard({ student, className = "" }: { student: Student; className?: string }) {
  const { toast } = useToast();
  const ideasKey = [`/api/students/${student.id}/ideas`];
  const { data: ideas = [] } = useQuery<StudentIdeaSummary[]>({ queryKey: ideasKey });

  const dismiss = useMutation({
    mutationFn: async ({ ideaId, dismissed }: { ideaId: number; dismissed: boolean }) =>
      (await apiRequest("PUT", `/api/students/${student.id}/ideas/${ideaId}`, { dismissed })).json(),
    onSuccess: (_idea, { ideaId, dismissed }) => {
      queryClient.invalidateQueries({ queryKey: ideasKey });
      queryClient.invalidateQueries({ queryKey: ["/api/student-requests"] });
      if (dismissed) {
        toast({
          title: "Idea dismissed",
          action: (
            <ToastAction altText="Undo dismissing this idea" onClick={() => dismiss.mutate({ ideaId, dismissed: false })}>
              Undo
            </ToastAction>
          ),
        });
      }
    },
    onError: (error: Error) => toast({ title: "That didn't work", description: error.message, variant: "destructive" }),
  });

  if (ideas.length === 0) return null;

  const makeLessonHref = (idea: StudentIdeaSummary) =>
    `/generate?${new URLSearchParams({
      studentId: String(student.id),
      ideaId: String(idea.id),
      topic: idea.topic,
      level: student.cefrLevel,
    })}`;

  return (
    <Card className={className} data-testid="student-ideas-card">
      <CardHeader>
        <CardTitle className="font-nunito flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
          Ideas from {student.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.map((idea) => (
          <div key={idea.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-4" data-testid={`student-idea-${idea.id}`}>
            <div className="min-w-[12rem] flex-1">
              <p className="font-semibold">"{idea.topic}"</p>
              <p className="text-sm text-gray-500">Sent {formatDay(idea.sentAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={makeLessonHref(idea)}>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Make this lesson
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dismiss.mutate({ ideaId: idea.id, dismissed: true })}
                disabled={dismiss.isPending}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
