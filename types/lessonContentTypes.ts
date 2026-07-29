/**
 * Represents a single component (like adjective, infinitive, reason)
 * within the sentence structure breakdown.
 */
export interface SentenceFrameComponent {
  /** The name of the component (e.g., "Adjective", "Part 1"). */
  label: string;
  /** A brief description of this component's role. */
  description: string;
  /** Example words or short phrases for this component. */
  examples: string[];
  /** Shows how this component fits into the start of the sentence. */
  inSentenceExample: string;
}

/**
 * Represents a complete example sentence using the pattern,
 * with its parts broken down.
 */
export interface SentenceFrameExample {
  /** The full example sentence. */
  completeSentence: string;
  /** Maps the component labels to the specific text used in this example. */
  breakdown: {
    [componentLabel: string]: string;
  };
  /** Plain-text form of the example used by some AI providers. */
  text?: string;
  /** Alternative format used by some AI providers */
  componentBreakdown?: {
    [componentLabel: string]: string;
  };
}

/**
 * Interactive practice activity for sentence frames
 */
export interface PracticeActivity {
  /** Type of practice activity */
  type: "controlled" | "guided" | "free";
  /** Name of the activity */
  name: string;
  /** Instructions for the activity */
  instruction: string;
  /** Difficulty level */
  difficulty: "easy" | "medium" | "challenging";
}

/**
 * Error correction information for common mistakes
 */
export interface ErrorCorrection {
  /** Common mistakes students make with this pattern */
  commonMistakes: Array<{
    /** The incorrect usage */
    error: string;
    /** The correct version */
    correction: string;
    /** Explanation of why it's wrong */
    explanation: string;
  }>;
}

/**
 * Cultural adaptation information for sentence frames
 */
export interface CulturalAdaptation {
  /** How this pattern applies across cultures */
  universalApplication: string;
  /** Notes about cultural variations */
  culturalNotes?: string;
  /** Questions to start cultural discussions */
  discussionStarters?: string[];
}

/**
 * Interactive features for enhanced learning
 */
export interface InteractiveFeatures {
  /** Fill-in-the-blank exercises */
  fillInTheBlanks?: Array<{
    template: string;
    prompts: string[];
  }>;
  /** Substitution drill exercises */
  substitutionDrill?: {
    basePattern: string;
    substitutions: Array<{
      target: string;
      options: string[];
    }>;
  };
  /** Step-by-step sentence building */
  buildingSentences?: {
    stepByStep: Array<{
      step: number;
      instruction: string;
      examples: string[];
    }>;
  };
}

/**
 * Sentence building step for progressive learning
 */
export interface SentenceBuildingStep {
  /** Level of construction (word, phrase, sentence) */
  level: "word" | "phrase" | "sentence";
  /** Example at this level */
  example: string;
  /** Optional explanation */
  explanation?: string;
}

/**
 * Sentence workshop activity for A1-B1 learners
 */
export interface SentenceWorkshopActivity {
  /** Name of the activity */
  name: string;
  /** Progressive steps in sentence building */
  steps: SentenceBuildingStep[];
  /** Teaching notes for this activity */
  teachingNotes?: string;
}

/**
 * Pattern trainer scaffolding for basic patterns
 */
export interface PatternTrainerScaffolding {
  /** Available verbs for the pattern */
  verbs?: string[];
  /** Available nouns for the pattern */
  nouns?: string[];
  /** Available adjectives for the pattern */
  adjectives?: string[];
  /** Available reasons/explanations */
  reasons?: string[];
  /** Other word categories */
  [category: string]: string[] | undefined;
}

/**
 * Pattern trainer for A1-B1 learners
 */
export interface PatternTrainer {
  /** Simple pattern with clear placeholders */
  pattern: string;
  /** Title of the pattern trainer */
  title: string;
  /** Scaffolding word banks */
  scaffolding: PatternTrainerScaffolding;
  /** Example sentences using the pattern */
  examples: string[];
  /** Step-by-step instructions */
  instructions: string[];
}

/**
 * Enhanced scaffolding data for lower-level learners (A1-B1)
 */
export interface LowerLevelScaffolding {
  /** Sentence workshop activities */
  sentenceWorkshop?: SentenceWorkshopActivity[];
  /** Pattern trainer */
  patternTrainer?: PatternTrainer;
  /** Visual sentence maps */
  visualMaps?: Array<{
    pattern: string;
    colorCoding: {
      [component: string]: string; // component -> color
    };
    example: string;
  }>;
}

/**
 * NEW: Pedagogically-Sound Sentence Frames (v2) - Following Best Practices
 * Based on research-backed tiered scaffolding approach
 */
export interface PedagogicalSentenceFrame {
  /** The communicative/language function this frame supports */
  languageFunction: string;
  /** Grammar focus areas this pattern teaches */
  grammarFocus: string[];
  /** Tiered frames by proficiency level - following differentiation best practices */
  tieredFrames: {
    /** Simple structure for Emerging learners (basic reporting/description) */
    emerging: {
      frame: string;
      description: string;
    };
    /** Mid-complexity for Developing learners (adding causation/reasoning) */
    developing: {
      frame: string;
      description: string;
    };
    /** High complexity for Expanding learners (inference/justification) */
    expanding: {
      frame: string;
      description: string;
    };
  };
  /** Model responses - complete examples for each tier (reverse-engineered approach) */
  modelResponses: {
    emerging: string[];
    developing: string[];
    expanding: string[];
  };
  /** Simple teaching guidance following I Do / We Do / You Do model */
  teachingNotes: {
    modelingTips: string; // How to model ("I Do")
    guidedPractice: string; // Collaborative practice ("We Do")
    independentUse: string; // Transition to independence ("You Do")
    fadingStrategy: string; // How to gradually remove scaffold
  };
}

/**
 * OLD: Legacy Sentence Frame Pattern (for backward compatibility with existing lessons)
 * Represents the complete data structure for the enhanced
 * Sentence Frame section within a lesson.
 */
export interface SentenceFramePattern {
  /** The sentence pattern with blanks (e.g., "It is ___ to ___ because ___."). */
  patternTemplate: string;
  /** Alternative property name for patternTemplate (used by some AI providers) */
  pattern?: string;
  /** The communicative function of this pattern (e.g., "Explaining reasons"). */
  languageFunction: string;
  /** Alternative property name for languageFunction (used by some AI providers) */
  communicativeFunction?: string;
  /** Title of the sentence pattern (optional) */
  title?: string;
  /** Difficulty level of the pattern */
  level?: "basic" | "intermediate" | "advanced" | string;
  /** Bullet points explaining the grammar rules. */
  grammarFocus: string[] | string;

  // --- Structure Breakdown Tab Data ---
  /** Detailed breakdown of each component of the sentence pattern. */
  structureComponents?: SentenceFrameComponent[];
  /** Data for the simplified visual structure diagram. */
  visualStructure?: {
    start: string; // e.g., "It is"
    // Represents parts and connectors, mapping labels to the structureComponents
    parts: Array<{ 
      label: string; // Corresponds to a structureComponents label
      connector?: string; // Text like "to", "because" that connects this part to the next
    }>;
    end: string; // e.g., "." or "?"
  };

  // --- Examples Tab Data ---
  /** An array of complete sentence examples with their breakdowns. */
  examples: (SentenceFrameExample | string)[];

  // --- Additional Content ---
  /** Examples of variations of the main pattern. */
  patternVariations?: {
    negativeForm?: string;
    questionForm?: string;
    modalForm?: string;
    pastForm?: string;
  };
  /** Notes specifically for the teacher on presenting this pattern. */
  teachingNotes?: string[];
  /** Alternative property name for teachingNotes */
  teachingTips?: string;
  /** Usage notes for the pattern */
  usageNotes?: string | string[];
  /** Questions to prompt discussion related to the pattern/topic. */
  discussionPrompts?: string[];

  // --- Enhanced Features ---
  /** Interactive practice activities */
  practiceActivities?: PracticeActivity[];
  /** Error correction information */
  errorCorrection?: ErrorCorrection;
  /** Cultural adaptation information */
  culturalAdaptation?: CulturalAdaptation;
  /** Interactive learning features */
  interactiveFeatures?: InteractiveFeatures;
  
