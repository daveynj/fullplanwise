import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';

// Qwen API endpoint for international usage - using OpenAI compatible format
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
    console.log(`Qwen service initialized. API key present: ${!!apiKey}, Length: ${apiKey?.length || 0}`);
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
      const prompt = `You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience. Create a comprehensive and engaging lesson plan for the topic "${params.topic}" at ${targetLevel} level.

IMPORTANT: Always return a valid JSON object with the exact structure specified below. No additional text outside the JSON.

Create a lesson that includes:
1. A warm-up activity to introduce the topic
2. Main content with reading passage and vocabulary
3. Discussion questions
4. Grammar spotlight
5. Practice activities
6. Comprehension questions
7. Sentence frames for guided practice

The lesson should be appropriate for ${targetLevel} level students and focus on "${params.topic}".

Return the response in this exact JSON format:

{
  "title": "Lesson title here",
  "warmup": {
    "title": "Warm-up Activity",
    "activity": "Description of warm-up activity"
  },
  "reading": {
    "title": "Reading Passage",
    "content": "A 150-200 word reading passage about the topic"
  },
  "vocabulary": {
    "title": "Key Vocabulary",
    "words": [
      {"word": "word1", "definition": "definition1", "example": "example sentence1"},
      {"word": "word2", "definition": "definition2", "example": "example sentence2"},
      {"word": "word3", "definition": "definition3", "example": "example sentence3"},
      {"word": "word4", "definition": "definition4", "example": "example sentence4"},
      {"word": "word5", "definition": "definition5", "example": "example sentence5"}
    ]
  },
  "discussion": {
    "title": "Discussion Questions",
    "questions": [
      "Question 1 here",
      "Question 2 here",
      "Question 3 here",
      "Question 4 here"
    ]
  },
  "grammar": {
    "title": "Grammar Spotlight",
    "focus": "Grammar point being taught",
    "explanation": "Clear explanation of the grammar rule",
    "examples": [
      "Example 1",
      "Example 2",
      "Example 3"
    ]
  },
  "practice": {
    "title": "Practice Activity",
    "type": "fill-in-the-blank",
    "questions": [
      {"question": "Question 1", "answer": "Answer 1"},
      {"question": "Question 2", "answer": "Answer 2"},
      {"question": "Question 3", "answer": "Answer 3"},
      {"question": "Question 4", "answer": "Answer 4"}
    ]
  },
  "comprehension": {
    "title": "Reading Comprehension",
    "questions": [
      {"question": "Question 1", "answer": "Answer 1"},
      {"question": "Question 2", "answer": "Answer 2"},
      {"question": "Question 3", "answer": "Answer 3"}
    ]
  },
  "sentenceFrames": {
    "title": "Sentence Practice",
    "frames": [
      "Frame 1 with ___ blanks",
      "Frame 2 with ___ blanks",
      "Frame 3 with ___ blanks"
    ]
  }
}

Ensure the entire output is a valid JSON object starting with { and ending with }`;

      console.log(`Prompt length: ${prompt.length} characters`);

      // Make the API request
      console.log('Making request to Qwen API...');
      
      const response = await axios.post(QWEN_API_URL, {
        model: 'qwen-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      });

      console.log('Qwen API response received');
      console.log('Response status:', response.status);

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response structure from Qwen API');
      }

      const content = response.data.choices[0].message?.content;
      if (!content) {
        throw new Error('No content in Qwen API response');
      }

      console.log('Raw content length:', content.length);

      // Parse the JSON response
      let parsedContent;
      try {
        // Clean the content in case there are any extra characters
        const cleanContent = content.trim();
        parsedContent = JSON.parse(cleanContent);
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Content that failed to parse:', content.substring(0, 500) + '...');
        throw new Error('Invalid JSON response from Qwen API');
      }

      return parsedContent;

    } catch (error: any) {
      console.error('Error in Qwen lesson generation:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Qwen API request timed out');
      }
      
      if (error.response) {
        console.error('Qwen API error response:', error.response.status, error.response.data);
        throw new Error(`Qwen API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      }
      
      if (error.request) {
        console.error('Qwen API network error:', error.request);
        throw new Error('Network error connecting to Qwen API');
      }
      
      throw error;
    }
  }
}

// Export a singleton instance
export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');