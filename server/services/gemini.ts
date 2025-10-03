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
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
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
      const prompt = this.constructLessonPrompt(params);
      
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

        const text = response.data.choices[0]?.message?.content;
        
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
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // We'll set some variables to match what the system prompt expects
    const targetLevel = cefrLevel;
    const text = topic;
    const minVocabCount = 5;
    const maxVocabCount = 5;
    
    // System instruction part
    const systemInstruction = `You are an expert ESL teacher. 
Follow these EXACT requirements:

CRITICAL: Your output must be properly formatted JSON with NO ERRORS!

SENTENCE FRAMES CRITICAL INSTRUCTION:
When you see template text like "REPLACE WITH: [instruction]" in the sentence frames section, you MUST replace it with actual content, NOT copy the instruction literally. Generate real examples, patterns, and teaching notes about ${params.topic}. The frontend expects real data, not placeholder text.

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER.

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

7. DISCUSSION SECTION REQUIREMENTS:
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

CONTENT APPROPRIATENESS AND ENGAGEMENT VALIDATION

Before finalizing content, verify it meets speaking-lesson requirements:

CONTENT VALIDATION CHECKLIST:
✓ PERSONAL RELEVANCE: Can students connect this to their own experiences or opinions?
✓ DISCUSSION POTENTIAL: Does this content naturally generate questions, reactions, and responses?
✓ OPINION-WORTHY: Are there aspects students can agree/disagree with or have personal views about?
✓ ACCESSIBLE COMPLEXITY: Can students understand this quickly to focus on speaking practice?
✓ CONVERSATION STARTERS: Does this provide clear talking points for pair/group discussions?

STEP 4: SENTENCE FRAME SELECTION

COMMUNICATIVE NEED ANALYSIS FOR ${params.cefrLevel} STUDENTS:

Before selecting sentence patterns, analyze what communication needs ${params.cefrLevel} students actually have:

REAL-WORLD COMMUNICATION NEEDS BY LEVEL:
A1 STUDENTS: Need patterns for immediate, concrete communication
- Expressing basic preferences: "I like ___ because ___"
- Simple descriptions: "___ is ___" 
- Basic needs: "I want/need ___"
- Present actions: "I am ___ing"

A2 STUDENTS: Need patterns for personal experiences and simple social interaction
- Past experiences: "Yesterday I ___ and it was ___"
- Future plans: "I'm going to ___ because ___"
- Simple comparisons: "___ is more ___ than ___"
- Basic opinions: "I think ___ is ___"

B1 STUDENTS: Need patterns for social topics and reasoned communication
- Expressing opinions with reasons: "I believe ___ because ___"
- Problem-solution: "The problem is ___, so we should ___"
- Advantages/disadvantages: "On one hand ___, but on the other hand ___"
- Making suggestions: "We could ___ in order to ___"

B2 STUDENTS: Need patterns for analytical and evaluative communication
- Complex reasoning: "Although ___, ___ nevertheless ___"
- Cause and effect: "___ has led to ___, which in turn ___"
- Evaluation: "While ___ has advantages, it also ___"
- Hypotheticals: "If ___ were to happen, then ___"

C1/C2 STUDENTS: Need patterns for sophisticated analysis and professional communication
- Nuanced arguments: "Despite the fact that ___, it could be argued that ___"
- Academic discourse: "Research suggests that ___, indicating that ___"
- Complex conditionals: "Had ___ not occurred, ___ would likely have ___"

PATTERN SELECTION STRATEGY:
- Choose patterns that enable students to express authentic ideas about "${params.topic}"
- Focus on high-frequency communication functions related to this topic
- Ensure patterns can be used productively in conversations about this topic
- Select patterns that connect the topic to students' experiences and opinions

**Goal:** Develop topic-specific, communicatively valuable sentence patterns that support authentic expression about "${params.topic}" at the ${params.cefrLevel} level.

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

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

DISCUSSION QUESTION VALIDATION CHECKLIST:

Before finalizing questions, verify each meets these criteria:

✓ COGNITIVE MATCH: Does this question match the thinking abilities of ${params.cefrLevel} students?
✓ LINGUISTIC ACCESSIBILITY: Can students understand the question using their current language level?
✓ SCAFFOLDING APPROPRIATENESS: Is the right amount of support provided for this level?
✓ PERSONAL RELEVANCE: Can students connect this to their own experiences or interests?
✓ DISCUSSION POTENTIAL: Will this generate meaningful conversation between students?
✓ SPEAKING PRACTICE VALUE: Does this question encourage extended speaking appropriate to the level?
✓ TOPIC CONNECTION: Does this clearly relate to the lesson content and vocabulary?

AUTOMATIC REJECTION CRITERIA - REJECT QUESTIONS THAT:
❌ Require language skills above the students' level to answer meaningfully
❌ Are too abstract for students to relate to their experiences
❌ Can be answered with simple yes/no without encouraging elaboration
❌ Assume cultural knowledge students may not have
❌ Are too complex cognitively for the developmental stage
❌ Don't provide enough context for students to engage meaningfully
❌ Are generic and could apply to any topic (not specifically about "${params.topic}")

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

STEP 6: CROSS-COMPONENT INTEGRATION & FINAL VALIDATION

CRITICAL: Before finalizing your lesson, you MUST perform explicit cross-component integration analysis to ensure vocabulary, reading text, and discussion questions work together synergistically.

VOCABULARY-TEXT INTEGRATION ANALYSIS:
Analyze how target vocabulary integrates with the reading text:

✓ NATURAL INTEGRATION CHECK: Does each target vocabulary word appear naturally in the reading text (not forced or artificially inserted)?
✓ CONTEXTUAL SUPPORT: Does the text provide sufficient context clues to help students understand the vocabulary in meaningful situations?
✓ USAGE VARIETY: Are vocabulary words used in different contexts within the text to show versatility?
✓ PREREQUISITE VOCABULARY: Does the text include necessary supporting vocabulary to make target words comprehensible?
✓ TOPIC COHERENCE: Do all vocabulary choices genuinely support and enhance the topic "${params.topic}"?

TEXT-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions connect to the reading text:

✓ CONTENT DEPENDENCY: Do discussion questions require genuine understanding of the text content to answer effectively?
✓ TOPIC EXTENSION: Do questions naturally extend text topics into meaningful personal or analytical discussions?
✓ COMPREHENSION FOUNDATION: Are questions built on information and ideas presented in the text?
✓ COGNITIVE PROGRESSION: Do questions appropriately build on text complexity for ${params.cefrLevel} level thinking?
✓ ENGAGEMENT BRIDGE: Do questions create natural bridges from text content to student experiences and opinions?

VOCABULARY-DISCUSSION INTEGRATION ANALYSIS:
Analyze how discussion questions incorporate target vocabulary:

✓ VOCABULARY USAGE OPPORTUNITIES: Do discussion questions provide natural opportunities for students to USE target vocabulary in their responses?
✓ CONTEXTUAL REINFORCEMENT: Do questions require students to demonstrate understanding of vocabulary in new contexts?
✓ SPEAKING PRACTICE: Would students naturally incorporate target vocabulary when answering these questions?
✓ SCAFFOLDED APPLICATION: Do questions appropriately scaffold vocabulary usage for ${params.cefrLevel} level students?
✓ MEANINGFUL COMMUNICATION: Do vocabulary usage opportunities feel authentic rather than mechanical?

SYNERGISTIC LEARNING FLOW ANALYSIS:
Analyze the overall learning experience across all components:

✓ CONTENT COHERENCE: Do all components (vocabulary, text, discussion) support the same learning objectives for "${params.topic}"?
✓ DIFFICULTY ALIGNMENT: Are all components appropriately leveled for ${params.cefrLevel} students?
✓ REINFORCEMENT PATTERNS: Do components reinforce each other's content naturally?
✓ PEDAGOGICAL SEQUENCE: Do components create an effective learning progression (vocabulary → text → discussion)?
✓ AUTHENTIC CONNECTIONS: Do component relationships feel natural rather than artificially constructed?

INTEGRATION QUALITY VALIDATION:
Before proceeding, confirm your lesson achieves:
- Target vocabulary appears meaningfully in text AND discussion contexts
- Discussion questions genuinely require text comprehension to answer
- Students will naturally use vocabulary when responding to discussion questions
- All components work together to create a cohesive learning experience about "${params.topic}"
- The learning flow from vocabulary → text → discussion feels natural and educationally sound

REJECTION CRITERIA - REJECT LESSONS WHERE:
❌ Vocabulary appears forced or artificially inserted into text
❌ Discussion questions could be answered without reading the text
❌ Students could answer discussion questions without using target vocabulary
❌ Components feel disconnected or only superficially related
❌ The lesson lacks a coherent learning progression

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
    // PEDAGOGICAL SENTENCE FRAMES (v2) - Research-Backed Tiered Scaffolding
    // Following best practices: tiered by proficiency, purpose-driven, with model responses
    // Based on Vygotsky's ZPD and Gradual Release of Responsibility model
    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical", 
      "title": "Structured Language Practice for ${params.topic}",
      "introduction": "These scaffolded sentence frames help you express ideas about ${params.topic} with increasing complexity. Choose the level that challenges you appropriately.",
      "pedagogicalFrames": [
        {
          "languageFunction": "Describing and Explaining ${params.topic}",
          "grammarFocus": [
            "Subject-verb agreement",
            "Because-clauses for causation", 
            "Present simple for general truths"
          ],
          "tieredFrames": {
            "emerging": {
              "frame": "${params.topic} is _____.",
              "description": "Simple description - state basic facts or observations"
            },
            "developing": {
              "frame": "I think ${params.topic} is _____ because _____.",
              "description": "Add your opinion with a reason - connect ideas using 'because'"
            },
            "expanding": {
              "frame": "I can infer that ${params.topic} is _____, since _____.",
              "description": "Make inferences and justify - use 'since' to show sophisticated reasoning"
            }
          },
          "modelResponses": {
            "emerging": [
              "${params.topic.charAt(0).toUpperCase() + params.topic.slice(1)} is interesting.",
              "${params.topic.charAt(0).toUpperCase() + params.topic.slice(1)} is important to many people.",
              "${params.topic.charAt(0).toUpperCase() + params.topic.slice(1)} is common in modern life."
            ],
            "developing": [
              "I think ${params.topic} is fascinating because it affects our daily routines.",
              "I believe ${params.topic} is valuable because it connects people across distances.",
              "I think ${params.topic} is complex because it involves many different factors."
            ],
            "expanding": [
              "I can infer that ${params.topic} is transformative, since it has changed how we communicate with each other.",
              "I would argue that ${params.topic} is essential in contemporary society, since most professional work now depends on it.",
              "One could deduce that ${params.topic} is a double-edged phenomenon, since it brings both benefits and challenges to users."
            ]
          },
          "teachingNotes": {
            "modelingTips": "Model each tier explicitly. Show students how the sentence structure becomes more complex at each level. Think aloud about your word choices and how you build the reasoning.",
            "guidedPractice": "Practice collaboratively in pairs. Have students try the emerging frame first, then progress to developing. Use 'Turn and Talk' to rehearse before sharing with the class.",
            "independentUse": "Students choose their level of support. Post frames on the board for reference. Encourage students to attempt the expanding frame even if challenging - scaffold as needed.",
            "fadingStrategy": "Gradually make frames optional rather than required. Track when students can produce similar structures independently. Withdraw scaffold when students consistently succeed without it."
          }
        },
        {
          "languageFunction": "Comparing Aspects of ${params.topic}",
          "grammarFocus": [
            "Comparative structures",
            "Transition words (like, however, whereas)",
            "Parallel structure"
          ],
          "tieredFrames": {
            "emerging": {
              "frame": "_____ and _____ both have _____.",
              "description": "Identify one simple similarity between two things"
            },
            "developing": {
              "frame": "Like _____, _____ also contains _____. However, _____ differs in that _____.",
              "description": "Show both similarity and difference using transition words"
            },
            "expanding": {
              "frame": "While _____ and _____ share _____, the key distinction lies in _____.",
              "description": "Present nuanced comparison with sophisticated subordination"
            }
          },
          "modelResponses": {
            "emerging": [
              "Traditional methods and modern approaches both have advantages.",
              "${params.topic.charAt(0).toUpperCase() + params.topic.slice(1)} and older systems both have users.",
              "Online and offline versions both have their place."
            ],
            "developing": [
              "Like traditional methods, modern ${params.topic} also contains core principles. However, modern approaches differ in that they incorporate technology.",
              "Like earlier versions, current ${params.topic} also contains the same basic purpose. However, it differs in that it reaches a global audience.",
              "Like face-to-face interaction, ${params.topic} also contains elements of human connection. However, it differs in that it removes physical presence."
            ],
            "expanding": [
              "While traditional and digital forms of ${params.topic} share the fundamental goal of communication, the key distinction lies in the immediacy and scale of reach that digital platforms provide.",
              "While ${params.topic} and conventional methods share certain benefits, the key distinction lies in how each approach manages time and accessibility constraints.",
              "While both emerging and established aspects of ${params.topic} share similar user bases, the key distinction lies in the level of technological literacy required for engagement."
            ]
          },
          "teachingNotes": {
            "modelingTips": "Display examples side by side. Highlight the transition words and show how sentence complexity increases. Point out how 'while' creates subordination in the expanding frame.",
            "guidedPractice": "Create a Venn diagram together as a class about ${params.topic}. Use the visual to practice the frames orally before writing. Partners practice filling frames with their own ideas.",
            "independentUse": "Students write comparisons independently, choosing their frame level. Provide sentence starters on sticky notes or in notebooks for easy reference during writing tasks.",
            "fadingStrategy": "First make frame selection optional. Then provide only the transition words. Finally, remove all support and monitor if students maintain the comparison structure independently."
          }
        },
        {
          "languageFunction": "Explaining Processes Related to ${params.topic}",
          "grammarFocus": [
            "Sequence markers (first, then, finally)",
            "Purpose clauses (in order to)",
            "Past tense for completed actions"
          ],
          "tieredFrames": {
            "emerging": {
              "frame": "First, I _____. Then, I _____. Finally, I _____.",
              "description": "List steps in simple sequence"
            },
            "developing": {
              "frame": "I solved this by _____. After that, I _____.",
              "description": "Explain your method with temporal connections"
            },
            "expanding": {
              "frame": "My first step was to _____. Then I _____, in order to _____. To achieve the result, I _____.",
              "description": "Articulate complex process with purpose clauses"
            }
          },
          "modelResponses": {
            "emerging": [
              "First, I open the application. Then, I enter my information. Finally, I click submit.",
              "First, I read the instructions. Then, I gather materials. Finally, I complete the task.",
              "First, I check the requirements. Then, I prepare my response. Finally, I review everything."
            ],
            "developing": [
              "I solved this by researching ${params.topic} online. After that, I compared different perspectives.",
              "I approached ${params.topic} by starting with basic concepts. After that, I explored more advanced applications.",
              "I engaged with ${params.topic} by observing real examples. After that, I practiced applying the principles."
            ],
            "expanding": [
              "My first step was to identify the core components of ${params.topic}. Then I analyzed each element carefully, in order to understand their relationships. To achieve a comprehensive understanding, I synthesized the information into a coherent framework.",
              "My initial approach was to examine how ${params.topic} functions in practice. Then I studied the underlying principles, in order to grasp the theoretical foundation. To reach my conclusion, I integrated both practical and theoretical perspectives.",
              "My first step was to gather diverse sources about ${params.topic}. Then I evaluated their credibility, in order to ensure reliable information. To form my analysis, I compared the key findings and drew evidence-based conclusions."
            ]
          },
          "teachingNotes": {
            "modelingTips": "Model the process explanation while performing an action. Use gestures to show sequence. Emphasize how 'in order to' adds purpose in the expanding frame.",
            "guidedPractice": "Students work in groups to explain a simple process about ${params.topic} using the frames. Each group member uses a different tier. Groups present to class.",
            "independentUse": "Students write individual process explanations. Frames remain visible for reference but become optional. Encourage trying the expanding frame even if it's challenging.",
            "fadingStrategy": "Remove frames but keep sequence markers visible. Then remove markers too. Monitor if students independently use temporal/purpose language when explaining processes."
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

Ensure the entire output is a single, valid JSON object starting with { and ending with }.`;

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
    const testService = new GeminiService(process.env.OPENROUTER_API_KEY || '');
    if (!testService.apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return false;
    }

    const testRequest = {
      model: 'x-ai/grok-4-fast',
      messages: [{ role: 'user', content: 'Hello, can you respond with just "OK"?' }],
      max_tokens: 10
    };

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      testRequest,
      {
        headers: {
          'Authorization': `Bearer ${testService.apiKey}`,
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