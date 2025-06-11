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

5. CRITICAL VOCABULARY SELECTION PROTOCOL - FOLLOW 5-STEP PROCESS:

STEP 1: VOCABULARY LEVEL ANALYSIS
Before selecting vocabulary, analyze what ${cefrLevel} students know:
- A1: basic family, food, colors, numbers, simple present, survival vocabulary
- A2: A1 + basic past tense, common adjectives, personal experiences  
- B1: A1/A2 + present perfect, opinions, comparisons, everyday topics
- B2: A1-B1 + academic thinking, complex discussions, abstract concepts
- C1: A1-B2 + advanced academic language, nuanced expression
- C2: Near-native vocabulary including idiomatic and specialized language

APPROPRIATE NEW VOCABULARY FOR ${cefrLevel}:
- A1: Concrete, immediate needs (house, clothes, body parts, basic actions)
- A2: Personal experiences (interesting, boring, excited, yesterday, tomorrow)
- B1: Social topics (community, environment, although, however, opinion)
- B2: Academic language (sustainability, efficiency, infrastructure, furthermore)
- C1: Sophisticated concepts (implications, comprehensive, predominantly)
- C2: Advanced terminology (nuanced, paradigm, intrinsic, contemporary)

STEP 2: TOPIC-APPROPRIATE VOCABULARY FOR "${text}"
Choose vocabulary that enables meaningful discussion of "${text}" at ${cefrLevel} level:
- Focus on authentic communication needs for this topic
- Select words that work together functionally
- Ensure vocabulary serves real-world usage patterns

STEP 3: DEFINITION REQUIREMENTS
FUNDAMENTAL RULE: Definition language MUST be simpler than the target word!

${cefrLevel} DEFINITION EXAMPLES:
- A1: "Beautiful" = "very nice to look at" (NOT "aesthetically pleasing")
- A2: "Environment" = "the natural world with air, water, plants" (NOT "aggregate phenomena")
- B1: "Innovation" = "creating new ideas or ways of doing things" (NOT "novel methodologies")
- B2: "Entrepreneur" = "person who starts and runs their own business" (NOT "conceptualizes enterprises")

STEP 4: PRONUNCIATION GUIDELINES
Examples: "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
Use ONLY English characters and hyphens, NO IPA symbols.

STEP 5: SEMANTIC COHERENCE
Select words that work together to enable comprehensive topic discussion.

6. READING TEXT DEVELOPMENT APPROACH

SPEAKING-FOCUSED TEXT PURPOSE:
This text serves as a CONVERSATION CATALYST for ${cefrLevel} students:
- Provide accessible content for discussion without overwhelming
- Include discussion-worthy material that generates opinions
- Incorporate all 5 vocabulary words naturally
- Create talking points students can reference in conversation

TEXT LENGTH GUIDELINES:
- A1: 80-120 words (quick to read, maximum speaking time)
- A2: 100-150 words (manageable, focuses on conversation)
- B1: 120-180 words (balanced content for discussion)  
- B2: 150-220 words (rich content for analytical discussion)
- C1/C2: 180-250 words (sophisticated content for extended discussion)

7. SENTENCE FRAMES PATTERN SELECTION

COMMUNICATIVE NEED ANALYSIS FOR ${cefrLevel}:
- A1: Basic preferences ("I like ___ because ___")
- A2: Personal experiences ("Yesterday I ___ and it was ___")
- B1: Opinions with reasons ("I believe ___ because ___")
- B2: Analytical thinking ("Although ___, ___ nevertheless ___")
- C1/C2: Sophisticated analysis ("Despite the fact that ___, it could be argued that ___")

Select patterns that specifically help students discuss "${text}" effectively.

8. DISCUSSION QUESTIONS DEVELOPMENT

COGNITIVE ABILITIES BY LEVEL:
- A1: Personal experiences, basic preferences, concrete situations
- A2: Simple comparisons, past/future plans, basic cultural topics
- B1: Opinions with reasons, practical problems, social issues
- B2: Analytical discussions, multiple perspectives, abstract concepts
- C1: Sophisticated analysis, synthesis of information, speculative discussion
- C2: Expert-level discussions, nuanced argumentation, complex interdisciplinary topics

Each question MUST include unique paragraph context (3-5 sentences) providing background for meaningful discussion.

9. CEFR LEVEL ADAPTATION: ALL content must be STRICTLY appropriate for ${cefrLevel} level:
   - Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
   - Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
   - Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
   - Reading text difficulty must match the specified level
   - Discussion paragraph contexts must be level-appropriate

10. CROSS-COMPONENT INTEGRATION VALIDATION:
✓ NATURAL INTEGRATION: Does each vocabulary word appear naturally in the reading text?
✓ CONTENT DEPENDENCY: Do discussion questions require genuine understanding of the text?
✓ VOCABULARY USAGE: Do discussion questions provide opportunities to USE target vocabulary?

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