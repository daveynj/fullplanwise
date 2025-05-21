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
          "imagePrompt": "Complete image prompt (no text)..."
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
          "imagePrompt": "Complete image prompt (no text)..."
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
          "imagePrompt": "Complete image prompt (no text)..."
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
          "imagePrompt": "Complete image prompt (no text)..."
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
          "imagePrompt": "Complete image prompt (no text)..."
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
    // SENTENCE FRAMES SECTION (NEW STRUCTURE - 1-2 frames)
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "frames": [
        {
          "patternTemplate": "It is ___ to ___ because ___.", 
          "languageFunction": "Explaining reasons",
          "grammarFocus": [
            "Structure: It + is + adjective + infinitive (to + verb)",
            "'Because' introduces the reason or explanation."
          ],
          "structureComponents": [
            {
              "label": "Adjective",
              "description": "Describes the quality or nature of the action.",
              "examples": ["polite", "important", "rude", "necessary"],
              "inSentenceExample": "It is [Adjective]..."
            },
            {
              "label": "Infinitive Phrase",
              "description": "The action related to the main idea.",
              "examples": ["chew with your mouth closed", "use a napkin", "wait for everyone"],
              "inSentenceExample": "...to [Infinitive Phrase]..."
            },
            {
              "label": "Reason Clause",
              "description": "Explains why the statement is true.",
              "examples": ["it shows respect", "it's more hygienic", "it makes others comfortable"],
              "inSentenceExample": "...because [Reason Clause]."
            }
          ],
          "visualStructure": {
            "start": "It is",
            "parts": [
              { "label": "Adjective" },
              { "label": "Infinitive Phrase", "connector": "to" },
              { "label": "Reason Clause", "connector": "because" }
            ],
            "end": "."
          },
          "examples": [
            {
              "completeSentence": "It is polite to chew with your mouth closed because it shows respect.",
              "breakdown": {
                "Adjective": "polite",
                "Infinitive Phrase": "chew with your mouth closed",
                "Reason Clause": "it shows respect"
              }
            },
            {
              "completeSentence": "It is important to use a napkin because it's more hygienic.",
              "breakdown": {
                "Adjective": "important",
                "Infinitive Phrase": "use a napkin",
                "Reason Clause": "it's more hygienic"
              }
            },
            {
              "completeSentence": "It is necessary to wait for everyone because it makes others comfortable.",
              "breakdown": {
                  "Adjective": "necessary",
                  "Infinitive Phrase": "wait for everyone",
                  "Reason Clause": "it makes others comfortable"
              }
            }
          ],
          "patternVariations": {
            "negativeForm": "It is not polite to talk with your mouth full because it's difficult to understand you.",
            "questionForm": "Why is it important to use a napkin?",
            "modalForm": "It can be rude to reach across the table because it invades others' space."
          },
          "teachingNotes": [
            "Point out how each example follows the same structure.",
            "Ask students: \"What adjective describes this manner?\" \"Why is this manner important?\"",
            "Elicit more examples: Ask students to suggest other table manners that could fit this pattern.",
            "Contrast examples: Show how changing one part affects the meaning of the sentence."
          ],
          "discussionPrompts": [
            "What other table manners are important in your culture?",
            "Are there table manners that are different in different countries?",
            "Why do you think we have rules about how to behave at the table?",
            "What happens when someone doesn't follow good table manners?"
          ]
        }
      ]
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
  ]
}

Ensure the entire output is a single, valid JSON object starting with { and ending with }.

CEFR LEVEL-SPECIFIC EXAMPLES:

A1 Examples:

- "I like to eat ___."

- "My favorite ___ is ___."

- "I can ___ very well."

- "In the morning, I ___."

A2 Examples:

- "Last weekend, I went to ___ and I saw ___."

- "I usually ___ because I think it's ___."

- "I would like to ___ next ___."

- "If I have time, I will ___."

B1 Examples:

- "I think that ___ is important because ___."

