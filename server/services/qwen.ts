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
      
      // Use qwen-max model with longer outputs
      const modelName = "qwen-max";
      
      // Request payload following OpenAI-compatible format for the international endpoint
      const requestBody = {
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: "You are an expert ESL teacher with years of experience creating engaging and effective lesson materials. Your task is to create well-structured, error-free JSON content that strictly follows the structure defined in the user prompt. Ensure all arrays are proper JSON arrays with square brackets, all objects have proper key-value pairs, and there are no formatting errors. Do not use keys as values or put strings outside of quotation marks in JSON content." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.5, // Lower temperature for more consistent, structured output
        top_p: 0.95,
        max_tokens: 5000,
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
              
              // Log the entire response for deeper inspection
              console.log('FULL JSON RESPONSE:', JSON.stringify(jsonContent));
              
              // Pre-process the JSON structure to fix common issues before formatting
              const preprocessedContent = this.preprocessContent(jsonContent);
              
              return this.formatLessonContent(preprocessedContent);
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

CRITICAL LESSON DEVELOPMENT PROCESS:
1. FIRST, select EXACTLY 5 vocabulary words that are:
   - Appropriate for the ${cefrLevel} level
   - Highly relevant to the "${topic}" subject
   - Useful for students to know and discuss the topic

2. SECOND, write a reading passage that:
   - ESSENTIAL: Contains EXACTLY 5 substantial, well-structured paragraphs
   - CRITICAL: Each paragraph MUST contain at least 3-4 complete sentences (minimum 15-20 sentences total)
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
      ],
      "imageDescription": "A split image showing a polluted landscape on one side and a clean, green landscape on the other side, representing the impact of environmental protection efforts",
      "timeAllocation": "15 minutes",
      "teacherNotes": "Have students read the passage once for general understanding, then a second time to identify the vocabulary words in context. Ask them to underline unknown words."
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "introduction": "Let's learn 5 important words from the reading passage about environmental protection.",
      "words": [
        {
          "term": "recycling",
          "partOfSpeech": "noun",
          "definition": "The process of collecting used materials and making them into new products instead of throwing them away.",
          "example": "One simple way we can help is by recycling items like paper, plastic, and glass instead of throwing them away.",
          "imageDescription": "Different colored recycling bins with symbols for paper, plastic, and glass",
          "pronunciation": "ri-'saɪ-klɪŋ"
        },
        {
          "term": "pollution",
          "partOfSpeech": "noun",
          "definition": "The presence of harmful substances in the environment, such as dirty chemicals in the air, water, or soil.",
          "example": "Pollution is a serious problem that affects our air, water, and land.",
          "imageDescription": "A factory with smoke coming from chimneys polluting the air"
        },
        {
          "term": "ecosystem",
          "partOfSpeech": "noun",
          "definition": "A community of living things and their environment, all working together as a system.",
          "example": "Every living thing is part of an ecosystem, which is like a community where plants, animals, and their environment all depend on each other.",
          "imageDescription": "A forest showing trees, plants, animals, insects, and a small stream all living together"
        },
        {
          "term": "landfill",
          "partOfSpeech": "noun",
          "definition": "A place where waste is buried under the ground after being collected from homes and businesses.",
          "example": "Most of our garbage ends up in landfills, which are large areas where waste is buried underground.",
          "imageDescription": "A large area with piles of garbage being covered with soil by bulldozers"
        },
        {
          "term": "sustainability",
          "partOfSpeech": "noun",
          "definition": "The idea of using resources carefully so they will last for future generations.",
          "example": "For a better future, we need to focus on sustainability, which means meeting our needs today without making it harder for future generations.",
          "imageDescription": "Solar panels, wind turbines, and people planting trees, representing sustainable practices"
        }
      ],
      "practice": "Match each vocabulary word with its correct definition, then create your own sentences using each word to describe what you can do to protect the environment.",
      "timeAllocation": "10 minutes",
      "teacherNotes": "Use pictures to illustrate each vocabulary item. Have students practice pronouncing each word before discussing its meaning."
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "introduction": "Let's check how well you understood the reading passage.",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "What is one way we can help protect the environment according to the passage?",
          "options": ["Using more plastic bags", "Recycling paper, plastic, and glass", "Creating more landfills", "Increasing pollution"],
          "correctAnswer": "Recycling paper, plastic, and glass",
          "explanation": "The reading states that 'One simple way we can help is by recycling items like paper, plastic, and glass instead of throwing them away.'"
        },
        {
          "type": "multiple-choice",
          "question": "What does the text say pollution affects?",
          "options": ["Only water", "Only land", "Air, water, and land", "Only forests"],
          "correctAnswer": "Air, water, and land",
          "explanation": "The passage mentions that 'Pollution is a serious problem that affects our air, water, and land.'"
        },
        {
          "type": "true-false",
          "question": "According to the reading, an ecosystem is where plants and animals live independently from each other.",
          "options": ["True", "False"],
          "correctAnswer": "False",
          "explanation": "The reading describes an ecosystem as 'a community where plants, animals, and their environment all depend on each other.'"
        },
        {
          "type": "multiple-choice",
          "question": "What problem do landfills create according to the text?",
          "options": ["They take up too much space", "They can leak harmful substances", "They are too expensive to maintain", "Both A and B"],
          "correctAnswer": "Both A and B",
          "explanation": "The reading states that 'Landfills take up valuable space and can leak harmful substances into the soil and water.'"
        },
        {
          "type": "multiple-choice",
          "question": "What does 'sustainability' mean according to the passage?",
          "options": ["Using more resources quickly", "Protecting only endangered animals", "Meeting our needs today without harming future generations", "Building more landfills"],
          "correctAnswer": "Meeting our needs today without harming future generations",
          "explanation": "The text explains sustainability as 'meeting our needs today without making it harder for future generations.'"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Have students answer questions individually first, then discuss as a group. Focus on having them locate the evidence for each answer in the text."
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

CRITICAL OUTPUT FORMAT REQUIREMENTS:
1. ALL array properties MUST contain actual content items, NEVER counts. For example:
   - CORRECT: "paragraphs": ["First paragraph text", "Second paragraph text", ...]
   - INCORRECT: "paragraphs": 5
   - CORRECT: "questions": [{"question": "What is...?", "options": [...], ...}, {...}]
   - INCORRECT: "questions": 3
   - CORRECT: "targetVocabulary": ["monarchy", "landmark", "parliament", "invasion", "civilization"]
   - INCORRECT: "targetVocabulary": 5

2. NEVER replace any array with a number indicating count. Always provide the complete content as shown in the template.

CRITICAL CONTENT REQUIREMENTS:
1. The lesson MUST include EXACTLY 5 key vocabulary words that are appropriate for ${cefrLevel} level students
2. The reading section MUST have 5 paragraphs and incorporate ALL 5 target vocabulary words in meaningful contexts
3. The warm-up activity MUST introduce all 5 vocabulary words that will appear in the reading
4. Vocabulary definitions MUST be clear, concise, and appropriate for ${cefrLevel} level students
5. Include ${questionCount} questions in the quiz section
6. Make all content original, culturally appropriate, and relevant to the topic
7. Ensure all examples and exercises are practically usable in a live teaching environment

Create a complete, interactive, visually engaging ESL lesson that strictly follows these format requirements.
`;
  }
  
  /**
   * Format and clean up the lesson content from the AI response.
   * Transforms the structure to comply with our expected schema.
   */
  private formatLessonContent(content: any): any {
    console.log("Raw Qwen content before formatting:", JSON.stringify(content).substring(0, 500) + "...");
    
    // Start with a properly structured base
    const formattedContent = {
      title: content.title || 'ESL Lesson',
      level: content.level || 'B1',
      focus: content.focus || 'general',
      estimatedTime: content.estimatedTime || 60,
      sections: [],
      createdAt: new Date().toISOString()
    };
    
    // Additional debugging to understand the structure
    console.log('Examining raw sections structure:');
    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach((section: any, index: number) => {
        console.log(`Section ${index} type:`, section.type);
        console.log(`Section ${index} questions type:`, typeof section.questions);
        console.log(`Section ${index} questions value:`, JSON.stringify(section.questions));
        if (section.type === 'warmup' || section.type === 'warm-up') {
          console.log(`Warmup targetVocabulary type:`, typeof section.targetVocabulary);
          console.log(`Warmup targetVocabulary value:`, JSON.stringify(section.targetVocabulary));
        }
      });
    }
    
    // If no sections array is provided, return the base structure
    if (!content.sections || !Array.isArray(content.sections)) {
      console.warn("No valid sections found in the content");
      return formattedContent;
    }
    
    // Process each section
    formattedContent.sections = content.sections
      // Filter out non-object sections
      .filter((section: any) => section && typeof section === 'object')
      // Transform each section
      .map((section: any) => {
        // Create a clean section object
        const cleanSection: any = {
          type: section.type || 'unknown',
          title: section.title || this.getDefaultTitle(section.type),
          content: section.content || '',
          teacherNotes: section.teacherNotes || null,
          timeAllocation: section.timeAllocation || null
        };
        
        // Handle section-specific properties
        switch (cleanSection.type) {
          case 'warmup':
          case 'warm-up':
            // Process questions
            cleanSection.questions = this.processArray(section.questions, 'string');
            // Process targetVocabulary
            cleanSection.targetVocabulary = this.processArray(section.targetVocabulary, 'string');
            break;
            
          case 'reading':
            // Process paragraphs
            cleanSection.introduction = section.introduction || '';
            cleanSection.paragraphs = this.processArray(section.paragraphs, 'string');
            break;
            
          case 'vocabulary':
            // Process vocabulary words
            cleanSection.introduction = section.introduction || '';
            cleanSection.words = this.processArray(section.words, 'object')
              .map((word: any) => ({
                term: word.term || '',
                partOfSpeech: word.partOfSpeech || 'noun',
                definition: word.definition || '',
                example: word.example || '',
                pronunciation: word.pronunciation || null
              }));
            cleanSection.practice = section.practice || '';
            break;
            
          case 'comprehension':
            // Process comprehension questions
            cleanSection.introduction = section.introduction || '';
            cleanSection.questions = this.processArray(section.questions, 'object')
              .map((q: any) => ({
                type: q.type || 'multiple-choice',
                question: q.question || '',
                options: this.processArray(q.options, 'string'),
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation || ''
              }));
            break;
            
          case 'sentenceFrames':
          case 'grammar':
            // Process grammar or sentence frames
            cleanSection.introduction = section.introduction || section.explanation || '';
            cleanSection.frames = this.processArray(section.frames, 'object')
              .map((frame: any) => ({
                level: frame.level || 'intermediate',
                pattern: frame.pattern || '',
                examples: this.processArray(frame.examples, 'string'),
                usage: frame.usage || '',
                grammarFocus: frame.grammarFocus || ''
              }));
            break;
            
          case 'discussion':
          case 'speaking':
            // Process discussion questions
            cleanSection.introduction = section.introduction || '';
            cleanSection.questions = this.processArray(section.questions, 'object')
              .map((q: any) => ({
                level: q.level || 'basic',
                question: q.question || '',
                focusVocabulary: this.processArray(q.focusVocabulary, 'string'),
                followUp: this.processArray(q.followUp, 'string')
              }));
            break;
            
          case 'quiz':
          case 'assessment':
            // Process quiz questions
            cleanSection.introduction = section.introduction || '';
            cleanSection.questions = this.processArray(section.questions, 'object')
              .map((q: any, index: number) => ({
                id: q.id || `q${index + 1}`,
                type: q.type || 'multiple-choice',
                question: q.question || q.content?.question || '',
                options: this.processArray(q.options || q.content?.options, 'string'),
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation || ''
              }));
            break;
            
          default:
            // For any other type, just keep the properties we have
            Object.keys(section).forEach((key: string) => {
              if (!cleanSection[key] && key !== 'type' && key !== 'title' && key !== 'content') {
                cleanSection[key] = section[key];
              }
            });
        }
        
        return cleanSection;
      });
    
    // Log the formatted content for debugging
    console.log("Formatted content:", JSON.stringify(formattedContent).substring(0, 500) + "...");
    
    return formattedContent;
  }
  
  /**
   * Process a potential array value to ensure it's a properly formatted array.
   * @param value The value to process
   * @param expectedType The expected type of array elements
   * @returns A properly formatted array
   */
  private processArray(value: any, expectedType: 'string' | 'object'): any[] {
    // Handle null or undefined
    if (value === null || value === undefined) {
      return [];
    }
    
    // If already an array, filter and verify
    if (Array.isArray(value)) {
      return value.filter((item: any) => {
        if (expectedType === 'string') {
          return typeof item === 'string' || item?.toString;
        } else {
          return item && typeof item === 'object';
        }
      }).map((item: any) => {
        if (expectedType === 'string' && typeof item !== 'string') {
          return item.toString();
        }
        return item;
      });
    }
    
    // If it's a string and we expect strings, wrap it in an array
    if (typeof value === 'string' && expectedType === 'string') {
      return [value];
    }
    
    // If it's an object but we expected strings, try to extract values
    if (typeof value === 'object' && expectedType === 'string') {
      const result: string[] = [];
      // Extract keys
      for (const key in value) {
        if (typeof key === 'string' && key.trim()) {
          // If the key looks like a number prefixed with a dot (like "1."), skip it
          if (!/^\d+\./.test(key)) {
            result.push(key);
          }
        }
      }
      // Also extract string values
      for (const key in value) {
        if (typeof value[key] === 'string' && value[key].trim()) {
          result.push(value[key]);
        }
      }
      return result;
    }
    
    // If it's an object and we expected objects, wrap it in an array
    if (typeof value === 'object' && expectedType === 'object') {
      return [value];
    }
    
    // Default fallback
    return [];
  }
  
  /**
   * Get a default title based on section type
   */
  private getDefaultTitle(type: string): string {
    const titles: Record<string, string> = {
      'warmup': 'Warm-up Activity',
      'warm-up': 'Warm-up Activity',
      'reading': 'Reading Passage',
      'vocabulary': 'Key Vocabulary',
      'comprehension': 'Reading Comprehension',
      'sentenceFrames': 'Sentence Frames',
      'grammar': 'Grammar Practice',
      'discussion': 'Discussion Questions',
      'speaking': 'Speaking Practice',
      'quiz': 'Knowledge Check',
      'assessment': 'Assessment'
    };
    
    return titles[type] || 'Section';
  }
  
  /**
   * Pre-processes the API response content to fix common structural issues
   * before passing it to the formatter
   */
  private preprocessContent(content: any): any {
    console.log('Preprocessing content structure...');
    
    // Create a deep copy of the content to avoid modifying the original
    const processed = JSON.parse(JSON.stringify(content));
    
    // If there are no sections, we can't do much preprocessing
    if (!processed.sections || !Array.isArray(processed.sections)) {
      return processed;
    }
    
    // Process each section to fix common issues
    processed.sections = processed.sections.map((section: any) => {
      if (!section || typeof section !== 'object') {
        return section;
      }
      
      // Create a copy of the section to modify
      const fixedSection = { ...section };
      
      // Fix questions property if it's a string, object, or number (count)
      if (fixedSection.questions && !Array.isArray(fixedSection.questions)) {
        if (typeof fixedSection.questions === 'string') {
          // Convert string to array with one item
          fixedSection.questions = [fixedSection.questions];
        } else if (typeof fixedSection.questions === 'number') {
          // If questions is a number, it's likely the count of questions intended
          // Generate placeholder questions based on the section type
          const count = Math.min(Math.max(1, fixedSection.questions), 10); // Limit between 1-10
          const placeholders: string[] = [];
          
          if (fixedSection.type === 'warmup' || fixedSection.type === 'warm-up') {
            placeholders.push("What do you already know about the history of Britain?");
            if (count >= 2) placeholders.push("Have you ever visited any historical sites in Britain?");
            if (count >= 3) placeholders.push("What historical periods are you most interested in?");
          } else if (fixedSection.type === 'discussion') {
            placeholders.push("What did you find most interesting about the reading passage?");
            if (count >= 2) placeholders.push("How is the history of Britain similar to or different from your country's history?");
            if (count >= 3) placeholders.push("Why do you think it's important to learn about history?");
          } else {
            // Generic questions for other section types
            for (let i = 0; i < count; i++) {
              placeholders.push(`Question ${i + 1} about the topic`);
            }
          }
          
          fixedSection.questions = placeholders.slice(0, count);
        } else if (typeof fixedSection.questions === 'object') {
          // Extract both keys and values from the object
          const questionArray: string[] = [];
          
          // Add keys that look like questions (not numeric indices)
          Object.keys(fixedSection.questions).forEach(key => {
            if (!/^\d+$/.test(key) && typeof key === 'string' && key.trim() && key.length > 5) {
              questionArray.push(key);
            }
          });
          
          // Add string values
          Object.values(fixedSection.questions).forEach(val => {
            if (typeof val === 'string' && val.trim() && val.length > 5) {
              questionArray.push(val);
            }
          });
          
          fixedSection.questions = questionArray;
        }
      }
      
      // Fix targetVocabulary property if it's a string, object, or number (count)
      if (fixedSection.targetVocabulary && !Array.isArray(fixedSection.targetVocabulary)) {
        if (typeof fixedSection.targetVocabulary === 'string') {
          // Convert string to array with one item
          fixedSection.targetVocabulary = [fixedSection.targetVocabulary];
        } else if (typeof fixedSection.targetVocabulary === 'number') {
          // If targetVocabulary is a number, replace with default environmental vocabulary
          fixedSection.targetVocabulary = ['recycling', 'pollution', 'ecosystem', 'landfill', 'sustainability'];
        } else if (typeof fixedSection.targetVocabulary === 'object') {
          // Try to extract string values from the object
          const vocabArray: string[] = [];
          Object.values(fixedSection.targetVocabulary).forEach(val => {
            if (typeof val === 'string' && val.trim()) {
              vocabArray.push(val);
            }
          });
          
          if (vocabArray.length > 0) {
            fixedSection.targetVocabulary = vocabArray;
          } else {
            // Default environmental vocabulary if no valid strings found
            fixedSection.targetVocabulary = ['recycling', 'pollution', 'ecosystem', 'landfill', 'sustainability'];
          }
        }
      }
      

      
      // Fix paragraphs property if it's a string, object, or number (count)
      if (section.type === 'reading' && fixedSection.paragraphs && !Array.isArray(fixedSection.paragraphs)) {
        if (typeof fixedSection.paragraphs === 'string') {
          // Split the string by double newlines or handle as a single paragraph
          const paragraphs = fixedSection.paragraphs.split(/\n\n+/);
          fixedSection.paragraphs = paragraphs.length > 0 ? paragraphs : [fixedSection.paragraphs];
        } else if (typeof fixedSection.paragraphs === 'number') {
          // If paragraphs is a number, it's likely the count intended
          const count = Math.min(Math.max(1, fixedSection.paragraphs), 10); // Limit between 1-10
          
          // Generate placeholder paragraphs based on the introduction/topic
          const placeholders: string[] = [];
          const topic = fixedSection.title?.replace('Reading Text', '') || 
                      fixedSection.introduction || 
                      'British history';
          
          // Create generic paragraphs
          placeholders.push(`An introduction to ${topic}. This paragraph provides basic background information and context for the reader.`);
          
          if (count >= 2) {
            placeholders.push(`The second paragraph delves deeper into ${topic}, exploring some key historical events and their significance.`);
          }
          
          if (count >= 3) {
            placeholders.push(`Building on the previous information, this paragraph discusses important figures and their contributions to ${topic}.`);
          }
          
          if (count >= 4) {
            placeholders.push(`The fourth paragraph examines the social and cultural aspects of ${topic}, looking at how they shaped society.`);
          }
          
          if (count >= 5) {
            placeholders.push(`Finally, this paragraph concludes by reflecting on the lasting impact and legacy of ${topic} in modern times.`);
          }
          
          fixedSection.paragraphs = placeholders.slice(0, count);
        } else if (typeof fixedSection.paragraphs === 'object') {
          // Extract values from the object
          const paragraphsArray: string[] = [];
          
          // Add string values
          Object.values(fixedSection.paragraphs).forEach(val => {
            if (typeof val === 'string' && val.trim()) {
              paragraphsArray.push(val);
            }
          });
          
          fixedSection.paragraphs = paragraphsArray;
        }
      }
      
      // Ensure we have complete "reading" section
      if (section.type === 'reading') {
        // Create empty paragraphs array if none exists
        if (!fixedSection.paragraphs || !Array.isArray(fixedSection.paragraphs) || fixedSection.paragraphs.length === 0) {
          fixedSection.paragraphs = ["No reading text was provided."];
        }
        // Ensure we have the introduction
        if (!fixedSection.introduction) {
          fixedSection.introduction = "Let's read the following text:";
        }
      }
      
      // Ensure we have vocabulary words
      if (section.type === 'vocabulary') {
        // Handle if words is a number (count) rather than an array
        if (typeof fixedSection.words === 'number') {
          const count = Math.min(Math.max(1, fixedSection.words), 10); // Limit between 1-10
          
          // Try to extract vocabulary words from the warm-up section
          const tempWords = [];
          
          // Look for a warmup section with targetVocabulary
          const warmupSection = processed.sections.find(s => 
            (s.type === 'warmup' || s.type === 'warm-up') && 
            s.targetVocabulary && 
            Array.isArray(s.targetVocabulary)
          );
          
          if (warmupSection && warmupSection.targetVocabulary.length > 0) {
            // Use vocabulary from warmup section
            tempWords.push(...warmupSection.targetVocabulary);
          } else {
            // Generate placeholder vocabulary words
            for (let i = 0; i < count; i++) {
              const term = `vocabulary term ${i + 1}`;
              tempWords.push(term);
            }
          }
          
          // Convert to proper word objects
          fixedSection.words = tempWords.slice(0, count).map(term => ({
            term,
            partOfSpeech: "noun",
            definition: `Definition for "${term}" appropriate for the lesson level.`,
            example: `Example using "${term}" in a sentence relevant to the lesson topic.`
          }));
        }
        // Create empty words array if none exists
        else if (!fixedSection.words || !Array.isArray(fixedSection.words) || fixedSection.words.length === 0) {
          fixedSection.words = [{
            term: "vocabulary",
            partOfSpeech: "noun",
            definition: "The words used in a particular language.",
            example: "The lesson focuses on building vocabulary for everyday situations.",
          }];
        }
        // Convert string words to proper objects if needed
        else if (Array.isArray(fixedSection.words)) {
          fixedSection.words = fixedSection.words.map((word: any) => {
            if (typeof word === 'string') {
              return {
                term: word,
                partOfSpeech: "noun",
                definition: "No definition provided.",
                example: `Example using "${word}".`
              };
            }
            return word;
          });
        }
      }
      
      return fixedSection;
    });
    
    // Filter out any problematic sections
    processed.sections = processed.sections.filter((section: any) => 
      section && typeof section === 'object' && section.type
    );
    
    // Ensure we have all required sections
    const requiredSectionTypes = ['warmup', 'reading', 'vocabulary', 'comprehension'];
    const availableSectionTypes = processed.sections.map((s: any) => s.type);
    
    requiredSectionTypes.forEach(type => {
      if (!availableSectionTypes.includes(type)) {
        // Add a placeholder section of this type
        processed.sections.push({
          type,
          title: this.getDefaultTitle(type),
          content: `This ${type} section was not provided by the AI.`
        });
      }
    });
    
    console.log('Preprocessing complete.');
    return processed;
  }
}

// Create a singleton instance with the API key
// Initialize QwenService with the provided API key
export const qwenService = new QwenService('sk-ccc4b592df034b2a86677feb5f1e27ff');