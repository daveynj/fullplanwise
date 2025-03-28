import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';

// Default Qwen API endpoint - Exact URL from Alibaba Cloud documentation
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

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
      
      // Request payload exactly following DashScope documentation
      const requestBody = {
        model: "qwen-max",
        input: {
          prompt: prompt
        },
        parameters: {
          result_format: "json",
          temperature: 0.7,
          top_p: 0.8,
          top_k: 50,
          max_tokens: 3000
        }
      };
      
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
      
      const response = await axios({
        method: 'post',
        url: QWEN_API_URL,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable'
        },
        data: requestBody
      });
      
      console.log('Received response from Qwen API');
      
      // Parse the response based on DashScope API format
      console.log('DashScope API Response Status:', response.status);
      console.log('DashScope API Response Headers:', JSON.stringify(response.headers, null, 2));
      
      if (response.data && response.data.output && response.data.output.text) {
        const text = response.data.output.text;
        console.log('Successfully extracted text from response');
        
        try {
          // Try to parse the text as JSON
          const jsonContent = JSON.parse(text);
          return this.formatLessonContent(jsonContent);
        } catch (parseError) {
          console.error('Error parsing DashScope response as JSON:', parseError);
          
          // Try to extract JSON from text content
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonContent = JSON.parse(jsonMatch[0]);
              return this.formatLessonContent(jsonContent);
            }
          } catch (extractError) {
            console.error('Error extracting JSON from response:', extractError);
          }
        }
      }
      
      // If JSON parsing fails, return raw text response
      return {
        title: params.topic || 'ESL Lesson',
        content: response.data?.output?.text || 'Unable to generate lesson content',
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
      throw new Error(
        `Failed to generate lesson: ${error.message}`
      );
    }
  }
  
  /**
   * Constructs a structured prompt for the Qwen AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { studentId, cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // Convert CEFR level to more descriptive text
    const levelDescriptions: Record<string, string> = {
      'A1': 'Beginner - Can understand and use familiar everyday expressions and very basic phrases.',
      'A2': 'Elementary - Can communicate in simple and routine tasks requiring a simple and direct exchange of information.',
      'B1': 'Intermediate - Can deal with most situations likely to arise while traveling in an area where the language is spoken.',
      'B2': 'Upper Intermediate - Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers possible.',
      'C1': 'Advanced - Can use language flexibly and effectively for social, academic and professional purposes.',
      'C2': 'Proficient - Can understand with ease virtually everything heard or read.'
    };
    
    const levelDescription = levelDescriptions[cefrLevel] || `${cefrLevel} level`;
    
    return `
You are an expert ESL teacher with years of experience creating engaging and effective lesson materials. 
Create a complete ESL lesson plan following the guidelines below.

STUDENT INFORMATION:
- CEFR Level: ${cefrLevel} (${levelDescription})
- Focus Area: ${focus}
- Topic: ${topic}
- Preferred Lesson Length: ${lessonLength} minutes
- Additional Notes: ${additionalNotes || 'None provided'}

LESSON STRUCTURE:
Create a well-structured ESL lesson with the following components:

1. Warm-up activity (5-10 minutes)
2. Vocabulary section (8-10 key words/phrases relevant to the topic and CEFR level)
3. Main reading or dialogue text (appropriate length for CEFR level)
4. Comprehension questions about the text
5. Grammar focus relevant to the level and topic
6. Practice exercises for the target grammar/vocabulary
7. Speaking activity or discussion questions
8. Quick final assessment or quiz

Please follow these guidelines:
- Ensure all content is appropriate for the specified CEFR level
- Make the lesson engaging and interactive
- Include clear instructions for each activity
- Provide answer keys where applicable
- Format the response as a JSON object with the following structure:

{
  "title": "Descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Detailed activity description",
      "timeAllocation": "5-10 minutes"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        { "term": "word1", "definition": "definition1", "example": "example sentence" },
        ...
      ],
      "timeAllocation": "10-15 minutes"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "content": "Full reading text appropriate for level",
      "timeAllocation": "10-15 minutes"
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        { "question": "Question 1?", "answer": "Answer 1" },
        ...
      ],
      "timeAllocation": "10 minutes"
    },
    {
      "type": "grammar",
      "title": "Grammar Focus",
      "explanation": "Explanation of grammar point",
      "examples": ["Example 1", "Example 2", ...],
      "timeAllocation": "15 minutes"
    },
    {
      "type": "practice",
      "title": "Practice Activities",
      "activities": [
        { "instruction": "Activity 1 instruction", "items": ["item1", "item2", ...], "answers": ["answer1", "answer2", ...] },
        ...
      ],
      "timeAllocation": "15-20 minutes"
    },
    {
      "type": "speaking",
      "title": "Discussion Activity",
      "questions": ["Question 1", "Question 2", ...],
      "timeAllocation": "10-15 minutes"
    },
    {
      "type": "assessment",
      "title": "Quick Assessment",
      "questions": [
        { "question": "Question 1?", "options": ["A", "B", "C", "D"], "correctAnswer": "A" },
        ...
      ],
      "timeAllocation": "5-10 minutes"
    }
  ]
}

Ensure the content is original, engaging, and appropriate for the specified level. Focus on practical language use in real-world contexts.
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