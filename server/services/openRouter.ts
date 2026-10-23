import axios, { AxiosResponse } from 'axios';
import { LessonGenerateParams } from '@shared/schema';
import * as fs from 'fs';
import { replicateService } from './replicate.service';
import { uploadLessonImage } from './image-storage';
import { buildLessonPrompt, buildGrammarSpotlightPrompt } from './lesson-prompt';
import { findUnanswerableClozeGaps, tidyClozeText } from '@shared/cloze';

/**
 * Default OpenRouter text model used for all lesson generation. Admins can
 * override it per-account via their preferredAiModel setting; everyone else
 * always gets this model.
 */
export const DEFAULT_MODEL = 'z-ai/glm-5.3-flash';

/**
 * GLM-5 series models are reasoning models with mandatory reasoning: without
 * a low effort their hidden reasoning tokens consume max_tokens and truncate
 * the JSON mid-string. Other models reject or ignore the reasoning parameter,
 * so it is only included for models that need it.
 */
function needsReasoningEffort(model: string): boolean {
  return model.startsWith('z-ai/glm-5');
}

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
  async generateLesson(params: LessonGenerateParams, studentVocabulary: string[] = [], model: string = DEFAULT_MODEL): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }

      console.log(`Starting OpenRouter AI lesson generation (model: ${model})...`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const topicSafe = params.topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const requestId = `${topicSafe}_${timestamp}`;
      
      const prompt = this.constructLessonPrompt(params, studentVocabulary);
      
      const requestData: Record<string, any> = {
        model,
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
      if (needsReasoningEffort(model)) {
        // GLM-5 series models are reasoning models; without a low effort their
        // hidden reasoning tokens consume the budget and truncate the JSON mid-string.
        requestData.reasoning = { effort: 'low' };
      }

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
              const validatedContent = await this.validateAndImproveContent(jsonContent, params, model);
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
                const validatedContent = await this.validateAndImproveContent(jsonContent, params, model);
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
   * Builds the lesson prompt; the wording lives in lesson-prompt.ts.
   */
  private constructLessonPrompt(params: LessonGenerateParams, studentVocabulary: string[] = []): string {
    return buildLessonPrompt(params, studentVocabulary);
  }
  
  /**
   * Validate and improve the generated content
   */
  private async validateAndImproveContent(content: any, params: LessonGenerateParams, model: string = DEFAULT_MODEL): Promise<any> {
    console.log(`Skipping quality control validation - trusting ${model} for high-quality output`);
    return content;
  }

  /**
   * Regenerate only the grammar spotlight section for a lesson. Used as a
   * retry path when the spotlight from the full lesson generation fails
   * runtime validation. Returns the parsed spotlight object (untrusted —
   * caller must validate) or throws on failure.
   */
  async regenerateGrammarSpotlight(topic: string, cefrLevel: string, model: string = DEFAULT_MODEL): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const prompt = buildGrammarSpotlightPrompt(topic, cefrLevel);

    const result: AxiosResponse = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
        ...(needsReasoningEffort(model) ? { reasoning: { effort: 'low' } } : {})
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

    const text = result.data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') {
      throw new Error('Grammar spotlight regeneration returned no content');
    }

    let cleanedContent = text.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
    }

    return JSON.parse(cleanedContent);
  }

  /**
   * Validate reading text paragraphs for grammar correctness using AI
   */
  private async validateReadingTextGrammar(paragraphs: string[], cefrLevel: string, topic: string, model: string = DEFAULT_MODEL): Promise<string[]> {
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
          model,
          messages: [{ role: 'user', content: validationPrompt }],
          temperature: 0.1,
          max_tokens: 3000,
          ...(needsReasoningEffort(model) ? { reasoning: { effort: 'low' } } : {})
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
  private async validateSentenceFrameExamples(examples: any[], pattern: string, topic: string, model: string = DEFAULT_MODEL): Promise<any[]> {
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
          model,
          messages: [{ role: 'user', content: validationPrompt }],
          temperature: 0.1,
          max_tokens: 2000,
          ...(needsReasoningEffort(model) ? { reasoning: { effort: 'low' } } : {})
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
   * Format and process the lesson content, preparing image prompts but NOT generating images.
   * Call generateImagesForLesson() separately to generate the actual images.
   */
  private async formatLessonContent(content: any): Promise<any> {
    const lessonContent = {
      ...content,
      provider: 'openrouter'
    };
    
    if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
      for (const section of lessonContent.sections) {
        if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
          for (const word of section.words) {
            if (!word.imagePrompt && word.term) {
              word.imagePrompt = `An illustration showing the meaning of "${word.term}" in a clear, educational way. No text visible in the image.`;
            }
            word.imageBase64 = null;
          }
        }
        
        if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
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
            question.imageBase64 = null;
          }
        }

        if (section.type === 'cloze' && typeof section.text === 'string' && Array.isArray(section.wordBank)) {
          // Gaps must hold a word-bank word: "[4:rescued]" becomes "[4:rescue]d".
          const tidiedText = tidyClozeText(section.text, section.wordBank);
          if (tidiedText !== section.text) {
            console.log('Tidied fill-in-the-blank gaps so their answers match the word bank');
            section.text = tidiedText;
          }
          const unanswerable = findUnanswerableClozeGaps(tidiedText, section.wordBank);
          if (unanswerable.length > 0) {
            console.warn(`Fill-in-the-blank gaps with no matching word-bank word: ${unanswerable.join(', ')}`);
          }
        }
      }
    }
    
    return lessonContent;
  }

  /**
   * Generate images for a lesson that has already been formatted (with imagePrompts set).
   * Mutates the lessonContent object in place and returns it.
   * Safe to call after the HTTP response has already been sent.
   */
  async generateImagesForLesson(lessonContent: any, lessonId?: number | string): Promise<any> {
    if (!lessonContent.sections || !Array.isArray(lessonContent.sections)) {
      return lessonContent;
    }

    const storeImage = async (base64: string, target: any): Promise<void> => {
      // Keep the Base64 alongside the URL until the lesson row is durably
      // updated; routes.ts strips backed-up Base64 only for the DB write.
      target.imageBase64 = base64;
      try {
        target.imageUrl = await uploadLessonImage(base64, lessonId ?? 'unassigned');
      } catch (uploadError) {
        // Never lose a generated image: the Base64 inline fallback remains.
        console.error('Image storage upload failed, keeping Base64 only:', uploadError);
      }
    };

    console.log('Starting batched image generation for OpenRouter lesson...');

    const imageGenerationTasks: (() => Promise<void>)[] = [];

    for (const section of lessonContent.sections) {
      if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
        console.log(`Found ${section.words.length} vocabulary words, queueing image generation...`);
        for (const word of section.words) {
          if (word.imagePrompt) {
            const task = async () => {
              try {
                const requestId = `vocab_${word.term ? word.term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'word'}`;
                const base64 = await replicateService.generateImage(word.imagePrompt, requestId);
                if (base64) {
                  await storeImage(base64, word);
                  console.log(`Generated image for vocab: ${word.term}`);
                }
              } catch (imgError) {
                console.error(`Error generating image for vocab ${word.term}:`, imgError);
                word.imageBase64 = null;
              }
            };
            imageGenerationTasks.push(task);
          }
        }
      }

      if (section.type === 'discussion' && section.questions && Array.isArray(section.questions)) {
        console.log(`Found ${section.questions.length} discussion questions, queueing image generation...`);
        for (const question of section.questions) {
          if (question.imagePrompt) {
            const task = async () => {
              try {
                const requestId = `disc_${question.question ? question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'question'}`;
                const base64 = await replicateService.generateImage(question.imagePrompt, requestId);
                if (base64) {
                  await storeImage(base64, question);
                  console.log(`Generated image for discussion question`);
                }
              } catch (imgError) {
                console.error(`Error generating discussion image:`, imgError);
                question.imageBase64 = null;
              }
            };
            imageGenerationTasks.push(task);
          }
        }
      }
    }

    if (imageGenerationTasks.length > 0) {
      const batchSize = 3;
      const totalTasks = imageGenerationTasks.length;
      console.log(`Generating ${totalTasks} images in sequential batches of ${batchSize}...`);

      for (let i = 0; i < totalTasks; i += batchSize) {
        const batchFunctions = imageGenerationTasks.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(totalTasks / batchSize);

        console.log(`Processing batch ${batchNum}/${totalBatches} (${batchFunctions.length} images)...`);

        await Promise.all(batchFunctions.map(fn => fn()));
      }

      console.log(`All ${totalTasks} images generated!`);
    }

    console.log('Finished image generation for OpenRouter lesson.');
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
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'Hello, can you respond with just "OK"?' }],
      max_tokens: 20,
      reasoning: { effort: 'low' }
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
