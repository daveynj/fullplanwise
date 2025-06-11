import type { LessonGenerateParams } from '../../shared/schema';

/**
 * Service for interacting with the Qwen AI API
 */
export class QwenService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a complete ESL lesson based on the provided parameters
   * @param params Lesson generation parameters
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Qwen API key is not configured');
    }

    const { 
      topic, 
      cefrLevel, 
      lessonLength = 45, 
      focus = 'speaking',
      targetVocabulary,
      aiProvider
    } = params;

    if (aiProvider !== 'qwen') {
      throw new Error(`Invalid AI provider for QwenService: ${aiProvider}`);
    }

    const text = topic;
    const minVocabCount = 5;
    const maxVocabCount = 5;
    
    const prompt = `You are an expert ESL teacher specializing in creating cognitively rich, comprehensive lessons.

CRITICAL: Your output must be properly formatted JSON with NO ERRORS!

SENTENCE FRAMES CRITICAL INSTRUCTION:
When you see template text like "REPLACE WITH: [instruction]" in the sentence frames section, you MUST replace it with actual content, NOT copy the instruction literally. Generate real examples, patterns, and teaching notes about ${text}. The frontend expects real data, not placeholder text.

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC "${text}" for ${cefrLevel} level.

4. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

5. CEFR LEVEL ADAPTATION: ALL content must be STRICTLY appropriate for the specified CEFR level:
   - Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
   - Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
   - Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
   - Reading text difficulty must match the specified level
   - Discussion paragraph contexts must be level-appropriate with vocabulary and grammar matching the CEFR level

6. DISCUSSION SECTION REQUIREMENTS:
   - CRITICAL: Each discussion question MUST have its own unique paragraph context (paragraphContext field)
   - These paragraph contexts must be 3-5 sentences that provide background information
   - The paragraph contexts must use vocabulary and sentence structures appropriate for the specified CEFR level
   - The paragraphs should include interesting information that helps students engage with the topic
   - The paragraph contexts should lead naturally into the discussion question that follows

7. CROSS-COMPONENT INTEGRATION VALIDATION:
✓ NATURAL INTEGRATION CHECK: Does each target vocabulary word appear naturally in the reading text?
✓ CONTENT DEPENDENCY: Do discussion questions require genuine understanding of the text content?
✓ VOCABULARY USAGE OPPORTUNITIES: Do discussion questions provide natural opportunities for students to USE target vocabulary?

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders:

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
      "type": "sentenceFrames", 
      "title": "Sentence Practice for ${text}",
      "introduction": "Practice expressing opinions about ${text} using these patterns",
      "frames": [
        {
          "patternTemplate": "I believe that _____ is _____ because _____.",
          "languageFunction": "Expressing opinions with reasons about ${text}",
          "title": "Opinion Patterns for ${text}",
          "level": "${cefrLevel.toLowerCase()}",
          "grammarFocus": [
            "Opinion expressions",
            "Because clauses",
            "Present tense statements"
          ],
          "structureComponents": [
            {
              "label": "Opinion Starter",
              "description": "Words to begin your opinion",
              "examples": ["I believe", "I think", "In my opinion", "I feel", "It seems to me"],
              "inSentenceExample": "I believe that ${text} is important because..."
            },
            {
              "label": "Reason", 
              "description": "The explanation for your opinion",
              "examples": ["it helps people", "it's necessary", "it creates opportunities", "it solves problems"],
              "inSentenceExample": "...because it helps people understand complex issues."
            }
          ],
          "examples": [
            {
              "completeSentence": "I believe that ${text} is important because it affects everyone's daily life.",
              "breakdown": {
                "Opinion Starter": "I believe",
                "Reason": "it affects everyone's daily life"
              }
            },
            {
              "completeSentence": "I think that ${text} is complex because it involves many different factors.", 
              "breakdown": {
                "Opinion Starter": "I think",
                "Reason": "it involves many different factors"
              }
            }
          ],
          "teachingNotes": [
            "Start with simple opinion expressions",
            "Help students give specific reasons", 
            "Practice with current examples"
          ]
        }
      ]
    },
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph about ${text} with [1:word] blanks. Students choose words from the word bank below to complete the text meaningfully.",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "Students should read the entire text first, then fill in blanks using context clues."
    },
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {
          "words": ["about", "${text}", "is", "interesting", "learning"],
          "correctSentence": "Learning about ${text} is interesting."
        },
        {
          "words": ["important", "understand", "to", "${text}", "it's"],
          "correctSentence": "It's important to understand ${text}."
        },
        {
          "words": ["can", "help", "${text}", "us", "solve", "problems"],
          "correctSentence": "${text} can help us solve problems."
        }
      ],
      "teacherNotes": "Students should arrange words to make grammatically correct sentences about the topic."
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "paragraphContext": "Context paragraph about ${text} with background information. This should be 3-5 sentences providing relevant details that lead into the discussion question.",
          "question": "What is your opinion about this aspect of ${text}?", 
          "imagePrompt": "Image showing people discussing ${text} in a modern setting"
        },
        {
          "paragraphContext": "Another context paragraph about a different aspect of ${text}. This provides new information to consider and discuss.",
          "question": "How do you think ${text} affects people in your community?", 
          "imagePrompt": "Image showing community members engaged with ${text}"
        },
        {
          "paragraphContext": "Third context paragraph exploring practical applications of ${text}. This gives students concrete examples to discuss.",
          "question": "What practical benefits do you see from ${text}?", 
          "imagePrompt": "Image showing practical applications of ${text}"
        },
        {
          "paragraphContext": "Fourth context paragraph about challenges related to ${text}. This presents issues for students to analyze and discuss.",
          "question": "What challenges do you think ${text} might create?", 
          "imagePrompt": "Image representing challenges or problems related to ${text}"
        },
        {
          "paragraphContext": "Final context paragraph about the future of ${text}. This encourages students to think ahead and predict changes.",
          "question": "How do you think ${text} will change in the future?", 
          "imagePrompt": "Image showing future possibilities related to ${text}"
        }
      ]
    },
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {"question": "Quiz question 1 about ${text}?", "options": ["Option A", "Option B"], "answer": "Option A", "correctAnswer": "Option A", "explanation": "Explanation for correct answer"},
        {"question": "Quiz question 2 about ${text}?", "options": ["Option A", "Option B", "Option C"], "answer": "Option C", "correctAnswer": "Option C", "explanation": "Explanation for correct answer"},
        {"question": "Quiz question 3 about ${text}?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option D", "correctAnswer": "Option D", "explanation": "Explanation for correct answer"},
        {"question": "Quiz question 4 about ${text}?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Explanation for correct answer"},
        {"question": "Quiz question 5 about ${text}?", "options": ["True", "False"], "answer": "False", "correctAnswer": "False", "explanation": "Explanation for correct answer"}
      ]
    }
  ],
  "grammarSpotlight": {
    "grammarType": "Choose appropriate grammar for ${cefrLevel} students studying ${text}",
    "title": "Grammar Focus: Communication Purpose",
    "description": "Explanation of why this grammar helps students discuss ${text}",
    "logicExplanation": {
      "communicationNeed": "Why this grammar pattern exists for discussing ${text}",
      "logicalSolution": "How this grammar pattern works logically",
      "usagePattern": "When to use this grammar when talking about ${text}",
      "communicationImpact": "What difference this grammar makes in expressing ideas about ${text}"
    },
    "teachingTips": [
      "Practical classroom tip for teaching this concept",
      "Common student confusion to watch for",
      "Recommended teaching sequence"
    ],
    "practiceActivities": [
      {
        "type": "guided_discovery",
        "title": "Discovery Activity Title",
        "description": "Description of discovery activity",
        "examples": [
          "Example 1 using lesson vocabulary",
          "Example 2 using lesson vocabulary",
          "Example 3 using lesson vocabulary"
        ],
        "guidingQuestions": [
          "Question 1 to help students discover pattern",
          "Question 2 to help students understand logic",
          "Question 3 to help students apply pattern"
        ]
      }
    ],
    "commonErrors": [
      {
        "error": "Common error students make",
        "explanation": "Why students make this error",
        "correction": "How to correct the error",
        "preventionTip": "How to prevent this error"
      }
    ],
    "levelProgression": {
      "currentLevel": "${cefrLevel}",
      "whatStudentsCanDo": "What students at this level can do with this grammar",
      "nextLevelGoals": "What next level should achieve",
      "scaffoldingTips": "How to help students progress"
    }
  }
}`;

    try {
      console.log('Using API key pattern:', this.apiKey.substring(0, 5) + '...' + this.apiKey.slice(-4));
      console.log('Building prompt for lesson generation');
      console.log('Prompt length:', prompt.length, 'characters');
      
      console.log('Making request to Qwen API...');
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable'
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          input: {
            messages: [
              {
                role: 'system',
                content: 'You are an expert ESL teacher. Generate comprehensive lesson content based on the provided requirements.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            result_format: 'message',
            max_tokens: 8192,
            temperature: 0.7,
            top_p: 0.8,
            top_k: 50,
            repetition_penalty: 1.1,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
            stream: false
          }
        })
      });

      console.log('Qwen API response received');
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Qwen API error:', response.status, errorText);
        throw new Error(`Qwen API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.output || !data.output.choices || !data.output.choices[0]) {
        console.error('Invalid Qwen API response structure:', JSON.stringify(data, null, 2));
        throw new Error('Invalid response structure from Qwen API');
      }

      const content = data.output.choices[0].message.content;
      console.log('Raw content length:', content.length);

      // Clean the content to ensure it's valid JSON
      let cleanedContent = content.trim();
      
      // Remove any potential markdown code blocks
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      console.log('Cleaned content for parsing, length:', cleanedContent.length);

      try {
        const lessonData = JSON.parse(cleanedContent);
        console.log('Successfully parsed JSON response');
        return lessonData;
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Content that failed to parse:', cleanedContent.substring(0, 500));
        throw new Error(`Failed to parse Qwen response as JSON: ${parseError.message}`);
      }

    } catch (error) {
      console.error('Error generating lesson with Qwen:', error);
      throw error;
    }
  }
}

export const qwenService = new QwenService(process.env.QWEN_API_KEY || '');