  // --- Enhanced Scaffolding for A1-B1 Learners (Optional) ---
  /** Enhanced scaffolding for lower-level learners */
  lowerLevelScaffolding?: LowerLevelScaffolding;
} 
/**
 * A multiple-choice option in object form. Some AI providers return options
 * as plain strings, others as `{ text, correct }` objects.
 */
export interface LessonQuestionOption {
  text: string;
  correct?: boolean;
  [key: string]: unknown;
}

/**
 * A question/answer item used in comprehension, quiz, and discussion sections.
 * AI providers sometimes return plain strings instead of objects.
 */
export interface LessonQuestionAnswer {
  question: string;
  answer?: string;
  options?: Array<string | LessonQuestionOption>;
  correctAnswer?: string | number;
  explanation?: string;
  /** Discussion-style fields produced by some AI providers. */
  type?: string;
  text?: string;
  level?: "basic" | "critical" | string;
  topic?: string;
  introduction?: string;
  focusVocabulary?: string[];
  followUp?: string[];
  paragraphContext?: string;
  imagePrompt?: string;
  imageBase64?: string | null;
  [key: string]: unknown;
}

/** A question entry in a lesson section — either structured or a plain string. */
export type LessonQuestion = string | LessonQuestionAnswer;

/**
 * A vocabulary word entry as produced by AI providers. Some providers use
 * `term` instead of `word`, and pronunciation may be a string or an object.
 */
export interface LessonVocabularyWord {
  word?: string;
  /** Alternative property name for `word` used by some AI providers. */
  term?: string;
  definition?: string;
  partOfSpeech?: string;
  example?: string;
  examples?: string[];
  phonetic?: string;
  ipa?: string;
  syllables?: string[];
  stressIndex?: number;
  phoneticGuide?: string;
  imageBase64?: string | null;
  semanticGroup?: string;
  category?: string;
  group?: string;
  additionalExamples?: string[];
  wordFamily?: { words: string[]; description?: string };
  relatedWords?: string[];
  wordFamilyDescription?: string;
  collocations?: string[];
  usageNotes?: string;
  usage?: string;
  semanticMap?: {
    synonyms?: string[];
    antonyms?: string[];
    relatedConcepts?: string[];
    contexts?: string[];
    associatedWords?: string[];
  };
  topicEssential?: boolean;
  pronunciation?:
    | string
    | {
        ipa?: string;
        value?: string;
        syllables?: string[];
        stressIndex?: number;
        phoneticGuide?: string;
        [key: string]: unknown;
      };
  [key: string]: unknown;
}

/**
 * A single section of AI-generated lesson content. Known fields are typed;
 * the index signature allows provider-specific extra keys, which callers
 * must narrow before use.
 */
export interface LessonSection {
  type?: string;
  version?: string;
  title?: string;
  content?: unknown;
  introduction?: string;
  description?: string;
  teacherNotes?: string;
  questions?: LessonQuestion[] | Record<string, unknown>;
  words?: LessonVocabularyWord[];
  paragraphs?: string[];
  frames?: SentenceFramePattern[];
  pedagogicalFrames?: PedagogicalSentenceFrame[];
  examples?: (SentenceFrameExample | string)[];
  [key: string]: unknown;
}

/**
 * The parsed top-level lesson content structure rendered by lesson displays.
 * AI providers sometimes attach content under arbitrary top-level keys, so
 * an index signature is kept for detection/normalization code paths.
 */
export interface ParsedLessonContent {
  title?: string;
  provider?: string;
  level?: string;
  focus?: string;
  estimatedTime?: string | number;
  lesson?: { title?: string; level?: string; focus?: string; time?: string };
  sections: LessonSection[];
  teacherNotes?: string;
  warmUpQuestions?: string[];
  rawContent?: string;
  grammarSpotlight?: unknown;
  [key: string]: unknown;
}

/**
 * The lesson record shape consumed by the lesson preview component.
 * `content` may be a JSON string (from the database) or an already-parsed object.
 */
export interface PreviewableLesson {
  id?: number;
  title?: string;
  cefrLevel?: string;
  content?: string | ParsedLessonContent | null;
  grammarSpotlight?: unknown;
  [key: string]: unknown;
}
