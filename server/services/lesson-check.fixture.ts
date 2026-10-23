/**
 * A complete lesson in the shape the lesson prompt asks for, for the lesson
 * check and repair tests. Each call returns a fresh copy to change.
 */

export const TARGET_WORDS = ["commute", "deadline", "flexible", "balance", "routine"];

export const CLOZE_TEXT =
  "My morning [5:routine] starts early because my [1:commute] takes an hour. My boss is [3:flexible] about when I arrive, " +
  "as long as I never miss a [2:deadline]. Finding a good [4:balance] between work and rest is still hard.";

export function vocabularyWord(term: string) {
  return {
    term,
    partOfSpeech: "noun",
    definition: `What ${term} means`,
    example: `A sentence that uses ${term}.`,
    imagePrompt: `A scene that shows ${term}. No text visible.`,
  };
}

export function choiceQuestion(n: number) {
  return {
    question: `Question ${n}?`,
    options: ["First option", "Second option", "Third option", "Fourth option"],
    answer: "Third option",
    correctAnswer: "Third option",
    explanation: "Why it is correct",
  };
}

export function sentenceFrame(n: number) {
  return {
    languageFunction: `Purpose ${n}`,
    grammarFocus: ["present simple"],
    tieredFrames: {
      emerging: { frame: `I like ___ (${n}).`, description: "Simple" },
      developing: { frame: `I like ___ because ___ (${n}).`, description: "Medium" },
      expanding: { frame: `What I enjoy most about ___ is ___ (${n}).`, description: "Complex" },
    },
    modelResponses: { emerging: ["I like trains."], developing: ["I like trains because they are fast."], expanding: ["What I enjoy most is reading."] },
    teachingNotes: { modelingTips: "Model it", guidedPractice: "Practise together", independentUse: "Use it alone", fadingStrategy: "Remove support" },
  };
}

export function discussionQuestion(n: number) {
  return {
    paragraphContext: "Some people work from home. Others travel to an office every day.",
    question: `Discussion question ${n}?`,
    imagePrompt: "People working at home and in an office. No text visible.",
  };
}

export const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export function completeLesson() {
  return {
    title: "Getting to Work",
    level: "B1",
    focus: "general",
    estimatedTime: 60,
    sections: [
      {
        type: "warmup",
        title: "Warm-up Activity",
        questions: range(5).map((n) => `Warm-up question ${n}?`),
        targetVocabulary: [...TARGET_WORDS],
      },
      { type: "reading", title: "Reading Text: Getting to Work", paragraphs: range(5).map((n) => `Paragraph ${n}.`) },
      { type: "vocabulary", title: "Key Vocabulary", words: TARGET_WORDS.map(vocabularyWord) },
      { type: "comprehension", title: "Vocabulary Check", questions: range(5).map(choiceQuestion) },
      {
        type: "sentenceFrames",
        version: "v2_pedagogical",
        title: "Language Practice: Work",
        pedagogicalFrames: range(3).map(sentenceFrame),
      },
      { type: "cloze", title: "Fill in the Blanks", text: CLOZE_TEXT, wordBank: [...TARGET_WORDS] },
      {
        type: "sentenceUnscramble",
        title: "Sentence Unscramble",
        sentences: [
          { words: ["My", "commute", "is", "long"], correctSentence: "My commute is long." },
          { words: ["I", "never", "miss", "a", "deadline"], correctSentence: "I never miss a deadline." },
          { words: ["Do", "you", "have", "a", "routine"], correctSentence: "Do you have a routine?" },
        ],
      },
      { type: "discussion", title: "Discussion Questions", questions: range(5).map(discussionQuestion) },
      { type: "quiz", title: "Knowledge Check", questions: range(5).map(choiceQuestion) },
    ] as Record<string, any>[],
  };
}

export type TestLesson = ReturnType<typeof completeLesson>;

export function sectionOf(lesson: TestLesson, type: string): Record<string, any> {
  const section = lesson.sections.find((item) => item.type === type);
  if (!section) throw new Error(`No ${type} section`);
  return section;
}
