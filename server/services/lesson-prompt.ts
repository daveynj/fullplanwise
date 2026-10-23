import type { LessonGenerateParams } from '@shared/schema';

/**
 * Builds the prompts sent to the AI for lesson generation.
 *
 * The prompts are written as a brief to an experienced teacher: they explain
 * the class (relaxed one-to-one conversation lessons), the student (what a
 * learner at this level comfortably understands) and the teaching approach
 * (the five target words are the only new language; everything else should be
 * easy to follow). Firm rules are kept only where the app depends on them:
 * the JSON shape, item counts, cloze markers and unscramble word lists.
 */

export interface LevelGuidance {
  /** Short CEFR name shown next to the level, e.g. "Beginner". */
  description: string;
  /** Completes the sentence "A B1 student ..." — what they comfortably understand and talk about. */
  canUnderstand: string;
  /** How to pitch the language around the target words at this level. */
  languageNote: string;
  vocabularyGuidance: string;
  definitionGuidance: string;
  readingLength: string;
  readingGuidance: string;
  sentenceFrameGuidance: string;
  discussionGuidance: string;
  needsLowerLevelScaffolding: boolean;
}

const LEVEL_GUIDANCE: Record<string, LevelGuidance> = {
  A1: {
    description: 'Beginner',
    canUnderstand:
      'understands familiar everyday words and very simple sentences about themselves, their family, home, food, daily routine and the things around them. They need short, clear sentences and lots of support.',
    languageNote:
      'Unknown words make beginners lose the thread and stop talking, so the challenge should come from the five target words, not from difficult wording. Use only very common, concrete words and short sentences. If you are not sure whether a word or sentence is too hard, use a simpler one.',
    vocabularyGuidance:
      'Choose basic, high-frequency words for everyday life and immediate personal needs. Avoid abstract or complex words.',
    definitionGuidance: 'use only the 500 most common words, under 8 words, present tense only',
    readingLength: '80-120 words',
    readingGuidance:
      'Use very simple sentences of 6-8 words. Stick to present simple and simple past. Describe concrete, everyday things the student can picture. No idioms or abstract ideas.',
    sentenceFrameGuidance:
      'Use simple present patterns like "I like ___" or "___ is ___". Focus on basic descriptions and preferences.',
    discussionGuidance:
      'Ask about the student\'s own life, likes and routines. Each question should be answerable with a short, simple sentence, like "What do you eat for breakfast?"',
    needsLowerLevelScaffolding: true,
  },
  A2: {
    description: 'Elementary',
    canUnderstand:
      'understands sentences and common expressions about familiar things such as family, shopping, school, work, free time, travel and past experiences. They can describe their life in simple terms and give simple opinions.',
    languageNote:
      'Unknown words make students at this level lose the thread and stop talking, so the challenge should come from the five target words, not from difficult wording. Use common everyday words and simple sentences. If you are not sure whether a word or sentence is too hard, use a simpler one.',
    vocabularyGuidance:
      'Choose words about personal experiences and simple social situations that the student can connect to daily life.',
    definitionGuidance: 'use the top 1,000 words, under 10 words, present and simple past tense',
    readingLength: '100-150 words',
    readingGuidance:
      'Use simple sentences of 8-10 words with basic connectors (and, but, because). Include simple past for experiences. Focus on relatable situations.',
    sentenceFrameGuidance:
      'Use simple comparisons like "___ is more ___ than ___" and basic opinions like "I think ___ is ___".',
    discussionGuidance:
      'Ask about personal experiences, simple comparisons and simple opinions, like "Which do you like more, ___ or ___? Why?" Give clear context.',
    needsLowerLevelScaffolding: true,
  },
  B1: {
    description: 'Intermediate',
    canUnderstand:
      'understands clear, standard English about familiar topics such as work, school, free time, travel and everyday news. They can describe experiences, plans and hopes, and give short reasons for their opinions, but long or abstract sentences slow them down.',
    languageNote:
      'Unknown words make students at this level lose the thread and stop talking, so the challenge should come from the ideas and the target words, not from difficult wording. Use everyday language and clear sentences, and avoid academic, formal or rare words outside the target vocabulary. If you are not sure whether a word or sentence is too hard, use a simpler one.',
    vocabularyGuidance:
      'Choose words for talking about practical problems, giving opinions with reasons and discussing lifestyle choices. Avoid academic vocabulary.',
    definitionGuidance: 'use A2 vocabulary plus common B1 words, under 12 words',
    readingLength: '120-180 words',
    readingGuidance:
      'Use sentences of 10-12 words with connectors like because, so, although, however. Include opinions and reasons. Discuss practical topics.',
    sentenceFrameGuidance:
      'Include opinions with reasons like "I think ___ because ___" and cause-and-effect patterns like "When ___, ___".',
    discussionGuidance:
      'Ask for opinions with reasons, and about real-life choices and problems. Keep each question to one clear idea, like "Is it better to ___ or ___? Why?"',
    needsLowerLevelScaffolding: true,
  },
  B2: {
    description: 'Upper Intermediate',
    canUnderstand:
      'understands the main ideas of most conversations, articles, TV shows and news, including some less familiar topics. They can talk fluently about their opinions, compare advantages and disadvantages, and keep a conversation going, but heavy academic or technical language is still hard work.',
    languageNote:
      'The challenge should come from the ideas and the target words, not from difficult wording. Use natural, everyday English of the kind found in good magazines, news and conversation; phrasal verbs and common idioms are fine. Prefer the everyday word to the formal one, like "supporters" rather than "proponents" or "keep" rather than "retain", and avoid academic or technical wording unless the topic really needs it.',
    vocabularyGuidance:
      'Choose B2 words, or useful C1 words, that help the student say more precisely what they think about the topic: the kind of words used in news, at work and in real-life discussions. Avoid rare academic or technical words unless the topic needs them.',
    definitionGuidance: 'use B1 vocabulary, focus on precision, under 15 words',
    readingLength: '150-220 words',
    readingGuidance:
      'Write like a good magazine or news feature: varied sentences of about 12-15 words, natural connectors and more than one point of view. It should be interesting and easy to follow.',
    sentenceFrameGuidance:
      'Include frames for comparing views, giving pros and cons and imagining situations, like "Some people say ___, but I think ___ because ___" or "If I ___, I would ___".',
    discussionGuidance:
      'Ask open questions that invite the student to take a position, weigh up pros and cons, or imagine a situation. The depth should come from the idea, not from long or formal wording.',
    needsLowerLevelScaffolding: false,
  },
  C1: {
    description: 'Advanced',
    canUnderstand:
      'understands a wide range of long, demanding texts and conversations, including implied meaning, humour and idioms. They express themselves fluently and naturally, and can discuss complex and abstract topics in detail.',
    languageNote:
      'Keep the lesson genuinely challenging and do not simplify: a C1 student wants real, rich English and gets bored by easy text. The challenge should come from the ideas, the target words and the richness of the language. Use precise and varied vocabulary, idioms, phrasal verbs and natural native-speaker style, the way articulate people write in a quality magazine and talk among friends. Avoid only jargon and the stiff style of an academic paper.',
    vocabularyGuidance:
      'Choose C1 or C2 words and expressions that fluent speakers use, such as precise verbs and adjectives, strong collocations and idiomatic phrases, so the student can express finer shades of meaning. Avoid words a B2 student would already know: these words are the main challenge of the lesson.',
    definitionGuidance: 'explain the meaning precisely in plain English, under 20 words; the definition must be easier than the word',
    readingLength: '180-250 words',
    readingGuidance:
      'Write like a quality long-form magazine article: varied, natural sentences, ideas worth thinking about, and some implied meaning or idiom. Demanding in ideas and style, not in jargon.',
    sentenceFrameGuidance:
      'Use frames for nuanced opinions, such as qualifying, conceding and challenging an idea, like "I see the point about ___, but ___" or "It\'s not so much ___ as ___".',
    discussionGuidance:
      'Ask thought-provoking questions about bigger or more abstract ideas linked to the topic: dilemmas, trade-offs and "what would happen if..." situations. Phrase them the way a thoughtful friend would ask: clear and direct, even when the idea is complex.',
    needsLowerLevelScaffolding: false,
  },
  C2: {
    description: 'Proficiency',
    canUnderstand:
      'understands virtually everything they hear or read with ease, including subtle meaning, irony and cultural references. They express themselves spontaneously and very precisely.',
    languageNote:
      'Make the lesson demanding and do not simplify: subtle ideas, precise and idiomatic vocabulary, irony and cultural references where they fit, in the natural style of skilled native speakers. The challenge should come from the ideas, the target words and the style. Avoid only jargon and the stiff style of an academic paper.',
    vocabularyGuidance:
      'Choose C2 words and expressions: precise, less common and idiomatic vocabulary that native speakers use to draw fine distinctions in meaning. Avoid words a C1 student would already know.',
    definitionGuidance: 'explain precisely in natural English, under 20 words, showing how the word differs from close synonyms',
    readingLength: '180-250 words',
    readingGuidance:
      'Write as a skilled native writer would for a quality publication: subtle, idiomatic and stylish, with irony, cultural references or implied meaning where they fit. Challenging through ideas and style, not jargon.',
    sentenceFrameGuidance:
      'Use frames for subtle argument and precise nuance: qualifying, conceding, speculating and persuading.',
    discussionGuidance:
      'Ask challenging, open-ended questions that invite debate, fine distinctions and personal reflection. Phrase them naturally, like a well-read friend starting a conversation.',
    needsLowerLevelScaffolding: false,
  },
};

