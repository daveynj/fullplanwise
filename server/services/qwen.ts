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
   - Quiz: EXACTLY 5 quiz questions with options and answers (in array format)
   
3. EXAMPLE OF COMPLETE FORMAT - INCLUDE ALL THESE SECTIONS:

{
  "title": "Environmental Protection",
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "questions": [
        "What do you know about recycling?", 
        "How do you reduce waste?", 
        "What pollution have you seen?",
        "Why are ecosystems important?",
        "What sustainable actions do you take?"
      ],
      "targetVocabulary": ["recycling", "pollution", "ecosystem", "landfill", "sustainability"]
    },
    {
      "type": "reading",
      "title": "Reading Text",
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

DO NOT deviate from this structure. Don't add fields outside of arrays when they should be inside arrays. INCLUDE ALL SECTIONS shown in the example.` 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
        top_p: 0.9,
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
        
        // Log the raw response before any processing
        console.log('====== RAW QWEN API RESPONSE BEGIN ======');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('====== RAW QWEN API RESPONSE END ======');
        
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
              
              // DETAILED RESPONSE ANALYSIS
              console.log('====== QWEN RESPONSE ANALYSIS BEGIN ======');
              
              // Check title
              console.log('Title:', jsonContent.title || 'NO TITLE FOUND');
              
              // Check if sections array exists
              if (!jsonContent.sections || !Array.isArray(jsonContent.sections)) {
                console.log('ERROR: No valid sections array found');
              } else {
                console.log(`Found ${jsonContent.sections.length} sections`);
                
                // Check each section for required structure
                jsonContent.sections.forEach((section: any, index: number) => {
                  console.log(`\nSECTION ${index + 1} (type: ${section.type || 'unknown'})`);
                  
                  // Check common fields
                  console.log('  Title:', section.title || 'NO TITLE');
                  
                  // Check section-specific fields
                  switch(section.type) {
                    case 'warmup':
                      this.logArrayField(section, 'questions');
                      this.logArrayField(section, 'targetVocabulary');
                      break;
                    case 'reading':
                      this.logArrayField(section, 'paragraphs');
                      if (section.paragraphs && Array.isArray(section.paragraphs)) {
                        console.log('  Reading length:', section.paragraphs.reduce((total: number, p: string) => total + p.length, 0), 'characters');
                      }
                      break;
                    case 'vocabulary':
                      if (!section.words || !Array.isArray(section.words)) {
                        console.log('  ERROR: No valid words array');
                      } else {
                        console.log(`  Words: ${section.words.length} definitions found`);
                        section.words.forEach((word: any, i: number) => {
                          console.log(`    Word ${i + 1}: ${word.term || 'MISSING'} (${word.definition ? word.definition.substring(0, 30) + '...' : 'NO DEFINITION'})`);
                        });
                      }
                      break;
                    case 'comprehension':
                      this.logArrayField(section, 'questions');
                      break;
                    case 'sentenceFrames':
                      this.logArrayField(section, 'frames');
                      break;
                    case 'discussion':
                      this.logArrayField(section, 'questions');
                      break;
                    case 'quiz':
                      if (!section.questions || !Array.isArray(section.questions)) {
                        console.log('  ERROR: No valid quiz questions array');
                      } else {
                        console.log(`  Quiz: ${section.questions.length} questions found`);
                        section.questions.forEach((q: any, i: number) => {
                          console.log(`    Q${i + 1}: ${q.question ? 'OK' : 'MISSING'} | Options: ${q.options && Array.isArray(q.options) ? q.options.length : 'MISSING'} | Answer: ${q.answer ? 'OK' : 'MISSING'}`);
                        });
                      }
                      break;
                    default:
                      console.log('  UNKNOWN SECTION TYPE');
                  }
                });
              }
              
              console.log('====== QWEN RESPONSE ANALYSIS END ======');
              
              // Log the entire response for deeper inspection
              console.log('FULL JSON RESPONSE:', JSON.stringify(jsonContent));
              
              // Save the full response to a file for easier inspection
              try {
                // Instead of using require, log the full content to console for inspection
                console.log('====== FULL RAW QWEN RESPONSE BEGIN ======');
                console.log(JSON.stringify(jsonContent, null, 2));
                console.log('====== FULL RAW QWEN RESPONSE END ======');
              } catch (fsError) {
                console.error('Error logging full response:', fsError);
              }
              
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
            
            // If questions is an array of strings, convert them to proper question objects
            if (Array.isArray(section.questions) && section.questions.length > 0 && typeof section.questions[0] === 'string') {
              cleanSection.questions = section.questions.map((question: string) => ({
                type: 'short-answer',
                question: question,
                options: [],
                correctAnswer: '',
                explanation: ''
              }));
            } else {
              // Otherwise process as objects
              cleanSection.questions = this.processArray(section.questions, 'object')
                .map((q: any) => ({
                  type: q.type || 'multiple-choice',
                  question: q.question || '',
                  options: this.processArray(q.options, 'string'),
                  correctAnswer: q.correctAnswer || '',
                  explanation: q.explanation || ''
                }));
            }
            
            // If still no questions, create default ones from content
            if (cleanSection.questions.length === 0) {
              // See if we can find a reading section to base questions on
              const readingSection = Array.isArray(content.sections) && 
                content.sections.find((s: any) => s.type === 'reading');
                
              if (readingSection && Array.isArray(readingSection.paragraphs) && readingSection.paragraphs.length > 0) {
                cleanSection.questions = [
                  {
                    type: 'short-answer',
                    question: 'What is the main idea of the reading passage?',
                    options: [],
                    correctAnswer: '',
                    explanation: ''
                  },
                  {
                    type: 'short-answer',
                    question: 'What are some key details from the text?',
                    options: [],
                    correctAnswer: '',
                    explanation: ''
                  },
                  {
                    type: 'short-answer',
                    question: 'How does this topic relate to your own experiences?',
                    options: [],
                    correctAnswer: '',
                    explanation: ''
                  }
                ];
              }
            }
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
   * Deeply analyze the structure of the raw API response
   * to identify issues with the response format
   */
  private analyzeRawStructure(content: any): any {
    try {
      const analysis: any = {
        title: content.title || 'MISSING TITLE',
        hasValidSectionsArray: content.sections && Array.isArray(content.sections),
        sectionCount: content.sections && Array.isArray(content.sections) ? content.sections.length : 0,
        sections: [],
        missingRequiredSections: [],
        malformedSections: []
      };
      
      // Define the required sections and their expected structure
      const requiredSections = [
        'warmup', 'reading', 'vocabulary', 'comprehension', 'sentenceFrames', 'discussion', 'quiz'
      ];
      
      // Check for missing required sections
      if (content.sections && Array.isArray(content.sections)) {
        const existingSectionTypes = content.sections.map((s: any) => s.type);
        analysis.missingRequiredSections = requiredSections.filter(type => !existingSectionTypes.includes(type));
        
        // Analyze each section
        content.sections.forEach((section: any, index: number) => {
          const sectionAnalysis: any = {
            index,
            type: section.type || 'UNKNOWN',
            hasTitle: !!section.title,
            issues: []
          };
          
          // Check section-specific fields
          switch(section.type) {
            case 'warmup':
              this.analyzeSectionArray(section, 'questions', 5, sectionAnalysis);
              this.analyzeSectionArray(section, 'targetVocabulary', 5, sectionAnalysis);
              break;
            case 'reading':
              this.analyzeSectionArray(section, 'paragraphs', 5, sectionAnalysis);
              if (section.paragraphs && Array.isArray(section.paragraphs)) {
                sectionAnalysis.totalReadingLength = section.paragraphs.reduce((total: number, p: string) => total + p.length, 0);
                if (sectionAnalysis.totalReadingLength < 500) {
                  sectionAnalysis.issues.push('Reading text is too short (less than 500 characters)');
                }
              }
              break;
            case 'vocabulary':
              if (!section.words || !Array.isArray(section.words)) {
                sectionAnalysis.issues.push('Missing words array or not an array');
              } else {
                sectionAnalysis.wordsCount = section.words.length;
                if (section.words.length < 5) {
                  sectionAnalysis.issues.push(`Only ${section.words.length} words (5 required)`);
                }
                
                // Check if each word has required properties
                section.words.forEach((word: any, i: number) => {
                  if (!word.term) sectionAnalysis.issues.push(`Word ${i+1} missing 'term'`);
                  if (!word.definition) sectionAnalysis.issues.push(`Word ${i+1} missing 'definition'`);
                });
              }
              break;
            case 'comprehension':
              this.analyzeSectionArray(section, 'questions', 5, sectionAnalysis);
              break;
            case 'sentenceFrames':
              this.analyzeSectionArray(section, 'frames', 5, sectionAnalysis);
              break;
            case 'discussion':
              this.analyzeSectionArray(section, 'questions', 5, sectionAnalysis);
              break;
            case 'quiz':
              if (!section.questions || !Array.isArray(section.questions)) {
                sectionAnalysis.issues.push('Missing quiz questions array or not an array');
              } else {
                sectionAnalysis.questionsCount = section.questions.length;
                if (section.questions.length < 5) {
                  sectionAnalysis.issues.push(`Only ${section.questions.length} quiz questions (5 required)`);
                }
                
                // Check if each question has required properties
                section.questions.forEach((q: any, i: number) => {
                  if (typeof q === 'string') {
                    sectionAnalysis.issues.push(`Quiz question ${i+1} is string, not object with options/answer`);
                  } else if (!q.question) {
                    sectionAnalysis.issues.push(`Quiz question ${i+1} missing 'question' field`);
                  } else if (!q.options || !Array.isArray(q.options)) {
                    sectionAnalysis.issues.push(`Quiz question ${i+1} missing 'options' array`);
                  } else if (!q.answer) {
                    sectionAnalysis.issues.push(`Quiz question ${i+1} missing 'answer' field`);
                  }
                });
              }
              break;
            default:
              sectionAnalysis.issues.push('Unknown section type');
          }
          
          // If section has issues, add to malformed sections list
          if (sectionAnalysis.issues.length > 0) {
            analysis.malformedSections.push(section.type);
          }
          
          analysis.sections.push(sectionAnalysis);
        });
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing raw structure:', error);
      return { error: 'Failed to analyze structure' };
    }
  }
  
  /**
   * Helper method to analyze arrays within sections
   */
  private analyzeSectionArray(section: any, fieldName: string, expectedCount: number, analysis: any): void {
    if (!section[fieldName]) {
      analysis.issues.push(`Missing '${fieldName}' field`);
    } else if (!Array.isArray(section[fieldName])) {
      analysis.issues.push(`'${fieldName}' is not an array (type: ${typeof section[fieldName]})`);
    } else {
      analysis[`${fieldName}Count`] = section[fieldName].length;
      if (section[fieldName].length < expectedCount) {
        analysis.issues.push(`Only ${section[fieldName].length} ${fieldName} (${expectedCount} required)`);
      }
    }
  }
  
  /**
   * Helper method to log array fields for response analysis
   */
  private logArrayField(section: any, fieldName: string): void {
    if (!section[fieldName]) {
      console.log(`  ERROR: No ${fieldName} field found`);
      return;
    }
    
    if (!Array.isArray(section[fieldName])) {
      console.log(`  ERROR: ${fieldName} is not a valid array (type: ${typeof section[fieldName]})`);
      console.log(`  ${fieldName} value:`, section[fieldName]);
      return;
    }
    
    console.log(`  ${fieldName}: ${section[fieldName].length} items found`);
    
    if (section[fieldName].length === 0) {
      console.log(`  WARNING: ${fieldName} array is empty`);
    } else if (section[fieldName].length < 5) {
      console.log(`  WARNING: ${fieldName} has less than 5 items (${section[fieldName].length})`);
    }
    
    // Log the first few items as examples
    const samplesToShow = Math.min(3, section[fieldName].length);
    for (let i = 0; i < samplesToShow; i++) {
      let item = section[fieldName][i];
      let displayItem = typeof item === 'string' 
        ? (item.length > 50 ? item.substring(0, 50) + '...' : item)
        : JSON.stringify(item).substring(0, 50) + (JSON.stringify(item).length > 50 ? '...' : '');
      console.log(`    Item ${i + 1}: ${displayItem}`);
    }
  }

  /**
   * Pre-processes the API response content to fix common structural issues
   * before passing it to the formatter
   */
  private preprocessContent(content: any): any {
    console.log('Preprocessing content structure...');
    console.log('Raw Qwen content before formatting:', JSON.stringify(content).substring(0, 200) + '...');
    
    // Create a deep copy of the content to avoid modifying the original
    const processed = JSON.parse(JSON.stringify(content));
    
    // Analyze the raw structure for issues
    const rawStructureAnalysis = this.analyzeRawStructure(content);
    console.log('RAW STRUCTURE ANALYSIS:');
    console.log(JSON.stringify(rawStructureAnalysis, null, 2));
    
    // If there are no sections, we can't do much preprocessing
    if (!processed.sections || !Array.isArray(processed.sections)) {
      console.error('ERROR: No valid sections array found');
      return processed;
    }
    
    // Process each section to fix common issues
    for (let i = 0; i < processed.sections.length; i++) {
      const section = processed.sections[i];
      if (!section || typeof section !== 'object') {
        continue;
      }
      
      // Log section structure for debugging
      console.log(`Examining raw sections structure:`);
      console.log(`Section ${i} type: ${section.type}`);
      
      // Extract questions from plain object properties
      if (section.questions) {
        console.log(`Section ${i} questions type: ${typeof section.questions}`);
        console.log(`Section ${i} questions value: ${JSON.stringify(section.questions)}`);
      }
      
      // Extract target vocabulary from plain object properties if in warmup section
      if (section.type === 'warmup' || section.type === 'warm-up') {
        if (section.targetVocabulary) {
          console.log(`Warmup targetVocabulary type: ${typeof section.targetVocabulary}`);
          console.log(`Warmup targetVocabulary value: ${JSON.stringify(section.targetVocabulary)}`);
        }
        
        // Check for vocabulary words in object keys
        const possibleVocabulary = Object.keys(section).filter(key => 
          !['type', 'title', 'content', 'questions', 'targetVocabulary', 'timeAllocation', 'teacherNotes', 'imageDescription', 'introduction'].includes(key) && 
          typeof key === 'string' && 
          key.length < 20 && 
          /^[a-zA-Z\s]+$/.test(key)
        );
        
        if (possibleVocabulary.length > 0 && (!section.targetVocabulary || section.targetVocabulary.length < 5)) {
          if (!section.targetVocabulary) {
            section.targetVocabulary = [];
          } else if (!Array.isArray(section.targetVocabulary)) {
            section.targetVocabulary = [section.targetVocabulary];
          }
          
          // Add vocabulary words found in object keys
          possibleVocabulary.forEach(word => {
            if (!section.targetVocabulary.includes(word)) {
              section.targetVocabulary.push(word);
            }
          });
        }
      }
      
      // Create a copy of the section to modify
      const fixedSection = { ...section };
      
      // Handle reading content as a combined string to be split into paragraphs
      if (section.type === 'reading' && typeof fixedSection.content === 'string' && fixedSection.content.length > 100) {
        // If content field contains substantial text but no paragraphs field exists or is empty
        if (!fixedSection.paragraphs || (Array.isArray(fixedSection.paragraphs) && fixedSection.paragraphs.length === 0)) {
          console.log('Found reading content in content field, splitting into paragraphs');
          // Split by double line breaks or by periods followed by spaces to create paragraphs
          const textBlocks = fixedSection.content.split(/\n\n+/);
          if (textBlocks.length >= 3) {
            fixedSection.paragraphs = textBlocks;
          } else {
            // If not enough paragraph breaks, try to split by sentences
            const sentences = fixedSection.content.split(/\.\s+/);
            const paragraphs = [];
            let currentParagraph = '';
            
            // Group sentences into paragraphs (3-4 sentences per paragraph)
            for (let i = 0; i < sentences.length; i++) {
              if (sentences[i].trim()) {
                currentParagraph += sentences[i].trim() + '. ';
                
                // Create a new paragraph after 3-4 sentences or at the end
                if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
                  paragraphs.push(currentParagraph.trim());
                  currentParagraph = '';
                }
              }
            }
            
            if (paragraphs.length >= 3) {
              fixedSection.paragraphs = paragraphs;
            } else {
              // If still not enough paragraphs, create at least 5 paragraphs
              fixedSection.paragraphs = [
                fixedSection.content.substring(0, Math.floor(fixedSection.content.length / 5)),
                fixedSection.content.substring(Math.floor(fixedSection.content.length / 5), Math.floor(fixedSection.content.length * 2 / 5)),
                fixedSection.content.substring(Math.floor(fixedSection.content.length * 2 / 5), Math.floor(fixedSection.content.length * 3 / 5)),
                fixedSection.content.substring(Math.floor(fixedSection.content.length * 3 / 5), Math.floor(fixedSection.content.length * 4 / 5)),
                fixedSection.content.substring(Math.floor(fixedSection.content.length * 4 / 5))
              ];
            }
          }
        }
      }
      
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
        // Look for content with vocabulary terms in it, if present but no words array
        if (typeof fixedSection.content === 'string' && fixedSection.content.length > 0 && 
            (!fixedSection.words || !Array.isArray(fixedSection.words) || fixedSection.words.length === 0)) {
          console.log('Found vocabulary content but no words array, extracting vocabulary terms...');
          
          // Try to extract vocabulary terms from content
          // Look for patterns like "1. term - definition" or bullet points
          const termRegex = /[•\-\*\d+\.]\s*([A-Za-z]+)\s*[:-]\s*([^•\-\*\d\.]+)/g;
          const matches = [...fixedSection.content.matchAll(termRegex)];
          
          if (matches.length > 0) {
            // Convert matches to word objects
            fixedSection.words = matches.map(match => ({
              term: match[1].trim(),
              partOfSpeech: "noun",
              definition: match[2].trim(),
              example: `Example using "${match[1].trim()}" in context.`
            }));
            
            console.log(`Extracted ${fixedSection.words.length} vocabulary terms from content`);
          }
        }
        
        // Handle if words is a number (count) rather than an array
        if (typeof fixedSection.words === 'number') {
          const count = Math.min(Math.max(1, fixedSection.words), 10); // Limit between 1-10
          
          // Try to extract vocabulary words from the warm-up section
          const tempWords = [];
          
          // Look for a warmup section with targetVocabulary
          const warmupSection = processed.sections.find((s: any) => 
            (s.type === 'warmup' || s.type === 'warm-up') && 
            s.targetVocabulary && 
            Array.isArray(s.targetVocabulary)
          );
          
          if (warmupSection && warmupSection.targetVocabulary && warmupSection.targetVocabulary.length > 0) {
            // Use vocabulary from warmup section
            tempWords.push(...warmupSection.targetVocabulary);
          } else {
            // Try to find vocabulary terms in any section's content
            const vocabMentions: string[] = [];
            processed.sections.forEach((s: any) => {
              if (s && typeof s.content === 'string') {
                // Look for words in quotes, capitalized terms, or specific patterns
                const possibleTerms = s.content.match(/["']([^"']+)["']|\b([A-Z][a-z]{2,})\b/g);
                if (possibleTerms && possibleTerms.length > 0) {
                  vocabMentions.push(...possibleTerms.map((term: string) => 
                    term.replace(/["']/g, '').trim()
                  ));
                }
              }
            });
            
            // Use extracted vocab terms or fallback to defaults
            if (vocabMentions.length > 0) {
              // Get unique terms
              const uniqueTerms = Array.from(new Set<string>(vocabMentions));
              tempWords.push(...uniqueTerms.slice(0, 5));
            } else {
              // Generate placeholder vocabulary words
              for (let i = 0; i < count; i++) {
                const term = `vocabulary term ${i + 1}`;
                tempWords.push(term);
              }
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
          // Try to extract terms from the topic of the lesson
          const topic = processed.title || 'vocabulary';
          const topicWords = topic.split(/\s+/).filter((word: string) => word.length > 3);
          
          if (topicWords.length > 0) {
            fixedSection.words = topicWords.slice(0, 5).map((term: string) => ({
              term: term.toLowerCase(),
              partOfSpeech: "noun",
              definition: `${term} is an important concept related to the lesson topic.`,
              example: `This lesson helps students understand the concept of ${term}.`,
            }));
          } else {
            fixedSection.words = [{
              term: "vocabulary",
              partOfSpeech: "noun",
              definition: "The words used in a particular language.",
              example: "The lesson focuses on building vocabulary for everyday situations.",
            }];
          }
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
      
      // Update the section in the processed.sections array
      processed.sections[i] = fixedSection;
    }
    
    // Filter out any problematic sections
    processed.sections = processed.sections.filter((section: any) => 
      section && typeof section === 'object' && section.type
    );
    
    // Process comprehension section to ensure questions are properly structured
    const comprehensionSection = processed.sections.find((s: any) => s.type === 'comprehension');
    if (comprehensionSection) {
      // If questions doesn't exist or isn't an array, try to extract from content
      if (!comprehensionSection.questions || !Array.isArray(comprehensionSection.questions) || comprehensionSection.questions.length === 0) {
        console.log('No proper questions array in comprehension section, trying to extract from content...');
        
        // Make sure we have content to parse
        if (typeof comprehensionSection.content === 'string' && comprehensionSection.content.length > 0) {
          const questionMatches: string[] = [];
          
          // Look for numbered questions or questions with question marks
          const lines = comprehensionSection.content.split('\n');
          let currentQuestion = '';
          
          lines.forEach((line: string) => {
            // Check if line is a question (starts with number or contains question mark)
            const isQuestionLine = /^\s*\d+[\.\)]\s+/.test(line) || /\?\s*$/.test(line);
            
            if (isQuestionLine) {
              // If we already have a question in progress, save it before starting new one
              if (currentQuestion.length > 0) {
                questionMatches.push(currentQuestion.trim());
                currentQuestion = '';
              }
              
              // Start new question with this line
              currentQuestion = line;
            } else if (currentQuestion.length > 0) {
              // Continue current question
              currentQuestion += ' ' + line.trim();
            }
          });
          
          // Add the last question if there is one
          if (currentQuestion.length > 0) {
            questionMatches.push(currentQuestion.trim());
          }
          
          // If we found questions, convert them to the proper format
          if (questionMatches.length > 0) {
            comprehensionSection.questions = questionMatches.map((q: string, index: number) => {
              // Clean up the question text
              const cleanedQuestion = q.replace(/^\s*\d+[\.\)]\s+/, '').trim();
              
              return {
                id: index + 1,
                text: cleanedQuestion,
                options: [],
                correctAnswer: '',
                explanation: 'Answer this question based on the reading passage.'
              };
            });
            
            console.log(`Extracted ${comprehensionSection.questions.length} questions from comprehension content`);
          }
        }
      }
      
      // If we still don't have questions, create placeholder questions based on the reading section
      if (!comprehensionSection.questions || !Array.isArray(comprehensionSection.questions) || comprehensionSection.questions.length === 0) {
        console.log('Creating default comprehension questions based on reading section...');
        
        // Find the reading section
        const readingSection = processed.sections.find((s: any) => s.type === 'reading');
        let readingContent = '';
        
        if (readingSection && typeof readingSection.content === 'string') {
          readingContent = readingSection.content;
        }
        
        // Create 5 default comprehension questions
        comprehensionSection.questions = [];
        
        for (let i = 0; i < 5; i++) {
          comprehensionSection.questions.push({
            id: i + 1,
            text: `Question ${i + 1} about the reading passage.`,
            options: [],
            correctAnswer: '',
            explanation: 'This question tests understanding of the main text.'
          });
        }
        
        // If we have reading content, make the questions more relevant
        if (readingContent.length > 0) {
          // Extract potential question topics from reading content
          const sentences = readingContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
          
          if (sentences.length > 0) {
            // Use sentences to create better question templates
            const questionsToUpdate = Math.min(sentences.length, comprehensionSection.questions.length);
            
            for (let i = 0; i < questionsToUpdate; i++) {
              const sentence = sentences[i].trim();
              
              // Create a question based on the sentence
              comprehensionSection.questions[i].text = `What does the passage say about ${sentence.split(' ').slice(0, 3).join(' ')}...?`;
              comprehensionSection.questions[i].explanation = `This question refers to the part of the text that mentions these details.`;
            }
          }
        }
      }
      
      // Ensure all questions have the required properties
      if (Array.isArray(comprehensionSection.questions)) {
        comprehensionSection.questions = comprehensionSection.questions.map((q: any, index: number) => {
          const question = typeof q === 'string' 
            ? { text: q } 
            : (q || {});
            
          return {
            id: question.id || index + 1,
            text: question.text || `Question ${index + 1}`,
            options: Array.isArray(question.options) ? question.options : [],
            correctAnswer: question.correctAnswer || '',
            explanation: question.explanation || 'Answer based on the reading passage.'
          };
        });
      }
    }
    
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