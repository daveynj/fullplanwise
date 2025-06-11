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

Return the response in this exact JSON format with sections array:

{
  "title": "Descriptive lesson title about ${params.topic}",
  "level": "${targetLevel}",
  "focus": "speaking and vocabulary",
  "estimatedTime": 45,
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Complete description of warm-up activity introducing the topic",
      "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Step-by-step instructions for the teacher",
      "teacherNotes": "Important notes for conducting this activity"
    },
    {
      "type": "reading",
      "title": "Reading Text: ${params.topic}",
      "introduction": "Brief introduction to the reading",
      "paragraphs": [
        "First paragraph (3-4 sentences) introducing the topic",
        "Second paragraph (3-4 sentences) developing the topic",
        "Third paragraph (3-4 sentences) concluding the topic"
      ],
      "teacherNotes": "Notes about reading comprehension and vocabulary"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "word1",
          "partOfSpeech": "noun",
          "definition": "Clear definition",
          "example": "Example sentence using the word",
          "imagePrompt": "Simple visual description for the word"
        },
        {
          "term": "word2", 
          "partOfSpeech": "verb",
          "definition": "Clear definition",
          "example": "Example sentence using the word",
          "imagePrompt": "Simple visual description for the word"
        },
        {
          "term": "word3",
          "partOfSpeech": "adjective", 
          "definition": "Clear definition",
          "example": "Example sentence using the word",
          "imagePrompt": "Simple visual description for the word"
        },
        {
          "term": "word4",
          "partOfSpeech": "noun",
          "definition": "Clear definition", 
          "example": "Example sentence using the word",
          "imagePrompt": "Simple visual description for the word"
        },
        {
          "term": "word5",
          "partOfSpeech": "verb",
          "definition": "Clear definition",
          "example": "Example sentence using the word", 
          "imagePrompt": "Simple visual description for the word"
        }
      ],
      "teacherNotes": "Notes about teaching vocabulary effectively"
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        {
          "question": "What is the main idea of the text?",
          "answer": "The main idea is...",
          "type": "main-idea"
        },
        {
          "question": "According to the text, what...?",
          "answer": "According to the text...",
          "type": "detail"
        },
        {
          "question": "Why do you think...?",
          "answer": "I think... because...",
          "type": "inference"
        }
      ],
      "teacherNotes": "Guide students to find answers in the text"
    },
    {
      "type": "discussion",
      "title": "Discussion Questions", 
      "questions": [
        {
          "question": "What do you think about ${params.topic}?",
          "followUp": "Can you give an example?",
          "targetVocabulary": ["word1", "word2"]
        },
        {
          "question": "Have you ever experienced...?",
          "followUp": "How did you feel?",
          "targetVocabulary": ["word3", "word4"]
        },
        {
          "question": "In your opinion, what is the most important...?",
          "followUp": "Why do you think so?",
          "targetVocabulary": ["word5"]
        }
      ],
      "teacherNotes": "Encourage students to use target vocabulary in responses"
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "pattern": "Structured sentence patterns for practice",
      "examples": [
        "I think ___ is important because ___",
        "In my opinion, ___ is better than ___ because ___",
        "When I ___, I usually ___"
      ],
      "teacherNotes": "Help students practice using new vocabulary in structured sentences"
    },
    {
      "type": "speaking",
      "title": "Speaking Activity",
      "activity": "Pair or group speaking activity related to the topic",
      "instructions": "Clear instructions for the speaking activity",
      "timeAllocation": "10 minutes",
      "teacherNotes": "Monitor and provide feedback during speaking practice"
    }
  ]
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
        // Clean the content - remove markdown code blocks if present
        let cleanContent = content.trim();
        
        // Remove markdown JSON code blocks
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        cleanContent = cleanContent.trim();
        console.log('Cleaned content for parsing, length:', cleanContent.length);
        
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