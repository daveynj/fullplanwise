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
}

/**
 * Represents the complete data structure for the enhanced
 * Sentence Frame section within a lesson.
 */
export interface SentenceFramePattern {
  /** The sentence pattern with blanks (e.g., "It is ___ to ___ because ___."). */
  patternTemplate: string;
  /** The communicative function of this pattern (e.g., "Explaining reasons"). */
  languageFunction: string;
  /** Bullet points explaining the grammar rules. */
  grammarFocus: string[];

  // --- Structure Breakdown Tab Data ---
  /** Detailed breakdown of each component of the sentence pattern. */
  structureComponents: SentenceFrameComponent[];
  /** Data for the simplified visual structure diagram. */
  visualStructure: {
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
  examples: SentenceFrameExample[];

  // --- Additional Content ---
  /** Examples of variations of the main pattern. */
  patternVariations: {
    negativeForm?: string;
    questionForm?: string;
    modalForm?: string;
  };
  /** Notes specifically for the teacher on presenting this pattern. */
  teachingNotes: string[];
  /** Questions to prompt discussion related to the pattern/topic. */
  discussionPrompts: string[];
} 