/** Level guidance for a CEFR level; unknown levels fall back to B1. */
export function getLevelGuidance(cefrLevel: string): LevelGuidance {
  return LEVEL_GUIDANCE[cefrLevel] ?? LEVEL_GUIDANCE.B1;
}

/**
 * The teacher's request often contains private notes about the student
 * ("this student is only 11…", "she works in treasury…"). The AI may use them
 * to shape the lesson but must not repeat them in student-facing text, which
 * can end up in the public library.
 */
const TEACHER_NOTES_GUIDANCE =
  'The request may include notes about the student, such as their age, job, interests or things to avoid. Use these notes to shape the lesson (for example, choose situations and examples that suit the student), but do not repeat the notes themselves in the lesson. The student sees the lesson, so titles and text should talk about the topic, not describe the student.';

/**
 * The sections of a lesson, in the order the prompt asks for them and the
 * lesson stores them.
 */
export const LESSON_SECTION_TYPES = [
  'warmup',
  'reading',
  'vocabulary',
  'comprehension',
  'sentenceFrames',
  'cloze',
  'sentenceUnscramble',
  'discussion',
  'quiz',
] as const;

export type LessonSectionType = (typeof LESSON_SECTION_TYPES)[number];

/** Plain names for the sections, used in prompts and logs. */
export const LESSON_SECTION_NAMES: Record<LessonSectionType, string> = {
  warmup: 'warm-up',
  reading: 'reading text',
  vocabulary: 'vocabulary',
  comprehension: 'vocabulary check',
  sentenceFrames: 'sentence frames',
  cloze: 'fill-in-the-blank',
  sentenceUnscramble: 'sentence unscramble',
  discussion: 'discussion questions',
  quiz: 'quiz',
};

/** Opening shared by the lesson and section prompts: the role, the class, the student and the level. */
function promptIntro(params: LessonGenerateParams, g: LevelGuidance): string {
  const { cefrLevel, topic, focus, lessonLength } = params;

  return `<role>
You are an experienced, friendly ESL teacher preparing a ${lessonLength}-minute lesson for one ${cefrLevel} (${g.description}) student.
</role>

<output_format>
CRITICAL: Return ONLY valid JSON. Start with { and end with }. No markdown, no explanations, no text before or after.
</output_format>

<the_class>
This is a relaxed one-to-one conversation class, taught online over screen share: the teacher and the student look at the lesson together and talk about it. The goal is to get the student speaking about their own life, experiences and opinions, and to use five new words along the way. Every part of the lesson should give the student something to react to and talk about.

The teacher's request: "${topic}"
Focus area: "${focus}"

${TEACHER_NOTES_GUIDANCE}
</the_class>

<the_student>
A ${cefrLevel} student ${g.canUnderstand}
</the_student>

<language_level>
The five target words are the new language in this lesson. Everything else the student reads (the reading text, warm-up, questions, activity instructions, sentence frames, exercises and quiz) should be pitched at a ${cefrLevel} student's level, so their attention goes to speaking and to the new words. Teacher notes are for the teacher and can be written normally.

${g.languageNote}
</language_level>

<conversation_style>
Write every question the way a friendly teacher would ask it out loud: natural, direct and personal. Avoid exam-style or essay-style wording. For example, these two questions ask about the same idea:
- Essay style (avoid): "To what extent do socioeconomic factors shape individuals' dietary choices?"
- Conversation style: "Do you think money decides what people eat? What about in your family?"
</conversation_style>`;
}

/** Words the student already knows and words the teacher asked for (empty when there are none). */
function vocabularyNotes(params: LessonGenerateParams, studentVocabulary: string[]): string {
  const vocabularyHistoryNote = studentVocabulary.length > 0
    ? `
STUDENT'S PREVIOUS VOCABULARY:
This student has already learned these words: ${studentVocabulary.join(', ')}

You may use these words naturally when they fit, but choose 5 NEW words as the focus vocabulary for this lesson. Prioritize creating engaging content over forcing in previously learned words.
`
    : '';

  const requiredVocabularyNote = params.targetVocabulary
    ? `\nREQUIRED VOCABULARY: Include these specific words: ${params.targetVocabulary}\n`
    : '';

  return `${vocabularyHistoryNote}${requiredVocabularyNote}`;
}

function vocabularyChoice(cefrLevel: string, g: LevelGuidance): string {
  return `Choose 5 words at ${cefrLevel} level, using the Cambridge English Vocabulary Profile as a guide: words a ${cefrLevel} student is ready to learn but probably doesn't use yet, and that will be genuinely useful when talking about this topic. ${g.vocabularyGuidance}

<guidance>
Ask yourself: Is this word new and worth learning for a ${cefrLevel} student, rather than one they already know? Will it help them talk about the topic? Can it be explained with simpler words?
</guidance>`;
}

function vocabularyRequirements(g: LevelGuidance): string {
  return `<requirements>
Each word needs:
- term, partOfSpeech
- definition (clear and simple, ${g.definitionGuidance})
- example (natural usage sentence; apart from the target word, at the student's level)
- collocations (2-3 common phrases)
- wordFamily (related word forms with description)
- usageNotes (when and how to use it)
- pronunciation with syllables array, stressIndex number, and phoneticGuide using English letters only (like "eg-ZAM-pul"), no IPA symbols
- imagePrompt (40-80 words describing a scene that illustrates the word, ending with "No text visible")
- semanticMap with synonyms, antonyms, relatedConcepts, contexts, and associatedWords
</requirements>`;
}

function readingStep(g: LevelGuidance): string {
  return `Write a reading text of ${g.readingLength} in exactly 5 paragraphs. Its job is to give the student something interesting to react to and talk about, such as a story, a real situation or different points of view, not to test their reading.

${g.readingGuidance}

<requirements>
Include all 5 vocabulary words naturally, each appearing 2-3 times with context clues. Keep vocabulary density to about 1 new word per 25 words.
</requirements>`;
}

const COMPREHENSION_STEP = `Write exactly 5 questions testing vocabulary understanding (one per word). These test whether students know the vocabulary, NOT whether they remember facts from the reading. Keep the questions and answer options simple, so the only thing being tested is the target word.

<good_formats>
- "What does [word] mean?"
- "Which sentence uses [word] correctly?"
- "In which situation would you use [word]?"
</good_formats>

<avoid>
"According to the passage..." or "In the reading..." - these test reading recall, not vocabulary.
</avoid>

<critical>You MUST randomize the position of the correct answer for each question. Do not always place it in the same position (e.g., always B). Distribute correct answers randomly across A, B, C, and D.</critical>`;

function sentenceFramesStep(cefrLevel: string, g: LevelGuidance): string {
  return `Create 3 sentence frames that help the student say the things they will want to say in this lesson's discussions. Each needs three tiers:
- emerging (simplest, maximum support)
- developing (moderate complexity)
- expanding (more complex, for confident students, still natural for a ${cefrLevel} speaker)

${g.sentenceFrameGuidance}

<requirements>
The pedagogicalFrames array must contain all 3 frames. Include 3 model responses per tier and teaching notes with modeling tips, guided practice, independent use guidance, and fading strategy.
${g.needsLowerLevelScaffolding ? 'Include a "lowerLevelScaffolding" object with sentenceWorkshop, patternTrainer, and visualMaps.' : ''}
</requirements>`;
}

function discussionStep(g: LevelGuidance): string {
  return `These are the heart of the lesson. Create 5 discussion questions that get the student talking about their own experiences and opinions. Each needs:
- paragraphContext (3-5 sentences at the student's level that set up the question with a situation or some background)
- question (natural and conversational: one main question, optionally with a short follow-up like "Why?")
- imagePrompt (50-80 words describing a related scene, ending with "No text visible")

${g.discussionGuidance}

<requirements>
Make questions culturally inclusive and globally accessible.
</requirements>`;
}

const CLOZE_ACTIVITY = `Cloze exercise: Create a fill-in-the-blank paragraph in language at the student's level apart from the target words. It must contain exactly 5 blanks, one for each of the 5 vocabulary words. Use each vocabulary word from the word bank once.
<critical>The blanks must NOT appear in the same order as the vocabulary was taught. Randomize which vocabulary word appears in each blank position - for example, if vocabulary is taught as [word1, word2, word3, word4, word5], the blanks in the paragraph should use them in a different order like [word3, word1, word5, word2, word4].</critical>
Format blanks as [1:word], [2:word], etc. where the number is the blank position in the text (not the vocabulary order). Always write the actual vocabulary word inside the brackets, never underscores: the app hides the word and turns it into the blank. The wordBank contains base forms; add grammatical endings after the bracket when needed (like "[1:challenge]s" for plural).`;

const UNSCRAMBLE_ACTIVITY = `Sentence unscramble: Create 3 grammatically correct and natural-sounding sentences using lesson vocabulary. IMPORTANT: Sentences must sound like natural, idiomatic English that native speakers would actually say - avoid awkward literal translations.
<requirements>
For each sentence:
- First create the complete grammatically correct sentence and put it in "correctSentence"
- Then extract EXACTLY the words from that sentence (no more, no less) and put them in the "words" array in their original order
- The words array must contain every single word from the correctSentence and nothing else
- Include ALL words: articles (the/a/an), prepositions (in/on/at), pronouns (it/they/we), conjunctions (and/but/or), etc.
- Do NOT add extra words or omit any words from the sentence
</requirements>`;

const QUIZ_STEP = `Write 5 quiz questions about the lesson. Mix multiple choice and true/false. Use simple, clear wording: the quiz checks what the student learned, not how well they can read difficult questions.
<critical>For multiple choice, you MUST randomize the position of the correct answer. Do not use a fixed pattern.</critical>
<requirements>Include clear explanations for all answers.</requirements>`;

/**
 * JSON template for each section, indented to sit inside the lesson's
 * "sections" array. The model copies these closely, item counts included.
 */
