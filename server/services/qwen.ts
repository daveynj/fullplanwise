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

3. TEXT COMPLEXITY ANALYSIS:
   - Determine appropriate sentence length and complexity for ${params.cefrLevel} level
   - Identify appropriate paragraph structure and length
   - Establish appropriate use of idioms, phrasal verbs, and figurative language (if any)

4. COGNITIVE DEMAND ANALYSIS:
   - Identify appropriate cognitive tasks for ${params.cefrLevel} level (describing, explaining, comparing, etc.)
   - Determine appropriate level of abstraction for concepts
   - Assess appropriate cultural knowledge assumptions

Spend time establishing these parameters before proceeding. This analysis will guide your creation of all lesson components to ensure they remain appropriate for ${params.cefrLevel} level students throughout.

Once complete, use these self-generated guidelines to create appropriately leveled content for all components of the lesson.

STEP 1: WRITE A READING TEXT
- First, write an original reading text about the topic "${params.topic}"
- Use a warm, accessible, and conversational tone
- Include interesting facts and observations woven naturally into the narrative
- Use vivid, descriptive language that brings topics to life
- Make complex information approachable through clear explanations and engaging examples
- Use a mix of sentence lengths for good flow
- Occasionally address the reader directly with rhetorical questions or observations

- CRITICAL REQUIREMENT: For ${params.cefrLevel} level, your text MUST be AT LEAST ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "C3" ? "600" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words
- Your text will be REJECTED if it's shorter than ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "C3" ? "600" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words
- The system counts words by splitting on whitespace - make sure you have enough actual words
- Divide your text into 3-5 paragraphs with clear paragraph breaks (use double line breaks between paragraphs)
- Focus on creating a substantial, informative text before moving on to other components
- Make sure the vocabulary and sentence structures remain appropriate for ${params.cefrLevel} level students
- For lower levels (A1, A2), simplify the language while maintaining a friendly, engaging tone
- For higher levels (B2, C1, C2), use richer vocabulary and more complex sentences

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

SENTENCE FRAMES APPROACH:
**Goal:** Develop high-frequency, versatile sentence patterns that support key language functions in the lesson.

First, analyze what sentence patterns are appropriate for ${params.cefrLevel} level:
- Research the syntactic structures typically taught at ${params.cefrLevel} level
- Identify high-frequency, versatile sentence patterns used in authentic contexts
- Determine appropriate complexity of explanations for this level
- Consider how the patterns should be presented and practiced

Then, based on your analysis:
- Design 1-2 sentence patterns that are:
  a) Appropriate for ${params.cefrLevel} level complexity
  b) Genuinely useful in everyday communication
  c) Relevant to the lesson topic
  d) Structured in a way students can easily understand and practice

For each pattern, determine the most appropriate way to:
- Present the pattern visually
- Break it down into comprehensible components
- Provide level-appropriate examples
- Create practice opportunities
- Guide teachers in presenting it effectively

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

DISCUSSION QUESTIONS APPROACH:
First, analyze effective discussion questions for ${params.cefrLevel} level students:
- Research effective questioning techniques for ${params.cefrLevel} level language learners
- Identify appropriate cognitive challenge levels for discussions at this level
- Determine the balance between scaffolding and open-ended questioning
- Consider how background/context should be provided at this level
- Analyze how to encourage extended responses from students at this proficiency level

Based on your analysis, create discussion questions that:
- Match the cognitive abilities of ${params.cefrLevel} level students
- Provide appropriate contextual support based on level needs
- Encourage critical thinking appropriate to this level
- Are designed for optimal language production at this level
- Connect to both the lesson content and students' experiences
- Progress from more supported to more independent thinking

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
    // SENTENCE FRAMES SECTION (Complete - 1-2 frames)
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "introduction": "Master key sentence patterns to express your ideas clearly and naturally.",
      "frames": [
        {
          "patternTemplate": "It is ___ to ___ because ___.",
          "languageFunction": "Explaining reasons and justification",
          "title": "Expressing Reasoned Opinions",
          "level": "intermediate",
          "grammarFocus": [
            "Structure: It + is + adjective + infinitive (to + verb) + reason clause",
            "Use of 'because' to introduce explanations",
            "Infinitive forms after adjectives"
          ],
          "structureComponents": [
            {
              "label": "Evaluative Adjective",
              "description": "An adjective that expresses judgment or evaluation about the action",
              "examples": ["important", "essential", "polite", "rude", "necessary", "helpful"],
              "inSentenceExample": "It is [Evaluative Adjective] to..."
            },
            {
              "label": "Infinitive Action",
              "description": "The main action or behavior being evaluated, in infinitive form",
              "examples": ["learn new languages", "respect cultural differences", "ask permission first"],
              "inSentenceExample": "...to [Infinitive Action] because..."
            },
            {
              "label": "Reason Clause",
              "description": "The explanation or justification for why the evaluation is true",
              "examples": ["it shows respect for others", "it helps us communicate better", "it prevents misunderstandings"],
              "inSentenceExample": "...because [Reason Clause]."
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
              "completeSentence": "It is important to learn cultural customs because it shows respect for local traditions.",
              "breakdown": {
                "Evaluative Adjective": "important",
                "Infinitive Action": "learn cultural customs",
                "Reason Clause": "it shows respect for local traditions"
              }
            },
            {
              "completeSentence": "It is polite to remove your shoes because it keeps the house clean.",
              "breakdown": {
                "Evaluative Adjective": "polite",
                "Infinitive Action": "remove your shoes", 
                "Reason Clause": "it keeps the house clean"
              }
            },
            {
              "completeSentence": "It is essential to understand local etiquette because it helps avoid embarrassing situations.",
              "breakdown": {
                "Evaluative Adjective": "essential",
                "Infinitive Action": "understand local etiquette",
                "Reason Clause": "it helps avoid embarrassing situations"
              }
            },
            {
              "completeSentence": "It is rude to interrupt others because it shows disrespect for their opinions.",
              "breakdown": {
                "Evaluative Adjective": "rude",
                "Infinitive Action": "interrupt others",
                "Reason Clause": "it shows disrespect for their opinions"
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
  // GRAMMAR SPOTLIGHT (AI-GENERATED STRATEGIC GRAMMAR TEACHING)
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