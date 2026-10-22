/**
 * What visitors (anyone other than the lesson's owner or an admin) may see of
 * a lesson.
 *
 * `topic` holds the teacher's original request, which often describes a real
 * student ("this student is very intelligent…", "for a 12 year old girl…"),
 * and `notes` / `studentId` are the teacher's private records. Public and
 * link-shared views show the lesson title in place of the topic and drop the
 * private fields.
 */
export function toPublicLessonView<T extends { title: string; topic: string }>(
  lesson: T,
): T & { notes: null; studentId: null } {
  return { ...lesson, topic: lesson.title, notes: null, studentId: null };
}
