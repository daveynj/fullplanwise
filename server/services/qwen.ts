import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';

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

      const prompt = this.constructLessonPrompt(params);
      console.log('Constructed prompt successfully');
      
      // Use qwen-max model with longer outputs
      const modelName = "qwen-max";
      
      // Request payload following OpenAI-compatible format for the international endpoint
      const requestBody = {
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: `You are an expert ESL teacher. Follow these EXACT requirements:

CRITICAL: Your output must be properly formatted JSON with NO ERRORS!

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   CORRECT: "words": [{"term": "vocabulary1", "partOfSpeech": "noun", ...}, {"term": "vocabulary2", ...}]
   WRONG: "words": 5

2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER. The reading text, vocabulary, and all exercises must directly relate to the topic. Default/generic content is not acceptable.

4. REQUIRED CONTENT IN EACH LESSON:
   - Reading: EXACTLY 5 paragraphs as an ARRAY, EACH paragraph MUST have 3-4 complete sentences (min. 15 total)
   - Vocabulary: EXACTLY 5 vocabulary words with complete details as an ARRAY OF OBJECTS
   - Warm-up: EXACTLY 5 questions AND 5 target vocabulary words (both in array format)
   - Comprehension: EXACTLY 5 questions as an ARRAY OF OBJECTS with question, options, answer, and explanation
   - Sentence Frames: EXACTLY 2-5 sentence frames as an ARRAY OF OBJECTS with pattern, examples, etc.
   - Discussion: EXACTLY 5 discussion questions as an ARRAY OF STRINGS
   - Quiz: EXACTLY 5 quiz questions as an ARRAY OF OBJECTS with options and answers

EXTREMELY IMPORTANT: ALWAYS return FULL OBJECT STRUCTURES with ALL content, NEVER just counts or numbers.` 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.3, 
        top_p: 0.9,
        max_tokens: 5000,
        response_format: { type: "json_object" }
      };
      
      console.log(`Using model: ${modelName}`);
      console.log('Request endpoint:', QWEN_API_URL);
      
      // Make the API request
      try {
        // Create logs directory if it doesn't exist
        if (!fs.existsSync('./logs')) {
          fs.mkdirSync('./logs', { recursive: true });
        }
        
        // Create unique identifiers for this request
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const requestId = `${topicSafe}_${timestamp}`;
        
        // Save the raw prompt as plain text
        const rawPromptPath = `./logs/RAW_prompt_${requestId}.txt`;
        fs.writeFileSync(rawPromptPath, prompt);
        console.log(`Raw prompt saved to ${rawPromptPath}`);
        
        console.log('Sending request to Qwen API...');
        
        const response = await axios({
          method: 'post',
          url: QWEN_API_URL,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          data: requestBody,
          timeout: 180000 // 3 minute timeout
        });
        
        console.log('Received response from Qwen API');
        
        // Save ABSOLUTELY EVERYTHING in the response
        const fullResponsePath = `./logs/FULL_response_${requestId}.json`;
        fs.writeFileSync(
          fullResponsePath,
          JSON.stringify(response.data, null, 2)
        );
        console.log(`ABSOLUTELY EVERYTHING in the response saved to ${fullResponsePath}`);
        
        // Save raw choices content
        if (response.data?.choices?.[0]?.message?.content) {
          const contentPath = `./logs/RAW_message_content_${requestId}.txt`;
          fs.writeFileSync(contentPath, response.data.choices[0].message.content);
          console.log(`Raw message content saved to ${contentPath}`);
        }
        
        // Parse the response, transform, and return
        if (response.data?.choices?.[0]?.message?.content) {
          try {
            const content = response.data.choices[0].message.content;
            try {
              // First attempt to parse the JSON content
              const jsonContent = JSON.parse(content);
              return this.formatLessonContent(jsonContent);
            } catch (jsonParseError) {
              console.error('Error parsing response as JSON, attempting to clean content:', jsonParseError);
              
              // If direct parsing fails, try to clean up the content
              let cleanedContent = content;
              
              // Remove any markdown code block markers if present
              cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
              
              try {
                // Try parsing the cleaned content
                const jsonContent = JSON.parse(cleanedContent);
                console.log('Successfully parsed JSON after cleaning content');
                return this.formatLessonContent(jsonContent);
              } catch (secondParseError) {
                console.error('Failed to parse JSON even after cleaning, trying to fix malformed colons structure:', secondParseError);
                
                // Check if this is the malformed structure with colons separating fields
                // Create a more robust way to parse the malformed JSON with colons
                try {
                  console.log('Attempting to fix malformed JSON with custom parser...');
                  
                  // If we see the typical pattern of JSON with misplaced colons instead of commas,
                  // attempt to fix the structure
                  if (cleanedContent.includes('":"') || cleanedContent.includes('"questions"') || 
                      cleanedContent.includes('"type"') || cleanedContent.includes('"targetVocabulary"')) {
                    
                    // This is a hacky fix, but it's better than nothing
                    // 1. Replace misplaced colons between array elements with commas
                    let fixedContent = cleanedContent
                      .replace(/"([^"]+)":\s*{([^}]+)}:\s*/g, '"$1": {$2},') // Fix objects with trailing colons
                      .replace(/},\s*"([^"]+)":\s*{/g, '}, "$1": {') // Fix comma placement between objects
                      .replace(/},\s*"([^"]+)":\s*"/g, '}, "$1": "') // Fix comma placement for string values
                      .replace(/"\s*,\s*"([^"]+)":/g, '", "$1":') // Fix array-like structures
                      .replace(/},\s*}/g, '}}') // Fix nested object closures
                      .replace(/],\s*}/g, ']}') // Fix array closures in objects
                      .replace(/"\s*:\s*"([^"]+)"\s*:/g, '": "$1",') // Fix object properties misusing colons
                      .replace(/},(?!\s*["}])/g, '},'); // Add missing commas after objects
                    
                    console.log('Attempted to fix malformed JSON structure');
                    
                    // Try to parse the result
                    try {
                      const parsedContent = JSON.parse(fixedContent);
                      console.log('Successfully parsed JSON after fixing malformed structure');
                      return this.formatLessonContent(parsedContent);
                    } catch (fixedParseError) {
                      console.error('Still failed to parse after structure fixes, trying more aggressive cleanup:', fixedParseError);
                      
                      // Even more aggressive approach - try to extract key sections we know should be there
                      // and construct a valid JSON structure
                      const sectionMatches = cleanedContent.match(/"sections"\s*:\s*\[([\s\S]+)\]/);
                      if (sectionMatches && sectionMatches[1]) {
                        try {
                          // Try to rebuild a minimal valid JSON with just the sections
                          const rebuiltJson = `{"sections": [${sectionMatches[1]}]}`;
                          const minimallyCorrected = rebuiltJson
                            .replace(/},\s*}/g, '}}')
                            .replace(/},(?!\s*["}])/g, '},')
                            .replace(/"\s*:\s*"([^"]+)"\s*:/g, '": "$1",');
                          
                          const parsedRebuilt = JSON.parse(minimallyCorrected);
                          console.log('Successfully rebuilt and parsed minimal JSON structure');
                          return this.formatLessonContent(parsedRebuilt);
                        } catch (minimalError) {
                          console.error('Failed even with minimal JSON rebuilding:', minimalError);
                        }
                      }
                    }
                  }
                } catch (fixingError) {
                  console.error('Failed to fix malformed JSON structure:', fixingError);
                }
                
                // If all parsing attempts fail, return the error response
                return {
                  title: `Lesson on ${params.topic}`,
                  content: response.data.choices[0].message.content,
                  error: 'JSON parsing failed'
                };
              }
            }
          } catch (parseError) {
            console.error('Error processing Qwen response:', parseError);
            return {
              title: `Lesson on ${params.topic}`,
              content: response.data.choices[0].message.content,
              error: 'JSON parsing failed'
            };
          }
        }
        
        return {
          title: params.topic ? `Lesson on ${params.topic}` : 'ESL Lesson',
          content: 'Unable to generate lesson content',
          error: 'No content in response'
        };
        
      } catch (error: any) {
        console.error('Error during API request:', error.message);
        throw error;
      }
    } catch (error: any) {
      console.error('Error in QwenService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Constructs a structured prompt for the Qwen AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // We'll set some variables to match what the system prompt expects
    const targetLevel = cefrLevel;
    const text = topic;
    const minVocabCount = 5;
    const maxVocabCount = 5;
    
    return `
You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience.

TASK OVERVIEW:
You will create a complete ESL lesson for ${targetLevel} level students on a given topic.

STEP 1: WRITE A READING TEXT
- First, write an original reading text about the topic "${text}"
- Use a warm, accessible, and conversational tone
- Include interesting facts and observations woven naturally into the narrative
- Use vivid, descriptive language that brings topics to life
- Make complex information approachable through clear explanations and engaging examples
- Use a mix of sentence lengths for good flow
- Occasionally address the reader directly with rhetorical questions or observations

- CRITICAL REQUIREMENT: For ${targetLevel} level, your text MUST be AT LEAST ${targetLevel === "B1" ? "200" : targetLevel === "C2" ? "500" : targetLevel === "C3" ? "600" : targetLevel === "A1" || targetLevel === "A2" ? "an appropriate length" : "300"} words
- Your text will be REJECTED if it's shorter than ${targetLevel === "B1" ? "200" : targetLevel === "C2" ? "500" : targetLevel === "C3" ? "600" : targetLevel === "A1" || targetLevel === "A2" ? "the appropriate length" : "300"} words
- The system counts words by splitting on whitespace - make sure you have enough actual words
- Divide your text into 3-5 paragraphs with clear paragraph breaks (use double line breaks between paragraphs)
- Focus on creating a substantial, informative text before moving on to other components
- Make sure the vocabulary and sentence structures remain appropriate for ${targetLevel} level students
- For lower levels (A1, A2), simplify the language while maintaining a friendly, engaging tone
- For higher levels (B2, C1, C2), use richer vocabulary and more complex sentences

STEP 2: CREATE LESSON COMPONENTS
After writing the reading text, create:
- CRITICAL REQUIREMENT: You MUST include EXACTLY ${minVocabCount}-${maxVocabCount} vocabulary items from your text. The system requires a minimum of ${minVocabCount} vocabulary items and will REJECT the lesson if fewer are provided.
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
9. An image prompt - A detailed description (2-3 sentences) of what an image for this word should look like.

CEFR LEVEL-APPROPRIATE VOCABULARY SELECTION GUIDELINES:
- A1: Choose words beyond the 500 most common words. Avoid very basic words like "hi", "hello", "yes", "no".
- A2: Choose words beyond the 1000 most common words.
- B1: Choose intermediate-level vocabulary (beyond the 2000 most common words).
- B2: Choose upper-intermediate vocabulary (beyond the 3000 most common words).
- C1: Choose advanced vocabulary (beyond the 4000 most common words).
- C2: Choose sophisticated vocabulary that would challenge even advanced learners.

WARM-UP ACTIVITY REQUIREMENTS:
- CRITICALLY IMPORTANT: Your warm-up activity MUST incorporate ALL vocabulary items from your vocabulary list. Check this carefully!
- Each vocabulary word MUST be explicitly mentioned and used in the warm-up activity
- Ensure students are introduced to all vocabulary before the reading
- Design an engaging activity that gets students familiar with these words
- In your procedure section, make sure EVERY vocabulary word is used at least once
- The system will check that each vocabulary word appears in the warm-up - if any are missing, the lesson will be rejected

DISCUSSION QUESTION REQUIREMENTS:
- IMPORTANT NEW FORMAT: Each post-reading discussion will now consist of:
  1. A CEFR-level appropriate paragraph about an interesting and relevant aspect of the topic
  2. 5 discussion/debate topics related to the paragraph and the reading content
- The paragraph should:
  - Be written at the appropriate CEFR level (${targetLevel})
  - Focus on something interesting and thought-provoking about the subject
  - Be 3-5 sentences long
  - Create a foundation for meaningful discussion
  - Relate directly to the vocabulary being learned
  - Avoid simply summarizing the main reading
  - CRITICAL: The language complexity MUST match exactly the ${targetLevel} level

⚠️ CRITICAL REQUIREMENT: You MUST provide EXACTLY 5 discussion/debate topics after the paragraph. Not providing exactly 5 topics will cause your response to be rejected and considered a failure.

!!! EXTREMELY IMPORTANT - READING COMPREHENSION FORMAT !!!
You MUST ONLY create reading comprehension questions in these two formats:
1. Multiple-choice questions with 3-4 options and one correct answer
2. True-false questions with exactly ["True", "False"] options

DO NOT create any short-answer questions or questions that ask students to "explain" or "write."
ALL questions must have selectable options. This includes ALL questions in the reading comprehension section.

!!! READING COMPREHENSION COGNITIVE LEVELS REQUIREMENT !!!
Your reading comprehension questions MUST cover a balanced range of cognitive abilities:
1. REMEMBER/UNDERSTAND (1-2 questions): Test basic comprehension and recall of explicit information from the text.
2. APPLY/ANALYZE (1-2 questions): Test ability to use information or break it into parts to explore relationships.
3. EVALUATE/CREATE (1-2 questions): Test ability to make judgments or create new patterns based on learned information.

FORMAT YOUR RESPONSE AS JSON:
Return your response as a valid, properly-formatted JSON object that strictly adheres to the following structure. Make sure all arrays use proper square brackets [] and all objects use proper curly braces {}:

{
  "title": "Descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Detailed description of the warm-up activity that incorporates ALL vocabulary words",
      "questions": [
        "Pre-reading discussion question 1",
        "Pre-reading discussion question 2"
      ],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Step-by-step instructions for conducting the warm-up",
      "teacherNotes": "Notes for the teacher on how to implement the warm-up effectively"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Brief introduction to the reading",
      "paragraphs": [
        "Paragraph 1 with at least 3-4 sentences",
        "Paragraph 2 with at least 3-4 sentences",
        "Paragraph 3 with at least 3-4 sentences",
        "Paragraph 4 with at least 3-4 sentences",
        "Paragraph 5 with at least 3-4 sentences"
      ],
      "teacherNotes": "Notes for the teacher on how to use the reading effectively"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "vocabulary word 1",
          "partOfSpeech": "part of speech",
          "definition": "Clear definition appropriate for the CEFR level",
          "example": "Example sentence using the word in context",
          "collocations": ["common phrase 1", "common phrase 2"],
          "notes": "Usage notes appropriate for the level",
          "teachingTips": "Tips for teaching this vocabulary item",
          "pronunciation": {
            "syllables": ["syl", "la", "bles"],
            "stressIndex": 0,
            "phoneticGuide": "simplified pronunciation guide"
          },
          "imagePrompt": "Detailed description of what an image for this word should look like"
        },
        {
          "term": "vocabulary word 2",
          "partOfSpeech": "part of speech",
          "definition": "Clear definition appropriate for the CEFR level",
          "example": "Example sentence using the word in context",
          "collocations": ["common phrase 1", "common phrase 2"],
          "notes": "Usage notes appropriate for the level",
          "teachingTips": "Tips for teaching this vocabulary item",
          "pronunciation": {
            "syllables": ["syl", "la", "bles"],
            "stressIndex": 0,
            "phoneticGuide": "simplified pronunciation guide"
          },
          "imagePrompt": "Detailed description of what an image for this word should look like"
        },
        {
          "term": "vocabulary word 3",
          "partOfSpeech": "part of speech",
          "definition": "Clear definition appropriate for the CEFR level",
          "example": "Example sentence using the word in context",
          "collocations": ["common phrase 1", "common phrase 2"],
          "notes": "Usage notes appropriate for the level",
          "teachingTips": "Tips for teaching this vocabulary item",
          "pronunciation": {
            "syllables": ["syl", "la", "bles"],
            "stressIndex": 0,
            "phoneticGuide": "simplified pronunciation guide"
          },
          "imagePrompt": "Detailed description of what an image for this word should look like"
        },
        {
          "term": "vocabulary word 4",
          "partOfSpeech": "part of speech",
          "definition": "Clear definition appropriate for the CEFR level",
          "example": "Example sentence using the word in context",
          "collocations": ["common phrase 1", "common phrase 2"],
          "notes": "Usage notes appropriate for the level",
          "teachingTips": "Tips for teaching this vocabulary item",
          "pronunciation": {
            "syllables": ["syl", "la", "bles"],
            "stressIndex": 0,
            "phoneticGuide": "simplified pronunciation guide"
          },
          "imagePrompt": "Detailed description of what an image for this word should look like"
        },
        {
          "term": "vocabulary word 5",
          "partOfSpeech": "part of speech",
          "definition": "Clear definition appropriate for the CEFR level",
          "example": "Example sentence using the word in context",
          "collocations": ["common phrase 1", "common phrase 2"],
          "notes": "Usage notes appropriate for the level",
          "teachingTips": "Tips for teaching this vocabulary item",
          "pronunciation": {
            "syllables": ["syl", "la", "bles"],
            "stressIndex": 0,
            "phoneticGuide": "simplified pronunciation guide"
          },
          "imagePrompt": "Detailed description of what an image for this word should look like"
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        {
          "question": "Remember/Understand level question about a specific fact from the text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Apply/Analyze level question that requires deeper understanding",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Evaluate/Create level question that requires making judgments",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "True/False question about the text",
          "options": ["True", "False"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Another multiple-choice question about the text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        }
      ]
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "frames": [
        {
          "pattern": "Pattern with blanks (e.g., 'I think _____ is important because _____.')",
          "examples": [
            "Example sentence 1 using the pattern and vocabulary from the lesson",
            "Example sentence 2 using the pattern and vocabulary from the lesson",
            "Example sentence 3 using the pattern and vocabulary from the lesson"
          ],
          "usageNotes": "When and how to use this pattern",
          "teachingTips": "How to introduce and practice this pattern",
          "difficultyLevel": "basic/intermediate/advanced relative to CEFR level",
          "grammarFocus": "What grammar point this pattern practices",
          "communicativeFunction": "What communication skill this pattern develops"
        },
        {
          "pattern": "Another pattern with blanks",
          "examples": [
            "Example sentence 1 using the pattern and vocabulary from the lesson",
            "Example sentence 2 using the pattern and vocabulary from the lesson",
            "Example sentence 3 using the pattern and vocabulary from the lesson"
          ],
          "usageNotes": "When and how to use this pattern",
          "teachingTips": "How to introduce and practice this pattern",
          "difficultyLevel": "basic/intermediate/advanced relative to CEFR level",
          "grammarFocus": "What grammar point this pattern practices",
          "communicativeFunction": "What communication skill this pattern develops"
        }
      ]
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "introduction": "A CEFR-level appropriate paragraph (3-5 sentences) about an interesting aspect of the topic that provides context for the discussion",
      "questions": [
        "Discussion question 1 directly referencing specific content from the reading",
        "Discussion question 2 directly referencing specific content from the reading",
        "Discussion question 3 directly referencing specific content from the reading",
        "Discussion question 4 directly referencing specific content from the reading",
        "Discussion question 5 directly referencing specific content from the reading"
      ]
    },
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {
          "question": "Quiz question 1",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Quiz question 2",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Quiz question 3",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Quiz question 4",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        },
        {
          "question": "Quiz question 5",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option",
          "explanation": "Why this is the correct answer"
        }
      ]
    }
  ]
}

CRITICAL: Make sure your JSON is valid with no syntax errors. Use proper formatting with arrays using square brackets and objects using curly braces. Don't use property names as values, and ensure ALL string values are properly quoted.`;
  }

  /**
   * Format and process the lesson content
   */
  private formatLessonContent(content: any): any {
    try {
      // If content is already an object (previously parsed JSON), work with it directly
      if (typeof content === 'object' && content !== null) {
        const lessonContent = content;
        
        // Process each section if sections array exists
        if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
          for (const section of lessonContent.sections) {
            // Skip if not a valid section object
            if (!section || typeof section !== 'object') continue;
            
            // Handle discussion section specially
            if (section.type === 'discussion') {
              // Handle the introduction field possibly containing the paragraph context
              if (section.introduction && typeof section.introduction === 'string') {
                // If the introduction field looks like a paragraph (multiple sentences, no question marks)
                // then we store it as paragraphContext for the UI to render properly
                if (section.introduction.includes('.') && !section.introduction.includes('?')) {
                  section.paragraphContext = section.introduction;
                  console.log("Setting paragraphContext from introduction:", section.paragraphContext);
                }
              }
              
              // Process questions if they exist
              if (section.questions) {
                // If questions is an object but not an array, convert to array
                if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
                  console.log('Converting discussion questions from object to array format');
                  const questionArray = [];
                  for (const key in section.questions) {
                    if (key.startsWith('Question') || key.match(/^\d+$/) || key.match(/^[A-Za-z]$/)) {
                      questionArray.push(section.questions[key]);
                    }
                  }
                  
                  if (questionArray.length > 0) {
                    section.questions = questionArray;
                    console.log(`Converted ${questionArray.length} discussion questions to array format`);
                  }
                }
                
                // Ensure questions format is an array of objects with paragraphContext
                if (Array.isArray(section.questions)) {
                  console.log("Processing discussion questions to ensure proper structure");
                  section.questions = section.questions.map((q: any) => {
                    if (typeof q === 'string') {
                      // For string questions, create a structured object
                      return {
                        question: q,
                        // If we have a paragraphContext at the section level, include it with each question
                        paragraphContext: section.paragraphContext || null
                      };
                    } else if (typeof q === 'object') {
                      // For object questions, ensure paragraphContext is included
                      return {
                        ...q,
                        paragraphContext: q.paragraphContext || section.paragraphContext || null
                      };
                    }
                    return q;
                  });
                }
              }
            }
            
            // Handle comprehension section formatting  
            else if (section.type === 'comprehension' && section.questions) {
              // If questions is an object but not an array, convert to array
              if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
                console.log('Converting comprehension questions from object to array format');
                const questionArray = [];
                for (const key in section.questions) {
                  if (section.questions[key] && typeof section.questions[key] === 'object') {
                    questionArray.push(section.questions[key]);
                  }
                }
                
                if (questionArray.length > 0) {
                  section.questions = questionArray;
                  console.log(`Converted ${questionArray.length} comprehension questions to array format`);
                }
              }
            }
            
            // Handle quiz section formatting
            else if (section.type === 'quiz' && section.questions) {
              // If questions is an object but not an array, convert to array
              if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
                console.log('Converting quiz questions from object to array format');
                const questionArray = [];
                for (const key in section.questions) {
                  if (section.questions[key] && typeof section.questions[key] === 'object') {
                    questionArray.push(section.questions[key]);
                  }
                }
                
                if (questionArray.length > 0) {
                  section.questions = questionArray;
                  console.log(`Converted ${questionArray.length} quiz questions to array format`);
                }
              }
            }
          }
        }
        
        return lessonContent;
      }
      
      // Otherwise return the content as is
      return content;
    } catch (error: any) {
      console.error('Error formatting lesson content:', error);
      return content;
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');