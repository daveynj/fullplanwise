/**
 * How the lesson maker asks "Who is this lesson for?":
 * - "existing": pick one of the teacher's students;
 * - "new": type a first name, which creates the student with the lesson;
 * - "none": just exploring, no student.
 */
export type StudentMode = "existing" | "new" | "none";

/** Teachers with students (or a student in the link) pick one; teachers without any are asked for a name. */
export function initialStudentMode(studentCount: number, initialStudentId?: string): StudentMode {
  if (initialStudentId && initialStudentId !== "none") return "existing";
  return studentCount > 0 ? "existing" : "new";
}
