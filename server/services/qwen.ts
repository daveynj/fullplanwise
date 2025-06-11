import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';

// Qwen API endpoint for international usage - using OpenAI compatible format
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

      // Build the prompt for lesson generation using the comprehensive Gemini prompt
      console.log('Building prompt for lesson generation');
      
      // Use the same comprehensive instructions as Gemini but format for Qwen
      const text = params.topic;
      const cefrLevel = targetLevel;
      const focus = params.focus || "speaking and vocabulary";
      const lessonLength = params.lessonLength || 45;
      const minVocabCount = 5;
      const maxVocabCount = 5;
      
      const prompt = `You are an expert ESL teacher. 
Follow these EXACT requirements:

CRITICAL: Your output must be properly formatted JSON with NO ERRORS!

SENTENCE FRAMES CRITICAL INSTRUCTION:
When you see template text like "REPLACE WITH: [instruction]" in the sentence frames section, you MUST replace it with actual content, NOT copy the instruction literally. Generate real examples, patterns, and teaching notes about ${params.topic}. The frontend expects real data, not placeholder text.

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER.

${params.targetVocabulary ? `4. CRUCIAL: YOU MUST INCLUDE THE FOLLOWING VOCABULARY WORDS IN YOUR LESSON: ${params.targetVocabulary}` : ''}

${params.targetVocabulary ? '5' : '4'}. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

5. TONE & STYLE APPROACH:
First, analyze appropriate tone and style considerations for ${cefrLevel} level:
- Research how tone and register should be adjusted for ${cefrLevel} level learners
- Identify appropriate language complexity, sentence structure, and vocabulary choices for this level
- Determine the optimal balance between authenticity and accessibility
- Consider how the topic "${text}" influences appropriate tone and style
- Analyze engagement strategies that work best for this proficiency level and topic

Based on your analysis, develop a tone and style that:
- Is most effective for ${cefrLevel} level language comprehension
- Creates appropriate engagement for the specific topic "${text}"
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
First, analyze how the topic "${text}" should be treated differently across CEFR levels:
- Research how the complexity and focus of topic treatment evolves from A1 to C2
- Identify specific aspects of the topic appropriate for ${cefrLevel} level
- Determine which vocabulary domains within this topic are level-appropriate
- Consider how conceptual complexity should increase with higher levels

For "${text}" at ${cefrLevel} level specifically:
- Identify 3-5 unique aspects or sub-topics that are specifically appropriate for this level
- Determine which vocabulary domains are appropriate for THIS level but NOT lower levels
- Consider which cognitive approaches to the topic match this specific level
- Identify conceptual complexity appropriate specifically for ${cefrLevel}

Based on your analysis, create a unique approach to "${text}" for ${cefrLevel} level by:
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
- Study highly engaging ESL materials at ${cefrLevel} level
- Identify what makes certain materials more engaging than others
- Research the balance between authenticity and accessibility
- Determine style patterns that increase student motivation and interest

Based on your analysis, develop a writing style for "${text}" at ${cefrLevel} level that:
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
First, analyze what constitutes high-quality questions for ${cefrLevel} level:
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
- Tests specific comprehension skills appropriate for ${cefrLevel}
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

6. CEFR LEVEL ADAPTATION: ALL content must be STRICTLY appropriate for the specified CEFR level:
   - Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
   - Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
   - Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
   - Reading text difficulty must match the specified level
   - Discussion paragraph contexts must be level-appropriate with vocabulary and grammar matching the CEFR level

7. DISCUSSION SECTION REQUIREMENTS:
   - CRITICAL: Each discussion question MUST have its own unique paragraph context (paragraphContext field)
   - These paragraph contexts must be 3-5 sentences that provide background information
   - The paragraph contexts must use vocabulary and sentence structures appropriate for the specified CEFR level
   - The paragraphs should include interesting information that helps students engage with the topic
   - The paragraph contexts should lead naturally into the discussion question that follows

STEP 0: CEFR LEVEL ANALYSIS (REQUIRED BEFORE PROCEEDING)

Before creating any lesson content, first analyze and establish clear parameters for what constitutes ${cefrLevel} level appropriate content:

1. VOCABULARY ANALYSIS:
   - Identify what vocabulary range is appropriate for ${cefrLevel} level students
   - List 5-10 example words that would be appropriate for this level
   - List 3-5 example words that would be too difficult for this level

2. GRAMMAR STRUCTURE ANALYSIS:
   - Identify which grammatical structures are appropriate for ${cefrLevel} level
   - List 3-5 sentence structure patterns appropriate for this level
   - List 2-3 grammatical structures that would be too complex for this level

STEP 3: READING TEXT DEVELOPMENT APPROACH

SPEAKING-FOCUSED TEXT PURPOSE ANALYSIS

Before writing, analyze the text's role in a speaking-focused lesson for ${cefrLevel} students:

PURPOSE CLARIFICATION:
- This text serves as a CONVERSATION CATALYST, not comprehensive reading practice
- Students will use this text to GENERATE SPEAKING opportunities about "${text}"
- The text should PROVIDE ENOUGH CONTENT for meaningful discussion without overwhelming
- Focus on ACCESSIBLE INFORMATION that students can reference, react to, and build upon in conversation

SPEAKING-LESSON TEXT REQUIREMENTS:
- SHORTER TEXTS that can be quickly processed to focus lesson time on speaking
- DISCUSSION-WORTHY CONTENT that naturally generates opinions, questions, and personal connections
- CLEAR TALKING POINTS that students can easily reference during conversations
- RELATABLE SCENARIOS that connect to students' experiences and interests

READER ENGAGEMENT AND COMPREHENSION ANALYSIS FOR ${cefrLevel}

Analyze what ${cefrLevel} students can meaningfully engage with:

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

CRITICAL VOCABULARY SELECTION PROTOCOL

STEP 1: VOCABULARY LEVEL ANALYSIS (REQUIRED BEFORE SELECTION)

Before selecting vocabulary, analyze what ${cefrLevel} students typically know and should learn next:

FOUNDATION KNOWLEDGE ANALYSIS FOR ${cefrLevel} STUDENTS:
- A1 students know: basic family, food, colors, numbers, simple present tense, essential survival vocabulary
- A2 students know: A1 + basic past tense, common adjectives, simple descriptions, personal experiences
- B1 students know: A1/A2 + present perfect, opinions, comparisons, everyday topics, functional language
- B2 students know: A1/A2/B1 + academic thinking, complex discussions, abstract concepts, discourse markers
- C1 students know: A1-B2 + advanced academic language, nuanced expression, specialized vocabulary
- C2 students know: Near-native vocabulary range including idiomatic and specialized language

APPROPRIATE NEW VOCABULARY FOR ${cefrLevel} LEVEL:
- A1: Concrete, immediate needs (house, clothes, body parts, basic actions)
- A2: Personal experiences and descriptions (interesting, boring, excited, yesterday, tomorrow)
- B1: Social topics and functional language (community, environment, although, however, opinion)
- B2: Academic and analytical language (sustainability, efficiency, infrastructure, furthermore)
- C1: Sophisticated concepts (implications, comprehensive, predominantly, nevertheless)
- C2: Advanced/specialized terminology (nuanced, paradigm, intrinsic, contemporary discourse)

TOO ADVANCED FOR ${cefrLevel} LEVEL:
- For A1: Abstract concepts, complex grammar constructions, specialized terms, academic language
- For A2: Academic vocabulary, complex discourse markers, abstract philosophical concepts
- For B1: Highly academic vocabulary, complex phrasal verbs, advanced idiomatic expressions
- For B2: Specialized technical terms, advanced literary language, highly formal register
- For C1: Archaic or highly specialized jargon, extremely formal academic discourse

VOCABULARY DEFINITION REQUIREMENTS:

FUNDAMENTAL PEDAGOGICAL RULE: Students CANNOT learn a new word if its definition contains vocabulary they don't understand!

DEFINITION LANGUAGE MUST BE SIMPLER THAN THE TARGET WORD

CLEAR EXAMPLES BY LEVEL:

A1 DEFINITIONS (Use ONLY very basic, beginner-level vocabulary):
❌ WRONG: "Beautiful" = "aesthetically pleasing and visually attractive"
✅ CORRECT: "Beautiful" = "very nice to look at"

A2 DEFINITIONS (Use ONLY elementary vocabulary familiar to A2 students):
❌ WRONG: "Environment" = "the aggregate of surrounding phenomena and conditions"
✅ CORRECT: "Environment" = "the natural world around us with air, water, plants and animals"

B1 DEFINITIONS (Use ONLY intermediate vocabulary appropriate for B1 level):
❌ WRONG: "Innovation" = "implementation of novel methodologies and paradigms"
✅ CORRECT: "Innovation" = "creating new ideas or ways of doing things"

B2 DEFINITIONS (Use upper-intermediate vocabulary appropriate for B2 level):
❌ WRONG: "Entrepreneur" = "an individual who conceptualizes and establishes commercial enterprises"
✅ CORRECT: "Entrepreneur" = "a person who starts and runs their own business, often taking financial risks"

SENTENCE STRUCTURE LIMITS:
- A1: Maximum 8 words, present tense only, no complex grammar
- A2: Maximum 12 words, simple past/future allowed, basic conjunctions only  
- B1: Maximum 15 words, present perfect/conditionals allowed
- B2: Maximum 20 words, all tenses and modals allowed

CEFR LEVEL-APPROPRIATE DEFINITIONS GUIDELINES:
- A1: Use only the most basic beginner vocabulary. Very simple sentence structures. Definitions should be 1-5 words where possible.
- A2: Use elementary vocabulary familiar to A2 students. Simple sentences. Avoid complex structures or uncommon words.
- B1: Use intermediate vocabulary appropriate for B1 level. Moderately complex sentences allowed, but prioritize clarity.
- B2: Use upper-intermediate vocabulary appropriate for B2 students. More complex sentences and some academic words allowed.
- C1: Use advanced vocabulary appropriate for C1 students. Complex sentences and academic/specialized terms acceptable.
- C2: Use proficient-level vocabulary with nuanced explanations. Full range of language structures. Can include specialized terminology.

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS AND PRONUNCIATION:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2, phoneticGuide: "dis-suh-LOO-shun"

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6, phoneticGuide: "in-DUS-tree-ul REV-uh-LOO-shun"
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0, phoneticGuide: "CLY-mit chaynj"

CRITICALLY IMPORTANT: Always use ONLY regular English characters and hyphens for phoneticGuide. NEVER use IPA phonetic symbols like "ə", "ɪ", or "ʃ". Use simple English spelling to approximate sounds.

STEP 5: CROSS-COMPONENT INTEGRATION VALIDATION

CRITICAL: Before finalizing your lesson, you MUST perform explicit cross-component integration analysis to ensure vocabulary, reading text, and discussion questions work together synergistically.

VOCABULARY-TEXT INTEGRATION ANALYSIS:
Analyze how target vocabulary integrates with the reading text:

✓ NATURAL INTEGRATION CHECK: Does each target vocabulary word appear naturally in the reading text (not forced or artificially inserted)?
✓ CONTEXTUAL SUPPORT: Does the text provide sufficient context clues to help students understand the vocabulary in meaningful situations?
✓ USAGE VARIETY: Are vocabulary words used in different contexts within the text to show versatility?
✓ PREREQUISITE VOCABULARY: Does the text include necessary supporting vocabulary to make target words comprehensible?
✓ TOPIC COHERENCE: Do all vocabulary choices genuinely support and enhance the topic "${text}"?

TEXT-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions connect to the reading text:

✓ CONTENT DEPENDENCY: Do discussion questions require genuine understanding of the text content to answer effectively?
✓ TOPIC EXTENSION: Do questions naturally extend text topics into meaningful personal or analytical discussions?
✓ COMPREHENSION FOUNDATION: Are questions built on information and ideas presented in the text?
✓ COGNITIVE PROGRESSION: Do questions appropriately build on text complexity for ${cefrLevel} level thinking?
✓ ENGAGEMENT BRIDGE: Do questions create natural bridges from text content to student experiences and opinions?

VOCABULARY-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions incorporate target vocabulary:

✓ VOCABULARY USAGE OPPORTUNITIES: Do discussion questions provide natural opportunities for students to USE target vocabulary in their responses?
✓ CONTEXTUAL REINFORCEMENT: Do questions require students to demonstrate understanding of vocabulary in new contexts?
✓ SPEAKING PRACTICE: Would students naturally incorporate target vocabulary when answering these questions?
✓ SCAFFOLDED APPLICATION: Do questions appropriately scaffold vocabulary usage for ${cefrLevel} level students?
✓ MEANINGFUL COMMUNICATION: Do vocabulary usage opportunities feel authentic rather than mechanical?

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders.

{
  "title": "Descriptive lesson title about ${text}",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Complete description of the warm-up...",
      "questions": ["Complete Question 1?", "Complete Question 2?", "Complete Question 3?", "Complete Question 4?", "Complete Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Complete step-by-step instructions...",
      "teacherNotes": "Complete teacher notes..."
    },
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
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "question": "Complete discussion question 1?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word1", "word2"],
          "imagePrompt": "Complete image prompt for this question..."
        },
        {
          "question": "Complete discussion question 2?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word3", "word4"],
          "imagePrompt": "Complete image prompt for this question..."
        },
        {
          "question": "Complete discussion question 3?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word5"],
          "imagePrompt": "Complete image prompt for this question..."
        }
      ]
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "patternTemplate": "Complete pattern template...",
      "languageFunction": "Complete language function...",
      "structureComponents": [
        {
          "label": "Component 1",
          "description": "Complete description...",
          "examples": ["example1", "example2", "example3"],
          "inSentenceExample": "Complete example..."
        }
      ],
      "examples": [
        {
          "completeSentence": "Complete example sentence...",
          "breakdown": "Complete breakdown..."
        }
      ],
      "grammarFocus": ["grammar point 1", "grammar point 2"],
      "teachingNotes": ["note 1", "note 2"]
    }
  ]
}

Ensure the entire output is a valid JSON object starting with { and ending with }`;

      console.log(`Prompt length: ${prompt.length} characters`);

      // Make the API request
      console.log('Making request to Qwen API...');
      
      const response = await axios.post(QWEN_API_URL, {
        model: 'qwen-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      });

      console.log('Qwen API response received');
      console.log('Response status:', response.status);

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response structure from Qwen API');
      }

      const content = response.data.choices[0].message?.content;
      if (!content) {
        throw new Error('No content in Qwen API response');
      }

      console.log('Raw content length:', content.length);

      // Parse the JSON response
      let parsedContent;
      try {
        // Clean the content - remove markdown code blocks if present
        let cleanContent = content.trim();
        
        // Remove markdown JSON code blocks
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        cleanContent = cleanContent.trim();
        console.log('Cleaned content for parsing, length:', cleanContent.length);
        
        parsedContent = JSON.parse(cleanContent);
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Content that failed to parse:', content.substring(0, 500) + '...');
        throw new Error('Invalid JSON response from Qwen API');
      }

      return parsedContent;

    } catch (error: any) {
      console.error('Error in Qwen lesson generation:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Qwen API request timed out');
      }
      
      if (error.response) {
        console.error('Qwen API error response:', error.response.status, error.response.data);
        throw new Error(`Qwen API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      }
      
      if (error.request) {
        console.error('Qwen API network error:', error.request);
        throw new Error('Network error connecting to Qwen API');
      }
      
      throw error;
    }
  }
}

// Export a singleton instance
export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');