const SECTION_TEMPLATES: Record<LessonSectionType, (g: LevelGuidance) => string> = {
  warmup: () => `    {
      "type": "warmup",
      "title": "Warm-up Activity",
      "content": "Brief warm-up description",
      "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"],
      "targetVocabulary": ["word1", "word2", "word3", "word4", "word5"],
      "procedure": "Step-by-step instructions",
      "teacherNotes": "Teaching tips"
    }`,
  reading: () => `    {
      "type": "reading",
      "title": "Reading Text: [Title]",
      "introduction": "Brief setup",
      "paragraphs": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3...", "Paragraph 4...", "Paragraph 5..."],
      "teacherNotes": "How to approach the reading"
    }`,
  vocabulary: () => `    {
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
    }`,
  comprehension: () => `    {
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
    }`,
  sentenceFrames: (g) => `    {
      "type": "sentenceFrames",
      "version": "v2_pedagogical",
      "title": "Language Practice: [short topic name]",
      "introduction": "Practice expressing ideas about [short topic name].",
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
        },
        {
          "languageFunction": "A different communication purpose",
          "grammarFocus": ["grammar point"],
          "tieredFrames": {"emerging": {"frame": "...", "description": "..."}, "developing": {"frame": "...", "description": "..."}, "expanding": {"frame": "...", "description": "..."}},
          "modelResponses": {"emerging": ["...", "...", "..."], "developing": ["...", "...", "..."], "expanding": ["...", "...", "..."]},
          "teachingNotes": {"modelingTips": "...", "guidedPractice": "...", "independentUse": "...", "fadingStrategy": "..."}
        },
        {
          "languageFunction": "A third communication purpose",
          "grammarFocus": ["grammar point"],
          "tieredFrames": {"emerging": {"frame": "...", "description": "..."}, "developing": {"frame": "...", "description": "..."}, "expanding": {"frame": "...", "description": "..."}},
          "modelResponses": {"emerging": ["...", "...", "..."], "developing": ["...", "...", "..."], "expanding": ["...", "...", "..."]},
          "teachingNotes": {"modelingTips": "...", "guidedPractice": "...", "independentUse": "...", "fadingStrategy": "..."}
        }
      ]${g.needsLowerLevelScaffolding ? `,
      "lowerLevelScaffolding": {
        "sentenceWorkshop": "Step-by-step guidance",
        "patternTrainer": "Repeated practice approach",
        "visualMaps": "Visual structure representations"
      }` : ''}
    }`,
  cloze: () => `    {
      "type": "cloze",
      "title": "Fill in the Blanks",
      "text": "Paragraph with [1:word] format blanks. Add endings outside brackets like [2:work]ed.",
      "wordBank": ["word1", "word2", "word3", "word4", "word5"],
      "teacherNotes": "How to use this exercise"
    }`,
  sentenceUnscramble: () => `    {
      "type": "sentenceUnscramble",
      "title": "Sentence Unscramble",
      "sentences": [
        {"words": ["scrambled", "words", "here"], "correctSentence": "Words here scrambled."},
        {"words": ["another", "scrambled", "sentence"], "correctSentence": "Another scrambled sentence."},
        {"words": ["third", "example", "sentence"], "correctSentence": "Third example sentence."}
      ],
      "teacherNotes": "How to approach this activity"
    }`,
  discussion: () => `    {
      "type": "discussion",
      "title": "Discussion Questions",
      "questions": [
        {
          "paragraphContext": "3-5 sentences at the student's level that set up the question with a situation or some background.",
          "question": "Natural, conversational question inviting a personal response?",
          "imagePrompt": "Scene description (50-80 words) showing the context. Setting, characters, actions, emotions. Realistic illustration, natural lighting. No text visible."
        }
      ]
    }`,
  quiz: () => `    {
      "type": "quiz",
      "title": "Knowledge Check",
      "questions": [
        {"question": "Quiz question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "The correct option", "correctAnswer": "The correct option", "explanation": "Why correct"},
        {"question": "True or false?", "options": ["True", "False"], "answer": "True", "correctAnswer": "True", "explanation": "Why true"}
      ]
    }`,
};

export function buildLessonPrompt(params: LessonGenerateParams, studentVocabulary: string[] = []): string {
  const { cefrLevel, focus, lessonLength } = params;
  const g = getLevelGuidance(cefrLevel);

  return `${promptIntro(params, g)}
${vocabularyNotes(params, studentVocabulary)}
---

<instructions>
CREATING YOUR LESSON:

<step number="1" title="SELECT 5 VOCABULARY WORDS">
${vocabularyChoice(cefrLevel, g)}

${vocabularyRequirements(g)}
</step>

<step number="2" title="WRITE THE READING TEXT">
${readingStep(g)}
</step>

<step number="3" title="CREATE 5 VOCABULARY CHECK QUESTIONS">
${COMPREHENSION_STEP}
</step>

<step number="4" title="DESIGN 3 SENTENCE FRAMES">
${sentenceFramesStep(cefrLevel, g)}
</step>

<step number="5" title="WRITE 5 DISCUSSION QUESTIONS">
${discussionStep(g)}
</step>

<step number="6" title="ADD PRACTICE ACTIVITIES">
<activity name="cloze">
${CLOZE_ACTIVITY}
</activity>

<activity name="sentence_unscramble">
${UNSCRAMBLE_ACTIVITY}
</activity>
</step>

<step number="7" title="CREATE 5 QUIZ QUESTIONS">
${QUIZ_STEP}
</step>

</instructions>

---

<validation>
BEFORE GENERATING:

Verify: 5 vocabulary words with all fields, 5 reading paragraphs, 5 comprehension questions (one per vocab word), 3 sentence frames with tiered scaffolding, 5 discussion questions with paragraphContext and imagePrompt, 5 quiz questions. All image prompts end with "No text visible". Same 5 vocabulary words in warmup.targetVocabulary and vocabulary section. Apart from the 5 target words, everything the student reads is pitched at a ${cefrLevel} student's level, and every question sounds like natural conversation. Titles name the topic only, never notes about the student.
</validation>

---

<json_schema>
JSON STRUCTURE (showing format - generate complete content for all items):

{
  "title": "Short, engaging lesson title about the topic",
  "level": "${cefrLevel}",
  "focus": "${focus}",
  "estimatedTime": ${lessonLength},
  "sections": [
${LESSON_SECTION_TYPES.map((type) => SECTION_TEMPLATES[type](g)).join(',\n')}
  ]
}
</json_schema>

<final_instruction>
Generate complete content for ALL items: 5 vocabulary words, 5 paragraphs, 5 comprehension questions, 3 sentence frames, 5 discussion questions, 5 quiz questions.
</final_instruction>

BEGIN JSON:`;
}

/** What the rest of the lesson already says, so a regenerated section fits in. */
export interface LessonSectionContext {
  title?: string;
  /** The lesson's five target words; empty when no section lists them. */
  targetWords: string[];
  readingParagraphs: string[];
  discussionQuestions: string[];
}

/** Instructions for writing one section on its own, reusing the lesson prompt's steps. */
function sectionInstructions(
  type: LessonSectionType,
  cefrLevel: string,
  g: LevelGuidance,
  lesson: LessonSectionContext,
): string {
  const words = lesson.targetWords.join(', ');
  switch (type) {
    case 'warmup':
      return `Write a short warm-up that gets the student talking about the topic before the reading: a brief description of the activity, 5 easy questions about the student's own life, experiences and opinions, the 5 target words in "targetVocabulary", a step-by-step procedure for the teacher and teaching tips.`;
    case 'reading':
      return readingStep(g);
    case 'vocabulary':
      if (!lesson.targetWords.length) return `${vocabularyChoice(cefrLevel, g)}\n\n${vocabularyRequirements(g)}`;
      return `Write the vocabulary entries for exactly these 5 words, in this order: ${words}.${lesson.readingParagraphs.length ? ' Explain each word in the sense it has in the reading text.' : ''}\n\n${vocabularyRequirements(g)}`;
    case 'comprehension':
      return COMPREHENSION_STEP;
    case 'sentenceFrames':
      return sentenceFramesStep(cefrLevel, g);
    case 'cloze':
      return `${lesson.targetWords.length ? `The wordBank must contain exactly these 5 words: ${words}.\n\n` : ''}${CLOZE_ACTIVITY}`;
    case 'sentenceUnscramble':
      return UNSCRAMBLE_ACTIVITY;
    case 'discussion':
      return discussionStep(g);
    case 'quiz':
      return QUIZ_STEP;
  }
}

const SECTION_FINAL_INSTRUCTIONS: Record<LessonSectionType, string> = {
  warmup: 'Generate complete content: 5 warm-up questions, and the 5 target words in targetVocabulary.',
  reading: 'Generate complete content: 5 paragraphs that use all 5 target words.',
  vocabulary: 'Generate complete content for all 5 vocabulary words.',
  comprehension: 'Generate complete content: 5 vocabulary check questions, one per target word.',
  sentenceFrames: 'Generate complete content: 3 sentence frames, each with all three tiers.',
  cloze: 'The text must contain exactly 5 blanks, one for each word in the wordBank, written as [1:word] with the actual word inside the brackets.',
  sentenceUnscramble: 'Generate complete content: 3 sentences.',
  discussion: 'Generate complete content: 5 discussion questions, each with paragraphContext, question and imagePrompt.',
  quiz: 'Generate complete content: 5 quiz questions.',
};

