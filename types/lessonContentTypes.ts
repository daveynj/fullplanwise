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