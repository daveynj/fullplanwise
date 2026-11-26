/** Persisted public URL fields; never derive a URL from the private request. */
export interface LessonUrlFields {
  id: number;
  publicSlug?: string | null;
  publicLevel?: string | null;
}

export function lessonPath(lesson: LessonUrlFields): string {
  return lesson.publicSlug && lesson.publicLevel
    ? `/esl-lessons/${lesson.publicLevel}/${lesson.publicSlug}`
    : `/lessons/${lesson.id}`;
}

export function lessonTitleSlug(title: string): string {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 90).replace(/-$/g, "") || "lesson";
}

/** Globally unique, including titles which already end with another row's ID. */
export function availableLessonSlug(title: string, id: number, used: Set<string>): string {
  const base = lessonTitleSlug(title);
  let candidate = base;
  let attempt = 0;
  while (used.has(candidate)) {
    candidate = `${base}-${id}${attempt ? `-${attempt}` : ""}`;
    attempt++;
  }
  return candidate;
}
