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
          timeout: 180000 // 3 minute timeout
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
              // Log the content for inspection
              console.log('Successfully parsed JSON response');
              console.log('JSON response sample:', JSON.stringify(jsonContent).substring(0, 200) + '...');
              return this.formatLessonContent(jsonContent);
            } catch (parseError) {
              console.error('Error parsing Qwen response as JSON:', parseError);
              
              // Log some of the raw content for debugging
              console.log('Raw response sample:', content.substring(0, 200) + '...');
              
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
          console.error('Request timed out after 3 minutes');
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
    
    // Determine appropriate question count based on level
    const questionCount = cefrLevel === 'A1' || cefrLevel === 'A2' ? 3 
                        : cefrLevel === 'B1' || cefrLevel === 'B2' ? 4 
                        : 5;
    
    // Determine difficulty based on CEFR level
    const difficulty = cefrLevel === 'A1' || cefrLevel === 'A2' ? 'basic'
                     : cefrLevel === 'B1' || cefrLevel === 'B2' ? 'intermediate'
                     : 'advanced';

    return `
You are an expert ESL (English as a Second Language) teacher specializing in creating engaging, interactive lessons for ${levelDescription} (${cefrLevel}) level students.

LESSON SPECIFICATIONS:
- Topic: "${topic}"  
- Focus: "${focus}"
- CEFR Level: ${cefrLevel} (${levelDescription})
- Lesson Length: ${lessonLength} minutes
- Additional notes: ${additionalNotes || 'None'}

CLASSROOM CONTEXT AND PURPOSE:
This lesson will be used by a teacher conducting a 1-on-1 online class via screen sharing. The content should be visually engaging, highly interactive, and optimized for student participation.

CRITICAL PEDAGOGICAL APPROACH:
1. The warm-up activity MUST introduce key vocabulary that will appear in the reading text
2. The vocabulary section MUST include words from the reading text with CEFR-appropriate definitions
3. The reading text MUST incorporate ALL vocabulary terms in a coherent, level-appropriate passage
4. All activities should build on each other in a logical progression
5. Including appropriate images and visual elements is ESSENTIAL (descriptions will be converted to images)

REQUIRED LESSON STRUCTURE:
Return your response as a JSON object with the following structure:

{
  "title": "Engaging and descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Brief, engaging activity introducing the main topic and key vocabulary",
      "questions": ["1-2 warm-up questions to start discussion"],
      "imageDescription": "Description of an appropriate image to display with this activity",
      "targetVocabulary": ["term1", "term2", "term3"],
      "timeAllocation": "5 minutes",
      "teacherNotes": "Tips for conducting this warm-up effectively"
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Brief introduction to the reading passage",
      "paragraphs": [
        "Paragraph 1 text that includes target vocabulary",
        "Paragraph 2 text with more target vocabulary",
        "Paragraph 3 text completing the passage"
      ],
      "imageDescription": "Description of an image that captures the essence of the reading text",
      "timeAllocation": "15 minutes",
      "teacherNotes": "Reading strategies to suggest to the student"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "vocabulary word from the reading",
          "partOfSpeech": "noun/verb/adj/etc",
          "definition": "Clear, CEFR-level appropriate definition",
          "example": "Example sentence using the word in context from the reading",
          "imageDescription": "Description of an image representing this word",
          "pronunciation": "Pronunciation tip if relevant"
        }
      ],
      "practice": "Brief activity to practice using the vocabulary",
      "timeAllocation": "10 minutes",
      "teacherNotes": "How to teach these vocabulary items effectively"
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "introduction": "Brief introduction to check understanding",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "Specific question about content from the reading",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct option",
          "explanation": "Why this answer is correct"
        },
        {
          "type": "true-false",
          "question": "Statement based on the reading",
          "options": ["True", "False"],
          "correctAnswer": "True or False",
          "explanation": "Explanation referencing specific content from the reading"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Tips for discussing these comprehension questions"
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Frames",
      "introduction": "Introduction to the grammar pattern",
      "frames": [
        {
          "level": "basic/intermediate/advanced",
          "pattern": "Template sentence with _____ for missing words",
          "examples": [
            "Completed example sentence 1 using the pattern",
            "Completed example sentence 2 using the pattern"
          ],
          "usage": "When and how to use this pattern",
          "grammarFocus": "Specific grammar point being practiced"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Tips for teaching and practicing these patterns"
    },
    {
      "type": "discussion",
      "title": "Post-reading Discussion",
      "introduction": "Brief introduction to the discussion activity",
      "questions": [
        {
          "level": "basic/critical",
          "question": "Discussion question text",
          "focusVocabulary": ["vocabulary term 1", "vocabulary term 2"],
          "imageDescription": "Description of an image to accompany this question",
          "followUp": ["Follow-up question 1", "Follow-up question 2"]
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Tips for facilitating this discussion"
    },
    {
      "type": "quiz",
      "title": "Knowledge Check Quiz",
      "introduction": "Brief introduction to the final assessment",
      "questions": [
        {
          "id": "q1",
          "type": "multiple-choice",
          "question": "Question text testing comprehension of key concepts",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct option",
          "explanation": "Explanation referencing specific content"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "How to administer and review this assessment"
    }
  ]
}

CRITICAL QUALITY REQUIREMENTS:
1. Make sure ALL target vocabulary appears in the reading text
2. The warm-up activity MUST introduce vocabulary that will be needed to understand the reading
3. ALL vocabulary definitions MUST be appropriate for ${cefrLevel} level students
4. Questions in each section MUST build on previous sections
5. Include ${questionCount} questions in the quiz section
6. Make all content original, culturally appropriate, and relevant to the topic
7. Ensure all examples and exercises are practically usable in a live teaching environment
8. Image descriptions should be detailed enough to create or find appropriate images

Create a complete, interactive, visually engaging ESL lesson that strictly follows these requirements.
`;
  }
  
  /**
   * Format and clean up the lesson content from the AI response
   */
  private formatLessonContent(content: any): any {
    console.log("Raw Qwen content before formatting:", JSON.stringify(content).substring(0, 500) + "...");
    
    // Ensure we have a valid structure
    if (!content.title) {
      content.title = 'ESL Lesson';
    }
    
    if (!content.sections) {
      content.sections = [];
    }
    
    // Fix common issues with section structures
    if (Array.isArray(content.sections)) {
      content.sections = content.sections.map((section: any) => {
        if (!section || typeof section !== 'object') return section;
        
        // Fix warmup section
        if (section.type === 'warmup' || section.type === 'warm-up') {
          // Fix questions format
          if (section.questions && !Array.isArray(section.questions)) {
            // If questions is a string, convert to array
            if (typeof section.questions === 'string') {
              section.questions = [section.questions];
            } else {
              // If it's an object, try to extract questions from keys
              try {
                const extractedQuestions = [];
                for (const key in section.questions) {
                  extractedQuestions.push(key);
                }
                if (extractedQuestions.length > 0) {
                  section.questions = extractedQuestions;
                } else {
                  section.questions = [];
                }
              } catch (err) {
                console.warn("Could not extract questions from object", err);
                section.questions = [];
              }
            }
          }
          
          // Fix targetVocabulary format
          if (section.targetVocabulary && !Array.isArray(section.targetVocabulary)) {
            // If it's a string, convert to array
            if (typeof section.targetVocabulary === 'string') {
              section.targetVocabulary = [section.targetVocabulary];
            } else {
              // If it's an object, try to extract values
              try {
                const extractedVocab = [];
                for (const key in section.targetVocabulary) {
                  if (typeof key === 'string' && key.trim()) {
                    extractedVocab.push(key);
                  }
                  if (typeof section.targetVocabulary[key] === 'string' && section.targetVocabulary[key].trim()) {
                    extractedVocab.push(section.targetVocabulary[key]);
                  }
                }
                if (extractedVocab.length > 0) {
                  section.targetVocabulary = extractedVocab;
                } else {
                  section.targetVocabulary = [];
                }
              } catch (err) {
                console.warn("Could not extract vocabulary from object", err);
                section.targetVocabulary = [];
              }
            }
          }
        }
        
        // Fix other section types with similar patterns as needed
        
        return section;
      });
    }
    
    // Add timestamps for the created lesson
    const formattedContent = {
      ...content,
      createdAt: new Date().toISOString(),
    };
    
    console.log("Formatted content:", JSON.stringify(formattedContent).substring(0, 500) + "...");
    
    return formattedContent;
  }
}

// Create a singleton instance with the API key
export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');