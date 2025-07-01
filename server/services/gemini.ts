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
              console.log('Lesson content has valid structure');
              return jsonContent;
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
                console.log('Fixed content has valid structure');
                return jsonContent;
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

**Generate the complete lesson now following all requirements systematically.**`;

    // User message part - construct the full lesson generation prompt
    const userMessage = `Generate a comprehensive ${params.cefrLevel} level ESL lesson about "${params.topic}" with focus on ${params.focus}.

Target lesson length: ${params.lessonLength} minutes
CEFR Level: ${params.cefrLevel}
Topic: ${params.topic}
Focus: ${params.focus}

${params.targetVocabulary ? `CRITICAL: Include these vocabulary words: ${params.targetVocabulary}` : ''}

Follow the systematic development process and validation requirements outlined in the instructions above.

Return ONLY valid JSON following the exact structure provided.`;

    try {
      console.log(`🔄 Generating lesson with topic: "${params.topic}", level: ${params.cefrLevel}`);
      
      const response = await this.genAI.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              level: { type: "string" },
              focus: { type: "string" },
              estimatedTime: { type: "number" },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    content: { type: "object" }
                  },
                  required: ["type", "title", "content"]
                }
              }
            },
            required: ["title", "level", "focus", "estimatedTime", "sections"]
          }
        },
        contents: userMessage
      });

      let rawContent = response.text;
      if (!rawContent) {
        throw new Error('Empty response from Gemini API');
      }

      // Clean up the response
      rawContent = rawContent.trim();
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.slice(7);
      }
      if (rawContent.startsWith('```')) {
        rawContent = rawContent.slice(3);
      }
      if (rawContent.endsWith('```')) {
        rawContent = rawContent.slice(0, -3);
      }

      let content;
      try {
        content = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Raw content:', rawContent);
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }

      console.log(`✅ Successfully generated lesson: "${content.title}"`);
      return content;

    } catch (error: any) {
      console.error('❌ Error in generateLesson:', error);
      if (error.message?.includes('SAFETY')) {
        throw new Error('Content generation blocked by safety filters. Please try a different topic or approach.');
      }
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      if (error.message?.includes('model not found')) {
        throw new Error('Gemini model temporarily unavailable. Please try again.');
      }
      throw new Error(`Lesson generation failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Constructs a structured prompt for the Gemini AI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    // This method is now replaced by the comprehensive prompt above
    // but kept for backwards compatibility
    return `Generate a ${params.cefrLevel} level ESL lesson about "${params.topic}"`;
  }
}