/**
 * Prompt for writing one section of a lesson again, when the section came
 * back missing or incomplete from full lesson generation. It shares the lesson
 * prompt's description of the class and level, and gives the model the parts
 * of the lesson the new section has to fit with.
 */
export function buildLessonSectionPrompt(
  type: LessonSectionType,
  params: LessonGenerateParams,
  lesson: LessonSectionContext,
  studentVocabulary: string[] = [],
): string {
  const { cefrLevel } = params;
  const g = getLevelGuidance(cefrLevel);
  const choosingWords = type === 'vocabulary' && lesson.targetWords.length === 0;

  const soFar = ['The rest of this lesson is already written. Write only the missing section, so that it fits with the rest.'];
  if (lesson.title) soFar.push('', `Lesson title: "${lesson.title}"`);
  if (lesson.targetWords.length) soFar.push('', `The 5 target words: ${lesson.targetWords.join(', ')}`);
  if (type !== 'reading' && lesson.readingParagraphs.length) {
    soFar.push('', 'Reading text:', lesson.readingParagraphs.join('\n\n'));
  }
  if (type === 'sentenceFrames' && lesson.discussionQuestions.length) {
    soFar.push('', 'Discussion questions:', ...lesson.discussionQuestions.map((q) => `- ${q}`));
  }

  const template = SECTION_TEMPLATES[type](g)
    .split('\n')
    .map((line) => line.replace(/^ {4}/, ''))
    .join('\n');

  return `${promptIntro(params, g)}
${choosingWords ? vocabularyNotes(params, studentVocabulary) : ''}
---

<the_lesson_so_far>
${soFar.join('\n')}
</the_lesson_so_far>

<instructions>
Write the ${LESSON_SECTION_NAMES[type]} section of this lesson.

${sectionInstructions(type, cefrLevel, g, lesson)}
</instructions>

<json_schema>
Return just this one section as a JSON object, in this format (showing format - generate complete content for all items):

${template}
</json_schema>

<final_instruction>
${SECTION_FINAL_INSTRUCTIONS[type]}
</final_instruction>

BEGIN JSON:`;
}

/**
 * Prompt for regenerating only the grammar spotlight (used when the spotlight
 * from full lesson generation fails validation).
 */
export function buildGrammarSpotlightPrompt(topic: string, cefrLevel: string): string {
  const g = getLevelGuidance(cefrLevel);

  return `You are an experienced, friendly ESL teacher. Create a grammar spotlight for a relaxed one-to-one conversation lesson with a ${cefrLevel} (${g.description}) student. A ${cefrLevel} student ${g.canUnderstand}

The teacher's request for the lesson: "${topic}"
${TEACHER_NOTES_GUIDANCE}

Pick ONE grammar point that a ${cefrLevel} student is ready for and that is useful for talking about this topic.

Write the description, examples and explanations in plain, natural English that a ${cefrLevel} student can follow. Example sentences should sound like things people really say in conversation.

Return ONLY a JSON object (no markdown, no commentary) with this exact structure:
{
  "grammarType": "snake_case_identifier (e.g. present_perfect, modal_verbs)",
  "title": "Display title of the grammar point",
  "description": "Short description of the grammar focus at ${cefrLevel} level",
  "examples": [
    {
      "sentence": "Full example sentence related to the topic.",
      "highlighted": "Same sentence with the grammar element wrapped in **double asterisks**.",
      "explanation": "Explanation of the grammar usage in this example."
    }
  ],
  "logicExplanation": {
    "communicationNeed": "The communication need this grammar addresses",
    "logicalSolution": "How the grammar logically solves that need",
    "usagePattern": "When/how the pattern is typically used",
    "communicationImpact": "The effect this grammar has on communication"
  }
}

Include 3-4 examples. All sentences must be appropriate for ${cefrLevel} level and related to the topic.`;
}
