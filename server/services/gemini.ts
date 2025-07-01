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
    const systemInstruction = `# ESL Lesson Generation Prompt - Comprehensive Improved Version

You are an expert ESL teacher creating high-quality, speaking-focused lessons. Follow these requirements systematically:

## CRITICAL TECHNICAL REQUIREMENTS

**JSON Format**: Your output must be properly formatted JSON with NO ERRORS!

**Array Requirements**: 
- EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
- ✅ CORRECT: \`"paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]\`
- ❌ WRONG: \`"paragraphs": 5\`
- ✅ CORRECT: \`"questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]\`
- ❌ WRONG: \`"questions": ["Question 1"], "Question 2": "Question 3"\`

**Vocabulary Requirements**: Include EXACTLY ${minVocabCount} vocabulary items. Each MUST include the 'pronunciation' object with 'syllables', 'stressIndex', and 'phoneticGuide' fields. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

**Topic Focus**: ALL content must be specifically about ${params.topic} at ${params.cefrLevel} level.

**TopicEssential Flag Usage**: Use topicEssential: true ONLY for words that are outside typical CEFR frequency ranges but absolutely necessary for meaningful discussion of "${params.topic}". Most vocabulary should have topicEssential: false. Reserve true for specialized terms that students need specifically for this topic but wouldn't normally encounter at their level.

**Sentence Frames Critical Instruction**: When you see template text like "REPLACE WITH: [instruction]" in sentence frames, you MUST replace it with actual content, NOT copy the instruction literally. Generate real examples, patterns, and teaching notes about ${params.topic}.

${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' 
  ? `**Scaffolding Requirement**: Since this is ${params.cefrLevel} level, you MUST include "lowerLevelScaffolding" in each sentence frame with simplified explanations and additional support.`
  : `**No Scaffolding**: Since this is ${params.cefrLevel} level, do NOT include "lowerLevelScaffolding" in sentence frames. Advanced learners don't need this additional support.`}

## COMPREHENSIVE CEFR LEVEL ANALYSIS

### Foundation Knowledge Analysis by Level:

**A1 Students Know**: Basic family, food, colors, numbers, simple present tense, essential survival vocabulary (house, clothes, body parts, basic actions)

**A2 Students Know**: A1 + basic past tense, common adjectives, simple descriptions, personal experiences vocabulary (interesting, boring, excited, yesterday, tomorrow)

**B1 Students Know**: A1/A2 + present perfect, opinions, comparisons, everyday topics, functional language (community, environment, although, however, opinion)

**B2 Students Know**: A1/A2/B1 + academic thinking, complex discussions, abstract concepts, discourse markers (sustainability, efficiency, infrastructure, furthermore)

**C1 Students Know**: A1-B2 + advanced academic language, nuanced expression, specialized vocabulary (implications, comprehensive, predominantly, nevertheless)

**C2 Students Know**: Near-native vocabulary range including idiomatic and specialized language (nuanced, paradigm, intrinsic, contemporary discourse)

### Vocabulary Appropriateness Standards:

**TOO ADVANCED for ${params.cefrLevel}**:
- A1: Abstract concepts, complex grammar constructions, specialized terms, academic language
- A2: Academic vocabulary, complex discourse markers, abstract philosophical concepts  
- B1: Highly academic vocabulary, complex phrasal verbs, advanced idiomatic expressions
- B2: Specialized technical terms, advanced literary language, highly formal register
- C1: Archaic or highly specialized jargon, extremely formal academic discourse

**APPROPRIATE NEW VOCABULARY for ${params.cefrLevel}**:
- A1: Concrete, immediate needs vocabulary students can see/touch/experience
- A2: Personal experiences and descriptions, basic social interaction vocabulary
- B1: Social topics and functional language, community-relevant vocabulary  
- B2: Academic-adjacent language for deeper exploration, analytical discussion vocabulary
- C1: Sophisticated concepts for advanced discourse and professional discussion
- C2: Advanced/specialized terminology for expert-level conversation

### Text Complexity Guidelines:

**Speaking-Optimized Text Length by Level**:
- **A1**: 80-120 words (2-3 short paragraphs) - Quick to read, maximum time for speaking practice
- **A2**: 100-150 words (2-3 paragraphs) - Manageable length allowing focus on conversation  
- **B1**: 120-180 words (3 paragraphs) - Balanced content providing discussion material
- **B2**: 150-220 words (3-4 paragraphs) - Rich content for analytical discussion
- **C1/C2**: 180-250 words (3-4 paragraphs) - Sophisticated content meriting extended discussion

**Grammar Complexity by Level**:
- **A1**: Simple present/past, basic sentence structures, concrete descriptions
- **A2**: Basic past tense, simple future, personal experience language
- **B1**: Present perfect, opinion expressions, reason-giving language (because, although)
- **B2**: Complex tenses, conditional structures, analytical language
- **C1/C2**: Advanced grammatical structures, sophisticated discourse markers, nuanced expression

### Question Complexity Framework:

**Cognitive Engagement Analysis by Level**:

**A1 Students** can engage with:
- Immediate, concrete experiences they can relate to personally
- Personal situations, daily activities, familiar objects and people  
- Simple cause-and-effect relationships they experience directly
- Basic problem-solution scenarios from everyday life

**A2 Students** can engage with:
- Personal experiences and simple social situations
- Past experiences, future plans, personal opinions about familiar topics
- Simple comparisons between different places, people, or experiences
- Basic cultural or social topics they encounter in daily life

**B1 Students** can engage with:
- Social issues and practical problems that affect their lives
- Community issues, lifestyle choices, personal challenges and solutions
- Comparing different approaches to common problems  
- Topics where they can express opinions and give reasons

**B2 Students** can engage with:
- Analytical thinking about complex social and professional topics
- Abstract concepts they can relate to their experiences
- Multiple perspectives on contemporary issues
- Topics requiring evaluation and critical thinking

**C1 Students** can engage with:
- Sophisticated analysis and nuanced discussion
- Complex social, academic, or professional issues
- Subtle distinctions and implied meanings
- Topics requiring synthesis of multiple ideas and perspectives

**C2 Students** can engage with:
- Highly sophisticated and specialized content
- Expert-level discussions with nuanced argumentation  
- Complex interdisciplinary connections
- Topics requiring deep critical analysis and evaluation

## SYSTEMATIC DEVELOPMENT PROCESS

### STEP 1: TOPIC DIFFERENTIATION ANALYSIS

**Critical Topic Analysis for "${params.topic}" at ${params.cefrLevel} Level**:

Before creating any content, analyze how "${params.topic}" should be treated specifically for ${params.cefrLevel} students:

1. **Cognitive Appropriateness**: What aspects of "${params.topic}" match the thinking abilities of ${params.cefrLevel} students?

2. **Vocabulary Domain Selection**: Which vocabulary domains within "${params.topic}" are appropriate for THIS level but NOT lower levels?

3. **Conceptual Complexity**: How should the conceptual approach to "${params.topic}" be calibrated for ${params.cefrLevel} level?

4. **Real-World Connection**: How does this topic connect to the life experiences and communication needs of ${params.cefrLevel} students?

**Topic Differentiation Strategy**:
- Focus on sub-aspects of "${params.topic}" specifically appropriate for ${params.cefrLevel} level
- Select vocabulary that demonstrates clear progression from lower levels
- Approach the topic from a cognitive perspective matching this specific developmental stage
- Ensure clear differentiation from how this topic would be taught at other CEFR levels

This ensures lessons on the same topic at different levels are substantially different in vocabulary selection, question complexity, conceptual approach, and content focus.

### STEP 2: SPEAKING-FOCUSED DESIGN ANALYSIS

**Text Purpose Analysis**:
This text serves as a CONVERSATION CATALYST, not comprehensive reading practice. Students will use this text to GENERATE SPEAKING opportunities about "${params.topic}".

**Content Validation Requirements**:
✓ **Personal Relevance**: Can students connect this to their own experiences or opinions?
✓ **Discussion Potential**: Does this content naturally generate questions, reactions, and responses?  
✓ **Opinion-Worthy**: Are there aspects students can agree/disagree with or have personal views about?
✓ **Accessible Complexity**: Can students understand this quickly to focus on speaking practice?
✓ **Conversation Starters**: Does this provide clear talking points for pair/group discussions?

**Rejection Criteria** - Avoid content that:
❌ Is purely informational without discussion potential
❌ Requires extensive reading comprehension that dominates lesson time
❌ Is too abstract or distant from students' experiences to generate authentic responses
❌ Provides facts without opportunities for personal reaction or opinion
❌ Is too complex for students to quickly process and then discuss

### STEP 3: VOCABULARY SELECTION & VALIDATION

**Vocabulary Selection Strategy by Level**:

**A1/A2 Levels** - Choose vocabulary for:
- Concrete, observable aspects of "${params.topic}" that students can see/touch/experience
- Personal experiences and basic descriptions related to the topic
- Essential functional language for basic communication about the topic

**B1 Level** - Choose vocabulary for:
- Social aspects and practical applications of "${params.topic}"
- Functional language for expressing opinions and making comparisons
- Community-relevant vocabulary connecting to students' social experiences

**B2 Level** - Choose vocabulary for:
- Analytical and evaluative discussion of "${params.topic}"  
- Academic-adjacent language for deeper exploration
- Vocabulary enabling critical thinking and complex reasoning

**C1/C2 Levels** - Choose vocabulary for:
- Sophisticated analysis and professional discussion of "${params.topic}"
- Nuanced terminology for advanced discourse
- Specialized vocabulary for expert-level conversation

**Vocabulary Validation Checklist**:
For EACH vocabulary word, verify it meets ALL criteria:

✓ **Level Appropriateness**: Is this word genuinely appropriate for ${params.cefrLevel} students based on frequency and cognitive complexity?
✓ **Foundation Check**: Do students at this level have the foundational vocabulary to understand this word's definition?
✓ **Communicative Value**: Will ${params.cefrLevel} students actually need this word in real communication about "${params.topic}"?
✓ **Topic Relevance**: Is this word directly relevant to discussing "${params.topic}" rather than just peripherally related?
✓ **Definition Feasibility**: Can this word be defined using vocabulary one level below the target level?

**Automatic Rejection Criteria**:
❌ Words above the cognitive/linguistic level of ${params.cefrLevel} students
❌ Words requiring vocabulary students don't know to understand the definition  
❌ Words too specialized or technical for general ${params.cefrLevel} communication needs
❌ Words rarely used in authentic communication at this level
❌ Words that would appear in lessons one level below with the same meaning and usage

**SEMANTIC COHERENCE AND GROUPING**

Select vocabulary that works together meaningfully:

**SEMANTIC COHERENCE REQUIREMENTS**:
1. Choose words that form logical, functional groups within the topic
2. Ensure words can be used together in meaningful communication
3. Create vocabulary sets that enable comprehensive topic discussion
4. Consider word relationships (synonyms, antonyms, word families)

**FUNCTIONAL GROUPING EXAMPLES**:
A1 Transportation: [car, bus, walk] + [fast, slow] + [go, stop, wait]
→ Enables: "I go by bus. The bus is slow. I wait for the bus."

B1 Transportation: [commute, public transport, traffic] + [convenient, reliable, crowded] + [however, although, because]
→ Enables: "I commute by public transport. However, it's often crowded because many people use it."

B2 Transportation: [infrastructure, sustainability, urban planning] + [efficient, environmentally-friendly, cost-effective] + [furthermore, consequently, therefore]
→ Enables: "Urban planning affects transportation infrastructure. Consequently, cities need sustainable and cost-effective solutions."

**COHERENCE VALIDATION**:
✓ Can students combine these words to discuss the topic meaningfully?
✓ Do the words represent different aspects/dimensions of the topic?
✓ Are there enough words to enable substantial communication about the topic?
✓ Do the words progress logically from concrete to abstract (appropriate for level)?

## TONE & STYLE APPROACH:
First, analyze appropriate tone and style considerations for ${params.cefrLevel} level:
- Research how tone and register should be adjusted for ${params.cefrLevel} level learners
- Identify appropriate language complexity, sentence structure, and vocabulary choices for this level
- Determine the optimal balance between authenticity and accessibility
- Consider how the topic "${params.topic}" influences appropriate tone and style
- Analyze engagement strategies that work best for this proficiency level and topic

Based on your analysis, develop a tone and style that:
- Is most effective for ${params.cefrLevel} level language comprehension
- Creates appropriate engagement for the specific topic "${params.topic}"
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
First, analyze how the topic "${params.topic}" should be treated differently across CEFR levels:
- Research how the complexity and focus of topic treatment evolves from A1 to C2
- Identify specific aspects of the topic appropriate for ${params.cefrLevel} level
- Determine which vocabulary domains within this topic are level-appropriate
- Consider how conceptual complexity should increase with higher levels

For "${params.topic}" at ${params.cefrLevel} level specifically:
- Identify 3-5 unique aspects or sub-topics that are specifically appropriate for this level
- Determine which vocabulary domains are appropriate for THIS level but NOT lower levels
- Consider which cognitive approaches to the topic match this specific level
- Identify conceptual complexity appropriate specifically for ${params.cefrLevel}

Based on your analysis, create a unique approach to "${params.topic}" for ${params.cefrLevel} level by:
- Focusing on the sub-aspects most appropriate for this specific level
- Selecting vocabulary that would NOT be taught at lower levels
- Approaching the topic from a cognitive perspective matching this level
- Ensuring clear differentiation from how this topic would be taught at other levels

This approach should ensure that lessons on the same topic at different CEFR levels are substantially different in:
- Vocabulary selection
- Question complexity and type
- Conceptual approach
- Content focus and examples

ENHANCED STYLE APPROACH:
First, analyze writing style characteristics of exemplary language teaching materials:
- Study highly engaging ESL materials at ${params.cefrLevel} level
- Identify what makes certain materials more engaging than others
- Research the balance between authenticity and accessibility
- Determine style patterns that increase student motivation and interest

Based on your analysis, develop a writing style for "${params.topic}" at ${params.cefrLevel} level that:
- Has a clear, consistent voice throughout the lesson
- Uses language patterns that model natural, native-like expression
- Incorporates appropriate humor, warmth, or formality based on topic and level
- Avoids "textbook language" that feels artificial or overly simplified
- Creates genuine interest through vivid, specific language
- Uses varied sentence structures appropriate for the level
- Maintains an authentic voice while remaining level-appropriate

Avoid these common stylistic issues:
- Generic, predictable phrasing that feels template-based
- Overly formal academic tone when inappropriate for the topic
- Overly simple language that doesn't challenge students appropriately
- Inconsistent voice across different sections
- Repetitive sentence structures or vocabulary
- Awkward phrasing that doesn't reflect how native speakers express ideas

Instead, create content with:
- Natural flow and cohesion between ideas
- Appropriate contextual examples that feel relevant and contemporary
- Language that demonstrates personality and engagement with the topic
- A balance of concrete and abstract concepts appropriate to the level
- Stylistic choices that would engage adult learners intellectually

QUESTION QUALITY IMPROVEMENT APPROACH:
First, analyze what constitutes high-quality questions for ${params.cefrLevel} level:
- Research question taxonomies (Bloom's, DOK) appropriate for this level
- Identify question types that stimulate meaningful language production
- Determine markers of high-quality vs. low-quality questions
- Study question formulation techniques used by expert language teachers

For discussion questions, ensure each question:
- Has clear purpose and language learning objectives
- Elicits more than one-word or yes/no responses
- Connects to students' experiences while remaining culturally inclusive
- Builds on vocabulary/concepts from the lesson
- Avoids vague, obvious, or simplistic formulations ("What did it look like?")
- Encourages critical thinking appropriate to the level
- Is genuinely interesting to discuss

For comprehension questions, ensure each question:
- Tests specific comprehension skills appropriate for ${params.cefrLevel}
- Requires genuine understanding rather than just recognizing words
- Progresses from literal to interpretive to applied understanding
- Focuses on meaningful content rather than trivial details
- Uses question stems appropriate for the cognitive level
- Avoids ambiguity or multiple possible correct answers

Apply these quality standards to generate questions that:
- Engage students intellectually at their appropriate level
- Provide meaningful language practice opportunities
- Demonstrate careful thought and authentic curiosity
- Serve clear pedagogical purposes
- Would be asked by experienced language educators

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

### STEP 4: ENHANCED QUESTION DEVELOPMENT

**Question Quality Framework**:

**High-Quality Discussion Questions Must**:
- Have clear purpose and language learning objectives
- Elicit more than one-word or yes/no responses
- Connect to students' experiences while remaining culturally inclusive
- Build on vocabulary/concepts from the lesson
- Avoid vague, obvious, or simplistic formulations
- Encourage critical thinking appropriate to the level
- Be genuinely interesting to discuss

**Question Development by Cognitive Level**:

**A1 Students** - Create questions that:
- Focus on immediate, personal experiences students can easily relate to
- Use simple present and past tense structures  
- Ask about concrete situations and basic preferences
- Provide enough context to guide responses

**A2 Students** - Create questions that:
- Connect personal experiences to simple social situations
- Use past tense and basic future forms appropriately
- Ask for simple comparisons and opinions
- Include cultural and social topics within their experience range

**B1 Students** - Create questions that:
- Address social issues and practical problems they encounter
- Require opinion-giving with basic reasoning
- Ask for advantages/disadvantages of different approaches
- Connect to community and lifestyle topics

**B2 Students** - Create questions that:
- Require analytical thinking about complex social and professional topics
- Ask for evaluation of different perspectives  
- Include abstract concepts students can connect to their experiences
- Encourage critical thinking and multiple viewpoint consideration

**C1 Students** - Create questions that:
- Require sophisticated analysis and nuanced discussion
- Ask for synthesis of multiple ideas and perspectives
- Include complex social, academic, or professional issues
- Encourage handling of subtle distinctions and implied meanings

**C2 Students** - Create questions that:
- Require expert-level discussions with nuanced argumentation
- Ask for complex interdisciplinary connections
- Include highly sophisticated concepts requiring deep critical analysis
- Encourage handling of subtle cultural and contextual nuances

**Discussion Context Requirements**:
- CRITICAL: Each discussion question MUST have its own unique paragraph context (paragraphContext field)
- These paragraph contexts must be 3-5 sentences providing background information
- Paragraph contexts must use vocabulary and sentence structures appropriate for ${params.cefrLevel} level
- Paragraphs should include interesting information that helps students engage with the topic
- Paragraph contexts should lead naturally into the discussion question that follows

### STEP 5: SENTENCE FRAME DEVELOPMENT

**Communicative Need Analysis for ${params.cefrLevel} Students**:

**Real-World Communication Patterns by Level**:

**A1 Students** need patterns for immediate, concrete communication:
- Expressing basic preferences: "I like ___ because ___"
- Simple descriptions: "___ is ___"
- Basic needs: "I want/need ___"
- Present actions: "I am ___ing"

**A2 Students** need patterns for personal experiences and simple social interaction:
- Past experiences: "Yesterday I ___ and it was ___"
- Future plans: "I'm going to ___ because ___"  
- Simple comparisons: "___ is more ___ than ___"
- Basic opinions: "I think ___ is ___"

**B1 Students** need patterns for social topics and reasoned communication:
- Expressing opinions with reasons: "I believe ___ because ___"
- Problem-solution: "The problem is ___, so we should ___"
- Advantages/disadvantages: "On one hand ___, but on the other hand ___"
- Making suggestions: "We could ___ in order to ___"

**B2 Students** need patterns for analytical and evaluative communication:
- Complex reasoning: "Although ___, ___ nevertheless ___"
- Cause and effect: "___ has led to ___, which in turn ___"
- Evaluation: "While ___ has advantages, it also ___"
- Hypotheticals: "If ___ were to happen, then ___"

**C1/C2 Students** need patterns for sophisticated analysis and professional communication:
- Nuanced arguments: "Despite the fact that ___, it could be argued that ___"
- Academic discourse: "Research suggests that ___, indicating that ___"
- Complex conditionals: "Had ___ not occurred, ___ would likely have ___"

**Pattern Selection Strategy**:
- Choose patterns enabling students to express authentic ideas about "${params.topic}"
- Focus on high-frequency communication functions related to this topic
- Ensure patterns can be used productively in conversations about "${params.topic}"
- Select patterns connecting the topic to students' experiences and opinions

### STEP 6: COMPREHENSIVE INTEGRATION & VALIDATION

**Cross-Component Integration Analysis**:

**Vocabulary-Text Integration**:
✓ Do vocabulary words appear naturally in the reading text?
✓ Does the reading text provide meaningful context for vocabulary usage?
✓ Can students use vocabulary words when discussing the reading text?
✓ Are vocabulary definitions supported by examples in the reading text?

**Text-Discussion Integration**:
✓ Do discussion questions build naturally from reading text content?
✓ Can students reference specific parts of the text when answering questions?
✓ Do questions encourage students to go beyond the text while staying connected to it?
✓ Does the text provide sufficient background for meaningful discussion?

**Vocabulary-Discussion Integration**:
✓ Will students naturally use vocabulary words when answering discussion questions?
✓ Do discussion topics require and encourage vocabulary usage?
✓ Can students demonstrate vocabulary mastery through discussion responses?
✓ Do sentence frames incorporate vocabulary words naturally?

**Holistic Lesson Coherence**:
✓ Does every component support the central learning objectives?
✓ Is there logical progression from vocabulary → reading → comprehension → discussion?
✓ Would a teacher see clear connections between all lesson parts?
✓ Does the lesson feel unified around "${params.topic}" rather than like separate activities?

## STYLE & TONE DEVELOPMENT

**Enhanced Style Analysis**:

First, analyze writing style characteristics of exemplary language teaching materials:
- Study highly engaging ESL materials at ${params.cefrLevel} level
- Identify what makes certain materials more engaging than others
- Research the balance between authenticity and accessibility
- Determine style patterns that increase student motivation and interest

**Develop writing style for "${params.topic}" at ${params.cefrLevel} level that**:
- Has a clear, consistent voice throughout the lesson
- Uses language patterns that model natural, native-like expression
- Incorporates appropriate humor, warmth, or formality based on topic and level
- Avoids "textbook language" that feels artificial or overly simplified
- Creates genuine interest through vivid, specific language
- Uses varied sentence structures appropriate for the level
- Maintains an authentic voice while remaining level-appropriate

**Avoid these stylistic issues**:
- Generic, predictable phrasing that feels template-based
- Overly formal academic tone when inappropriate for the topic
- Overly simple language that doesn't challenge students appropriately
- Inconsistent voice across different sections
- Repetitive sentence structures or vocabulary
- Awkward phrasing that doesn't reflect how native speakers express ideas

**Create content with**:
- Natural flow and cohesion between ideas
- Appropriate contextual examples that feel relevant and contemporary
- Language that demonstrates personality and engagement with the topic
- Balance of concrete and abstract concepts appropriate to the level
- Stylistic choices that would engage adult learners intellectually

## FINAL VALIDATION CHECKLIST

**Technical Requirements**:
✓ Valid JSON format with no syntax errors
✓ Exactly ${minVocabCount} complete vocabulary items with all required fields including pronunciation
✓ All arrays contain full content, not numbers or placeholders
✓ All content specifically about "${params.topic}"
${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' 
  ? '✓ "lowerLevelScaffolding" included in all sentence frames'
  : '✓ "lowerLevelScaffolding" NOT included (advanced level)'}

**Content Quality**:
✓ Vocabulary genuinely appropriate for ${params.cefrLevel} (not too easy or difficult)
✓ Text length matches level guidelines and serves as conversation catalyst
✓ Discussion questions match cognitive abilities of ${params.cefrLevel} students
✓ Each discussion question has its own 3-5 sentence context paragraph
✓ Reading comprehension questions test meaningful understanding
✓ Sentence frames address real communication needs for this level

**Integration Quality**:
✓ Vocabulary appears naturally in reading text
✓ Discussion questions build from reading content
✓ Students will use vocabulary when answering questions
✓ All components work together cohesively around "${params.topic}"

## JSON OUTPUT STRUCTURE

\`\`\`json
{
  "title": "Engaging title about ${params.topic}",
  "level": "${params.cefrLevel}",
  "focus": "${params.focus}",
  "estimatedTime": ${params.lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Discussion",
      "content": {
        "instructions": "Begin by discussing the following questions with a partner or in small groups.",
        "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
        "questions": [
          "Question 1 about ${params.topic}",
          "Question 2 about ${params.topic}",
          "Question 3 about ${params.topic}"
        ]
      }
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "content": {
        "words": [
          {
            "word": "word1",
            "definition": "Clear definition using simpler vocabulary",
            "exampleSentence": "Natural example sentence using the word",
            "synonyms": ["synonym1", "synonym2"],
            "difficulty": "${params.cefrLevel}",
            "pronunciation": {
              "syllables": ["syl", "la", "bles"],
              "stressIndex": 0,
              "phoneticGuide": "fo-NET-ik"
            },
            "topicEssential": false
          }
          // MUST include exactly ${minVocabCount} vocabulary items
        ]
      }
    },
    {
      "type": "reading",
      "title": "Reading Text Title",
      "content": {
        "text": "Complete reading text about ${params.topic} appropriate for ${params.cefrLevel} level",
        "paragraphs": [
          "First paragraph text...",
          "Second paragraph text...",
          "Third paragraph text..."
        ]
      }
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "content": {
        "questions": [
          {
            "question": "Comprehension question 1",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Explanation of why this answer is correct"
          }
          // 3-5 questions testing meaningful comprehension
        ]
      }
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "content": {
        "questions": [
          {
            "paragraphContext": "3-5 sentence paragraph providing context for the question using ${params.cefrLevel} appropriate language and vocabulary",
            "question": "Thought-provoking discussion question appropriate for ${params.cefrLevel} cognitive level",
            "imagePrompt": "Description for image generation that supports the discussion topic"
          }
          // 4-6 discussion questions each with unique context paragraphs
        ]
      }
    },
    {
      "type": "sentenceFrames",
      "title": "Sentence Patterns Practice",
      "content": {
        "frames": [
          {
            "patternTemplate": "Pattern with blanks like: ___ is ___ because ___.",
            "languageFunction": "Purpose of this pattern (e.g., 'Expressing opinions with reasons')",
            "structureComponents": [
              {
                "label": "Component name",
                "description": "What this component does",
                "examples": ["example1", "example2", "example3"],
                "inSentenceExample": "Shows component in context"
              }
            ],
            "examples": [
              {
                "completeSentence": "Complete example sentence about ${params.topic}",
                "breakdown": "Explanation of sentence components"
              }
            ],
            "grammarFocus": ["grammar point 1", "grammar point 2"],
            "teachingNotes": ["Teaching tip 1", "Teaching tip 2"],
            "patternVariations": ["Variation 1", "Variation 2"]${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' 
              ? ',\n            "lowerLevelScaffolding": "Additional support and simplified explanations for A1-B1 students"'
              : ''}
          }
          // 2-3 sentence frames addressing real communication needs
        ]
      }
    }
  ]
}
\`\`\`

**Generate the complete lesson now following all requirements systematically.**
   - 4-6 examples appropriate for the CEFR level
   - In-sentence example showing placement

3. VISUAL STRUCTURE: Simplified diagram showing:
   - Starting words (e.g., "It is")
   - Component parts with connectors
   - Ending punctuation

4. ENHANCED EXAMPLES: 3-4 complete examples with:
   - Full sentence using the pattern
   - Component breakdown mapping each part
   - Highlighting key vocabulary from the lesson

5. PATTERN VARIATIONS: Different forms including:
   - Negative form
   - Question form  
   - Modal variations
   - Past tense form (if applicable)

6. INTERACTIVE FEATURES:
   - Fill-in-the-blank templates with guided prompts
   - Substitution drill with multiple options
   - Step-by-step sentence building instructions

7. CULTURAL ADAPTATION:
   - Universal application explanation
   - Cultural notes for international students
   - Discussion starters for cultural comparison

8. PRACTICE ACTIVITIES: 3 activities of increasing difficulty:
   - Controlled practice (easy)
   - Guided practice (medium)
   - Free practice (challenging)

9. ERROR CORRECTION: Common mistakes with:
   - Incorrect example
   - Correct version
   - Clear explanation of the error

10. TEACHING SUPPORT:
    - 4-5 practical teaching notes
    - Discussion prompts related to the pattern
    - Classroom implementation tips

CRITICAL: Generate sentence frames using the enhanced format with these REQUIRED fields:
- "patternTemplate": The actual pattern (e.g., "It is _____ to _____ because _____.")
- "languageFunction": Purpose of the pattern (e.g., "Explaining reasons and justification")
- "structureComponents": Array of component objects with label, description, examples, inSentenceExample
- "examples": Array of objects with "completeSentence" and "breakdown" properties
- "grammarFocus": Array of grammar points
- "teachingNotes": Array of teaching tips

NEVER use the old format with "pattern", "communicativeFunction", "structureBreakdown", or "exampleSentences".

🎯 **CRITICAL VOCABULARY SELECTION PROTOCOL** 🎯
**YOU MUST FOLLOW THIS 5-STEP PROCESS FOR ALL VOCABULARY SELECTION**

STEP 1: VOCABULARY LEVEL ANALYSIS (REQUIRED BEFORE SELECTION)

Before selecting vocabulary, analyze what ${params.cefrLevel} students typically know and should learn next:

FOUNDATION KNOWLEDGE ANALYSIS FOR ${params.cefrLevel} STUDENTS:
- A1 students know: basic family, food, colors, numbers, simple present tense, essential survival vocabulary
- A2 students know: A1 + basic past tense, common adjectives, simple descriptions, personal experiences
- B1 students know: A1/A2 + present perfect, opinions, comparisons, everyday topics, functional language
- B2 students know: A1/A2/B1 + academic thinking, complex discussions, abstract concepts, discourse markers
- C1 students know: A1-B2 + advanced academic language, nuanced expression, specialized vocabulary
- C2 students know: Near-native vocabulary range including idiomatic and specialized language

APPROPRIATE NEW VOCABULARY FOR ${params.cefrLevel} LEVEL:
- A1: Concrete, immediate needs (house, clothes, body parts, basic actions)
- A2: Personal experiences and descriptions (interesting, boring, excited, yesterday, tomorrow)
- B1: Social topics and functional language (community, environment, although, however, opinion)
- B2: Academic and analytical language (sustainability, efficiency, infrastructure, furthermore)
- C1: Sophisticated concepts (implications, comprehensive, predominantly, nevertheless)
- C2: Advanced/specialized terminology (nuanced, paradigm, intrinsic, contemporary discourse)

TOO ADVANCED FOR ${params.cefrLevel} LEVEL:
- For A1: Abstract concepts, complex grammar constructions, specialized terms, academic language
- For A2: Academic vocabulary, complex discourse markers, abstract philosophical concepts
- For B1: Highly academic vocabulary, complex phrasal verbs, advanced idiomatic expressions
- For B2: Specialized technical terms, advanced literary language, highly formal register
- For C1: Archaic or highly specialized jargon, extremely formal academic discourse

STEP 2: TOPIC-APPROPRIATE VOCABULARY SELECTION FOR "${params.topic}"

Analyze the topic "${params.topic}" specifically for ${params.cefrLevel} level:

TOPIC ANALYSIS QUESTIONS:
1. What aspects of "${params.topic}" are cognitively appropriate for ${params.cefrLevel} students?
2. What vocabulary domains within this topic match their developmental level?
3. What real-world communication needs do they have for this topic?
4. How does this topic connect to their life experiences and interests?

VOCABULARY SELECTION STRATEGY BY LEVEL:
A1/A2 LEVELS: Choose vocabulary for:
- Concrete, observable aspects of the topic that students can see/touch/experience
- Personal experiences and basic descriptions related to the topic
- Essential functional language for basic communication about the topic
- Example: For "transportation" → car, bus, train, ticket, station, fast, slow

B1 LEVEL: Choose vocabulary for:
- Social and practical aspects of the topic that affect daily life
- Problem-solving and opinion-expressing related to the topic
- Connecting ideas and experiences about the topic
- Example: For "transportation" → commute, public transport, traffic jam, convenient, reliable

B2 LEVEL: Choose vocabulary for:
- Analytical and evaluative aspects that require critical thinking
- Abstract concepts and complex relationships within the topic
- Academic discussion and debate capabilities
- Example: For "transportation" → infrastructure, sustainability, urban planning, efficiency

C1/C2 LEVELS: Choose vocabulary for:
- Sophisticated analysis and nuanced discussion of the topic
- Professional and academic contexts related to the topic
- Complex interdisciplinary connections and implications
- Example: For "transportation" → multimodal integration, carbon footprint mitigation, transit-oriented development

CRITICAL SELECTION CRITERIA:
✓ Vocabulary must serve authentic communication needs at this specific level
✓ Words should enable meaningful discussion of the topic at appropriate cognitive depth
✓ Selection should reflect real-world language use patterns for this topic and level

STEP 3: VOCABULARY FREQUENCY AND NOVELTY VALIDATION

For ${params.cefrLevel} level, each word must meet these criteria. The aim is to introduce new, relevant vocabulary while ensuring a solid foundation.

A1 WORDS:
- Primary Introduction: Must be within the top 1,000 most frequent English words.
- Novelty Check: Prioritize words generally introduced at A1 or words that are essential for basic communication within the topic.

A2 WORDS:
- Primary Introduction: Must be within the top 2,000 most frequent English words.
- Novelty Check: Prioritize words generally introduced at A2, and avoid words primarily introduced at A1, unless their A2 usage is significantly more complex (e.g., a new phrasal verb using an A1 base verb).

B1 WORDS:
- Primary Introduction: Must be within the top 3,000 most frequent English words.
- Novelty Check: Prioritize words generally introduced at B1, and avoid words primarily introduced at A1 or A2, unless they are critical topic-specific vocabulary with a new B1 context or collocation.

B2 WORDS:
- Primary Introduction: Can use words beyond the top 3,000, focusing on those typically introduced at B2.
- Novelty Check: Prioritize words that are new to the B2 level for the given topic. Words from lower levels should only be included if they form part of a new, more complex B2-level phrase, collocation, or idiom, or are essential for abstract discussion.
- Topic-Essential: Must be highly relevant and essential for understanding and discussing the specific topic at a B2 depth.

C1/C2 WORDS:
- Primary Introduction: Focus on specialized, academic, formal, or nuanced vocabulary. Frequency is less of a strict constraint here.
- Novelty Check: Prioritize words that are new to the C1/C2 level for the given topic, allowing for highly sophisticated and abstract terms.
- Sophistication: Can include idiomatic expressions, advanced collocations, and words demonstrating a high level of lexical precision.

VALIDATION CHECK: Before including any word, verify:
"Is [word] appropriate for ${params.cefrLevel} considering its typical introduction level and novelty for this CEFR band?"
If NO, replace with a level-appropriate and novel alternative.

COGNITIVE APPROPRIATENESS CHECK:
Verify if students at ${params.cefrLevel} can not only comprehend but also productively engage with the word as expected for their level.
- A1: Can students identify this word and use it in single-word or very short phrase responses in basic daily survival situations?
- A2: Can students describe something simple using this word and participate in simple social interactions?
- B1: Can students explain concepts in simple sentences, express personal opinions, or narrate simple events using this word in problem-solving discussions?
- B2: Can students use this word in abstract discussions, support arguments, speculate, or evaluate situations?
- C1/C2: Can students analyze nuanced meanings, synthesize information, present formal arguments, or discuss complex ethical dilemmas using this word?

REJECT if the word requires cognitive or productive abilities beyond the specified level's typical output.

COMMUNICATION CONTEXT CHECK:
Ensure the word's primary use-case aligns with the communication needs and contexts typical for ${params.cefrLevel}.
- A1: Is this word predominantly used in basic daily survival situations (e.g., introductions, simple requests, personal information)?
- A2: Is this word predominantly used in simple social interactions (e.g., describing routines, expressing simple likes/dislikes, making simple plans)?
- B1: Is this word predominantly used in problem-solving discussions, for giving instructions, making comparisons, or expressing agreement/disagreement about familiar topics?
- B2: Is this word predominantly used in opinion/argument contexts, for debating, persuading, or negotiating complex issues?
- C1/C2: Is this word predominantly used in academic/professional contexts, for presenting formal arguments, critical analysis, or moderating discussions?

REJECT if the word's typical usage context doesn't match the student's communication needs at this level.

FOUNDATION VOCABULARY CHECK:
Before introducing a new word, ensure students are expected to know its prerequisite vocabulary.
- Instruction: For each selected vocabulary item, explicitly identify 1-3 foundational words from preceding CEFR levels that are essential for understanding it.
- Example: Before teaching "destination" (B1), students must know: "place" (A1), "go" (A1), "travel" (A2), "where" (A1).
- Validation: If any prerequisite word is typically not known at a lower level, reconsider the target word's appropriateness or ensure the prerequisite is also introduced/recycled.

REJECT any word requiring unknown prerequisite vocabulary that cannot be easily inferred or quickly introduced.

LEVEL-SPECIFIC TOPIC VOCABULARY & NOVELTY FOCUS:
For the chosen topic "${params.topic}", focus on providing new and challenging vocabulary for ${params.cefrLevel} level.

General Principle: The goal is to provide vocabulary that is fresh and appropriate for the current level, avoiding direct re-teaching of words primarily introduced at lower levels.

A1: Focus on fundamental, concrete words directly related to the topic for basic communication.
- Examples for "Travel": plane, hotel, ticket, bag, passport, go, see.

A2: Focus on slightly more descriptive or action-oriented words related to the topic, expanding on A1 concepts.
- Examples for "Travel": journey, tourist, vacation, culture, local, visit, stay, foreign.

B1: Focus on vocabulary for discussing experiences, plans, and more nuanced aspects of the topic.
- Examples for "Travel": destination, experience, adventure, explore, traditional, organize, book, arrange.

B2: Focus on vocabulary for abstract discussions, opinions, and more complex aspects of the topic (e.g., ethical, environmental).
- Examples for "Travel": itinerary, authentic, sustainable, perspective, immersive, impact, develop, consider.

C1: Focus on sophisticated, formal, or specialized vocabulary, including collocations and academic terms related to the topic.
- Examples for "Travel": expedition, cosmopolitan, wanderlust, cultural immersion, heritage, preservation, undertake.

C2: Focus on highly specialized, nuanced, or idiomatic vocabulary for expert-level discussion and critical analysis.
- Examples for "Travel": vernacular, discerning, profound, comprehensive, intricate, sophisticated.

VALIDATION: For each new level's topic vocabulary, ensure that:
- Words are primarily introduced at that specific CEFR level or higher.
- There is minimal to no overlap where a word primarily taught as "new" at a lower level is re-presented as "new" at a higher level for the same basic meaning.
- If a word appears across levels, it must be because it's used in a significantly more complex way, collocation, or nuanced meaning appropriate for the higher level.

TOPIC-ESSENTIAL VOCABULARY MARKING:
If a word is outside the typical frequency range for ${params.cefrLevel} but essential for meaningful discussion of "${params.topic}", mark it as topic-essential:
- Include "topicEssential": true in the vocabulary item
- Add explanation in "usageNotes" field: "This word is essential for discussing [topic] at [level] despite being above typical frequency range"
- Ensure extra support through additional examples and clear definitions
- IMPORTANT: topicEssential: true is for rare exceptions only. Always prioritize words within the typical frequency range for the CEFR level.

AUTOMATIC REJECTION CRITERIA - REJECT WORDS THAT:
❌ Are primarily introduced at a lower CEFR level without significant complexity increase
❌ Require unknown prerequisite vocabulary for comprehension
❌ Are too abstract/complex for the cognitive level
❌ Cannot be defined using significantly simpler language
❌ Are rarely used in real communication at this level
❌ Serve only academic/specialized purposes inappropriate for the level
❌ Would appear in lessons one level below with the same meaning and usage

VOCABULARY VALIDATION CHECKLIST:

Before submitting your vocabulary selection, verify EVERY word meets ALL criteria:

MANDATORY QUALITY CONTROL CHECKLIST:
✓ LEVEL APPROPRIATENESS: Is each word genuinely appropriate for ${params.cefrLevel} students?
✓ USEFULNESS VERIFICATION: Will students actually need these words in real communication?
✓ COHERENCE CONFIRMATION: Do the words work together to enable meaningful topic discussion?
✓ DEFINITION FEASIBILITY: Can each word be defined using vocabulary simpler than the target word?
✓ PREREQUISITE VALIDATION: Do students have the foundation vocabulary to understand these words?
✓ COGNITIVE MATCH: Does each word match the cognitive development level of ${params.cefrLevel} students?
✓ COMMUNICATION VALUE: Does each word serve authentic communicative purposes at this level?
✓ TOPIC RELEVANCE: Is each word directly relevant and useful for discussing "${params.topic}"?

SEMANTIC COHERENCE AND GROUPING

Select vocabulary that works together meaningfully:

SEMANTIC COHERENCE REQUIREMENTS:
1. Choose words that form logical, functional groups within the topic
2. Ensure words can be used together in meaningful communication
3. Create vocabulary sets that enable comprehensive topic discussion
4. Consider word relationships (synonyms, antonyms, word families)

FUNCTIONAL GROUPING EXAMPLES:
A1 Transportation: [car, bus, walk] + [fast, slow] + [go, stop, wait]
→ Enables: "I go by bus. The bus is slow. I wait for the bus."

B1 Transportation: [commute, public transport, traffic] + [convenient, reliable, crowded] + [however, although, because]
→ Enables: "I commute by public transport. However, it's often crowded because many people use it."

B2 Transportation: [infrastructure, sustainability, urban planning] + [efficient, environmentally-friendly, cost-effective] + [furthermore, consequently, therefore]
→ Enables: "Urban planning affects transportation infrastructure. Consequently, cities need sustainable and cost-effective solutions."

COHERENCE VALIDATION:
✓ Can students combine these words to discuss the topic meaningfully?
✓ Do the words represent different aspects/dimensions of the topic?
✓ Are there enough words to enable substantial communication about the topic?
✓ Do the words progress logically from concrete to abstract (appropriate for level)?

🚨 CRITICAL VOCABULARY DEFINITION REQUIREMENTS 🚨

**FUNDAMENTAL PEDAGOGICAL RULE**: Students CANNOT learn a new word if its definition contains vocabulary they don't understand!

**DEFINITION LANGUAGE MUST BE SIMPLER THAN THE TARGET WORD**

**CLEAR EXAMPLES BY LEVEL:**

**A1 DEFINITIONS** (Use ONLY very basic, beginner-level vocabulary):
❌ WRONG: "Beautiful" = "aesthetically pleasing and visually attractive"
✅ CORRECT: "Beautiful" = "very nice to look at"
❌ WRONG: "Vehicle" = "a mechanical conveyance for transportation" 
✅ CORRECT: "Vehicle" = "a car, bus, or truck"

**A2 DEFINITIONS** (Use ONLY elementary vocabulary familiar to A2 students):
❌ WRONG: "Environment" = "the aggregate of surrounding phenomena and conditions"
✅ CORRECT: "Environment" = "the natural world around us with air, water, plants and animals"
❌ WRONG: "Economy" = "the interrelated system of production and distribution"
✅ CORRECT: "Economy" = "the way a country makes and spends money"

**B1 DEFINITIONS** (Use ONLY intermediate vocabulary appropriate for B1 level):
❌ WRONG: "Innovation" = "implementation of novel methodologies and paradigms"
✅ CORRECT: "Innovation" = "creating new ideas or ways of doing things"
❌ WRONG: "Sustainability" = "maintaining ecological equilibrium through resource utilization"
✅ CORRECT: "Sustainability" = "using natural resources without harming the environment for the future"

**B2 DEFINITIONS** (Use upper-intermediate vocabulary appropriate for B2 level):
❌ WRONG: "Entrepreneur" = "an individual who conceptualizes and establishes commercial enterprises"
✅ CORRECT: "Entrepreneur" = "a person who starts and runs their own business, often taking financial risks"

**SENTENCE STRUCTURE LIMITS:**
- A1: Maximum 8 words, present tense only, no complex grammar
- A2: Maximum 12 words, simple past/future allowed, basic conjunctions only  
- B1: Maximum 15 words, present perfect/conditionals allowed
- B2: Maximum 20 words, all tenses and modals allowed

CEFR LEVEL-APPROPRIATE DEFINITIONS GUIDELINES:
- A1: Use only the most basic beginner vocabulary. Very simple sentence structures. Definitions should be 1-5 words where possible.
- A2: Use elementary vocabulary familiar to A2 students. Simple sentences. Avoid complex structures or uncommon words.
- B1: Use intermediate vocabulary appropriate for B1 level. Moderately complex sentences allowed, but prioritize clarity.
- B2: Use upper-intermediate vocabulary appropriate for B2 students. More complex sentences and some academic words allowed.
- C1: Use advanced vocabulary appropriate for C1 students. Complex sentences and academic/specialized terms acceptable.
- C2: Use proficient-level vocabulary with nuanced explanations. Full range of language structures. Can include specialized terminology.

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS AND PRONUNCIATION:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2, phoneticGuide: "dis-suh-LOO-shun"

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6, phoneticGuide: "in-DUS-tree-ul REV-uh-LOO-shun"
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0, phoneticGuide: "CLY-mit chaynj"

CRITICALLY IMPORTANT: Always use ONLY regular English characters and hyphens for phoneticGuide. NEVER use IPA phonetic symbols like "ə", "ɪ", or "ʃ". Use simple English spelling to approximate sounds.

STEP 3: READING TEXT DEVELOPMENT

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
For each vocabulary word, create a detailed imagePrompt using this exact format:
"A [style] illustration of [specific visual elements] showing [vocabulary concept]. [Details about colors, setting, perspective]. No text, words, or letters visible in the image."

IMAGEROMPT EXAMPLES:
- "restaurant" → "A modern illustration of a busy restaurant interior with customers dining at tables, waiters serving food, and a warm, inviting atmosphere. Bright lighting and colorful decor. No text, words, or letters visible in the image."
- "excited" → "A realistic illustration of a young person jumping with arms raised in celebration, with a big smile and bright, joyful expression. Vibrant colors and dynamic pose showing clear excitement. No text, words, or letters visible in the image."
- "compare" → "A clean illustration showing two smartphones side by side with hands pointing at different features of each phone. Modern style with bright colors demonstrating comparison. No text, words, or letters visible in the image."

Each imagePrompt MUST include:
✓ Specific visual elements that clearly show the word meaning
✓ Style direction (modern illustration, realistic, clean cartoon)
✓ Color and composition details
✓ Cultural appropriateness for diverse ESL learners
✓ Always end with "No text, words, or letters visible in the image."

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