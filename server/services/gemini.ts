import { GoogleGenerativeAI } from '@google/generative-ai';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';

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
        model: 'gemini-1.5-flash',
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
              return this.formatLessonContent(jsonContent);
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
`;
    
    const mainPrompt = `
You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience.

TASK OVERVIEW:
You will create a complete ESL lesson for ${targetLevel} level students on the topic "${text}".

FORMAT YOUR RESPONSE AS JSON:
Return your response as a valid, properly-formatted JSON object with the following structure:

{
  "title": "Descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Detailed description of an engaging and interactive warm-up activity that activates prior knowledge about the topic and creates interest in the upcoming lesson",
      "questions": [
        "Thought-provoking question that connects to students' personal experiences",
        "Question that helps students recall prior knowledge about the topic",
        "Question that introduces key vocabulary or concepts that will appear in the lesson",
        "Question that encourages critical thinking about the topic"
      ],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Detailed step-by-step instructions for conducting the warm-up activity, including timing suggestions, grouping configurations, and specific prompts for the teacher to use",
      "teacherNotes": "Additional guidance for teachers on how to adapt the warm-up for different student levels, potential challenges to anticipate, and connections to make with the main lesson"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Detailed introduction to the topic",
      "paragraphs": [
        "Paragraph 1 with at least 4-5 detailed sentences that provide rich content for readers",
        "Paragraph 2 with at least 4-5 detailed sentences that build upon the previous paragraph",
        "Paragraph 3 with at least 4-5 detailed sentences that further develop the topic",
        "Paragraph 4 with at least 4-5 detailed sentences that add depth to the reading",
        "Paragraph 5 with at least 4-5 detailed sentences that conclude the reading section"
      ]
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "vocabulary word 1",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition appropriate for the student level",
          "example": "Contextual example sentence using the word properly"
        },
        {
          "term": "vocabulary word 2",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition appropriate for the student level",
          "example": "Contextual example sentence using the word properly"
        },
        {
          "term": "vocabulary word 3",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition appropriate for the student level",
          "example": "Contextual example sentence using the word properly"
        },
        {
          "term": "vocabulary word 4",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition appropriate for the student level",
          "example": "Contextual example sentence using the word properly"
        },
        {
          "term": "vocabulary word 5",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition appropriate for the student level",
          "example": "Contextual example sentence using the word properly"
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Comprehension Questions",
      "questions": [
        {
          "question": "Detailed question about the main idea of the text?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option A - detailed",
          "explanation": "Thorough explanation of why this answer is correct with reference to the reading text"
        },
        {
          "question": "Detailed question about specific details in the reading?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option B - detailed",
          "explanation": "Thorough explanation of why this answer is correct with reference to the reading text"
        },
        {
          "question": "Detailed question testing vocabulary understanding?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option C - detailed",
          "explanation": "Thorough explanation of why this answer is correct with reference to the reading text"
        },
        {
          "question": "Detailed question about inference from the text?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option D - detailed",
          "explanation": "Thorough explanation of why this answer is correct with reference to the reading text"
        },
        {
          "question": "Detailed question about the author's purpose or tone?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option B - detailed",
          "explanation": "Thorough explanation of why this answer is correct with reference to the reading text"
        }
      ]
    },
    {
      "type": "sentences",
      "title": "Sentence Frames and Language Structure",
      "introduction": "These sentence frames will help students express their ideas about the topic using proper grammatical structures",
      "frames": [
        {
          "pattern": "I believe that _____ is important because _____.",
          "examples": [
            "I believe that understanding cultural differences is important because it promotes tolerance and respect.",
            "I believe that learning from history is important because it helps us avoid repeating past mistakes."
          ],
          "grammarFocus": "Expressing opinions with supporting reasons"
        },
        {
          "pattern": "One interesting aspect of _____ is _____, which demonstrates _____.",
          "examples": [
            "One interesting aspect of this tradition is its historical origins, which demonstrates how cultural practices evolve over time.",
            "One interesting aspect of this concept is its practical applications, which demonstrates why it remains relevant today."
          ],
          "grammarFocus": "Describing features and making connections"
        },
        {
          "pattern": "Although many people think _____, I would argue that _____.",
          "examples": [
            "Although many people think this custom is outdated, I would argue that it still holds significant cultural value.",
            "Although many people think this approach is too simplistic, I would argue that its simplicity is actually its strength."
          ],
          "grammarFocus": "Expressing contrasting opinions"
        },
        {
          "pattern": "When we consider _____, we must also take into account _____.",
          "examples": [
            "When we consider the benefits of this practice, we must also take into account potential cultural misunderstandings.",
            "When we consider the historical context, we must also take into account modern perspectives and values."
          ],
          "grammarFocus": "Expressing related considerations"
        }
      ],
      "teacherNotes": "These sentence frames support the key language functions needed for discussing this topic. Encourage students to extend these patterns with their own ideas and vocabulary from the lesson."
    },
    {
      "type": "discussion",
      "title": "Discussion and Critical Thinking",
      "introduction": "Comprehensive introduction to the discussion topic that connects with students' personal experiences and the broader themes of the reading",
      "paragraphContext": "Detailed contextual information related to the topic that helps frame the discussion questions and extends beyond the reading",
      "questions": [
        "Thought-provoking question that requires personal reflection and connection to the reading text",
        "Critical thinking question that encourages students to analyze cultural or social aspects of the topic",
        "Open-ended question that promotes debate and different perspectives on the topic",
        "Application question that asks students to relate the topic to their own experiences or communities",
        "Forward-thinking question that encourages predictions or hypotheses about future developments related to the topic"
      ],
      "teacherNotes": "Detailed guidance for teachers on how to facilitate this discussion including potential challenges, key points to emphasize, and suggestions for extending the conversation"
    },
    {
      "type": "quiz",
      "title": "Knowledge Check Quiz",
      "introduction": "A comprehensive final assessment to test vocabulary, comprehension, and critical thinking related to the lesson",
      "questions": [
        {
          "question": "Challenging question about key vocabulary from the lesson?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option A - detailed",
          "explanation": "Detailed explanation of why this answer is correct with connections to the lesson content"
        },
        {
          "question": "Question testing understanding of main concepts from the reading?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option B - detailed",
          "explanation": "Detailed explanation of why this answer is correct with connections to the lesson content"
        },
        {
          "question": "Question requiring application of the learned concepts?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option C - detailed",
          "explanation": "Detailed explanation of why this answer is correct with connections to the lesson content"
        },
        {
          "question": "Question testing critical analysis of the topic?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option D - detailed",
          "explanation": "Detailed explanation of why this answer is correct with connections to the lesson content"
        },
        {
          "question": "Question requiring synthesis of multiple concepts from the lesson?",
          "options": ["Option A - detailed", "Option B - detailed", "Option C - detailed", "Option D - detailed"],
          "answer": "Option A - detailed",
          "explanation": "Detailed explanation of why this answer is correct with connections to the lesson content"
        }
      ]
    }
  ]
}

CRITICAL: Ensure all arrays have complete content (not just placeholders) and that all JSON is properly formatted.
`;

    return systemInstruction + mainPrompt;
  }
  
  /**
   * Format and process the lesson content
   */
  private formatLessonContent(content: any): any {
    // Add provider identifier to the content
    return {
      ...content,
      provider: 'gemini'
    };
  }
}

export const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '');