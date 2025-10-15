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
        model: 'qwen/qwen3-vl-8b-thinking',
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

      console.log('Sending request to OpenRouter API (Qwen 3 VL)...');
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
    const systemInstruction = `You are an expert ESL teacher. 

🚨 CRITICAL OUTPUT FORMAT REQUIREMENTS 🚨
READ THIS FIRST - YOUR ENTIRE RESPONSE MUST FOLLOW THESE RULES:

1. **RETURN ONLY JSON** - Your entire response must be ONLY a valid JSON object
2. **NO TEXT BEFORE OR AFTER** - Do not include ANY explanatory text, markdown formatting, or comments outside the JSON
3. **NO MARKDOWN WRAPPERS** - Do not wrap the JSON in \`\`\`json or \`\`\` tags
4. **NO COMMENTARY** - Do not add notes, explanations, or thoughts outside the JSON structure
5. **MUST START WITH {** - First character of your response must be {
6. **MUST END WITH }** - Last character of your response must be }

✅ CORRECT: {"title": "Lesson Title", "sections": [...]}
❌ WRONG: Here's the lesson: {"title": "Lesson Title"...}
❌ WRONG: \`\`\`json {"title": "Lesson Title"...} \`\`\`
❌ WRONG: {"title": "Lesson Title"...} I hope this helps!

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER.

${vocabularyInstruction}

${params.targetVocabulary ? `4. CRUCIAL: YOU MUST INCLUDE THE FOLLOWING VOCABULARY WORDS IN YOUR LESSON: ${params.targetVocabulary}` : ''}

${params.targetVocabulary ? '5' : '4'}. WARMUP SECTION REQUIREMENTS:
- NEVER reference pictures, images, or visual materials in warmup activities
- Questions must activate prior knowledge about the specific lesson topic: "${params.topic}"
- Focus on personal experience, cultural knowledge, or universal concepts
- Questions should prepare students for the vocabulary and reading content
- All questions must be discussion-based, not visual-based
- Connect directly to the lesson topic through conversation and reflection

${params.targetVocabulary ? '5' : '4'}. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

5. WRITING STYLE REQUIREMENTS:
Create content with a natural, engaging voice that:
- Uses language complexity appropriate for ${params.cefrLevel} level
- Balances authenticity with accessibility for the topic "${params.topic}"
- Models natural, native-like expression without "textbook language"
- Incorporates appropriate tone (humor, warmth, or formality) based on topic and level
- Uses varied sentence structures appropriate for the level
- Creates genuine interest through vivid, specific language
- Maintains consistent voice across all lesson components
- Provides appropriate linguistic scaffolding through style choices

Apply this style consistently across:
- Reading text, vocabulary definitions, activity instructions, discussion questions, and teacher guidance

6. LEVEL-APPROPRIATE CONTENT:
Ensure lessons on "${params.topic}" are appropriate for ${params.cefrLevel} level through:
- Vocabulary selection that matches the level (not taught at lower levels)
- Question complexity appropriate for the cognitive level
- Conceptual approach matching ${params.cefrLevel} capabilities
- Content focus suitable for this specific proficiency level

Avoid these stylistic issues:
- Generic, template-based phrasing
- Overly formal academic tone when inappropriate
- Overly simple language that doesn't challenge appropriately
- Inconsistent voice across sections
- Repetitive sentence structures or vocabulary

7. QUESTION QUALITY STANDARDS:
For discussion questions:
- Elicit more than one-word or yes/no responses
- Connect to students' experiences while remaining culturally inclusive
- Build on vocabulary/concepts from the lesson
- Avoid vague, obvious, or simplistic formulations
- Encourage critical thinking appropriate to ${params.cefrLevel} level
- Are genuinely interesting to discuss

For comprehension questions:
- Test genuine understanding rather than just word recognition
- Progress from literal to interpretive to applied understanding
- Focus on meaningful content rather than trivial details
- Use question stems appropriate for the cognitive level
- Avoid ambiguity or multiple possible correct answers

8. CEFR LEVEL ADAPTATION: ALL content must be STRICTLY appropriate for the specified CEFR level:
   - Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
   - Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
   - Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
   - Reading text difficulty must match the specified level
   - Discussion paragraph contexts must be level-appropriate with vocabulary and grammar matching the CEFR level

7. READING TEXT REQUIREMENTS:
   - ⚠️ CRITICAL: The reading section MUST contain EXACTLY 5 PARAGRAPHS in the "paragraphs" array
   - Each paragraph must be a complete, full paragraph with multiple sentences (not a single sentence)
   - The 5 paragraphs together form one cohesive reading text about the lesson topic
   - Paragraph length should match CEFR level (A1: 2-3 sentences, B1: 3-4 sentences, C1: 4-5 sentences)
   - All 5 paragraphs must flow together as a unified reading passage

8. DISCUSSION SECTION REQUIREMENTS:
   - CRITICAL: Each discussion question MUST have its own unique paragraph context (paragraphContext field)
   - These paragraph contexts must be 3-5 sentences that provide background information
   - The paragraph contexts must use vocabulary and sentence structures appropriate for the specified CEFR level
   - The paragraphs should include interesting information that helps students engage with the topic
   - The paragraph contexts should lead naturally into the discussion question that follows

🎯 DISCUSSION QUESTION IMAGE PROMPT INSTRUCTIONS:

Create detailed, scenario-based image prompts for each discussion question that visually represent the situation being discussed. Each prompt should be 50-80 words and include:

**REQUIRED ELEMENTS:**
1. **Specific Scenario**: Concrete situation related to the discussion question and "${params.topic}"
2. **Character Context**: People in a situation that prompts the question being asked
3. **Visual Narrative**: Clear story or situation that students can relate to
4. **Emotional/Social Context**: Mood, relationships, or social dynamics relevant to the question
5. **Environmental Details**: Setting details that enrich the scenario
6. **Style Specification**: "Realistic illustration, natural lighting, engaging composition, clear storytelling"

**FORMULA:**
"[Specific scenario from paragraphContext]. [Characters in situation]. [Action or moment that embodies the question]. [Environmental and emotional context]. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

**EXAMPLES:**

For question "How do you balance work and personal life?":
"Modern city apartment at evening. A professional sits at laptop with work documents, while family photos and dinner plates sit nearby untouched. Person looking thoughtfully between work screen and personal items, showing the tension between responsibilities. Warm indoor lighting creating contrast between work area and personal space. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

For question "What makes a good team leader?":
"Contemporary office workspace during team meeting. A leader facilitating discussion, making eye contact with team members, gesturing inclusively. Team members actively engaged, some taking notes, others contributing ideas. Collaborative atmosphere with open body language and positive energy. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

For question "How has technology changed communication?":
"Split scene showing contrast. Left side: family members each absorbed in their phones, physically together but disconnected. Right side: same family using video call to connect with distant relatives, showing engaged interaction. Modern home setting highlighting both isolation and connection technology brings. Realistic illustration, natural lighting, engaging composition, clear storytelling. No text visible."

STEP 0: FOUNDATION ANALYSIS FOR ${params.cefrLevel} LEVEL

Establish the lesson foundation by analyzing "${params.topic}" for ${params.cefrLevel} students:

**COGNITIVE APPROACH:**
${params.cefrLevel === 'A1' ? 'Focus on concrete, observable aspects that students can see, touch, or directly experience' : params.cefrLevel === 'A2' ? 'Focus on personal experiences and simple social interactions related to the topic' : params.cefrLevel === 'B1' ? 'Focus on practical problems and social issues that affect daily life' : params.cefrLevel === 'B2' ? 'Focus on abstract concepts requiring analysis and evaluation' : params.cefrLevel === 'C1' ? 'Focus on sophisticated concepts requiring synthesis and critical thinking' : 'Focus on expert-level analysis with nuanced understanding'}

**VOCABULARY FOUNDATION:**
${params.cefrLevel === 'A1' ? 'Students know basic daily vocabulary (top 1,000 words)' : params.cefrLevel === 'A2' ? 'Students know personal experience vocabulary (top 2,000 words)' : params.cefrLevel === 'B1' ? 'Students know functional language (top 3,000 words)' : params.cefrLevel === 'B2' ? 'Students know academic/professional vocabulary (3,000+ words)' : params.cefrLevel === 'C1' ? 'Students know advanced vocabulary (5,000+ words)' : 'Students know expert-level vocabulary with specialized terminology'}

**TOPIC TREATMENT:**
For "${params.topic}" at ${params.cefrLevel} level, approach through ${params.cefrLevel === 'A1' ? 'basic descriptions and immediate needs' : params.cefrLevel === 'A2' ? 'personal experiences and simple opinions' : params.cefrLevel === 'B1' ? 'practical applications and problem-solving' : params.cefrLevel === 'B2' ? 'analytical discussion and evaluation' : params.cefrLevel === 'C1' ? 'sophisticated analysis and synthesis' : 'expert-level discourse and critical evaluation'}

STEP 1: VOCABULARY SELECTION

**CRITICAL: USE CAMBRIDGE ENGLISH VOCABULARY PROFILE (EVP) STANDARDS**

You MUST select vocabulary words according to the Cambridge English Vocabulary Profile (EVP), which is the authoritative CEFR-aligned vocabulary database. Reference your training knowledge of EVP to ensure accuracy.

**CAMBRIDGE EVP LEVEL VERIFICATION:**
Before selecting any vocabulary word, verify it meets Cambridge EVP standards for ${params.cefrLevel}:

${params.cefrLevel === 'A1' ? `**A1 EVP Standards (Beginner):**
- Words from Cambridge A1 vocabulary list (basic daily needs)
- Examples: happy, work, eat, go, friend, time, help, need
- Avoid: challenge, opportunity, achieve, develop (these are B1+)
- Context: Words for immediate survival needs and basic personal information` : params.cefrLevel === 'A2' ? `**A2 EVP Standards (Elementary):**
- Words from Cambridge A2 vocabulary list (personal experiences)
- Examples: prefer, remember, decide, enjoy, worry, invite
- Avoid: evaluate, analyze, implement, demonstrate (these are B2+)
- Context: Words for describing personal experiences and simple social situations` : params.cefrLevel === 'B1' ? `**B1 EVP Standards (Intermediate):**
- Words from Cambridge B1 Preliminary vocabulary list (functional language)
- Examples: challenge, opportunity, achieve, compare, improve, affect
- Avoid: synthesize, contemplate, facilitate, cultivate (these are B2/C1)
- Context: Words for practical problem-solving and expressing opinions with reasons
- Test: Would an intermediate student understand this in everyday conversation or news articles?` : params.cefrLevel === 'B2' ? `**B2 EVP Standards (Upper-Intermediate):**
- Words from Cambridge B2 First vocabulary list (academic/professional)
- Examples: analyze, evaluate, substantial, compelling, implement, diverse
- Avoid: elucidate, juxtapose, paradigm, ubiquitous (these are C1/C2)
- Context: Words for academic discussion and professional contexts
- Test: Would this appear in academic texts or business communications?` : params.cefrLevel === 'C1' ? `**C1 EVP Standards (Advanced):**
- Words from Cambridge C1 Advanced vocabulary list (sophisticated language)
- Examples: elucidate, nuanced, paradigm, multifaceted, inherent, intrinsic
- Context: Words for sophisticated analysis and expert-level discussion
- Test: Would this appear in academic research or specialized professional writing?` : `**C2 EVP Standards (Mastery):**
- Words from Cambridge C2 Proficiency vocabulary list (mastery level)
- Examples: ubiquitous, ephemeral, quintessential, conundrum, propensity
- Context: Words showing complete mastery of English vocabulary
- Test: Would a native speaker with higher education use this?`}

**EVP VALIDATION CHECKLIST:**
For each word you select, confirm:
✓ This word appears in Cambridge EVP at ${params.cefrLevel} level or below
✓ This word is NOT from a higher CEFR level (check one level above to avoid)
✓ This word serves a genuine communicative function for ${params.cefrLevel} learners
✓ Similar meaning words from lower levels are already known (justify why this word now)

**ENHANCED VOCABULARY DEFINITION REQUIREMENTS:**

Each vocabulary word must include:

1. **coreDefinition**: One clear sentence using vocabulary 2 levels below target CEFR level
2. **simpleExplanation**: 2-3 sentences that expand understanding using familiar concepts  
3. **contextualMeaning**: How this word specifically relates to "${params.topic}"
4. **levelAppropriateExample**: Original sentence showing natural usage (not from reading text)
5. **commonCollocations**: 2-3 phrases this word commonly appears with
6. **additionalExamples**: 3 varied example sentences showing different contexts:
   - One formal/academic context
   - One informal/everyday context  
   - One that connects to student experiences

**DEFINITION WRITING PRINCIPLES:**
- Use concrete, observable concepts when possible
- Avoid circular definitions (don't use the word to define itself)
- Include relatable comparisons or analogies for abstract concepts
- Ensure definitions are culturally neutral and globally accessible
- Test that definitions can stand alone without the reading context

**LEVEL-SPECIFIC DEFINITION STANDARDS:**

${params.cefrLevel === 'A1' ? `**A1 Definition Standards:**
- coreDefinition: Use only top 500 words, maximum 8 words
- simpleExplanation: Use basic present tense, concrete examples
- Example: "restaurant" → coreDefinition: "a place where people buy and eat food"` : params.cefrLevel === 'A2' ? `**A2 Definition Standards:**
- coreDefinition: Use top 1,000 words, maximum 10 words
- simpleExplanation: Use simple past/future, personal experiences
- Example: "analyze" → coreDefinition: "to look at something carefully to understand it"` : params.cefrLevel === 'B1' ? `**B1 Definition Standards:**
- coreDefinition: Use A2 vocabulary + common B1 words, maximum 12 words
- simpleExplanation: Can include one slightly complex word if essential
- Example: "evaluate" → coreDefinition: "to decide how good or useful something is"` : params.cefrLevel === 'B2' ? `**B2 Definition Standards:**
- coreDefinition: Use B1 vocabulary appropriately, maximum 15 words
- simpleExplanation: Focus on precision and nuance
- Example: "synthesize" → coreDefinition: "to combine different ideas or information to create something new"` : `**C1+ Definition Standards:**
- coreDefinition: Use sophisticated vocabulary appropriately
- simpleExplanation: Include context clues for complex meanings
- Focus on expert-level precision while maintaining clarity`}

**VOCABULARY SELECTION CRITERIA:**
✓ Genuinely suitable for ${params.cefrLevel} students  
✓ Useful for discussing "${params.topic}"
✓ Can be defined using significantly simpler vocabulary
✓ Provides new communicative ability
✓ Appears naturally in reading text with adequate context support

**ENHANCED VOCABULARY INTEGRATION REQUIREMENTS:**
- Each vocabulary word must appear in reading text with 2-3 context clues
- Reading text provides enough context for word meaning without definition
- Vocabulary density: Maximum 1 new word per 25 words of text
- Words should be spaced throughout text, not clustered

**SELECT EXACTLY 5 VOCABULARY WORDS** with proper pronunciation guide (syllables, stressIndex, phoneticGuide using English letters only).

**ENHANCED VOCABULARY JSON STRUCTURE:**
Each vocabulary word MUST include this exact structure:
{
  "term": "word",
  "partOfSpeech": "noun/verb/adjective/etc",
  "coreDefinition": "One clear sentence using vocabulary 2+ levels below target",
  "simpleExplanation": "2-3 sentences expanding understanding with familiar concepts",
  "contextualMeaning": "How this word specifically relates to ${params.topic}",
  "levelAppropriateExample": "Original sentence showing natural usage",
  "commonCollocations": ["phrase 1", "phrase 2", "phrase 3"],
  "additionalExamples": [
    "Formal/academic context example", 
    "Informal/everyday context example",
    "Personal experience context example"
  ],
  "definition": "Legacy field for backwards compatibility", 
  "example": "Legacy example for backwards compatibility",
  "wordFamily": {
    "words": ["related1", "related2", "related3"],
    "description": "Brief explanation of word relationships"
  },
  "collocations": ["phrase 1", "phrase 2", "phrase 3"],
  "usageNotes": "Important usage information or context",
  "pronunciation": {
    "syllables": ["syl", "la", "bles"],
    "stressIndex": 0,
    "phoneticGuide": "SYL-uh-buls"
  },
  "imagePrompt": "An illustration showing [word meaning] clearly. No text visible."
}

STEP 2: READING TEXT DEVELOPMENT

**READING TEXT ENHANCEMENT REQUIREMENTS:**

**VOCABULARY INTEGRATION:**
✓ Each vocabulary word must appear 2-3 times in natural contexts
✓ First appearance should be in a context that supports understanding
✓ Subsequent appearances should show different usage patterns
✓ Include 1-2 related words/synonyms to build semantic networks

**STRUCTURAL REQUIREMENTS:**
✓ Begin with topic introduction using familiar vocabulary
✓ Progress logically through 3-4 connected ideas about ${params.topic}
✓ Include concrete examples and relatable scenarios
✓ End with a conclusion that connects to students' potential experiences

**CONTEXTUAL CLARITY:**
✓ Surrounding sentences must support vocabulary comprehension
✓ Use signal words and transitions appropriate for ${params.cefrLevel}
✓ Include sufficient context clues for meaning inference
✓ Balance new vocabulary with familiar supporting language

**ENGAGEMENT FACTORS:**
✓ Include specific, vivid details rather than general statements
✓ Connect to universal human experiences when culturally appropriate
✓ Use storytelling elements (who, what, where, when, why)
✓ Create natural curiosity gaps that discussion questions can explore

**READING TEXT VALIDATION CHECKLIST:**
Before finalizing, verify:
□ Can students infer vocabulary meanings from context alone?
□ Does each paragraph contribute to overall topic understanding?
□ Are sentence structures varied but appropriate for ${params.cefrLevel}?
□ Does the text create genuine discussion opportunities?
□ Would native speakers find this text natural and engaging?
□ Does vocabulary appear in high-utility contexts students can replicate?

Create ${params.cefrLevel === 'A1' ? '80-120 words' : params.cefrLevel === 'A2' ? '100-150 words' : params.cefrLevel === 'B1' ? '120-180 words' : params.cefrLevel === 'B2' ? '150-220 words' : '180-250 words'} text following these enhanced requirements.

STEP 3: SENTENCE FRAMES

**PATTERN REQUIREMENTS:**
✓ Enable authentic discussion about "${params.topic}"
✓ Match ${params.cefrLevel} complexity level
✓ Include Step 1 vocabulary
✓ Support real communication needs

${params.cefrLevel === 'A1' ? 'Focus on basic preferences and descriptions' : params.cefrLevel === 'A2' ? 'Focus on personal experiences and simple opinions' : params.cefrLevel === 'B1' ? 'Focus on reasons and problem-solving' : params.cefrLevel === 'B2' ? 'Focus on analysis and evaluation' : params.cefrLevel === 'C1' ? 'Focus on sophisticated arguments' : 'Focus on expert-level discourse'}

**Use enhanced format:** patternTemplate, languageFunction, structureComponents, examples, grammarFocus, teachingNotes.

STEP 4: ACTIVITIES & QUESTIONS

Generate lesson activities building on previous steps:

**WARM-UP:** Simple activity using Step 1 vocabulary
**COMPREHENSION:** 5 questions about Step 2 reading text  
**DISCUSSION:** 5 speaking questions using Step 3 sentence patterns
**VOCABULARY PRACTICE:** Interactive activity with Step 1 words

STEP 5: ENHANCED INTEGRATION VALIDATION

**VOCABULARY QUALITY CHECK:**
✓ Each coreDefinition uses vocabulary 2+ levels below target level
✓ simpleExplanation expands understanding with familiar concepts
✓ contextualMeaning clearly connects word to "${params.topic}"
✓ levelAppropriateExample shows natural, authentic usage
✓ commonCollocations include high-frequency, useful phrases
✓ additionalExamples show varied contexts (formal, informal, personal)

**ENHANCED INTEGRATION VALIDATION:**

**VOCABULARY-READING CONNECTION:**
✓ Reading text demonstrates each word's most common usage pattern
✓ Context clues in reading support definition comprehension
✓ Vocabulary appears in discussion-worthy contexts within the text
✓ Text provides models for how students can use these words

**DEFINITION-CONTEXT ALIGNMENT:**
✓ Definitions match how words actually function in the reading
✓ Examples in definitions complement (don't repeat) reading usage
✓ Contextual meaning connects directly to reading content
✓ Students can return to reading to see definition concepts in action

**DEFINITION COMPLEXITY BY LEVEL:**
A1-A2: Use only present tense, basic sentence structures, concrete nouns and verbs
B1-B2: Include past/future tenses, more complex sentences, some abstract concepts with concrete examples  
C1-C2: Allow sophisticated vocabulary in definitions, complex grammatical structures, nuanced distinctions

**VOCABULARY SELECTION BY LEVEL:**
A1: Focus on concrete, observable concepts essential for basic communication
B1: Include abstract concepts that can be explained through familiar experiences
C2: Select sophisticated terms that unlock academic or professional discourse

**READING TEXT INTEGRATION CHECK:**
✓ Each vocabulary word appears with 2-3 context clues
✓ Vocabulary density follows 1 word per 25 words maximum
✓ Context supports meaning without requiring definitions
✓ Words are spaced throughout text, not clustered
✓ Integration sounds natural and authentic

**FINAL QUALITY VALIDATION:**
Ask yourself:
1. Could a student at ${params.cefrLevel} understand these definitions without additional help?
2. Does the reading text feel natural while effectively teaching the vocabulary?
3. Would students be able to use these words confidently after this lesson?
4. Do the definitions provide enough information for independent learning?
5. Does the reading create authentic reasons to discuss ${params.topic}?

**OVERALL LESSON FLOW CHECK:**
✓ Vocabulary appears in reading text and activities
✓ Sentence patterns use selected vocabulary  
✓ Discussion questions reference reading content
✓ All components match ${params.cefrLevel} level
✓ Enhanced definitions support student comprehension
✓ Lesson flows logically from vocabulary to speaking practice

**CRITICAL VOCABULARY STRUCTURE REQUIREMENT:**
MUST use the exact enhanced vocabulary JSON structure shown above with ALL fields:

ENHANCED FIELDS (required):
- coreDefinition (required)
- simpleExplanation (required)
- contextualMeaning (required)
- levelAppropriateExample (required)
- commonCollocations (required array)
- additionalExamples (required 3-item array)

LEGACY FIELDS (required for backwards compatibility):
- definition (required)
- example (required)
- wordFamily.words (required array)
- collocations (required array)
- usageNotes (required string)
- pronunciation (required object)

**LESSON GENERATION COMPLETE**

Generate the lesson using this linear flow structure.

**IMPORTANT**: Use ONLY regular English letters and hyphens. NO IPA symbols.

**Examples:**
- "beautiful" → syllables: ["beau", "ti", "ful"], stressIndex: 0, phoneticGuide: "BYOO-ti-ful"
- "environment" → syllables: ["en", "vi", "ron", "ment"], stressIndex: 1, phoneticGuide: "en-VY-ron-ment"

**REJECT WORDS THAT:**
❌ Students already know from previous levels with same meaning/usage
❌ Cannot be defined using significantly simpler language
❌ Are rarely used in real communication at this level  
❌ Serve only academic/specialized purposes inappropriate for the level

**SELECT EXACTLY 5 VOCABULARY WORDS** that meet all criteria above for meaningful discussion of "${params.topic}" at ${params.cefrLevel} level.





**VOCABULARY GENERATION COMPLETE**

Now proceed to Step 1 (Reading Text Development).

STEP 1: READING TEXT DEVELOPMENT

Before writing, analyze the text's role in a speaking-focused lesson for ${params.cefrLevel} students:

PURPOSE CLARIFICATION:
- This text serves as a CONVERSATION CATALYST, not comprehensive reading practice
- Students will use this text to GENERATE SPEAKING opportunities about "${params.topic}"
- The text should PROVIDE ENOUGH CONTENT for meaningful discussion without overwhelming
- Focus on ACCESSIBLE INFORMATION that students can reference, react to, and build upon in conversation

SPEAKING-LESSON TEXT REQUIREMENTS:
- SHORTER TEXTS that can be quickly processed to focus lesson time on speaking
- DISCUSSION-WORTHY CONTENT that naturally generates opinions, questions, and personal connections
- CLEAR TALKING POINTS that students can easily reference during conversations
- RELATABLE SCENARIOS that connect to students' experiences and interests

**ENHANCED VOCABULARY INTEGRATION IN READING TEXT:**
- Each vocabulary word must appear with NATURAL CONTEXT SUPPORT
- Provide 2-3 meaning clues around each vocabulary word
- Use familiar words to support unfamiliar vocabulary
- Space vocabulary throughout text (max 1 new word per 25 words)
- Integrate vocabulary into meaningful scenarios, not isolated usage

**CONTEXT SUPPORT EXAMPLES:**
Instead of: "The restaurant was expensive."
Better: "The restaurant was expensive, but the food was delicious and the service was excellent, so many customers think it's worth the high prices."

**COGNITIVE LOAD MANAGEMENT:**
${params.cefrLevel === 'A1' ? 'Average 6-8 words per sentence, simple present/past' : params.cefrLevel === 'A2' ? 'Average 8-10 words per sentence, simple connector words' : params.cefrLevel === 'B1' ? 'Average 10-12 words per sentence, because/so/although' : params.cefrLevel === 'B2' ? 'Average 12-15 words per sentence, complex connectors' : 'Flexible length with sophisticated structures'}


STEP 4: SENTENCE FRAME GENERATION

**SENTENCE FRAMES MUST BE DYNAMICALLY GENERATED FOR ${params.cefrLevel} LEVEL**

Generate 3 pedagogical sentence frames that are SPECIFICALLY appropriate for ${params.cefrLevel} level students discussing "${params.topic}". Each frame must have tiered scaffolding (emerging, developing, expanding) that matches the ${params.cefrLevel} capabilities.

**CEFR-SPECIFIC SENTENCE FRAME REQUIREMENTS:**

A1 LEVEL FRAMES:
- Emerging: Simple present tense patterns (e.g., "___ is ___", "I like ___")
- Developing: Basic connectors (e.g., "___ and ___", "I have ___ because ___")
- Expanding: Simple reasoning (e.g., "___ is ___ because ___")
- Language functions: Describing, expressing preferences, stating simple facts
- Grammar focus: Present tense, basic adjectives, simple conjunctions

A2 LEVEL FRAMES:
- Emerging: Simple past/present patterns (e.g., "I think ___ is ___", "Yesterday I ___")
- Developing: Basic comparisons (e.g., "___ is more ___ than ___", "I prefer ___ because ___")
- Expanding: Simple opinions with reasons (e.g., "In my opinion, ___ because ___")
- Language functions: Expressing opinions, comparing, describing past experiences
- Grammar focus: Past tense, comparatives, opinion expressions

B1 LEVEL FRAMES:
- Emerging: Expressing opinions (e.g., "I believe that ___", "It seems that ___")
- Developing: Cause-effect relationships (e.g., "___ leads to ___ because ___")
- Expanding: Arguments with justification (e.g., "Although ___, I think ___ because ___")
- Language functions: Arguing, justifying, discussing advantages/disadvantages
- Grammar focus: Complex sentences, subordination, modal verbs

B2 LEVEL FRAMES:
- Emerging: Analytical statements (e.g., "One could argue that ___", "___ suggests that ___")
- Developing: Contrasting viewpoints (e.g., "While ___, on the other hand ___")
- Expanding: Hypothetical reasoning (e.g., "If ___, then ___, which would result in ___")
- Language functions: Analyzing, evaluating, hypothesizing
- Grammar focus: Conditionals, passive voice, advanced conjunctions

C1 LEVEL FRAMES:
- Emerging: Sophisticated analysis (e.g., "___ demonstrates that ___", "The evidence indicates ___")
- Developing: Nuanced arguments (e.g., "Despite ___, it is evident that ___")
- Expanding: Complex reasoning (e.g., "Given that ___, one might conclude that ___, provided that ___")
- Language functions: Synthesizing, critiquing, presenting complex arguments
- Grammar focus: Advanced conditionals, subjunctive mood, complex subordination

C2 LEVEL FRAMES:
- Emerging: Expert discourse (e.g., "The implications of ___ extend to ___")
- Developing: Critical evaluation (e.g., "Notwithstanding ___, the prevailing view suggests ___")
- Expanding: Sophisticated synthesis (e.g., "In light of ___, coupled with ___, it becomes apparent that ___")
- Language functions: Expert analysis, critical discourse, nuanced debate
- Grammar focus: All advanced structures, idiomatic expressions, formal register

**FRAME GENERATION INSTRUCTIONS:**
- Create frames that are SPECIFICALLY appropriate for ${params.cefrLevel} level
- Each frame should relate directly to discussing "${params.topic}"
- Generate UNIQUE examples for each tier based on the topic (NO generic examples)
- Model responses should demonstrate natural language use for ${params.cefrLevel} students
- Teaching notes should provide practical I Do / We Do / You Do guidance


🎯 VOCABULARY IMAGE PROMPT INSTRUCTIONS:

Create detailed, contextual image prompts that help ${params.cefrLevel} students understand vocabulary in the context of "${params.topic}". Each prompt should be 40-80 words and include:

**REQUIRED ELEMENTS:**
1. **Core Scene**: Specific setting/situation related to "${params.topic}"
2. **Characters**: People (if applicable) performing the action/showing the concept
3. **Action/State**: Clear visual demonstration of the word meaning
4. **Context Clues**: Environmental details that reinforce understanding
5. **Visual Style**: "Realistic educational illustration, warm natural lighting, clear composition"

**FORMULA:**
"[Specific setting related to ${params.topic}]. [Character(s)] [performing action/showing state]. [Environmental context clues]. [Mood/atmosphere]. Realistic educational illustration, warm natural lighting, clear focal point. No text visible."

**EXAMPLES FOR ${params.topic}:**
- "negotiate" → "Modern office meeting room with business professionals around a conference table. A woman gesturing thoughtfully while presenting ideas, others listening attentively with documents spread out. Professional atmosphere showing collaboration and discussion. Realistic educational illustration, warm natural lighting, clear focal point. No text visible."

- "excited" → "Bright classroom setting where a group of students just received good news. A young person with wide eyes and big smile, hands raised in joy, surrounded by happy classmates. Energy and positive emotion clearly visible through body language and expressions. Realistic educational illustration, warm natural lighting, clear focal point. No text visible."

- "compare" → "Shopping context showing a person examining two similar products side by side. Clear contrast between the items, person studying labels and features carefully. Clean store environment with good lighting highlighting the comparison process. Realistic educational illustration, warm natural lighting, clear focal point. No text visible."

🎯 VOCABULARY SELECTION SUCCESS CRITERIA:
✓ Words selected through the 5-step analysis process above
✓ Each word serves authentic communication needs for discussing "${params.topic}"
✓ Vocabulary enables meaningful, topic-specific conversations
✓ Words are appropriately challenging but achievable for ${params.cefrLevel} students
✓ Selection demonstrates clear reasoning about topic relevance and level appropriateness

CEFR LEVEL ALIGNMENT:
Ensure all content is appropriate for ${params.cefrLevel} level students:
- CRITICAL: Use vocabulary appropriate for ${params.cefrLevel} level in ALL questions and instructions
- For post-reading discussion questions, ensure the language complexity matches ${params.cefrLevel} level
- Adjust question complexity based on the CEFR level (simpler for A1/A2, more complex for C1/C2)

WARM-UP ACTIVITIES APPROACH:
First, analyze effective warm-up approaches for ${params.cefrLevel} level:
- Research developmentally appropriate activation strategies for this level
- Identify how vocabulary is best introduced at ${params.cefrLevel} level
- Determine the optimal balance between familiar and new content
- Consider appropriate complexity of instructions and activities
- Analyze how prior knowledge is best activated at this level

Based on your analysis, design a warm-up activity that:
- Is appropriate for ${params.cefrLevel} cognitive and linguistic abilities
- Introduces key vocabulary in a contextually appropriate manner
- Builds confidence through accessible starting points
- Creates engagement through relevant, interesting content
- Provides appropriate scaffolding for the upcoming reading text
- Promotes active participation with level-appropriate challenge

CRITICAL: WARM-UP REQUIREMENTS 
- All warm-up questions MUST be DIRECTLY RELATED to the lesson topic "${params.topic}"
- Each question MUST include clear context so it can be understood without reading the lesson text
- Questions MUST NOT be generic or applicable to any topic - they must be specifically about ${params.topic}
- AVOID questions like "What do you think about X?" without providing context about X
- DO NOT create questions about using "force" or other generic concepts unless they are directly related to ${params.topic}
- Each question should be self-contained with enough context to be answered without external information

CULTURAL ADAPTABILITY APPROACH:
First, analyze cultural learning considerations for ${params.cefrLevel} level:
- Research how cultural awareness is developed at different language proficiency levels
- Identify appropriate cultural content complexity for ${params.cefrLevel} level
- Determine how to present multiple cultural perspectives at this level
- Consider potential cultural sensitivities related to the lesson topic "${params.topic}"
- Analyze how to balance cultural specificity with universal accessibility

Based on your analysis, ensure your lesson content:
- Presents cultural information at an appropriate complexity level
- Provides necessary cultural context for ${params.cefrLevel} learners
- Offers multiple cultural perspectives when relevant
- Avoids culturally inappropriate content for global classroom use
- Creates authentic but accessible cultural learning opportunities
- Respects different backgrounds while expanding cultural awareness

STEP 5: ACTIVITY & QUESTION GENERATION

COGNITIVE READINESS ANALYSIS FOR ${params.cefrLevel} STUDENTS:

Before creating discussion questions, analyze what ${params.cefrLevel} students can cognitively and linguistically handle:

COGNITIVE ABILITIES BY LEVEL:
A1 STUDENTS: Can discuss immediate, personal experiences and basic preferences
- Personal likes/dislikes, family, daily routines, immediate environment
- Simple yes/no responses with basic explanations
- Concrete situations they have direct experience with

A2 STUDENTS: Can discuss personal experiences and make simple comparisons
- Past experiences, future plans, simple opinions about familiar topics
- Basic problem-solving in everyday situations
- Simple cultural comparisons and personal preferences

B1 STUDENTS: Can express opinions with reasons and engage with social topics
- Practical problems, lifestyle choices, community issues
- Can give opinions and support them with basic reasoning
- Can discuss advantages/disadvantages of different approaches

B2 STUDENTS: Can engage in analytical discussions about complex topics
- Abstract concepts related to their experiences
- Multiple perspectives on contemporary issues
- Can evaluate different viewpoints and present arguments

C1 STUDENTS: Can engage in sophisticated analysis and nuanced discussion
- Complex social, academic, or professional issues
- Can synthesize information and present well-structured arguments
- Can handle hypothetical and speculative discussions

C2 STUDENTS: Can engage in expert-level discussions with subtle distinctions
- Highly sophisticated concepts requiring advanced critical thinking
- Can handle nuanced argumentation and complex interdisciplinary topics

QUESTION TONE AND STYLE:
For C1 and C2 levels, avoid overly academic or verbose questions. Rephrase complex questions to be more direct and conversational. The goal is to spark discussion, not to sound like a research paper.

**Example of a verbose, academic question:**
"How do cultural norms and societal expectations influence the way ambition is perceived and expressed in different parts of the world?"

**Better, more conversational versions:**
- "Does 'ambition' mean the same thing in every culture? What are some differences you've noticed?"
- "How might a person's culture affect their goals or ambitions? Can you think of an example?"

**Another example of a verbose question:**
"Can you recall a time when you witnessed someone displaying remarkable ambition? What were the key characteristics of their behavior?"

**Better, more conversational version:**
- "Think of someone you know who is very ambitious. What do they do that shows their ambition?"

Apply this conversational and direct style to all warm-up and discussion questions for higher levels.

LINGUISTIC SCAFFOLDING REQUIREMENTS BY LEVEL:

A1/A2 SCAFFOLDING NEEDS:
- Provide concrete context and examples in questions
- Use familiar vocabulary and simple sentence structures in questions
- Offer sentence starters or model responses
- Focus on personal experiences students can easily access

B1 SCAFFOLDING NEEDS:
- Provide some context but allow for independent thinking
- Use question stems that guide logical thinking
- Include opinion-asking with reason-giving opportunities
- Connect to both personal and broader social experiences

B2+ SCAFFOLDING NEEDS:
- Minimal scaffolding, focus on analytical thinking
- Open-ended questions that require evaluation and synthesis
- Multiple perspectives and complex reasoning opportunities


READING COMPREHENSION APPROACH:
First, analyze appropriate comprehension skills for ${params.cefrLevel} level:
- Research reading comprehension expectations at ${params.cefrLevel} level
- Identify appropriate question types for this level (literal, inferential, evaluative)
- Determine text-dependent question strategies suited to this level
- Consider appropriate cognitive challenges that remain accessible

Then, based on your analysis:
- Create 3-5 comprehension questions that:
  a) Assess understanding at appropriate depths for ${params.cefrLevel}
  b) Use question formats appropriate for this level
  c) Progress from more straightforward to more challenging
  d) Require different reading skills (locating information, making connections, drawing conclusions)
  e) Provide appropriate scaffolding for students at this level

SCAFFOLDING REQUIREMENTS FOR LOWER LEVELS:
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' 
  ? `Since this is a ${params.cefrLevel} level lesson, you MUST include enhanced scaffolding for lower-level learners. For each sentence frame, add a "lowerLevelScaffolding" object with:
