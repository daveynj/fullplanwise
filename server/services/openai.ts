import OpenAI from 'openai';
import { LessonGenerateParams } from '@shared/schema';

/**
 * Service for interacting with the OpenAI API
 */
export class OpenAIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('OpenAI API key is not provided or is empty');
    }
    this.client = new OpenAI({ apiKey });
  }
  
  /**
   * Generate a complete ESL lesson based on the provided parameters
   * @param params Lesson generation parameters
   * @returns Generated lesson content
   */
  async generateLesson(params: LessonGenerateParams): Promise<any> {
    try {
      console.log('Starting OpenAI lesson generation...');
      
      // Validate the API key format (basic validation)
      if (!this.client.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }
      
      const prompt = this.constructLessonPrompt(params);
      console.log('Constructed prompt successfully');
      
      // Using the more cost-effective gpt-3.5-turbo model as requested by the user
      const modelName = "gpt-3.5-turbo";
      
      console.log(`Using model: ${modelName}`);

      // Maximum number of retries for content quality
      const MAX_RETRIES = 2;
      let retryCount = 0;
      let formattedContent = null;
      
      while (retryCount <= MAX_RETRIES && !formattedContent) {
        try {
          console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES + 1} - Sending request to OpenAI API...`);
          
          const response = await this.client.chat.completions.create({
            model: modelName,
            messages: [
              { 
                role: "system", 
                content: "You are an expert ESL teacher with years of experience creating engaging and effective lesson materials. Your task is to create well-structured, error-free JSON content that strictly follows the structure defined in the user prompt. Ensure all arrays are proper JSON arrays with square brackets, all objects have proper key-value pairs, and there are no formatting errors." 
              },
              { 
                role: "user", 
                content: prompt 
              }
            ],
            temperature: 0.5, // Lower temperature for more consistent, structured output
            response_format: { type: "json_object" },
            max_tokens: 4096 // Maximum allowed for gpt-3.5-turbo
          });
          
          console.log('Received response from OpenAI API');
          
          if (response.choices && response.choices.length > 0) {
            const content = response.choices[0].message?.content;
            
            if (content) {
              console.log('Successfully extracted content from response');
              
              try {
                // Try to parse the content as JSON
                const jsonContent = JSON.parse(content);
                console.log('Successfully parsed JSON response');
                console.log('JSON response sample:', JSON.stringify(jsonContent).substring(0, 200) + '...');
                
                // Log the entire response for deeper inspection
                console.log('FULL JSON RESPONSE:', JSON.stringify(jsonContent));
                
                // Pre-process the JSON structure to fix common issues before formatting
                const preprocessedContent = this.preprocessContent(jsonContent);
                
                // Format the content
                const formattedResult = this.formatLessonContent(preprocessedContent);
                
                // Check if the formatted content meets our quality standards
                if (this.checkContentQuality(formattedResult)) {
                  // Content meets standards, return it
                  formattedContent = formattedResult;
                  console.log('Content quality check PASSED');
                } else {
                  // Content doesn't meet standards, will retry
                  console.log('Content quality check FAILED - will retry');
                  retryCount++;
                }
              } catch (parseError) {
                console.error('Error parsing OpenAI response as JSON:', parseError);
                
                // Log some of the raw content for debugging
                console.log('Raw response sample:', content.substring(0, 200) + '...');
                
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                  throw new Error('Failed to parse OpenAI response as JSON after multiple attempts');
                }
              }
            }
          } else {
            retryCount++;
            if (retryCount > MAX_RETRIES) {
              throw new Error('Invalid response from OpenAI API after multiple attempts');
            }
          }
        } catch (requestError: any) {
          console.error('Error during API request:', requestError.message);
          
          if (requestError.response) {
            console.error('Response data:', JSON.stringify(requestError.response.data || {}, null, 2));
          }
          
          retryCount++;
          if (retryCount > MAX_RETRIES) {
            throw new Error(`OpenAI API error after multiple attempts: ${requestError.message}`);
          }
        }
      }
      
      if (!formattedContent) {
        throw new Error('Failed to generate quality content after multiple attempts');
      }
      
      return formattedContent;
    } catch (error: any) {
      console.error('Error in OpenAIService.generateLesson:', error.message);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Constructs a structured prompt for the OpenAI model
   */
  private constructLessonPrompt(params: LessonGenerateParams): string {
    const { studentId, cefrLevel, topic, focus, lessonLength, additionalNotes } = params;
    
    // Convert CEFR level to more descriptive text
    const levelDescriptions: Record<string, string> = {
      'A1': 'Beginner',
      'A2': 'Elementary', 
      'B1': 'Intermediate',
      'B2': 'Upper Intermediate',
      'C1': 'Advanced',
      'C2': 'Proficient'
    };
    
    const levelDescription = levelDescriptions[cefrLevel] || `${cefrLevel} level`;
    
    // Determine appropriate question count based on level
    const questionCount = cefrLevel === 'A1' || cefrLevel === 'A2' ? 3 
                        : cefrLevel === 'B1' || cefrLevel === 'B2' ? 4 
                        : 5;
    
    // Determine difficulty based on CEFR level
    const difficulty = cefrLevel === 'A1' || cefrLevel === 'A2' ? 'basic'
                     : cefrLevel === 'B1' || cefrLevel === 'B2' ? 'intermediate'
                     : 'advanced';

    return `
You are an expert ESL (English as a Second Language) teacher specializing in creating engaging, interactive lessons for ${levelDescription} (${cefrLevel}) level students.

LESSON SPECIFICATIONS:
- Topic: "${topic}"  
- Focus: "${focus}"
- CEFR Level: ${cefrLevel} (${levelDescription})
- Lesson Length: ${lessonLength} minutes
- Additional notes: ${additionalNotes || 'None'}

CLASSROOM CONTEXT AND PURPOSE:
This lesson will be used by a teacher conducting a 1-on-1 online class via screen sharing. The content should be visually engaging, highly interactive, and optimized for student participation.

CEFR LEVEL ADAPTATION:
ALL content must be STRICTLY appropriate for the specified CEFR level ${cefrLevel}:
- Vocabulary choices must match the CEFR level (A1=beginner, C2=advanced)
- Sentence complexity must be appropriate (simple for A1-A2, more complex for B2-C2)
- Grammar structures must align with the CEFR level (present simple for A1, conditionals for B1+, etc.)
- Reading text difficulty must match the specified level
- Discussion paragraph contexts must be level-appropriate with vocabulary and grammar matching the CEFR level

READING TEXT DEVELOPMENT APPROACH

STEP 1: SPEAKING-FOCUSED TEXT PURPOSE ANALYSIS

Before writing, analyze the text's role in a speaking-focused lesson for ${cefrLevel} students:

PURPOSE CLARIFICATION:
- This text serves as a CONVERSATION CATALYST, not comprehensive reading practice
- Students will use this text to GENERATE SPEAKING opportunities about "${topic}"
- The text should PROVIDE ENOUGH CONTENT for meaningful discussion without overwhelming
- Focus on ACCESSIBLE INFORMATION that students can reference, react to, and build upon in conversation

SPEAKING-LESSON TEXT REQUIREMENTS:
- SHORTER TEXTS that can be quickly processed to focus lesson time on speaking
- DISCUSSION-WORTHY CONTENT that naturally generates opinions, questions, and personal connections
- CLEAR TALKING POINTS that students can easily reference during conversations
- RELATABLE SCENARIOS that connect to students' experiences and interests

STEP 2: READER ENGAGEMENT AND COMPREHENSION ANALYSIS FOR ${cefrLevel}

Analyze what ${cefrLevel} students can meaningfully engage with:

COGNITIVE ENGAGEMENT ANALYSIS:
A1 STUDENTS: Can engage with immediate, concrete experiences they can relate to personally
- Personal situations, daily activities, familiar objects and people
- Simple cause-and-effect relationships they experience directly
- Basic problem-solution scenarios from everyday life

A2 STUDENTS: Can engage with personal experiences and simple social situations
- Past experiences, future plans, personal opinions about familiar topics
- Simple comparisons between different places, people, or experiences
- Basic cultural or social topics they encounter in daily life

B1 STUDENTS: Can engage with social issues and practical problems that affect their lives
- Community issues, lifestyle choices, personal challenges and solutions
- Comparing different approaches to common problems
- Topics where they can express opinions and give reasons

B2 STUDENTS: Can engage with analytical thinking about complex social and professional topics
- Abstract concepts they can relate to their experiences
- Multiple perspectives on contemporary issues
- Topics requiring evaluation and critical thinking

C1 STUDENTS: Can engage with sophisticated analysis and nuanced discussion
- Complex social, academic, or professional issues
- Subtle distinctions and implied meanings
- Topics requiring synthesis of multiple ideas and perspectives

C2 STUDENTS: Can engage with highly sophisticated and specialized content
- Expert-level discussions with nuanced argumentation
- Complex interdisciplinary connections
- Topics requiring deep critical analysis and evaluation

STEP 3: CONTENT APPROPRIATENESS AND ENGAGEMENT VALIDATION

Before finalizing content, verify it meets speaking-lesson requirements:

CONTENT VALIDATION CHECKLIST:
✓ PERSONAL RELEVANCE: Can students connect this to their own experiences or opinions?
✓ DISCUSSION POTENTIAL: Does this content naturally generate questions, reactions, and responses?
✓ OPINION-WORTHY: Are there aspects students can agree/disagree with or have personal views about?
✓ ACCESSIBLE COMPLEXITY: Can students understand this quickly to focus on speaking practice?
✓ CONVERSATION STARTERS: Does this provide clear talking points for pair/group discussions?

REJECTION CRITERIA - AVOID CONTENT THAT:
❌ Is purely informational without discussion potential
❌ Requires extensive reading comprehension that dominates lesson time
❌ Is too abstract or distant from students' experiences to generate authentic responses
❌ Provides facts without opportunities for personal reaction or opinion
❌ Is too complex for students to quickly process and then discuss

SPEAKING-OPTIMIZED TEXT LENGTH GUIDELINES:

A1 LEVEL: 80-120 words (2-3 short paragraphs)
- Quick to read, maximum time for speaking practice
- Focus on concrete, relatable situations that generate immediate responses

A2 LEVEL: 100-150 words (2-3 paragraphs)  
- Manageable length allowing focus on conversation
- Include personal experience connections that prompt sharing

B1 LEVEL: 120-180 words (3 paragraphs)
- Balanced content that provides discussion material without overwhelming
- Include different perspectives or approaches students can respond to

B2 LEVEL: 150-220 words (3-4 paragraphs)
- Rich enough content for analytical discussion
- Multiple aspects or viewpoints students can explore in conversation

C1/C2 LEVELS: 180-250 words (3-4 paragraphs)
- Sophisticated content that merits extended discussion
- Complex enough to sustain in-depth conversation while remaining accessible

DISCUSSION PARAGRAPH CONTEXT GUIDELINES:
Each discussion question MUST have its own unique paragraph context (3-5 sentences) that must follow these CEFR level requirements:

- A1 Level Paragraph Contexts: 
  - Use only present tense and very basic vocabulary familiar to beginners
  - 3 very simple sentences with basic subject-verb-object structure
  - No complex clauses or advanced vocabulary
  - Example: "Many people have pets. Cats and dogs are common pets. Some people like fish or birds."

- A2 Level Paragraph Contexts:
  - Use present and simple past tense with elementary-level vocabulary
  - 3-4 simple sentences with some basic conjunctions (and, but, because)
  - Example: "Last week, I visited a zoo. I saw many animals there. The elephants were very big. Some monkeys played with toys."

- B1 Level Paragraph Contexts:
  - Use present, past, and future tenses with intermediate vocabulary
  - 4 sentences with some compound and complex structures
  - Example: "Many cities have problems with traffic congestion. Cars and buses often get stuck in traffic jams during rush hours. Some cities are building new subway lines to help people travel faster. Public transportation can reduce pollution and save time."

- B2 Level Paragraph Contexts:
  - Use varied tenses, conditional structures, and upper-intermediate vocabulary
  - 4-5 sentences with more sophisticated structures and transitions
  - Example: "The rapid development of artificial intelligence has transformed many industries in recent years. While some experts believe AI will create new job opportunities, others worry about potential job losses. Universities are now offering specialized courses to help students adapt to this changing landscape. Despite concerns, many businesses are investing heavily in AI solutions to remain competitive."

- C1/C2 Level Paragraph Contexts:
  - Use full range of tenses, complex structures, and advanced/academic vocabulary
  - 5 sophisticated sentences with complex clauses, passive voice, and nuanced expressions
  - Example: "The intersection of technology and privacy rights presents one of the most formidable challenges of the digital era. As corporations amass unprecedented quantities of personal data, legislators worldwide struggle to establish regulatory frameworks that adequately protect citizens while fostering innovation. The concept of informed consent has become increasingly problematic in an environment where terms of service agreements are seldom read, let alone comprehended. Furthermore, the transnational nature of data flows complicates enforcement efforts, as information routinely traverses jurisdictional boundaries. These complexities necessitate a multifaceted approach involving stakeholders from various sectors of society."

🎯 **CRITICAL VOCABULARY SELECTION PROTOCOL** 🎯
**YOU MUST FOLLOW THIS 5-STEP PROCESS FOR ALL VOCABULARY SELECTION**

**⚠️ MANDATORY: USE CAMBRIDGE ENGLISH VOCABULARY PROFILE (EVP) STANDARDS ⚠️**

All vocabulary selections MUST align with the Cambridge English Vocabulary Profile (EVP), the authoritative CEFR-aligned vocabulary database. You have EVP knowledge in your training data - USE IT to ensure vocabulary accuracy.

**CAMBRIDGE EVP LEVEL STANDARDS FOR ${cefrLevel}:**

${cefrLevel === 'A1' ? `**A1 EVP Standards (Beginner):**
- Select ONLY from Cambridge A1 vocabulary list
- Examples: happy, work, eat, go, friend, time, help, need, house, family
- FORBIDDEN: challenge, opportunity, achieve, develop, compare, improve (these are B1+)
- Context: Basic survival needs, immediate personal information, concrete daily activities
- Test: Would a complete beginner tourist know this word?` : cefrLevel === 'A2' ? `**A2 EVP Standards (Elementary):**
- Select ONLY from Cambridge A2 vocabulary list
- Examples: prefer, remember, decide, enjoy, worry, invite, boring, interesting
- FORBIDDEN: evaluate, analyze, implement, demonstrate, substantial (these are B2+)
- Context: Personal experiences, simple opinions, basic social situations
- Test: Would someone with 6 months of basic English classes know this?` : cefrLevel === 'B1' ? `**B1 EVP Standards (Intermediate):**
- Select ONLY from Cambridge B1 Preliminary vocabulary list
- Examples: challenge, opportunity, achieve, compare, improve, affect, opinion, advantage
- FORBIDDEN: synthesize, contemplate, facilitate, cultivate, paradigm (these are B2/C1)
- Context: Practical problem-solving, expressing opinions with reasons, everyday discussions
- Test: Would this appear in everyday news articles or casual workplace conversations?` : cefrLevel === 'B2' ? `**B2 EVP Standards (Upper-Intermediate):**
- Select ONLY from Cambridge B2 First vocabulary list
- Examples: analyze, evaluate, substantial, compelling, implement, diverse, furthermore
- FORBIDDEN: elucidate, juxtapose, paradigm, ubiquitous, quintessential (these are C1/C2)
- Context: Academic discussions, professional contexts, analytical thinking
- Test: Would this appear in university lectures or business presentations?` : cefrLevel === 'C1' ? `**C1 EVP Standards (Advanced):**
- Select ONLY from Cambridge C1 Advanced vocabulary list
- Examples: elucidate, nuanced, paradigm, multifaceted, inherent, intrinsic, comprehensive
- Context: Sophisticated analysis, expert-level discussion, academic research
- Test: Would this appear in academic journals or specialized professional writing?` : `**C2 EVP Standards (Mastery):**
- Select ONLY from Cambridge C2 Proficiency vocabulary list
- Examples: ubiquitous, ephemeral, quintessential, conundrum, propensity, juxtapose
- Context: Complete mastery of English, native-like precision, specialized discourse
- Test: Would an educated native speaker use this in formal academic writing?`}

**EVP VALIDATION REQUIREMENTS - CHECK EVERY WORD:**
Before accepting ANY vocabulary word, verify:
1. ✓ Word exists in Cambridge EVP at ${cefrLevel} level (or below)
2. ✓ Word is NOT from a higher CEFR level (cross-check against level above)
3. ✓ Word serves genuine communication needs for ${cefrLevel} learners
4. ✓ Students have prerequisite vocabulary to understand this word's definition

**REJECT immediately if:**
✗ Word appears in Cambridge EVP at a HIGHER level than ${cefrLevel}
✗ Word sounds "academic" but you're teaching A1/A2/B1
✗ You're unsure of the word's EVP level (when in doubt, choose simpler)

STEP 1: VOCABULARY LEVEL ANALYSIS (REQUIRED BEFORE SELECTION)

Before selecting vocabulary, analyze what ${cefrLevel} students typically know and should learn next:

FOUNDATION KNOWLEDGE ANALYSIS FOR ${cefrLevel} STUDENTS:
- A1 students know: basic family, food, colors, numbers, simple present tense, essential survival vocabulary
- A2 students know: A1 + basic past tense, common adjectives, simple descriptions, personal experiences
- B1 students know: A1/A2 + present perfect, opinions, comparisons, everyday topics, functional language
- B2 students know: A1/A2/B1 + academic thinking, complex discussions, abstract concepts, discourse markers
- C1 students know: A1-B2 + advanced academic language, nuanced expression, specialized vocabulary
- C2 students know: Near-native vocabulary range including idiomatic and specialized language

APPROPRIATE NEW VOCABULARY FOR ${cefrLevel} LEVEL:
- A1: Concrete, immediate needs (house, clothes, body parts, basic actions)
- A2: Personal experiences and descriptions (interesting, boring, excited, yesterday, tomorrow)
- B1: Social topics and functional language (community, environment, although, however, opinion)
- B2: Academic and analytical language (sustainability, efficiency, infrastructure, furthermore)
- C1: Sophisticated concepts (implications, comprehensive, predominantly, nevertheless)
- C2: Advanced/specialized terminology (nuanced, paradigm, intrinsic, contemporary discourse)

TOO ADVANCED FOR ${cefrLevel} LEVEL:
- For A1: Abstract concepts, complex grammar constructions, specialized terms, academic language
- For A2: Academic vocabulary, complex discourse markers, abstract philosophical concepts
- For B1: Highly academic vocabulary, complex phrasal verbs, advanced idiomatic expressions
- For B2: Specialized technical terms, advanced literary language, highly formal register
- For C1: Archaic or highly specialized jargon, extremely formal academic discourse

STEP 2: TOPIC-APPROPRIATE VOCABULARY SELECTION FOR "${topic}"

Analyze the topic "${topic}" specifically for ${cefrLevel} level:

TOPIC ANALYSIS QUESTIONS:
1. What aspects of "${topic}" are cognitively appropriate for ${cefrLevel} students?
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

STEP 3: PREREQUISITE VOCABULARY VALIDATION

Before finalizing vocabulary selection, verify each word meets these requirements:

PREREQUISITE CHECK FOR EACH SELECTED WORD:
1. FOUNDATION VERIFICATION: "What simpler words must students know to understand this word?"
   - If selecting "comfortable," do they know "feeling," "good," "bad," "when"?
   - If selecting "sustainability," do they know "environment," "future," "protect," "use"?
   - If selecting "infrastructure," do they know "build," "roads," "system," "public"?

2. COGNITIVE APPROPRIATENESS: "Is this word genuinely useful at ${cefrLevel} level?"
   - Will students actually encounter this word in real communication at their level?
   - Does it match their cognitive and linguistic development stage?
   - Can they use this word productively in their own communication?

3. COMMUNICATION RELEVANCE: "Does this word serve real communicative purposes?"
   - Does it help students express ideas they actually need to express?
   - Is it part of high-frequency, useful language patterns?
   - Will it appear in authentic materials they encounter?

AUTOMATIC REJECTION CRITERIA - REJECT WORDS THAT:
❌ Require unknown prerequisite vocabulary for comprehension
❌ Are too abstract/complex for the cognitive level (e.g., "paradigm" for A2 students)
❌ Cannot be defined using significantly simpler language
❌ Are rarely used in real communication at this level
❌ Serve only academic/specialized purposes inappropriate for the level
❌ Are taught better at a different CEFR level

STEP 4: SEMANTIC COHERENCE AND GROUPING

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

STEP 5: FINAL VOCABULARY VALIDATION CHECKLIST

Before submitting your vocabulary selection, verify EVERY word meets ALL criteria:

MANDATORY QUALITY CONTROL CHECKLIST:
✓ LEVEL APPROPRIATENESS: Is each word genuinely appropriate for ${cefrLevel} students?
✓ USEFULNESS VERIFICATION: Will students actually need these words in real communication?
✓ COHERENCE CONFIRMATION: Do the words work together to enable meaningful topic discussion?
✓ DEFINITION FEASIBILITY: Can each word be defined using vocabulary simpler than the target word?
✓ PREREQUISITE VALIDATION: Do students have the foundation vocabulary to understand these words?
✓ COGNITIVE MATCH: Does each word match the cognitive development level of ${cefrLevel} students?
✓ COMMUNICATION VALUE: Does each word serve authentic communicative purposes at this level?
✓ TOPIC RELEVANCE: Is each word directly relevant and useful for discussing "${topic}"?

REPLACEMENT PROTOCOL:
If ANY word fails the above checks, IMMEDIATELY replace it with a more appropriate alternative that:
- Meets all validation criteria
- Serves the same communicative function
- Fits better with the other selected vocabulary
- Enables students to discuss the topic effectively at their level

FINAL CONFIRMATION:
Your selected vocabulary should enable ${cefrLevel} students to engage in meaningful, authentic communication about "${topic}" using language appropriate to their developmental stage.

🎯 VOCABULARY SELECTION SUCCESS CRITERIA:
✓ Words selected through the 5-step analysis process above
✓ Each word serves authentic communication needs for discussing "${topic}"
✓ Vocabulary enables meaningful, topic-specific conversations
✓ Words are appropriately challenging but achievable for ${cefrLevel} students
✓ Selection demonstrates clear reasoning about topic relevance and level appropriateness

CRITICAL LESSON DEVELOPMENT PROCESS:
1. FIRST, select EXACTLY 5 vocabulary words that meet ALL the above criteria and are:
   - Appropriate for the ${cefrLevel} level
   - Highly relevant to the "${topic}" subject
   - Useful for students to know and discuss the topic
   - For each word, create a pronunciation object with THREE fields:
     a. "syllables": Array of syllables (e.g., ["vo", "cab", "u", "lar", "y"])
     b. "stressIndex": Index of the stressed syllable in the array (e.g., 1 for "vo-CAB-u-lar-y")
     c. "phoneticGuide": Text guide showing pronunciation using CAPITALIZATION for stress (e.g., "voh-KAB-yuh-lair-ee")
   - IMPORTANT: DO NOT use IPA symbols like "ə", "ɪ", or "ʃ" in the pronunciation guide. Use only regular English spelling to approximate sounds.

SEMANTIC MAP GENERATION APPROACH:
CRITICAL: For each vocabulary word, you MUST generate a complete semantic map with REAL words, not placeholders. This is essential for the interactive semantic maps feature.

For each vocabulary word, create semanticMap with these 5 categories:

1. **synonyms**: 3-5 words with similar meanings
   - Choose words at appropriate CEFR level (simpler for A1/A2, more sophisticated for C1/C2)
   - Include both exact synonyms and near-synonyms
   - Example: For "happy" → ["joyful", "pleased", "content", "cheerful"]

2. **antonyms**: 2-4 words with opposite meanings
   - Include direct antonyms and contrasting concepts
   - Choose level-appropriate vocabulary
   - Example: For "happy" → ["sad", "upset", "disappointed"]

3. **relatedConcepts**: 3-5 concepts/ideas connected to the word
   - Include broader themes, categories, or associated ideas
   - Think about semantic fields and conceptual connections
   - Example: For "innovation" → ["technology", "progress", "creativity", "development"]

4. **contexts**: 3-4 situations or environments where the word is commonly used
   - Focus on real-world contexts where students might encounter the word
   - Include both formal and informal contexts when appropriate
   - Example: For "negotiate" → ["business meetings", "buying/selling", "conflict resolution"]

5. **associatedWords**: 3-5 words commonly used together with the target word
   - Include common collocations and frequently co-occurring words
   - Think about words that naturally appear in the same sentences or contexts
   - Example: For "environment" → ["protect", "sustainable", "pollution", "conservation"]

SEMANTIC MAP QUALITY REQUIREMENTS:
- NEVER use placeholder text like "synonym1", "word1", "concept1"
- All words must be real English words appropriate for the CEFR level
- Choose words that genuinely relate to the target vocabulary word
- Ensure semantic relationships are accurate and meaningful
- Consider the lesson topic "${topic}" when selecting related words
- Vary the vocabulary complexity based on ${cefrLevel} level

LEVEL-SPECIFIC SEMANTIC MAP GUIDELINES:
- A1/A2: Use basic, high-frequency words in semantic maps
- B1/B2: Include more sophisticated vocabulary and abstract concepts
- C1/C2: Use advanced vocabulary and nuanced semantic relationships

2. SECOND, write a reading passage that:
   - Contains EXACTLY 5 substantial paragraphs (each with 4-6 sentences minimum)
   - Incorporates ALL 5 vocabulary words naturally within the text (one vocabulary word per paragraph)
   - Is appropriate for ${cefrLevel} level in terms of language complexity
   - Covers the "${topic}" subject thoroughly but simply
   - Has sufficient length to provide comprehensive information
   - IMPORTANT: Each paragraph must be substantial with multiple sentences (at least 4-6 per paragraph)
   
3. THIRD, build the rest of the lesson around these vocabulary words and reading passage:
   - The warm-up should explicitly introduce the 5 vocabulary words
   - The vocabulary section should define and elaborate on the same 5 words from the reading
   - Comprehension questions should test understanding of the reading
   - Sentence frames should provide scaffolded practice with topic-related structures
   - Discussion questions should always include EXACTLY 5 questions regardless of CEFR level
   - All subsequent activities should build on the vocabulary and reading

REQUIRED LESSON STRUCTURE:
Return your response as a valid, properly-formatted JSON object that strictly adheres to the following structure. Make sure all arrays use proper square brackets [] and all objects use proper curly braces {}. Do not use property names as values, and ensure all string values are properly quoted:

{
  "title": "Engaging and descriptive lesson title",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Brief, engaging activity introducing the main topic and our 5 key vocabulary items.",
      "questions": [
        "What do you know about this topic?",
        "Have you ever experienced this?",
        "Why is this topic important?"
      ],
      "imageDescription": "A descriptive image that would help introduce the topic",
      "targetVocabulary": ["vocabulary1", "vocabulary2", "vocabulary3", "vocabulary4", "vocabulary5"],
      "timeAllocation": "5 minutes",
      "teacherNotes": "Start by showing images of each vocabulary item. Ask students to share any experiences with the topic."
    },
    {
      "type": "reading",
      "title": "Reading Text",
      "introduction": "Let's read about this important topic.",
      "paragraphs": [
        "First substantial paragraph (4-6 sentences) that introduces the topic and uses at least one vocabulary word naturally. Include sufficient detail and context for students to understand the subject. Make sure the paragraph provides a clear foundation for the rest of the reading.",
        "Second substantial paragraph (4-6 sentences) that develops the topic further and uses another vocabulary word. This paragraph should build upon the introduction with additional facts, examples, or explanations that expand the student's understanding.",
        "Third substantial paragraph (4-6 sentences) with more detailed information and another vocabulary word. This paragraph should explore a different aspect of the topic or go deeper into previously mentioned aspects.",
        "Fourth substantial paragraph (4-6 sentences) exploring implications or applications of the topic with another vocabulary word. This paragraph should connect the topic to real-world contexts or consider its significance.",
        "Final substantial paragraph (4-6 sentences) that summarizes or concludes with the last vocabulary word. This paragraph should bring closure to the reading while reinforcing key points."
      ],
      "imageDescription": "A descriptive image that illustrates a key aspect of the reading",
      "timeAllocation": "15 minutes",
      "teacherNotes": "Have students read the passage once for general understanding, then a second time to identify the vocabulary words in context."
    },
    {
      "type": "vocabulary",
      "title": "Key Vocabulary",
      "introduction": "Let's learn 5 important words from the reading passage.",
      "words": [
        {
          "term": "vocabulary1",
          "partOfSpeech": "noun",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": {"syllables": ["vo", "cab", "u", "lar", "y"], "stressIndex": 1, "phoneticGuide": "voh-KAB-yuh-lair-ee"},
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "vocabulary2",
          "partOfSpeech": "verb",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": {"syllables": ["vo", "cab", "u", "lar", "y"], "stressIndex": 1, "phoneticGuide": "voh-KAB-yuh-lair-ee"},
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "vocabulary3",
          "partOfSpeech": "adjective",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": {"syllables": ["vo", "cab", "u", "lar", "y"], "stressIndex": 1, "phoneticGuide": "voh-KAB-yuh-lair-ee"},
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "vocabulary4",
          "partOfSpeech": "noun",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": {"syllables": ["vo", "cab", "u", "lar", "y"], "stressIndex": 1, "phoneticGuide": "voh-KAB-yuh-lair-ee"},
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        },
        {
          "term": "vocabulary5",
          "partOfSpeech": "verb",
          "definition": "Definition appropriate for the CEFR level",
          "example": "Example sentence using the word naturally",
          "pronunciation": {"syllables": ["vo", "cab", "u", "lar", "y"], "stressIndex": 1, "phoneticGuide": "voh-KAB-yuh-lair-ee"},
          "collocations": ["Common phrase 1", "Common phrase 2"],
          "usageNotes": "Brief notes on how and when to use this word appropriately",
          "teachingTips": "Suggestions for effectively teaching this vocabulary item",
          "imageDescription": "Description of an image that would illustrate this word",
          "semanticMap": {
            "synonyms": ["actual_synonym1", "actual_synonym2", "actual_synonym3"],
            "antonyms": ["actual_antonym1", "actual_antonym2"], 
            "relatedConcepts": ["actual_concept1", "actual_concept2", "actual_concept3"],
            "contexts": ["actual_context1", "actual_context2", "actual_context3"],
            "associatedWords": ["actual_word1", "actual_word2", "actual_word3"]
          }
        }
      ],
      "practice": "Brief activity to practice using the vocabulary",
      "timeAllocation": "10 minutes",
      "teacherNotes": "Show images for each vocabulary word and practice pronunciation before discussing definitions."
    },
    {
      "type": "comprehension",
      "title": "Reading Comprehension",
      "introduction": "Let's check how well you understood the reading passage.",
      "questions": [
        {
          "question": "First question about a key detail from the reading",
          "options": ["Correct answer", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Second question about another aspect of the reading",
          "options": ["Wrong answer 1", "Correct answer", "Wrong answer 2", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Third question testing deeper understanding",
          "options": ["Wrong answer 1", "Wrong answer 2", "Correct answer", "Wrong answer 3"],
          "correctAnswer": "Correct answer"
        },
        {
          "question": "Fourth question about vocabulary in context",
          "options": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3", "Correct answer"],
          "correctAnswer": "Correct answer"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Encourage students to refer back to the text when answering questions."
    },
    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical",
      "title": "Language Practice for ${topic}",
      "introduction": "Practice expressing ideas about ${topic} with these sentence patterns designed for ${cefrLevel} students.",
      "pedagogicalFrames": [
        // GENERATE 3 UNIQUE SENTENCE FRAMES appropriate for ${cefrLevel} level
        // 
        // CEFR-SPECIFIC REQUIREMENTS:
        // A1: Simple present patterns, basic descriptions (e.g., "___ is ___", "I like ___")
        // A2: Simple past/present, basic comparisons (e.g., "I think ___ is ___", "___ is more ___ than ___")
        // B1: Opinions with reasons, cause-effect (e.g., "I believe ___ because ___", "___ leads to ___")
        // B2: Analytical statements, contrasting views (e.g., "One could argue ___", "While ___, on the other hand ___")
        // C1: Sophisticated analysis, nuanced arguments (e.g., "___ demonstrates that ___", "Despite ___, it is evident ___")
        // C2: Expert discourse, critical evaluation (e.g., "The implications of ___", "Notwithstanding ___, the prevailing view ___")
        //
        // Each frame must include:
        // - languageFunction: Communication purpose (e.g., "Describing aspects of ${topic}")
        // - grammarFocus: Array of 2-3 grammar points for ${cefrLevel}
        // - tieredFrames: {emerging, developing, expanding} - each with frame pattern and description
        // - modelResponses: {emerging, developing, expanding} - each with 3 examples about ${topic}
        // - teachingNotes: {modelingTips, guidedPractice, independentUse, fadingStrategy}
        //
        // IMPORTANT: NO hard-coded examples - create unique content for "${topic}" at ${cefrLevel} level
      ]
    },
    {
      "type": "discussion",
      "title": "Post-reading Discussion",
      "introduction": "Let's discuss your thoughts and opinions about this topic.",
      "questions": [
        {
          "paragraphContext": "CRITICAL: Write a unique paragraph (3-5 sentences) that is appropriate for the ${cefrLevel} level. This paragraph should provide context for the first discussion question and contain vocabulary and grammar structures appropriate for ${cefrLevel} level students.",
          "question": "What did you find most interesting about this topic in the reading?"
        },
        {
          "paragraphContext": "CRITICAL: Write a unique paragraph (3-5 sentences) that is appropriate for the ${cefrLevel} level. This paragraph should discuss how the topic relates to everyday experiences and contain vocabulary and grammar structures appropriate for ${cefrLevel} level students.",
          "question": "How does this topic affect your daily life or experiences?"
        },
        {
          "paragraphContext": "CRITICAL: Write a unique paragraph (3-5 sentences) that is appropriate for the ${cefrLevel} level. This paragraph should highlight key ideas from the reading worth discussing and contain vocabulary and grammar structures appropriate for ${cefrLevel} level students.",
          "question": "Do you agree with the main ideas presented in the reading? Why or why not?"
        },
        {
          "paragraphContext": "CRITICAL: Write a unique paragraph (3-5 sentences) that is appropriate for the ${cefrLevel} level. This paragraph should explore potential future developments in this area and contain vocabulary and grammar structures appropriate for ${cefrLevel} level students.",
          "question": "How might this topic change or develop in the future?"
        },
        {
          "paragraphContext": "CRITICAL: Write a unique paragraph (3-5 sentences) that is appropriate for the ${cefrLevel} level. This paragraph should acknowledge the limitations of the reading's scope and contain vocabulary and grammar structures appropriate for ${cefrLevel} level students.",
          "question": "What else would you like to learn about this topic that wasn't covered in the reading?"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Encourage students to use the target vocabulary during the discussion and refer back to specific parts of the reading to support their points."
    },
    {
      "type": "quiz",
      "title": "Knowledge Check Quiz",
      "introduction": "Let's test your understanding of today's lesson with a short quiz that applies the concepts to new situations.",
      "instructions": "IMPORTANT: Create quiz questions that are different from the comprehension questions. Focus on application of concepts, critical thinking, and vocabulary usage in new contexts rather than simple recall of facts from the reading.",
      "questions": [
        {
          "id": 1,
          "question": "Application question that requires using the concepts in a new context",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        },
        {
          "id": 2,
          "question": "Question about using vocabulary in a different situation than shown in the reading",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option B"
        },
        {
          "id": 3,
          "question": "Hypothetical scenario question applying the lesson concepts",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option C"
        },
        {
          "id": 4,
          "question": "Critical thinking question that goes beyond the text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option D"
        },
        {
          "id": 5,
          "question": "Question that connects the lesson topic to broader themes or real-world applications",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        }
      ],
      "timeAllocation": "10 minutes",
      "teacherNotes": "Review answers with the student, explaining any mistakes and reinforcing vocabulary and concepts from the lesson. Focus on helping them apply the knowledge to new situations."
    }
  ]
}`;
  }

  /**
   * Format and clean up the lesson content from the AI response.
   * Transforms the structure to comply with our expected schema.
   */
  private formatLessonContent(content: any): any {
    try {
      console.log('Raw OpenAI content before formatting:', content);
      
      // If we have received a blank or invalid content
      if (!content || typeof content !== 'object') {
        throw new Error('Invalid content received from OpenAI');
      }

      // Make sure we have a sections array
      if (!content.sections || !Array.isArray(content.sections) || content.sections.length === 0) {
        console.error('No sections array found in content or sections array is empty');
        throw new Error('Invalid lesson structure: missing sections');
      }

      // Log some diagnostic info about the sections and their structure
      console.log('Examining raw sections structure:');
      content.sections.forEach((section: any, index: number) => {
        console.log(`Section ${index} type: ${section.type}`);
        
        if (section.questions) {
          console.log(`Section ${index} questions type: ${typeof section.questions}`);
          console.log(`Section ${index} questions value:`, section.questions);
        }
        
        if (section.type === 'warmup' && section.targetVocabulary) {
          console.log(`Warmup targetVocabulary type: ${typeof section.targetVocabulary}`);
          console.log(`Warmup targetVocabulary value:`, section.targetVocabulary);
        }
      });

      // Ensure each section has the required properties based on its type
      const validSections = content.sections.map((section: any) => {
        return this.processSection(section);
      });

      content.sections = validSections;
      
      console.log('Formatted content:', JSON.stringify(content).substring(0, 500) + '...');
      
      return content;
    } catch (error) {
      console.error('Error formatting lesson content:', error);
      throw error;
    }
  }

  /**
   * Process a potential array value to ensure it's a properly formatted array.
   * @param value The value to process
   * @param expectedType The expected type of array elements
   * @returns A properly formatted array
   */
  private processArray(value: any, expectedType: 'string' | 'object'): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      try {
        // Try to parse it as JSON first
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If it parsed as something else, wrap it
        return [parsed];
      } catch (e) {
        // Not valid JSON, split by commas or newlines
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        } else if (value.includes('\n')) {
          return value.split('\n').filter(item => item.trim().length > 0);
        } else {
          return [value];
        }
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.values(value);
    }
    
    // Default fallback
    return [];
  }

  /**
   * Get a default title based on section type
   */
  private getDefaultTitle(type: string): string {
    const titles: Record<string, string> = {
      'warmup': 'Warm-up Activity',
      'reading': 'Reading Text',
      'vocabulary': 'Key Vocabulary',
      'comprehension': 'Reading Comprehension',
      'sentenceFrames': 'Sentence Practice',
      'grammar': 'Grammar Focus',
      'discussion': 'Discussion Questions',
      'speaking': 'Speaking Activity',
      'quiz': 'Knowledge Check',
      'assessment': 'Assessment'
    };
    
    return titles[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Section`;
  }
  
  /**
   * Check if the formatted content meets quality standards
   * This confirms that paragraphs have sufficient length before accepting the content
   * @param content The formatted lesson content to check
   * @returns True if content meets quality standards, false otherwise
   */
  private checkContentQuality(content: any): boolean {
    // Set our quality standards
    const MIN_SENTENCES_PER_PARAGRAPH = 3;
    const MIN_PARAGRAPHS = 5;
    
    try {
      // Find the reading section
      const readingSection = content.sections.find((section: any) => section.type === 'reading');
      
      if (!readingSection) {
        console.log('Quality check failed: No reading section found');
        return false;
      }
      
      // Check if we have enough paragraphs
      if (!Array.isArray(readingSection.paragraphs) || readingSection.paragraphs.length < MIN_PARAGRAPHS) {
        console.log(`Quality check failed: Not enough paragraphs. Found ${readingSection.paragraphs?.length || 0}, need ${MIN_PARAGRAPHS}`);
        return false;
      }
      
      // Check each paragraph for sentence count
      const paragraphQuality = readingSection.paragraphs.map((paragraph: string, index: number) => {
        // Split into sentences - looking for period, exclamation, or question mark followed by a space
        const sentences = paragraph.split(/[.!?]\s+/).filter((s: string) => s.trim().length > 0);
        
        console.log(`Paragraph ${index + 1} has ${sentences.length} sentences`);
        
        return {
          index,
          sentenceCount: sentences.length,
          isGoodQuality: sentences.length >= MIN_SENTENCES_PER_PARAGRAPH
        };
      });
      
      // Check if any paragraphs don't meet quality standards
      const lowQualityParagraphs = paragraphQuality.filter((p: { isGoodQuality: boolean }) => !p.isGoodQuality);
      
      if (lowQualityParagraphs.length > 0) {
        console.log(`Quality check failed: ${lowQualityParagraphs.length} paragraphs have fewer than ${MIN_SENTENCES_PER_PARAGRAPH} sentences`);
        lowQualityParagraphs.forEach((p: { index: number, sentenceCount: number }) => {
          console.log(`Paragraph ${p.index + 1} has only ${p.sentenceCount} sentences`);
        });
        return false;
      }
      
      // All quality checks passed
      return true;
    } catch (error) {
      console.error('Error in quality check:', error);
      return false;
    }
  }

  /**
   * Process an individual section to ensure it has the required properties
   */
  private processSection(section: any): any {
    const fixedSection = { ...section };
    
    // Ensure each section has a title
    if (!fixedSection.title) {
      fixedSection.title = this.getDefaultTitle(fixedSection.type);
    }
    
    // Process specific section types
    
    // For warmup sections, ensure we have questions as an array
    if (fixedSection.type === 'warmup' || fixedSection.type === 'warm-up') {
      if (!fixedSection.questions || !Array.isArray(fixedSection.questions)) {
        fixedSection.questions = this.processArray(fixedSection.questions || [], 'string');
      }
      
      // Ensure we have targetVocabulary as an array
      if (!fixedSection.targetVocabulary || !Array.isArray(fixedSection.targetVocabulary)) {
        fixedSection.targetVocabulary = this.processArray(fixedSection.targetVocabulary || [], 'string');
      }
    }
    
    // Fix paragraphs property if it's a string, object, or number (count)
    if (section.type === 'reading' && fixedSection.paragraphs && !Array.isArray(fixedSection.paragraphs)) {
      if (typeof fixedSection.paragraphs === 'string') {
        // Split the string by double newlines or handle as a single paragraph
        const paragraphs = fixedSection.paragraphs.split(/\n\n+/);
        fixedSection.paragraphs = paragraphs.length > 0 ? paragraphs : [fixedSection.paragraphs];
      } else if (typeof fixedSection.paragraphs === 'number') {
        // If paragraphs is a number, create placeholders
        const count = Math.min(Math.max(1, fixedSection.paragraphs), 10); // Limit between 1-10
        
        // Generate placeholder paragraphs based on the introduction/topic
        const placeholders: string[] = [];
        const topic = fixedSection.title?.replace('Reading Text', '') || 
                    fixedSection.introduction || 
                    'the topic';
        
        // Create generic paragraphs
        for (let i = 0; i < count; i++) {
          placeholders.push(`Paragraph ${i+1} about ${topic}.`);
        }
        
        fixedSection.paragraphs = placeholders;
      } else if (typeof fixedSection.paragraphs === 'object') {
        // Extract values from the object
        const paragraphsArray: string[] = [];
        
        // Add string values
        Object.values(fixedSection.paragraphs).forEach((val: any) => {
          if (typeof val === 'string' && val.trim()) {
            paragraphsArray.push(val);
          }
        });
        
        fixedSection.paragraphs = paragraphsArray;
      }
    }
    
    // Ensure we have complete "reading" section
    if (section.type === 'reading') {
      // Create empty paragraphs array if none exists
      if (!fixedSection.paragraphs || !Array.isArray(fixedSection.paragraphs) || fixedSection.paragraphs.length === 0) {
        fixedSection.paragraphs = ["No reading text was provided."];
      }
      
      // Process paragraphs to fix the single-sentence problem by consolidating them into exactly 5 paragraphs
      if (Array.isArray(fixedSection.paragraphs) && fixedSection.paragraphs.length > 0) {
        console.log('Original paragraph count:', fixedSection.paragraphs.length);
        
        // If we have lots of short paragraphs, consolidate them
        if (fixedSection.paragraphs.length > 5) {
          // The goal is to create exactly 5 robust paragraphs
          const desiredParagraphCount = 5;
          const allSentences = fixedSection.paragraphs.flatMap((para: string) => 
            para.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim())
          );
          
          // Distribute sentences evenly across 5 paragraphs
          const consolidatedParagraphs: string[] = [];
          const sentencesPerParagraph = Math.max(1, Math.ceil(allSentences.length / desiredParagraphCount));
          
          for (let i = 0; i < desiredParagraphCount; i++) {
            const startIdx = i * sentencesPerParagraph;
            const endIdx = Math.min((i + 1) * sentencesPerParagraph, allSentences.length);
            
            if (startIdx < allSentences.length) {
              consolidatedParagraphs.push(allSentences.slice(startIdx, endIdx).join(' '));
            }
          }
          
          fixedSection.paragraphs = consolidatedParagraphs;
          console.log('Consolidated into 5 paragraphs');
        } 
        // If we have fewer than 5 paragraphs, pad with additional context
        else if (fixedSection.paragraphs.length < 5) {
          const existingParagraphs = [...fixedSection.paragraphs];
          
          while (existingParagraphs.length < 5) {
            // Generate a logical additional paragraph based on content
            const baseText = `This point further illustrates the importance of the topic and connects to real-world applications.`;
            existingParagraphs.push(baseText);
          }
          
          fixedSection.paragraphs = existingParagraphs;
          console.log('Padded paragraphs to reach 5 total');
        }
      }
      
      // Ensure we have the introduction
      if (!fixedSection.introduction) {
        fixedSection.introduction = "Let's read the following text:";
      }
    }
    
    // Ensure we have vocabulary words
    if (section.type === 'vocabulary') {
      // Handle if words is a number (count) rather than an array
      if (typeof fixedSection.words === 'number') {
        const count = Math.min(Math.max(1, fixedSection.words), 10); // Limit between 1-10
        
        // Create placeholder vocabulary words
        const words = [];
        for (let i = 0; i < count; i++) {
          words.push({
            term: `vocabulary term ${i + 1}`,
            partOfSpeech: "noun",
            definition: `Definition for vocabulary term ${i + 1}`,
            example: `Example sentence using vocabulary term ${i + 1}`
          });
        }
        
        fixedSection.words = words;
      }
      // Create empty words array if none exists
      else if (!fixedSection.words || !Array.isArray(fixedSection.words) || fixedSection.words.length === 0) {
        fixedSection.words = [{
          term: "vocabulary",
          partOfSpeech: "noun",
          definition: "The words used in a particular language.",
          example: "The lesson focuses on building vocabulary for everyday situations.",
        }];
      }
      // Convert string words to proper objects if needed
      else if (Array.isArray(fixedSection.words)) {
        fixedSection.words = fixedSection.words.map((word: any) => {
          if (typeof word === 'string') {
            return {
              term: word,
              partOfSpeech: "noun",
              definition: "No definition provided.",
              example: `Example using "${word}".`
            };
          }
          return word;
        });
      }
    }
    
    // Ensure comprehension, discussion, and quiz sections have questions
    if ((section.type === 'comprehension' || section.type === 'discussion' || section.type === 'quiz') 
        && (!fixedSection.questions || !Array.isArray(fixedSection.questions))) {
      
      // Try to process questions
      const questions = this.processArray(fixedSection.questions || [], 'object');
      
      // If we have a quiz or comprehension, ensure we have proper question objects
      if (section.type === 'quiz' || section.type === 'comprehension') {
        fixedSection.questions = questions.map((q: any, index: number) => {
          if (typeof q === 'string') {
            return {
              id: index + 1,
              question: q,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A"
            };
          }
          return q;
        });
      } else {
        // For discussion, ensure we have proper question objects with paragraph context
        fixedSection.questions = questions.map((q: any, index: number) => {
          if (typeof q === 'object' && q !== null) {
            // If the question is already an object, ensure it has the right structure
            return {
              ...q,
              question: q.question || q.text || `Discussion Question ${index + 1}`,
              // Preserve or set paragraph context
              paragraphContext: q.paragraphContext || q.context || q.paragraph || q.introduction || null
            };
          } else if (typeof q === 'string') {
            // If the question is a string, create a new object with default values
            return {
              question: q,
              paragraphContext: null
            };
          }
          return {
            question: `Discussion Question ${index + 1}`,
            paragraphContext: null
          };
        });
      }
      
      // If we still have no questions, add a default
      if (fixedSection.questions.length === 0) {
        if (section.type === 'quiz' || section.type === 'comprehension') {
          fixedSection.questions = [
            {
              id: 1,
              question: `Question about ${section.title || 'the topic'}`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A"
            }
          ];
        } else {
          fixedSection.questions = [
            {
              question: `What do you think about ${section.title || 'this topic'}?`,
              paragraphContext: null
            }
          ];
        }
      }
    }
    
    // Special processing for discussion sections to ensure each question has a proper paragraph context
    if (section.type === 'discussion' && fixedSection.questions && Array.isArray(fixedSection.questions)) {
      // Process each discussion question to ensure it has proper paragraph context
      fixedSection.questions = fixedSection.questions.map((q: any, index: number) => {
        // Standardize question format
        let questionObj: any;
        
        if (typeof q === 'string') {
          // Convert string questions to objects
          questionObj = { question: q, paragraphContext: null };
        } else if (typeof q === 'object' && q !== null) {
          // Use existing object structure
          questionObj = { ...q };
          // Ensure question field exists
          questionObj.question = q.question || q.text || `Discussion Question ${index + 1}`;
        } else {
          // Create default object for invalid types
          questionObj = {
            question: `Discussion Question ${index + 1}`,
            paragraphContext: null
          };
        }
        
        // Check for paragraph context in various possible field names
        if (!questionObj.paragraphContext) {
          // Try to find paragraph context in other properties
          questionObj.paragraphContext = 
            questionObj.context || 
            questionObj.paragraph || 
            questionObj.introduction || 
            (section.paragraphContext ? section.paragraphContext : null);
          
          // If we found the context in introduction and it looks like a paragraph (not a question)
          if (questionObj.introduction && 
              typeof questionObj.introduction === 'string' && 
              questionObj.introduction.includes('.') && 
              !questionObj.introduction.includes('?')) {
            questionObj.paragraphContext = questionObj.introduction;
          }
        }
        
        return questionObj;
      });
    }
    
    // Ensure sentence frames section has frames
    if (section.type === 'sentenceFrames' && (!fixedSection.frames || !Array.isArray(fixedSection.frames))) {
      fixedSection.frames = this.processArray(fixedSection.frames || [], 'string');
      
      if (fixedSection.frames.length === 0) {
        fixedSection.frames = [
          "I think _____ is _____.",
          "The most important thing about _____ is _____."
        ];
      }
    }
    
    return fixedSection;
  }

  /**
   * Pre-processes the API response content to fix common structural issues
   * before passing it to the formatter
   */
  private preprocessContent(content: any): any {
    if (!content || typeof content !== 'object') {
      return content;
    }
    
    const processed = { ...content };
    
    // Ensure we have a title
    if (!processed.title) {
      processed.title = 'ESL Lesson';
    }
    
    // Ensure we have a level
    if (!processed.level) {
      processed.level = 'B1';
    }
    
    // Ensure we have a focus
    if (!processed.focus) {
      processed.focus = 'general';
    }
    
    // Ensure estimatedTime is a number
    if (!processed.estimatedTime || typeof processed.estimatedTime !== 'number') {
      processed.estimatedTime = 60;
    }
    
    // Ensure we have a sections array
    if (!processed.sections || !Array.isArray(processed.sections)) {
      processed.sections = [];
    }
    
    // Process sections
    processed.sections = processed.sections.map((section: any) => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      
      // Create a copy of the section to avoid modifying the original
      const fixedSection = { ...section };
      
      // Skip sections without a type
      if (!fixedSection.type) {
        return null;
      }
      
      // Normalize section type names (warmup vs warm-up)
      if (fixedSection.type === 'warm-up') {
        fixedSection.type = 'warmup';
      }
      
      return fixedSection;
    }).filter((section: any) => section !== null);
    
    // Ensure we have all required sections
    const requiredSectionTypes = ['warmup', 'reading', 'vocabulary', 'comprehension'];
    const availableSectionTypes = processed.sections.map((s: any) => s.type);
    
    requiredSectionTypes.forEach(type => {
      if (!availableSectionTypes.includes(type)) {
        // Add a placeholder section of this type
        processed.sections.push({
          type,
          title: this.getDefaultTitle(type),
          content: `This ${type} section was not provided by the AI.`
        });
      }
    });
    
    console.log('Preprocessing complete.');
    return processed;
  }
}

// Create a singleton instance with the API key
export const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || '');