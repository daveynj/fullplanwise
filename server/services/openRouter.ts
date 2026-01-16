import axios, { AxiosResponse } from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { runwareService } from './runware.service';

/**
 * Service for interacting with AI models via OpenRouter
 */
export class OpenRouterService {
  private apiKey: string;
  private baseURL: string = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('OpenRouter API key is not provided or is empty');
    }
    this.apiKey = apiKey;
  }
  
  /**
   * Generate a complete ESL lesson based on the provided parameters
   */
  async generateLesson(params: LessonGenerateParams, studentVocabulary: string[] = []): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }

      console.log('Starting OpenRouter AI lesson generation...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      const prompt = this.constructLessonPrompt(params, studentVocabulary);
      
      const requestData = {
        model: 'google/gemini-3-pro-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 16384,
      };

      console.log('Sending request to OpenRouter API...');
      console.log('Request payload:', JSON.stringify(requestData, null, 2).substring(0, 300));

      try {
        const response: AxiosResponse = await axios.post(
          `${this.baseURL}/chat/completions`,
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://planwiseesl.com',
              'X-Title': 'PlanwiseESL'
            },
            timeout: 60000
          }
        );

        console.log('Received response from OpenRouter');
        console.log('Response status:', response.status);
        
        if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
          console.error('Unexpected API response structure:', JSON.stringify(response.data, null, 2).substring(0, 1000));
          throw new Error(`Invalid API response structure. Expected 'choices' array but got: ${JSON.stringify(response.data).substring(0, 500)}`);
        }

        const text = response.data.choices[0]?.message?.content;
        
        if (!text) {
          console.error('No content in API response');
          throw new Error('API response missing content');
        }
        
        console.log('Successfully extracted content from API response');
        
        try {
          let cleanedContent = text;
          
          if (text.trim().startsWith('`') && text.trim().endsWith('`')) {
            console.log('Detected markdown code block, cleaning content');
            cleanedContent = text.replace(/`\s*/g, '').replace(/`\s*$/g, '').trim();
          }
          
          if (cleanedContent.trim().startsWith('json\n') || cleanedContent.trim().startsWith('json\r\n') || cleanedContent.trim().startsWith('json ')) {
            console.log('Detected "json" prefix, removing it');
            cleanedContent = cleanedContent.trim().replace(/^json\s*[\r\n\s]+/, '');
          }
          
          cleanedContent = cleanedContent.trim().replace(/^(Here's the|Here is the|The following is the)\s*[\w\s]*:?\s*[\r\n]*/, '');
          cleanedContent = cleanedContent.trim().replace(/^JSON\s*[\r\n]+/, '');
          
          if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
            console.log('Removing wrapping quotes');
            cleanedContent = cleanedContent.slice(1, -1);
          }
          
          try {
            const jsonContent = JSON.parse(cleanedContent);
            console.log('Successfully parsed JSON content');
            
            if (jsonContent.title && jsonContent.sections && Array.isArray(jsonContent.sections)) {
              console.log('Lesson content has valid structure, applying quality control...');
              const validatedContent = await this.validateAndImproveContent(jsonContent, params);
              return await this.formatLessonContent(validatedContent);
            } else {
              console.warn('Parsed JSON is missing required structure', JSON.stringify({
                hasTitle: !!jsonContent.title,
                hasSections: !!jsonContent.sections,
                sectionsIsArray: Array.isArray(jsonContent.sections),
                sectionsLength: jsonContent.sections ? jsonContent.sections.length : 0
              }));
              
              return {
                title: `Lesson on ${params.topic}`,
                content: "The generated lesson is missing required structure",
                error: 'Invalid lesson structure',
                provider: 'openrouter',
                sections: [
                  {
                    type: "error",
                    title: "Content Error",
                    content: "The lesson structure is incomplete. This may be because the topic contains sensitive content or is too complex. Please try with a different topic or simplify your current topic."
                  }
                ]
              };
            }
          } catch (jsonError) {
            console.error('Error parsing OpenRouter response as JSON:', jsonError);
            
            const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
            const errorPosition = errorMessage.match(/position (\d+)/)?.[1];
            
            const textPreview = errorPosition 
              ? `${cleanedContent.substring(Math.max(0, parseInt(errorPosition) - 50), parseInt(errorPosition))}[ERROR HERE]${cleanedContent.substring(parseInt(errorPosition), parseInt(errorPosition) + 50)}`
              : cleanedContent.substring(0, 200) + (cleanedContent.length > 200 ? '...' : '');
            
            console.warn('Response text around error:', textPreview);
            
            console.log('Attempting to fix common JSON formatting errors...');
            
            try {
              let fixedContent = cleanedContent
                .replace(/,\s*}/g, '}')
                .replace(/,\s*\]/g, ']')
                .replace(/,(\s*["']?\s*[}\]])/g, '$1')
                .replace(/([^\\])(\\)([^"\\\/bfnrtu])/g, '$1\\\\$3')
                .replace(/([^\\])\\'/g, "$1'")
                .replace(/\r?\n|\r/g, ' ')
                .replace(/"\s+([^"]*)\s+"/g, '"$1"')
                .replace(/(['"])([\w]+)(['"]):/g, '"$2":')
                .replace(/,\s*,/g, ',')
                .replace(/"\s*"([^"]*)\s*"/g, '"$1"')
                .replace(/,\s*"([^"]*)",\s*"can\s+lea/g, '", "can lea');
                
              let inString = false;
              let escaped = false;
              let fixedChars = [];
              
              for (let i = 0; i < fixedContent.length; i++) {
                const char = fixedContent[i];
                
                if (escaped) {
                  escaped = false;
                  fixedChars.push(char);
                } else if (char === '\\') {
                  escaped = true;
                  fixedChars.push(char);
                } else if (char === '"') {
                  inString = !inString;
                  fixedChars.push(char);
                } else if (!inString && (char === ' ' || char === '\t' || char === '\n' || char === '\r')) {
                  continue;
                } else {
                  fixedChars.push(char);
                }
              }
              
              const finalFixedContent = fixedChars.join('');
              
              const jsonContent = JSON.parse(finalFixedContent);
              console.log('Successfully parsed JSON after applying fixes!');
              
              if (jsonContent.title && jsonContent.sections && Array.isArray(jsonContent.sections)) {
                console.log('Fixed content has valid structure, applying quality control...');
                const validatedContent = await this.validateAndImproveContent(jsonContent, params);
                return await this.formatLessonContent(validatedContent);
              } else {
                throw new Error('Fixed JSON still missing required structure');
              }
            } catch (fixError) {
              console.error('Error parsing even after fixes:', fixError);
              throw new Error(`JSON parsing failed even after attempted fixes: ${errorMessage}`);
            }
          }
        } catch (error) {
          console.error('Unexpected error processing OpenRouter response:', error);
          throw new Error(`Error processing OpenRouter response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error: any) {
        if (error.response) {
          console.error('OpenRouter API Error Response:');
          console.error('Status:', error.response.status);
          console.error('Status Text:', error.response.statusText);
          console.error('Headers:', JSON.stringify(error.response.headers, null, 2).substring(0, 500));
          console.error('Response Data Type:', typeof error.response.data);
          console.error('Response Data Preview:', JSON.stringify(error.response.data).substring(0, 500));
          
          if (error.response.status === 401 || error.response.status === 403) {
            console.error('AUTHENTICATION ERROR - Check OPENROUTER_API_KEY');
          }
        } else if (error.request) {
          console.error('No response received from OpenRouter API');
          console.error('Request URL:', error.config?.url);
          console.error('Request Method:', error.config?.method);
        } else {
          console.error('Error setting up request:', error.message);
        }
        
        console.error('Error during OpenRouter API request:', error.message);
        
        const isPolicyError = error.message && (
          error.message.includes('content policy') || 
          error.message.includes('SAFETY') || 
          error.message.includes('blocked') ||
          error.message.includes('not appropriate')
        );
        
        if (isPolicyError) {
          return {
            title: `Lesson on ${params.topic}`,
            error: error.message,
            provider: 'openrouter',
            sections: [
              {
                type: "error",
                title: "Content Policy Restriction",
                content: "The topic may contain sensitive content that cannot be processed. Please try a different topic."
              }
            ]
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error in OpenRouterService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Constructs a natural language prompt for the AI model to generate ESL lessons
   */
  private constructLessonPrompt(params: LessonGenerateParams, studentVocabulary: string[] = []): string {
    const { cefrLevel, topic, focus, lessonLength } = params;
    
    const levelGuidance = this.getLevelGuidance(cefrLevel);
    
    const vocabularyHistoryNote = studentVocabulary.length > 0 
      ? `

STUDENT'S PREVIOUS VOCABULARY:
This student has already learned these words: ${studentVocabulary.join(', ')}

You may use these words naturally when they fit, but choose 5 NEW words as the focus vocabulary for this lesson. Prioritize creating engaging content over forcing in previously learned words.`
      : '';

    const prompt = `<role>
You are an expert ESL teacher creating a ${lessonLength}-minute lesson on "${topic}" for ${cefrLevel} (${levelGuidance.description}) students.
</role>

<output_format>
CRITICAL: Return ONLY valid JSON. Start with { and end with }. No markdown, no explanations, no text before or after.
</output_format>
${vocabularyHistoryNote}
${params.targetVocabulary ? `\nREQUIRED VOCABULARY: Include these specific words: ${params.targetVocabulary}` : ''}

<context>
LESSON CONTEXT:
This is for a 1-on-1 online class via screen sharing. Create engaging, interactive content. Focus area: "${focus}".
</context>

---

<instructions>
CREATING YOUR LESSON:

<step number="1" title="SELECT 5 VOCABULARY WORDS">
Choose 5 words appropriate for ${cefrLevel} using the Cambridge English Vocabulary Profile. ${levelGuidance.vocabularyGuidance}

<guidance>
Ask yourself: Would a ${cefrLevel} student encounter and need this word? Is it useful for discussing "${topic}"? Can it be defined using simpler vocabulary?
</guidance>

<requirements>
Each word needs:
- term, partOfSpeech
- definition (clear and simple, ${levelGuidance.definitionGuidance})
- example (natural usage sentence)
- collocations (2-3 common phrases)
- wordFamily (related word forms with description)
- usageNotes (when and how to use it)
- pronunciation with syllables array, stressIndex number, and phoneticGuide using English letters only (like "eg-ZAM-pul"), no IPA symbols
- imagePrompt (40-80 words describing a scene that illustrates the word, ending with "No text visible")
- semanticMap with synonyms, antonyms, relatedConcepts, contexts, and associatedWords
</requirements>
</step>

<step number="2" title="WRITE THE READING TEXT">
Create a reading passage of ${levelGuidance.readingLength} in exactly 5 paragraphs. This should spark discussion, not just be reading practice.

${levelGuidance.readingGuidance}

<requirements>
Include all 5 vocabulary words naturally, each appearing 2-3 times with context clues. Keep vocabulary density to about 1 new word per 25 words.
</requirements>
</step>

<step number="3" title="CREATE 5 VOCABULARY CHECK QUESTIONS">
Write exactly 5 questions testing vocabulary understanding (one per word). These test whether students know the vocabulary, NOT whether they remember facts from the reading.

<good_formats>
- "What does [word] mean?"
- "Which sentence uses [word] correctly?"
- "In which situation would you use [word]?"
</good_formats>

<avoid>
"According to the passage..." or "In the reading..." - these test reading recall, not vocabulary.
</avoid>

<critical>You MUST randomize the position of the correct answer for each question. Do not always place it in the same position (e.g., always B). Distribute correct answers randomly across A, B, C, and D.</critical>
</step>

<step number="4" title="DESIGN 3 SENTENCE FRAMES">
Create 3 sentence frames for practicing ideas about "${topic}". Each needs three tiers:
- emerging (simplest, maximum support)
- developing (moderate complexity)
- expanding (more sophisticated for confident students)

${levelGuidance.sentenceFrameGuidance}

<requirements>
Include 3 model responses per tier and teaching notes with modeling tips, guided practice, independent use guidance, and fading strategy.
${levelGuidance.needsLowerLevelScaffolding ? 'Include a "lowerLevelScaffolding" object with sentenceWorkshop, patternTrainer, and visualMaps.' : ''}
</requirements>
</step>

<step number="5" title="WRITE 5 DISCUSSION QUESTIONS">
Create 5 discussion questions about "${topic}". Each needs:
- paragraphContext (3-5 sentences at ${cefrLevel} level providing background)
- question (engaging, invites personal response)
- imagePrompt (50-80 words describing a related scene, ending with "No text visible")

${levelGuidance.discussionGuidance}

<requirements>
Make questions culturally inclusive and globally accessible.
</requirements>
</step>

<step number="6" title="ADD PRACTICE ACTIVITIES">
<activity name="cloze">
Cloze exercise: Create a fill-in-the-blank paragraph. It must contain exactly 5 blanks, one for each of the 5 vocabulary words. Use each vocabulary word from the word bank once.
<critical>The blanks must NOT appear in the same order as the vocabulary was taught. Randomize which vocabulary word appears in each blank position - for example, if vocabulary is taught as [word1, word2, word3, word4, word5], the blanks in the paragraph should use them in a different order like [word3, word1, word5, word2, word4].</critical>
Format blanks as [1:word], [2:word], etc. where the number is the blank position in the text (not the vocabulary order). The wordBank contains base forms; add grammatical endings after the bracket when needed (like "[1:challenge]s" for plural).
</activity>

<activity name="sentence_unscramble">
Sentence unscramble: Create 3 grammatically correct and natural-sounding sentences using lesson vocabulary. IMPORTANT: Sentences must sound like natural, idiomatic English that native speakers would actually say - avoid awkward literal translations.
<requirements>
For each sentence:
- First create the complete grammatically correct sentence and put it in "correctSentence"
- Then extract EXACTLY the words from that sentence (no more, no less) and put them in the "words" array in their original order
- The words array must contain every single word from the correctSentence and nothing else
- Include ALL words: articles (the/a/an), prepositions (in/on/at), pronouns (it/they/we), conjunctions (and/but/or), etc.
- Do NOT add extra words or omit any words from the sentence
</requirements>
</activity>
</step>

<step number="7" title="CREATE 5 QUIZ QUESTIONS">
Write 5 quiz questions about the lesson. Mix multiple choice and true/false.
<critical>For multiple choice, you MUST randomize the position of the correct answer. Do not use a fixed pattern.</critical>
<requirements>Include clear explanations for all answers.</requirements>
</step>

</instructions>

---

<validation>
BEFORE GENERATING:

Verify: 5 vocabulary words with all fields, 5 reading paragraphs, 5 comprehension questions (one per vocab word), 3 sentence frames with tiered scaffolding, 5 discussion questions with paragraphContext and imagePrompt, 5 quiz questions. All image prompts end with "No text visible". Same 5 vocabulary words in warmup.targetVocabulary and vocabulary section.
</validation>

---

<json_schema>
JSON STRUCTURE (showing format - generate complete content for all items):

{
  "title": "Engaging title about ${topic}",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Brief warm-up description",
      "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Step-by-step instructions",
      "teacherNotes": "Teaching tips"
    },
    {
      "type": "reading",
      "title": "Reading Text: [Title]",
      "introduction": "Brief setup",
      "paragraphs": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3...", "Paragraph 4...", "Paragraph 5..."],
      "teacherNotes": "How to approach the reading"
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "words": [
        {
          "term": "word",
          "partOfSpeech": "noun",
          "definition": "Clear, simple definition",
          "example": "Natural example sentence",
          "semanticGroup": "Category",
          "additionalExamples": ["Formal example", "Informal example", "Personal example"],
          "wordFamily": {"words": ["related1", "related2"], "description": "How they relate"},
          "collocations": ["phrase 1", "phrase 2", "phrase 3"],
          "usageNotes": "When and how to use",
          "teachingTips": "Teaching suggestions",
          "pronunciation": {"syllables": ["syl", "la", "bles"], "stressIndex": 1, "phoneticGuide": "SIL-uh-bulz"},
          "imagePrompt": "Scene description showing the word's meaning. Setting and characters. Actions and emotions. Realistic educational illustration, warm lighting. No text visible.",
          "semanticMap": {
            "synonyms": ["syn1", "syn2", "syn3"],
            "antonyms": ["ant1", "ant2"],
            "relatedConcepts": ["concept1", "concept2", "concept3"],
            "contexts": ["context1", "context2", "context3"],
            "associatedWords": ["assoc1", "assoc2", "assoc3"]
          }
        }
      ]
    },
    {
      "type": "comprehension",
      "title": "Vocabulary Check",
      "questions": [
        {
          "question": "What does 'word1' mean?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "The correct option",
          "correctAnswer": "The correct option",
          "explanation": "Explanation of why this is correct"
        }
      ]
    },
    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical",
      "title": "Language Practice for ${topic}",
      "introduction": "Practice expressing ideas about ${topic}.",
      "pedagogicalFrames": [
        {
          "languageFunction": "Communication purpose",
          "grammarFocus": ["grammar point 1", "grammar point 2"],
          "tieredFrames": {
            "emerging": {"frame": "Simple frame...", "description": "How to use"},
            "developing": {"frame": "Medium frame...", "description": "How to use"},
            "expanding": {"frame": "Complex frame...", "description": "How to use"}
          },
          "modelResponses": {
            "emerging": ["Example 1", "Example 2", "Example 3"],
            "developing": ["Example 1", "Example 2", "Example 3"],
            "expanding": ["Example 1", "Example 2", "Example 3"]
          },
          "teachingNotes": {
            "modelingTips": "How to demonstrate",
            "guidedPractice": "How to practice together",
            "independentUse": "How students use independently",
            "fadingStrategy": "How to reduce support"
          }
        }
      ]${levelGuidance.needsLowerLevelScaffolding ? `,
      "lowerLevelScaffolding": {
        "sentenceWorkshop": "Step-by-step guidance",
        "patternTrainer": "Repeated practice approach",
        "visualMaps": "Visual structure representations"
      }` : ''}
    },
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Paragraph with [1:word] format blanks. Add endings outside brackets like [2:work]ed.",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "How to use this exercise"
    },
    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {"words": ["scrambled", "words", "here"], "correctSentence": "Words here scrambled."},
        {"words": ["another", "scrambled", "sentence"], "correctSentence": "Another scrambled sentence."},
        {"words": ["third", "example", "sentence"], "correctSentence": "Third example sentence."}
      ],
      "teacherNotes": "How to approach this activity"
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "paragraphContext": "3-5 sentence context at ${cefrLevel} level providing background for the question.",
          "question": "Engaging discussion question inviting personal response?",
          "imagePrompt": "Scene description (50-80 words) showing the context. Setting, characters, actions, emotions. Realistic illustration, natural lighting. No text visible."
        }
      ]
    },
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {"question": "Quiz question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "The correct option", "correctAnswer": "The correct option", "explanation": "Why correct"},
        {"question": "True or false?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Why true"}
      ]
    }
  ]
}
</json_schema>

<final_instruction>
Generate complete content for ALL items: 5 vocabulary words, 5 paragraphs, 5 comprehension questions, 3 sentence frames, 5 discussion questions, 5 quiz questions.
</final_instruction>

BEGIN JSON:`;

    return prompt;
  }
  
  /**
   * Returns level-specific guidance for prompt construction
   */
  private getLevelGuidance(cefrLevel: string): {
    description: string;
    vocabularyGuidance: string;
    definitionGuidance: string;
    readingLength: string;
    readingGuidance: string;
    sentenceFrameGuidance: string;
    discussionGuidance: string;
    needsLowerLevelScaffolding: boolean;
  } {
    const guidance: Record<string, any> = {
      'A1': {
        description: 'Beginner',
        vocabularyGuidance: 'Select only basic, high-frequency words for daily survival and immediate personal needs. Avoid abstract or complex words.',
        definitionGuidance: 'use only the 500 most common words, under 8 words, present tense only',
        readingLength: '80-120 words',
        readingGuidance: 'Use very simple sentences of 6-8 words. Stick to present tense and simple past. Focus on concrete, observable things. Avoid idioms and abstract concepts.',
        sentenceFrameGuidance: 'Use simple present patterns like "I like ___" or "___ is ___". Focus on basic descriptions and preferences.',
        discussionGuidance: 'Ask about immediate personal experiences and basic preferences. Provide lots of concrete context. Keep questions answerable with simple sentences.',
        needsLowerLevelScaffolding: true
      },
      'A2': {
        description: 'Elementary',
        vocabularyGuidance: 'Choose words relating to personal experiences and simple social situations that students can connect to daily life.',
        definitionGuidance: 'use the top 1,000 words, under 10 words, present and simple past tense',
        readingLength: '100-150 words',
        readingGuidance: 'Use simple sentences of 8-10 words with basic connectors (and, but, because). Include simple past for experiences. Focus on relatable situations.',
        sentenceFrameGuidance: 'Use simple comparisons like "___ is more ___ than ___" and basic opinions like "I think ___ is ___".',
        discussionGuidance: 'Ask about personal experiences, simple comparisons, and basic opinions. Provide clear context.',
        needsLowerLevelScaffolding: true
      },
      'B1': {
        description: 'Intermediate',
        vocabularyGuidance: 'Select words for discussing practical problems, expressing opinions with reasons, and talking about lifestyle choices. Avoid highly academic vocabulary.',
        definitionGuidance: 'use A2 vocabulary plus common B1 words, under 12 words',
        readingLength: '120-180 words',
        readingGuidance: 'Use sentences of 10-12 words with connectors like because, so, although, however. Include opinions and reasons. Discuss practical topics.',
        sentenceFrameGuidance: 'Include opinion expressions with reasons like "I believe that ___ because ___" and cause-effect structures.',
        discussionGuidance: 'Ask questions requiring opinions with reasons. Students should discuss practical problems with some detail.',
        needsLowerLevelScaffolding: true
      },
      'B2': {
        description: 'Upper Intermediate',
        vocabularyGuidance: 'Choose vocabulary for academic discussions and professional contexts. Students should express complex ideas and evaluate perspectives.',
        definitionGuidance: 'use B1 vocabulary, focus on precision, under 15 words',
        readingLength: '150-220 words',
        readingGuidance: 'Use varied sentences of 12-15 words with sophisticated connectors. Include analytical content with multiple perspectives.',
        sentenceFrameGuidance: 'Include analytical structures, contrasting viewpoints like "While some argue ___, others believe ___", and hypothetical reasoning.',
        discussionGuidance: 'Ask analytical questions requiring evaluation and multiple perspectives. Minimal scaffolding needed.',
        needsLowerLevelScaffolding: false
      },
      'C1': {
        description: 'Advanced',
        vocabularyGuidance: 'Select sophisticated vocabulary for nuanced expression and complex argumentation with near-native precision.',
        definitionGuidance: 'use sophisticated vocabulary appropriately while maintaining clarity',
        readingLength: '180-250 words',
        readingGuidance: 'Use flexible sentence structures with sophisticated vocabulary. Include complex analysis and synthesis of ideas.',
        sentenceFrameGuidance: 'Use sophisticated analytical structures and nuanced argumentation. Focus on synthesizing ideas and building complex arguments.',
        discussionGuidance: 'Ask questions requiring sophisticated analysis and well-structured arguments on complex issues.',
        needsLowerLevelScaffolding: false
      },
      'C2': {
        description: 'Proficiency',
        vocabularyGuidance: 'Use the full range of advanced and specialized vocabulary. Students are developing mastery-level precision.',
        definitionGuidance: 'use precise academic vocabulary, prioritize nuance and accuracy',
        readingLength: '180-250 words',
        readingGuidance: 'Use expert-level language with subtle distinctions and nuanced expression reflecting native-speaker sophistication.',
        sentenceFrameGuidance: 'Use expert discourse patterns with critical evaluation and sophisticated synthesis structures.',
        discussionGuidance: 'Ask questions for expert-level discussion with nuanced argumentation demonstrating mastery-level abilities.',
        needsLowerLevelScaffolding: false
      }
    };
    
    return guidance[cefrLevel] || guidance['B1'];
  }
  
  /**
   * Validate and improve the generated content
   */
  private async validateAndImproveContent(content: any, params: LessonGenerateParams): Promise<any> {
    console.log('Skipping quality control validation - trusting Gemini 3 Pro for high-quality output');
    return content;
  }

  /**
   * Validate reading text paragraphs for grammar correctness using AI
   */
  private async validateReadingTextGrammar(paragraphs: string[], cefrLevel: string, topic: string): Promise<string[]> {
    try {
      const validationPrompt = `You are a grammar expert for ESL content. Review these paragraphs and fix any grammar errors while maintaining the meaning and ${cefrLevel} level.

CEFR LEVEL: ${cefrLevel}
TOPIC: ${topic}
PARAGRAPHS: ${JSON.stringify(paragraphs)}

Fix grammar issues like incorrect verb forms, subject-verb agreement, articles, prepositions, and word order. Preserve the meaning and vocabulary. Maintain bold formatting for vocabulary words.

Return ONLY a JSON array of corrected paragraphs.`;

      const result: AxiosResponse = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'google/gemini-3-pro-preview',
          messages: [{ role: 'user', content: validationPrompt }],
          temperature: 0.1,
          max_tokens: 3000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 30000
        }
      );

      const text = result.data.choices[0]?.message?.content;

      try {
        let cleanedContent = text.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
        }

        const validatedParagraphs = JSON.parse(cleanedContent);
        console.log('Successfully validated reading text grammar using AI');
        return Array.isArray(validatedParagraphs) ? validatedParagraphs : paragraphs;
      } catch (parseError) {
        console.error('Error parsing grammar validation response, using original paragraphs');
        return paragraphs;
      }
    } catch (error) {
      console.error('Error validating reading text grammar:', error);
      return paragraphs;
    }
  }

  /**
   * Validate sentence frame examples for logical coherence
   */
  private async validateSentenceFrameExamples(examples: any[], pattern: string, topic: string): Promise<any[]> {
    try {
      const validationPrompt = `You are a quality expert for ESL content. Review these sentence examples and ensure they correctly demonstrate the pattern while being logical and grammatically correct.

PATTERN: ${pattern}
TOPIC: ${topic}
EXAMPLES: ${JSON.stringify(examples)}

Ensure each example follows the exact pattern structure, makes logical sense, and uses correct grammar.

Return ONLY a JSON array of corrected examples.`;

      const result: AxiosResponse = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'google/gemini-3-pro-preview',
          messages: [{ role: 'user', content: validationPrompt }],
          temperature: 0.1,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 30000
        }
      );

      const text = result.data.choices[0]?.message?.content;

      try {
        let cleanedContent = text.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
        }

        const validatedExamples = JSON.parse(cleanedContent);
        console.log('Successfully validated sentence frame examples');
        return Array.isArray(validatedExamples) ? validatedExamples : examples;
      } catch (parseError) {
        console.error('Error parsing validation response, using original examples');
        return examples;
      }
    } catch (error) {
      console.error('Error validating sentence frame examples:', error);
      return examples;
    }
  }

  /**
   * Format and process the lesson content, adding images in parallel
   */
  private async formatLessonContent(content: any): Promise<any> {
    const lessonContent = {
      ...content,
      provider: 'openrouter'
    };
    
    if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
      console.log('Starting batched image generation for OpenRouter lesson...');
      
      const imageGenerationTasks: (() => Promise<void>)[] = [];
      
      for (const section of lessonContent.sections) {
        if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
          console.log(`Found ${section.words.length} vocabulary words, queueing image generation...`);
          for (const word of section.words) {
            if (!word.imagePrompt && word.term) {
              word.imagePrompt = `An illustration showing the meaning of "${word.term}" in a clear, educational way. No text visible in the image.`;
            }
            
            if (word.imagePrompt) {
              const task = async () => {
                try {
                  const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                  word.imageBase64 = await runwareService.generateImage(word.imagePrompt, requestId);
                  if (word.imageBase64) {
                    console.log(`Generated image for vocab: ${word.term}`);
                  }
                } catch (imgError) {
                  console.error(`Error generating image for vocab ${word.term}:`, imgError);
                  word.imageBase64 = null;
                }
              };
              imageGenerationTasks.push(task);
            } else {
              word.imageBase64 = null;
            }
          }
        }
        
        if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
          console.log(`Found ${section.questions.length} discussion questions, queueing image generation...`);
          for (const question of section.questions) {
            if (!question.paragraphContext && section.paragraphContext) {
              question.paragraphContext = section.paragraphContext;
            }
            if (!question.paragraphContext) {
              if (question.introduction?.includes('.') && !question.introduction?.includes('?')) {
                question.paragraphContext = question.introduction;
              } else if (question.context) {
                question.paragraphContext = question.context;
              } else if (question.paragraph) {
                question.paragraphContext = question.paragraph;
              }
            }
            
            if (!question.imagePrompt && question.question) {
              const contextSnippet = question.paragraphContext ? question.paragraphContext.substring(0, 150) : question.question;
              question.imagePrompt = `A realistic illustration showing a scenario related to: "${question.question.substring(0, 100)}". Scene includes people in a relatable situation. ${contextSnippet.includes('work') ? 'Professional setting' : contextSnippet.includes('school') || contextSnippet.includes('student') ? 'Educational environment' : contextSnippet.includes('family') || contextSnippet.includes('home') ? 'Home setting' : 'Contemporary setting'} with natural lighting. Realistic illustration, engaging composition. No text visible.`;
            }
            
            if (question.imagePrompt) {
              const task = async () => {
                try {
                  const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                  question.imageBase64 = await runwareService.generateImage(question.imagePrompt, requestId);
                  if (question.imageBase64) {
                    console.log(`Generated image for discussion question`);
                  }
                } catch (imgError) {
                  console.error(`Error generating discussion image:`, imgError);
                  question.imageBase64 = null;
                }
              };
              imageGenerationTasks.push(task);
            } else {
              question.imageBase64 = null;
            }
          }
        }
      }
      
      if (imageGenerationTasks.length > 0) {
        const batchSize = 10;
        const totalTasks = imageGenerationTasks.length;
        console.log(`Generating ${totalTasks} images in parallel batches of ${batchSize}...`);
        
        for (let i = 0; i < totalTasks; i += batchSize) {
          const batchFunctions = imageGenerationTasks.slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(totalTasks / batchSize);
          
          console.log(`Processing batch ${batchNum}/${totalBatches} (${batchFunctions.length} images)...`);
          
          await Promise.all(batchFunctions.map(fn => fn()));
          
          if (i + batchSize < totalTasks) {
            console.log(`Waiting 500ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log(`All ${totalTasks} images generated!`);
      }
      
      console.log('Finished image generation for OpenRouter lesson.');
    }
    
    return lessonContent;
  }
}

export const testOpenRouterConnection = async (): Promise<boolean> => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return false;
    }

    const testRequest = {
      model: 'google/gemini-3-pro-preview',
      messages: [{ role: 'user', content: 'Hello, can you respond with just "OK"?' }],
      max_tokens: 10
    };

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      testRequest,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://planwiseesl.com',
          'X-Title': 'PlanwiseESL'
        },
        timeout: 10000
      }
    );

    console.log('OpenRouter connection test successful');
    return true;
  } catch (error: any) {
    console.error('OpenRouter connection test failed:', error.response?.data || error.message);
    return false;
  }
};

export const openRouterService = new OpenRouterService(process.env.OPENROUTER_API_KEY || '');
