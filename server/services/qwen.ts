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

1. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

2. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER. The reading text, vocabulary, and all exercises must directly relate to the topic. Default/generic content is not acceptable.

3. REQUIRED CONTENT IN EACH LESSON:
   - Reading: EXACTLY 5 paragraphs, EACH paragraph MUST have 3-4 complete sentences (min. 15 total)
   - Vocabulary: EXACTLY 5 vocabulary words with complete definitions
   - Warm-up: EXACTLY 5 questions AND 5 target vocabulary words (both in array format)
   - Comprehension: EXACTLY 5 questions (in array format)
   - Sentence Frames: EXACTLY 5 sentence frames (in array format)
   - Discussion: EXACTLY 5 discussion questions (in array format)
   - Quiz: EXACTLY 5 quiz questions with options and answers (in array format)` 
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
            const jsonContent = JSON.parse(content);
            return this.formatLessonContent(jsonContent);
          } catch (parseError) {
            console.error('Error parsing Qwen response as JSON:', parseError);
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
You are an expert ESL (English as a Second Language) teacher specializing in creating engaging, interactive lessons for ${levelDescription} (${cefrLevel}) level students.

LESSON SPECIFICATIONS:
- Topic: "${topic}"  
- Focus: "${focus}"
- CEFR Level: ${cefrLevel} (${levelDescription})
- Lesson Length: ${lessonLength} minutes
- Additional notes: ${additionalNotes || 'None'}

CLASSROOM CONTEXT AND PURPOSE:
This lesson will be used by a teacher conducting a 1-on-1 online class via screen sharing. The content should be visually engaging, highly interactive, and optimized for student participation.

CRITICAL LESSON DEVELOPMENT PROCESS:
1. FIRST, select EXACTLY 5 vocabulary words that are:
   - Appropriate for the ${cefrLevel} level
   - Highly relevant to the "${topic}" subject
   - Useful for students to know and discuss the topic

2. SECOND, write a reading passage that:
   - ESSENTIAL: Contains EXACTLY 5 substantial, well-structured paragraphs
   - CRITICAL: Each paragraph MUST have at least 3-4 complete sentences (minimum 15-20 sentences total)
   - IMPORTANT: The total reading text MUST be at least 20-30 sentences in total length
   - Incorporates ALL 5 vocabulary words naturally within the text
   - Is appropriate for ${cefrLevel} level in terms of language complexity
   - Covers the "${topic}" subject thoroughly but simply
   - Contains enough detail to support comprehension questions
   
3. THIRD, build the rest of the lesson around these vocabulary words and reading passage:
   - The warm-up should explicitly introduce the 5 vocabulary words
   - The vocabulary section should define the same 5 words from the reading
   - Comprehension questions should test understanding of the reading
   - All subsequent activities should build on the vocabulary and reading

REQUIRED LESSON STRUCTURE:
Return your response as a valid, properly-formatted JSON object that strictly adheres to the following structure. Make sure all arrays use proper square brackets [] and all objects use proper curly braces {}. Do not use property names as values, and ensure all string values are properly quoted:

{
  "title": "Engaging and descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Brief, engaging activity introducing the main topic and our 5 key vocabulary items: recycling, pollution, ecosystem, landfill, and sustainability.",
      "questions": [
        "What do you know about environmental protection?",
        "Have you ever practiced recycling at home?",
        "What kinds of pollution have you seen in your area?",
        "Why do you think ecosystems are important?",
        "What can we do to make our world more sustainable?"
      ],
      "imageDescription": "A clean park with recycling bins, trees, and people enjoying nature",
      "targetVocabulary": ["recycling", "pollution", "ecosystem", "landfill", "sustainability"],
      "timeAllocation": "5 minutes",
      "teacherNotes": "Start by showing images of each vocabulary item. Ask students to share any experiences with recycling or pollution in their neighborhoods."
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Let's read about why environmental protection is important and what we can do to help.",
      "paragraphs": [
        "Environmental protection is becoming more important every day. People around the world are realizing that we need to take care of our planet. One simple way we can help is by recycling items like paper, plastic, and glass instead of throwing them away.",
        "Pollution is a serious problem that affects our air, water, and land. When factories release harmful chemicals or when we use too many cars, the air becomes dirty and difficult to breathe. Similarly, when trash is dumped into rivers and oceans, it harms the fish and other creatures living there.",
        "Every living thing is part of an ecosystem, which is like a community where plants, animals, and their environment all depend on each other. When one part of an ecosystem is damaged by pollution or development, it can affect everything else. For example, if bees disappear, many plants cannot produce fruits because bees help with pollination.",
        "Most of our garbage ends up in landfills, which are large areas where waste is buried underground. Landfills take up valuable space and can leak harmful substances into the soil and water. By reducing waste and recycling more, we can send less trash to landfills and protect our environment.",
        "For a better future, we need to focus on sustainability, which means meeting our needs today without making it harder for future generations. Using renewable energy like solar and wind power, conserving water, and protecting forests are all ways to live more sustainably. Everyone can contribute to environmental protection through small daily actions."
      ]
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "recycling",
          "partOfSpeech": "noun",
          "definition": "The process of collecting used materials and making them into new products instead of throwing them away.",
          "example": "One simple way we can help is by recycling items like paper, plastic, and glass instead of throwing them away."
        },
        {
          "term": "pollution",
          "partOfSpeech": "noun",
          "definition": "The presence of harmful substances in the environment, such as dirty chemicals in the air, water, or soil.",
          "example": "Pollution is a serious problem that affects our air, water, and land."
        },
        {
          "term": "ecosystem",
          "partOfSpeech": "noun",
          "definition": "A community of living things and their environment, all interacting as a system.",
          "example": "Every living thing is part of an ecosystem, which is like a community where plants, animals, and their environment all depend on each other."
        },
        {
          "term": "landfill",
          "partOfSpeech": "noun",
          "definition": "A place where waste is buried under the ground.",
          "example": "Most of our garbage ends up in landfills, which are large areas where waste is buried underground."
        },
        {
          "term": "sustainability",
          "partOfSpeech": "noun",
          "definition": "The ability to maintain or support a process continuously over time, meeting present needs without compromising future generations.",
          "example": "For a better future, we need to focus on sustainability, which means meeting our needs today without making it harder for future generations."
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        "What is one simple way we can help protect the environment?",
        "How does pollution affect our environment?",
        "What happens when one part of an ecosystem is damaged?",
        "Why are landfills a problem for the environment?",
        "What does sustainability mean according to the reading?"
      ]
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "frames": [
        "I think recycling is important because _______.",
        "Pollution affects _______ by _______.",
        "In an ecosystem, _______ depends on _______.",
        "Landfills can be problematic because _______.",
        "We can be more sustainable by _______."
      ]
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        "What do you think is the biggest environmental problem in your country?",
        "How does your family practice recycling at home?",
        "Do you think companies should be responsible for reducing pollution? Why or why not?",
        "What ecosystems are important in your local area?",
        "What sustainable practices would you like to adopt in your daily life?"
      ]
    },
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {
          "question": "What is recycling?",
          "options": ["Throwing away used materials", "Making new products from used materials", "Burning waste", "Burying trash underground"],
          "answer": "Making new products from used materials"
        },
        {
          "question": "Which of these is NOT a type of pollution mentioned in the reading?",
          "options": ["Air pollution", "Water pollution", "Land pollution", "Noise pollution"],
          "answer": "Noise pollution"
        },
        {
          "question": "Why are bees important to an ecosystem?",
          "options": ["They make honey", "They help with pollination", "They eat other insects", "They clean the environment"],
          "answer": "They help with pollination"
        },
        {
          "question": "What problem do landfills cause?",
          "options": ["They take up too little space", "They can leak harmful substances", "They create clean energy", "They reduce pollution"],
          "answer": "They can leak harmful substances"
        },
        {
          "question": "What is sustainability about?",
          "options": ["Meeting our needs today regardless of the future", "Focusing only on the future", "Meeting our needs today without compromising future generations", "Using only non-renewable resources"],
          "answer": "Meeting our needs today without compromising future generations"
        }
      ]
    }
  ]
}

DO NOT deviate from this structure. Don't add fields outside of arrays when they should be inside arrays. INCLUDE ALL SECTIONS shown in the example.`;
  }

  /**
   * Format and process the lesson content
   */
  private formatLessonContent(content: any): any {
    // Basic processing - just return the content as is for now
    // This would normally do more processing to handle content issues
    return content;
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');