import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { stabilityService } from './stability.service';

/**
 * Service for interacting with the Google Gemini AI API
 */
export class GeminiService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Gemini API key is not provided or is empty');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Generate a complete ESL lesson based on the provided parameters
   * @param params Lesson generation parameters
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      console.log('Starting Gemini AI lesson generation...');
      
      // Create unique identifiers for this request (for logging purposes only)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      // Construct the prompt
      const prompt = this.constructLessonPrompt(params);
      
      // Configure the model and features
      // Using Gemini 1.5 Flash model per the latest API documentation
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 16384, // Increased token count from 8192 to 16384 for more detailed lessons
        },
      });
      
      console.log('Sending request to Gemini API...');
      
      try {
        // Make the request to the Gemini API
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        console.log('Received response from Gemini API');
        
        try {
          // First, attempt to clean up the content and remove markdown code block markers
          let cleanedContent = text;
          
          // Check if content starts with ```json and ends with ``` which is common in Gemini responses
          if (text.trim().startsWith('```json') && text.trim().endsWith('```')) {
            console.log('Detected markdown code block, cleaning content');
            cleanedContent = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
          }
          
          // Now try to parse the cleaned content
          try {
            const jsonContent = JSON.parse(cleanedContent);
            console.log('Successfully parsed JSON content');
            
            // Check if jsonContent has required structure
            if (jsonContent.title && jsonContent.sections && Array.isArray(jsonContent.sections)) {
              console.log('Lesson content has valid structure, returning formatted content');
              return await this.formatLessonContent(jsonContent);
            } else {
              console.warn('Parsed JSON is missing required structure');
              return {
                title: `Lesson on ${params.topic}`,
                content: "The generated lesson is missing required structure",
                error: 'Invalid lesson structure',
                provider: 'gemini',
                sections: [
                  {
                    type: "error",
                    title: "Content Error",
                    content: "The lesson structure is incomplete. Please try regenerating the lesson."
                  }
                ]
              };
            }
          } catch (jsonError) {
            // If we fail to parse as JSON, try to handle it as best we can
            console.error('Error parsing Gemini response as JSON:', jsonError);
            
            return {
              title: `Lesson on ${params.topic}`,
              provider: 'gemini',
              sections: [
                {
                  type: "error",
                  title: "Content Error",
                  content: "The lesson could not be properly formatted. Please try regenerating the lesson."
                }
              ]
            };
          }
        } catch (error) {
          console.error('Unexpected error processing Gemini response:', error);
          return {
            title: `Lesson on ${params.topic}`,
            provider: 'gemini',
            sections: [
              {
                type: "error",
                title: "Processing Error",
                content: "An unexpected error occurred. Please try regenerating the lesson."
              }
            ]
          };
        }
      } catch (error: any) {
        console.error('Error during Gemini API request:', error.message);
        return {
          title: `Lesson on ${params.topic}`,
          error: error.message,
          provider: 'gemini',
          sections: [
            {
              type: "error",
              title: "API Error",
              content: `The lesson could not be generated due to an API error: ${error.message}`
            }
          ]
        };
      }
    } catch (error: any) {
      console.error('Error in GeminiService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Constructs a structured prompt for the Gemini AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // We'll set some variables to match what the system prompt expects
    const targetLevel = cefrLevel;
    const text = topic;
    const minVocabCount = 5;
    const maxVocabCount = 5;
    
    // System instruction part
    const systemInstruction = `You are an expert ESL teacher. 
Follow these EXACT requirements:

CRITICAL: Your output must be properly formatted JSON with NO ERRORS!

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER.

4. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

5. TONE & STYLE: Apply the following writing style to ALL generated text (reading, questions, definitions, notes, etc.):
   - Use a warm, accessible, and conversational tone
   - Include interesting facts and observations woven naturally into the narrative
   - Use vivid, descriptive language that brings topics to life
   - Make complex information approachable through clear explanations and engaging examples
   - Use a mix of sentence lengths for good flow
   - Occasionally address the reader directly with rhetorical questions or observations

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

READING TEXT REQUIREMENTS:
1. ORIGINAL CONTENT: Write an original reading text about the topic "${text}".
2. LENGTH REQUIREMENT (CRITICAL): For ${params.cefrLevel} level, your text MUST be AT LEAST ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words long. Shorter texts may be rejected.
3. PARAGRAPH STRUCTURE: Divide your text into 3-5 well-structured paragraphs.
4. SUBSTANTIAL CONTENT: Focus on creating a substantial, informative text appropriate for the topic and level.
5. CEFR ALIGNMENT: Ensure vocabulary and sentence structures match the ${params.cefrLevel} level precisely.
6. TONE & STYLE: Apply the general tone and style requirements mentioned earlier (warm, accessible, vivid language, etc.).

SENTENCE FRAMES REQUIREMENTS:
**Goal:** Explicitly teach high-frequency, versatile sentence patterns relevant to the lesson topic and identified academic language function(s), using an analytical format.

**Step 1: Identify Core Language Function(s)**
- Analyze the main reading text.
- Identify 1-2 key academic language functions essential for understanding the text (e.g., "compare and contrast", "cause and effect", "describing", "sequencing").

**Step 2: Select Authentic & Versatile Sentence Patterns**
- Choose 1-2 sentence frame **patterns** that:
    a) Directly correspond to the identified language function(s).
    b) Are **high-frequency and commonly used** in authentic English conversation and writing.
    c) Are **versatile** and can be adapted to various contexts beyond just this specific lesson topic.
    d) Are **appropriate for the target CEFR level** (${params.cefrLevel}). Use simpler, core patterns for lower levels (A1/A2) and more complex/nuanced but still genuinely useful patterns for higher levels (B1-C2). Avoid overly obscure or purely academic structures unless appropriate for C1/C2 and the topic.

**Step 3: Generate Deconstructed Explanation**
- For each selected pattern, provide the following information in the specified JSON structure:

- **pattern:** (String) The sentence frame pattern with blanks shown as "_____". Ensure blanks represent meaningful chunks (phrases/clauses).
- **level:** (String) Difficulty level relative to the CEFR level ("basic", "intermediate", or "advanced").
- **title:** (String) Short title describing the pattern's purpose (e.g., "Comparing X and Y", "Explaining Cause").
- **usage:** (String) When/how this pattern is typically used in real conversation/writing.
- **communicativeFunction:** (String) The specific academic language function being practiced.
- **grammarFocus:** (String) The key grammar structure(s) exemplified, explained simply.
- **structureBreakdown:** (Array of Objects) An array breaking down the pattern into its core components. Each object should have:
    - componentName: (String) e.g., "Cause Element", "Concession Clause", "Main Point".
    - description: (String) Brief explanation of the component's role in the pattern.
    - examples: (Array of Strings) 2-3 varied examples of phrases or clauses that could fit *this specific component* slot.
- **exampleSentences:** (Array of Strings) 1-2 complete, natural-sounding example sentences demonstrating the full pattern in use with lesson-relevant vocabulary.
- **practicePrompt:** (String) A prompt encouraging students to create their own sentence using the pattern, possibly relating it to their experience or the lesson content.
- **teachingTips:** (String) Concise, practical advice for teachers on how to present and practice this pattern and its components.

CRITICAL ISSUES TO AVOID:
1. Do NOT choose obscure, rarely used sentence patterns (unless C1/C2 level justifies it).
2. Ensure the structureBreakdown accurately reflects the pattern.
3. Ensure the examples within the structureBreakdown correctly fit their corresponding component slot.
4. Ensure the final exampleSentences correctly use the pattern and make sense contextually.
5. Keep explanations (description, usage, grammarFocus) clear and concise for the target CEFR level.
6. DO NOT create patterns that are so specific they can only be used in one particular scenario
7. **CRITICAL:** Ensure the generated pattern structure works grammatically and semantically with the content provided in the structureBreakdown examples and the exampleSentences. The phrases must fit naturally into the pattern's slots.
8. **AVOID phrase duplication:** Ensure the phrases provided as examples within the structureBreakdown do not duplicate verbs or key structural words already present in the static parts of the pattern.

IMPLEMENTATION REQUIREMENT: Provide 1-2 complete frame objects per lesson, each containing all the specified fields (pattern, level, title, usage, communicativeFunction, grammarFocus, structureBreakdown, exampleSentences, practicePrompt, teachingTips).

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

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS AND PRONUNCIATION:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2, phoneticGuide: "dis-suh-LOO-shun"

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6, phoneticGuide: "in-DUS-tree-ul REV-uh-LOO-shun"
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0, phoneticGuide: "CLY-mit chaynj"

CRITICALLY IMPORTANT: Always use ONLY regular English characters and hyphens for phoneticGuide. NEVER use IPA phonetic symbols like "ə", "ɪ", or "ʃ". Use simple English spelling to approximate sounds.

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

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
  "title": "Descriptive lesson title about ${text}",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
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
    // SENTENCE FRAMES SECTION (Explanatory Format)
    {
      "type": "sentenceFrames",
      "title": "Sentence Pattern Analysis", // Or similar title
      "frames": [
        {
          "pattern": "[CAUSE] spurred [EFFECT] because [REASON].",
          "level": "intermediate",
          "title": "Explaining Reasons for Developments",
          "usage": "Use this pattern to explain the cause, effect, and reason behind events.",
          "communicativeFunction": "Explaining Cause/Effect/Reason",
          "grammarFocus": "Using past tense verbs, 'because' conjunction",
          "structureBreakdown": [
            { "componentName": "CAUSE", "description": "What started the chain of events?", "examples": ["The discovery", "Increased funding", "Public interest"] },
            { "componentName": "EFFECT", "description": "What was the direct result?", "examples": ["new research", "faster development", "more volunteers"] },
            { "componentName": "REASON", "description": "Why did the cause lead to the effect?", "examples": ["it opened new possibilities", "resources were available", "people were excited"] }
          ],
          "exampleSentences": [
            "The launch of Sputnik 1 spurred the US space program because it highlighted a technology gap.",
            "Increased funding spurred faster development because more researchers could be hired."
          ],
          "practicePrompt": "Create your own sentence using this pattern: [CAUSE] spurred [EFFECT] because [REASON]. Try to use vocabulary from the lesson.",
          "teachingTips": "Discuss each component with students. Elicit more examples for each component before asking students to write their own sentences."
        }
        // (Potentially include 1 more frame object)
      ]
    },
    // CLOZE SECTION (Complete - Fill in the Blanks)
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph with blanks, using [1:word] format for the first blank, [2:word] for the second, etc. Use appropriate vocabulary from the lesson...",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
    },
    // SENTENCE UNSCRAMBLE SECTION (Complete - Word Ordering)
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {
          "words": ["Complete", "array", "of", "individual", "words", "in", "scrambled", "order"],
          "correctSentence": "Complete array of individual words in correct order."
        },
        {
          "words": ["Another", "set", "of", "words", "in", "scrambled", "order"],
          "correctSentence": "Another set of words in correct order."
        },
        {
          "words": ["One", "more", "sentence", "with", "words", "out", "of", "order"],
          "correctSentence": "One more sentence with words in correct order."
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

Ensure the entire output is a single, valid JSON object starting with { and ending with }.`;

    return systemInstruction;
  }
  
  /**
   * Format and process the lesson content, adding image data
   */
  private async formatLessonContent(content: any): Promise<any> {
    // Add provider identifier to the content
    const lessonContent = {
      ...content,
      provider: 'gemini'
    };
    
    // Generate images if sections exist
    if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
      console.log('Starting image generation loop for Gemini lesson...');
      for (const section of lessonContent.sections) {
        if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
          console.log(`Found ${section.words.length} vocabulary words, generating images...`);
          for (const word of section.words) {
            if (word.imagePrompt) {
               try {
                 // Generate unique ID for logging
                 const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                 word.imageBase64 = await stabilityService.generateImage(word.imagePrompt, requestId);
               } catch (imgError) {
                 console.error(`Error generating image for vocab word ${word.term}:`, imgError);
                 word.imageBase64 = null; // Ensure field exists even on error
               }
            }
          }
        }
        if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
            console.log(`Found ${section.questions.length} discussion questions, generating images...`);
          for (const question of section.questions) {
            // Ensure each question has its own paragraphContext
            // This field is already provided in the template - just make sure it's intact
            if (!question.paragraphContext && section.paragraphContext) {
              // If a question is missing individual context but section has a shared one,
              // copy it to the question (happens in some Gemini responses)
              question.paragraphContext = section.paragraphContext;
              console.log("Added section-level paragraphContext to discussion question");
            }
            
            // If still no paragraphContext, look for other fields that might contain it
            if (!question.paragraphContext) {
              if (question.introduction && typeof question.introduction === 'string') {
                // If the introduction field looks like a paragraph (multiple sentences, no question marks)
                // then we store it as paragraphContext for the UI to render properly
                if (question.introduction.includes('.') && !question.introduction.includes('?')) {
                  question.paragraphContext = question.introduction;
                  console.log("Setting paragraphContext from introduction field");
                }
              } else if (question.context && typeof question.context === 'string') {
                question.paragraphContext = question.context;
                console.log("Setting paragraphContext from context field");
              } else if (question.paragraph && typeof question.paragraph === 'string') {
                question.paragraphContext = question.paragraph;
                console.log("Setting paragraphContext from paragraph field");
              }
            }
            
            // Generate image if prompt exists
            if (question.imagePrompt) {
               try {
                 // Generate unique ID for logging - use part of question text
                 const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                 question.imageBase64 = await stabilityService.generateImage(question.imagePrompt, requestId);
               } catch (imgError) {
                  console.error(`Error generating image for discussion question:`, imgError);
                  question.imageBase64 = null; // Ensure field exists even on error
               }
            }
          }
        }
        // Add loops for other sections needing images if necessary (e.g., warmup)
      }
      console.log('Finished image generation loop for Gemini lesson.');
    } else {
        console.log('No sections found or sections is not an array, skipping image generation.');
    }
    
    return lessonContent;
  }
}

export const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '');