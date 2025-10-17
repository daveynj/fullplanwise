import axios, { AxiosResponse } from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { replicateFluxService } from './replicate-flux.service';

/**
 * Service for interacting with the Google Gemini AI API via OpenRouter
 */
export class GeminiService {
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
   * @param params Lesson generation parameters
   * @param studentVocabulary Optional array of previously learned vocabulary words
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams, studentVocabulary: string[] = []): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      console.log('Starting Gemini AI lesson generation...');
      
      // Create unique identifiers for this request (for logging purposes only)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      // Construct the prompt
      const prompt = this.constructLessonPrompt(params, studentVocabulary);
      
      // Configure the request for OpenRouter
      const requestData = {
        model: 'x-ai/grok-4-fast',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 16384, // Increased token count from 8192 to 16384 for more detailed lessons
      };

      console.log('Sending request to OpenRouter API (Grok-4 Fast)...');
      console.log('Request payload:', JSON.stringify(requestData, null, 2).substring(0, 300));

      try {
        // Make the request to OpenRouter
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
            timeout: 60000 // 60 second timeout for lesson generation
          }
        );

        console.log('Received response from OpenRouter');
        console.log('Response status:', response.status);
        
        // Check if response has expected structure
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
        
        console.log('Received response from Gemini API');
        
        try {
          // First, attempt to clean up the content and remove markdown code block markers
          let cleanedContent = text;
          
          // Check if content starts with ` and ends with ` which is common in Gemini responses
          if (text.trim().startsWith('`') && text.trim().endsWith('`')) {
            console.log('Detected markdown code block, cleaning content');
            cleanedContent = text.replace(/`\s*/g, '').replace(/`\s*$/g, '').trim();
          }
          
          // Clean responses that start with just "json" (without markdown)
          if (cleanedContent.trim().startsWith('json\n') || cleanedContent.trim().startsWith('json\r\n') || cleanedContent.trim().startsWith('json ')) {
            console.log('Detected "json" prefix, removing it');
            cleanedContent = cleanedContent.trim().replace(/^json\s*[\r\n\s]+/, '');
          }
          
          // Clean any other common AI response prefixes
          cleanedContent = cleanedContent.trim().replace(/^(Here's the|Here is the|The following is the)\s*[\w\s]*:?\s*[\r\n]*/, '');
          cleanedContent = cleanedContent.trim().replace(/^JSON\s*[\r\n]+/, '');
          
          // Clean leading/trailing quotes that sometimes wrap the entire JSON
          if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
            console.log('Removing wrapping quotes');
            cleanedContent = cleanedContent.slice(1, -1);
          }
          
          // Now try to parse the cleaned content
          try {
            const jsonContent = JSON.parse(cleanedContent);
            console.log('Successfully parsed JSON content');
            
            // Check if jsonContent has required structure
            if (jsonContent.title && jsonContent.sections && Array.isArray(jsonContent.sections)) {
              console.log('Lesson content has valid structure, applying quality control...');
              const validatedContent = await this.validateAndImproveContent(jsonContent, params);
              return await this.formatLessonContent(validatedContent);
            } else {
              // Log more detailed diagnostic information 
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
                provider: 'gemini',
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
            // If we fail to parse as JSON, try to fix common JSON errors first
            console.error('Error parsing Gemini response as JSON:', jsonError);
            
            // Log the first part of the text and position of error to help with debugging
            const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
            const errorPosition = errorMessage.match(/position (\d+)/)?.[1];
            
            const textPreview = errorPosition 
              ? `${cleanedContent.substring(Math.max(0, parseInt(errorPosition) - 50), parseInt(errorPosition))}[ERROR HERE]${cleanedContent.substring(parseInt(errorPosition), parseInt(errorPosition) + 50)}`
              : cleanedContent.substring(0, 200) + (cleanedContent.length > 200 ? '...' : '');
            
            console.warn('Response text around error:', textPreview);
            
            // Attempt to fix common JSON errors
            console.log('Attempting to fix common JSON formatting errors...');
            
            try {
              // Common JSON fixes
              let fixedContent = cleanedContent
                .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
                .replace(/,\s*\]/g, ']')          // Remove trailing commas in arrays
                .replace(/,(\s*["']?\s*[}\]])/g, '$1') // More aggressive trailing comma removal
                .replace(/([^\\])(\\)([^"\\\/bfnrtu])/g, '$1\\\\$3')  // Fix unescaped backslashes
                .replace(/([^\\])\\'/g, "$1'")    // Remove escaping from single quotes
                .replace(/\r?\n|\r/g, ' ')        // Replace newlines with spaces
                .replace(/"\s+([^"]*)\s+"/g, '"$1"') // Fix spaces in JSON keys
                .replace(/(['"])([\w]+)(['"]):/g, '"$2":') // Ensure property names use double quotes
                .replace(/,\s*,/g, ',')           // Fix double commas
                .replace(/"\s*"([^"]*)\s*"/g, '"$1"') // Fix broken quoted strings
                .replace(/,\s*"([^"]*)",\s*"can\s+lea/g, '", "can lea'); // Fix the specific error pattern from logs
                
              // Handle other common errors
              let inString = false;
              let escaped = false;
              let fixedChars = [];
              
              for (let i = 0; i < fixedContent.length; i++) {
                const char = fixedContent[i];
                
                if (escaped) {
                  // Handle escaped characters
                  escaped = false;
                  fixedChars.push(char);
                } else if (char === '\\') {
                  escaped = true;
                  fixedChars.push(char);
                } else if (char === '"') {
                  inString = !inString;
                  fixedChars.push(char);
                } else if (!inString && (char === ' ' || char === '\t' || char === '\n' || char === '\r')) {
                  // Skip extra whitespace outside strings
                  continue;
                } else {
                  fixedChars.push(char);
                }
              }
              
              // Create final fixed content
              const finalFixedContent = fixedChars.join('');
              
              // Try parsing again with fixed content
              const jsonContent = JSON.parse(finalFixedContent);
              console.log('Successfully parsed JSON after applying fixes!');
              
              // Validate structure after fixing
              if (jsonContent.title && jsonContent.sections && Array.isArray(jsonContent.sections)) {
                console.log('Fixed content has valid structure, applying quality control...');
                const validatedContent = await this.validateAndImproveContent(jsonContent, params);
                return await this.formatLessonContent(validatedContent);
              } else {
                throw new Error('Fixed JSON still missing required structure');
              }
            } catch (fixError) {
              console.error('Error parsing even after fixes:', fixError);
              
              // If still failing, throw error to trigger fallback
              throw new Error(`JSON parsing failed even after attempted fixes: ${errorMessage}`);
            }
          }
        } catch (error) {
          console.error('Unexpected error processing Gemini response:', error);
          // Propagate the error to trigger fallback
          throw new Error(`Error processing Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error: any) {
        // Enhanced error logging for axios errors
        if (error.response) {
          // The request was made and the server responded with a status code outside 2xx
          console.error('❌ OpenRouter API Error Response:');
          console.error('Status:', error.response.status);
          console.error('Status Text:', error.response.statusText);
          console.error('Headers:', JSON.stringify(error.response.headers, null, 2).substring(0, 500));
          console.error('Response Data Type:', typeof error.response.data);
          console.error('Response Data Preview:', JSON.stringify(error.response.data).substring(0, 500));
          
          // Check if it's an authentication error
          if (error.response.status === 401 || error.response.status === 403) {
            console.error('⚠️ AUTHENTICATION ERROR - Check OPENROUTER_API_KEY');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('❌ No response received from OpenRouter API');
          console.error('Request URL:', error.config?.url);
          console.error('Request Method:', error.config?.method);
        } else {
          // Something happened in setting up the request
          console.error('❌ Error setting up request:', error.message);
        }
        
        console.error('Error during Gemini API request:', error.message);
        
        // Determine if this is a content policy error
        const isPolicyError = error.message && (
          error.message.includes('content policy') || 
          error.message.includes('SAFETY') || 
          error.message.includes('blocked') ||
          error.message.includes('not appropriate')
        );
        
        // For policy errors, return error object; otherwise propagate to trigger fallback
        if (isPolicyError) {
          return {
            title: `Lesson on ${params.topic}`,
            error: error.message,
            provider: 'gemini',
            sections: [
              {
                type: "error",
                title: "Content Policy Restriction",
                content: "The topic may contain sensitive content that cannot be processed. Please try a different topic."
              }
            ]
          };
        } else {
          // For technical errors, throw to trigger fallback
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error in GeminiService.generateLesson:', error.message);
      throw error;
    }
  }
  
  /**
   * Constructs a structured prompt for the Gemini AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams, studentVocabulary: string[] = []): string {
    const { cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // We'll set some variables to match what the system prompt expects
    const targetLevel = cefrLevel;
    const text = topic;
    const minVocabCount = 5;
    const maxVocabCount = 5;
    
    // Build vocabulary instruction
    const vocabularyInstruction = studentVocabulary.length > 0 
      ? `\n\n🎯 STUDENT VOCABULARY HISTORY:
This student has already learned the following vocabulary words in previous lessons:
${studentVocabulary.join(', ')}

IMPORTANT INSTRUCTIONS:
✅ DO: Use these words FREELY throughout the lesson (reading texts, discussion questions, comprehension questions, etc.) since the student knows them and this provides valuable reinforcement and natural usage examples.

❌ DON'T: Include these words as the FOCUS VOCABULARY words for this lesson - they've already been taught.

Instead, choose NEW vocabulary words that:
- Build upon their existing knowledge
- Are appropriately challenging for ${params.cefrLevel} level
- Are relevant to the topic "${params.topic}"
- Help the student progress in their language learning journey

Think of it this way: The student's learned vocabulary is their toolkit - use it naturally in the lesson content to help them understand and engage with the material, but teach them NEW words to expand their toolkit.`
      : '';
    
    // System instruction part
    const systemInstruction = `You are an expert ESL teacher creating an engaging, interactive lesson on "${params.topic}" for ${params.cefrLevel} students. You have a full knowledge of the Cambride Eglish Vocabulary Profile.

## 🚨 OUTPUT FORMAT (CRITICAL)

Your response MUST be:
1. **Valid JSON only** - Start with { and end with }
2. **No markdown** - No \`\`\`json wrappers or explanatory text
3. **Complete arrays** - Never use counts (❌ "paragraphs": 5) - always full content (✅ "paragraphs": ["text...", "text..."])
4. **Proper structure** - All sections complete with actual content, not placeholders

✅ Correct: {"title": "Lesson Title", "sections": [...]}
❌ Wrong: \`\`\`json {"title": "..."}\`\`\` or Here's your lesson: {...}

## EDGE CASES

${vocabularyInstruction}

${params.targetVocabulary ? `**Required Vocabulary:** You MUST include these words: ${params.targetVocabulary}` : ''}

**Warm-up Guidelines:**
- Never reference pictures/images in warm-up activities
- Questions activate prior knowledge about "${params.topic}"
- Focus on personal experience and universal concepts
- Prepare students for vocabulary and reading content

**Pronunciation Format:**
Each vocabulary word needs: syllables array, stressIndex number, phoneticGuide string
- Use English letters and hyphens only (e.g., "AS-tro-naut" or "eks-PLOR-ay-shun")
- NO IPA symbols

## CONTENT STANDARDS

**Writing Style:**
- Use natural, engaging language appropriate for ${params.cefrLevel}
- Balance authenticity with accessibility
- Avoid textbook language - model native-like expression
- Vary sentence structures and maintain consistent voice
- Create genuine interest through vivid, specific details

**Level-Appropriate Content:**
- Vocabulary matches ${params.cefrLevel} (not taught at lower levels)
- Question complexity fits cognitive level
- Conceptual approach matches ${params.cefrLevel} capabilities
- Grammar aligns with level (A1: present simple, B1+: conditionals, etc.)

**Question Quality:**
- Discussion: Elicit more than yes/no; build on lesson concepts; encourage critical thinking
- Comprehension: Test genuine understanding; progress from literal to applied; avoid ambiguity

## 🚨 KEY REQUIREMENTS

**Reading Text:** Must contain EXACTLY 5 paragraphs in the "paragraphs" array. Each paragraph complete with multiple sentences (A1: 2-3, B1: 3-4, C1: 4-5 sentences). All 5 paragraphs form one cohesive reading passage.

**Discussion Questions:** Each question MUST have its own paragraphContext field (3-5 sentences) providing background information at appropriate ${params.cefrLevel} level, leading naturally into the question.

**Image Prompts:**
Create 50-80 word scenario-based prompts showing the situation being discussed.

Formula: "[Scenario from paragraphContext]. [Characters in situation]. [Action embodying the question]. [Environmental/emotional context]. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

Example: "Modern apartment at evening. Professional at laptop with work documents, family photos nearby untouched. Person looking thoughtfully between work screen and personal items, showing tension between responsibilities. Warm lighting contrasting work and personal space. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

---

## SEQUENTIAL WORKFLOW

### STEP 1: Foundation Analysis

Analyze "${params.topic}" for ${params.cefrLevel} students:

**Cognitive Focus:**
${params.cefrLevel === 'A1' ? 'Concrete, observable aspects students can directly experience' : params.cefrLevel === 'A2' ? 'Personal experiences and simple social interactions' : params.cefrLevel === 'B1' ? 'Practical problems affecting daily life' : params.cefrLevel === 'B2' ? 'Abstract concepts requiring analysis' : params.cefrLevel === 'C1' ? 'Sophisticated concepts requiring synthesis' : 'Expert-level analysis with nuanced understanding'}

**Vocabulary Base:**
${params.cefrLevel === 'A1' ? 'Top 1,000 basic daily words' : params.cefrLevel === 'A2' ? 'Top 2,000 personal experience words' : params.cefrLevel === 'B1' ? 'Top 3,000 functional words' : params.cefrLevel === 'B2' ? '3,000+ academic/professional words' : params.cefrLevel === 'C1' ? '5,000+ advanced words' : 'Expert-level specialized terminology'}

**Topic Approach:**
${params.cefrLevel === 'A1' ? 'Basic descriptions and immediate needs' : params.cefrLevel === 'A2' ? 'Personal experiences and simple opinions' : params.cefrLevel === 'B1' ? 'Practical applications and problem-solving' : params.cefrLevel === 'B2' ? 'Analytical discussion and evaluation' : params.cefrLevel === 'C1' ? 'Sophisticated analysis and synthesis' : 'Expert-level discourse and critical evaluation'}

→ After analyzing the foundation, proceed to vocabulary selection.

### STEP 2: Vocabulary Selection

🚨 **USE CAMBRIDGE ENGLISH VOCABULARY PROFILE (EVP) STANDARDS**

Select vocabulary using Cambridge EVP for ${params.cefrLevel}. Verify each word meets EVP standards:

**${params.cefrLevel} EVP Standards examples:**
${params.cefrLevel === 'A1' ? `- Cambridge A1 list: happy, work, eat, go, friend, time, help, need
- Avoid B1+: challenge, opportunity, achieve, develop
- Context: Basic daily needs and personal information` : params.cefrLevel === 'A2' ? `- Cambridge A2 list: prefer, remember, decide, enjoy, worry, invite
- Avoid B2+: evaluate, analyze, implement, demonstrate
- Context: Personal experiences and simple social situations` : params.cefrLevel === 'B1' ? `- Cambridge B1 list: challenge, opportunity, achieve, compare, improve, affect
- Avoid B2/C1: synthesize, contemplate, facilitate, cultivate
- Context: Practical problem-solving and expressing opinions with reasons` : params.cefrLevel === 'B2' ? `- Cambridge B2 list: analyze, evaluate, substantial, compelling, implement, diverse
- Avoid C1/C2: elucidate, juxtapose, paradigm, ubiquitous
- Context: Academic discussion and professional contexts` : params.cefrLevel === 'C1' ? `- Cambridge C1 list: elucidate, nuanced, paradigm, multifaceted, inherent, intrinsic
- Context: Sophisticated analysis and expert-level discussion` : `- Cambridge C2 list: ubiquitous, ephemeral, quintessential, conundrum, propensity
- Context: Complete mastery of English vocabulary`}

**EVP Checklist (verify each word):**
✓ Appears in Cambridge EVP at ${params.cefrLevel} or below
✓ NOT from higher CEFR level
✓ Serves genuine communicative function
✓ Similar words from lower levels already known

**🚨 SELF-CHECK BEFORE PROCEEDING:**
Before finalizing your vocabulary selection, CONFIRM EACH WORD against EVP criteria:
1. For each candidate word, verify it meets ${params.cefrLevel} EVP standards
2. Check it's NOT from a higher CEFR level (e.g., if ${params.cefrLevel}, avoid ${params.cefrLevel === 'A1' ? 'A2+' : params.cefrLevel === 'A2' ? 'B1+' : params.cefrLevel === 'B1' ? 'B2+' : params.cefrLevel === 'B2' ? 'C1+' : 'C2+'} words)
3. Confirm it serves a genuine communicative need for "${params.topic}"
4. Ensure it can be defined using vocabulary 2+ levels below
Only proceed with words that pass ALL checks.

**Vocabulary Structure (all fields required):**
Each word needs: term, partOfSpeech, coreDefinition (using vocab 2+ levels below), simpleExplanation (2-3 sentences), contextualMeaning (relates to "${params.topic}"), levelAppropriateExample, commonCollocations (3 items), additionalExamples (formal/informal/personal - 3 items), definition (legacy), example (legacy), wordFamily {words, description}, collocations (3 items), usageNotes, pronunciation {syllables, stressIndex, phoneticGuide}, imagePrompt, semanticMap {synonyms, antonyms, relatedConcepts, contexts, associatedWords}

**Definition Standards:**
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' ? `Use top ${params.cefrLevel === 'A1' ? '500' : '1,000'} words, max ${params.cefrLevel === 'A1' ? '8' : '10'} words, present tense, concrete examples` : params.cefrLevel === 'B1' ? `Use A2 vocab + common B1 words, max 12 words` : params.cefrLevel === 'B2' ? `Use B1 vocab, max 15 words, focus on precision` : `Use sophisticated vocab appropriately, maintain clarity`}

**Integration Requirements:**
- Each word appears in reading with 2-3 context clues
- Max 1 new word per 25 words of text
- Words spaced throughout, not clustered

**Vocabulary Image Prompts:**
40-80 words showing word meaning in context of "${params.topic}". Include: specific setting, character(s) showing the concept, action/state, context clues, mood. End with: "Realistic educational illustration, warm natural lighting, clear focal point. No text visible."

SELECT EXACTLY 5 VOCABULARY WORDS meeting all criteria above.

→ After selecting vocabulary, integrate them into the reading text.

### STEP 3: Reading Text Development

**Purpose:** Create a conversation catalyst for speaking practice about "${params.topic}".

**Requirements:**
- ${params.cefrLevel === 'A1' ? '80-120 words' : params.cefrLevel === 'A2' ? '100-150 words' : params.cefrLevel === 'B1' ? '120-180 words' : params.cefrLevel === 'B2' ? '150-220 words' : '180-250 words'} total length
- Each vocabulary word appears 2-3 times with context clues
- Begin with familiar vocabulary, progress through connected ideas
- Include concrete examples and relatable scenarios
- End connecting to students' experiences

**Vocabulary Integration:**
- First appearance: context supports understanding
- Subsequent uses: show different usage patterns
- Include 1-2 related words/synonyms
- Max 1 new word per 25 words

**Contextual Support:**
- Surrounding sentences support vocabulary comprehension
- Use appropriate signal words and transitions for ${params.cefrLevel}
- Balance new vocabulary with familiar language
- ${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' ? `Simple sentences, ${params.cefrLevel === 'A1' ? '6-8' : '8-10'} words average` : params.cefrLevel === 'B1' ? '10-12 words per sentence average, use because/so/although' : params.cefrLevel === 'B2' ? '12-15 words per sentence average, complex connectors' : 'Flexible length with sophisticated structures'}

**Validation:**
✓ Students can infer vocabulary from context
✓ Each paragraph contributes to understanding
✓ Sentence structures varied but appropriate
✓ Text creates discussion opportunities

**🚨 SELF-CHECK - Reading Text:**
Before proceeding, verify your reading text meets ALL requirements:
1. Word count: ${params.cefrLevel === 'A1' ? '80-120' : params.cefrLevel === 'A2' ? '100-150' : params.cefrLevel === 'B1' ? '120-180' : params.cefrLevel === 'B2' ? '150-220' : '180-250'} words total
2. Each of the 5 vocabulary words appears 2-3 times with context clues
3. Vocabulary density: maximum 1 new word per 25 words
4. Sentence complexity appropriate for ${params.cefrLevel} (${params.cefrLevel === 'A1' ? '6-8' : params.cefrLevel === 'A2' ? '8-10' : params.cefrLevel === 'B1' ? '10-12' : params.cefrLevel === 'B2' ? '12-15' : 'flexible'} words average)
5. Text creates natural opportunities for discussion
6. All vocabulary is contextually supported for student comprehension
Only proceed if ALL checks pass.

→ After creating the reading text, design comprehension questions.

### STEP 4: Comprehension Questions

Create 3-5 questions testing understanding of the reading:

**Approach:**
- Assess understanding at appropriate depth for ${params.cefrLevel}
- Progress from literal to interpretive to applied understanding
- Test genuine comprehension, not word recognition
- Use question formats appropriate for ${params.cefrLevel}
- Avoid ambiguity

**🚨 SELF-CHECK - Comprehension Questions:**
Before proceeding, verify your comprehension questions meet ALL requirements:
1. Created 3-5 questions (confirm exact count)
2. Questions progress from literal → interpretive → applied understanding
3. Cognitive depth appropriate for ${params.cefrLevel} (not too simple/complex)
4. Questions test comprehension, not just word recognition
5. All questions are clear, unambiguous, and answerable from the reading
6. Variety of question types used (not all the same format)
Only proceed if ALL checks pass.

→ After creating comprehension questions, design sentence frames.

### STEP 5: Sentence Frames

🚨 **CEFR-SPECIFIC FRAMES REQUIRED**

Generate 3 pedagogical sentence frames for ${params.cefrLevel} students discussing "${params.topic}". Each frame needs tiered scaffolding (emerging/developing/expanding) matching ${params.cefrLevel} capabilities.

**Level-Specific Frames:**
${params.cefrLevel === 'A1' ? 'A1: Simple present ("___ is ___", "I like ___"), basic connectors, simple reasoning. Functions: Describing, expressing preferences.' : params.cefrLevel === 'A2' ? 'A2: Simple past/present, basic comparisons ("___ is more ___ than ___"), opinions with reasons. Functions: Comparing, describing experiences.' : params.cefrLevel === 'B1' ? 'B1: Opinions ("I believe that ___"), cause-effect, arguments with justification. Functions: Arguing, justifying, discussing advantages/disadvantages.' : params.cefrLevel === 'B2' ? 'B2: Analytical statements, contrasting viewpoints, hypothetical reasoning. Functions: Analyzing, evaluating, hypothesizing.' : params.cefrLevel === 'C1' ? 'C1: Sophisticated analysis, nuanced arguments, complex reasoning. Functions: Synthesizing, critiquing, complex arguments.' : 'C2: Expert discourse, critical evaluation, sophisticated synthesis. Functions: Expert analysis, nuanced debate.'}

**Frame Requirements:**
- Relate directly to "${params.topic}"
- Include tiered scaffolding: emerging/developing/expanding
- Model responses demonstrate natural ${params.cefrLevel} usage
- Teaching notes provide I Do / We Do / You Do guidance
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? `- MUST include "lowerLevelScaffolding" with sentenceWorkshop, patternTrainer, visualMaps` : `- Do NOT include lowerLevelScaffolding for ${params.cefrLevel}`}

**🚨 SELF-CHECK - Sentence Frames:**
Before proceeding, verify your sentence frames meet ALL requirements:
1. Created exactly 3 sentence frames related to "${params.topic}"
2. Each frame has tiered scaffolding: emerging/developing/expanding
3. Model responses demonstrate natural ${params.cefrLevel} language use
4. Teaching notes include I Do / We Do / You Do guidance
5. ${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? `"lowerLevelScaffolding" object present with sentenceWorkshop, patternTrainer, visualMaps` : `NO "lowerLevelScaffolding" included (not needed for ${params.cefrLevel})`}
6. Frames are practical and usable for real classroom discussion
Only proceed if ALL checks pass.

→ After creating sentence frames, build discussion questions.

### STEP 6: Discussion Questions

**Cognitive Abilities for ${params.cefrLevel}:**
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' ? `${params.cefrLevel === 'A1' ? 'Immediate personal experiences, basic preferences, concrete situations' : 'Personal experiences, simple comparisons, basic problem-solving'}. Provide concrete context, use familiar vocabulary, focus on accessible experiences.` : params.cefrLevel === 'B1' ? 'Express opinions with reasons, practical problems, lifestyle choices. Provide some context, allow independent thinking, include reason-giving opportunities.' : params.cefrLevel === 'B2' ? 'Analytical discussions, abstract concepts, multiple perspectives. Minimal scaffolding, open-ended questions requiring evaluation.' : params.cefrLevel === 'C1' || params.cefrLevel === 'C2' ? `${params.cefrLevel === 'C1' ? 'Sophisticated analysis, complex issues, well-structured arguments' : 'Expert-level discussions, nuanced argumentation, interdisciplinary topics'}. Minimal scaffolding, focus on synthesis and critical thinking.` : ''}

**Question Tone:**
${params.cefrLevel === 'C1' || params.cefrLevel === 'C2' ? 'Use direct, conversational language. Avoid verbose academic phrasing.' : 'Keep questions clear and appropriate for ${params.cefrLevel} level.'}

**Warm-up Requirements:**
- Questions MUST be directly related to "${params.topic}"
- Include clear context (self-contained, understandable without lesson text)
- NOT generic - specifically about "${params.topic}"
- Culturally inclusive and globally accessible

**🚨 SELF-CHECK - Discussion Questions:**
Before proceeding, verify your discussion questions meet ALL requirements:
1. Created exactly 5 discussion questions
2. Each question has paragraphContext (3-5 sentences providing context)
3. Each question has an imagePrompt (50-80 words, detailed, ends with "No text visible")
4. Cognitive level appropriate for ${params.cefrLevel} (${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' ? 'personal experiences, concrete situations' : params.cefrLevel === 'B1' ? 'opinions with reasons, practical problems' : 'analytical thinking, abstract concepts'})
5. Questions are engaging and culturally inclusive
6. All paragraphContext sections are unique and self-contained
Only proceed if ALL checks pass.

→ After creating discussion questions, validate integration.

### STEP 7: Integration & Validation

**🚨 COMPREHENSIVE FINAL SELF-CHECK:**

Before generating the JSON, perform this complete validation:

**A. Content Quality:**
✓ Vocabulary appears in reading with context clues (2-3 times each)
✓ Definitions use vocab 2+ levels below
✓ Reading creates discussion opportunities
✓ Questions connect to reading and vocabulary
✓ Sentence frames use lesson vocabulary
✓ All components match ${params.cefrLevel} level
✓ Natural, cohesive lesson flow

**B. Structural Requirements:**
✓ Exactly 5 vocabulary words with ALL fields (pronunciation, semanticMap, imagePrompt, etc.)
✓ Reading has exactly 5 paragraphs
✓ Comprehension has 3-5 questions
✓ Sentence frames has exactly 3 frames with tiered scaffolding
✓ ${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? 'lowerLevelScaffolding present in sentence frames' : 'NO lowerLevelScaffolding in sentence frames'}
✓ Discussion has exactly 5 questions with paragraphContext (3-5 sentences each)
✓ Quiz has exactly 5 questions
✓ Grammar Spotlight includes logicExplanation and visual elements

**C. JSON Format:**
✓ Valid JSON structure (no syntax errors)
✓ All required fields present
✓ No placeholder text (e.g., "Complete...", "Example...")
✓ All imagePrompts end with "No text visible"
✓ pronunciation objects have syllables, stressIndex, phoneticGuide

**D. Cross-Section Consistency:**
✓ Same 5 vocabulary words in warmup.targetVocabulary and vocabulary section
✓ Vocabulary integrated naturally throughout reading text
✓ Grammar Spotlight uses lesson vocabulary in examples when possible
✓ All sections relate cohesively to "${params.topic}"

**Warm-up Clarification:**
targetVocabulary field contains the same 5 words from vocabulary section (preview before formal introduction).

Only proceed to generate JSON if ALL checks pass. FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders.

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
          "imagePrompt": "An illustration showing the meaning of word1 clearly. No text visible.",
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
          "imagePrompt": "An illustration showing the meaning of word2 clearly. No text visible.",
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
          "imagePrompt": "An illustration showing the meaning of word3 clearly. No text visible.",
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
          "imagePrompt": "An illustration showing the meaning of word4 clearly. No text visible.",
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
          "imagePrompt": "An illustration showing the meaning of word5 clearly. No text visible.",
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
    // PEDAGOGICAL SENTENCE FRAMES (v2) - Generate 3 complete frames
    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical", 
      "title": "Language Practice for ${params.topic}",
      "introduction": "Practice expressing ideas about ${params.topic} with these sentence patterns designed for ${params.cefrLevel} students.",
      "pedagogicalFrames": [
        {
          "languageFunction": "Communication purpose...",
          "grammarFocus": ["grammar1", "grammar2"],
          "tieredFrames": {
            "emerging": {"frame": "Complete frame...", "description": "How to use..."},
            "developing": {"frame": "Complete frame...", "description": "How to use..."},
            "expanding": {"frame": "Complete frame...", "description": "How to use..."}
          },
          "modelResponses": {
            "emerging": ["Example 1...", "Example 2...", "Example 3..."],
            "developing": ["Example 1...", "Example 2...", "Example 3..."],
            "expanding": ["Example 1...", "Example 2...", "Example 3..."]
          },
          "teachingNotes": {
            "modelingTips": "Complete tips...",
            "guidedPractice": "Complete practice...",
            "independentUse": "Complete guidance...",
            "fadingStrategy": "Complete strategy..."
          }
        }
        // Generate 2 more frames following the same structure (3 total frames required)
      ]
    },
    // CLOZE SECTION (Complete - Fill in the Blanks)
    // 🚨 SELF-CHECK: Before finalizing, verify: (1) Gaps target key vocabulary/grammar appropriately, (2) WordBank contains all correct answers, (3) Text makes sense when read and is grammatically correct with blanks filled, (4) Difficulty matches ${params.cefrLevel}, (5) Format is [1:word], [2:word], etc, (6) if the anser is singular but the sentence requires a plural add the correct pluralizer to the sentence after the relevent gap etc.
    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Complete paragraph with blanks, using [1:word] format for the first blank, [2:word] for the second, etc. Use appropriate vocabulary from the lesson...",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "Complete notes on how to use this exercise effectively..."
    },
    // SENTENCE UNSCRAMBLE SECTION (Complete - Word Ordering)
    // 🚨 SELF-CHECK: Before finalizing, verify: (1) All correctSentence values are grammatically perfect, (2) Scrambled words match the correct sentence exactly, (3) Sentences use lesson vocabulary, (4) Difficulty appropriate for ${params.cefrLevel}
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
    // 🚨 SELF-CHECK: Before finalizing, verify: (1) Exactly 5 questions created, (2) Variety of question types (multiple choice, true/false), (3) All options grammatically perfect, (4) Correct answers clearly match one option, (5) Explanations are clear and educational, (6) Difficulty appropriate for ${params.cefrLevel}
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
    "grammarType": "Choose the most useful grammar pattern for ${params.cefrLevel} students studying ${params.topic}. For A1-A2: simple_present, simple_past, articles, basic_modals. For B1-B2: present_perfect, modal_verbs, conditionals_basic, relative_clauses. For C1-C2: conditionals_advanced, passive_voice, reported_speech. Select based on what helps students discuss ${params.topic} effectively.",
    
    "title": "Create an engaging title that explains the grammar's communication purpose, like 'Modal Verbs: Expressing Possibility' or 'Present Perfect: Connecting Past to Present'",
    
    "description": "Explain in simple terms why this grammar pattern helps students communicate better when discussing ${params.topic}",

    "logicExplanation": {
      "communicationNeed": "Explain why this grammar pattern exists and what communication problem it solves for people discussing ${params.topic}",
      
      "logicalSolution": "Explain how this grammar pattern works logically to solve that communication need",
      
      "usagePattern": "Explain when students should use this grammar pattern when talking about ${params.topic}",
      
      "communicationImpact": "Explain what difference using this grammar makes in how students can express ideas about ${params.topic}"
    },

    "teachingTips": [
      "[Practical classroom tip: How should teachers introduce this concept? - e.g., 'Start with the communication need: Why do we need this grammar? Then show the logical solution']",
      "[Common student confusion: What do students typically misunderstand? - e.g., 'Students often memorize rules without understanding purpose - focus on meaning first, then form']",
      "[Teaching sequence: What order works best? - e.g., '1) Explain need → 2) Show logic → 3) Practice examples → 4) Apply in context']"
    ],
    
    "examples": [
      {
        "sentence": "Write a clear example sentence about ${params.topic} that demonstrates this grammar pattern at ${params.cefrLevel} level",
        "highlighted": "Copy the exact sentence above, but put ** around the specific grammar elements you're teaching (e.g., **modal verb**, **perfect tense**, etc.)",
        "explanation": "Explain simply why the highlighted grammar words work this way and what they accomplish in communication"
      },
      {
        "sentence": "Write a second example sentence about ${params.topic} using the same grammar pattern but in a different context",
        "highlighted": "Copy this second sentence, putting ** around the same type of grammar elements as in the first example", 
        "explanation": "Explain how this second example reinforces the same grammar pattern and helps students recognize it"
      }
    ],
    
    "visualSteps": [
      {
        "stepNumber": 1,
        "instruction": "[What students should understand about this grammar pattern - focus on meaning and use, not just form]",
        "visualElements": {
          "type": "pattern_recognition",
          "elements": "[Describe the key components students should identify - e.g., 'Notice the helping verb + main verb structure' or 'Look for the time connection words']"
        }
      },
      {
        "stepNumber": 2,
        "instruction": "[How students can practice and use this pattern effectively]",
        "visualElements": {
          "type": "application",
          "guidance": "[Practical advice for using this grammar in speaking/writing - e.g., 'Use this pattern when you want to express uncertainty' or 'This helps you talk about experiences without specific times']"
        }
      },
      {
        "stepNumber": 3,
        "instruction": "[Common mistakes to avoid and tips for success]",
        "visualElements": {
          "type": "tips",
          "commonMistakes": "[List 2-3 typical errors students make with this grammar]",
          "successTips": "[Give 2-3 practical tips for using this grammar correctly]"
        }
      }
    ],
    
    "visualLayout": {
      "recommendedType": "[Choose the BEST visual approach for this grammar type:
      - 'certainty_scale' for modal verbs (showing levels of certainty/possibility)
      - 'timeline_bridge' for tenses that connect time periods (present perfect, past perfect)
      - 'decision_tree' for articles and conditionals (showing choice logic)
      - 'transformation_flow' for passive voice and complex structures
      - 'comparison_table' for comparatives and contrasting structures
      - 'process_steps' for step-by-step grammar construction]",
      
      "primaryColor": "[Choose a color that fits the grammar type: 'blue' for certainty/modals, 'green' for time/tenses, 'purple' for relationships, 'orange' for actions, 'teal' for comparisons]",
      
      "pedagogicalApproach": {
        "learningObjective": "[What should students be able to DO after learning this grammar? - e.g., 'Express different levels of certainty about future events' or 'Talk about past experiences that affect the present']",
        "practiceActivities": [
          "[Suggest a simple practice activity students can do - e.g., 'Create sentences about your own experiences using this pattern']",
          "[Suggest a communicative activity - e.g., 'Ask classmates questions using these modal verbs']"
        ],
        "realWorldApplication": "[Explain when students will use this grammar in actual conversation or writing - be specific about situations]"
      },
      
      "adaptiveFeatures": {
        "levelAdjustment": "[How this lesson adjusts for ${cefrLevel} level - what makes it appropriate for these students?]",
        "scaffolding": "[What support structures help students understand this grammar? - e.g., 'Color-coding helps identify pattern parts' or 'Step-by-step building reduces complexity']",
        "extension": "[How advanced students can take this further - suggest more complex applications]"
      }
    },
    
    "interactiveFeatures": {
      "hasVisualDiagram": true,
      "dynamicContent": true,
      "adaptiveToLessonTopic": true,
      "aiGeneratedExamples": true,
      "pedagogicallyOptimized": true
    }
  }
}

**CRITICAL GRAMMAR SPOTLIGHT INSTRUCTIONS:**

The Grammar Spotlight should use strategic grammar selection and pedagogically-optimized examples to provide maximum educational value for ${cefrLevel} level students studying "${topic}".

**KEY PRINCIPLES:**
1. **Strategic Selection**: Choose grammar that students at this level need to learn
2. **Topic Integration**: Connect grammar naturally to the lesson topic when possible
3. **Pedagogical Excellence**: Create examples designed for teaching, not just extracted from text
4. **Clear Communication**: Focus on helping students express their ideas effectively
5. **Practical Application**: Show students when and how to use this grammar in real communication

**🚨 SELF-CHECK - Grammar Spotlight:**
Before finalizing, verify your Grammar Spotlight meets ALL requirements:
1. Grammar type is appropriate for ${params.cefrLevel} (not too simple/complex)
2. Examples use vocabulary from THIS lesson when possible
3. logicExplanation clearly explains WHY this grammar exists and HOW it works
4. Visual elements match the grammar type (e.g., timeline for tenses, scale for modals)
5. Teaching tips are practical and actionable for classroom use
6. All examples demonstrate the grammar pattern clearly with highlighted elements
Only proceed if ALL checks pass.

🚨 FINAL REMINDER - OUTPUT FORMAT 🚨

Your response MUST be:
✅ ONLY valid JSON (no text before or after)
✅ Starting with { and ending with }
✅ No markdown code blocks or formatting
✅ No explanatory text or commentary
✅ Parseable directly as JSON without any preprocessing

WRONG EXAMPLES TO AVOID:
❌ "Here is your lesson: {...}"
❌ "\`\`\`json {...} \`\`\`"
❌ "{...} Let me know if you need changes!"
❌ "I've created a lesson about ${params.topic}: {...}"

RIGHT FORMAT:
✅ {"title":"...","level":"...","sections":[...]}

BEGIN YOUR JSON RESPONSE NOW:`;

    return systemInstruction;
  }
  
  /**
   * Validate and improve the generated content for quality control
   * NOTE: Validations removed to improve speed - trusting Grok-4 Fast to generate high-quality content
   */
  private async validateAndImproveContent(content: any, params: LessonGenerateParams): Promise<any> {
    console.log('Skipping quality control validation - trusting Grok-4 Fast for high-quality output');
    return content;
  }

  /**
   * Validate reading text paragraphs for grammar correctness using AI
   */
  private async validateReadingTextGrammar(paragraphs: string[], cefrLevel: string, topic: string): Promise<string[]> {
    try {
      const validationPrompt = `You are a grammar quality control expert for ESL lesson content.

CRITICAL TASK: Review these reading text paragraphs and ensure they are grammatically PERFECT. Fix any grammar errors while maintaining the meaning and appropriate CEFR level.

CEFR LEVEL: ${cefrLevel}
LESSON TOPIC: ${topic}
PARAGRAPHS TO CHECK: ${JSON.stringify(paragraphs)}

VALIDATION CRITERIA (ALL must be met):
1. **PERFECT GRAMMAR**: Every sentence must be grammatically correct
2. **VERB FORMS**: Correct tense, aspect, and agreement (e.g., "is imagining" not "is imagine")
3. **SUBJECT-VERB AGREEMENT**: Singular/plural subjects match their verbs
4. **ARTICLE USAGE**: Correct use of a/an/the
5. **PREPOSITIONS**: Appropriate prepositions in context
6. **WORD ORDER**: Standard English word order maintained
7. **LEVEL APPROPRIATENESS**: Language complexity matches ${cefrLevel} level

COMMON GRAMMAR ERRORS TO FIX:
❌ "She is imagine" → ✅ "She is imagining" (incorrect verb form)
❌ "He like pizza" → ✅ "He likes pizza" (subject-verb agreement)
❌ "They was happy" → ✅ "They were happy" (verb agreement)
❌ "I go to school yesterday" → ✅ "I went to school yesterday" (tense)
❌ "She is very good in math" → ✅ "She is very good at math" (preposition)

IMPORTANT: 
- Preserve the MEANING and VOCABULARY of the original text
- Keep sentences at the appropriate ${cefrLevel} complexity level
- Only fix grammar - don't rewrite content or add new information
- Maintain bold markdown formatting for vocabulary words (e.g., **achieve**)

Return ONLY a JSON array of corrected paragraphs as strings. Each paragraph must be grammatically perfect.`;

      const validationRequestData = {
        model: 'google/gemini-1.5-flash',
        messages: [
          {
            role: 'user',
            content: validationPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      };

      const result: AxiosResponse = await axios.post(
        `${this.baseURL}/chat/completions`,
        validationRequestData,
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
   * Validate sentence frame examples for logical coherence using Gemini
   */
  private async validateSentenceFrameExamples(examples: any[], pattern: string, topic: string): Promise<any[]> {
    try {
      const validationPrompt = `You are a quality control expert for ESL lesson content specializing in sentence pattern validation.

CRITICAL TASK: Review these sentence examples and ensure they CORRECTLY DEMONSTRATE the target sentence pattern while being logical and grammatically correct.

TARGET SENTENCE PATTERN: ${pattern}
LESSON TOPIC: ${topic}
CURRENT EXAMPLES: ${JSON.stringify(examples)}

VALIDATION CRITERIA (ALL must be met):
1. **PATTERN ADHERENCE**: The sentence MUST follow the exact structure of the target pattern
2. **LOGICAL MEANING**: The content must make logical sense
3. **GRAMMAR CORRECTNESS**: Perfect grammar and syntax
4. **TOPIC RELEVANCE**: Appropriate for the lesson topic

COMMON PATTERN ISSUES TO FIX:
- If pattern is "It is ___ to ___ because ___" but example is "Mars is difficult because...", fix to "It is difficult to travel to Mars because..."
- If pattern uses specific connectors (like "because", "when", "although"), ensure they're present
- If pattern requires infinitives ("to + verb"), ensure they're used correctly
- If pattern has placeholders, ensure each placeholder is properly filled

EXAMPLE FIXES FOR PATTERN "It is ___ to ___ because ___":
❌ WRONG: "Mars is difficult because it is far away" (doesn't follow pattern)
✅ CORRECT: "It is difficult to travel to Mars because it is far away"

❌ WRONG: "Space exploration expensive because rockets cost money" (missing pattern structure)
✅ CORRECT: "It is expensive to explore space because rockets cost a lot of money"

Return ONLY a JSON array of corrected examples. Each example must perfectly demonstrate the target sentence pattern while being logical and appropriate for the topic.

If an example is a simple string, return a string. If it's an object with "completeSentence" and "breakdown" properties, maintain that structure and ensure the breakdown correctly maps to the pattern components.`;

      const validationRequestData = {
        model: 'google/gemini-1.5-flash',
        messages: [
          {
            role: 'user',
            content: validationPrompt
          }
        ],
        temperature: 0.1, // Low temperature for consistency
        max_tokens: 2000
      };

      const result: AxiosResponse = await axios.post(
        `${this.baseURL}/chat/completions`,
        validationRequestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 30000 // 30 second timeout for validation
        }
      );

      const text = result.data.choices[0]?.message?.content;

      try {
        // Clean up the response and parse as JSON
        let cleanedContent = text.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
        }

        const validatedExamples = JSON.parse(cleanedContent);
        console.log('Successfully validated sentence frame examples using Gemini');
        return Array.isArray(validatedExamples) ? validatedExamples : examples;
      } catch (parseError) {
        console.error('Error parsing Gemini validation response, using original examples');
        return examples;
      }
    } catch (error) {
      console.error('Error validating sentence frame examples with Gemini:', error);
      return examples; // Return original examples if validation fails
    }
  }

  /**
   * Format and process the lesson content, adding image data IN PARALLEL for speed
   */
  private async formatLessonContent(content: any): Promise<any> {
    // Add provider identifier to the content
    const lessonContent = {
      ...content,
      provider: 'gemini'
    };
    
    // Generate ALL images in parallel if sections exist
    if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
      console.log('Starting PARALLEL image generation for Gemini lesson...');
      
      // Collect all image generation tasks
      const imageGenerationTasks: Promise<void>[] = [];
      
      for (const section of lessonContent.sections) {
        // Vocabulary images
        if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
          console.log(`Found ${section.words.length} vocabulary words, queueing parallel image generation...`);
          for (const word of section.words) {
            // Generate fallback imagePrompt if missing
            if (!word.imagePrompt && word.term) {
              word.imagePrompt = `An illustration showing the meaning of "${word.term}" in a clear, educational way. No text visible in the image.`;
              console.log(`Generated fallback imagePrompt for vocab word: "${word.term}"`);
            }
            
            if (word.imagePrompt) {
              // Queue parallel image generation
              const task = (async () => {
                try {
                  const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                  word.imageBase64 = await replicateFluxService.generateImage(word.imagePrompt, requestId);
                  console.log(`✓ Generated image for vocab: ${word.term}`);
                } catch (imgError) {
                  console.error(`✗ Error generating image for vocab ${word.term}:`, imgError);
                  word.imageBase64 = null;
                }
              })();
              imageGenerationTasks.push(task);
            } else {
              console.log(`No imagePrompt for vocab: "${word.term}"`);
              word.imageBase64 = null;
            }
          }
        }
        
        // Discussion images
        if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
          console.log(`Found ${section.questions.length} discussion questions, queueing parallel image generation...`);
          for (const question of section.questions) {
            // Ensure paragraphContext exists
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
            
            // Generate enhanced fallback imagePrompt if missing
            if (!question.imagePrompt && question.question) {
              const contextSnippet = question.paragraphContext ? question.paragraphContext.substring(0, 150) : question.question;
              question.imagePrompt = `A realistic illustration showing a scenario related to: "${question.question.substring(0, 100)}". Scene includes people in a relatable situation that embodies this question. ${contextSnippet.includes('work') ? 'Professional setting' : contextSnippet.includes('school') || contextSnippet.includes('student') ? 'Educational environment' : contextSnippet.includes('family') || contextSnippet.includes('home') ? 'Home or family setting' : 'Contemporary setting'} with natural lighting and clear visual storytelling. Characters showing emotions or actions relevant to the topic. Realistic illustration, warm natural lighting, engaging composition. No text visible.`;
            }
            
            if (question.imagePrompt) {
              // Queue parallel image generation
              const task = (async () => {
                try {
                  const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                  question.imageBase64 = await replicateFluxService.generateImage(question.imagePrompt, requestId);
                  console.log(`✓ Generated image for discussion question`);
                } catch (imgError) {
                  console.error(`✗ Error generating discussion image:`, imgError);
                  question.imageBase64 = null;
                }
              })();
              imageGenerationTasks.push(task);
            } else {
              question.imageBase64 = null;
            }
          }
        }
      }
      
      // Wait for ALL images to generate in parallel
      if (imageGenerationTasks.length > 0) {
        console.log(`⚡ Generating ${imageGenerationTasks.length} images in parallel...`);
        await Promise.all(imageGenerationTasks);
        console.log(`✓ All ${imageGenerationTasks.length} images generated in parallel!`);
      }
      
      console.log('Finished parallel image generation for Gemini lesson.');
    } else {
        console.log('No sections found, skipping image generation.');
    }
    
    return lessonContent;
  }
}

// Test the OpenRouter integration
export const testOpenRouterConnection = async (): Promise<boolean> => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return false;
    }

    const testRequest = {
      model: 'qwen/qwen3-vl-8b-thinking',
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

export const geminiService = new GeminiService(process.env.OPENROUTER_API_KEY || '');