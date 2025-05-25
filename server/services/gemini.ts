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
                .replace(/([^\\])(\\)([^"\\\/bfnrtu])/g, '$1\\\\$3')  // Fix unescaped backslashes
                .replace(/([^\\])\\'/g, "$1'")    // Remove escaping from single quotes
                .replace(/\r?\n|\r/g, ' ')        // Replace newlines with spaces
                .replace(/"\s+([^"]*)\s+"/g, '"$1"') // Fix spaces in JSON keys
                .replace(/(['"])([\w]+)(['"]):/g, '"$2":'); // Ensure property names use double quotes
                
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

1. EXTREMELY CRITICAL: ALL ARRAYS MUST CONTAIN FULL CONTENT, NOT NUMBERS OR COUNTS
   CORRECT: "paragraphs": ["Paragraph 1 text here...", "Paragraph 2 text here...", "Paragraph 3 text here..."]
   WRONG: "paragraphs": 5
   
2. ARRAYS MUST USE PROPER ARRAY FORMAT
   CORRECT: "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
   WRONG: "questions": ["Question 1"], "Question 2": "Question 3"

3. CRITICAL: ALL CONTENT MUST BE ABOUT THE SPECIFIC TOPIC PROVIDED BY THE USER.

${params.targetVocabulary ? `4. CRUCIAL: YOU MUST INCLUDE THE FOLLOWING VOCABULARY WORDS IN YOUR LESSON: ${params.targetVocabulary}` : ''}

${params.targetVocabulary ? '5' : '4'}. CRITICAL: FOR EACH VOCABULARY WORD, YOU MUST INCLUDE THE 'pronunciation' OBJECT WITH 'syllables', 'stressIndex', AND 'phoneticGuide' FIELDS. The 'phoneticGuide' MUST use ONLY regular English characters and hyphens (like "AS-tro-naut" or "eks-PLOR-ay-shun"), NOT International Phonetic Alphabet (IPA) symbols.

5. TONE & STYLE APPROACH:
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

STEP 0: CEFR LEVEL ANALYSIS (REQUIRED BEFORE PROCEEDING)

Before creating any lesson content, first analyze and establish clear parameters for what constitutes ${params.cefrLevel} level appropriate content:

1. VOCABULARY ANALYSIS:
   - Identify what vocabulary range is appropriate for ${params.cefrLevel} level students
   - List 5-10 example words that would be appropriate for this level
   - List 3-5 example words that would be too difficult for this level

2. GRAMMAR STRUCTURE ANALYSIS:
   - Identify which grammatical structures are appropriate for ${params.cefrLevel} level
   - List 3-5 sentence structure patterns appropriate for this level
   - List 2-3 grammatical structures that would be too complex for this level

3. TEXT COMPLEXITY ANALYSIS:
   - Determine appropriate sentence length and complexity for ${params.cefrLevel} level
   - Identify appropriate paragraph structure and length
   - Establish appropriate use of idioms, phrasal verbs, and figurative language (if any)

4. COGNITIVE DEMAND ANALYSIS:
   - Identify appropriate cognitive tasks for ${params.cefrLevel} level (describing, explaining, comparing, etc.)
   - Determine appropriate level of abstraction for concepts
   - Assess appropriate cultural knowledge assumptions

Spend time establishing these parameters before proceeding. This analysis will guide your creation of all lesson components to ensure they remain appropriate for ${params.cefrLevel} level students throughout.

Once complete, use these self-generated guidelines to create appropriately leveled content for all components of the lesson.

READING TEXT REQUIREMENTS:
1. ORIGINAL CONTENT: Write an original reading text about the topic "${text}".
2. LENGTH REQUIREMENT (CRITICAL): For ${params.cefrLevel} level, your text MUST be AT LEAST ${params.cefrLevel === "B1" ? "200" : params.cefrLevel === "C2" ? "500" : params.cefrLevel === "A1" || params.cefrLevel === "A2" ? "100" : "300"} words long. Shorter texts may be rejected.
3. PARAGRAPH STRUCTURE: Divide your text into 3-5 well-structured paragraphs.
4. SUBSTANTIAL CONTENT: Focus on creating a substantial, informative text appropriate for the topic and level.
5. CEFR ALIGNMENT: Ensure vocabulary and sentence structures match the ${params.cefrLevel} level precisely.

SENTENCE FRAMES APPROACH:
**Goal:** Develop high-frequency, versatile sentence patterns that support key language functions in the lesson.

First, analyze what sentence patterns are appropriate for ${params.cefrLevel} level:
- Research the syntactic structures typically taught at ${params.cefrLevel} level
- Identify high-frequency, versatile sentence patterns used in authentic contexts
- Determine appropriate complexity of explanations for this level
- Consider how the patterns should be presented and practiced

Then, based on your analysis:
- Design 1-2 sentence patterns that are:
  a) Appropriate for ${params.cefrLevel} level complexity
  b) Genuinely useful in everyday communication
  c) Relevant to the lesson topic
  d) Structured in a way students can easily understand and practice

For each pattern, determine the most appropriate way to:
- Present the pattern visually
- Break it down into comprehensible components
- Provide level-appropriate examples
- Create practice opportunities
- Guide teachers in presenting it effectively

ENHANCED SENTENCE FRAMES REQUIREMENTS:
Each sentence frame MUST include the following enhanced structure for maximum teaching effectiveness:

1. PATTERN TEMPLATE: Clear pattern with labeled blanks
2. STRUCTURE COMPONENTS: Detailed breakdown of each part with:
   - Component label (e.g., "Evaluative Adjective")
   - Clear description of the component's function
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

CRITICAL: Follow this EXACT JSON structure for sentence frames:

\`\`\`
{
  "type": "sentenceFrames",
  "title": "Sentence Practice", 
  "introduction": "Master key sentence patterns to express your ideas clearly and naturally.",
  "frames": [
    {
      "patternTemplate": "It is ___ to ___ because ___.",
      "languageFunction": "Explaining reasons and justification",
      "title": "Expressing Reasoned Opinions",
      "level": "intermediate",
      "grammarFocus": [
        "Structure: It + is + adjective + infinitive (to + verb) + reason clause",
        "Use of 'because' to introduce explanations",
        "Infinitive forms after adjectives"
      ],
      "structureComponents": [
        {
          "label": "Evaluative Adjective",
          "description": "An adjective that expresses judgment about the action",
          "examples": ["important", "essential", "polite", "rude", "necessary", "helpful"],
          "inSentenceExample": "It is [Evaluative Adjective] to..."
        },
        {
          "label": "Infinitive Action", 
          "description": "The main action being evaluated, in infinitive form",
          "examples": ["learn new languages", "respect differences", "ask permission"],
          "inSentenceExample": "...to [Infinitive Action] because..."
        },
        {
          "label": "Reason Clause",
          "description": "The explanation for why the evaluation is true", 
          "examples": ["it shows respect", "it prevents problems", "it builds trust"],
          "inSentenceExample": "...because [Reason Clause]."
        }
      ],
      "visualStructure": {
        "start": "It is",
        "parts": [
          { "label": "Evaluative Adjective" },
          { "label": "Infinitive Action", "connector": "to" },
          { "label": "Reason Clause", "connector": "because" }
        ],
        "end": "."
      },
      "examples": [
        {
          "completeSentence": "It is important to learn cultural customs because it shows respect for local traditions.",
          "breakdown": {
            "Evaluative Adjective": "important",
            "Infinitive Action": "learn cultural customs", 
            "Reason Clause": "it shows respect for local traditions"
          }
        },
        {
          "completeSentence": "It is polite to remove your shoes because it keeps the house clean.",
          "breakdown": {
            "Evaluative Adjective": "polite",
            "Infinitive Action": "remove your shoes",
            "Reason Clause": "it keeps the house clean"
          }
        },
        {
          "completeSentence": "It is essential to understand etiquette because it helps avoid embarrassing situations.",
          "breakdown": {
            "Evaluative Adjective": "essential", 
            "Infinitive Action": "understand etiquette",
            "Reason Clause": "it helps avoid embarrassing situations"
          }
        }
      ],
      "patternVariations": {
        "negativeForm": "It is not polite to use your phone during meals because it shows disrespect.",
        "questionForm": "Why is it important to learn about different cultures?",
        "modalForm": "It can be difficult to understand all customs because every culture is different.",
        "pastForm": "It was essential to follow the rules because the ceremony was very formal."
      },
      "interactiveFeatures": {
        "fillInTheBlanks": [
          {
            "template": "It is ___ to ___ because ___.",
            "prompts": [
              "Think of something important in your culture",
              "What action shows good manners?",
              "Why is this behavior valued?"
            ]
          }
        ],
        "substitutionDrill": {
          "basePattern": "It is important to respect others because it creates harmony.",
          "substitutions": [
            {"target": "important", "options": ["essential", "necessary", "polite"]},
            {"target": "respect others", "options": ["listen carefully", "show courtesy", "be patient"]},
            {"target": "creates harmony", "options": ["builds trust", "shows maturity", "prevents conflicts"]}
          ]
        },
        "buildingSentences": {
          "stepByStep": [
            {"step": 1, "instruction": "Choose an evaluative adjective", "examples": ["important", "polite", "necessary"]},
            {"step": 2, "instruction": "Add an infinitive action", "examples": ["to listen", "to wait", "to ask"]},
            {"step": 3, "instruction": "Complete with a reason", "examples": ["it shows respect", "it's more polite", "it prevents problems"]}
          ]
        }
      },
      "culturalAdaptation": {
        "universalApplication": "This pattern works across cultures for expressing values and social norms",
        "culturalNotes": "Different cultures may emphasize different adjectives - adapt examples to student backgrounds",
        "discussionStarters": [
          "What behaviors are considered 'important' in your culture?",
          "Are there actions that are 'polite' in one culture but not in another?"
        ]
      },
      "practiceActivities": [
        {
          "type": "controlled",
          "name": "Pattern Completion",
          "instruction": "Complete the sentence with appropriate words from the lesson",
          "difficulty": "easy"
        },
        {
          "type": "guided", 
          "name": "Cultural Comparison",
          "instruction": "Use this pattern to compare customs from different cultures",
          "difficulty": "medium"
        },
        {
          "type": "free",
          "name": "Personal Values",
          "instruction": "Express your own opinions about social behaviors using this pattern",
          "difficulty": "challenging"
        }
      ],
      "errorCorrection": {
        "commonMistakes": [
          {"error": "*It is important learn...", "correction": "It is important TO learn...", "explanation": "Don't forget the infinitive 'to'"},
          {"error": "*It is important to learn for...", "correction": "It is important to learn BECAUSE...", "explanation": "Use 'because' not 'for' to give reasons"},
          {"error": "*It is importantly to...", "correction": "It is IMPORTANT to...", "explanation": "Use the adjective 'important', not the adverb"}
        ]
      },
      "teachingNotes": [
        "Start with familiar concepts before introducing new vocabulary",
        "Use gestures and visual aids to reinforce the three-part structure", 
        "Encourage students to personalize examples with their own cultural experiences",
        "Practice rhythm: IT is im-POR-tant to LEARN be-CAUSE it HELPS",
        "Connect to lesson vocabulary by using target words in the infinitive action slot"
      ],
      "discussionPrompts": [
        "What customs from your culture would you explain using this pattern?",
        "Can you think of a time when understanding cultural differences was important?",
        "How would you teach someone from another culture about politeness in your country?",
        "What behaviors are considered essential in professional settings?"
      ]
    }
  ],
  "aiGeneratedSupport": {
    "adaptiveExamples": "AI can generate personalized examples based on student's cultural background and interests",
    "levelAdjustment": "Pattern complexity and vocabulary automatically adjust to student's demonstrated proficiency",
    "realTimeCorrection": "AI provides immediate feedback on student-generated sentences using this pattern",
    "progressiveChallenge": "Difficulty increases as student masters basic pattern usage"
  },
  "visualLearningSupport": {
    "colorCoding": "Each sentence component uses consistent colors across all examples",
    "structureDiagrams": "Visual representation of sentence building blocks",
    "animatedConstruction": "Step-by-step sentence building animation suggestions", 
    "patternRecognition": "Highlighting recurring structures across different examples"
  }
}
\`\`\`

// This enhanced structure provides:
// - Clear visual organization with color-coded components
// - Interactive practice opportunities at multiple difficulty levels
// - Cultural sensitivity and adaptation guidance
// - Error prevention through common mistake identification
// - Comprehensive teaching support for effective classroom implementation

CEFR LEVEL-APPROPRIATE VOCABULARY SELECTION GUIDELINES:
First, analyze what vocabulary is appropriate for ${params.cefrLevel} level:
- Research the vocabulary range typical for ${params.cefrLevel} level students
- Consider both receptive and productive vocabulary expectations
- Determine which semantic fields are appropriate at this level
- Identify vocabulary selection criteria specific to this level (frequency, complexity, abstractness)

Based on your analysis, establish guidelines for:
- Appropriate vocabulary difficulty/complexity 
- How to define words at this level (simple definitions for A1/A2, more nuanced for B2+)
- Appropriate example sentence complexity
- Word family relationships appropriate to introduce
- Collocation complexity appropriate for this level

🚨 CRITICAL VOCABULARY DEFINITION REQUIREMENTS 🚨

**FUNDAMENTAL PEDAGOGICAL RULE**: Students CANNOT learn a new word if its definition contains vocabulary they don't understand!

**DEFINITION LANGUAGE MUST BE SIMPLER THAN THE TARGET WORD**

**CLEAR EXAMPLES BY LEVEL:**

**A1 DEFINITIONS** (Use ONLY 500-800 most basic words):
❌ WRONG: "Beautiful" = "aesthetically pleasing and visually attractive"
✅ CORRECT: "Beautiful" = "very nice to look at"
❌ WRONG: "Vehicle" = "a mechanical conveyance for transportation" 
✅ CORRECT: "Vehicle" = "a car, bus, or truck"

**A2 DEFINITIONS** (Use ONLY 1000-1500 basic words):
❌ WRONG: "Environment" = "the aggregate of surrounding phenomena and conditions"
✅ CORRECT: "Environment" = "the natural world around us with air, water, plants and animals"
❌ WRONG: "Economy" = "the interrelated system of production and distribution"
✅ CORRECT: "Economy" = "the way a country makes and spends money"

**B1 DEFINITIONS** (Use ONLY 2500 intermediate words):
❌ WRONG: "Innovation" = "implementation of novel methodologies and paradigms"
✅ CORRECT: "Innovation" = "creating new ideas or ways of doing things"
❌ WRONG: "Sustainability" = "maintaining ecological equilibrium through resource utilization"
✅ CORRECT: "Sustainability" = "using natural resources without harming the environment for the future"

**B2 DEFINITIONS** (Maximum 3500 words):
❌ WRONG: "Entrepreneur" = "an individual who conceptualizes and establishes commercial enterprises"
✅ CORRECT: "Entrepreneur" = "a person who starts and runs their own business, often taking financial risks"

**SENTENCE STRUCTURE LIMITS:**
- A1: Maximum 8 words, present tense only, no complex grammar
- A2: Maximum 12 words, simple past/future allowed, basic conjunctions only  
- B1: Maximum 15 words, present perfect/conditionals allowed
- B2: Maximum 20 words, all tenses and modals allowed

CEFR LEVEL-APPROPRIATE DEFINITIONS GUIDELINES:
- A1: Use only the most basic and frequent vocabulary (500-800 words). Very simple sentence structures. Definitions should be 1-5 words where possible.
- A2: Use basic vocabulary (about 1000-1500 words). Simple sentences. Avoid complex structures or uncommon words.
- B1: Use intermediate vocabulary (about 2500 words). Moderately complex sentences allowed, but prioritize clarity.
- B2: Upper-intermediate vocabulary (about 3500 words). More complex sentences and some academic words allowed.
- C1: Advanced vocabulary (about 5000+ words). Complex sentences and academic/specialized terms acceptable.
- C2: Proficient vocabulary with nuanced explanations. Full range of language structures. Can include specialized terminology.

EXAMPLES OF PROPER SYLLABLE BREAKDOWNS AND PRONUNCIATION:
- "vocabulary" → syllables: ["vo", "cab", "u", "lar", "y"], stressIndex: 1, phoneticGuide: "voh-KAB-yuh-lair-ee"
- "dissolution" → syllables: ["dis", "so", "lu", "tion"], stressIndex: 2, phoneticGuide: "dis-suh-LOO-shun"

For multi-word phrases, break down EACH WORD into syllables and list them sequentially:
- "industrial revolution" → syllables: ["in", "dus", "tri", "al", "rev", "o", "lu", "tion"], stressIndex: 6, phoneticGuide: "in-DUS-tree-ul REV-uh-LOO-shun"
- "climate change" → syllables: ["cli", "mate", "change"], stressIndex: 0, phoneticGuide: "CLY-mit chaynj"

CRITICALLY IMPORTANT: Always use ONLY regular English characters and hyphens for phoneticGuide. NEVER use IPA phonetic symbols like "ə", "ɪ", or "ʃ". Use simple English spelling to approximate sounds.

I will count the total number of vocabulary items. If you don't include EXACTLY ${minVocabCount} complete vocabulary items, your response will be rejected.

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

DISCUSSION QUESTIONS APPROACH:
First, analyze effective discussion questions for ${params.cefrLevel} level students:
- Research effective questioning techniques for ${params.cefrLevel} level language learners
- Identify appropriate cognitive challenge levels for discussions at this level
- Determine the balance between scaffolding and open-ended questioning
- Consider how background/context should be provided at this level
- Analyze how to encourage extended responses from students at this proficiency level

Based on your analysis, create discussion questions that:
- Match the cognitive abilities of ${params.cefrLevel} level students
- Provide appropriate contextual support based on level needs
- Encourage critical thinking appropriate to this level
- Are designed for optimal language production at this level
- Connect to both the lesson content and students' experiences
- Progress from more supported to more independent thinking

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
    // SENTENCE FRAMES SECTION (Explanatory Format)
    {
      "type": "sentenceFrames",
      "title": "Sentence Pattern Analysis", // Or similar title
      "frames": [
        {
          "pattern": "[CAUSE] spurred [EFFECT] because [REASON].",
          "level": "intermediate",
          "title": "Explaining Reasons for Developments",
          "usage": "Use this pattern to explain the cause, effect, and reason behind events.",
          "communicativeFunction": "Explaining Cause/Effect/Reason",
          "grammarFocus": "Using past tense verbs, 'because' conjunction",
          "structureBreakdown": [
            { "componentName": "CAUSE", "description": "What started the chain of events?", "examples": ["The discovery", "Increased funding", "Public interest"] },
            { "componentName": "EFFECT", "description": "What was the direct result?", "examples": ["new research", "faster development", "more volunteers"] },
            { "componentName": "REASON", "description": "Why did the cause lead to the effect?", "examples": ["it opened new possibilities", "resources were available", "people were excited"] }
          ],
          "exampleSentences": [
            "The launch of Sputnik 1 spurred the US space program because it highlighted a technology gap.",
            "Increased funding spurred faster development because more researchers could be hired."
          ],
          "practicePrompt": "Create your own sentence using this pattern: [CAUSE] spurred [EFFECT] because [REASON]. Try to use vocabulary from the lesson.",
          "teachingTips": "Discuss each component with students. Elicit more examples for each component before asking students to write their own sentences."${params.cefrLevel === 'A1' || params.cefrLevel === 'A2' || params.cefrLevel === 'B1' ? `,
          "lowerLevelScaffolding": {
            "sentenceWorkshop": [
              {
                "name": "Step-by-Step Building",
                "steps": [
                  {
                    "level": "word",
                    "example": "discovery",
                    "explanation": "Start with the cause (what happened first)"
                  },
                  {
                    "level": "phrase", 
                    "example": "The discovery spurred",
                    "explanation": "Add the verb 'spurred' to show the effect"
                  },
                  {
                    "level": "sentence",
                    "example": "The discovery spurred new research because it was exciting.",
                    "explanation": "Complete with effect and reason"
                  }
                ],
                "teachingNotes": "Build confidence by adding one piece at a time"
              }
            ],
            "patternTrainer": {
              "pattern": "[CAUSE] spurred [EFFECT] because [REASON].",
              "title": "Cause and Effect Builder",
              "scaffolding": {
                "causes": ["The discovery", "New funding", "Public interest", "Better technology", "Government support"],
                "effects": ["new research", "faster progress", "more projects", "better results", "wider participation"],
                "reasons": ["it was important", "resources were available", "people were excited", "tools improved", "goals were clear"]
              },
              "examples": [
                "The discovery spurred new research because it was important.",
                "New funding spurred faster progress because resources were available."
              ],
              "instructions": [
                "Choose what caused something to happen",
                "Pick the effect that followed", 
                "Add a reason explaining why",
                "Connect them with 'spurred' and 'because'"
              ]
            },
            "visualMaps": [
              {
                "pattern": "[CAUSE] spurred [EFFECT] because [REASON]",
                "colorCoding": {
                  "cause": "blue",
                  "spurred": "gray", 
                  "effect": "green",
                  "because": "gray",
                  "reason": "purple"
                },
                "example": "The discovery spurred new research because it was important"
              }
            ]
          }` : ''}
        }
        // (Potentially include 1 more frame object)
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
  ]
}

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
            
            // Generate image if prompt exists
            if (question.imagePrompt) {
               try {
                 // Generate unique ID for logging - use part of question text
                 const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                 question.imageBase64 = await stabilityService.generateImage(question.imagePrompt, requestId);
               } catch (imgError) {
                  console.error(`Error generating image for discussion question:`, imgError);
                  question.imageBase64 = null; // Ensure field exists even on error
               }
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