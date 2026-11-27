import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { PUBLIC_LESSON_TAGS, type PublicLessonTag, type PublicTagEditPreview, type PublicTagSearchResult } from "@shared/public-lesson-tags";

const labels = (tags: PublicLessonTag[]) => tags.map((tag) => PUBLIC_LESSON_TAGS[tag]).join(", ") || "No public tags";

export function AdminPublicTagEditor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const [results, setResults] = useState<PublicTagSearchResult | null>(null);
  const [preview, setPreview] = useState<PublicTagEditPreview | null>(null);
  const [tags, setTags] = useState<PublicLessonTag[]>([]);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!preview) return;
    const remaining = preview.expiresAt - Date.now();
    setExpired(remaining <= 0);
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, remaining));
    return () => window.clearTimeout(timer);
  }, [preview]);

  const find = async (afterId = 0) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved("");
    setPreview(null);
    const term = afterId ? lastSearch : search.trim();
    try {
      const response = await apiRequest("POST", "/api/admin/public-lesson-tags/find", { search: term, afterId });
      setResults(await response.json());
      setLastSearch(term);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : "Could not find public lessons.");
    } finally {
      setBusy(false);
    }
  };

  const review = async (id: number) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved("");
    setPreview(null);
    setApproved(false);
    try {
      const response = await apiRequest("POST", "/api/admin/public-lesson-tags/edit-preview", { id });
      const data = await response.json() as PublicTagEditPreview;
      setTags([...data.tags]);
      setExpired(data.expiresAt <= Date.now());
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not review this lesson.");
    } finally {
      setBusy(false);
    }
  };

  const changeTags = (next: PublicLessonTag[]) => {
    setTags(next);
    setApproved(false);
  };
  const changed = preview && (preview.hasOtherTags ||
    tags.length !== preview.tags.length || tags.some((tag) => !preview.tags.includes(tag)));

  const save = async () => {
    if (!preview || busy || expired || !approved || !changed) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", "/api/admin/public-lesson-tags/edit", {
        id: preview.id, reviewToken: preview.reviewToken, reviewed: true, tags,
      });
      setSaved(tags.length
        ? `Saved public tags for "${preview.title}": ${labels(tags)}.`
        : `Cleared all public tags for "${preview.title}". The lesson remains public.`);
      setResults((current) => current && ({
        ...current, lessons: current.lessons.map((lesson) => lesson.id === preview.id ? { ...lesson, tags: [...tags] } : lesson),
      }));
      setPreview(null);
      setApproved(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["public-lesson-index"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/public-lessons"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm the save. Review again before retrying.");
      // Any uncertain response requires a fresh read, not a blind retry.
      setExpired(true);
      setApproved(false);
    } finally {
      setBusy(false);
    }
  };

  if (!user?.isAdmin) return null;
  return (
    <Card className="mb-8" data-testid="public-tag-editor">
      <CardHeader>
        <CardTitle>Correct existing public tags</CardTitle>
        <CardDescription>
          Find a public lesson by its public title or numeric ID. Review its current tags before replacing or clearing them.
          Only public titles and readings are used, never private student requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void find(); }}>
          <Input aria-label="Public title or lesson ID" placeholder="Public title or lesson ID" maxLength={120}
            className="min-w-48 flex-1" value={search} onChange={(event) => setSearch(event.target.value)} disabled={busy} />
          <Button type="submit" disabled={busy}>{busy ? "Please wait…" : "Find public lessons"}</Button>
        </form>
        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
        {saved && <div role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p>{saved}</p>
          <p className="mt-1">Public browse topic filters and tag-label searches use the saved tags on their next refresh.
            Clearing tags removes topic-filter matches, not the lesson from the library or category filters.</p>
        </div>}
        {results && <div className="space-y-2">
          {results.lessons.length === 0 && <p className="text-sm text-slate-600">No public lessons found. Try a public title or numeric ID.</p>}
          {results.lessons.map((lesson) => <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
            <div>
              <p className="font-medium">{lesson.title} <span className="text-sm text-slate-500">· {lesson.cefrLevel} · #{lesson.id}</span></p>
              <p className="text-sm text-slate-600">Current public tags: {labels(lesson.tags)}</p>
            </div>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void review(lesson.id)}
              aria-label={`Review tags for ${lesson.title}`}>Review tags</Button>
          </div>)}
          {results.nextAfterId !== null && <Button type="button" variant="outline" disabled={busy}
            onClick={() => void find(results.nextAfterId!)}>Next results</Button>}
        </div>}
        {preview && <article className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4" data-testid="tag-edit-review">
          <div>
            <h3 className="font-semibold">{preview.title} · {preview.cefrLevel} · #{preview.id}</h3>
            <a href={`/lessons/${preview.id}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">Review full public lesson</a>
          </div>
          <p className="whitespace-pre-wrap rounded bg-white p-3 text-sm">{preview.publicExcerpt || "No public reading available. Review the full public lesson."}</p>
          <p className="text-sm"><strong>Current public tags:</strong> {labels(preview.tags)}</p>
          {preview.hasOtherTags && <p className="text-sm text-amber-900">This lesson also has legacy labels outside the curated choices.
            They are not public discovery tags and are not shown here. Saving will remove them.</p>}
          <fieldset disabled={busy || expired}>
            <legend className="mb-2 text-sm font-semibold">Replacement tags · choose 0–4</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PUBLIC_LESSON_TAGS).map(([key, label]) => {
                const tag = key as PublicLessonTag;
                const selected = tags.includes(tag);
                return <label key={tag} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${selected ? "border-amber-400 bg-amber-100" : "bg-white"}`}>
                  <input type="checkbox" checked={selected} disabled={!selected && tags.length >= 4}
                    onChange={() => changeTags(selected ? tags.filter((item) => item !== tag) : [...tags, tag])} />
                  {label}
                </label>;
              })}
            </div>
          </fieldset>
          <Button type="button" variant="outline" disabled={busy || expired || tags.length === 0}
            onClick={() => changeTags([])}>Clear all tags</Button>
          <p className="text-sm"><strong>After saving:</strong> {labels(tags)}.
            {tags.length === 0 && " This removes all topic tags, but keeps the lesson public."}</p>
          {expired ? <div role="alert" className="text-sm text-red-800">
            <p>Review again before saving: this review expired, changed, or could not be confirmed.</p>
            <Button type="button" variant="outline" className="mt-2" disabled={busy}
              onClick={() => void review(preview.id)}>Reload current tags</Button>
          </div> : <p className="text-xs text-slate-500">Review expires {new Date(preview.expiresAt).toLocaleString()}.</p>}
          <label className="flex items-start gap-2 text-sm font-medium">
            <input type="checkbox" checked={approved} disabled={busy || expired || !changed}
              onChange={(event) => setApproved(event.target.checked)} />
            {tags.length ? "I reviewed the public lesson and approve replacing its tags." : "I reviewed the public lesson and approve clearing all its tags."}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || expired || !approved || !changed} onClick={() => void save()}>
              {tags.length ? "Save reviewed tag changes" : "Save and clear all tags"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPreview(null)}>Cancel editing</Button>
          </div>
        </article>}
      </CardContent>
    </Card>
  );
}