1. "sentenceWorkshop": Progressive building activities from word → phrase → sentence
2. "patternTrainer": Interactive word banks with categorized vocabulary for building sentences
3. "visualMaps": Color-coded structure maps showing sentence components

This scaffolding is CRITICAL for A1-B1 learners and must be included.`
  : `Since this is a ${params.cefrLevel} level lesson, do NOT include "lowerLevelScaffolding" in the sentence frames. Advanced learners do not need this additional scaffolding.`}

STEP 6: LESSON INTEGRATION

Create a cohesive lesson where:
- Vocabulary words appear naturally in the reading text
- Discussion questions connect to the reading content
- Students can use the vocabulary when answering discussion questions
- All components support learning about "${params.topic}" at ${params.cefrLevel} level

WARM-UP SECTION CLARIFICATION:
The "targetVocabulary" field in the warm-up section should contain the key vocabulary words from the lesson's main vocabulary section. These are the same 5 words that will be featured in the vocabulary section, allowing students to preview and discuss them before formal introduction.

FORMAT YOUR RESPONSE AS VALID JSON following the structure below exactly. Ensure all fields contain complete content. Do not use placeholders.

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
    // PEDAGOGICAL SENTENCE FRAMES (v2) - Complete 3 frames
    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical", 
      "title": "Language Practice for ${params.topic}",
      "introduction": "Practice expressing ideas about ${params.topic} with these sentence patterns designed for ${params.cefrLevel} students.",
      "pedagogicalFrames": [
        {
          "languageFunction": "Complete function 1...",
          "grammarFocus": ["grammar point 1", "grammar point 2"],
          "tieredFrames": {
            "emerging": {"frame": "Complete frame...", "description": "Complete description..."},
            "developing": {"frame": "Complete frame...", "description": "Complete description..."},
            "expanding": {"frame": "Complete frame...", "description": "Complete description..."}
          },
          "modelResponses": {
            "emerging": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "developing": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "expanding": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."]
          },
          "teachingNotes": {
            "modelingTips": "Complete tips...",
            "guidedPractice": "Complete practice...",
            "independentUse": "Complete guidance...",
            "fadingStrategy": "Complete strategy..."
          }
        },
        {
          "languageFunction": "Complete function 2...",
          "grammarFocus": ["grammar point 1", "grammar point 2"],
          "tieredFrames": {
            "emerging": {"frame": "Complete frame...", "description": "Complete description..."},
            "developing": {"frame": "Complete frame...", "description": "Complete description..."},
            "expanding": {"frame": "Complete frame...", "description": "Complete description..."}
          },
          "modelResponses": {
            "emerging": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "developing": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "expanding": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."]
          },
          "teachingNotes": {
            "modelingTips": "Complete tips...",
            "guidedPractice": "Complete practice...",
            "independentUse": "Complete guidance...",
            "fadingStrategy": "Complete strategy..."
          }
        },
        {
          "languageFunction": "Complete function 3...",
          "grammarFocus": ["grammar point 1", "grammar point 2"],
          "tieredFrames": {
            "emerging": {"frame": "Complete frame...", "description": "Complete description..."},
            "developing": {"frame": "Complete frame...", "description": "Complete description..."},
            "expanding": {"frame": "Complete frame...", "description": "Complete description..."}
          },
          "modelResponses": {
            "emerging": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "developing": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."],
            "expanding": ["Complete sentence 1...", "Complete sentence 2...", "Complete sentence 3..."]
          },
          "teachingNotes": {
            "modelingTips": "Complete tips...",
            "guidedPractice": "Complete practice...",
            "independentUse": "Complete guidance...",
            "fadingStrategy": "Complete strategy..."
          }
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