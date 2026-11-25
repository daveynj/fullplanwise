/**
 * PlanWise makes topic-based conversation lessons. Teachers sometimes type a
 * grammar point as the topic ("present perfect", "conditionals") and expect a
 * grammar-rules lesson. This spots that and suggests a conversation topic that
 * naturally makes the student use the structure.
 */

export interface GrammarTopicHint {
  /** The grammar point we recognised, as the teacher would say it. */
  grammar: string;
  /** A conversation topic that naturally uses it. */
  suggestion: string;
}

const RULES: { pattern: RegExp; grammar: string; suggestion: string }[] = [
  { pattern: /present\s+perfect/i, grammar: 'the present perfect', suggestion: "Life experiences: things I've done and things I'd still love to do" },
  { pattern: /(second|2nd|third|3rd|first|1st|zero)\s+conditional|conditionals?\b|\bif[- ]clauses?/i, grammar: 'conditionals', suggestion: 'What would you do if you won the lottery?' },
  { pattern: /past\s+(simple|continuous|perfect)|simple\s+past|past\s+tenses?/i, grammar: 'past tenses', suggestion: "A trip I'll never forget" },
  { pattern: /\bused\s+to\b/i, grammar: '"used to"', suggestion: 'How life has changed since I was a child' },
  { pattern: /future\s+(tense|simple|forms?|continuous|perfect)|going\s+to\s+vs|\bwill\s+vs\b/i, grammar: 'future forms', suggestion: 'Plans and predictions: what will life be like in 2050?' },
  { pattern: /passive\s+voice|\bthe\s+passive\b|^passive$/i, grammar: 'the passive', suggestion: 'How everyday things are made' },
  { pattern: /comparatives?|superlatives?/i, grammar: 'comparatives and superlatives', suggestion: 'City life vs country life: which is better?' },
  { pattern: /modal\s+verbs?|\bmodals\b|should\s*\/\s*must|must\s+vs/i, grammar: 'modal verbs', suggestion: 'Rules, advice and working from home' },
  { pattern: /reported\s+speech|indirect\s+speech/i, grammar: 'reported speech', suggestion: 'News, rumours and gossip: who said what?' },
  { pattern: /relative\s+clauses?|relative\s+pronouns?/i, grammar: 'relative clauses', suggestion: 'People who changed the world' },
  { pattern: /gerunds?|infinitives?/i, grammar: 'gerunds and infinitives', suggestion: 'Hobbies: what I love doing and want to try' },
  { pattern: /present\s+(simple|continuous|progressive)/i, grammar: 'present tenses', suggestion: 'My daily routine and what I am working on right now' },
  { pattern: /\barticles\b|\ba\s*\/\s*an\s*\/\s*the\b|prepositions?|countable|uncountable|quantifiers?/i, grammar: 'this grammar point', suggestion: 'Food around the world: what we eat and why' },
  { pattern: /\b(tenses|grammar\s+(rules?|lesson|points?)|verb\s+tenses?)\b/i, grammar: 'grammar', suggestion: 'A day in my life: past, present and future' },
];

/** Returns a hint when the topic looks like a grammar point rather than a conversation topic. */
export function grammarTopicHint(topic: string): GrammarTopicHint | null {
  const text = topic.trim();
  // Long, descriptive requests ("a lesson about travel that practises the
  // present perfect") already have a real topic; only flag short ones.
  if (!text || text.split(/\s+/).length > 12) return null;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return { grammar: rule.grammar, suggestion: rule.suggestion };
  }
  return null;
}
