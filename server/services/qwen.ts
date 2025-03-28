import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';

// Updated Qwen API endpoint for international usage
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

      const prompt = this.constructLessonPrompt(params);
      console.log('Sending request to Qwen API...');
      
      // Try different model names in sequence
      const modelOptions = ["qwen-max", "qwen-turbo", "qwen-plus", "qwen-72b-api", "qwen-max-0423", "qwen-turbo-0423", "qwen"];
      
      // Request payload following OpenAI-compatible format for international endpoint
      const requestBody = {
        model: modelOptions[0], // Start with the first model
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
      
      // Try each model sequentially until one works
      let response = null;
      let lastError = null;
      
      for (const modelName of modelOptions) {
        try {
          // Update the model name in the request body
          requestBody.model = modelName;
          console.log(`Trying model: ${modelName}`);
          console.log('Request payload:', JSON.stringify(requestBody, null, 2));
          
          response = await axios({
            method: 'post',
            url: QWEN_API_URL,
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            data: requestBody
          });
          
          // If we got here, the request was successful
          console.log(`Request with model ${modelName} was successful!`);
          break;
        } catch (error: any) {
          console.warn(`Request with model ${modelName} failed:`, error.message);
          lastError = error;
          
          // If it's not a 404 (model not found) error, don't try other models
          if (error.response && error.response.status !== 404) {
            throw error;
          }
          
          // Otherwise continue to the next model
          console.log(`Trying next model...`);
        }
      }
      
      // If we've tried all models and none worked, throw the last error
      if (!response) {
        console.error('All model attempts failed');
        throw lastError || new Error('All model attempts failed');
      }
      
      console.log('Received response from Qwen API');
      
      // Parse the response based on OpenAI-compatible API format
      console.log('Qwen API Response Status:', response.status);
      console.log('Qwen API Response Data:', JSON.stringify(response.data, null, 2));
      
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
    } catch (error: any) {
      console.error('Error calling Qwen API:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Request URL:', error.config.url);
        console.error('Request headers:', error.config.headers);
      }
      // Provide more specific error messages to help with troubleshooting
      let errorMsg = `Failed to generate lesson: ${error.message}`;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Authentication failed. Please check your API key.';
        } else if (error.response.status === 404) {
          errorMsg = 'Model not found. Please check if the model name is correct.';
        } else if (error.response.status === 429) {
          errorMsg = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMsg = `Server error (${error.response.status}): ${error.response.data?.error?.message || error.message}`;
        }
      }
      
      throw new Error(errorMsg);
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