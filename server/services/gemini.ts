import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { stabilityService } from './stability.service';

/**
 * Service for interacting with the Google Gemini AI API
 */
export class GeminiService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Gemini API key is not provided or is empty');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
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
      
      // Configure the model and features
      // Using Gemini 1.5 Flash model per the latest API documentation
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 16384, // Increased token count from 8192 to 16384 for more detailed lessons
        },
      });
      
      console.log('Sending request to Gemini API...');
      
      try {
        // Make the request to the Gemini API
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
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

STEP 0: FOUNDATION ANALYSIS FOR ${params.cefrLevel} LEVEL

Establish the lesson foundation by analyzing "${params.topic}" for ${params.cefrLevel} students:

**COGNITIVE APPROACH:**
${params.cefrLevel === 'A1' ? 'Focus on concrete, observable aspects that students can see, touch, or directly experience' : params.cefrLevel === 'A2' ? 'Focus on personal experiences and simple social interactions related to the topic' : params.cefrLevel === 'B1' ? 'Focus on practical problems and social issues that affect daily life' : params.cefrLevel === 'B2' ? 'Focus on abstract concepts requiring analysis and evaluation' : params.cefrLevel === 'C1' ? 'Focus on sophisticated concepts requiring synthesis and critical thinking' : 'Focus on expert-level analysis with nuanced understanding'}

**VOCABULARY FOUNDATION:**
${params.cefrLevel === 'A1' ? 'Students know basic daily vocabulary (top 1,000 words)' : params.cefrLevel === 'A2' ? 'Students know personal experience vocabulary (top 2,000 words)' : params.cefrLevel === 'B1' ? 'Students know functional language (top 3,000 words)' : params.cefrLevel === 'B2' ? 'Students know academic/professional vocabulary (3,000+ words)' : params.cefrLevel === 'C1' ? 'Students know advanced vocabulary (5,000+ words)' : 'Students know expert-level vocabulary with specialized terminology'}

**TOPIC TREATMENT:**
For "${params.topic}" at ${params.cefrLevel} level, approach through ${params.cefrLevel === 'A1' ? 'basic descriptions and immediate needs' : params.cefrLevel === 'A2' ? 'personal experiences and simple opinions' : params.cefrLevel === 'B1' ? 'practical applications and problem-solving' : params.cefrLevel === 'B2' ? 'analytical discussion and evaluation' : params.cefrLevel === 'C1' ? 'sophisticated analysis and synthesis' : 'expert-level discourse and critical evaluation'}

STEP 1: VOCABULARY SELECTION

**VOCABULARY REQUIREMENTS:**
✓ Genuinely suitable for ${params.cefrLevel} students  
✓ Useful for discussing "${params.topic}"
✓ Can be defined using simpler vocabulary
✓ Provides new communicative ability

${params.cefrLevel === 'A1' ? `**A1 Requirements:** Top 1,000 words, concrete concepts, simple definitions` : params.cefrLevel === 'A2' ? `**A2 Requirements:** Top 2,000 words, personal experience terms, elementary definitions` : params.cefrLevel === 'B1' ? `**B1 Requirements:** Top 3,000 words, functional language, intermediate definitions` : params.cefrLevel === 'B2' ? `**B2 Requirements:** Academic/professional vocabulary, analytical concepts, complex definitions` : params.cefrLevel === 'C1' ? `**C1 Requirements:** Advanced vocabulary, sophisticated concepts, nuanced definitions` : `**C2 Requirements:** Expert vocabulary, specialized terminology, comprehensive definitions`}

**SELECT EXACTLY 5 VOCABULARY WORDS** with proper pronunciation guide (syllables, stressIndex, phoneticGuide using English letters only).

STEP 2: READING TEXT DEVELOPMENT

Create a conversation catalyst text (${params.cefrLevel === 'A1' ? '80-120 words' : params.cefrLevel === 'A2' ? '100-150 words' : params.cefrLevel === 'B1' ? '120-180 words' : params.cefrLevel === 'B2' ? '150-220 words' : '180-250 words'}) about "${params.topic}" that:

✓ Uses vocabulary from Step 1
✓ Generates discussion opportunities  
✓ Connects to students' experiences
✓ Provides clear talking points
✓ Matches ${params.cefrLevel} cognitive level

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

STEP 5: INTEGRATION VALIDATION

✓ Vocabulary appears in reading text and activities
✓ Sentence patterns use selected vocabulary  
✓ Discussion questions reference reading content
✓ All components match ${params.cefrLevel} level
✓ Lesson flows logically from vocabulary to speaking practice

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
For each vocabulary word, create a simple imagePrompt that clearly shows the word meaning:
"An illustration showing [word meaning] in a clear, educational way. No text visible."

EXAMPLES:
- "restaurant" → "An illustration showing a restaurant with people dining. No text visible."
- "excited" → "An illustration showing someone feeling excited and happy. No text visible."
- "compare" → "An illustration showing two items being compared side by side. No text visible."

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
- Determine how to present culturally diverse perspectives at this level
- Consider potential cultural sensitivities related to the lesson topic "${params.topic}"
- Analyze how to balance cultural specificity with universal accessibility

Based on your analysis, ensure your lesson content:
- Presents cultural information at an appropriate complexity level
- Provides necessary cultural context for ${params.cefrLevel} learners
- Offers multiple cultural perspectives when relevant
- Avoids culturally inappropriate content for global classroom use
- Creates authentic but accessible cultural learning opportunities
- Respects diverse backgrounds while expanding cultural awareness

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
    // SENTENCE FRAMES SECTION - GENERATE CUSTOM CONTENT FOR THE TOPIC "${params.topic}"
    // CRITICAL: Replace ALL placeholder text with REAL content. Generate actual examples, patterns, and teaching notes.
    // Do NOT copy the template literally - generate real sentences about ${params.topic}.
    {
      "type": "sentenceFrames", 
      "title": "REPLACE WITH: engaging title about ${params.topic}",
      "introduction": "REPLACE WITH: how these patterns help students discuss ${params.topic}",
      "frames": [
        {
          "patternTemplate": "REPLACE WITH: sentence pattern using _____ blanks for ${params.topic}",
          "languageFunction": "REPLACE WITH: communication purpose for ${params.topic}",
          "title": "REPLACE WITH: clear pattern title for ${params.topic}",
          "level": "${params.cefrLevel.toLowerCase()}",
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
              "inSentenceExample": "I [Opinion Verb] ${params.topic} because..."
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
              "completeSentence": "I love ${params.topic} because it makes me happy.",
              "breakdown": {
                "Opinion Verb": "love",
                "Reason": "it makes me happy"
              }
            },
            {
              "completeSentence": "I appreciate ${params.topic} because it's important.", 
              "breakdown": {
                "Opinion Verb": "appreciate",
                "Reason": "it's important"
              }
            },
            {
              "completeSentence": "I enjoy ${params.topic} because it's interesting.",
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
          ]${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? `,
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
                    "example": "[complete simple sentence about '${params.topic}']",
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
                "[Example sentence using pattern trainer words about '${params.topic}']",
                "[Another example sentence using pattern trainer words about '${params.topic}']"
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
   */
  private async validateAndImproveContent(content: any, params: LessonGenerateParams): Promise<any> {
    try {
      console.log('Starting quality control validation for Gemini content...');
      
      // Check if we have sentence frames that need validation
      if (content.sections) {
        for (let section of content.sections) {
          if (section.type === 'sentenceFrames') {
            // Handle both old and new formats
            if (section.frames && Array.isArray(section.frames)) {
              // New format with frames array
              for (let frame of section.frames) {
                if (frame.examples && Array.isArray(frame.examples)) {
                  const validatedExamples = await this.validateSentenceFrameExamples(
                    frame.examples,
                    frame.pattern || frame.patternTemplate,
                    params.topic
                  );
                  frame.examples = validatedExamples;
                }
              }
            } else if (section.examples && Array.isArray(section.examples)) {
              // Legacy format with examples directly in section
              const validatedExamples = await this.validateSentenceFrameExamples(
                section.examples,
                section.pattern || 'sentence pattern',
                params.topic
              );
              section.examples = validatedExamples;
            }
          }
        }
      }
      
      console.log('Quality control validation completed for Gemini content');
      return content;
    } catch (error) {
      console.error('Error in quality control validation for Gemini:', error);
      return content; // Return original content if validation fails
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

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1, // Low temperature for consistency
          maxOutputTokens: 2000
        }
      });

      const result = await model.generateContent(validationPrompt);
      const response = result.response;
      const text = response.text();

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
   * Format and process the lesson content, adding image data
   */
  private async formatLessonContent(content: any): Promise<any> {
    // Add provider identifier to the content
    const lessonContent = {
      ...content,
      provider: 'gemini'
    };
    
    // Generate images if sections exist
    if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
      console.log('Starting image generation loop for Gemini lesson...');
      for (const section of lessonContent.sections) {
        if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
          console.log(`Found ${section.words.length} vocabulary words, generating images...`);
          for (const word of section.words) {
            // Generate fallback imagePrompt if missing
            if (!word.imagePrompt && word.term) {
              word.imagePrompt = `An illustration showing the meaning of "${word.term}" in a clear, educational way. No text visible in the image.`;
              console.log(`Generated fallback imagePrompt for vocab word: "${word.term}"`);
            }
            
            if (word.imagePrompt) {
               try {
                 // Generate unique ID for logging
                 const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                 word.imageBase64 = await stabilityService.generateImage(word.imagePrompt, requestId);
                 console.log(`Successfully generated image for vocab word: ${word.term}`);
               } catch (imgError) {
                 console.error(`Error generating image for vocab word ${word.term}:`, imgError);
                 word.imageBase64 = null; // Ensure field exists even on error
               }
            } else {
              console.log(`No imagePrompt available for vocab word: "${word.term}"`);
              word.imageBase64 = null; // Ensure field exists
            }
          }
        }
        if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
            console.log(`Found ${section.questions.length} discussion questions, generating images...`);
          for (const question of section.questions) {
            // Debug: Log the actual question structure
            console.log(`Processing discussion question:`, JSON.stringify(question, null, 2));
            
            // Ensure each question has its own paragraphContext
            // This field is already provided in the template - just make sure it's intact
            if (!question.paragraphContext && section.paragraphContext) {
              // If a question is missing individual context but section has a shared one,
              // copy it to the question (happens in some Gemini responses)
              question.paragraphContext = section.paragraphContext;
              console.log("Added section-level paragraphContext to discussion question");
            }
            
            // If still no paragraphContext, look for other fields that might contain it
            if (!question.paragraphContext) {
              if (question.introduction && typeof question.introduction === 'string') {
                // If the introduction field looks like a paragraph (multiple sentences, no question marks)
                // then we store it as paragraphContext for the UI to render properly
                if (question.introduction.includes('.') && !question.introduction.includes('?')) {
                  question.paragraphContext = question.introduction;
                  console.log("Setting paragraphContext from introduction field");
                }
              } else if (question.context && typeof question.context === 'string') {
                question.paragraphContext = question.context;
                console.log("Setting paragraphContext from context field");
              } else if (question.paragraph && typeof question.paragraph === 'string') {
                question.paragraphContext = question.paragraph;
                console.log("Setting paragraphContext from paragraph field");
              }
            }
            
            // Generate fallback imagePrompt if missing
            if (!question.imagePrompt && question.question) {
              question.imagePrompt = `An illustration representing the discussion topic: "${question.question.substring(0, 100)}". The image should be visually engaging and help students think about the topic. No text or words should appear in the image.`;
              console.log(`Generated fallback imagePrompt for question: "${question.question.substring(0, 50)}..."`);
            }
            
            // Generate image if prompt exists
            if (question.imagePrompt) {
               try {
                 // Generate unique ID for logging - use part of question text
                 const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                 console.log(`Requesting image generation for discussion question with prompt: "${question.imagePrompt.substring(0, 100)}..."`);
                 question.imageBase64 = await stabilityService.generateImage(question.imagePrompt, requestId);
                 console.log(`Successfully generated image for discussion question`);
               } catch (imgError) {
                  console.error(`Error generating image for discussion question:`, imgError);
                  question.imageBase64 = null; // Ensure field exists even on error
               }
            } else {
              console.log(`No imagePrompt found for discussion question: "${question.question || 'unknown'}"`);
              question.imageBase64 = null; // Ensure field exists
            }
          }
        }
        // Add loops for other sections needing images if necessary (e.g., warmup)
      }
      console.log('Finished image generation loop for Gemini lesson.');
    } else {
        console.log('No sections found or sections is not an array, skipping image generation.');
    }
    
    return lessonContent;
  }
}

export const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '');