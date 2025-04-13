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
- NEW REQUIREMENT: 2-4 sentence frames and templates appropriate for the ${params.cefrLevel} level to help students with sentence structure and grammar

SENTENCE FRAMES REQUIREMENTS:
For each sentence frame, create practical, meaningful templates that students can use in real communication about "${params.topic}".

KEY REQUIREMENTS FOR SENTENCE FRAMES:

1. AUTHENTIC COMMUNICATION: Create frames that students will actually use in real-world conversations about "${params.topic}". They should sound natural, not contrived or overly academic.

2. VOCABULARY INTEGRATION: Each frame MUST incorporate at least one of the vocabulary words from your lesson's vocabulary list to reinforce learning.

3. CONTENT CONNECTION: The frames must connect directly to the main reading text's content, themes, or concepts.

4. CLEAR FORMATTING: Use "_____" (exactly 5 underscores) consistently for blanks. No parentheses, variables, or other formats.

5. PURPOSEFUL DESIGN: Each frame should serve a specific communicative function that's useful for discussing "${params.topic}" (e.g., expressing opinions, making comparisons, describing processes).

6. SCAFFOLDED COMPLEXITY: Provide a mix of complexity levels appropriate for ${params.cefrLevel} students - from simpler to more advanced structures within the target CEFR level.

7. REALISTIC EXAMPLES: Include 2-3 example sentences that:
   - Use the frame pattern naturally
   - Incorporate vocabulary from your lesson
   - Relate directly to the reading text content
   - Model authentic language use at the ${params.cefrLevel} level
   - Sound like something a student would actually say in conversation

For each sentence frame, include ALL of the following properties in a structured JSON format:

- pattern: The sentence frame with blanks shown as "_____" (e.g., "I think _____ is important because _____.")
- examples: Array of 2-3 complete, natural-sounding example sentences using vocabulary from the lesson
- level: Difficulty level relative to the CEFR level ("basic", "intermediate", or "advanced")
- title: Short, descriptive title (3-5 words) that explains the communicative purpose
- usage: When and how to use this pattern in real-world situations (2-3 sentences)
- communicativeFunction: The specific real-world purpose (e.g., "Expressing preferences", "Making predictions")
- grammarFocus: The grammar structure being practiced, explained simply (e.g., "Present perfect with 'for' and 'since'")
- teachingTips: Practical advice for teachers on how to present and practice this pattern (3-4 sentences)

CEFR-SPECIFIC GUIDELINES:
For ${params.cefrLevel} level students, create frames with appropriate complexity:

- A1 LEVEL FRAMES: 3-4 very simple frames using:
  • Basic subject-verb-object structures
  • Present simple tense only
  • Common everyday vocabulary
  • 1-2 blanks maximum per frame
  • Example: "I like _____ because it's _____."

- A2 LEVEL FRAMES: 3-4 frames using:
  • Simple conjunctions (and, but, because)
  • Present and past simple tenses
  • Basic modals (can, should)
  • 1-2 blanks per frame
  • Example: "In my country, people usually _____ when they _____."

- B1 LEVEL FRAMES: 2-3 frames with:
  • Varied tenses (present perfect, conditionals)
  • Expressing opinions with supporting reasons
  • Comparing and contrasting
  • 2-3 blanks per frame
  • Example: "Although many people believe _____, I think _____ because _____."

- B2 LEVEL FRAMES: 2-3 frames with:
  • Complex sentences with multiple clauses
  • Expressing hypothetical situations
  • Discussing advantages/disadvantages
  • 2-3 blanks strategically placed
  • Example: "One of the main advantages of _____ is _____, which can lead to _____."

- C1/C2 LEVEL FRAMES: 1-2 sophisticated frames with:
  • Nuanced language for expressing complex ideas
  • Academic language patterns for discussing abstract concepts
  • Critical thinking structures
  • 2-3 blanks in meaningful positions
  • Example: "Recent research suggests that _____, which contradicts the conventional wisdom that _____, indicating that _____."

CRITICAL ISSUES TO AVOID:
1. DO NOT create frames that are too theoretical or academic for real conversation
2. DO NOT use blanks for every other word - be strategic with blank placement
3. DO NOT include confusing grammar terminology in the pattern
4. DO NOT create frames with vocabulary beyond the ${params.cefrLevel} level
5. DO NOT create frames unrelated to "${params.topic}" - they must be topic-specific
6. DO NOT create patterns that are so specific they can only be used in one particular scenario

IMPLEMENTATION REQUIREMENT: Each frame must be a complete JSON object with ALL the required fields populated.

For teacher instructions:
1. Focus on practical classroom activities related to the specific topic
2. Suggest conversation prompts that use the frame and topic vocabulary
3. Provide ideas that will work in screen-sharing scenarios where students interact verbally
4. Keep instructions concise and action-oriented

VOCABULARY REQUIREMENTS:
For each vocabulary item, you MUST include:
1. The word itself (ENGLISH ONLY - NO FOREIGN WORDS)
2. A clear definition using language appropriate for ${params.cefrLevel} level students
3. The part of speech (noun, verb, adjective, etc.)
4. An example sentence using language appropriate for ${params.cefrLevel} level
5. ENHANCED (REQUIRED): semanticGroup - Words must be grouped thematically. Each semantic group MUST have 2-3 related vocabulary words (e.g., "Weather Terms", "Food Vocabulary", "Travel Expressions")
6. ENHANCED (REQUIRED): additionalExamples - 2-3 additional example sentences showing the word in different contexts
7. ENHANCED (REQUIRED): wordFamily - An object containing:
   - words: An array of 2-5 related words from the same word family (e.g., "happy, happiness, happily, unhappy")
   - description: A brief explanation of how these words are related
8. Common collocations (phrases that often include this word) as an array of strings
9. Usage notes written with ${params.cefrLevel} level appropriate language
10. Teaching tips
11. Pronunciation information with:
   - syllables: The word broken down into syllables as an array of strings
   - stressIndex: Which syllable receives primary stress (zero-based index)
   - phoneticGuide: A simplified pronunciation guide using regular characters
12. An image prompt (NEW!) - A detailed description (2-3 sentences) of what an image for this word should look like. The image prompt should:
   - Clearly illustrate the meaning of the word in a visual way
   - Include specific visual elements that relate to the example sentence
   - Be detailed enough for an AI image generator to create a clear, relevant image
   - Specify NO text or words should appear in the image
   - Example: For "tradition" - "A family gathered around a Thanksgiving table with a turkey and traditional dishes, showing multiple generations celebrating this American tradition. The scene should be warm and inviting, showing the passing down of cultural practices. No text or words should appear in the image."

CEFR LEVEL-APPROPRIATE VOCABULARY SELECTION GUIDELINES:
- A1: Choose words beyond the 500 most common words. Avoid very basic words like "hi", "hello", "yes", "no".
- A2: Choose words beyond the 1000 most common words.
- B1: Choose intermediate-level vocabulary (beyond the 2000 most common words).
- B2: Choose upper-intermediate vocabulary (beyond the 3000 most common words).
- C1: Choose advanced vocabulary (beyond the 4000 most common words).
- C2: Choose sophisticated vocabulary that would challenge even advanced learners.

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

WARM-UP ACTIVITY REQUIREMENTS:
- CRITICALLY IMPORTANT: Your warm-up activity MUST incorporate ALL vocabulary items from your vocabulary list. Check this carefully!
- Each vocabulary word MUST be explicitly mentioned and used in the warm-up activity
- Ensure students are introduced to all vocabulary before the reading
- Design an engaging activity that gets students familiar with these words
- In your procedure section, make sure EVERY vocabulary word is used at least once
- The system will check that each vocabulary word appears in the warm-up - if any are missing, the lesson will be rejected

PRIOR KNOWLEDGE ACTIVATION FOR WARM-UPS:
Design your warm-up activity to explicitly connect the lesson topic "${params.topic}" to students' existing knowledge and real-life experiences:

1. START WITH PERSONAL CONNECTION: Begin with 2-3 personalized questions that students can answer from their own experience, regardless of their knowledge about the topic
   - Make these questions appropriate for ${params.cefrLevel} level students

2. BRIDGE TO NEW VOCABULARY: Create activities that naturally incorporate the target vocabulary while still relating to students' experiences

3. SCAFFOLDED KNOWLEDGE MAPPING: Include a brief activity that helps students visualize and connect what they already know to what they're about to learn, appropriate for their CEFR level

CULTURAL ADAPTABILITY:
Ensure the warm-up provides flexible entry points for students from diverse backgrounds:
- Offer universal examples
- Include alternative prompts for culturally specific references 
- Avoid assumptions about specific experiences

VISUAL CONNECTIONS:
Create guidance for connecting vocabulary to visual elements:
- Describe everyday situations where vocabulary naturally appears
- Compare familiar concepts with new vocabulary
- Connect vocabulary to images that relate to students' experiences

DISCUSSION QUESTION REQUIREMENTS:
- IMPORTANT NEW FORMAT: Each discussion question MUST be preceded by its own unique, CEFR-level appropriate paragraph (3-5 sentences) that provides context or an interesting angle related to the question. The question should directly relate to this paragraph.
- You MUST provide EXACTLY 5 such paragraph-question pairs.
- The paragraph should:
  - Be written at the appropriate CEFR level (${params.cefrLevel})
  - Focus on something interesting and thought-provoking related to the question topic
  - Create a foundation for meaningful discussion
  - Relate directly to the vocabulary being learned
  - Avoid simply summarizing the main reading
  - CRITICAL: The language complexity MUST match exactly the ${params.cefrLevel} level
  - Be designed to stand out visually when displayed in the UI
  
