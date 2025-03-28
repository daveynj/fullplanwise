import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';

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
      
      // Use qwen-max model specifically as requested
      const modelName = "qwen-max";
      
      // Request payload following OpenAI-compatible format for the international endpoint
      const requestBody = {
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: "You are an expert ESL teacher with years of experience creating engaging and effective lesson materials." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      };
      
      console.log(`Using model: ${modelName}`);
      console.log('Request endpoint:', QWEN_API_URL);
      console.log('Request headers:', {
        'Authorization': 'Bearer [FIRST_4_CHARS]...[LAST_4_CHARS]',
        'Content-Type': 'application/json'
      });
      
      // Make the API request
      try {
        console.log('Sending request to Qwen API...');
        
        const response = await axios({
          method: 'post',
          url: QWEN_API_URL,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          data: requestBody,
          timeout: 60000 // 1 minute timeout
        });
        
        console.log('Received response from Qwen API');
        
        // Parse the response based on OpenAI-compatible API format
        console.log('Qwen API Response Status:', response.status);
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message?.content;
          
          if (content) {
            console.log('Successfully extracted content from response');
            
            try {
              // Try to parse the content as JSON
              const jsonContent = JSON.parse(content);
              return this.formatLessonContent(jsonContent);
            } catch (parseError) {
              console.error('Error parsing Qwen response as JSON:', parseError);
              
              // Try to extract JSON from content
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const jsonContent = JSON.parse(jsonMatch[0]);
                  return this.formatLessonContent(jsonContent);
                }
              } catch (extractError) {
                console.error('Error extracting JSON from response:', extractError);
              }
              
              // If JSON parsing fails but we still have content, return the content as-is
              return {
                title: `Lesson on ${params.topic}`,
                content: content,
                isMockContent: false
              };
            }
          }
        }
        
        // If no valid output, return a basic structure
        return {
          title: params.topic ? `Lesson on ${params.topic}` : 'ESL Lesson',
          content: 'Unable to generate lesson content',
          rawResponse: response.data
        };
      } catch (requestError: any) {
        console.error('Error during API request:', requestError.message);
        
        if (requestError.code === 'ECONNABORTED') {
          console.error('Request timed out after 60 seconds');
          throw new Error('Request to Qwen API timed out. The service may be experiencing high demand or connectivity issues.');
        }
        
        if (requestError.response) {
          console.error('Response status:', requestError.response.status);
          console.error('Response headers:', JSON.stringify(requestError.response.headers || {}, null, 2));
          console.error('Response data:', JSON.stringify(requestError.response.data || {}, null, 2));
          
          // Handle specific error status codes
          switch (requestError.response.status) {
            case 401:
              throw new Error('Authentication failed. Please check your Qwen API key.');
            case 403:
              throw new Error('Access forbidden. Your API key may not have permission to use this service.');
            case 404:
              throw new Error('Model not found. The "qwen-max" model may not be available or may have a different name.');
            case 429:
              throw new Error('Rate limit exceeded. Please try again later.');
            case 500:
              throw new Error('Qwen API server error. The service might be experiencing issues.');
            default:
              throw new Error(`Qwen API error (${requestError.response.status}): ${requestError.response.data?.error?.message || requestError.message}`);
          }
        } else if (requestError.request) {
          console.error('No response received from API');
          throw new Error('No response received from Qwen API. Please check your internet connection or API endpoint URL.');
        } else {
          throw new Error(`Error setting up request: ${requestError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error in QwenService.generateLesson:', error.message);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Constructs a structured prompt for the Qwen AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { studentId, cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // Convert CEFR level to more descriptive text
    const levelDescriptions: Record<string, string> = {
      'A1': 'Beginner',
      'A2': 'Elementary',
      'B1': 'Intermediate',
      'B2': 'Upper Intermediate',
      'C1': 'Advanced',
      'C2': 'Proficient'
    };
    
    const levelDescription = levelDescriptions[cefrLevel] || `${cefrLevel} level`;
    
    return `
Create an ESL lesson for a ${levelDescription} student on the topic of "${topic}". Focus on "${focus}". The lesson should be ${lessonLength} minutes long.

Additional notes: ${additionalNotes || 'None'}

Return a JSON object with this structure:
{
  "title": "Lesson Title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Activity description",
      "timeAllocation": "5-10 minutes"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        { "term": "word1", "definition": "definition1", "example": "example" },
        { "term": "word2", "definition": "definition2", "example": "example" }
      ],
      "timeAllocation": "10 minutes"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "content": "Short text appropriate for level",
      "timeAllocation": "10 minutes"
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        { "question": "Question 1?", "answer": "Answer 1" }
      ],
      "timeAllocation": "10 minutes"
    },
    {
      "type": "grammar",
      "title": "Grammar Focus",
      "explanation": "Brief grammar explanation",
      "examples": ["Example 1", "Example 2"],
      "timeAllocation": "10 minutes"
    },
    {
      "type": "speaking",
      "title": "Discussion Activity",
      "questions": ["Question 1", "Question 2"],
      "timeAllocation": "10 minutes"
    },
    {
      "type": "assessment",
      "title": "Quick Assessment",
      "questions": [
        { "question": "Question 1?", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }
      ],
      "timeAllocation": "5 minutes"
    }
  ]
}
`;
  }
  
  /**
   * Format and clean up the lesson content from the AI response
   */
  private formatLessonContent(content: any): any {
    // Ensure we have a valid structure
    if (!content.title) {
      content.title = 'ESL Lesson';
    }
    
    if (!content.sections) {
      content.sections = [];
    }
    
    // Add timestamps for the created lesson
    return {
      ...content,
      createdAt: new Date().toISOString(),
    };
  }
}

// Create a singleton instance with the API key
export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');