import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { PUBLIC_LESSON_TAGS, type PublicLessonTag, type TagBackfillPreview } from "@shared/public-lesson-tags";
import { AlertTriangle, Check, Clock3, Loader2, RotateCcw, Tags } from "lucide-react";

export function AdminPublicTagBackfill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<TagBackfillPreview | null>(null);
  const [tagsById, setTagsById] = useState<Record<number, PublicLessonTag[]>>({});
  const [approvedIds, setApprovedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [cursor, setCursor] = useState<number | undefined>();
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const selectedCount = approvedIds.filter((id) => (tagsById[id] ?? []).length > 0).length;
  const expiresAt = preview ? new Date(preview.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;
  const expiryLabel = expiresAt?.toLocaleString();
  const canLoadNext = nextCursor !== null;

  const loadPreview = async (afterId?: number) => {
    if (loading) return;
    setLoading("preview");
    setError("");
    setSavedCount(null);
    try {
      const response = await apiRequest("POST", "/api/admin/public-lesson-tags/preview", afterId === undefined ? {} : { afterId });
      const data = await response.json() as TagBackfillPreview;
      setPreview(data);
      setCursor(afterId);
      setNextCursor(data.nextAfterId);
      setTagsById(Object.fromEntries(data.lessons.map((lesson) => [lesson.id, [...lesson.suggestedTags]])));
      setApprovedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a review preview.");
      setPreview(null);
    } finally {
      setLoading(null);
    }
  };

  const toggleTag = (id: number, tag: PublicLessonTag) => {
    // A changed selection needs a fresh explicit approval.
    setApprovedIds((current) => current.filter((item) => item !== id));
    setTagsById((current) => {
      const selected = current[id] ?? [];
      const next = selected.includes(tag) ? selected.filter((item) => item !== tag) : selected.length < 4 ? [...selected, tag] : selected;
      return { ...current, [id]: next };
    });
  };

  const toggleApproval = (id: number) => {
    setApprovedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const applyApprovals = async () => {
    if (!preview || loading || selectedCount === 0 || isExpired) return;
    const approvals = approvedIds
      .filter((id) => (tagsById[id] ?? []).length > 0)
      .map((id) => ({ id, reviewed: true as const, tags: tagsById[id] }));
    if (approvals.length === 0) return;
    setLoading("apply");
    setError("");
    try {
      const response = await apiRequest("POST", "/api/admin/public-lesson-tags/apply", {
        reviewToken: preview.reviewToken,
        approvals,
      });
      const result = await response.json() as { updated: number };
      setSavedCount(result.updated);
      setPreview(null);
      setApprovedIds([]);
      setTagsById({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["public-lesson-index"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/public-lessons"] }),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save approved tags.";
      const stale = /409|stale|expired/i.test(message);
      setError(stale
        ? "This review preview is stale or expired. Start a new preview before approving any tags."
        : message);
      if (stale) {
        setPreview(null);
        setApprovedIds([]);
        setTagsById({});
      }
    } finally {
      setLoading(null);
    }
  };

  if (!user?.isAdmin) return null;

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50/35" data-testid="public-tag-backfill">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Tags className="h-5 w-5 text-amber-700" />
              Review public lesson tags
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Review a batch of up to 10 public lessons. Suggestions are only a starting point; each lesson and its tags require your explicit approval.
            </CardDescription>
          </div>
          {!preview ? (
            <Button type="button" onClick={() => void loadPreview()} disabled={loading !== null}>
              {loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              {loading === "preview" ? "Preparing review…" : "Start a fresh preview"}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => void loadPreview(cursor)} disabled={loading !== null}>
              {loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Refresh preview
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-white/80 p-3 text-sm text-amber-950">
          <p className="font-semibold">Approved tags become public.</p>
          <p className="mt-1">Use only the public title and reading shown here. Private student requests are not used. Existing tags are never replaced.</p>
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <div className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><p>{error}</p></div>
            {/stale|expired/i.test(error) && <Button size="sm" variant="outline" className="mt-3" onClick={() => void loadPreview()}>Create a new preview</Button>}
          </div>
        )}
        {savedCount !== null && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <Check className="mr-2 inline h-4 w-4" /> Saved tags for {savedCount} {savedCount === 1 ? "lesson" : "lessons"}.
            {canLoadNext && (
              <Button size="sm" variant="outline" className="ml-3 mt-2 sm:mt-0" onClick={() => void loadPreview(nextCursor ?? undefined)} disabled={loading !== null}>
                Load next batch
              </Button>
            )}
            {!canLoadNext && <span className="ml-2">End of this pass. Start a fresh preview to revisit skipped lessons.</span>}
          </div>
        )}
        {preview && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>{preview.lessons.length} lesson{preview.lessons.length === 1 ? "" : "s"} ready for review</span>
              <span className={`inline-flex items-center gap-1 ${isExpired ? "text-red-700" : "text-slate-500"}`}>
                <Clock3 className="h-4 w-4" />
                {isExpired ? "Preview expired — create a fresh preview" : `Review expires ${expiryLabel}`}
              </span>
            </div>
            {preview.lessons.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
                <p className="font-semibold text-slate-800">No untagged public lessons in this batch.</p>
                <p className="mt-1 text-sm text-slate-600">A fresh preview starts again from the beginning.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {preview.lessons.map((lesson) => {
                  const tags = tagsById[lesson.id] ?? [];
                  const approved = approvedIds.includes(lesson.id);
                  return (
                    <article key={lesson.id} className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`tag-review-${lesson.id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{lesson.cefrLevel}</Badge>
                            <span className="text-xs text-slate-500">Public lesson #{lesson.id}</span>
                          </div>
                          <h3 className="mt-2 font-semibold text-slate-900">{lesson.title}</h3>
                        </div>
                        <a href={`/lessons/${lesson.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-navy underline underline-offset-2">
                          Review full public lesson
                        </a>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{lesson.publicExcerpt}</p>
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence from public title / reading</p>
                        {lesson.evidence.length ? (
                          <ul className="space-y-1 text-sm text-slate-700">
                            {lesson.evidence.map((entry, index) => (
                              <li key={`${entry.tag}-${entry.source}-${index}`}>
                                <span className="font-medium">{PUBLIC_LESSON_TAGS[entry.tag]}</span>
                                <span className="text-slate-500"> · {entry.source}: </span>
                                {entry.terms.join(", ")}
                              </li>
                            ))}
                          </ul>
                        ) : <p className="text-sm text-slate-500">No matching evidence terms; use your own judgment.</p>}
                      </div>
                      <fieldset className="mt-4">
                        <legend className="mb-2 text-sm font-semibold text-slate-800">Curated tags · choose up to 4</legend>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PUBLIC_LESSON_TAGS).map(([tag, label]) => {
                            const selected = tags.includes(tag as PublicLessonTag);
                            return (
                              <label key={tag} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${selected ? "border-amber-400 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-700"} ${!selected && tags.length >= 4 ? "opacity-45" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={loading !== null || (!selected && tags.length >= 4)}
                                  onChange={() => toggleTag(lesson.id, tag as PublicLessonTag)}
                                  aria-label={label}
                                />
                                {label}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-slate-100 pt-3 text-sm font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={approved}
                          disabled={loading !== null || isExpired || tags.length === 0}
                          onChange={() => toggleApproval(lesson.id)}
                          aria-label={`Approve tags for ${lesson.title}`}
                        />
                        I reviewed this public lesson and approve these tags
                      </label>
                      {tags.length === 0 && <p className="mt-1 text-xs text-amber-800">Choose at least one tag before this lesson can be approved.</p>}
                    </article>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">{selectedCount} lesson{selectedCount === 1 ? "" : "s"} explicitly approved · unchecked lessons will be skipped</p>
              <Button type="button" onClick={() => void applyApprovals()} disabled={loading !== null || selectedCount === 0 || isExpired}>
                {loading === "apply" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {selectedCount} approved {selectedCount === 1 ? "lesson" : "lessons"}
              </Button>
            </div>
            {canLoadNext && selectedCount === 0 && (
              <Button type="button" variant="outline" onClick={() => void loadPreview(nextCursor ?? undefined)} disabled={loading !== null}>
                Skip this batch and load next
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminPublicTagBackfill;
