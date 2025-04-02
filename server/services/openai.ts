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

      // Maximum number of retries for content quality
      const MAX_RETRIES = 2;
      let retryCount = 0;
      let formattedContent = null;
      
      while (retryCount <= MAX_RETRIES && !formattedContent) {
        try {
          console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES + 1} - Sending request to OpenAI API...`);
          
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
            max_tokens: 4096 // Maximum allowed for gpt-3.5-turbo
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
                
                // Format the content
                const formattedResult = this.formatLessonContent(preprocessedContent);
                
                // Check if the formatted content meets our quality standards
                if (this.checkContentQuality(formattedResult)) {
                  // Content meets standards, return it
                  formattedContent = formattedResult;
                  console.log('Content quality check PASSED');
                } else {
                  // Content doesn't meet standards, will retry
                  console.log('Content quality check FAILED - will retry');
                  retryCount++;
                }
              } catch (parseError) {
                console.error('Error parsing OpenAI response as JSON:', parseError);
                
                // Log some of the raw content for debugging
                console.log('Raw response sample:', content.substring(0, 200) + '...');
                
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                  throw new Error('Failed to parse OpenAI response as JSON after multiple attempts');
                }
              }
            }
          } else {
            retryCount++;
            if (retryCount > MAX_RETRIES) {
              throw new Error('Invalid response from OpenAI API after multiple attempts');
            }
          }
        } catch (requestError: any) {
          console.error('Error during API request:', requestError.message);
          
          if (requestError.response) {
            console.error('Response data:', JSON.stringify(requestError.response.data || {}, null, 2));
          }
          
          retryCount++;
          if (retryCount > MAX_RETRIES) {
            throw new Error(`OpenAI API error after multiple attempts: ${requestError.message}`);
          }
        }
      }
      
      if (!formattedContent) {
        throw new Error('Failed to generate quality content after multiple attempts');
      }
      
      return formattedContent;
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

2. SECOND, write a continuous reading passage that:
   - Is a SINGLE CONTINUOUS TEXT (not divided into paragraphs)
   - Contains at least 20-30 sentences total 
   - Incorporates ALL 5 vocabulary words naturally within the text
   - Is appropriate for ${cefrLevel} level in terms of language complexity
   - Covers the "${topic}" subject thoroughly but simply
   - Has sufficient length for us to create 5 substantial paragraphs
   - IMPORTANT: Write this as ONE CONTINUOUS TEXT that flows naturally - our system will divide it into paragraphs later
   
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
      "text": "Write a continuous reading passage of at least 20-30 sentences that fully explores the topic. Incorporate all 5 vocabulary words naturally throughout the text. The passage should flow smoothly from introduction to development to conclusion, covering different aspects of the topic in sufficient depth. Make sure the content is engaging, informative, and appropriate for the specified CEFR level. Our system will automatically divide this text into 5 well-balanced paragraphs later.",
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
        {
          "topic": "Brief paragraph introducing the first discussion point related to the reading.",
          "question": "What did you find most interesting about this topic in the reading?"
        },
        {
          "topic": "Brief paragraph about how this topic relates to everyday experiences.",
          "question": "How does this topic affect your daily life or experiences?"
        },
        {
          "topic": "Brief paragraph highlighting some key ideas from the reading worth discussing.",
          "question": "Do you agree with the main ideas presented in the reading? Why or why not?"
        },
        {
          "topic": "Brief paragraph about potential future developments in this area.",
          "question": "How might this topic change or develop in the future?"
        },
        {
          "topic": "Brief paragraph acknowledging the limitations of the reading's scope.",
          "question": "What else would you like to learn about this topic that wasn't covered in the reading?"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Encourage students to use the target vocabulary during the discussion and refer back to specific parts of the reading to support their points."
    },
    {
      "type": "quiz",
      "title": "Knowledge Check Quiz",
      "introduction": "Let's test your understanding of today's lesson with a short quiz that applies the concepts to new situations.",
      "instructions": "IMPORTANT: Create quiz questions that are different from the comprehension questions. Focus on application of concepts, critical thinking, and vocabulary usage in new contexts rather than simple recall of facts from the reading.",
      "questions": [
        {
          "id": 1,
          "question": "Application question that requires using the concepts in a new context",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        },
        {
          "id": 2,
          "question": "Question about using vocabulary in a different situation than shown in the reading",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option B"
        },
        {
          "id": 3,
          "question": "Hypothetical scenario question applying the lesson concepts",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option C"
        },
        {
          "id": 4,
          "question": "Critical thinking question that goes beyond the text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option D"
        },
        {
          "id": 5,
          "question": "Question that connects the lesson topic to broader themes or real-world applications",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Review answers with the student, explaining any mistakes and reinforcing vocabulary and concepts from the lesson. Focus on helping them apply the knowledge to new situations."
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
   * Check if the formatted content meets quality standards
   * This confirms that paragraphs have sufficient length before accepting the content
   * @param content The formatted lesson content to check
   * @returns True if content meets quality standards, false otherwise
   */
  private checkContentQuality(content: any): boolean {
    if (!content || !content.sections) {
      console.log('Quality check failed: Invalid content structure');
      return false;
    }
    
    // Set our quality standards
    const MIN_SENTENCES_PER_PARAGRAPH = 3;
    const MIN_PARAGRAPHS = 5;
    
    try {
      // Find the reading section
      const readingSection = content.sections.find((section: any) => section.type === 'reading');
      
      if (!readingSection) {
        console.log('Quality check failed: No reading section found');
        return false;
      }
      
      // Check if we have enough paragraphs
      if (!Array.isArray(readingSection.paragraphs) || readingSection.paragraphs.length < MIN_PARAGRAPHS) {
        console.log(`Quality check failed: Not enough paragraphs. Found ${readingSection.paragraphs?.length || 0}, need ${MIN_PARAGRAPHS}`);
        return false;
      }
      
      // Check each paragraph for sentence count
      const paragraphQuality = readingSection.paragraphs.map((paragraph: string, index: number) => {
        if (typeof paragraph !== 'string') {
          console.log(`Paragraph ${index + 1} is not a string`);
          return { index, sentenceCount: 0, isGoodQuality: false };
        }
        
        // Split into sentences - looking for period, exclamation, or question mark followed by a space
        // Also handle the case where the final sentence doesn't have a trailing space
        const sentences = paragraph.split(/[.!?](?:\s+|$)/).filter((s: string) => s.trim().length > 0);
        
        console.log(`Paragraph ${index + 1} has ${sentences.length} sentences`);
        
        return {
          index,
          sentenceCount: sentences.length,
          isGoodQuality: sentences.length >= MIN_SENTENCES_PER_PARAGRAPH
        };
      });
      
      // Check if any paragraphs don't meet quality standards
      const lowQualityParagraphs = paragraphQuality.filter((p: { isGoodQuality: boolean }) => !p.isGoodQuality);
      
      if (lowQualityParagraphs.length > 0) {
        console.log(`Quality check failed: ${lowQualityParagraphs.length} paragraphs have fewer than ${MIN_SENTENCES_PER_PARAGRAPH} sentences`);
        lowQualityParagraphs.forEach((p: { index: number, sentenceCount: number }) => {
          console.log(`Paragraph ${p.index + 1} has only ${p.sentenceCount} sentences`);
        });
        return false;
      }
      
      // All quality checks passed
      console.log('Quality check PASSED: All paragraphs have at least 3 sentences');
      return true;
    } catch (error) {
      console.error('Error in quality check:', error);
      return false;
    }
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
    
    // Process the reading section to handle the continuous text
    if (section.type === 'reading') {
      // Handle the case where we have a text property containing a continuous passage
      if (fixedSection.text && typeof fixedSection.text === 'string') {
        console.log('Processing continuous reading text...');
        
        // Add paragraphs property if it doesn't exist
        if (!fixedSection.paragraphs) {
          fixedSection.paragraphs = [];
        }
        
        // Split the continuous text into sentences
        const text = fixedSection.text;
        // This regex splits on sentence endings (., !, ?) followed by space or end of string
        const sentences = text.split(/[.!?](?:\s+|$)/).filter((s: string) => s.trim().length > 0)
            .map((sentence: string) => sentence.trim() + '.'); // Ensure each sentence ends with a period
        
        console.log(`Total sentences in continuous text: ${sentences.length}`);
        
        // Define our targets
        const DESIRED_PARAGRAPH_COUNT = 5;
        const MIN_SENTENCES_PER_PARAGRAPH = 3;
        const MIN_TOTAL_SENTENCES = MIN_SENTENCES_PER_PARAGRAPH * DESIRED_PARAGRAPH_COUNT;
        
        // If we don't have enough sentences, log a warning but don't add generic content
        if (sentences.length < MIN_TOTAL_SENTENCES) {
          console.log(`Warning: Not enough sentences. Need at least ${MIN_TOTAL_SENTENCES}, have ${sentences.length}`);
          console.log('Proceeding with the original sentences without adding generic content');
        }
        
        // Distribute sentences evenly across 5 paragraphs
        const paragraphs: string[] = [];
        const sentencesPerParagraph = Math.max(MIN_SENTENCES_PER_PARAGRAPH, Math.ceil(sentences.length / DESIRED_PARAGRAPH_COUNT));
        
        for (let i = 0; i < DESIRED_PARAGRAPH_COUNT; i++) {
          const startIdx = i * sentencesPerParagraph;
          const endIdx = Math.min((i + 1) * sentencesPerParagraph, sentences.length);
          
          if (startIdx < sentences.length) {
            const paragraphSentences = sentences.slice(startIdx, endIdx);
            
            // Log a warning if a paragraph has fewer than 3 sentences, but don't add generic content
            if (paragraphSentences.length < MIN_SENTENCES_PER_PARAGRAPH) {
              console.log(`Warning: Paragraph ${i+1} has only ${paragraphSentences.length} sentences, which is less than the minimum ${MIN_SENTENCES_PER_PARAGRAPH}`);
            }
            
            paragraphs.push(paragraphSentences.join(' '));
          }
        }
        
        // Log a warning if we don't have enough paragraphs
        if (paragraphs.length < DESIRED_PARAGRAPH_COUNT) {
          console.log(`Warning: Only created ${paragraphs.length} paragraphs instead of the desired ${DESIRED_PARAGRAPH_COUNT}`);
        }
        
        // Update the paragraphs property
        fixedSection.paragraphs = paragraphs;
        console.log(`Created ${paragraphs.length} paragraphs from continuous text`);
      } 
      // Handle the case where we already have paragraphs (backwards compatibility)
      else if (fixedSection.paragraphs) {
        console.log('Processing existing paragraphs...');
        
        // Convert to array if it's not already
        if (!Array.isArray(fixedSection.paragraphs)) {
          if (typeof fixedSection.paragraphs === 'string') {
            // Split the string by double newlines
            const paragraphs = fixedSection.paragraphs.split(/\n\n+/);
            fixedSection.paragraphs = paragraphs.length > 0 ? paragraphs : [fixedSection.paragraphs];
          } else if (typeof fixedSection.paragraphs === 'object') {
            // Extract values from the object
            const paragraphsArray: string[] = [];
            Object.values(fixedSection.paragraphs).forEach((val: any) => {
              if (typeof val === 'string' && val.trim()) {
                paragraphsArray.push(val);
              }
            });
            fixedSection.paragraphs = paragraphsArray;
          } else {
            // Default fallback
            fixedSection.paragraphs = ["No reading text was provided."];
          }
        }
        
        // Process existing paragraphs to ensure quality
        if (Array.isArray(fixedSection.paragraphs) && fixedSection.paragraphs.length > 0) {
          console.log('Original paragraph count:', fixedSection.paragraphs.length);
          
          // Get all sentences from all paragraphs for potential redistribution
          const allSentences = fixedSection.paragraphs.flatMap((para: string) => {
            // Split by sentence endings, including end of string
            return para.split(/[.!?](?:\s+|$)/).filter((s: string) => s.trim().length > 0)
              .map((sentence: string) => sentence.trim() + '.'); // Ensure each sentence ends with a period
          });
          
          console.log(`Total sentences in paragraphs: ${allSentences.length}`);
          
          // Define our targets
          const DESIRED_PARAGRAPH_COUNT = 5;
          const MIN_SENTENCES_PER_PARAGRAPH = 3;
          const MIN_TOTAL_SENTENCES = MIN_SENTENCES_PER_PARAGRAPH * DESIRED_PARAGRAPH_COUNT;
          
          // If we don't have enough sentences, log a warning but don't add generic content
          if (allSentences.length < MIN_TOTAL_SENTENCES) {
            console.log(`Warning: Not enough sentences in existing paragraphs. Need at least ${MIN_TOTAL_SENTENCES}, have ${allSentences.length}`);
            console.log('Proceeding with the original sentences without adding generic content');
          }
          
          // Create exactly 5 paragraphs with the sentences we have
          const enhancedParagraphs: string[] = [];
          const sentencesPerParagraph = Math.max(MIN_SENTENCES_PER_PARAGRAPH, Math.ceil(allSentences.length / DESIRED_PARAGRAPH_COUNT));
          
          for (let i = 0; i < DESIRED_PARAGRAPH_COUNT; i++) {
            const startIdx = i * sentencesPerParagraph;
            const endIdx = Math.min((i + 1) * sentencesPerParagraph, allSentences.length);
            
            if (startIdx < allSentences.length) {
              const paragraphSentences = allSentences.slice(startIdx, endIdx);
              
              // Log a warning if a paragraph has fewer than 3 sentences, but don't add generic content
              if (paragraphSentences.length < MIN_SENTENCES_PER_PARAGRAPH) {
                console.log(`Warning: Paragraph ${i+1} (legacy path) has only ${paragraphSentences.length} sentences, which is less than the minimum ${MIN_SENTENCES_PER_PARAGRAPH}`);
              }
              
              enhancedParagraphs.push(paragraphSentences.join(' '));
            }
          }
          
          // Log a warning if we don't have enough paragraphs
          if (enhancedParagraphs.length < DESIRED_PARAGRAPH_COUNT) {
            console.log(`Warning: Only created ${enhancedParagraphs.length} paragraphs instead of the desired ${DESIRED_PARAGRAPH_COUNT} (legacy path)`);
          }
          
          fixedSection.paragraphs = enhancedParagraphs;
          console.log(`Enhanced into ${enhancedParagraphs.length} paragraphs with adequate sentence count`);
        }
      }
      // If we have neither text nor paragraphs, log an error
      else {
        console.log('Error: No text or paragraphs provided for reading section');
        // Create a single informative paragraph that doesn't contain generic content
        fixedSection.paragraphs = [
          "The AI failed to generate reading content for this lesson. Please try generating a new lesson."
        ];
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
        console.log('Error: Vocabulary words provided as count instead of actual words');
        
        // Create error message instead of placeholder words
        fixedSection.words = [{
          term: "Error: Missing Vocabulary",
          partOfSpeech: "error",
          definition: "The AI provided a count instead of actual vocabulary words.",
          example: "Please try generating a new lesson.",
        }];
      }
      // Create error message if no vocabulary words exist
      else if (!fixedSection.words || !Array.isArray(fixedSection.words) || fixedSection.words.length === 0) {
        console.log('Error: No vocabulary words provided');
        fixedSection.words = [{
          term: "Error: Missing Vocabulary",
          partOfSpeech: "error",
          definition: "No vocabulary words were provided by the AI.",
          example: "Please try generating a new lesson.",
        }];
      }
      // Convert string words to proper objects if needed, with missing fields warning
      else if (Array.isArray(fixedSection.words)) {
        fixedSection.words = fixedSection.words.map((word: any) => {
          if (typeof word === 'string') {
            console.log(`Warning: Vocabulary word "${word}" provided as string without proper details`);
            return {
              term: word,
              partOfSpeech: "unknown",
              definition: "Missing definition - the AI only provided the word.",
              example: "Please try generating a new lesson with complete vocabulary details."
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
            console.log(`Warning: Question "${q}" provided as string without options for ${section.type} section`);
            return {
              id: index + 1,
              question: q,
              options: ["Missing options", "Please regenerate", "The AI didn't provide complete question format", "Try again"],
              correctAnswer: "Please regenerate"
            };
          }
          return q;
        });
      } else {
        // For discussion, just ensure we have string questions
        fixedSection.questions = questions.map((q: any) => {
          if (typeof q === 'object') {
            console.log('Warning: Discussion question provided as object instead of string');
            const extractedQuestion = q.question || q.text || Object.values(q)[0];
            if (typeof extractedQuestion === 'string') {
              return extractedQuestion;
            } else {
              return "Error: Invalid discussion question format. Please try generating a new lesson.";
            }
          }
          return q;
        });
      }
      
      // If we still have no questions, log an error
      if (fixedSection.questions.length === 0) {
        console.log(`Error: No questions provided for ${section.type} section`);
        if (section.type === 'quiz' || section.type === 'comprehension') {
          fixedSection.questions = [
            {
              id: 1,
              question: "Error: No questions were provided by the AI.",
              options: ["Try again", "Generate a new lesson", "Contact support", "Check your prompt"],
              correctAnswer: "Generate a new lesson"
            }
          ];
        } else {
          fixedSection.questions = ["Error: No discussion questions were provided by the AI. Please try generating a new lesson."];
        }
      }
    }
    
    // Ensure sentence frames section has frames
    if (section.type === 'sentenceFrames' && (!fixedSection.frames || !Array.isArray(fixedSection.frames))) {
      fixedSection.frames = this.processArray(fixedSection.frames || [], 'string');
      
      if (fixedSection.frames.length === 0) {
        console.log('Error: No sentence frames provided');
        fixedSection.frames = [
          "Error: No sentence frames were provided by the AI. Please try generating a new lesson.",
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
        console.log(`Error: Missing required ${type} section`);
        // Add an error section indicating the missing content
        processed.sections.push({
          type,
          title: this.getDefaultTitle(type),
          content: `Error: The ${type} section was not provided by the AI. Please try generating a new lesson.`
        });
      }
    });
    
    console.log('Preprocessing complete.');
    return processed;
  }
}

// Create a singleton instance with the API key
export const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || '');