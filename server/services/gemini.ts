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
      
      // Create logs directory if it doesn't exist
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs', { recursive: true });
      }
      
      // Create unique identifiers for this request
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      // Construct the prompt
      const prompt = this.constructLessonPrompt(params);
      
      // Save the raw prompt as plain text
      const rawPromptPath = `./logs/RAW_prompt_gemini_${requestId}.txt`;
      fs.writeFileSync(rawPromptPath, prompt);
      console.log(`Raw prompt saved to ${rawPromptPath}`);
      
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
        
        // Save the raw response
        const fullResponsePath = `./logs/FULL_response_gemini_${requestId}.json`;
        fs.writeFileSync(
          fullResponsePath,
          JSON.stringify(result, null, 2)
        );
        console.log(`Response saved to ${fullResponsePath}`);
        
        // Save raw content
        const contentPath = `./logs/RAW_message_content_gemini_${requestId}.txt`;
        fs.writeFileSync(contentPath, text);
        console.log(`Raw message content saved to ${contentPath}`);
        
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

4. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. This is mandatory.

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
`;
    
    // Use the more detailed Qwen prompt structure as the main prompt for Gemini
    const mainPrompt = `
You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience.

TASK OVERVIEW:
You will create a complete ESL lesson for ${targetLevel} level students on the topic "${text}".

STEP 1: WRITE A READING TEXT
- First, write an original reading text about the topic "${text}"
- Use a warm, accessible, and conversational tone
- Include interesting facts and observations woven naturally into the narrative
- Use vivid, descriptive language that brings topics to life
- Make complex information approachable through clear explanations and engaging examples
- Use a mix of sentence lengths for good flow
- Occasionally address the reader directly with rhetorical questions or observations

- CRITICAL REQUIREMENT: For ${targetLevel} level, your text MUST be AT LEAST ${targetLevel === "B1" ? "200" : targetLevel === "C2" ? "500" : targetLevel === "C3" ? "600" : targetLevel === "A1" || targetLevel === "A2" ? "100" : "300"} words
- Your text will be REJECTED if it's shorter than ${targetLevel === "B1" ? "200" : targetLevel === "C2" ? "500" : targetLevel === "C3" ? "600" : targetLevel === "A1" || targetLevel === "A2" ? "100" : "300"} words
- The system counts words by splitting on whitespace - make sure you have enough actual words
- Divide your text into 3-5 paragraphs with clear paragraph breaks (use double line breaks between paragraphs)
- Focus on creating a substantial, informative text before moving on to other components
- Make sure the vocabulary and sentence structures remain appropriate for ${targetLevel} level students
- For lower levels (A1, A2), simplify the language while maintaining a friendly, engaging tone
- For higher levels (B2, C1, C2), use richer vocabulary and more complex sentences

STEP 2: CREATE LESSON COMPONENTS
After writing the reading text, create:
- CRITICAL REQUIREMENT: You MUST include EXACTLY ${minVocabCount} vocabulary items from your text. The system requires a minimum of ${minVocabCount} vocabulary items and will REJECT the lesson if fewer are provided.
- ABSOLUTELY CRITICAL: Each semantic group MUST contain at least 2-3 vocabulary words. DO NOT create groups with only one word.
- DO NOT include basic words like "hi", "hello", "goodbye", or other extremely common words as vocabulary items.
- Only choose words that are appropriate for the CEFR level ${targetLevel} and would be genuinely useful for students to learn.
- EXTREMELY IMPORTANT: Choose ONLY English words for vocabulary. DO NOT include foreign words (like "la bise," "sayonara," "wai," etc.) even if they appear in your text when discussing other cultures. ONLY ENGLISH VOCABULARY should be selected.
- EXACTLY 3-5 reading comprehension activities - YOU MUST INCLUDE AT LEAST 3
- 1-2 pre-reading discussion questions
- EXACTLY 5-7 post-reading discussion questions - YOU MUST INCLUDE AT LEAST 5, and each question MUST directly reference specific content from your reading text
- A brief warm-up activity that MUST incorporate all vocabulary items from your vocabulary list, not just one word
- NEW REQUIREMENT: 2-4 sentence frames and templates appropriate for the ${targetLevel} level to help students with sentence structure and grammar

SENTENCE FRAMES REQUIREMENTS:
For each sentence frame, include:
1. The pattern (e.g., "I think that _____ because _____.")
2. 2-3 example sentences using the pattern and vocabulary from the lesson
3. Usage notes explaining when and how to use this pattern
4. Teaching tips for introducing and practicing the pattern
5. Difficulty level (basic, intermediate, or advanced) relative to the overall CEFR level
6. Grammar focus (what grammar point this pattern helps practice)
7. Communicative function (e.g., expressing opinions, making comparisons, etc.)

Tailor the complexity and number of sentence frames based on CEFR level:
- A1: 3-4 very simple frames with basic structures (subject + verb + object). Focus on present tense, personal information, and everyday needs. Example: "I like ____." or "This is ____."
- A2: 3-4 simple frames that may include one conjunction or preposition. Introduce basic past tense, simple questions, and descriptions. Example: "I went to ____ yesterday and I saw ____."
- B1: 2-3 frames with moderate complexity. Include various tenses, modal verbs, and expressions of opinion. Example: "I think ____ is important because it helps people to ____ and also ____."
- B2: 2-3 more complex frames with multiple clauses, conditionals, or comparisons. Example: "Although many people believe ____, I would argue that ____ because ____."
- C1/C2: 1-2 sophisticated frames with complex structures, academic language, or nuanced expressions. Example: "Despite the widespread assumption that ____, recent evidence suggests that ____, which implies that ____."

CEFR-SPECIFIC EXAMPLES:

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
- "I believe that _____ is _____ because _____, although some people think _____."
- "When I was _____, I used to _____, but now I prefer to _____."
- "I've always wanted to _____, which would allow me to _____."

B2 Examples:
- "While it's often argued that _____, I would suggest that _____, particularly when considering _____."
- "Having _____, I now realize that _____, which has led me to _____."
- "If I had the opportunity to _____, I would definitely _____, as it would enable me to _____."

C1/C2 Examples:
- "Despite the prevailing view that _____, a more nuanced analysis reveals _____, which consequently _____."
- "The extent to which _____ influences _____ remains a subject of debate; however, what cannot be disputed is that _____, regardless of how _____."

IMPORTANT: Make frames progressively more complex from basic to advanced within each CEFR level. Each frame should:
1. Be meaningful and authentic to real communication
2. Include opportunities for personalization and creativity
3. Incorporate elements from the lesson vocabulary and topic
4. For higher levels (B1+), add elements like follow-up questions, conditionals, or alternatives

For teacher instructions (only shown in teacher view):
1. Include specific drilling techniques relevant to the frame
2. Suggest pair/group activities to practice the frame
3. Provide ideas for extending the frame through additional questions
4. Recommend error correction strategies for common mistakes
5. Suggest ways to adapt the frame for different proficiency levels within the class

AVOID:
1. Creating frames that are too artificial or overly complex for the level
2. Using vocabulary beyond the target CEFR level
3. Making frames too topic-specific (they should be adaptable)
4. Creating frames with too many blanks or complex structures for lower levels

VOCABULARY REQUIREMENTS:
For each vocabulary item, you MUST include:
1. The word itself (ENGLISH ONLY - NO FOREIGN WORDS)
2. A clear definition using language appropriate for ${targetLevel} level students
3. The part of speech (noun, verb, adjective, etc.)
4. An example sentence using language appropriate for ${targetLevel} level
5. Common collocations (phrases that often include this word)
6. Usage notes written with ${targetLevel} level appropriate language
7. Teaching tips
8. Pronunciation information with:
   - syllables: The word broken down into syllables as an array of strings
   - stressIndex: Which syllable receives primary stress (zero-based index)
   - phoneticGuide: A simplified pronunciation guide using regular characters
9. An image prompt (NEW!) - A detailed description (2-3 sentences) of what an image for this word should look like. The image prompt should:
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

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

CEFR LEVEL ALIGNMENT:
Ensure all content is appropriate for ${targetLevel} level students:
- CRITICAL: Use vocabulary appropriate for ${targetLevel} level in ALL questions and instructions
- For post-reading discussion questions, ensure the language complexity matches ${targetLevel} level
- Adjust question complexity based on the CEFR level (simpler for A1/A2, more complex for C1/C2)

WARM-UP ACTIVITY REQUIREMENTS:
- CRITICALLY IMPORTANT: Your warm-up activity MUST incorporate ALL vocabulary items from your vocabulary list. Check this carefully!
- Each vocabulary word MUST be explicitly mentioned and used in the warm-up activity
- Ensure students are introduced to all vocabulary before the reading
- Design an engaging activity that gets students familiar with these words
- In your procedure section, make sure EVERY vocabulary word is used at least once
- The system will check that each vocabulary word appears in the warm-up - if any are missing, the lesson will be rejected

DISCUSSION QUESTION REQUIREMENTS:
- IMPORTANT NEW FORMAT: Each discussion question MUST be preceded by its own unique, CEFR-level appropriate paragraph (3-5 sentences) that provides context or an interesting angle related to the question. The question should directly relate to this paragraph.
- You MUST provide EXACTLY 5 such paragraph-question pairs.
- The paragraph should:
  - Be written at the appropriate CEFR level (${targetLevel})
  - Focus on something interesting and thought-provoking related to the question topic
  - Create a foundation for meaningful discussion
  - Relate directly to the vocabulary being learned
  - Avoid simply summarizing the main reading
  - CRITICAL: The language complexity MUST match exactly the ${targetLevel} level
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

IMPORTANT: Adjust question complexity based on the CEFR level (${targetLevel}):
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
          "collocations": ["phrase1", "phrase2"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word2", "partOfSpeech": "verb", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word3", "partOfSpeech": "adj", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word4", "partOfSpeech": "adv", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word5", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
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
        {"question": "Complete Question 1?", "options": ["A", "B"], "answer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Question 2?", "options": ["A", "B", "C"], "answer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Question 3?", "options": ["A", "B", "C", "D"], "answer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Question 4?", "options": ["True", "False"], "answer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Question 5?", "options": ["True", "False"], "answer": "False", "explanation": "Complete explanation..."}
      ]
    },
    // SENTENCE FRAMES SECTION (Complete - 2-5 frames)
    {
      "type": "sentenceFrames", // Renamed from 'sentences' to match Qwen
      "title": "Sentence Practice",
      "frames": [
        {
          "pattern": "Complete pattern like _____ because ____.", "examples": ["Complete example 1...", "Complete example 2..."],
          "usageNotes": "Complete usage notes...", "teachingTips": "Complete tips...", "difficultyLevel": "intermediate",
          "grammarFocus": "Complete grammar focus...", "communicativeFunction": "Complete function..."
        }
        // (Include 1-4 more complete frames)
      ]
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
        {"question": "Complete Quiz Q1?", "options": ["A", "B"], "answer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q2?", "options": ["A", "B", "C"], "answer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q3?", "options": ["A", "B", "C", "D"], "answer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q4?", "options": ["True", "False"], "answer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q5?", "options": ["True", "False"], "answer": "False", "explanation": "Complete explanation..."}
      ]
    }
  ]
}

Ensure the entire output is a single, valid JSON object starting with { and ending with }.`;

    return systemInstruction + mainPrompt;
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