import OpenAI from 'openai';
import { LessonGenerateParams } from '@shared/schema';

/**
 * Service for interacting with the OpenAI API
 */
export class OpenAIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('OpenAI API key is not provided or is empty');
    }
    this.client = new OpenAI({ apiKey });
  }
  
  /**
   * Generate a complete ESL lesson based on the provided parameters
   * @param params Lesson generation parameters
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
    try {
      console.log('Starting OpenAI lesson generation...');
      
      // Validate the API key format (basic validation)
      if (!this.client.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }
      
      const prompt = this.constructLessonPrompt(params);
      console.log('Constructed prompt successfully');
      
      // Using the more cost-effective gpt-3.5-turbo model as requested by the user
      const modelName = "gpt-3.5-turbo";
      
      console.log(`Using model: ${modelName}`);

      try {
        console.log('Sending request to OpenAI API...');
        
        const response = await this.client.chat.completions.create({
          model: modelName,
          messages: [
            { 
              role: "system", 
              content: "You are an expert ESL teacher with years of experience creating engaging and effective lesson materials. Your task is to create well-structured, error-free JSON content that strictly follows the structure defined in the user prompt. Ensure all arrays are proper JSON arrays with square brackets, all objects have proper key-value pairs, and there are no formatting errors." 
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.5, // Lower temperature for more consistent, structured output
          response_format: { type: "json_object" },
          max_tokens: 4000 // Maximum allowed for gpt-3.5-turbo
        });
        
        console.log('Received response from OpenAI API');
        
        if (response.choices && response.choices.length > 0) {
          const content = response.choices[0].message?.content;
          
          if (content) {
            console.log('Successfully extracted content from response');
            
            try {
              // Try to parse the content as JSON
              const jsonContent = JSON.parse(content);
              console.log('Successfully parsed JSON response');
              console.log('JSON response sample:', JSON.stringify(jsonContent).substring(0, 200) + '...');
              
              // Log the entire response for deeper inspection
              console.log('FULL JSON RESPONSE:', JSON.stringify(jsonContent));
              
              // Pre-process the JSON structure to fix common issues before formatting
              const preprocessedContent = this.preprocessContent(jsonContent);
              
              return this.formatLessonContent(preprocessedContent);
            } catch (parseError) {
              console.error('Error parsing OpenAI response as JSON:', parseError);
              
              // Log some of the raw content for debugging
              console.log('Raw response sample:', content.substring(0, 200) + '...');
              
              throw new Error('Failed to parse OpenAI response as JSON');
            }
          }
        }
        
        throw new Error('Invalid response from OpenAI API');
      } catch (requestError: any) {
        console.error('Error during API request:', requestError.message);
        
        if (requestError.response) {
          console.error('Response data:', JSON.stringify(requestError.response.data || {}, null, 2));
          
          throw new Error(`OpenAI API error: ${requestError.message}`);
        } else {
          throw new Error(`Error with OpenAI API: ${requestError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error in OpenAIService.generateLesson:', error.message);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Constructs a structured prompt for the OpenAI model
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
   - For each word, consider: part of speech, definition, syllable breakdown, example sentences, collocations, and usage notes

2. SECOND, write a reading passage that:
   - Contains EXACTLY 5 well-structured paragraphs
   - Incorporates ALL 5 vocabulary words naturally within the text
   - Is appropriate for ${cefrLevel} level in terms of language complexity
   - Covers the "${topic}" subject thoroughly but simply
   - Has sufficient length to provide comprehensive information (minimum 3-5 paragraphs)
   
3. THIRD, build the rest of the lesson around these vocabulary words and reading passage:
   - The warm-up should explicitly introduce the 5 vocabulary words
   - The vocabulary section should define and elaborate on the same 5 words from the reading
   - Comprehension questions should test understanding of the reading
   - Sentence frames should provide scaffolded practice with topic-related structures
   - Discussion questions should always include EXACTLY 5 questions regardless of CEFR level
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
      "content": "Brief, engaging activity introducing the main topic and our 5 key vocabulary items.",
      "questions": [
        "What do you know about this topic?",
        "Have you ever experienced this?",
        "Why is this topic important?"
      ],
      "imageDescription": "A descriptive image that would help introduce the topic",
      "targetVocabulary": ["vocabulary1", "vocabulary2", "vocabulary3", "vocabulary4", "vocabulary5"],
      "timeAllocation": "5 minutes",
      "teacherNotes": "Start by showing images of each vocabulary item. Ask students to share any experiences with the topic."
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Let's read about this important topic.",
      "paragraphs": [
        "First paragraph that introduces the topic and uses at least one vocabulary word naturally.",
        "Second paragraph that develops the topic further and uses another vocabulary word.",
        "Third paragraph with more detailed information and another vocabulary word.",
        "Fourth paragraph exploring implications or applications of the topic with another vocabulary word.",
        "Final paragraph that summarizes or concludes with the last vocabulary word."
      ],
      "imageDescription": "A descriptive image that illustrates a key aspect of the reading",
      "timeAllocation": "15 minutes",
      "teacherNotes": "Have students read the passage once for general understanding, then a second time to identify the vocabulary words in context."
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "introduction": "Let's learn 5 important words from the reading passage.",
      "words": [
        {
          "term": "vocabulary1",
          "partOfSpeech": "noun",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": "vo-cab-u-lar-y (syllable breakdown with stress indicated)",
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word"
        },
        {
          "term": "vocabulary2",
          "partOfSpeech": "verb",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": "vo-cab-u-lar-y (syllable breakdown with stress indicated)",
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word"
        },
        {
          "term": "vocabulary3",
          "partOfSpeech": "adjective",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": "vo-cab-u-lar-y (syllable breakdown with stress indicated)",
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word"
        },
        {
          "term": "vocabulary4",
          "partOfSpeech": "noun",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": "vo-cab-u-lar-y (syllable breakdown with stress indicated)",
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word"
        },
        {
          "term": "vocabulary5",
          "partOfSpeech": "verb",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": "vo-cab-u-lar-y (syllable breakdown with stress indicated)",
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word"
        }
      ],
      "practice": "Brief activity to practice using the vocabulary",
      "timeAllocation": "10 minutes",
      "teacherNotes": "Show images for each vocabulary word and practice pronunciation before discussing definitions."
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "introduction": "Let's check how well you understood the reading passage.",
      "questions": [
        {
          "question": "First question about a key detail from the reading",
          "options": ["Correct answer", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Second question about another aspect of the reading",
          "options": ["Wrong answer 1", "Correct answer", "Wrong answer 2", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Third question testing deeper understanding",
          "options": ["Wrong answer 1", "Wrong answer 2", "Correct answer", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Fourth question about vocabulary in context",
          "options": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3", "Correct answer"],
          "correctAnswer": "Correct answer"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Encourage students to refer back to the text when answering questions."
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Frames",
      "introduction": "Practice using sentence frames to talk about the topic.",
      "frames": [
        {
          "pattern": "I think _____ is important because _____.",
          "examples": [
            "I think learning English is important because it helps with international communication.",
            "I think healthy eating is important because it prevents many diseases."
          ],
          "level": "intermediate",
          "grammarFocus": "Expressing opinions with reasons",
          "communicativeFunction": "Justifying opinions",
          "usageNotes": "This pattern helps students express and support their views",
          "teachingTips": "Start with familiar topics before moving to more abstract concepts"
        },
        {
          "pattern": "One way to _____ is to _____.",
          "examples": [
            "One way to improve vocabulary is to read regularly.",
            "One way to stay healthy is to exercise daily."
          ],
          "level": "intermediate",
          "grammarFocus": "Suggesting solutions or methods",
          "communicativeFunction": "Giving advice",
          "usageNotes": "Useful for discussing processes and solutions",
          "teachingTips": "Have students brainstorm multiple solutions for the same problem"
        },
        {
          "pattern": "When I _____, I always _____.",
          "examples": [
            "When I travel, I always take photos.",
            "When I cook, I always follow a recipe."
          ],
          "level": "basic",
          "grammarFocus": "Simple present for habits",
          "communicativeFunction": "Describing routines",
          "usageNotes": "Helps students discuss personal habits and routines",
          "teachingTips": "Use this to encourage personal sharing in a structured way"
        },
        {
          "pattern": "In the future, _____ will _____.",
          "examples": [
            "In the future, technology will change how we learn.",
            "In the future, cities will become more environmentally friendly."
          ],
          "level": "intermediate",
          "grammarFocus": "Future tense predictions",
          "communicativeFunction": "Making predictions",
          "usageNotes": "Good for expressing opinions about future developments",
          "teachingTips": "Can be adapted for different time frames (tomorrow, next year, etc.)"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Model each sentence frame first, then have students create their own sentences using the vocabulary from the lesson."
    },
    {
      "type": "discussion",
      "title": "Post-reading Discussion",
      "introduction": "Let's discuss your thoughts and opinions about this topic.",
      "questions": [
        "What did you find most interesting about this topic in the reading?",
        "How does this topic affect your daily life or experiences?",
        "Do you agree with the main ideas presented in the reading? Why or why not?",
        "How might this topic change or develop in the future?",
        "What else would you like to learn about this topic that wasn't covered in the reading?"
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Encourage students to use the target vocabulary during the discussion and refer back to specific parts of the reading to support their points."
    },
    {
      "type": "quiz",
      "title": "Knowledge Check Quiz",
      "introduction": "Let's test your understanding of today's lesson with a short quiz.",
      "questions": [
        {
          "id": 1,
          "question": "Quiz question about the topic",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        },
        {
          "id": 2,
          "question": "Quiz question about vocabulary",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option B"
        },
        {
          "id": 3,
          "question": "Quiz question applying concepts",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option C"
        },
        {
          "id": 4,
          "question": "Quiz question testing comprehension",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option D"
        },
        {
          "id": 5,
          "question": "Final quiz question",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Review answers with the student, explaining any mistakes and reinforcing vocabulary and concepts from the lesson."
    }
  ]
}`;
  }

  /**
   * Format and clean up the lesson content from the AI response.
   * Transforms the structure to comply with our expected schema.
   */
  private formatLessonContent(content: any): any {
    try {
      console.log('Raw OpenAI content before formatting:', content);
      
      // If we have received a blank or invalid content
      if (!content || typeof content !== 'object') {
        throw new Error('Invalid content received from OpenAI');
      }

      // Make sure we have a sections array
      if (!content.sections || !Array.isArray(content.sections) || content.sections.length === 0) {
        console.error('No sections array found in content or sections array is empty');
        throw new Error('Invalid lesson structure: missing sections');
      }

      // Log some diagnostic info about the sections and their structure
      console.log('Examining raw sections structure:');
      content.sections.forEach((section: any, index: number) => {
        console.log(`Section ${index} type: ${section.type}`);
        
        if (section.questions) {
          console.log(`Section ${index} questions type: ${typeof section.questions}`);
          console.log(`Section ${index} questions value:`, section.questions);
        }
        
        if (section.type === 'warmup' && section.targetVocabulary) {
          console.log(`Warmup targetVocabulary type: ${typeof section.targetVocabulary}`);
          console.log(`Warmup targetVocabulary value:`, section.targetVocabulary);
        }
      });

      // Ensure each section has the required properties based on its type
      const validSections = content.sections.map((section: any) => {
        return this.processSection(section);
      });

      content.sections = validSections;
      
      console.log('Formatted content:', JSON.stringify(content).substring(0, 500) + '...');
      
      return content;
    } catch (error) {
      console.error('Error formatting lesson content:', error);
      throw error;
    }
  }

  /**
   * Process a potential array value to ensure it's a properly formatted array.
   * @param value The value to process
   * @param expectedType The expected type of array elements
   * @returns A properly formatted array
   */
  private processArray(value: any, expectedType: 'string' | 'object'): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      try {
        // Try to parse it as JSON first
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If it parsed as something else, wrap it
        return [parsed];
      } catch (e) {
        // Not valid JSON, split by commas or newlines
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        } else if (value.includes('\n')) {
          return value.split('\n').filter(item => item.trim().length > 0);
        } else {
          return [value];
        }
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.values(value);
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
      'reading': 'Reading Text',
      'vocabulary': 'Key Vocabulary',
      'comprehension': 'Reading Comprehension',
      'sentenceFrames': 'Sentence Practice',
      'grammar': 'Grammar Focus',
      'discussion': 'Discussion Questions',
      'speaking': 'Speaking Activity',
      'quiz': 'Knowledge Check',
      'assessment': 'Assessment'
    };
    
    return titles[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Section`;
  }

  /**
   * Process an individual section to ensure it has the required properties
   */
  private processSection(section: any): any {
    const fixedSection = { ...section };
    
    // Ensure each section has a title
    if (!fixedSection.title) {
      fixedSection.title = this.getDefaultTitle(fixedSection.type);
    }
    
    // Process specific section types
    
    // For warmup sections, ensure we have questions as an array
    if (fixedSection.type === 'warmup' || fixedSection.type === 'warm-up') {
      if (!fixedSection.questions || !Array.isArray(fixedSection.questions)) {
        fixedSection.questions = this.processArray(fixedSection.questions || [], 'string');
      }
      
      // Ensure we have targetVocabulary as an array
      if (!fixedSection.targetVocabulary || !Array.isArray(fixedSection.targetVocabulary)) {
        fixedSection.targetVocabulary = this.processArray(fixedSection.targetVocabulary || [], 'string');
      }
    }
    
    // Fix paragraphs property if it's a string, object, or number (count)
    if (section.type === 'reading' && fixedSection.paragraphs && !Array.isArray(fixedSection.paragraphs)) {
      if (typeof fixedSection.paragraphs === 'string') {
        // Split the string by double newlines or handle as a single paragraph
        const paragraphs = fixedSection.paragraphs.split(/\n\n+/);
        fixedSection.paragraphs = paragraphs.length > 0 ? paragraphs : [fixedSection.paragraphs];
      } else if (typeof fixedSection.paragraphs === 'number') {
        // If paragraphs is a number, create placeholders
        const count = Math.min(Math.max(1, fixedSection.paragraphs), 10); // Limit between 1-10
        
        // Generate placeholder paragraphs based on the introduction/topic
        const placeholders: string[] = [];
        const topic = fixedSection.title?.replace('Reading Text', '') || 
                    fixedSection.introduction || 
                    'the topic';
        
        // Create generic paragraphs
        for (let i = 0; i < count; i++) {
          placeholders.push(`Paragraph ${i+1} about ${topic}.`);
        }
        
        fixedSection.paragraphs = placeholders;
      } else if (typeof fixedSection.paragraphs === 'object') {
        // Extract values from the object
        const paragraphsArray: string[] = [];
        
        // Add string values
        Object.values(fixedSection.paragraphs).forEach((val: any) => {
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
        
        // Create placeholder vocabulary words
        const words = [];
        for (let i = 0; i < count; i++) {
          words.push({
            term: `vocabulary term ${i + 1}`,
            partOfSpeech: "noun",
            definition: `Definition for vocabulary term ${i + 1}`,
            example: `Example sentence using vocabulary term ${i + 1}`
          });
        }
        
        fixedSection.words = words;
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
    
    // Ensure comprehension, discussion, and quiz sections have questions
    if ((section.type === 'comprehension' || section.type === 'discussion' || section.type === 'quiz') 
        && (!fixedSection.questions || !Array.isArray(fixedSection.questions))) {
      
      // Try to process questions
      const questions = this.processArray(fixedSection.questions || [], 'object');
      
      // If we have a quiz or comprehension, ensure we have proper question objects
      if (section.type === 'quiz' || section.type === 'comprehension') {
        fixedSection.questions = questions.map((q: any, index: number) => {
          if (typeof q === 'string') {
            return {
              id: index + 1,
              question: q,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A"
            };
          }
          return q;
        });
      } else {
        // For discussion, just ensure we have string questions
        fixedSection.questions = questions.map((q: any) => {
          if (typeof q === 'object') {
            return q.question || q.text || `Question ${Object.values(q)[0]}`;
          }
          return q;
        });
      }
      
      // If we still have no questions, add a default
      if (fixedSection.questions.length === 0) {
        if (section.type === 'quiz' || section.type === 'comprehension') {
          fixedSection.questions = [
            {
              id: 1,
              question: `Question about ${section.title || 'the topic'}`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A"
            }
          ];
        } else {
          fixedSection.questions = [`What do you think about ${section.title || 'this topic'}?`];
        }
      }
    }
    
    // Ensure sentence frames section has frames
    if (section.type === 'sentenceFrames' && (!fixedSection.frames || !Array.isArray(fixedSection.frames))) {
      fixedSection.frames = this.processArray(fixedSection.frames || [], 'string');
      
      if (fixedSection.frames.length === 0) {
        fixedSection.frames = [
          "I think _____ is _____.",
          "The most important thing about _____ is _____."
        ];
      }
    }
    
    return fixedSection;
  }

  /**
   * Pre-processes the API response content to fix common structural issues
   * before passing it to the formatter
   */
  private preprocessContent(content: any): any {
    if (!content || typeof content !== 'object') {
      return content;
    }
    
    const processed = { ...content };
    
    // Ensure we have a title
    if (!processed.title) {
      processed.title = 'ESL Lesson';
    }
    
    // Ensure we have a level
    if (!processed.level) {
      processed.level = 'B1';
    }
    
    // Ensure we have a focus
    if (!processed.focus) {
      processed.focus = 'general';
    }
    
    // Ensure estimatedTime is a number
    if (!processed.estimatedTime || typeof processed.estimatedTime !== 'number') {
      processed.estimatedTime = 60;
    }
    
    // Ensure we have a sections array
    if (!processed.sections || !Array.isArray(processed.sections)) {
      processed.sections = [];
    }
    
    // Process sections
    processed.sections = processed.sections.map((section: any) => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      
      // Create a copy of the section to avoid modifying the original
      const fixedSection = { ...section };
      
      // Skip sections without a type
      if (!fixedSection.type) {
        return null;
      }
      
      // Normalize section type names (warmup vs warm-up)
      if (fixedSection.type === 'warm-up') {
        fixedSection.type = 'warmup';
      }
      
      return fixedSection;
    }).filter((section: any) => section !== null);
    
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
export const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || '');