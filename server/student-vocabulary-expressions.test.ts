// @vitest-environment node
//
// When a lesson is assigned to a student, its vocabulary goes into the
// student's record so later lessons choose new words. Lessons made with the
// idioms & phrasal verbs switch add their expressions too; every other lesson
// adds exactly the words it always did.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./db", () => ({ db: {}, pool: { end: vi.fn() } }));
vi.mock("./session-store", () => ({ createSessionStore: vi.fn(() => ({})) }));

import { storage } from "./storage";

const VOCABULARY = {
  type: "vocabulary",
  words: [
    { term: "commute", definition: "a journey to work" },
    { term: "deadline", definition: "the time by which you must finish" },
  ],
};

const EXPRESSIONS = {
  type: "expressions",
  title: "Idioms & Phrasal Verbs",
  items: [
    { expression: "put off", kind: "phrasal verb", meaning: "to decide to do something later", example: "I **put off** my homework.", yourTurn: "What do you put off?" },
    { expression: "switch off", kind: "phrasal verb", meaning: "to stop thinking about work", example: "I can't **switch off**.", yourTurn: "How do you switch off?" },
    { expression: "Commute", kind: "expression", meaning: "a repeat of a word", example: "My **commute** is long.", yourTurn: "Is your commute long?" },
  ],
};

function useLesson(sections: unknown[], known: string[] = []) {
  vi.spyOn(storage, "getLesson").mockResolvedValue({ id: 7, cefrLevel: "B2", content: { sections } } as any);
  vi.spyOn(storage, "getStudentVocabulary").mockResolvedValue(known.map((word) => ({ word })) as any);
  return vi.spyOn(storage, "addStudentVocabulary").mockImplementation(async (rows) => rows as any);
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("student vocabulary from an assigned lesson", () => {
  it("adds only the lesson's words when it has no idioms & phrasal verbs section", async () => {
    const add = useLesson([VOCABULARY]);

    expect(await storage.extractAndSaveVocabulary(3, 7)).toBe(2);
    expect(add).toHaveBeenCalledWith([
      { studentId: 3, lessonId: 7, word: "commute", definition: "a journey to work", cefrLevel: "B2" },
      { studentId: 3, lessonId: 7, word: "deadline", definition: "the time by which you must finish", cefrLevel: "B2" },
    ]);
  });

  it("adds the expressions too, skipping ones the student knows or the lesson already teaches", async () => {
    const add = useLesson([VOCABULARY, EXPRESSIONS], ["Switch off"]);

    expect(await storage.extractAndSaveVocabulary(3, 7)).toBe(3);
    expect(add).toHaveBeenCalledWith([
      { studentId: 3, lessonId: 7, word: "commute", definition: "a journey to work", cefrLevel: "B2" },
      { studentId: 3, lessonId: 7, word: "deadline", definition: "the time by which you must finish", cefrLevel: "B2" },
      { studentId: 3, lessonId: 7, word: "put off", definition: "to decide to do something later", cefrLevel: "B2" },
    ]);
  });
});
