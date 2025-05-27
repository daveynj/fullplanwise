interface GrammarPattern {
  type: 'past_perfect' | 'conditionals' | 'passive_voice' | 'comparatives' | 'present_perfect' | 'modal_verbs' | 'future_forms' | 'prepositions' | 'articles' | 'phrasal_verbs' | 'relative_clauses' | 'gerunds_infinitives';
  pattern: string;
  examples: string[];
  visualizationType: 'timeline' | 'split_screen' | 'flow_diagram' | 'comparison_chart' | 'modal_scale' | 'structure_diagram' | 'usage_examples';
}

interface GrammarVisualization {
  grammarType: string;
  title: string;
  description: string;
  examples: Array<{
    sentence: string;
    highlighted: string;
    explanation: string;
  }>;
  visualSteps: Array<{
    stepNumber: number;
    instruction: string;
    visualElements: any;
  }>;
}

export class GrammarAnalyzer {
  private grammarPatterns = {
    present_perfect: {
      regex: /\bhave\s+\w+ed\b|\bhas\s+\w+ed\b|\bhave\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b|\bhas\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi,
      type: 'timeline' as const,
      description: 'Present Perfect connects past actions to present results',
      minMatches: 1 // Lower threshold
    },
    modal_verbs: {
      regex: /\b(?:can|could|will|would|shall|should|may|might|must|ought to|have to|need to)\s+\w+/gi,
      type: 'modal_scale' as const,
      description: 'Modal verbs express possibility, necessity, and ability',
      minMatches: 2
    },
    future_forms: {
      regex: /\bwill\s+\w+\b|\bgoing to\s+\w+\b|\b(?:am|is|are)\s+going to\b/gi,
      type: 'timeline' as const,
      description: 'Different ways to express future actions and plans',
      minMatches: 1
    },
    prepositions: {
      regex: /\b(?:in|on|at|by|for|with|from|to|of|about|through|during|before|after|under|over|between|among)\s+(?:the|a|an)?\s*\w+/gi,
      type: 'usage_examples' as const,
      description: 'Prepositions show relationships between words',
      minMatches: 3
    },
    articles: {
      regex: /\b(?:the|a|an)\s+\w+/gi,
      type: 'usage_examples' as const,
      description: 'Articles (a, an, the) specify nouns',
      minMatches: 4
    },
    phrasal_verbs: {
      regex: /\b\w+\s+(?:up|down|in|out|on|off|over|back|away|through|around|along|across)\b/gi,
      type: 'structure_diagram' as const,
      description: 'Phrasal verbs combine verbs with particles for new meanings',
      minMatches: 2
    },
    relative_clauses: {
      regex: /\b(?:who|which|that|where|when|whose)\s+\w+/gi,
      type: 'structure_diagram' as const,
      description: 'Relative clauses provide additional information about nouns',
      minMatches: 1
    },
    gerunds_infinitives: {
      regex: /\b\w+ing\s+(?:is|are|was|were)\b|\bto\s+\w+\b(?:\s+is|\s+are|\s+was|\s+were)?/gi,
      type: 'usage_examples' as const,
      description: 'Gerunds and infinitives are verb forms used as nouns',
      minMatches: 2
    },
    past_perfect: {
      regex: /\bhad\s+\w+ed\b|\bhad\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi,
      type: 'timeline' as const,
      description: 'Past Perfect shows an action completed before another past action',
      minMatches: 1 // Reduced from 2
    },
    conditionals: {
      regex: /\bif\s+.*\bhad\s+\w+ed\b.*\bwould\s+have\b|\bif\s+.*\bhad\s+(?:been|gone|seen|done|taken|made)\b.*\bwould\s+have\b|\bif\s+\w+.*\bwill\b|\bif\s+\w+.*\bwould\b/gi,
      type: 'split_screen' as const,
      description: 'Conditionals show hypothetical situations and their results',
      minMatches: 1 // Reduced from 2
    },
    passive_voice: {
      regex: /\b(?:is|are|was|were|being|been)\s+\w+ed\b|\b(?:is|are|was|were|being|been)\s+(?:made|done|taken|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi,
      type: 'flow_diagram' as const,
      description: 'Passive voice shows the action happening to the subject',
      minMatches: 1 // Reduced from 2
    },
    comparatives: {
      regex: /\b(?:more|less)\s+\w+\s+than\b|\b\w+er\s+than\b|\b(?:better|worse|farther|further)\s+than\b/gi,
      type: 'comparison_chart' as const,
      description: 'Comparatives show differences between two things',
      minMatches: 1 // Reduced from 2
    }
  };

  /**
   * Analyze text for grammar patterns and return visualization data
   * Now tries multiple patterns and returns the best match, ensuring most lessons get grammar analysis
   */
  analyzeText(text: string, cefrLevel: string): GrammarVisualization | null {
    const foundPatterns: Array<{ type: keyof typeof this.grammarPatterns, matches: string[], score: number }> = [];

    // Check each grammar pattern
    for (const [patternType, pattern] of Object.entries(this.grammarPatterns)) {
      const matches = text.match(pattern.regex);
      if (matches && matches.length >= (pattern.minMatches || 1)) {
        foundPatterns.push({
          type: patternType as keyof typeof this.grammarPatterns,
          matches: [...new Set(matches)], // Remove duplicates
          score: matches.length * this.getPatternPriority(patternType, cefrLevel)
        });
      }
    }

    // If no patterns found, create a general grammar overview
    if (foundPatterns.length === 0) {
      return this.generateGeneralGrammarOverview(text, cefrLevel);
    }

    // Sort by score and use the best pattern
    foundPatterns.sort((a, b) => b.score - a.score);
    const selectedPattern = foundPatterns[0];
    const patternConfig = this.grammarPatterns[selectedPattern.type];

    return this.generateVisualization(selectedPattern.type, selectedPattern.matches, text, cefrLevel, patternConfig);
  }

  /**
   * Assign priority scores based on CEFR level appropriateness
   */
  private getPatternPriority(patternType: string, cefrLevel: string): number {
    const priorities: Record<string, Record<string, number>> = {
      'A1': { articles: 3, prepositions: 3, modal_verbs: 2, present_perfect: 1 },
      'A2': { present_perfect: 3, modal_verbs: 3, future_forms: 2, prepositions: 2 },
      'B1': { phrasal_verbs: 3, relative_clauses: 3, gerunds_infinitives: 2, conditionals: 2 },
      'B2': { passive_voice: 3, conditionals: 3, past_perfect: 2, phrasal_verbs: 2 },
      'C1': { past_perfect: 3, conditionals: 3, passive_voice: 2, relative_clauses: 2 },
      'C2': { past_perfect: 3, conditionals: 3, passive_voice: 2, gerunds_infinitives: 2 }
    };

    return priorities[cefrLevel]?.[patternType] || 1;
  }

  /**
   * Generate a general grammar overview when no specific patterns are found
   */
  private generateGeneralGrammarOverview(text: string, cefrLevel: string): GrammarVisualization {
    // Extract basic sentence structures
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3);
    
    return {
      grammarType: 'sentence_structure',
      title: 'Sentence Structure Analysis',
      description: 'Understanding the building blocks of English sentences',
      examples: sentences.map(sentence => ({
        sentence: sentence.trim(),
        highlighted: this.highlightBasicStructure(sentence.trim()),
        explanation: 'Notice the subject-verb-object pattern and connecting words'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Identify the basic sentence structure',
          visualElements: {
            type: 'structure',
            parts: ['Subject', 'Verb', 'Object/Complement']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Look for connecting words',
          visualElements: {
            type: 'connectors',
            examples: ['and', 'but', 'because', 'when', 'if']
          }
        },
        {
          stepNumber: 3,
          instruction: 'Practice building similar sentences',
          visualElements: {
            type: 'practice',
            template: '[Subject] + [Verb] + [Object/Information]'
          }
        }
      ]
    };
  }

  private highlightBasicStructure(sentence: string): string {
    // Simple highlighting for basic sentence structure
    return sentence
      .replace(/\b(?:the|a|an)\b/gi, '**$&**') // Articles
      .replace(/\b(?:and|but|or|because|when|if|that|which|who)\b/gi, '***$&***'); // Connectors
  }

  private generateVisualization(
    grammarType: keyof typeof this.grammarPatterns,
    matches: string[],
    fullText: string,
    cefrLevel: string,
    config: any
  ): GrammarVisualization {
    
    switch (grammarType) {
      case 'present_perfect':
        return this.generatePresentPerfectVisualization(matches, fullText, cefrLevel);
      case 'modal_verbs':
        return this.generateModalVerbsVisualization(matches, fullText, cefrLevel);
      case 'future_forms':
        return this.generateFutureFormsVisualization(matches, fullText, cefrLevel);
      case 'prepositions':
        return this.generatePrepositionsVisualization(matches, fullText, cefrLevel);
      case 'articles':
        return this.generateArticlesVisualization(matches, fullText, cefrLevel);
      case 'phrasal_verbs':
        return this.generatePhrasalVerbsVisualization(matches, fullText, cefrLevel);
      case 'relative_clauses':
        return this.generateRelativeClausesVisualization(matches, fullText, cefrLevel);
      case 'gerunds_infinitives':
        return this.generateGerundsInfinitivesVisualization(matches, fullText, cefrLevel);
      case 'past_perfect':
        return this.generatePastPerfectVisualization(matches, fullText, cefrLevel);
      case 'conditionals':
        return this.generateConditionalsVisualization(matches, fullText, cefrLevel);
      case 'passive_voice':
        return this.generatePassiveVisualization(matches, fullText, cefrLevel);
      case 'comparatives':
        return this.generateComparativesVisualization(matches, fullText, cefrLevel);
      default:
        return null as any;
    }
  }

  private generatePresentPerfectVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'present_perfect',
      title: 'Present Perfect: Past to Present Connection',
      description: 'Connecting past actions to present situations',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\bhave\s+\w+ed\b|\bhas\s+\w+ed\b|\bhave\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b|\bhas\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi),
        explanation: 'This action started in the past and connects to now'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the timeline connection',
          visualElements: {
            type: 'timeline',
            elements: ['PAST ACTION', '→', 'PRESENT RESULT'],
            labels: ['Something happened', 'Connection', 'Effect now']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Show the structure',
          visualElements: {
            type: 'structure',
            parts: ['have/has', '+', 'past participle']
          }
        }
      ]
    };
  }

  private generateModalVerbsVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'modal_verbs',
      title: 'Modal Verbs: Possibility and Necessity',
      description: 'Expressing ability, possibility, permission, and obligation',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:can|could|will|would|shall|should|may|might|must|ought to|have to|need to)\s+\w+/gi),
        explanation: 'Modal verbs change the meaning of the main verb'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the modal scale',
          visualElements: {
            type: 'modal_scale',
            scale: 'Weak possibility → Strong possibility → Certainty'
          }
        },
        {
          stepNumber: 2,
          instruction: 'Group by function',
          visualElements: {
            type: 'groups',
            groups: ['Ability: can/could', 'Possibility: may/might', 'Obligation: must/should']
          }
        }
      ]
    };
  }

  private generateFutureFormsVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'future_forms',
      title: 'Future Forms: Plans and Predictions',
      description: 'Different ways to talk about future events',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\bwill\s+\w+\b|\bgoing to\s+\w+\b|\b(?:am|is|are)\s+going to\b/gi),
        explanation: 'This expresses a future action or plan'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show future timeline',
          visualElements: {
            type: 'timeline',
            elements: ['NOW', '→', 'FUTURE'],
            labels: ['Present', 'Planning', 'Future event']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Compare future forms',
          visualElements: {
            type: 'comparison',
            forms: ['will = prediction', 'going to = plan', 'present continuous = arrangement']
          }
        }
      ]
    };
  }

  private generatePrepositionsVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'prepositions',
      title: 'Prepositions: Showing Relationships',
      description: 'Words that show position, time, and other relationships',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:in|on|at|by|for|with|from|to|of|about|through|during|before|after|under|over|between|among)\s+(?:the|a|an)?\s*\w+/gi),
        explanation: 'Prepositions connect nouns to other words'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show relationship types',
          visualElements: {
            type: 'categories',
            categories: ['Place: in, on, at', 'Time: before, after, during', 'Movement: to, from, through']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Practice common combinations',
          visualElements: {
            type: 'practice',
            examples: ['in the morning', 'on the table', 'at school']
          }
        }
      ]
    };
  }

  private generateArticlesVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'articles',
      title: 'Articles: The, A, An',
      description: 'Using articles to specify nouns',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:the|a|an)\s+\w+/gi),
        explanation: 'Articles help specify whether something is specific or general'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show article functions',
          visualElements: {
            type: 'functions',
            functions: ['THE = specific', 'A/AN = general', 'No article = general plural']
          }
        },
        {
          stepNumber: 2,
          instruction: 'A vs AN rule',
          visualElements: {
            type: 'rule',
            rule: 'A + consonant sound, AN + vowel sound'
          }
        }
      ]
    };
  }

  private generatePhrasalVerbsVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'phrasal_verbs',
      title: 'Phrasal Verbs: Verb + Particle',
      description: 'Verbs combined with particles for new meanings',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b\w+\s+(?:up|down|in|out|on|off|over|back|away|through|around|along|across)\b/gi),
        explanation: 'The particle changes the meaning of the verb'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the structure',
          visualElements: {
            type: 'structure',
            parts: ['VERB', '+', 'PARTICLE', '=', 'NEW MEANING']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Common patterns',
          visualElements: {
            type: 'patterns',
            patterns: ['turn on/off', 'give up', 'look after', 'break down']
          }
        }
      ]
    };
  }

  private generateRelativeClausesVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'relative_clauses',
      title: 'Relative Clauses: Adding Information',
      description: 'Using who, which, that to add details about nouns',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:who|which|that|where|when|whose)\s+\w+/gi),
        explanation: 'This clause gives extra information about the noun'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the connection',
          visualElements: {
            type: 'connection',
            structure: 'NOUN + relative pronoun + extra information'
          }
        },
        {
          stepNumber: 2,
          instruction: 'Choose the right pronoun',
          visualElements: {
            type: 'guide',
            guide: 'WHO = people, WHICH = things, THAT = people or things'
          }
        }
      ]
    };
  }

  private generateGerundsInfinitivesVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'gerunds_infinitives',
      title: 'Gerunds and Infinitives: Verb Forms as Nouns',
      description: 'Using -ing forms and to + verb as nouns',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b\w+ing\s+(?:is|are|was|were)\b|\bto\s+\w+\b(?:\s+is|\s+are|\s+was|\s+were)?/gi),
        explanation: 'These verb forms act like nouns in the sentence'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the forms',
          visualElements: {
            type: 'forms',
            forms: ['GERUND: verb + -ing', 'INFINITIVE: to + verb']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Common uses',
          visualElements: {
            type: 'uses',
            uses: ['Subject: Swimming is fun', 'Object: I like to read']
          }
        }
      ]
    };
  }

  private generatePastPerfectVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    // Extract sentences containing past perfect
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'past_perfect',
      title: 'Past Perfect Timeline',
      description: 'Understanding when actions happened in relation to each other',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\bhad\s+\w+ed\b|\bhad\s+(?:been|gone|seen|done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi),
        explanation: 'This action was completed before another past action or time'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show the timeline',
          visualElements: {
            type: 'timeline',
            elements: ['PAST', 'PAST', 'NOW'],
            labels: ['Action 1', 'Action 2', 'Present']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Place the actions on timeline',
          visualElements: {
            type: 'timeline_with_actions',
            actions: [
              { position: 'far_past', label: 'had + past participle', icon: '✓' },
              { position: 'recent_past', label: 'simple past', icon: '⚫' }
            ]
          }
        },
        {
          stepNumber: 3,
          instruction: 'Show the relationship',
          visualElements: {
            type: 'connection',
            connection: 'Action 1 was COMPLETED before Action 2 happened'
          }
        }
      ]
    };
  }

  private generateConditionalsVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'conditionals',
      title: 'Third Conditional: Unreal Past',
      description: 'Talking about how the past could have been different',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\bif\s+.*\bhad\s+\w+ed\b.*\bwould\s+have\b|\bif\s+.*\bhad\s+(?:been|gone|seen|done|taken|made)\b.*\bwould\s+have\b/gi),
        explanation: 'This describes an imaginary past situation and its imaginary result'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show two worlds',
          visualElements: {
            type: 'split_screen',
            top: 'IMAGINARY WORLD (if condition were true)',
            bottom: 'REAL WORLD (what actually happened)'
          }
        },
        {
          stepNumber: 2,
          instruction: 'Show the condition and result',
          visualElements: {
            type: 'if_then',
            ifClause: 'If + had + past participle',
            thenClause: 'would have + past participle'
          }
        },
        {
          stepNumber: 3,
          instruction: 'Compare reality vs. imagination',
          visualElements: {
            type: 'comparison',
            reality: 'What actually happened',
            imagination: 'What we imagine could have happened'
          }
        }
      ]
    };
  }

  private generatePassiveVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'passive_voice',
      title: 'Passive Voice: Action Flow',
      description: 'Understanding who does the action vs. who receives it',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:is|are|was|were|being|been)\s+\w+ed\b|\b(?:is|are|was|were|being|been)\s+(?:made|done|taken|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi),
        explanation: 'The focus is on what happened, not who did it'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show action direction',
          visualElements: {
            type: 'flow_diagram',
            flow: 'ACTION → SUBJECT'
          }
        },
        {
          stepNumber: 2,
          instruction: 'Show passive structure',
          visualElements: {
            type: 'structure',
            parts: ['Subject', 'be + past participle', 'by + agent (optional)']
          }
        },
        {
          stepNumber: 3,
          instruction: 'Compare active vs. passive',
          visualElements: {
            type: 'comparison',
            active: 'Someone does something',
            passive: 'Something is done (by someone)'
          }
        }
      ]
    };
  }

  private generateComparativesVisualization(matches: string[], fullText: string, cefrLevel: string): GrammarVisualization {
    const exampleSentences = this.extractSentencesWithMatches(fullText, matches).slice(0, 2);
    
    return {
      grammarType: 'comparatives',
      title: 'Comparative Structures',
      description: 'Showing differences and similarities between things',
      examples: exampleSentences.map(sentence => ({
        sentence,
        highlighted: this.highlightGrammarInSentence(sentence, /\b(?:more|less)\s+\w+\s+than\b|\b\w+er\s+than\b|\b(?:better|worse|farther|further)\s+than\b/gi),
        explanation: 'This compares two things to show which is greater, lesser, or different'
      })),
      visualSteps: [
        {
          stepNumber: 1,
          instruction: 'Show comparison structure',
          visualElements: {
            type: 'comparison_chart',
            items: ['Item A', 'Comparison word', 'Item B']
          }
        },
        {
          stepNumber: 2,
          instruction: 'Show the relationship',
          visualElements: {
            type: 'scale',
            scale: 'A ←→ comparison ←→ B'
          }
        },
        {
          stepNumber: 3,
          instruction: 'Show different comparison types',
          visualElements: {
            type: 'types',
            types: ['more/less + adjective', 'adjective + -er', 'irregular forms']
          }
        }
      ]
    };
  }

  private extractSentencesWithMatches(text: string, matches: string[]): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentencesWithMatches: string[] = [];

    for (const match of matches) {
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(match.toLowerCase()) && 
            !sentencesWithMatches.some(existing => existing.toLowerCase() === sentence.toLowerCase())) {
          sentencesWithMatches.push(sentence.trim());
          if (sentencesWithMatches.length >= 2) break;
        }
      }
      if (sentencesWithMatches.length >= 2) break;
    }

    return sentencesWithMatches;
  }

  private highlightGrammarInSentence(sentence: string, regex: RegExp): string {
    // Instead of using the original regex which highlights phrases,
    // we'll highlight only the actual grammar words
    return sentence.replace(regex, (match) => {
      // For prepositions, highlight only the preposition word
      if (regex.source.includes('in|on|at|by|for|with|from|to|of|about|through|during|before|after|under|over|between|among')) {
        const prepositions = ['in', 'on', 'at', 'by', 'for', 'with', 'from', 'to', 'of', 'about', 'through', 'throughout', 'during', 'before', 'after', 'under', 'over', 'between', 'among', 'above', 'across', 'against', 'along', 'around', 'behind', 'below', 'beneath', 'beside', 'beyond', 'down', 'except', 'inside', 'into', 'like', 'near', 'off', 'onto', 'toward', 'until', 'up', 'upon', 'within', 'without'];
        
        // Find the preposition within the match
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          if (prepositions.includes(cleanWord)) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For articles, highlight only the articles
      if (regex.source.includes('the|a|an')) {
        const articles = ['the', 'a', 'an'];
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          if (articles.includes(cleanWord)) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For modal verbs, highlight only the modal
      if (regex.source.includes('can|could|may|might|will|would|shall|should|must|ought')) {
        const modals = ['can', 'could', 'may', 'might', 'will', 'would', 'shall', 'should', 'must', 'ought'];
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          if (modals.includes(cleanWord)) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For relative pronouns, highlight only the relative pronoun
      if (regex.source.includes('who|which|that|where|when|whose')) {
        const relatives = ['who', 'whom', 'whose', 'which', 'that', 'where', 'when', 'why'];
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          if (relatives.includes(cleanWord)) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For tense-based patterns (present perfect, past perfect, etc.), highlight the auxiliary and main verb
      if (regex.source.includes('have|has|had')) {
        const words = match.split(/\s+/);
        const highlightedWords = words.map((word, index) => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          // Highlight auxiliaries and main verbs
          if (['have', 'has', 'had', 'am', 'is', 'are', 'was', 'were', 'being', 'been'].includes(cleanWord) || 
              index === words.length - 1) { // Last word is usually the main verb/participle
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For phrasal verbs, highlight the verb and particle
      if (regex.source.includes('up|down|in|out|on|off|over|back|away|through|around|along|across')) {
        const particles = ['up', 'down', 'in', 'out', 'on', 'off', 'over', 'back', 'away', 'through', 'around', 'along', 'across', 'after', 'into', 'onto'];
        const words = match.split(/\s+/);
        const highlightedWords = words.map((word, index) => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          // Highlight the verb (first word) and particle
          if (index === 0 || particles.includes(cleanWord)) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For comparatives, highlight specific comparative words
      if (regex.source.includes('more|most|than')) {
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          // Highlight comparative markers and comparative adjectives
          if (['more', 'most', 'than', 'the'].includes(cleanWord) || 
              cleanWord.endsWith('er') || cleanWord.endsWith('est')) {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // For gerunds and infinitives
      if (regex.source.includes('ing') || match.toLowerCase().startsWith('to ')) {
        const words = match.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
          // Highlight -ing words and infinitive markers
          if (cleanWord.endsWith('ing') || cleanWord === 'to') {
            return `**${word}**`;
          }
          return word;
        });
        return highlightedWords.join(' ');
      }
      
      // Default: highlight the entire match (for cases we haven't specifically handled)
      return `**${match}**`;
    });
  }
}

export const grammarAnalyzer = new GrammarAnalyzer(); 