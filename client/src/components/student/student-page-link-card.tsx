import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Copy, ExternalLink, Link2, RefreshCw } from "lucide-react";
import { MAX_WAITING_STUDENT_LESSONS, planLetsStudentsMakeLessons, studentPagePath } from "@shared/student-page";
import type { Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { possessive } from "@/components/student-page/student-page-layout";

/**
 * The teacher's controls for a student's own page (shared/student-page.ts):
 * create the private link, copy it, switch the page off, or replace the link
 * if it was shared too widely; and, with Unlimited, whether the student can
 * make their own lessons there.
 */
export function StudentPageLinkCard({ student }: { student: Student }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [confirmNewLink, setConfirmNewLink] = useState(false);
  const name = student.name;
  const pageUrl = student.pageToken ? `${window.location.origin}${studentPagePath(student.pageToken)}` : null;
  const enabled = !!pageUrl && student.pageEnabled;

  const saved = (updated: Student) => {
    queryClient.setQueryData([`/api/students/${student.id}`], updated);
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
  };
  const failed = (error: Error) =>
    toast({ title: "That didn't work", description: error.message, variant: "destructive" });

  const createLink = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/students/${student.id}/page`)).json() as Promise<Student>,
    onSuccess: (updated) => {
      saved(updated);
      toast({
        title: pageUrl ? "New link ready" : `${possessive(name)} page is ready`,
        description: pageUrl ? "The old link no longer works." : `Copy the link and send it to ${name}.`,
      });
    },
    onError: failed,
  });

  const switchPage = useMutation({
    mutationFn: async (on: boolean) =>
      (await apiRequest("PUT", `/api/students/${student.id}/page`, { enabled: on })).json() as Promise<Student>,
    onSuccess: (updated) => {
      saved(updated);
      toast({ title: updated.pageEnabled ? "Page turned on" : "Page turned off" });
    },
    onError: failed,
  });

  const switchLessonMaking = useMutation({
    mutationFn: async (allowed: boolean) =>
      (await apiRequest("PUT", `/api/students/${student.id}/page/lesson-making`, { allowed })).json() as Promise<Student>,
    onSuccess: (updated) => {
      saved(updated);
      toast({ title: updated.canMakeLessons ? `${name} can make lessons` : `${name} can send ideas only` });
    },
    onError: failed,
  });

  const copyLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast({ title: "Link copied", description: `Send it to ${name}.` });
    } catch {
      toast({ title: "Couldn't copy the link", description: "Select the link and copy it yourself." });
    }
  };

  return (
    <Card data-testid="student-page-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="font-nunito flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
            {possessive(name)} page
          </CardTitle>
          <p className="text-sm font-normal text-gray-600">
            A private page where {name} can look back at finished lessons, practise words with flashcards and get ready for the next lesson.
          </p>
        </div>
        {pageUrl && (
          <Badge variant="outline" className={enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
            {enabled ? "On" : "Off"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!pageUrl ? (
          <Button onClick={() => createLink.mutate()} disabled={createLink.isPending} className="bg-primary hover:bg-primary/90">
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Create {possessive(name)} page
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={pageUrl}
                aria-label={`Link to ${possessive(name)} page`}
                onFocus={(event) => event.target.select()}
                className={`font-mono text-sm ${enabled ? "" : "text-gray-500"}`}
                data-testid="student-page-link"
              />
              <Button onClick={copyLink} disabled={!enabled} className="shrink-0">
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                Copy link
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {enabled && (
                <Button variant="outline" asChild>
                  <a href={pageUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    See it as {name}
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => setConfirmNewLink(true)} disabled={createLink.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Get a new link
              </Button>
              <Button variant="outline" onClick={() => switchPage.mutate(!enabled)} disabled={switchPage.isPending}>
                {enabled ? "Turn off" : "Turn on"}
              </Button>
            </div>
            <p className="text-sm font-normal text-gray-600">
              {enabled
                ? `Only send this link to ${name}. Anyone who has it can see the page.`
                : `The page is off: the link shows "not available" until you turn it on.`}
            </p>
            <div className="border-t border-gray-200 pt-4">
              {planLetsStudentsMakeLessons(user) ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`lesson-making-${student.id}`} className="text-base font-semibold">
                      Let {name} make their own lessons
                    </Label>
                    <p className="text-sm font-normal text-gray-600">
                      Up to {MAX_WAITING_STUDENT_LESSONS} waiting at a time, at {possessive(name)} level ({student.cefrLevel}).
                      Your private notes about {name} are never used. Each lesson goes into your library.
                    </p>
                  </div>
                  <Switch
                    id={`lesson-making-${student.id}`}
                    checked={student.canMakeLessons}
                    onCheckedChange={(allowed) => switchLessonMaking.mutate(allowed)}
                    disabled={switchLessonMaking.isPending}
                    data-testid="switch-lesson-making"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-base font-semibold">Let {name} make their own lessons</p>
                  <p className="text-sm font-normal text-gray-600">
                    Included with Unlimited. On your current plan, {name} can send you topic ideas.
                  </p>
                  <Link href="/buy-credits" className="text-sm font-semibold text-brand-navy underline underline-offset-4">
                    See plans
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmNewLink} onOpenChange={setConfirmNewLink}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Get a new link?</AlertDialogTitle>
            <AlertDialogDescription>
              The old link will stop working, so you'll need to send the new one to {name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => createLink.mutate()}>Get a new link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
