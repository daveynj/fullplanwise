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

5. TONE & STYLE APPROACH:
First, analyze appropriate tone and style considerations for ${cefrLevel} level:
- Research how tone and register should be adjusted for ${cefrLevel} level learners
- Identify appropriate language complexity, sentence structure, and vocabulary choices for this level
- Determine the optimal balance between authenticity and accessibility
- Consider how the topic "${text}" influences appropriate tone and style
- Analyze engagement strategies that work best for this proficiency level and topic

Based on your analysis, develop a tone and style that:
- Is most effective for ${cefrLevel} level language comprehension
- Creates appropriate engagement for the specific topic "${text}"
- Balances authenticity with accessibility
- Models natural language use appropriate to the context
- Demonstrates appropriate register for both the topic and level
- Provides appropriate linguistic scaffolding through style choices
- Creates interest and motivation for continued reading/learning

Apply your determined tone and style consistently across all lesson components:
- Reading text
- Vocabulary definitions and examples
- Activity instructions
- Discussion questions and contexts
- Teacher guidance sections

TOPIC DIFFERENTIATION APPROACH:
First, analyze how the topic "${text}" should be treated differently across CEFR levels:
- Research how the complexity and focus of topic treatment evolves from A1 to C2
- Identify specific aspects of the topic appropriate for ${cefrLevel} level
- Determine which vocabulary domains within this topic are level-appropriate
- Consider how conceptual complexity should increase with higher levels

For "${text}" at ${cefrLevel} level specifically:
- Identify 3-5 unique aspects or sub-topics that are specifically appropriate for this level
- Determine which vocabulary domains are appropriate for THIS level but NOT lower levels
- Consider which cognitive approaches to the topic match this specific level
- Identify conceptual complexity appropriate specifically for ${cefrLevel}

Based on your analysis, create a unique approach to "${text}" for ${cefrLevel} level by:
- Focusing on the sub-aspects most appropriate for this specific level
- Selecting vocabulary that would NOT be taught at lower levels
- Approaching the topic from a cognitive perspective matching this level
- Ensuring clear differentiation from how this topic would be taught at other levels

This approach should ensure that lessons on the same topic at different CEFR levels are substantially different in:
- Vocabulary selection
- Question complexity and type
- Conceptual approach
- Content focus and examples

6. CEFR LEVEL ADAPTATION: ALL content must be STRICTLY appropriate for the specified CEFR level:
   - Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
   - Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
   - Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
   - Reading text difficulty must match the specified level
   - Discussion paragraph contexts must be level-appropriate with vocabulary and grammar matching the CEFR level

7. DISCUSSION SECTION REQUIREMENTS:
   - CRITICAL: Each discussion question MUST have its own unique paragraph context (paragraphContext field)
   - These paragraph contexts must be 3-5 sentences that provide background information
   - The paragraph contexts must use vocabulary and sentence structures appropriate for the specified CEFR level
   - The paragraphs should include interesting information that helps students engage with the topic
   - The paragraph contexts should lead naturally into the discussion question that follows

8. CROSS-COMPONENT INTEGRATION VALIDATION:
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
    // COMPREHENSION SECTION (Complete - 5 questions)
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
    // SENTENCE FRAMES SECTION - GENERATE CUSTOM CONTENT FOR THE TOPIC "${text}"
    // CRITICAL: Replace ALL placeholder text with REAL content. Generate actual examples, patterns, and teaching notes.
    // Do NOT copy the template literally - generate real sentences about ${text}.
    {
      "type": "sentenceFrames", 
      "title": "REPLACE WITH: engaging title about ${text}",
      "introduction": "REPLACE WITH: how these patterns help students discuss ${text}",
      "frames": [
        {
          "patternTemplate": "REPLACE WITH: sentence pattern using _____ blanks for ${text}",
          "languageFunction": "REPLACE WITH: communication purpose for ${text}",
          "title": "REPLACE WITH: clear pattern title for ${text}",
          "level": "${cefrLevel.toLowerCase()}",
          "grammarFocus": [
            "REPLACE WITH: grammar points students will practice",
            "REPLACE WITH: additional grammar features",
            "REPLACE WITH: language structures to highlight"
          ],
          "structureComponents": [
            {
              "label": "Opinion Verb",
              "description": "A verb that expresses your feeling or opinion",
              "examples": ["like", "love", "enjoy", "prefer", "appreciate", "admire"],
              "inSentenceExample": "I [Opinion Verb] ${text} because..."
            },
            {
              "label": "Reason", 
              "description": "The explanation for your opinion",
              "examples": ["it makes me happy", "it's interesting", "it's important", "it helps people", "it's beautiful", "it's useful"],
              "inSentenceExample": "...because [Reason]."
            }
          ],
          "examples": [
            {
              "completeSentence": "I love ${text} because it makes me happy.",
              "breakdown": {
                "Opinion Verb": "love",
                "Reason": "it makes me happy"
              }
            },
            {
              "completeSentence": "I appreciate ${text} because it's important.", 
              "breakdown": {
                "Opinion Verb": "appreciate",
                "Reason": "it's important"
              }
            },
            {
              "completeSentence": "I enjoy ${text} because it's interesting.",
              "breakdown": {
                "Opinion Verb": "enjoy", 
                "Reason": "it's interesting"
              }
            }
          ],
          "teachingNotes": [
            "Start with familiar opinion verbs like 'like' and 'love'",
            "Help students give specific reasons, not just 'it's good'", 
            "Practice with topics students care about personally"
          ]${cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1' ? `,
          "lowerLevelScaffolding": {
            "sentenceWorkshop": [
              {
                "name": "Building Step by Step",
                "steps": [
                  {
                    "level": "word",
                    "example": "[simple starting word]",
                    "explanation": "[explain first step]"
                  },
                  {
                    "level": "phrase", 
                    "example": "[simple phrase using the word]",
                    "explanation": "[explain second step]"
                  },
                  {
                    "level": "sentence",
                    "example": "[complete simple sentence about '${text}']",
                    "explanation": "[explain final step]"
                  }
                ],
                "teachingNotes": "[guidance for teachers using this scaffolding]"
              }
            ],
            "patternTrainer": {
              "pattern": "[simplified version of the main pattern]",
              "title": "Pattern Practice Tool",
              "scaffolding": {
                "component1": ["[word1]", "[word2]", "[word3]", "[word4]", "[word5]", "[word6]", "[word7]"],
                "component2": ["[word1]", "[word2]", "[word3]", "[word4]", "[word5]", "[word6]", "[word7]"],
                "component3": ["[phrase1]", "[phrase2]", "[phrase3]", "[phrase4]"]
              },
              "examples": [
                "[Example sentence using pattern trainer words about '${text}']",
                "[Another example sentence using pattern trainer words about '${text}']"
              ],
              "instructions": [
                "[Step 1 instruction for students]",
                "[Step 2 instruction for students]", 
                "[Step 3 instruction for students]"
              ]
            }
          }` : ''}
        }
      ]
    },
    // CLOZE SECTION (Complete - Fill in the Blanks)
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph with blanks, using [1:word] format for the first blank, [2:word] for the second, etc. Use appropriate vocabulary from the lesson...",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
    },
    // SENTENCE UNSCRAMBLE SECTION (Complete - Word Ordering)
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {
          "words": ["Complete", "array", "of", "individual", "words", "in", "scrambled", "order"],
          "correctSentence": "Complete array of individual words in correct order."
        },
        {
          "words": ["Another", "set", "of", "words", "in", "scrambled", "order"],
          "correctSentence": "Another set of words in correct order."
        },
        {
          "words": ["One", "more", "sentence", "with", "words", "out", "of", "order"],
          "correctSentence": "One more sentence with words in correct order."
        }
      ],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
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
        {"question": "Complete Quiz Q1?", "options": ["A", "B"], "answer": "A", "correctAnswer": "A", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q2?", "options": ["A", "B", "C"], "answer": "C", "correctAnswer": "C", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q3?", "options": ["A", "B", "C", "D"], "answer": "D", "correctAnswer": "D", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q4?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Complete explanation..."},
        {"question": "Complete Quiz Q5?", "options": ["True", "False"], "answer": "False", "correctAnswer": "False", "explanation": "Complete explanation..."}
      ]
    }
  ],
  // GRAMMAR SPOTLIGHT (AI-GENERATED LOGIC-BASED GRAMMAR TEACHING)
  "grammarSpotlight": {
    "grammarType": "Choose the most useful grammar pattern for ${cefrLevel} students studying ${text}. For A1-A2: simple_present, simple_past, articles, basic_modals. For B1-B2: present_perfect, modal_verbs, conditionals_basic, relative_clauses. For C1-C2: conditionals_advanced, passive_voice, reported_speech. Select based on what helps students discuss ${text} effectively.",
    
    "title": "Create an engaging title that explains the grammar's communication purpose, like 'Modal Verbs: Expressing Possibility' or 'Present Perfect: Connecting Past to Present'",
    
    "description": "Explain in simple terms why this grammar pattern helps students communicate better when discussing ${text}",

    "logicExplanation": {
      "communicationNeed": "Explain why this grammar pattern exists and what communication problem it solves for people discussing ${text}",
      
      "logicalSolution": "Explain how this grammar pattern works logically to solve that communication need",
      
      "usagePattern": "Explain when students should use this grammar pattern when talking about ${text}",
      
      "communicationImpact": "Explain what difference using this grammar makes in how students can express ideas about ${text}"
    },

    "teachingTips": [
      "[Practical classroom tip: How should teachers introduce this concept? - e.g., 'Start with the communication need: Why do we need this grammar? Then show the logical solution']",
      "[Common student confusion: What do students typically misunderstand? - e.g., 'Students often memorize rules without understanding purpose - focus on meaning first, then form']",
      "[Teaching sequence: What order works best? - e.g., '1) Explain need → 2) Show logic → 3) Practice examples → 4) Apply in context']"
    ],

    "practiceActivities": [
      {
        "type": "guided_discovery",
        "title": "[Discovery Activity Title]",
        "description": "[Clear description of the discovery activity]",
        "examples": [
          "[Example 1 using vocabulary and context from this lesson]",
          "[Example 2 using vocabulary and context from this lesson]",
          "[Example 3 using vocabulary and context from this lesson]"
        ],
        "guidingQuestions": [
          "[Question 1 to help students discover the pattern]",
          "[Question 2 to help students understand the logic]",
          "[Question 3 to help students apply the pattern]"
        ]
      },
      {
        "type": "controlled_practice",
        "title": "[Practice Activity Title]",
        "description": "[Clear description of the practice activity]",
        "exercises": [
          {
            "prompt": "[Exercise prompt using lesson content]",
            "answer": "[Correct answer]",
            "feedback": "[Explanation of why this answer is correct]"
          },
          {
            "prompt": "[Exercise prompt using lesson content]",
            "answer": "[Correct answer]",
            "feedback": "[Explanation of why this answer is correct]"
          },
          {
            "prompt": "[Exercise prompt using lesson content]",
            "answer": "[Correct answer]",
            "feedback": "[Explanation of why this answer is correct]"
          }
        ]
      }
    ],

    "commonErrors": [
      {
        "error": "[Common error students make with this grammar]",
        "explanation": "[Why students make this error]",
        "correction": "[How to correct the error]",
        "preventionTip": "[How to prevent this error]"
      },
      {
        "error": "[Another common error]",
        "explanation": "[Why students make this error]",
        "correction": "[How to correct the error]",
        "preventionTip": "[How to prevent this error]"
      }
    ],

    "levelProgression": {
      "currentLevel": "${cefrLevel}",
      "whatStudentsCanDo": "[What students at this level can typically do with this grammar]",
      "nextLevelGoals": "[What the next level should achieve with this grammar]",
      "scaffoldingTips": "[How to help students progress to the next level]"
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