CEFR LEVEL PARAGRAPH GUIDELINES:
- A1: 3 simple sentences, present tense, basic vocabulary only. No complex structures.
  Example: "Many people have pets. Cats and dogs are common pets. Some people like fish or birds."
- A2: 3-4 sentences, simple present and past tense, everyday vocabulary.
  Example: "Last week, I visited a zoo. I saw many animals there. The elephants were very big. Some monkeys played with toys."
- B1: 4 sentences of moderate complexity, wider vocabulary range, some conjunctions.
  Example: "Many cities have problems with traffic congestion. Cars and buses often get stuck in traffic jams during rush hours. Some cities are building new subway lines to help people travel faster. Public transportation can reduce pollution and save time."
- B2: 4-5 sentences with varied structures, more sophisticated vocabulary, and some complex clauses.
  Example: "The rapid development of artificial intelligence has transformed many industries in recent years. While some experts believe AI will create new job opportunities, others worry about potential job losses. Universities are now offering specialized courses to help students adapt to this changing landscape. Despite concerns, many businesses are investing heavily in AI solutions to remain competitive."
- C1/C2: 5 sophisticated sentences with advanced vocabulary, complex clauses, and nuanced expression.
  Example: "The intersection of technology and privacy rights presents one of the most formidable challenges of the digital era. As corporations amass unprecedented quantities of personal data, legislators worldwide struggle to establish regulatory frameworks that adequately protect citizens while fostering innovation. The concept of informed consent has become increasingly problematic in an environment where terms of service agreements are seldom read, let alone comprehended. Furthermore, the transnational nature of data flows complicates enforcement efforts, as information routinely traverses jurisdictional boundaries. These complexities necessitate a multifaceted approach involving stakeholders from various sectors of society."
- The discussion question should:
  - Directly follow its context paragraph.
  - Be phrased as an interesting prompt that encourages different viewpoints
  - Include topics that could generate healthy debate between teacher and student
  - Range from simpler questions to more thought-provoking debates
  - Be appropriate for one-on-one teaching via screen sharing
  - Encourage use of the target vocabulary
  - Be designed for in-depth conversation, not just short answers
  - Reference specific content from both its context paragraph and the main reading

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
    // SENTENCE FRAMES SECTION (Complete - 2-5 frames)
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "frames": [
        {
          "pattern": "Complete pattern like _____ because ____.", "examples": ["Complete example 1...", "Complete example 2..."],
          "usageNotes": "Complete usage notes...", "teachingTips": "Complete tips...", "difficultyLevel": "intermediate",
          "grammarFocus": "Complete grammar focus...", "communicativeFunction": "Complete function..."
        },
        // (Include 1-4 more complete frames)
      ]
    },
    // CLOZE SECTION (Complete - Fill in the Blanks)
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph with blanks, using [1:word] format...", // Placeholder text
      "wordBank": ["word1", "word2", "word3", "word4", "word5"], // Placeholder words
      "teacherNotes": "Complete notes on how to use this exercise effectively..." // Placeholder notes
    },
    // SENTENCE UNSCRAMBLE SECTION (Complete - Word Ordering)
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {
          "words": ["Complete", "array", "of", "scrambled", "words"], // Placeholder words
          "correctSentence": "Complete correct sentence." // Placeholder sentence
        }
        // (Include 2-4 more complete sentences)
      ],
      "teacherNotes": "Complete notes on how to use this exercise effectively..." // Placeholder notes
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

- "I like to eat _____."

- "My favorite _____ is _____."

- "I can _____ very well."

- "In the morning, I _____."

A2 Examples:

- "Last weekend, I went to _____ and I saw _____."

- "I usually _____ because I think it's _____."

- "I would like to _____ next _____."

- "If I have time, I will _____."

B1 Examples:

- "I think that _____ is important because _____."

- "Although many people believe _____, I think _____."

- "When I was younger, I used to _____, but now I _____."
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
      const parsedJson = JSON.parse(cleanedContent);
      console.log("Successfully parsed Qwen content after regex fixing.");
      return parsedJson;

    } catch (error) {
      console.error("Error during robust Qwen parsing attempt:", error);
      console.log("Failed content sample (start):", content.substring(0, 200));
      console.log("Failed content sample (end):", content.substring(content.length - 200));
      return null; // Indicate failure
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');