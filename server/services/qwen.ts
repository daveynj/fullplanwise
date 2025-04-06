import axios from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { stabilityService } from './stability.service';

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

      const prompt = `You are an expert ESL (English as a Second Language) teacher and curriculum designer with over 20 years of experience.

TASK OVERVIEW:
You will create a complete ESL lesson for ${params.cefrLevel} level students on a given topic.

STEP 1: WRITE A READING TEXT
- First, write an original reading text about the topic "${params.topic}"
- Use a warm, accessible, and conversational tone
- Include interesting facts and observations woven naturally into the narrative
- Use vivid, descriptive language that brings topics to life
- Make complex information approachable through clear explanations and engaging examples
- Use a mix of sentence lengths for good flow
- Occasionally address the reader directly with rhetorical questions or observations

- CRITICAL REQUIREMENT: For ${params.cefrLevel} level, your text MUST be AT LEAST ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "C3" ? "600" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words
- Your text will be REJECTED if it's shorter than ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "C3" ? "600" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words
- The system counts words by splitting on whitespace - make sure you have enough actual words
- Divide your text into 3-5 paragraphs with clear paragraph breaks (use double line breaks between paragraphs)
- Focus on creating a substantial, informative text before moving on to other components
- Make sure the vocabulary and sentence structures remain appropriate for ${params.cefrLevel} level students
- For lower levels (A1, A2), simplify the language while maintaining a friendly, engaging tone
- For higher levels (B2, C1, C2), use richer vocabulary and more complex sentences

STEP 2: CREATE LESSON COMPONENTS
After writing the reading text, create:
- CRITICAL REQUIREMENT: You MUST include EXACTLY 5 vocabulary items from your text. The system requires a minimum of 5 vocabulary items and will REJECT the lesson if fewer are provided.
- ABSOLUTELY CRITICAL: Each semantic group MUST contain at least 2-3 vocabulary words. DO NOT create groups with only one word.
- DO NOT include basic words like "hi", "hello", "goodbye", or other extremely common words as vocabulary items.
- Only choose words that are appropriate for the CEFR level ${params.cefrLevel} and would be genuinely useful for students to learn.
- EXTREMELY IMPORTANT: Choose ONLY English words for vocabulary. DO NOT include foreign words (like "la bise," "sayonara," "wai," etc.) even if they appear in your text when discussing other cultures. ONLY ENGLISH VOCABULARY should be selected.
- EXACTLY 3-5 reading comprehension activities - YOU MUST INCLUDE AT LEAST 3
- 1-2 pre-reading discussion questions
- EXACTLY 5-7 post-reading discussion questions - YOU MUST INCLUDE AT LEAST 5, and each question MUST directly reference specific content from your reading text
- A brief warm-up activity that MUST incorporate all vocabulary items from your vocabulary list, not just one word
- NEW REQUIREMENT: 2-4 sentence frames and templates appropriate for the ${params.cefrLevel} level to help students with sentence structure and grammar

SENTENCE FRAMES REQUIREMENTS:
For each sentence frame, include:
1. The pattern (e.g., "I think that _____ because _____.")
2. 2-3 example sentences using the pattern and vocabulary from the lesson
3. Usage notes explaining when and how to use this pattern
4. Teaching tips for introducing and practicing the pattern
5. Difficulty level (basic, intermediate, or advanced) relative to the overall CEFR level
6. Grammar focus (what grammar point this pattern helps practice)
7. Communicative function (e.g., expressing opinions, making comparisons, etc.)

Tailor the complexity and number of sentence frames based on CEFR level:
- A1: 3-4 very simple frames with basic structures (subject + verb + object). Focus on present tense, personal information, and everyday needs. Example: "I like ____." or "This is ____."
- A2: 3-4 simple frames that may include one conjunction or preposition. Introduce basic past tense, simple questions, and descriptions. Example: "I went to ____ yesterday and I saw ____."
- B1: 2-3 frames with moderate complexity. Include various tenses, modal verbs, and expressions of opinion. Example: "I think ____ is important because it helps people to ____ and also ____."
- B2: 2-3 more complex frames with multiple clauses, conditionals, or comparisons. Example: "Although many people believe ____, I would argue that ____ because ____."
- C1/C2: 1-2 sophisticated frames with complex structures, academic language, or nuanced expressions. Example: "Despite the widespread assumption that ____, recent evidence suggests that ____, which implies that ____."

CEFR-SPECIFIC EXAMPLES:

A1 Examples:
- "I like to eat _____."
- "My favorite _____ is _____."
- "I can _____ very well."
- "In the morning, I _____."

A2 Examples:
- "Last weekend, I went to _____ and I saw _____."
- "I usually _____ because I think it's _____."
- "I would like to _____ next _____."
- "If I have time, I will _____."

B1 Examples:
- "I believe that _____ is _____ because _____, although some people think _____."
- "When I was _____, I used to _____, but now I prefer to _____."
- "I've always wanted to _____, which would allow me to _____."

B2 Examples:
- "While it's often argued that _____, I would suggest that _____, particularly when considering _____."
- "Having _____, I now realize that _____, which has led me to _____."
- "If I had the opportunity to _____, I would definitely _____, as it would enable me to _____."

C1/C2 Examples:
- "Despite the prevailing view that _____, a more nuanced analysis reveals _____, which consequently _____."
- "The extent to which _____ influences _____ remains a subject of debate; however, what cannot be disputed is that _____, regardless of how _____."

IMPORTANT: Make frames progressively more complex from basic to advanced within each CEFR level. Each frame should:
1. Be meaningful and authentic to real communication
2. Include opportunities for personalization and creativity
3. Incorporate elements from the lesson vocabulary and topic
4. For higher levels (B1+), add elements like follow-up questions, conditionals, or alternatives

For teacher instructions (only shown in teacher view):
1. Include specific drilling techniques relevant to the frame
2. Suggest pair/group activities to practice the frame
3. Provide ideas for extending the frame through additional questions
4. Recommend error correction strategies for common mistakes
5. Suggest ways to adapt the frame for different proficiency levels within the class

AVOID:
1. Creating frames that are too artificial or overly complex for the level
2. Using vocabulary beyond the target CEFR level
3. Making frames too topic-specific (they should be adaptable)
4. Creating frames with too many blanks or complex structures for lower levels

VOCABULARY REQUIREMENTS:
For each vocabulary item, you MUST include:
1. The word itself (ENGLISH ONLY - NO FOREIGN WORDS)
2. A clear definition using language appropriate for ${params.cefrLevel} level students
3. The part of speech (noun, verb, adjective, etc.)
4. An example sentence using language appropriate for ${params.cefrLevel} level
5. Common collocations (phrases that often include this word)
6. Usage notes written with ${params.cefrLevel} level appropriate language
7. Teaching tips
8. Pronunciation information with:
   - syllables: The word broken down into syllables as an array of strings
   - stressIndex: Which syllable receives primary stress (zero-based index)
   - phoneticGuide: A simplified pronunciation guide using regular characters
9. An image prompt (NEW!) - A detailed description (2-3 sentences) of what an image for this word should look like. The image prompt should:
   - Clearly illustrate the meaning of the word in a visual way
   - Include specific visual elements that relate to the example sentence
   - Be detailed enough for an AI image generator to create a clear, relevant image
   - Specify NO text or words should appear in the image
   - Example: For "tradition" - "A family gathered around a Thanksgiving table with a turkey and traditional dishes, showing multiple generations celebrating this American tradition. The scene should be warm and inviting, showing the passing down of cultural practices. No text or words should appear in the image."

CEFR LEVEL-APPROPRIATE VOCABULARY SELECTION GUIDELINES:
- A1: Choose words beyond the 500 most common words. Avoid very basic words like "hi", "hello", "yes", "no".
- A2: Choose words beyond the 1000 most common words.
- B1: Choose intermediate-level vocabulary (beyond the 2000 most common words).
- B2: Choose upper-intermediate vocabulary (beyond the 3000 most common words).
- C1: Choose advanced vocabulary (beyond the 4000 most common words).
- C2: Choose sophisticated vocabulary that would challenge even advanced learners.

CEFR LEVEL-APPROPRIATE DEFINITIONS GUIDELINES:
- A1: Use only the most basic and frequent vocabulary (500-800 words). Very simple sentence structures. Definitions should be 1-5 words where possible.
- A2: Use basic vocabulary (about 1000-1500 words). Simple sentences. Avoid complex structures or uncommon words.
- B1: Use intermediate vocabulary (about 2500 words). Moderately complex sentences allowed, but prioritize clarity.
- B2: Upper-intermediate vocabulary (about 3500 words). More complex sentences and some academic words allowed.
- C1: Advanced vocabulary (about 5000+ words). Complex sentences and academic/specialized terms acceptable.
- C2: Proficient vocabulary with nuanced explanations. Full range of language structures. Can include specialized terminology.

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0

I will count the total number of vocabulary items. If you don't include EXACTLY 5 complete vocabulary items, your response will be rejected.

CEFR LEVEL ALIGNMENT:
Ensure all content is appropriate for ${params.cefrLevel} level students:
- CRITICAL: Use vocabulary appropriate for ${params.cefrLevel} level in ALL questions and instructions
- For post-reading discussion questions, ensure the language complexity matches ${params.cefrLevel} level
- Adjust question complexity based on the CEFR level (simpler for A1/A2, more complex for C1/C2)

WARM-UP ACTIVITY REQUIREMENTS:
- CRITICALLY IMPORTANT: Your warm-up activity MUST incorporate ALL vocabulary items from your vocabulary list. Check this carefully!
- Each vocabulary word MUST be explicitly mentioned and used in the warm-up activity
- Ensure students are introduced to all vocabulary before the reading
- Design an engaging activity that gets students familiar with these words
- In your procedure section, make sure EVERY vocabulary word is used at least once
- The system will check that each vocabulary word appears in the warm-up - if any are missing, the lesson will be rejected

DISCUSSION QUESTION REQUIREMENTS:
- IMPORTANT NEW FORMAT: Each discussion question MUST be preceded by its own unique, CEFR-level appropriate paragraph (3-5 sentences) that provides context or an interesting angle related to the question. The question should directly relate to this paragraph.
- You MUST provide EXACTLY 5 such paragraph-question pairs.
- The paragraph should:
  - Be written at the appropriate CEFR level (${params.cefrLevel})
  - Focus on something interesting and thought-provoking related to the question topic
  - Create a foundation for meaningful discussion
  - Relate directly to the vocabulary being learned
  - Avoid simply summarizing the main reading
  - CRITICAL: The language complexity MUST match exactly the ${params.cefrLevel} level
  - Be designed to stand out visually when displayed in the UI
  
CEFR LEVEL PARAGRAPH GUIDELINES:
- A1: 3 simple sentences, present tense, basic vocabulary only. No complex structures.
  Example: "Many people have pets. Cats and dogs are common pets. Some people like fish or birds."
- A2: 3-4 sentences, simple present and past tense, everyday vocabulary.
  Example: "Last week, I visited a zoo. I saw many animals there. The elephants were very big. Some monkeys played with toys."
- B1: 4 sentences of moderate complexity, wider vocabulary range, some conjunctions.
  Example: "Many cities have problems with traffic congestion. Cars and buses often get stuck in traffic jams during rush hours. Some cities are building new subway lines to help people travel faster. Public transportation can reduce pollution and save time."
- B2: 4-5 sentences with varied structures, more sophisticated vocabulary, and some complex clauses.
  Example: "The rapid development of artificial intelligence has transformed many industries in recent years. While some experts believe AI will create new job opportunities, others worry about potential job losses. Universities are now offering specialized courses to help students adapt to this changing landscape. Despite concerns, many businesses are investing heavily in AI solutions to remain competitive."
- C1/C2: 5 sophisticated sentences with advanced vocabulary, complex clauses, and nuanced expression.
  Example: "The intersection of technology and privacy rights presents one of the most formidable challenges of the digital era. As corporations amass unprecedented quantities of personal data, legislators worldwide struggle to establish regulatory frameworks that adequately protect citizens while fostering innovation. The concept of informed consent has become increasingly problematic in an environment where terms of service agreements are seldom read, let alone comprehended. Furthermore, the transnational nature of data flows complicates enforcement efforts, as information routinely traverses jurisdictional boundaries. These complexities necessitate a multifaceted approach involving stakeholders from various sectors of society."
- The discussion question should:
  - Directly follow its context paragraph.
  - Be phrased as an interesting prompt that encourages different viewpoints
  - Include topics that could generate healthy debate between teacher and student
  - Range from simpler questions to more thought-provoking debates
  - Be appropriate for one-on-one teaching via screen sharing
  - Encourage use of the target vocabulary
  - Be designed for in-depth conversation, not just short answers
  - Reference specific content from both its context paragraph and the main reading

⚠️ CRITICAL REQUIREMENT: You MUST provide EXACTLY 5 paragraph-question pairs. Failure to provide 5 pairs, each with a paragraph and a question, will cause your response to be rejected.

- Avoid generic questions - make them specific to the content and culturally relevant
- Adjust topic complexity appropriately for the target CEFR level
- Structure topics to build genuine discussion in a one-on-one context
- For each discussion question, include an image prompt (NEW!) - A detailed description (2-3 sentences) of what an image for this discussion topic should look like.

!!! EXTREMELY IMPORTANT - READING COMPREHENSION FORMAT !!!
You MUST ONLY create reading comprehension questions in these two formats:
1. Multiple-choice questions with 3-4 options and one correct answer
2. True-false questions with exactly ["True", "False"] options

DO NOT create any short-answer questions or questions that ask students to "explain" or "write."
ALL questions must have selectable options. This includes ALL questions in the reading comprehension section, especially the third question.

This is a screen-sharing environment where students CANNOT type responses. They can ONLY select from options you provide.

!!! READING COMPREHENSION COGNITIVE LEVELS REQUIREMENT !!!
Your reading comprehension questions MUST cover a balanced range of cognitive abilities:
1. REMEMBER/UNDERSTAND (1-2 questions): Test basic comprehension and recall of explicit information from the text.
   - Example for A1-A2: "What is the main character's name?"
   - Example for B1-B2: "What happened after the main event in the story?"
   - Example for C1-C2: "Which statement accurately summarizes the author's position?"

2. APPLY/ANALYZE (1-2 questions): Test ability to use information or break it into parts to explore relationships.
   - Example for A1-A2: "Why did the character make that choice?"
   - Example for B1-B2: "How does the second paragraph relate to the main idea?"
   - Example for C1-C2: "What evidence supports the author's argument about X?"

3. EVALUATE/CREATE (1-2 questions): Test ability to make judgments or create new perspectives.
   - Example for A1-A2: "Which title is best for this story?"
   - Example for B1-B2: "What would most likely happen next in this situation?"
   - Example for C1-C2: "How effective is the author's approach to presenting this topic?"

IMPORTANT: Adjust question complexity based on the CEFR level (${params.cefrLevel}):
- A1-A2: Simple vocabulary, direct questions about explicitly stated information

FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders.

{
  "title": "Descriptive lesson title about ${params.topic}",
  "level": "${params.cefrLevel}",
  "focus": "${params.focus}",
  "estimatedTime": ${params.lessonLength},
  "sections": [
    // WARMUP SECTION (Complete)
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Complete description of the warm-up...",
      "questions": ["Complete Question 1?", "Complete Question 2?", "Complete Question 3?", "Complete Question 4?", "Complete Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Complete step-by-step instructions...",
      "teacherNotes": "Complete teacher notes..."
    },
    // READING SECTION (Complete)
    {
      "type": "reading",
      "title": "Reading Text: [Actual Title]",
      "introduction": "Complete introduction...",
      "paragraphs": [
        "Complete paragraph 1 text...",
        "Complete paragraph 2 text...",
        "Complete paragraph 3 text...",
        "Complete paragraph 4 text...",
        "Complete paragraph 5 text..."
      ],
      "teacherNotes": "Complete teacher notes..."
    },
    // VOCABULARY SECTION (Complete - 5 words)
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "word1", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1", "phrase2"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word2", "partOfSpeech": "verb", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word3", "partOfSpeech": "adj", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word4", "partOfSpeech": "adv", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        },
        {
          "term": "word5", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "collocations": ["phrase1"], "notes": "Complete notes...", "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)..."
        }
      ]
    },
    // COMPREHENSION SECTION (Complete - 5 questions)
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        {"question": "Complete Question 1?", "options": ["A", "B"], "answer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Question 2?", "options": ["A", "B", "C"], "answer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Question 3?", "options": ["A", "B", "C", "D"], "answer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Question 4?", "options": ["True", "False"], "answer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Question 5?", "options": ["True", "False"], "answer": "False", "explanation": "Complete explanation..."}
      ]
    },
    // SENTENCE FRAMES SECTION (Complete - 2-5 frames)
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "frames": [
        {
          "pattern": "Complete pattern like _____ because ____.", "examples": ["Complete example 1...", "Complete example 2..."],
          "usageNotes": "Complete usage notes...", "teachingTips": "Complete tips...", "difficultyLevel": "intermediate",
          "grammarFocus": "Complete grammar focus...", "communicativeFunction": "Complete function..."
        },
        // (Include 1-4 more complete frames)
      ]
    },
    // DISCUSSION SECTION (Complete - 5 pairs)
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "paragraphContext": "Complete, unique context paragraph 1 (3-5 sentences)...",
          "question": "Complete discussion question 1 related to paragraph 1?", 
          "imagePrompt": "Complete image prompt for Q1 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 2 (3-5 sentences)...",
          "question": "Complete discussion question 2 related to paragraph 2?", 
          "imagePrompt": "Complete image prompt for Q2 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 3 (3-5 sentences)...",
          "question": "Complete discussion question 3 related to paragraph 3?", 
          "imagePrompt": "Complete image prompt for Q3 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 4 (3-5 sentences)...",
          "question": "Complete discussion question 4 related to paragraph 4?", 
          "imagePrompt": "Complete image prompt for Q4 (no text)..."
        },
        {
          "paragraphContext": "Complete, unique context paragraph 5 (3-5 sentences)...",
          "question": "Complete discussion question 5 related to paragraph 5?", 
          "imagePrompt": "Complete image prompt for Q5 (no text)..."
        }
      ]
    },
    // QUIZ SECTION (Complete - 5 questions)
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {"question": "Complete Quiz Q1?", "options": ["A", "B"], "answer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q2?", "options": ["A", "B", "C"], "answer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q3?", "options": ["A", "B", "C", "D"], "answer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q4?", "options": ["True", "False"], "answer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q5?", "options": ["True", "False"], "answer": "False", "explanation": "Complete explanation..."}
      ]
    }
  ]
}

Ensure the entire output is a single, valid JSON object starting with { and ending with }.`;
      
      // Use qwen-max model for better JSON handling ability
      const modelName = "qwen-max";
      
      // Request payload following OpenAI-compatible format for the international endpoint
      const requestBody = {
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: prompt 
          },
          { 
            role: "user", 
            content: `Generate the lesson content for topic: "${params.topic}", CEFR level: ${params.cefrLevel}. Focus: ${params.focus}. Length: ${params.lessonLength} minutes. ${params.additionalNotes ? `Additional notes: ${params.additionalNotes}` : ''}` 
          }
        ],
        temperature: 0.3, 
        top_p: 0.9,
        max_tokens: 8192 // Qwen API maximum limit
      };
      
      console.log(`Using model: ${modelName}`);
      console.log('Request endpoint:', QWEN_API_URL);
      
      // Log request details without sensitive information
      console.log('Request structure:', JSON.stringify({
        model: requestBody.model,
        messages: [
          { role: requestBody.messages[0].role, content: "**system prompt content** [redacted]" },
          { role: requestBody.messages[1].role, content: "**user prompt content** [redacted]" }
        ],
        temperature: requestBody.temperature,
        top_p: requestBody.top_p,
        max_tokens: requestBody.max_tokens
      }, null, 2));
      
      // Make the API request
      try {
        // Create logs directory if it doesn't exist
        if (!fs.existsSync('./logs')) {
          fs.mkdirSync('./logs', { recursive: true });
        }
        
        if (!fs.existsSync('./logs/debug')) {
          fs.mkdirSync('./logs/debug', { recursive: true });
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
          const content = response.data.choices[0].message.content;
          let jsonContent: any;
          try {
            jsonContent = JSON.parse(content);
          } catch (error) {
            console.error('Error parsing Qwen response as JSON:', error);
            let cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            try {
              jsonContent = JSON.parse(cleanedContent);
              console.log('Successfully parsed JSON after cleaning content');
            } catch (cleanError) {
              console.error('Failed to parse JSON even after cleaning, trying to fix malformed JSON');
              const fixedContent = this.parseQwenColonFormat(cleanedContent);
              try {
                jsonContent = JSON.parse(fixedContent);
                console.log('Successfully parsed JSON after fixing malformed content');
              } catch (fixError) {
                console.error('Failed to parse JSON even after fixing, returning error response');
                return {
                  title: `Lesson on ${params.topic}`,
                  content: content,
                  error: 'JSON parsing failed',
                  provider: 'qwen'
                };
              }
            }
          }
          
          // Format content AND generate images
          return await this.formatLessonContent(jsonContent);
        }
        
        return {
          title: params.topic ? `Lesson on ${params.topic}` : 'ESL Lesson',
          content: 'Unable to generate lesson content',
          error: 'No content in response',
          provider: 'qwen'
        };
      } catch (error: any) {
        console.error('Error during API request:', error.message);
        
        // Provide more detailed error information for debugging
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Qwen API Response Error:');
          console.error('Status:', error.response.status);
          console.error('Status Text:', error.response.statusText);
          console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
          
          // Return a formatted error to the client
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: `Qwen API Error: ${error.response.status} - ${error.response.statusText}`,
            sections: [{
              type: "error",
              title: "API Error",
              content: `The Qwen AI service returned an error: ${error.response.status} ${error.response.statusText}. ${
                error.response.data && error.response.data.error && error.response.data.error.message
                  ? `\n\nAPI error: ${error.response.data.error.message}` 
                  : error.response.data && error.response.data.message
                    ? `\n\nMessage: ${error.response.data.message}`
                    : ''
              }`
            }]
          };
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Qwen API No Response Error:');
          console.error('Request:', error.request);
          
          // Return a formatted error to the client
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: 'No response received from Qwen API',
            sections: [{
              type: "error",
              title: "Connection Error",
              content: "No response was received from the Qwen AI service. This could be due to a timeout or network issue."
            }]
          };
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Qwen API Setup Error:', error.message);
          
          // Return a formatted error to the client
          return {
            title: `Lesson Generation Error`,
            provider: 'qwen',
            error: `Error setting up request: ${error.message}`,
            sections: [{
              type: "error",
              title: "Request Error",
              content: `An error occurred while preparing the request: ${error.message}`
            }]
          };
        }
      }
    } catch (error: any) {
      console.error('Error in QwenService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Format and process the lesson content, adding image data
   */
  private async formatLessonContent(content: any): Promise<any> {
    try {
      // If content is already an object (previously parsed JSON), work with it directly
      if (typeof content === 'object' && content !== null) {
        const lessonContent = content;
        
        // Process each section if sections array exists
        if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
          console.log('Starting image generation loop for Qwen lesson...');
          for (const section of lessonContent.sections) {
            // Skip if not a valid section object
            if (!section || typeof section !== 'object') continue;
            
            // Generate images for Vocabulary
            if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
              console.log(`Found ${section.words.length} vocabulary words, generating images...`);
              for (const word of section.words) {
                if (word.imagePrompt) {
                  try {
                    // Generate unique ID for logging
                    const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                    word.imageBase64 = await stabilityService.generateImage(word.imagePrompt, requestId);
                  } catch (imgError) {
                    console.error(`Error generating image for vocab word ${word.term}:`, imgError);
                    word.imageBase64 = null; // Ensure field exists even on error
                  }
                }
              }
            }

            // Handle discussion section specially (including image generation)
            if (section.type === 'discussion') {
              // Handle the introduction field possibly containing the paragraph context
              if (section.introduction && typeof section.introduction === 'string') {
                // If the introduction field looks like a paragraph (multiple sentences, no question marks)
                // then we store it as paragraphContext for the UI to render properly
                if (section.introduction.includes('.') && !section.introduction.includes('?')) {
                  section.paragraphContext = section.introduction;
                  console.log("Setting paragraphContext from introduction:", section.paragraphContext);
                }
              }
              
              // Process questions if they exist (including image generation)
              if (section.questions) {
                // If questions is an object but not an array, convert to array
                if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
                  console.log('Converting discussion questions from object to array format');
                  const questionArray = [];
                  for (const key in section.questions) {
                    if (key.startsWith('Question') || key.match(/^\d+$/) || key.match(/^[A-Za-z]$/)) {
                      questionArray.push(section.questions[key]);
                    }
                  }
                  
                  if (questionArray.length > 0) {
                    section.questions = questionArray;
                    console.log(`Converted ${questionArray.length} discussion questions to array format`);
                  }
                }
                
                // Ensure questions format is an array of objects and generate images
                if (Array.isArray(section.questions)) {
                  console.log(`Found ${section.questions.length} discussion questions, generating images...`);
                  // Use Promise.all for potentially faster image generation if needed, but sequential for now
                  for (let i = 0; i < section.questions.length; i++) {
                    let q = section.questions[i];
                    
                    // Standardize question format
                    let questionObj: any;
                    
                    if (typeof q === 'string') {
                      // Convert string questions to objects
                      questionObj = { question: q, paragraphContext: null };
                    } else if (typeof q === 'object' && q !== null) {
                      // Use existing object structure
                      questionObj = { ...q };
                      // Ensure question field exists
                      questionObj.question = q.question || q.text || `Discussion Question ${i + 1}`;
                    } else {
                      // Create default object for invalid types
                      questionObj = {
                        question: `Discussion Question ${i + 1}`,
                        paragraphContext: null
                      };
                    }
                    
                    // Check for paragraph context in various possible field names
                    if (!questionObj.paragraphContext) {
                      // Try to find paragraph context in other properties
                      questionObj.paragraphContext = 
                        questionObj.context || 
                        questionObj.paragraph || 
                        questionObj.introduction || 
                        (section.paragraphContext ? section.paragraphContext : null);
                    }
                    
                    q = questionObj;
                    
                    // Generate image if prompt exists
                    if (q.imagePrompt) {
                      try {
                        // Generate unique ID for logging
                        const requestId = `disc_${q.question ? q.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                        q.imageBase64 = await stabilityService.generateImage(q.imagePrompt, requestId);
                      } catch (imgError) {
                        console.error(`Error generating image for discussion question:`, imgError);
                        q.imageBase64 = null; // Ensure field exists even on error
                      }
                    }
                    section.questions[i] = q; // Update the array with potentially added imageBase64
                  }
                }
              }
            }
          }
          console.log('Finished image generation loop for Qwen lesson.');
        }
        
        // Add provider field to ensure consistent response structure
        lessonContent.provider = 'qwen';
        return lessonContent;
      }
      
      // Add provider field if content was not already an object
      if (typeof content === 'object' && content !== null) {
        content.provider = 'qwen';
      }
      return content;
    } catch (error: any) {
      console.error('Error formatting lesson content:', error);
      return content; // Return original content on formatting error
    }
  }

  /**
   * Special parser for Qwen's unique colon-based format
   * This handles the specific pattern seen in Qwen AI responses where objects use colons as separators
   * It attempts a more robust line-by-line parsing approach.
   */
  private parseQwenColonFormat(content: string): any | null {
    console.log("Attempting robust parsing of Qwen's colon format");
    
    // Basic check for minimum content
    if (!content || content.length < 50) {
      console.log("Content too short, skipping special parser");
      return null;
    }
    
    // Clean up potential markdown and trim
    let cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Attempt to fix the most common structural issues with regex first
    try {
      // Convert "key" : "value" : patterns to "key": "value",
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '"$1": "$2",');
      // Convert "key" : value : (for numbers/booleans) to "key": value,
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*([\d\.\w]+)\s*:/g, '"$1": $2,');
       // Convert array items like , "value" : to , "value",
      cleanedContent = cleanedContent.replace(/,\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, ', "$1",');
      // Convert first array items like [ "value" : to [ "value",
      cleanedContent = cleanedContent.replace(/\[\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '[ "$1",');
       // Remove trailing commas before closing braces/brackets
      cleanedContent = cleanedContent.replace(/,\s*([}\]])/g, '$1');
      // Ensure object starts correctly after a key
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*{/g, '"$1": {');
      // Ensure array starts correctly after a key
      cleanedContent = cleanedContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*\[/g, '"$1": [');
      
      // Remove potential garbage/incomplete structures at the end
      // Find the last valid closing brace or bracket
      const lastBrace = cleanedContent.lastIndexOf('}');
      const lastBracket = cleanedContent.lastIndexOf(']');
      const endPoint = Math.max(lastBrace, lastBracket);
      if (endPoint > 0 && endPoint < cleanedContent.length - 1) {
         // Check nesting to ensure we are closing the root object
         let openBraces = 0;
         let openBrackets = 0;
         for (let i = 0; i <= endPoint; i++) {
            if (cleanedContent[i] === '{') openBraces++;
            else if (cleanedContent[i] === '}') openBraces--;
            else if (cleanedContent[i] === '[') openBrackets++;
            else if (cleanedContent[i] === ']') openBrackets--;
         }
         // Only truncate if we are sure the structure up to endPoint is potentially valid
         // and that it seems to close the root object
         if (openBraces === 0 && openBrackets === 0 && cleanedContent[endPoint] === '}') { 
            console.log(`Truncating potentially corrupt data after index ${endPoint}`);
            cleanedContent = cleanedContent.substring(0, endPoint + 1);
         } else {
            console.log("Could not reliably determine truncation point.");
         }
      } else if (endPoint === -1) {
          console.log("No closing brace/bracket found for truncation.");
          // If there's no closing brace at all, the JSON is likely completely broken
          return null; 
      }

      // Final check: Does it start with { and end with }?
      if (!cleanedContent.startsWith('{') || !cleanedContent.endsWith('}')) {
        console.log("Cleaned content doesn't start/end with braces.")
        // Attempt to find the first { and last }
        const firstBrace = cleanedContent.indexOf('{');
        const lastBraceIdx = cleanedContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBraceIdx > firstBrace) {
          cleanedContent = cleanedContent.substring(firstBrace, lastBraceIdx + 1);
          console.log("Extracted content between first and last brace.")
        } else {
           console.log("Cannot fix start/end braces.");
           return null;
        }
      }
      
       // Try parsing the regex-fixed content
      const parsedJson = JSON.parse(cleanedContent);
      console.log("Successfully parsed Qwen content after regex fixing.");
      return parsedJson;

    } catch (error) {
      console.error("Error during robust Qwen parsing attempt:", error);
      console.log("Failed content sample (start):", content.substring(0, 200));
      console.log("Failed content sample (end):", content.substring(content.length - 200));
      return null; // Indicate failure
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');