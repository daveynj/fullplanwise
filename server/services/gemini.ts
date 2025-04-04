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
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 8192,
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
          // First attempt to parse the JSON content directly
          const jsonContent = JSON.parse(text);
          return this.formatLessonContent(jsonContent);
        } catch (error) {
          console.error('Error parsing Gemini response as JSON:', error);
          
          // Try to clean up the content first
          let cleanedContent = text;
          
          // Remove any markdown code block markers if present
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
          
          try {
            // Try parsing the cleaned content
            const jsonContent = JSON.parse(cleanedContent);
            console.log('Successfully parsed JSON after cleaning content');
            return this.formatLessonContent(jsonContent);
          } catch (error) {
            console.error('Failed to parse JSON even after cleaning, returning error response');
            
            // If all parsing attempts fail, return the error response
            return {
              title: `Lesson on ${params.topic}`,
              content: text,
              error: 'JSON parsing failed'
            };
          }
        }
      } catch (error: any) {
        console.error('Error during Gemini API request:', error.message);
        return {
          title: `Lesson on ${params.topic}`,
          content: 'Failed to generate lesson content',
          error: error.message
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
      "content": "Description of the warm-up activity",
      "questions": ["Discussion question 1", "Discussion question 2"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Step-by-step instructions"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Brief introduction",
      "paragraphs": [
        "Paragraph 1 with at least 3-4 sentences",
        "Paragraph 2 with at least 3-4 sentences",
        "Paragraph 3 with at least 3-4 sentences"
      ]
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "vocabulary word 1",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition",
          "example": "Example sentence"
        },
        {
          "term": "vocabulary word 2",
          "partOfSpeech": "noun/verb/adj",
          "definition": "Clear definition",
          "example": "Example sentence"
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Comprehension Questions",
      "questions": [
        {
          "question": "Question about the text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A",
          "explanation": "Why this is correct"
        }
      ]
    },
    {
      "type": "sentences",
      "title": "Sentence Frames",
      "frames": [
        {
          "pattern": "I think _____ because _____.",
          "examples": ["Example 1", "Example 2"],
          "grammarFocus": "Expressing opinions"
        }
      ]
    },
    {
      "type": "discussion",
      "title": "Discussion",
      "introduction": "Brief introduction to discussion topic",
      "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
    },
    {
      "type": "quiz",
      "title": "Quiz",
      "questions": [
        {
          "question": "Question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
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
    // Just return the content as is for now
    // We can add more formatting logic later if needed
    return content;
  }
}

export const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '');