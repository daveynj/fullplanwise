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

      // Build the prompt for lesson generation using the comprehensive Gemini prompt
      console.log('Building prompt for lesson generation');
      
      // Use the same comprehensive instructions as Gemini but format for Qwen
      const text = params.topic;
      const cefrLevel = targetLevel;
      const focus = params.focus || "speaking and vocabulary";
      const lessonLength = params.lessonLength || 45;
      const minVocabCount = 5;
      const maxVocabCount = 5;
      
      const prompt = `You are an expert ESL teacher. Create a comprehensive lesson about "${text}" for ${cefrLevel} level.

CRITICAL: Return ONLY valid JSON. ALL content must be about "${text}" and appropriate for ${cefrLevel} level.

VOCABULARY REQUIREMENTS:
- Exactly 5 vocabulary words with complete details
- Definitions using simpler vocabulary than target word
- Include pronunciation: syllables array, stressIndex, phoneticGuide (English letters/hyphens only)
- Example: "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
- Include semanticMap with synonyms, antonyms, relatedConcepts, contexts, associatedWords
- Add semanticGroup, additionalExamples, wordFamily, collocations, usageNotes, teachingTips
- Add imagePrompt for each word (no text in images)

READING TEXT:
- ${cefrLevel === 'A1' ? '80-120' : cefrLevel === 'A2' ? '100-150' : cefrLevel === 'B1' ? '120-180' : cefrLevel === 'B2' ? '150-220' : '180-250'} words
- Naturally incorporate all 5 vocabulary words
- Create paragraphs array with engaging content
- Include introduction and teacherNotes

COMPREHENSION QUESTIONS:
- 5 questions with options array, answer, correctAnswer, explanation
- Mix multiple choice and true/false
- Test understanding at appropriate ${cefrLevel} level

DISCUSSION QUESTIONS:
- Each question needs paragraphContext (3-5 sentences)
- Include imagePrompt for visual engagement
- Connect to students' experiences
- Encourage critical thinking for ${cefrLevel} level

SENTENCE FRAMES:
- Include patternTemplate, languageFunction, structureComponents, examples
- Add grammarFocus and teachingNotes arrays
- Focus on patterns useful for discussing "${text}"

WARMUP ACTIVITY:
- Include content, questions array, targetVocabulary, procedure, teacherNotes
- Introduce topic and vocabulary effectively

FORMAT YOUR RESPONSE AS VALID JSON:

{
  "title": "Descriptive lesson title about ${text}",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Complete description of the warm-up...",
      "questions": ["Complete Question 1?", "Complete Question 2?", "Complete Question 3?", "Complete Question 4?", "Complete Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Complete step-by-step instructions...",
      "teacherNotes": "Complete teacher notes..."
    },
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
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "word1", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word2", "partOfSpeech": "verb", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word3", "partOfSpeech": "adj", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word4", "partOfSpeech": "adv", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "word5", "partOfSpeech": "noun", "definition": "Complete definition...", "example": "Complete example...",
          "semanticGroup": "Group Name", 
          "additionalExamples": ["Example 1", "Example 2"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How these words are related"},
          "collocations": ["phrase1", "phrase2"], 
          "usageNotes": "Complete usage notes...",
          "teachingTips": "Complete tips...",
          "pronunciation": {"syllables": ["syl"], "stressIndex": 0, "phoneticGuide": "guide"},
          "imagePrompt": "Complete image prompt (no text)...",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "questions": [
        {"question": "Complete Question 1?", "options": ["A", "B"], "answer": "A", "correctAnswer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Question 2?", "options": ["A", "B", "C"], "answer": "C", "correctAnswer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Question 3?", "options": ["A", "B", "C", "D"], "answer": "D", "correctAnswer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Question 4?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Question 5?", "options": ["True", "False"], "answer": "False", "correctAnswer": "False", "explanation": "Complete explanation..."}
      ]
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "question": "Complete discussion question 1?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word1", "word2"],
          "imagePrompt": "Complete image prompt for this question..."
        },
        {
          "question": "Complete discussion question 2?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word3", "word4"],
          "imagePrompt": "Complete image prompt for this question..."
        },
        {
          "question": "Complete discussion question 3?",
          "paragraphContext": "Complete paragraph context providing background for the question...",
          "followUp": "Complete follow-up question...",
          "targetVocabulary": ["word5"],
          "imagePrompt": "Complete image prompt for this question..."
        }
      ]
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Practice",
      "patternTemplate": "Complete pattern template...",
      "languageFunction": "Complete language function...",
      "structureComponents": [
        {
          "label": "Component 1",
          "description": "Complete description...",
          "examples": ["example1", "example2", "example3"],
          "inSentenceExample": "Complete example..."
        }
      ],
      "examples": [
        {
          "completeSentence": "Complete example sentence...",
          "breakdown": "Complete breakdown..."
        }
      ],
      "grammarFocus": ["grammar point 1", "grammar point 2"],
      "teachingNotes": ["note 1", "note 2"]
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
        max_tokens: 8192 // Maximum allowed by Qwen API
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout to match lesson generation complexity
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