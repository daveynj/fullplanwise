import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { stabilityService } from './stability.service';

// Qwen API endpoint for international usage
const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

/**
 * Service for interacting with the Qwen AI API
 */
export class QwenService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Qwen API key is not provided or is empty');
    }
    this.apiKey = apiKey;
    console.log(`Qwen service initialized. API key present: ${!!apiKey}, Length: ${apiKey?.length || 0}`);
  }

  /**
   * Generate a complete ESL lesson based on the provided parameters
   * @param params Lesson generation parameters
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Qwen API key is not configured');
      }

      console.log('Starting Qwen API lesson generation...');

      // Validate the API key format (basic validation)
      if (!this.apiKey.trim()) {
        throw new Error('Empty API key provided');
      }

      // Log the key pattern (without revealing the actual key)
      const keyPattern = this.apiKey.substring(0, 4) + '...' + this.apiKey.substring(this.apiKey.length - 4);
      console.log(`Using API key pattern: ${keyPattern}`);

      // Set targetLevel variable to match what the system prompt expects
      const targetLevel = params.cefrLevel;

      // Build the prompt for lesson generation
      console.log('Building prompt for lesson generation');
      const prompt = `You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience.

CRITICAL INSTRUCTION: Throughout this lesson template, you will see text that says "REPLACE WITH:" followed by instructions. You MUST replace ALL of this text with actual, real content. Never include "REPLACE WITH:" in your final response - it should only contain real lesson content about the topic "${params.topic}".

TASK OVERVIEW:
You will create a complete ESL lesson for ${params.cefrLevel} level students on a given topic.

STEP 0: CEFR LEVEL ANALYSIS (REQUIRED BEFORE PROCEEDING)

Before creating any lesson content, first analyze and establish clear parameters for what constitutes ${params.cefrLevel} level appropriate content:

1. VOCABULARY ANALYSIS:
   - Identify what vocabulary range is appropriate for ${params.cefrLevel} level students
   ${params.targetVocabulary ? `   - IMPORTANT: You MUST include the following words in your lesson: ${params.targetVocabulary}` : ''}
   - List 5-10 example words that would be appropriate for this level
   - List 3-5 example words that would be too difficult for this level

2. GRAMMAR STRUCTURE ANALYSIS:
   - Identify which grammatical structures are appropriate for ${params.cefrLevel} level
   - List 3-5 sentence structure patterns appropriate for this level
   - List 2-3 grammatical structures that would be too complex for this level

STEP 3: READING TEXT DEVELOPMENT APPROACH

SPEAKING-FOCUSED TEXT PURPOSE ANALYSIS

Before writing, analyze the text's role in a speaking-focused lesson for ${params.cefrLevel} students:

PURPOSE CLARIFICATION:
- This text serves as a CONVERSATION CATALYST, not comprehensive reading practice
- Students will use this text to GENERATE SPEAKING opportunities about "${params.topic}"
- The text should PROVIDE ENOUGH CONTENT for meaningful discussion without overwhelming
- Focus on ACCESSIBLE INFORMATION that students can reference, react to, and build upon in conversation

SPEAKING-LESSON TEXT REQUIREMENTS:
- SHORTER TEXTS that can be quickly processed to focus lesson time on speaking
- DISCUSSION-WORTHY CONTENT that naturally generates opinions, questions, and personal connections
- CLEAR TALKING POINTS that students can easily reference during conversations
- RELATABLE SCENARIOS that connect to students' experiences and interests

READER ENGAGEMENT AND COMPREHENSION ANALYSIS FOR ${params.cefrLevel}

Analyze what ${params.cefrLevel} students can meaningfully engage with:

COGNITIVE ENGAGEMENT ANALYSIS:
A1 STUDENTS: Can engage with immediate, concrete experiences they can relate to personally
- Personal situations, daily activities, familiar objects and people
- Simple cause-and-effect relationships they experience directly
- Basic problem-solution scenarios from everyday life

A2 STUDENTS: Can engage with personal experiences and simple social situations
- Past experiences, future plans, personal opinions about familiar topics
- Simple comparisons between different places, people, or experiences
- Basic cultural or social topics they encounter in daily life

B1 STUDENTS: Can engage with social issues and practical problems that affect their lives
- Community issues, lifestyle choices, personal challenges and solutions
- Comparing different approaches to common problems
- Topics where they can express opinions and give reasons

B2 STUDENTS: Can engage with analytical thinking about complex social and professional topics
- Abstract concepts they can relate to their experiences
- Multiple perspectives on contemporary issues
- Topics requiring evaluation and critical thinking

C1 STUDENTS: Can engage with sophisticated analysis and nuanced discussion
- Complex social, academic, or professional issues
- Subtle distinctions and implied meanings
- Topics requiring synthesis of multiple ideas and perspectives

C2 STUDENTS: Can engage with highly sophisticated and specialized content
- Expert-level discussions with nuanced argumentation
- Complex interdisciplinary connections
- Topics requiring deep critical analysis and evaluation

CONTENT APPROPRIATENESS AND ENGAGEMENT VALIDATION

Before finalizing content, verify it meets speaking-lesson requirements:

CONTENT VALIDATION CHECKLIST:
✓ PERSONAL RELEVANCE: Can students connect this to their own experiences or opinions?
✓ DISCUSSION POTENTIAL: Does this content naturally generate questions, reactions, and responses?
✓ OPINION-WORTHY: Are there aspects students can agree/disagree with or have personal views about?
✓ ACCESSIBLE COMPLEXITY: Can students understand this quickly to focus on speaking practice?
✓ CONVERSATION STARTERS: Does this provide clear talking points for pair/group discussions?

REJECTION CRITERIA - AVOID CONTENT THAT:
❌ Is purely informational without discussion potential
❌ Requires extensive reading comprehension that dominates lesson time
❌ Is too abstract or distant from students' experiences to generate authentic responses
❌ Provides facts without opportunities for personal reaction or opinion
❌ Is too complex for students to quickly process and then discuss

SPEAKING-OPTIMIZED TEXT LENGTH GUIDELINES:

A1 LEVEL: 80-120 words (2-3 short paragraphs)
- Quick to read, maximum time for speaking practice
- Focus on concrete, relatable situations that generate immediate responses

A2 LEVEL: 100-150 words (2-3 paragraphs)  
- Manageable length allowing focus on conversation
- Include personal experience connections that prompt sharing

B1 LEVEL: 120-180 words (3 paragraphs)
- Balanced content that provides discussion material without overwhelming
- Include different perspectives or approaches students can respond to

B2 LEVEL: 150-220 words (3-4 paragraphs)
- Rich enough content for analytical discussion
- Multiple aspects or viewpoints students can explore in conversation

C1/C2 LEVELS: 180-250 words (3-4 paragraphs)
- Sophisticated content that merits extended discussion
- Complex enough to sustain in-depth conversation while remaining accessible

STEP 1: WRITE A READING TEXT
- First, write an original reading text about the topic "${params.topic}"
- Use a warm, accessible, and conversational tone
- Include interesting facts and observations woven naturally into the narrative
- Use vivid, descriptive language that brings topics to life
- Make complex information approachable through clear explanations and engaging examples
- Use a mix of sentence lengths for good flow
- Occasionally address the reader directly with rhetorical questions or observations

TONE & STYLE APPROACH:
First, analyze appropriate tone and style considerations for ${params.cefrLevel} level:
- Research how tone and register should be adjusted for ${params.cefrLevel} level learners
- Identify appropriate language complexity, sentence structure, and vocabulary choices for this level
- Determine the optimal balance between authenticity and accessibility
- Consider how the topic "${params.topic}" influences appropriate tone and style
- Analyze engagement strategies that work best for this proficiency level and topic

Based on your analysis, develop a tone and style that:
- Is most effective for ${params.cefrLevel} level language comprehension
- Creates appropriate engagement for the specific topic "${params.topic}"
- Balances authenticity with accessibility
- Models natural language use appropriate to the context
- Demonstrates appropriate register for both the topic and level
- Provides appropriate linguistic scaffolding through style choices
- Creates interest and motivation for continued reading/learning

Apply your determined tone and style consistently across all lesson components:
- Reading text
- Vocabulary definitions and examples
- Activity instructions
- Discussion questions and contexts
- Teacher guidance sections

TOPIC DIFFERENTIATION APPROACH:
First, analyze how the topic "${params.topic}" should be treated differently across CEFR levels:
- Research how the complexity and focus of topic treatment evolves from A1 to C2
- Identify specific aspects of the topic appropriate for ${params.cefrLevel} level
- Determine which vocabulary domains within this topic are level-appropriate
- Consider how conceptual complexity should increase with higher levels

For "${params.topic}" at ${params.cefrLevel} level specifically:
- Identify 3-5 unique aspects or sub-topics that are specifically appropriate for this level
- Determine which vocabulary domains are appropriate for THIS level but NOT lower levels
- Consider which cognitive approaches to the topic match this specific level
- Identify conceptual complexity appropriate specifically for ${params.cefrLevel}

Based on your analysis, create a unique approach to "${params.topic}" for ${params.cefrLevel} level by:
- Focusing on the sub-aspects most appropriate for this specific level
- Selecting vocabulary that would NOT be taught at lower levels
- Approaching the topic from a cognitive perspective matching this level
- Ensuring clear differentiation from how this topic would be taught at other levels

This approach should ensure that lessons on the same topic at different CEFR levels are substantially different in:
- Vocabulary selection
- Question complexity and type
- Conceptual approach
- Content focus and examples

ENHANCED STYLE APPROACH:
First, analyze writing style characteristics of exemplary language teaching materials:
- Study highly engaging ESL materials at ${params.cefrLevel} level
- Identify what makes certain materials more engaging than others
- Research the balance between authenticity and accessibility
- Determine style patterns that increase student motivation and interest

Based on your analysis, develop a writing style for "${params.topic}" at ${params.cefrLevel} level that:
- Has a clear, consistent voice throughout the lesson
- Uses language patterns that model natural, native-like expression
- Incorporates appropriate humor, warmth, or formality based on topic and level
- Avoids "textbook language" that feels artificial or overly simplified
- Creates genuine interest through vivid, specific language
- Uses varied sentence structures appropriate for the level
- Maintains an authentic voice while remaining level-appropriate

Avoid these common stylistic issues:
- Generic, predictable phrasing that feels template-based
- Overly formal academic tone when inappropriate for the topic
- Overly simple language that doesn't challenge students appropriately
- Inconsistent voice across different sections
- Repetitive sentence structures or vocabulary
- Awkward phrasing that doesn't reflect how native speakers express ideas

Instead, create content with:
- Natural flow and cohesion between ideas
- Appropriate contextual examples that feel relevant and contemporary
- Language that demonstrates personality and engagement with the topic
- A balance of concrete and abstract concepts appropriate to the level
- Stylistic choices that would engage adult learners intellectually

QUESTION QUALITY IMPROVEMENT APPROACH:
First, analyze what constitutes high-quality questions for ${params.cefrLevel} level:
- Research question taxonomies (Bloom's, DOK) appropriate for this level
- Identify question types that stimulate meaningful language production
- Determine markers of high-quality vs. low-quality questions
- Study question formulation techniques used by expert language teachers

For discussion questions, ensure each question:
- Has clear purpose and language learning objectives
- Elicits more than one-word or yes/no responses
- Connects to students' experiences while remaining culturally inclusive
- Builds on vocabulary/concepts from the lesson
- Avoids vague, obvious, or simplistic formulations ("What did it look like?")
- Encourages critical thinking appropriate to the level
- Is genuinely interesting to discuss

For comprehension questions, ensure each question:
- Tests specific comprehension skills appropriate for ${params.cefrLevel}
- Requires genuine understanding rather than just recognizing words
- Progresses from literal to interpretive to applied understanding
- Focuses on meaningful content rather than trivial details
- Uses question stems appropriate for the cognitive level
- Avoids ambiguity or multiple possible correct answers

Apply these quality standards to generate questions that:
- Engage students intellectually at their appropriate level
- Provide meaningful language practice opportunities
- Demonstrate careful thought and authentic curiosity
- Serve clear pedagogical purposes
- Would be asked by experienced language educators

STEP 2: CREATE LESSON COMPONENTS
After writing the reading text, create:
- CRITICAL REQUIREMENT: You MUST include EXACTLY 5 vocabulary items from your text. The system requires a minimum of 5 vocabulary items and will REJECT the lesson if fewer are provided.
- ABSOLUTELY CRITICAL: Each semantic group MUST contain at least 2-3 vocabulary words. DO NOT create groups with only one word.
- DO NOT include basic words like "hi", "hello", "goodbye", or other extremely common words as vocabulary items.
- Only choose words that are appropriate for the CEFR level ${params.cefrLevel} and would be genuinely useful for students to learn.
- EXTREMELY IMPORTANT: Choose ONLY English words for vocabulary. DO NOT include foreign words (like "la bise," "sayonara," "wai," etc.) even if they appear in your text when discussing other cultures. ONLY ENGLISH VOCABULARY should be selected.
- EXACTLY 3-5 reading comprehension activities - YOU MUST INCLUDE AT LEAST 3
- 1-2 pre-reading discussion questions
- EXACTLY 5-7 post-reading discussion questions - YOU MUST INCLUDE AT LEAST 5, and each question MUST directly reference specific content from your reading text
- A brief warm-up activity that MUST incorporate all vocabulary items from your vocabulary list, not just one word
- NEW REQUIREMENT: 1-2 sentence frames and templates appropriate for the ${params.cefrLevel} level to help students with sentence structure and grammar, following the DETAILED STRUCTURE BELOW.

STEP 6: SENTENCE FRAMES PATTERN SELECTION APPROACH

COMMUNICATIVE NEED ANALYSIS FOR ${params.cefrLevel} STUDENTS:

Before selecting sentence patterns, analyze what communication needs ${params.cefrLevel} students actually have:

REAL-WORLD COMMUNICATION NEEDS BY LEVEL:
A1 STUDENTS: Need patterns for immediate, concrete communication
- Expressing basic preferences: "I like ___ because ___"
- Simple descriptions: "___ is ___" 
- Basic needs: "I want/need ___"
- Present actions: "I am ___ing"

A2 STUDENTS: Need patterns for personal experiences and simple social interaction
- Past experiences: "Yesterday I ___ and it was ___"
- Future plans: "I'm going to ___ because ___"
- Simple comparisons: "___ is more ___ than ___"
- Basic opinions: "I think ___ is ___"

B1 STUDENTS: Need patterns for social topics and reasoned communication
- Expressing opinions with reasons: "I believe ___ because ___"
- Problem-solution: "The problem is ___, so we should ___"
- Advantages/disadvantages: "On one hand ___, but on the other hand ___"
- Making suggestions: "We could ___ in order to ___"

B2 STUDENTS: Need patterns for analytical and evaluative communication
- Complex reasoning: "Although ___, ___ nevertheless ___"
- Cause and effect: "___ has led to ___, which in turn ___"
- Evaluation: "While ___ has advantages, it also ___"
- Hypotheticals: "If ___ were to happen, then ___"

C1/C2 STUDENTS: Need patterns for sophisticated analysis and professional communication
- Nuanced arguments: "Despite the fact that ___, it could be argued that ___"
- Academic discourse: "Research suggests that ___, indicating that ___"
- Complex conditionals: "Had ___ not occurred, ___ would likely have ___"

PATTERN COMPLEXITY VALIDATION:

Before finalizing patterns, verify each meets these requirements:

COMPLEXITY CHECK FOR ${params.cefrLevel} LEVEL:
✓ GRAMMAR APPROPRIATENESS: Does this pattern use grammar structures students know?
✓ VOCABULARY ACCESSIBILITY: Can students fill in the blanks with vocabulary at their level?
✓ COGNITIVE MATCH: Does this pattern require thinking skills appropriate for this level?
✓ USAGE FREQUENCY: Will students actually use this pattern in real communication?
✓ TOPIC RELEVANCE: Does this pattern specifically help students discuss "${params.topic}"?

AUTOMATIC REJECTION CRITERIA - REJECT PATTERNS THAT:
❌ Use grammar structures above the students' current level
❌ Require vocabulary students don't know to complete meaningfully  
❌ Are too abstract for students to relate to their experiences
❌ Are rarely used in authentic communication at this level
❌ Don't specifically support discussion of "${params.topic}"
❌ Are generic and could apply to any topic without topic-specific value

TOPIC-SPECIFIC PATTERN SELECTION FOR "${params.topic}":

Analyze how students at ${params.cefrLevel} level specifically need to talk about "${params.topic}":

TOPIC COMMUNICATION ANALYSIS:
1. What specific ideas about "${params.topic}" do ${params.cefrLevel} students need to express?
2. What types of conversations about this topic will they have in real life?
3. What language functions are most important for discussing this topic?
4. How does this topic connect to their personal experiences and interests?

PATTERN SELECTION STRATEGY:
- Choose patterns that enable students to express authentic ideas about "${params.topic}"
- Focus on high-frequency communication functions related to this topic
- Ensure patterns can be used productively in conversations about this topic
- Select patterns that connect the topic to students' experiences and opinions

**Goal:** Develop topic-specific, communicatively valuable sentence patterns that support authentic expression about "${params.topic}" at the ${params.cefrLevel} level.

CRITICAL ISSUES TO AVOID:
1.  Do NOT choose obscure, rarely used sentence patterns (unless C1/C2 level justifies it).
2.  Ensure the structureComponents accurately break down the patternTemplate.
3.  Ensure the examples within structureComponents correctly fit their corresponding component slot.
4.  Ensure the final completeSentence in the main examples array correctly uses the pattern and the provided breakdown accurately maps labels to the text segments.
5.  Ensure the label fields in visualStructure.parts and examples.breakdown **EXACTLY MATCH** the label fields defined in structureComponents.
6.  Keep explanations concise for the target CEFR level.
7.  AVOID phrase duplication between static parts of the pattern and component examples.
8.  Generate 3-4 diverse examples (complete sentences with breakdowns) per pattern.
9.  Generate 3-5 useful teachingNotes per pattern.
10. Generate 3-4 relevant discussionPrompts per pattern.

IMPLEMENTATION REQUIREMENT: Provide 1-2 complete frame objects per lesson, each following the detailed JSON structure specified below.

For teacher instructions:
1. Focus on practical classroom activities related to the specific topic
2. Suggest conversation prompts that use the frame and topic vocabulary
3. Provide ideas that will work in screen-sharing scenarios where students interact verbally
4. Keep instructions concise and action-oriented

VOCABULARY SELECTION APPROACH:
First, analyze what vocabulary is appropriate for ${params.cefrLevel} level:
- Research the vocabulary range typical for ${params.cefrLevel} level students
- Consider both receptive and productive vocabulary expectations
- Determine which semantic fields are appropriate at this level
- Identify vocabulary selection criteria specific to this level (frequency, complexity, abstractness)

Based on your analysis, establish guidelines for:
- Appropriate vocabulary difficulty/complexity 
- How to define words at this level (simple definitions for A1/A2, more nuanced for B2+)
- Appropriate example sentence complexity
- Word family relationships appropriate to introduce
- Collocation complexity appropriate for this level

STEP 1: VOCABULARY LEVEL ANALYSIS (REQUIRED BEFORE SELECTION)

Before selecting vocabulary, analyze what ${params.cefrLevel} students typically know and should learn next:

FOUNDATION KNOWLEDGE ANALYSIS FOR ${params.cefrLevel} STUDENTS:
- A1 students know: basic family, food, colors, numbers, simple present tense, essential survival vocabulary
- A2 students know: A1 + basic past tense, common adjectives, simple descriptions, personal experiences
- B1 students know: A1/A2 + present perfect, opinions, comparisons, everyday topics, functional language
- B2 students know: A1/A2/B1 + academic thinking, complex discussions, abstract concepts, discourse markers
- C1 students know: A1-B2 + advanced academic language, nuanced expression, specialized vocabulary
- C2 students know: Near-native vocabulary range including idiomatic and specialized language

APPROPRIATE NEW VOCABULARY FOR ${params.cefrLevel} LEVEL:
- A1: Concrete, immediate needs (house, clothes, body parts, basic actions)
- A2: Personal experiences and descriptions (interesting, boring, excited, yesterday, tomorrow)
- B1: Social topics and functional language (community, environment, although, however, opinion)
- B2: Academic and analytical language (sustainability, efficiency, infrastructure, furthermore)
- C1: Sophisticated concepts (implications, comprehensive, predominantly, nevertheless)
- C2: Advanced/specialized terminology (nuanced, paradigm, intrinsic, contemporary discourse)

TOO ADVANCED FOR ${params.cefrLevel} LEVEL:
- For A1: Abstract concepts, complex grammar constructions, specialized terms, academic language
- For A2: Academic vocabulary, complex discourse markers, abstract philosophical concepts
- For B1: Highly academic vocabulary, complex phrasal verbs, advanced idiomatic expressions
- For B2: Specialized technical terms, advanced literary language, highly formal register
- For C1: Archaic or highly specialized jargon, extremely formal academic discourse

STEP 2: TOPIC-APPROPRIATE VOCABULARY SELECTION FOR "${params.topic}"

Analyze the topic "${params.topic}" specifically for ${params.cefrLevel} level:

TOPIC ANALYSIS QUESTIONS:
1. What aspects of "${params.topic}" are cognitively appropriate for ${params.cefrLevel} students?
2. What vocabulary domains within this topic match their developmental level?
3. What real-world communication needs do they have for this topic?
4. How does this topic connect to their life experiences and interests?

VOCABULARY SELECTION STRATEGY BY LEVEL:
A1/A2 LEVELS: Choose vocabulary for:
- Concrete, observable aspects of the topic that students can see/touch/experience
- Personal experiences and basic descriptions related to the topic
- Essential functional language for basic communication about the topic
- Example: For "transportation" → car, bus, train, ticket, station, fast, slow

B1 LEVEL: Choose vocabulary for:
- Social and practical aspects of the topic that affect daily life
- Problem-solving and opinion-expressing related to the topic
- Connecting ideas and experiences about the topic
- Example: For "transportation" → commute, public transport, traffic jam, convenient, reliable

B2 LEVEL: Choose vocabulary for:
- Analytical and evaluative aspects that require critical thinking
- Abstract concepts and complex relationships within the topic
- Academic discussion and debate capabilities
- Example: For "transportation" → infrastructure, sustainability, urban planning, efficiency

C1/C2 LEVELS: Choose vocabulary for:
- Sophisticated analysis and nuanced discussion of the topic
- Professional and academic contexts related to the topic
- Complex interdisciplinary connections and implications
- Example: For "transportation" → multimodal integration, carbon footprint mitigation, transit-oriented development

STEP 3: PREREQUISITE VOCABULARY VALIDATION

Before finalizing vocabulary selection, verify each word meets these requirements:

PREREQUISITE CHECK FOR EACH SELECTED WORD:
1. FOUNDATION VERIFICATION: "What simpler words must students know to understand this word?"
   - If selecting "comfortable," do they know "feeling," "good," "bad," "when"?
   - If selecting "sustainability," do they know "environment," "future," "protect," "use"?
   - If selecting "infrastructure," do they know "build," "roads," "system," "public"?

2. COGNITIVE APPROPRIATENESS: "Is this word genuinely useful at ${params.cefrLevel} level?"
   - Will students actually encounter this word in real communication at their level?
   - Does it match their cognitive and linguistic development stage?
   - Can they use this word productively in their own communication?

3. COMMUNICATION RELEVANCE: "Does this word serve real communicative purposes?"
   - Does it help students express ideas they actually need to express?
   - Is it part of high-frequency, useful language patterns?
   - Will it appear in authentic materials they encounter?

AUTOMATIC REJECTION CRITERIA - REJECT WORDS THAT:
❌ Require unknown prerequisite vocabulary for comprehension
❌ Are too abstract/complex for the cognitive level (e.g., "paradigm" for A2 students)
❌ Cannot be defined using significantly simpler language
❌ Are rarely used in real communication at this level
❌ Serve only academic/specialized purposes inappropriate for the level
❌ Are taught better at a different CEFR level

STEP 4: SEMANTIC COHERENCE AND GROUPING

Select vocabulary that works together meaningfully:

SEMANTIC COHERENCE REQUIREMENTS:
1. Choose words that form logical, functional groups within the topic
2. Ensure words can be used together in meaningful communication
3. Create vocabulary sets that enable comprehensive topic discussion
4. Consider word relationships (synonyms, antonyms, word families)

FUNCTIONAL GROUPING EXAMPLES:
A1 Transportation: [car, bus, walk] + [fast, slow] + [go, stop, wait]
→ Enables: "I go by bus. The bus is slow. I wait for the bus."

B1 Transportation: [commute, public transport, traffic] + [convenient, reliable, crowded] + [however, although, because]
→ Enables: "I commute by public transport. However, it's often crowded because many people use it."

B2 Transportation: [infrastructure, sustainability, urban planning] + [efficient, environmentally-friendly, cost-effective] + [furthermore, consequently, therefore]
→ Enables: "Urban planning affects transportation infrastructure. Consequently, cities need sustainable and cost-effective solutions."

COHERENCE VALIDATION:
✓ Can students combine these words to discuss the topic meaningfully?
✓ Do the words represent different aspects/dimensions of the topic?
✓ Are there enough words to enable substantial communication about the topic?
✓ Do the words progress logically from concrete to abstract (appropriate for level)?

STEP 5: FINAL VOCABULARY VALIDATION CHECKLIST

Before submitting your vocabulary selection, verify EVERY word meets ALL criteria:

MANDATORY QUALITY CONTROL CHECKLIST:
✓ LEVEL APPROPRIATENESS: Is each word genuinely appropriate for ${params.cefrLevel} students?
✓ USEFULNESS VERIFICATION: Will students actually need these words in real communication?
✓ COHERENCE CONFIRMATION: Do the words work together to enable meaningful topic discussion?
✓ DEFINITION FEASIBILITY: Can each word be defined using vocabulary simpler than the target word?
✓ PREREQUISITE VALIDATION: Do students have the foundation vocabulary to understand these words?
✓ COGNITIVE MATCH: Does each word match the cognitive development level of ${params.cefrLevel} students?
✓ COMMUNICATION VALUE: Does each word serve authentic communicative purposes at this level?
✓ TOPIC RELEVANCE: Is each word directly relevant and useful for discussing "${params.topic}"?

REPLACEMENT PROTOCOL:
If ANY word fails the above checks, IMMEDIATELY replace it with a more appropriate alternative that:
- Meets all validation criteria
- Serves the same communicative function
- Fits better with the other selected vocabulary
- Enables students to discuss the topic effectively at their level

FINAL CONFIRMATION:
Your selected vocabulary should enable ${params.cefrLevel} students to engage in meaningful, authentic communication about "${params.topic}" using language appropriate to their developmental stage.

SEMANTIC MAP GENERATION APPROACH:
CRITICAL: For each vocabulary word, you MUST generate a complete semantic map with REAL words, not placeholders. This is essential for the interactive semantic maps feature.

For each vocabulary word, create semanticMap with these 5 categories:

1. **synonyms**: 3-5 words with similar meanings
   - Choose words at appropriate CEFR level (simpler for A1/A2, more sophisticated for C1/C2)
   - Include both exact synonyms and near-synonyms
   - Example: For "happy" → ["joyful", "pleased", "content", "cheerful"]

2. **antonyms**: 2-4 words with opposite meanings
   - Include direct antonyms and contrasting concepts
   - Choose level-appropriate vocabulary
   - Example: For "happy" → ["sad", "upset", "disappointed"]

3. **relatedConcepts**: 3-5 concepts/ideas connected to the word
   - Include broader themes, categories, or associated ideas
   - Think about semantic fields and conceptual connections
   - Example: For "innovation" → ["technology", "progress", "creativity", "development"]

4. **contexts**: 3-4 situations or environments where the word is commonly used
   - Focus on real-world contexts where students might encounter the word
   - Include both formal and informal contexts when appropriate
   - Example: For "negotiate" → ["business meetings", "buying/selling", "conflict resolution"]

5. **associatedWords**: 3-5 words commonly used together with the target word
   - Include common collocations and frequently co-occurring words
   - Think about words that naturally appear in the same sentences or contexts
   - Example: For "environment" → ["protect", "sustainable", "pollution", "conservation"]

SEMANTIC MAP QUALITY REQUIREMENTS:
- NEVER use placeholder text like "synonym1", "word1", "concept1"
- All words must be real English words appropriate for the CEFR level
- Choose words that genuinely relate to the target vocabulary word
- Ensure semantic relationships are accurate and meaningful
- Consider the lesson topic "${params.topic}" when selecting related words
- Vary the vocabulary complexity based on ${params.cefrLevel} level

LEVEL-SPECIFIC SEMANTIC MAP GUIDELINES:
- A1/A2: Use basic, high-frequency words in semantic maps
- B1/B2: Include more sophisticated vocabulary and abstract concepts
- C1/C2: Use advanced vocabulary and nuanced semantic relationships

🚨 CRITICAL VOCABULARY DEFINITION REQUIREMENTS 🚨

**FUNDAMENTAL PEDAGOGICAL RULE**: Students CANNOT learn a new word if its definition contains vocabulary they don't understand!

**DEFINITION LANGUAGE MUST BE SIMPLER THAN THE TARGET WORD**

**CLEAR EXAMPLES BY LEVEL:**

**A1 DEFINITIONS** (Use ONLY 500-800 most basic words):
❌ WRONG: "Beautiful" = "aesthetically pleasing and visually attractive"
✅ CORRECT: "Beautiful" = "very nice to look at"
❌ WRONG: "Vehicle" = "a mechanical conveyance for transportation" 
✅ CORRECT: "Vehicle" = "a car, bus, or truck"

**A2 DEFINITIONS** (Use ONLY 1000-1500 basic words):
❌ WRONG: "Environment" = "the aggregate of surrounding phenomena and conditions"
✅ CORRECT: "Environment" = "the natural world around us with air, water, plants and animals"
❌ WRONG: "Economy" = "the interrelated system of production and distribution"
✅ CORRECT: "Economy" = "the way a country makes and spends money"

**B1 DEFINITIONS** (Use ONLY 2500 intermediate words):
❌ WRONG: "Innovation" = "implementation of novel methodologies and paradigms"
✅ CORRECT: "Innovation" = "creating new ideas or ways of doing things"
❌ WRONG: "Sustainability" = "maintaining ecological equilibrium through resource utilization"
✅ CORRECT: "Sustainability" = "using natural resources without harming the environment for the future"

**B2 DEFINITIONS** (Maximum 3500 words):
❌ WRONG: "Entrepreneur" = "an individual who conceptualizes and establishes commercial enterprises"
✅ CORRECT: "Entrepreneur" = "a person who starts and runs their own business, often taking financial risks"

**SENTENCE STRUCTURE LIMITS:**
- A1: Maximum 8 words, present tense only, no complex grammar
- A2: Maximum 12 words, simple past/future allowed, basic conjunctions only  
- B1: Maximum 15 words, present perfect/conditionals allowed
- B2: Maximum 20 words, all tenses and modals allowed

CEFR LEVEL-APPROPRIATE DEFINITIONS GUIDELINES:
- A1: Use only the most basic and frequent vocabulary (500-800 words). Very simple sentence structures. Definitions should be 1-5 words where possible.
- A2: Use basic vocabulary (about 1000-1500 words). Simple sentences. Avoid complex structures or uncommon words.
- B1: Use intermediate vocabulary (about 2500 words). Moderately complex sentences allowed, but prioritize clarity.
- B2: Upper-intermediate vocabulary (about 3500 words). More complex sentences and some academic words allowed.
- C1: Advanced vocabulary (about 5000+ words). Complex sentences and academic/specialized terms acceptable.
- C2: Proficient vocabulary with nuanced explanations. Full range of language structures. Can include specialized terminology.

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0

I will count the total number of vocabulary items. If you don't include EXACTLY 5 complete vocabulary items, your response will be rejected.

CEFR LEVEL ALIGNMENT:
Ensure all content is appropriate for ${params.cefrLevel} level students:
- CRITICAL: Use vocabulary appropriate for ${params.cefrLevel} level in ALL questions and instructions
- For post-reading discussion questions, ensure the language complexity matches ${params.cefrLevel} level
- Adjust question complexity based on the CEFR level (simpler for A1/A2, more complex for C1/C2)

WARM-UP ACTIVITIES APPROACH:
First, analyze effective warm-up approaches for ${params.cefrLevel} level:
- Research developmentally appropriate activation strategies for this level
- Identify how vocabulary is best introduced at ${params.cefrLevel} level
- Determine the optimal balance between familiar and new content
- Consider appropriate complexity of instructions and activities
- Analyze how prior knowledge is best activated at this level

Based on your analysis, design a warm-up activity that:
- Is appropriate for ${params.cefrLevel} cognitive and linguistic abilities
- Introduces key vocabulary in a contextually appropriate manner
- Builds confidence through accessible starting points
- Creates engagement through relevant, interesting content
- Provides appropriate scaffolding for the upcoming reading text
- Promotes active participation with level-appropriate challenge

CRITICAL: WARM-UP REQUIREMENTS 
- All warm-up questions MUST be DIRECTLY RELATED to the lesson topic "${params.topic}"
- Each question MUST include clear context so it can be understood without reading the lesson text
- Questions MUST NOT be generic or applicable to any topic - they must be specifically about ${params.topic}
- AVOID questions like "What do you think about X?" without providing context about X
- DO NOT create questions about using "force" or other generic concepts unless they are directly related to ${params.topic}
- Each question should be self-contained with enough context to be answered without external information

CULTURAL ADAPTABILITY APPROACH:
First, analyze cultural learning considerations for ${params.cefrLevel} level:
- Research how cultural awareness is developed at different language proficiency levels
- Identify appropriate cultural content complexity for ${params.cefrLevel} level
- Determine how to present culturally diverse perspectives at this level
- Consider potential cultural sensitivities related to the lesson topic "${params.topic}"
- Analyze how to balance cultural specificity with universal accessibility

Based on your analysis, ensure your lesson content:
- Presents cultural information at an appropriate complexity level
- Provides necessary cultural context for ${params.cefrLevel} learners
- Offers multiple cultural perspectives when relevant
- Avoids culturally inappropriate content for global classroom use
- Creates authentic but accessible cultural learning opportunities
- Respects diverse backgrounds while expanding cultural awareness

VISUAL CONNECTIONS:
Create guidance for connecting vocabulary to visual elements:
- Describe everyday situations where vocabulary naturally appears
- Compare familiar concepts with new vocabulary
- Connect vocabulary to images that relate to students' experiences

STEP 4: DISCUSSION QUESTIONS DEVELOPMENT APPROACH

COGNITIVE READINESS ANALYSIS FOR ${params.cefrLevel} STUDENTS:

Before creating discussion questions, analyze what ${params.cefrLevel} students can cognitively and linguistically handle:

COGNITIVE ABILITIES BY LEVEL:
A1 STUDENTS: Can discuss immediate, personal experiences and basic preferences
- Personal likes/dislikes, family, daily routines, immediate environment
- Simple yes/no responses with basic explanations
- Concrete situations they have direct experience with

A2 STUDENTS: Can discuss personal experiences and make simple comparisons
- Past experiences, future plans, simple opinions about familiar topics
- Basic problem-solving in everyday situations
- Simple cultural comparisons and personal preferences

B1 STUDENTS: Can express opinions with reasons and engage with social topics
- Practical problems, lifestyle choices, community issues
- Can give opinions and support them with basic reasoning
- Can discuss advantages/disadvantages of different approaches

B2 STUDENTS: Can engage in analytical discussions about complex topics
- Abstract concepts related to their experiences
- Multiple perspectives on contemporary issues
- Can evaluate different viewpoints and present arguments

C1 STUDENTS: Can engage in sophisticated analysis and nuanced discussion
- Complex social, academic, or professional issues
- Can synthesize information and present well-structured arguments
- Can handle hypothetical and speculative discussions

C2 STUDENTS: Can engage in expert-level discussions with subtle distinctions
- Highly sophisticated concepts requiring advanced critical thinking
- Can handle nuanced argumentation and complex interdisciplinary topics

LINGUISTIC SCAFFOLDING REQUIREMENTS BY LEVEL:

A1/A2 SCAFFOLDING NEEDS:
- Provide concrete context and examples in questions
- Use familiar vocabulary and simple sentence structures in questions
- Offer sentence starters or model responses
- Focus on personal experiences students can easily access

B1 SCAFFOLDING NEEDS:
- Provide some context but allow for independent thinking
- Use question stems that guide logical thinking
- Include opinion-asking with reason-giving opportunities
- Connect to both personal and broader social experiences

B2+ SCAFFOLDING NEEDS:
- Minimal scaffolding, focus on analytical thinking
- Open-ended questions that require evaluation and synthesis
- Multiple perspectives and complex reasoning opportunities

DISCUSSION QUESTION VALIDATION CHECKLIST:

Before finalizing questions, verify each meets these criteria:

✓ COGNITIVE MATCH: Does this question match the thinking abilities of ${params.cefrLevel} students?
✓ LINGUISTIC ACCESSIBILITY: Can students understand the question using their current language level?
✓ SCAFFOLDING APPROPRIATENESS: Is the right amount of support provided for this level?
✓ PERSONAL RELEVANCE: Can students connect this to their own experiences or interests?
✓ DISCUSSION POTENTIAL: Will this generate meaningful conversation between students?
✓ SPEAKING PRACTICE VALUE: Does this question encourage extended speaking appropriate to the level?
✓ TOPIC CONNECTION: Does this clearly relate to the lesson content and vocabulary?

AUTOMATIC REJECTION CRITERIA - REJECT QUESTIONS THAT:
❌ Require language skills above the students' level to answer meaningfully
❌ Are too abstract for students to relate to their experiences
❌ Can be answered with simple yes/no without encouraging elaboration
❌ Assume cultural knowledge students may not have
❌ Are too complex cognitively for the developmental stage
❌ Don't provide enough context for students to engage meaningfully
❌ Are generic and could apply to any topic (not specifically about "${params.topic}")

⚠️ CRITICAL REQUIREMENT: You MUST provide EXACTLY 5 paragraph-question pairs. Failure to provide 5 pairs, each with a paragraph and a question, will cause your response to be rejected.

- Avoid generic questions - make them specific to the content and culturally relevant
- Adjust topic complexity appropriately for the target CEFR level
- Structure topics to build genuine discussion in a one-on-one context
- For each discussion question, include an image prompt (NEW!) - A detailed description (2-3 sentences) of what an image for this discussion topic should look like.

!!! EXTREMELY IMPORTANT - READING COMPREHENSION FORMAT !!!
You MUST ONLY create reading comprehension questions in these two formats:
1. Multiple-choice questions with 3-4 options and one correct answer
2. True-false questions with exactly ["True", "False"] options

CRITICAL: You MUST mark the correct answer in the "correctAnswer" field for each question, not just in the "answer" field.
For example: {"question": "What is the capital of France?", "options": ["London", "Paris", "Berlin"], "answer": "Paris", "correctAnswer": "Paris", "explanation": "Paris is the capital city of France."}

DO NOT create any short-answer questions or questions that ask students to "explain" or "write."
ALL questions must have selectable options. This includes ALL questions in the reading comprehension section, especially the third question.

This is a screen-sharing environment where students CANNOT type responses. They can ONLY select from options you provide.

!!! READING COMPREHENSION COGNITIVE LEVELS REQUIREMENT !!!
Your reading comprehension questions MUST cover a balanced range of cognitive abilities:
1. REMEMBER/UNDERSTAND (1-2 questions): Test basic comprehension and recall of explicit information from the text.
   - Example for A1-A2: "What is the main character's name?"
   - Example for B1-B2: "What happened after the main event in the story?"
   - Example for C1-C2: "Which statement accurately summarizes the author's position?"

2. APPLY/ANALYZE (1-2 questions): Test ability to use information or break it into parts to explore relationships.
   - Example for A1-A2: "Why did the character make that choice?"
   - Example for B1-B2: "How does the second paragraph relate to the main idea?"
   - Example for C1-C2: "What evidence supports the author's argument about X?"

3. EVALUATE/CREATE (1-2 questions): Test ability to make judgments or create new perspectives.
   - Example for A1-A2: "Which title is best for this story?"
   - Example for B1-B2: "What would most likely happen next in this situation?"
   - Example for C1-C2: "How effective is the author's approach to presenting this topic?"

IMPORTANT: Adjust question complexity based on the CEFR level (${params.cefrLevel}):
- A1-A2: Simple vocabulary, direct questions about explicitly stated information

READING COMPREHENSION APPROACH:
First, analyze appropriate comprehension skills for ${params.cefrLevel} level:
- Research reading comprehension expectations at ${params.cefrLevel} level
- Identify appropriate question types for this level (literal, inferential, evaluative)
- Determine text-dependent question strategies suited to this level
- Consider appropriate cognitive challenges that remain accessible

Then, based on your analysis:
- Create 3-5 comprehension questions that:
  a) Assess understanding at appropriate depths for ${params.cefrLevel}
  b) Use question formats appropriate for this level
  c) Progress from more straightforward to more challenging
  d) Require different reading skills (locating information, making connections, drawing conclusions)
  e) Provide appropriate scaffolding for students at this level

SCAFFOLDING REQUIREMENTS FOR LOWER LEVELS:
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' 
  ? `Since this is a ${params.cefrLevel} level lesson, you MUST include enhanced scaffolding for lower-level learners. For each sentence frame, add a "lowerLevelScaffolding" object with:
1. "sentenceWorkshop": Progressive building activities from word → phrase → sentence
2. "patternTrainer": Interactive word banks with categorized vocabulary for building sentences
3. "visualMaps": Color-coded structure maps showing sentence components

This scaffolding is CRITICAL for A1-B1 learners and must be included.`
  : `Since this is a ${params.cefrLevel} level lesson, do NOT include "lowerLevelScaffolding" in the sentence frames. Advanced learners do not need this additional scaffolding.`}

STEP 5: CROSS-COMPONENT INTEGRATION VALIDATION

CRITICAL: Before finalizing your lesson, you MUST perform explicit cross-component integration analysis to ensure vocabulary, reading text, and discussion questions work together synergistically.

VOCABULARY-TEXT INTEGRATION ANALYSIS:
Analyze how target vocabulary integrates with the reading text:

✓ NATURAL INTEGRATION CHECK: Does each target vocabulary word appear naturally in the reading text (not forced or artificially inserted)?
✓ CONTEXTUAL SUPPORT: Does the text provide sufficient context clues to help students understand the vocabulary in meaningful situations?
✓ USAGE VARIETY: Are vocabulary words used in different contexts within the text to show versatility?
✓ PREREQUISITE VOCABULARY: Does the text include necessary supporting vocabulary to make target words comprehensible?
✓ TOPIC COHERENCE: Do all vocabulary choices genuinely support and enhance the topic "${params.topic}"?

TEXT-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions connect to the reading text:

✓ CONTENT DEPENDENCY: Do discussion questions require genuine understanding of the text content to answer effectively?
✓ TOPIC EXTENSION: Do questions naturally extend text topics into meaningful personal or analytical discussions?
✓ COMPREHENSION FOUNDATION: Are questions built on information and ideas presented in the text?
✓ COGNITIVE PROGRESSION: Do questions appropriately build on text complexity for ${params.cefrLevel} level thinking?
✓ ENGAGEMENT BRIDGE: Do questions create natural bridges from text content to student experiences and opinions?

VOCABULARY-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions incorporate target vocabulary:

✓ VOCABULARY USAGE OPPORTUNITIES: Do discussion questions provide natural opportunities for students to USE target vocabulary in their responses?
✓ CONTEXTUAL REINFORCEMENT: Do questions require students to demonstrate understanding of vocabulary in new contexts?
✓ SPEAKING PRACTICE: Would students naturally incorporate target vocabulary when answering these questions?
✓ SCAFFOLDED APPLICATION: Do questions appropriately scaffold vocabulary usage for ${params.cefrLevel} level students?
✓ MEANINGFUL COMMUNICATION: Do vocabulary usage opportunities feel authentic rather than mechanical?

SYNERGISTIC LEARNING FLOW ANALYSIS:
Analyze the overall learning experience across all components:

✓ CONTENT COHERENCE: Do all components (vocabulary, text, discussion) support the same learning objectives for "${params.topic}"?
✓ DIFFICULTY ALIGNMENT: Are all components appropriately leveled for ${params.cefrLevel} students?
✓ REINFORCEMENT PATTERNS: Do components reinforce each other's content naturally?
✓ PEDAGOGICAL SEQUENCE: Do components create an effective learning progression (vocabulary → text → discussion)?
✓ AUTHENTIC CONNECTIONS: Do component relationships feel natural rather than artificially constructed?

INTEGRATION QUALITY VALIDATION:
Before proceeding, confirm your lesson achieves:
- Target vocabulary appears meaningfully in text AND discussion contexts
- Discussion questions genuinely require text comprehension to answer
- Students will naturally use vocabulary when responding to discussion questions
- All components work together to create a cohesive learning experience about "${params.topic}"
- The learning flow from vocabulary → text → discussion feels natural and educationally sound

REJECTION CRITERIA - REJECT LESSONS WHERE:
❌ Vocabulary appears forced or artificially inserted into text
❌ Discussion questions could be answered without reading the text
❌ Students could answer discussion questions without using target vocabulary
❌ Components feel disconnected or only superficially related
❌ The lesson lacks a coherent learning progression

FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders.

{
  "title": "Descriptive lesson title about ${params.topic}",
  "level": "${params.cefrLevel}",
  "focus": "${params.focus}",
  "estimatedTime": ${params.lessonLength},
  "sections": [
    // WARMUP SECTION (Complete)
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Complete description of the warm-up...",
      "questions": ["Complete Question 1?", "Complete Question 2?", "Complete Question 3?", "Complete Question 4?", "Complete Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Complete step-by-step instructions...",
      "teacherNotes": "Complete teacher notes..."
    },
    // READING SECTION (Complete)
    {
      "type": "reading",
      "title": "Reading Text: [Actual Title]",
      "introduction": "Complete introduction...",
      "paragraphs": [
        "Complete paragraph 1 text...",
        "Complete paragraph 2 text...",
        "Complete paragraph 3 text...",
        "Complete paragraph 4 text...",
        "Complete paragraph 5 text..."
      ],
      "teacherNotes": "Complete teacher notes..."
    },
    // VOCABULARY SECTION (Complete - 5 words)
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "word1", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word2", "partOfSpeech": "verb", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word3", "partOfSpeech": "adj", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word4", "partOfSpeech": "adv", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word5", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        }
      ]
    },
    // COMPREHENSION SECTION (Complete - 5 questions)
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        {"question": "Complete Question 1?", "options": ["A", "B"], "answer": "A", "correctAnswer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Question 2?", "options": ["A", "B", "C"], "answer": "C", "correctAnswer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Question 3?", "options": ["A", "B", "C", "D"], "answer": "D", "correctAnswer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Question 4?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Question 5?", "options": ["True", "False"], "answer": "False", "correctAnswer": "False", "explanation": "Complete explanation..."}
      ]
    },
    // SENTENCE FRAMES SECTION - GENERATE CUSTOM CONTENT FOR THE TOPIC "${params.topic}"
    // CRITICAL: Replace ALL placeholder text with REAL content about ${params.topic}. Generate actual examples, patterns, and teaching notes.
    {
      "type": "sentenceFrames",
      "title": "REPLACE WITH: engaging title about ${params.topic}",
      "introduction": "REPLACE WITH: how these patterns help students discuss ${params.topic}",
      "frames": [
        {
          "patternTemplate": "REPLACE WITH: sentence pattern using _____ blanks for ${params.topic}",
          "languageFunction": "REPLACE WITH: communication purpose for ${params.topic}",
          "title": "REPLACE WITH: clear pattern title for ${params.topic}",
          "level": "intermediate",
          "grammarFocus": [
            "REPLACE WITH: grammar points students will practice",
            "REPLACE WITH: additional grammar features",
            "REPLACE WITH: language structures to highlight"
          ],
          "structureComponents": [
            {
              "label": "REPLACE WITH: component name for ${params.topic}",
              "description": "REPLACE WITH: what this component does in the sentence",
              "examples": ["REPLACE", "WITH", "ACTUAL", "WORDS", "FOR", "TOPIC"],
              "inSentenceExample": "REPLACE WITH: how this component fits in the sentence pattern"
            },
            {
              "label": "REPLACE WITH: second component name for ${params.topic}",
              "description": "REPLACE WITH: what this second component does",
              "examples": ["REPLACE", "WITH", "ACTUAL", "WORDS", "FOR", "TOPIC"],
              "inSentenceExample": "REPLACE WITH: how this second component fits"
            }
          ],
          "visualStructure": {
            "start": "It is",
            "parts": [
              { "label": "Evaluative Adjective" },
              { "label": "Infinitive Action", "connector": "to" },
              { "label": "Reason Clause", "connector": "because" }
            ],
            "end": "."
          },
          "examples": [
            {
              "completeSentence": "REPLACE WITH: example sentence 1 about ${params.topic} using your pattern",
              "breakdown": {
                "Component1": "REPLACE WITH: actual word from your example sentence",
                "Component2": "REPLACE WITH: actual phrase from your example sentence"
              }
            },
            {
              "completeSentence": "REPLACE WITH: example sentence 2 about ${params.topic} using your pattern",
              "breakdown": {
                "Component1": "REPLACE WITH: actual word from this second sentence", 
                "Component2": "REPLACE WITH: actual phrase from this second sentence"
              }
            },
            {
              "completeSentence": "REPLACE WITH: example sentence 3 about ${params.topic} using your pattern",
              "breakdown": {
                "Component1": "REPLACE WITH: actual word from this third sentence",
                "Component2": "REPLACE WITH: actual phrase from this third sentence"
              }
            }
          ],
          "patternVariations": {
            "negativeForm": "It is not polite to use your phone during meals because it shows disrespect.",
            "questionForm": "Why is it important to learn about different cultures?",
            "modalForm": "It can be difficult to understand all customs because every culture is different.",
            "pastForm": "It was essential to follow the rules because the ceremony was very formal."
          },
          "interactiveFeatures": {
            "fillInTheBlanks": [
              {
                "template": "It is ___ to ___ because ___.",
                "prompts": [
                  "Think of something important in your culture",
                  "What action shows good manners?", 
                  "Why is this behavior valued?"
                ]
              }
            ],
            "substitutionDrill": {
              "basePattern": "It is important to respect others because it creates harmony.",
              "substitutions": [
                {"target": "important", "options": ["essential", "necessary", "polite"]},
                {"target": "respect others", "options": ["listen carefully", "show courtesy", "be patient"]},
                {"target": "creates harmony", "options": ["builds trust", "shows maturity", "prevents conflicts"]}
              ]
            },
            "buildingSentences": {
              "stepByStep": [
                {"step": 1, "instruction": "Choose an evaluative adjective", "examples": ["important", "polite", "necessary"]},
                {"step": 2, "instruction": "Add an infinitive action", "examples": ["to listen", "to wait", "to ask"]},
                {"step": 3, "instruction": "Complete with a reason", "examples": ["it shows respect", "it's more polite", "it prevents problems"]}
              ]
            }
          },
          "culturalAdaptation": {
            "universalApplication": "This pattern works across cultures for expressing values and social norms",
            "culturalNotes": "Different cultures may emphasize different adjectives - adapt examples to student backgrounds",
            "discussionStarters": [
              "What behaviors are considered 'important' in your culture?",
              "Are there actions that are 'polite' in one culture but not in another?"
            ]
          },
          "teachingNotes": [
            "Start with familiar concepts before introducing new vocabulary",
            "Use gestures and visual aids to reinforce the three-part structure",
            "Encourage students to personalize examples with their own cultural experiences",
            "Practice rhythm: IT is im-POR-tant to LEARN be-CAUSE it HELPS",
            "Connect to the lesson vocabulary by using target words in the infinitive action slot"
          ],
          "practiceActivities": [
            {
              "type": "controlled",
              "name": "Pattern Completion", 
              "instruction": "Complete the sentence with appropriate words from the lesson",
              "difficulty": "easy"
            },
            {
              "type": "guided",
              "name": "Cultural Comparison",
              "instruction": "Use this pattern to compare customs from different cultures",
              "difficulty": "medium"
            },
            {
              "type": "free",
              "name": "Personal Values",
              "instruction": "Express your own opinions about social behaviors using this pattern",
              "difficulty": "challenging"
            }
          ],
          "errorCorrection": {
            "commonMistakes": [
              {"error": "*It is important learn...", "correction": "It is important TO learn...", "explanation": "Don't forget the infinitive 'to'"},
              {"error": "*It is important to learn for...", "correction": "It is important to learn BECAUSE...", "explanation": "Use 'because' not 'for' to give reasons"},
              {"error": "*It is importantly to...", "correction": "It is IMPORTANT to...", "explanation": "Use the adjective 'important', not the adverb"}
            ]
          },
          "discussionPrompts": [
            "What customs from your culture would you explain using this pattern?",
            "Can you think of a time when understanding cultural differences was important?",
            "How would you teach someone from another culture about politeness in your country?",
            "What behaviors are considered essential in professional settings?"
          ]${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? `,
          "lowerLevelScaffolding": {
            "sentenceWorkshop": [
              {
                "name": "Building Step by Step",
                "steps": [
                  {
                    "level": "word",
                    "example": "important",
                    "explanation": "Start with an opinion word"
                  },
                  {
                    "level": "phrase", 
                    "example": "It is important",
                    "explanation": "Add the beginning structure"
                  },
                  {
                    "level": "sentence",
                    "example": "It is important to study English.",
                    "explanation": "Complete with action and reason"
                  }
                ],
                "teachingNotes": "Help students build confidence by constructing sentences piece by piece"
              }
            ],
            "patternTrainer": {
              "pattern": "It is [adjective] to [verb] because [reason].",
              "title": "Pattern Practice Tool",
              "scaffolding": {
                "adjectives": ["important", "difficult", "easy", "fun", "necessary", "good", "bad", "helpful"],
                "verbs": ["study", "learn", "practice", "travel", "work", "help", "listen", "understand"],
                "reasons": ["it helps you communicate", "you can get better jobs", "it opens opportunities", "it's useful for travel", "it shows respect", "it builds relationships"]
              },
              "examples": [
                "It is important to study because it helps you communicate.",
                "It is difficult to learn because grammar is complex.",
                "It is fun to travel because you meet new people."
              ],
              "instructions": [
                "Choose an adjective from the word bank",
                "Pick a verb that fits the topic", 
                "Select a reason that makes sense",
                "Put them together following the pattern"
              ]
            },
            "visualMaps": [
              {
                "pattern": "It is [ADJ] to [VERB] because [REASON]",
                "colorCoding": {
                  "It is": "gray",
                  "adjective": "blue", 
                  "to": "gray",
                  "verb": "green",
                  "because": "gray",
                  "reason": "purple"
                },
                "example": "It is important to study because it helps you communicate"
              }
            ]
          }` : ''}
        }
      ],
      "aiGeneratedSupport": {
        "adaptiveExamples": "AI can generate personalized examples based on student's cultural background and interests",
        "levelAdjustment": "Pattern complexity and vocabulary automatically adjust to student's demonstrated proficiency",
        "realTimeCorrection": "AI provides immediate feedback on student-generated sentences using this pattern",
        "progressiveChallenge": "Difficulty increases as student masters basic pattern usage"
      },
      "visualLearningSupport": {
        "colorCoding": "Each sentence component uses consistent colors across all examples",
        "structureDiagrams": "Visual representation of sentence building blocks", 
        "animatedConstruction": "Step-by-step sentence building animation suggestions",
        "patternRecognition": "Highlighting recurring structures across different examples"
      }
    },
    // CLOZE SECTION (Complete)
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph with blanks, using [1:word] format...",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
    },
    // SENTENCE UNSCRAMBLE SECTION (Complete)
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {
          "words": ["Complete", "array", "of", "scrambled", "words"],
          "correctSentence": "Complete correct sentence."
        }
      ],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
    },
    // DISCUSSION SECTION (Complete - 5 pairs)
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "paragraphContext": "Complete, unique context paragraph 1 (3-5 sentences)...",
          "question": "Complete discussion question 1 related to paragraph 1?",
          "imagePrompt": "Complete image prompt for Q1 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 2 (3-5 sentences)...",
          "question": "Complete discussion question 2 related to paragraph 2?",
          "imagePrompt": "Complete image prompt for Q2 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 3 (3-5 sentences)...",
          "question": "Complete discussion question 3 related to paragraph 3?",
          "imagePrompt": "Complete image prompt for Q3 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 4 (3-5 sentences)...",
          "question": "Complete discussion question 4 related to paragraph 4?",
          "imagePrompt": "Complete image prompt for Q4 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 5 (3-5 sentences)...",
          "question": "Complete discussion question 5 related to paragraph 5?",
          "imagePrompt": "Complete image prompt for Q5 (no text)..."
        }
      ]
    },
    // QUIZ SECTION (Complete - 5 questions)
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {"question": "Complete Quiz Q1?", "options": ["A", "B"], "answer": "A", "correctAnswer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q2?", "options": ["A", "B", "C"], "answer": "C", "correctAnswer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q3?", "options": ["A", "B", "C", "D"], "answer": "D", "correctAnswer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q4?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q5?", "options": ["True", "False"], "answer": "False", "correctAnswer": "False", "explanation": "Complete explanation..."}
      ]
    }
  ],
  // GRAMMAR SPOTLIGHT (AI-GENERATED LOGIC-BASED GRAMMAR TEACHING)
  "grammarSpotlight": {
    "grammarType": "[STRATEGICALLY CHOOSE the most pedagogically valuable grammar pattern for ${params.cefrLevel} level students studying '${params.topic}'. 

    **CEFR-LEVEL PRIORITIES:**
    - A1-A2: 'simple_present', 'simple_past', 'articles', 'basic_modals' (can/can't), 'prepositions_basic'
    - B1-B2: 'present_perfect', 'modal_verbs', 'conditionals_basic', 'relative_clauses', 'comparative', 'future_forms'
    - C1-C2: 'conditionals_advanced', 'passive_voice', 'subjunctive', 'reported_speech', 'advanced_tenses'

    **SELECTION CRITERIA:**
    1. What does a ${params.cefrLevel} student NEED to learn for effective communication?
    2. What grammar pattern works naturally with the topic '${params.topic}'?
    3. What's most useful for building speaking/writing confidence?

    Choose ONE grammar type that meets these criteria.]",

    "title": "[Create an engaging, clear title that explains the grammar's PURPOSE - e.g., 'Modal Verbs: Expressing Possibility and Necessity', 'Present Perfect: Connecting Past to Present', 'Articles: Making Your Meaning Clear']",

    "description": "[Explain in simple terms WHY this grammar pattern is useful for communication and how it helps students express their ideas better - focus on practical benefits, not just rules]",

    "logicExplanation": {
      "communicationNeed": "[CRITICAL: Explain WHY this grammar exists. What communication problem does it solve? Focus on real-world communication needs]",
      "logicalSolution": "[Explain HOW the language solves this communication need. What's the logical structure? Why does it work this way?]", 
      "usagePattern": "[Explain WHEN and WHERE students should use this grammar. What signals tell them this pattern is needed?]",
      "communicationImpact": "[Explain what DIFFERENCE this makes in communication. How does using this grammar change meaning or impression?]"
    },

    "teachingTips": [
      "[Practical classroom tip: How should teachers introduce this concept?]",
      "[Common student confusion: What do students typically misunderstand?]", 
      "[Teaching sequence: What order works best?]"
    ],

    "examples": [
      {
        "sentence": "[CREATE a clear, pedagogically-perfect example sentence that demonstrates this grammar pattern. The sentence should:
        - Be appropriate for ${params.cefrLevel} level
        - Relate to the topic '${params.topic}' when possible 
        - Clearly demonstrate the grammar pattern
        - Be useful for students to learn and remember
        - Avoid complex vocabulary that might confuse the grammar lesson]",
        "highlighted": "[SAME sentence but with ** around ONLY the specific grammar elements you're teaching - be precise and consistent with highlighting]",
        "explanation": "[Explain clearly and simply why these highlighted words demonstrate this grammar pattern and how they work together]"
      },
      {
        "sentence": "[CREATE a second example that shows a different aspect or variation of the same grammar pattern - this helps students recognize the pattern in different contexts]",
        "highlighted": "[Again, highlight only the relevant grammar elements]", 
        "explanation": "[Explain how this example reinforces or extends the grammar pattern]"
      }
    ],

    "visualSteps": [
      {
        "stepNumber": 1,
        "instruction": "[What students should understand about this grammar pattern - focus on meaning and use, not just form]",
        "visualElements": {
          "type": "pattern_recognition",
          "elements": "[Describe the key components students should identify - e.g., 'Notice the helping verb + main verb structure' or 'Look for the time connection words']"
        }
      },
      {
        "stepNumber": 2,
        "instruction": "[How students can practice and use this pattern effectively]",
        "visualElements": {
          "type": "application",
          "guidance": "[Practical advice for using this grammar in speaking/writing - e.g., 'Use this pattern when you want to express uncertainty' or 'This helps you talk about experiences without specific times']"
        }
      },
      {
        "stepNumber": 3,
        "instruction": "[Common mistakes to avoid and tips for success]",
        "visualElements": {
          "type": "tips",
          "commonMistakes": "[List 2-3 typical errors students make with this grammar]",
          "successTips": "[Give 2-3 practical tips for using this grammar correctly]"
        }
      }
    ],

    "visualLayout": {
      "recommendedType": "[Choose the BEST visual approach for this grammar type:
      - 'certainty_scale' for modal verbs (showing levels of certainty/possibility)
      - 'timeline_bridge' for tenses that connect time periods (present perfect, past perfect)
      - 'decision_tree' for articles and conditionals (showing choice logic)
      - 'transformation_flow' for passive voice and complex structures
      - 'comparison_table' for comparatives and contrasting structures
      - 'process_steps' for step-by-step grammar construction]",

      "primaryColor": "[Choose a color that fits the grammar type: 'blue' for certainty/modals, 'green' for time/tenses, 'purple' for relationships, 'orange' for actions, 'teal' for comparisons]",

      "pedagogicalApproach": {
        "learningObjective": "[What should students be able to DO after learning this grammar? - e.g., 'Express different levels of certainty about future events' or 'Talk about past experiences that affect the present']",
        "practiceActivities": [
          "[Suggest a simple practice activity students can do - e.g., 'Create sentences about your own experiences using this pattern']",
          "[Suggest a communicative activity - e.g., 'Ask classmates questions using these modal verbs']"
        ],
        "realWorldApplication": "[Explain when students will use this grammar in actual conversation or writing - be specific about situations]"
      },

      "adaptiveFeatures": {
        "levelAdjustment": "[How this lesson adjusts for ${params.cefrLevel} level - what makes it appropriate for these students?]",
        "scaffolding": "[What support structures help students understand this grammar? - e.g., 'Color-coding helps identify pattern parts' or 'Step-by-step building reduces complexity']",
        "extension": "[How advanced students can take this further - suggest more complex applications]"
      }
    },

    "interactiveFeatures": {
      "hasVisualDiagram": true,
      "dynamicContent": true,
      "adaptiveToLessonTopic": true,
      "aiGeneratedExamples": true,
      "pedagogicallyOptimized": true
    }
  }
}

**CRITICAL GRAMMAR SPOTLIGHT INSTRUCTIONS:**

The Grammar Spotlight should use strategic grammar selection and pedagogically-optimized examples to provide maximum educational value for ${params.cefrLevel} level students studying "${params.topic}".

**KEY PRINCIPLES:**
1. **Strategic Selection**: Choose grammar that students at this level need to learn
2. **Topic Integration**: Connect grammar naturally to the lesson topic when possible
3. **Pedagogical Excellence**: Create examples designed for teaching, not just extracted from text
4. **Clear Communication**: Focus on helping students express their ideas effectively
5. **Practical Application**: Show students when and how to use this grammar in real communication

Ensure the entire output is a single, valid JSON object starting with { and ending with }`;

      console.log('Sending request to Qwen API...');
      
      const response = await axios.post(QWEN_API_URL, {
        model: 'qwen-max',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000
      });

      console.log('Qwen API response received');

      if (response.data && response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        
        try {
          const lessonData = JSON.parse(content);
          console.log('Lesson data parsed successfully');
          return lessonData;
        } catch (parseError) {
          console.error('Failed to parse Qwen response as JSON:', parseError);
          throw new Error('Invalid JSON response from Qwen API');
        }
      } else {
        throw new Error('Invalid response format from Qwen API');
      }

    } catch (error: any) {
      console.error('Qwen API error:', error);
      if (error?.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');