- "Although many people believe ____, I think ___."

- "When I was younger, I used to ____, but now I ___."
`;
      
      // Use qwen-max model for better JSON handling ability
      const modelName = "qwen-max";
      
      // Request payload following OpenAI-compatible format for the international endpoint
      const requestBody = {
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: prompt 
          },
          { 
            role: "user", 
            content: `Generate the lesson content for topic: "${params.topic}", CEFR level: ${params.cefrLevel}. Focus: ${params.focus}. Length: ${params.lessonLength} minutes. ${params.additionalNotes ? `Additional notes: ${params.additionalNotes}` : ''}` 
          }
        ],
        temperature: 0.3, 
        top_p: 0.9,
        max_tokens: 8192 // Qwen API maximum limit
      };
      
      console.log(`Using model: ${modelName}`);
      console.log('Request endpoint:', QWEN_API_URL);
      
      // Log request details without sensitive information
      console.log('Request structure:', JSON.stringify({
        model: requestBody.model,
        messages: [
          { role: requestBody.messages[0].role, content: "**system prompt content** [redacted]" },
          { role: requestBody.messages[1].role, content: "**user prompt content** [redacted]" }
        ],
        temperature: requestBody.temperature,
        top_p: requestBody.top_p,
        max_tokens: requestBody.max_tokens
      }, null, 2));
      
      console.log('Sending request to Qwen API...');
      
      // Create unique identifiers for this request
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      try {
        const response = await axios({
          method: 'post',
          url: QWEN_API_URL,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          data: requestBody,
          timeout: 300000 // 5 minute timeout (increased from 180000)
        });
        
        console.log('Received response from Qwen API');
        
        // Parse the response, transform, and return
        if (response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content;
          let jsonContent: any;
          
          try {
            jsonContent = JSON.parse(content);
            console.log('Successfully parsed JSON response');
          } catch (parseError) {
            console.error('Error parsing Qwen response as JSON:', parseError);
            
            // Try cleaning content first
            let cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            
            try {
              jsonContent = JSON.parse(cleanedContent);
              console.log('Successfully parsed JSON after cleaning content');
            } catch (cleanError) {
              console.error('Failed to parse JSON even after cleaning, trying to fix malformed JSON');
              
              // Try fixing malformed JSON
              const fixedContent = this.parseQwenColonFormat(cleanedContent);
              
              try {
                jsonContent = JSON.parse(fixedContent);
                console.log('Successfully parsed JSON after fixing malformed content');
              } catch (fixError) {
                console.error('Failed to parse JSON even after fixing, returning error response');
                return {
                  title: `Lesson on ${params.topic}`,
                  content: content,
                  error: 'JSON parsing failed',
                  provider: 'qwen'
                };
              }
            }
          }
          
          // Format content AND generate images
          return await this.formatLessonContent(jsonContent);
        }
        
        return {
          title: params.topic ? `Lesson on ${params.topic}` : 'ESL Lesson',
          content: 'Unable to generate lesson content',
          error: 'No content in response',
          provider: 'qwen'
        };
      } catch (apiError: any) {
        console.error('Error during API request:', apiError.message);
        
        if (apiError.response) {
          // The request was made and the server responded with a status code
          console.error('Qwen API Response Error:');
          console.error('Status:', apiError.response.status);
          console.error('Status Text:', apiError.response.statusText);
          console.error('Headers:', JSON.stringify(apiError.response.headers, null, 2));
          console.error('Response Data:', JSON.stringify(apiError.response.data, null, 2));
          
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: `Qwen API Error: ${apiError.response.status} - ${apiError.response.statusText}`,
            sections: [{
              type: "error",
              title: "API Error",
              content: `The Qwen AI service returned an error: ${apiError.response.status} ${apiError.response.statusText}. ${
                apiError.response.data && apiError.response.data.error && apiError.response.data.error.message
                  ? `\n\nAPI error: ${apiError.response.data.error.message}` 
                  : apiError.response.data && apiError.response.data.message
                    ? `\n\nMessage: ${apiError.response.data.message}`
                    : ''
              }`
            }]
          };
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error('Qwen API No Response Error:');
          console.error('Request:', apiError.request);
          
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: 'No response received from Qwen API',
            sections: [{
              type: "error",
              title: "Connection Error",
              content: "No response was received from the Qwen AI service. This could be due to a timeout or network issue."
            }]
          };
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Qwen API Setup Error:', apiError.message);
          
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: `Error setting up request: ${apiError.message}`,
            sections: [{
              type: "error",
              title: "Request Error",
              content: `An error occurred while preparing the request: ${apiError.message}`
            }]
          };
        }
      }
    } catch (error: any) {
      console.error('Error in QwenService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Format and process the lesson content, adding image data
   */
  private async formatLessonContent(content: any): Promise<any> {
    try {
      // Ensure content is a valid object
      if (!content || typeof content !== 'object') {
        console.log('Content is not a valid object, creating a default structure');
        content = {
          title: 'ESL Lesson',
          sections: [],
          provider: 'qwen'
        };
      }
      
      const lessonContent = content;
      
      // Log the state of cloze/unscramble data BEFORE validation
      const preValidationCloze = lessonContent.sections?.find((s: any) => s?.type === 'cloze');
      const preValidationUnscramble = lessonContent.sections?.find((s: any) => s?.type === 'sentenceUnscramble');
      console.log('Cloze data BEFORE validation:', JSON.stringify(preValidationCloze, null, 2));
      console.log('Sentence Unscramble data BEFORE validation:', JSON.stringify(preValidationUnscramble, null, 2));
      
      // Add provider field
      lessonContent.provider = 'qwen';
      
      // Ensure the content has a title
      if (!lessonContent.title || typeof lessonContent.title !== 'string') {
        console.log('Missing or invalid title, setting default');
        lessonContent.title = 'ESL Lesson';
      }
      
      // Ensure sections array exists
      if (!lessonContent.sections || !Array.isArray(lessonContent.sections)) {
        console.log('Missing or invalid sections array, creating an empty one');
        lessonContent.sections = [];
      }
      
      // Process each section if sections array exists
      if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
        console.log('Validating lesson sections...');
        
        // Initialize new array for validated sections
        const validatedSections = [];
        
        // Check if required sections exist, track them
        let hasReadingSection = false;
        
        // Validate all sections have the required properties
        for (let i = 0; i < lessonContent.sections.length; i++) {
          const section = lessonContent.sections[i];
          let isValidSection = true; // Assume valid initially
          
          // Skip if not a valid section object
          if (!section || typeof section !== 'object') {
            console.log(`Section ${i} is not a valid object, skipping it`);
            isValidSection = false;
            continue; // Skip to next iteration
          }
          
          // Ensure all sections have a type and title
          if (!section.type || typeof section.type !== 'string') {
            console.log(`Section ${i} missing type, setting to 'unknown'`);
            section.type = 'unknown'; // Still try to keep the section if possible
          }
          
          if (!section.title || typeof section.title !== 'string') {
            console.log(`Section ${i} missing title, adding default title for ${section.type}`);
            section.title = `${section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section`;
          }
          
          // Track if required reading section exists
          if (section.type === 'reading') hasReadingSection = true;
          
          // Validate reading section
          if (section.type === 'reading') {
            if (!section.paragraphs || !Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
              console.log('Reading section missing paragraphs, creating empty array');
              section.paragraphs = ['No content available'];
            }
          }
          
          // Validate vocabulary section
          if (section.type === 'vocabulary') {
            if (!section.words || !Array.isArray(section.words) || section.words.length === 0) {
              console.log('Vocabulary section missing words, creating empty array');
              section.words = [];
            } else {
              // Validate each vocabulary word (and filter out nulls)
              const validWords = [];
              for (let j = 0; j < section.words.length; j++) {
                const word = section.words[j];
                if (!word || typeof word !== 'object') {
                  console.log(`Vocabulary word ${j} is not a valid object, skipping it`);
                  continue; // Skip this word
                }
                
                // Add defaults for missing fields but keep the word
                if (!word.term || typeof word.term !== 'string') word.term = 'unknown';
                if (!word.definition || typeof word.definition !== 'string') word.definition = 'No definition available';
                if (!word.partOfSpeech || typeof word.partOfSpeech !== 'string') word.partOfSpeech = 'noun';
                if (!word.example || typeof word.example !== 'string') word.example = `Example with "${word.term}".`;
                if (!word.semanticGroup || typeof word.semanticGroup !== 'string') word.semanticGroup = 'General Vocabulary';
                if (!word.additionalExamples || !Array.isArray(word.additionalExamples)) word.additionalExamples = [];
                if (!word.wordFamily || typeof word.wordFamily !== 'object') word.wordFamily = { words: [], description: 'No related words available' };
                if (!word.collocations || !Array.isArray(word.collocations)) word.collocations = [];
                if (!word.pronunciation || typeof word.pronunciation !== 'object') word.pronunciation = { syllables: [word.term], stressIndex: 0, phoneticGuide: word.term };
                
                validWords.push(word); // Add the potentially modified word
              }
              section.words = validWords; // Assign the filtered/validated words
            }
          }
          
          // Validate comprehension section
          if (section.type === 'comprehension') {
            if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
              console.log('Comprehension section missing questions, creating empty array');
              section.questions = [];
            } else {
              // Validate each question (and filter out nulls)
              const validQuestions = [];
              for (let j = 0; j < section.questions.length; j++) {
                const question = section.questions[j];
                if (!question || typeof question !== 'object') {
                  console.log(`Comprehension question ${j} is not a valid object, skipping it`);
                  continue; // Skip this question
                }
                // Add defaults for missing fields but keep the question
                if (!question.question || typeof question.question !== 'string') question.question = 'Question text missing';
                if (!question.options || !Array.isArray(question.options) || question.options.length === 0) question.options = ['True', 'False'];
                if (!question.correctAnswer) question.correctAnswer = question.options[0];
                if (!question.explanation || typeof question.explanation !== 'string') question.explanation = 'No explanation available.';
                
                validQuestions.push(question);
              }
              section.questions = validQuestions;
            }
          }
          
          // Validate cloze section
          if (section.type === 'cloze') {
            if (!section.text || typeof section.text !== 'string' || !section.text.includes('[')) {
              console.log('Cloze section has invalid text, removing section');
              isValidSection = false;
            } else if (!section.wordBank || !Array.isArray(section.wordBank) || section.wordBank.length === 0) {
              console.log('Cloze section missing wordBank, trying to extract from text');
              const wordBankMatches = section.text.match(/\[\d+:([^\]]+)\]/g) || [];
              const wordBank = wordBankMatches.map(match => {
                const word = match.match(/\[\d+:([^\]]+)\]/);
                return word ? word[1] : '';
              }).filter(Boolean);
              
              if (wordBank.length > 0) {
                section.wordBank = wordBank;
                console.log('Successfully extracted wordBank');
              } else {
                console.log('Could not extract wordBank from text, removing section');
                isValidSection = false;
              }
            }
            if (isValidSection && (!section.teacherNotes || typeof section.teacherNotes !== 'string')) {
              section.teacherNotes = 'Review the vocabulary before attempting to fill in the blanks.';
            }
          }
          
          // Validate sentence unscramble section
          if (section.type === 'sentenceUnscramble') {
            if (!section.sentences || !Array.isArray(section.sentences) || section.sentences.length === 0) {
              console.log('Sentence unscramble section missing sentences, removing section');
              isValidSection = false;
            } else {
              // Validate each sentence (and filter out nulls)
              const validSentences = [];
              for (let j = 0; j < section.sentences.length; j++) {
                const sentence = section.sentences[j];
                if (!sentence || typeof sentence !== 'object') {
                  console.log(`Sentence ${j} is not a valid object, skipping it`);
                  continue; // Skip this sentence
                }
                if (!sentence.words || !Array.isArray(sentence.words) || sentence.words.length === 0) {
                  console.log(`Sentence ${j} missing words array, skipping it`);
                  continue; // Skip this sentence
                }
                if (!sentence.correctSentence || typeof sentence.correctSentence !== 'string') {
                  console.log(`Sentence ${j} missing correctSentence, generating from words`);
                  sentence.correctSentence = sentence.words.join(' ') + '.';
                }
                validSentences.push(sentence);
              }
              section.sentences = validSentences; // Assign the filtered/validated sentences
              
              // If all sentences were invalid after inner validation, remove the section
              if (section.sentences.length === 0) {
                console.log('All sentences were invalid after validation, removing section');
                isValidSection = false;
              }
            }
            if (isValidSection && (!section.teacherNotes || typeof section.teacherNotes !== 'string')) {
              section.teacherNotes = 'This exercise helps students practice word order in English sentences.';
            }
          }
          
          // Validate discussion section
          if (section.type === 'discussion') {
             if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
              console.log('Discussion section missing questions, creating empty array');
              section.questions = [];
            } else {
              // Validate each question (and filter out nulls)
              const validQuestions = [];
              for (let j = 0; j < section.questions.length; j++) {
                let q = section.questions[j];
                let questionObj: any = {}; 
                
                if (typeof q === 'string') {
                  questionObj = { question: q, paragraphContext: null };
                } else if (q && typeof q === 'object') {
                   questionObj = { ...q }; 
                } else {
                  console.log(`Discussion question ${j} is not a valid object, creating default`);
                  questionObj = { question: `Discussion Question ${j + 1}`, paragraphContext: null };
                }
                
                // Ensure question field exists
                if (!questionObj.question || typeof questionObj.question !== 'string') {
                  questionObj.question = questionObj.text || `Discussion Question ${j + 1}`;
                }
                
                // Check for paragraph context
                if (!questionObj.paragraphContext) {
                  questionObj.paragraphContext = questionObj.context || questionObj.paragraph || questionObj.introduction || null;
                }
                validQuestions.push(questionObj);
              }
               section.questions = validQuestions;
            }
          }
          
          // Validate quiz section
          if (section.type === 'quiz') {
            if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
              console.log('Quiz section missing questions, creating empty array');
              section.questions = [];
            } else {
              // Validate each question (and filter out nulls)
              const validQuestions = [];
              for (let j = 0; j < section.questions.length; j++) {
                const question = section.questions[j];
                 if (!question || typeof question !== 'object') {
                  console.log(`Quiz question ${j} is not a valid object, skipping it`);
                   continue;
                 }
                 // Add defaults
                 if (!question.question || typeof question.question !== 'string') question.question = 'Question text missing';
                 if (!question.options || !Array.isArray(question.options) || question.options.length === 0) question.options = ['True', 'False'];
                 if (!question.correctAnswer) question.correctAnswer = question.options[0];
                 
                 validQuestions.push(question);
              }
               section.questions = validQuestions;
            }
          }
          
          // Add valid section to new array
          if (isValidSection) {
            validatedSections.push(section);
          } else {
             console.log(`Section type '${section.type}' (index ${i}) was deemed invalid and removed.`);
          }
        }
        
        // Replace old sections array with validated one
        lessonContent.sections = validatedSections;
        
        // Ensure there is at least one reading section
        // Re-check hasReadingSection on the newly validated array
        hasReadingSection = lessonContent.sections.some(s => s.type === 'reading');
        if (!hasReadingSection) {
          console.log('No valid reading section found after validation, adding a default one');
          // Add to the beginning of the validated array
          lessonContent.sections.unshift({
            type: 'reading',
            title: `Reading: ${lessonContent.title}`,
            paragraphs: ['No reading content available. Please try generating the lesson again.']
          });
        }
        
        // DO NOT add default sections for cloze and sentenceUnscramble
        // Let the UI display the message about using AI to generate custom exercises
        
        // Image generation loop uses validated array
        console.log('Starting image generation loop for Qwen lesson (using validated sections)...');
        for (const section of lessonContent.sections) { // Iterate over the validated array
          // Skip if not a valid section object (redundant check, but safe)
          if (!section || typeof section !== 'object') continue;
          
          // Generate images for Vocabulary
          if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
            console.log(`Found ${section.words.length} vocabulary words, generating images...`);
            // Use Promise.all for potentially faster image generation
            await Promise.all(section.words.map(async (word) => {
              if (word.imagePrompt) {
                try {
                  const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                  word.imageBase64 = await stabilityService.generateImage(word.imagePrompt, requestId);
                } catch (imgError) {
                  console.error(`Error generating image for vocab word ${word.term}:`, imgError);
                  word.imageBase64 = null;
                }
              }
            }));
          }

          // Handle discussion section specially (including image generation)
          if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
             console.log(`Found ${section.questions.length} discussion questions, generating images...`);
             // Use Promise.all for potentially faster image generation
             await Promise.all(section.questions.map(async (q) => {
                if (q.imagePrompt) {
                    try {
                      const requestId = `disc_${q.question ? q.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                      q.imageBase64 = await stabilityService.generateImage(q.imagePrompt, requestId);
                    } catch (imgError) {
                      console.error(`Error generating image for discussion question:`, imgError);
                      q.imageBase64 = null;
                    }
                 }
             }));
          }
        }
        console.log('Finished image generation loop for Qwen lesson.');
      }
      
      return lessonContent;
    } catch (error: any) {
      console.error('Error formatting lesson content:', error);
      return content; // Return original content on formatting error
    }
  }

  /**
   * Special parser for Qwen's unique colon-based format
   * This handles the specific pattern seen in Qwen AI responses where objects use colons as separators
   * It attempts a more robust line-by-line parsing approach.
   */
  private parseQwenColonFormat(content: string): any | null {
    console.log("Attempting robust parsing of Qwen's colon format");
    
    // Basic check for minimum content
    if (!content || content.length < 50) {
      console.log("Content too short, skipping special parser");
      return null;
    }
    
    // Clean up potential markdown and trim
    let cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Attempt to fix the most common structural issues with regex first
    try {
      // Convert "key" : "value" : patterns to "key": "value",
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '"$1": "$2",');
      // Convert "key" : value : (for numbers/booleans) to "key": value,
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*([\d\.\w]+)\s*:/g, '"$1": $2,');
      // Convert array items like , "value" : to , "value",
      cleanedContent = cleanedContent.replace(/,\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, ', "$1",');
      // Convert first array items like [ "value" : to [ "value",
      cleanedContent = cleanedContent.replace(/\[\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '[ "$1",');
      // Remove trailing commas before closing braces/brackets
      cleanedContent = cleanedContent.replace(/,\s*([}\]])/g, '$1');
      // Ensure object starts correctly after a key
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*{/g, '"$1": {');
      // Ensure array starts correctly after a key
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*\[/g, '"$1": [');
      // Fix quotes inside strings that break JSON parsing
      cleanedContent = cleanedContent.replace(/(?<=": ".*?)\\?"(?=.*?")/g, '\\"');
      // Fix missing commas between properties
      cleanedContent = cleanedContent.replace(/}(\s*){/g, '},\n{');
      // Fix missing commas between array items
      cleanedContent = cleanedContent.replace(/}(\s*)\[/g, '},\n[');
      // Fix duplicate commas
      cleanedContent = cleanedContent.replace(/,\s*,/g, ',');
      
      // Remove potential garbage/incomplete structures at the end
      // Find the last valid closing brace or bracket
      const lastBrace = cleanedContent.lastIndexOf('}');
      const lastBracket = cleanedContent.lastIndexOf(']');
      const endPoint = Math.max(lastBrace, lastBracket);
      if (endPoint > 0 && endPoint < cleanedContent.length - 1) {
         // Check nesting to ensure we are closing the root object
         let openBraces = 0;
         let openBrackets = 0;
         for (let i = 0; i <= endPoint; i++) {
            if (cleanedContent[i] === '{') openBraces++;
            else if (cleanedContent[i] === '}') openBraces--;
            else if (cleanedContent[i] === '[') openBrackets++;
            else if (cleanedContent[i] === ']') openBrackets--;
         }
         // Only truncate if we are sure the structure up to endPoint is potentially valid
         // and that it seems to close the root object
         if (openBraces === 0 && openBrackets === 0 && cleanedContent[endPoint] === '}') { 
            console.log(`Truncating potentially corrupt data after index ${endPoint}`);
            cleanedContent = cleanedContent.substring(0, endPoint + 1);
         } else {
            console.log("Could not reliably determine truncation point.");
         }
      } else if (endPoint === -1) {
          console.log("No closing brace/bracket found for truncation.");
          // If there's no closing brace at all, the JSON is likely completely broken
          return null; 
      }

      // Final check: Does it start with { and end with }?
      if (!cleanedContent.startsWith('{') || !cleanedContent.endsWith('}')) {
        console.log("Cleaned content doesn't start/end with braces.")
        // Attempt to find the first { and last }
        const firstBrace = cleanedContent.indexOf('{');
        const lastBraceIdx = cleanedContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBraceIdx > firstBrace) {
          cleanedContent = cleanedContent.substring(firstBrace, lastBraceIdx + 1);
          console.log("Extracted content between first and last brace.")
        } else {
          console.log("Cannot fix start/end braces.");
          return null;
        }
      }
      
      // Try parsing the regex-fixed content
      try {
        const parsedJson = JSON.parse(cleanedContent);
        console.log("Successfully parsed Qwen content after regex fixing.");
        return parsedJson;
      } catch (parseError) {
        // Extra recovery attempt: try to recover partial content
        console.log("Standard JSON parse failed, attempting to extract valid structure manually");
        
        // Try to reconstruct basic lesson structure from the content
        const titleMatch = cleanedContent.match(/"title":\s*"([^"]+)"/);
        const levelMatch = cleanedContent.match(/"level":\s*"([^"]+)"/);
        
        if (titleMatch) {
          console.log("Found title in malformed content, constructing emergency fallback structure");
          // Create a minimal valid structure with what we can extract
          const emergencyStructure = {
            title: titleMatch[1] || "Recovered Lesson",
            sections: [
              {
                type: "reading",
                title: "Reading: " + (titleMatch[1] || "Recovered Content"),
                paragraphs: [
                  "Note: This is a recovered lesson. The original content couldn't be fully parsed.",
                  "Please try again with a different topic or contact support if this issue persists."
                ]
              }
            ]
          };
          
          // Try to extract any paragraphs we can find
          const paragraphMatches = cleanedContent.match(/"paragraphs":\s*\[(.*?)\]/gs);
          if (paragraphMatches && paragraphMatches.length > 0) {
            try {
              // Extract paragraphs from the first match
              const paragraphsJson = paragraphMatches[0].replace(/"paragraphs":\s*/, '');
              const paragraphs = JSON.parse(paragraphsJson);
              if (Array.isArray(paragraphs) && paragraphs.length > 0) {
                emergencyStructure.sections[0].paragraphs = paragraphs;
              }
            } catch (e) {
              console.log("Could not extract paragraphs from malformed content");
            }
          }
          
          return emergencyStructure;
        }
        
        return null;
      }
    } catch (error) {
      console.error("Error during robust Qwen parsing attempt:", error);
      console.log("Failed content sample (start):", content.substring(0, 200));
      console.log("Failed content sample (end):", content.substring(content.length - 200));
      return null; // Indicate failure
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');