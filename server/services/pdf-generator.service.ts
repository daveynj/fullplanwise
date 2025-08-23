import { jsPDF } from 'jspdf';
import { Buffer } from 'buffer';

interface VocabularyWord {
  term: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  pronunciation?: {
    syllables: string[];
    stressIndex: number;
    phoneticGuide?: string;
  };
  semanticGroup?: string;
  additionalExamples?: string[];
  wordFamily?: {
    words: string[];
    description: string;
  };
  collocations?: string[];
  usageNotes?: string;
  semanticMap?: {
    synonyms: string[];
    antonyms: string[];
    relatedConcepts: string[];
    contexts: string[];
    associatedWords: string[];
  };
}

interface LessonData {
  title: string;
  level: string;
  sections: Array<{
    type: string;
    words?: VocabularyWord[];
    [key: string]: any;
  }>;
}

export class PDFGeneratorService {
  
  /**
   * Helper function to ensure semantic map fields are arrays
   */
  private ensureSemanticArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      // Handle comma-separated strings
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  }

  /**
   * Generates a comprehensive HTML document with all vocabulary information
   * This provides a complete reference with no truncation of any content
   */
  async generateVocabularyReviewHTML(lessonData: LessonData): Promise<string> {
    try {
      console.log('Generating comprehensive HTML vocabulary review...');
      
      // Get vocabulary words from the lesson
      const vocabularySection = lessonData.sections.find(section => section.type === 'vocabulary');
      let words: VocabularyWord[] = [];
      
      if (vocabularySection?.words) {
        // Normalize all vocabulary words to ensure compatibility
        words = vocabularySection.words.map(word => this.normalizeVocabularyWord(word));
      }
      
      if (words.length === 0) {
        throw new Error('No vocabulary words found in this lesson');
      }
      
      // Generate HTML for each vocabulary word - with ALL details included
      const vocabularyHtml = words.map(word => {
        // Get color for part of speech
        let posColor = '#6B7280'; // Default gray
        switch(word.partOfSpeech.toLowerCase()) {
          case 'noun': posColor = '#3B82F6'; break; // Blue
          case 'verb': posColor = '#10B981'; break; // Green  
          case 'adjective': posColor = '#F59E0B'; break; // Amber
          case 'adverb': posColor = '#F97316'; break; // Orange
        }
        
        // Handle pronunciation
        let pronunciationHtml = '';
        if (word.pronunciation) {
          let pronText = '';
          if (typeof word.pronunciation === 'string') {
            pronText = word.pronunciation;
          } else if (word.pronunciation.phoneticGuide) {
            pronText = word.pronunciation.phoneticGuide;
          } else if (word.pronunciation.syllables && Array.isArray(word.pronunciation.syllables)) {
            // Handle syllables with stress
            pronText = word.pronunciation.syllables.map((syl, idx) => {
              if (word.pronunciation && typeof word.pronunciation !== 'string' && 
                  'stressIndex' in word.pronunciation && 
                  word.pronunciation.stressIndex === idx) {
                return `<b>${syl}</b>`;
              }
              return syl;
            }).join('-');
          }
          
          if (pronText) {
            pronunciationHtml = `
              <div class="pronunciation">
                <span class="label">Pronunciation:</span> 
                <span class="phonetic">/${pronText}/</span>
              </div>
            `;
          }
        }
        
        // Handle examples - include ALL of them
        let examplesHtml = '';
        if (word.example) {
          examplesHtml = `
            <div class="example">
              <div class="label">Example:</div>
              <div class="example-text">"${word.example}"</div>
            </div>
          `;
        }
        
        // Handle additional examples - include ALL of them
        let additionalExamplesHtml = '';
        if (word.additionalExamples && word.additionalExamples.length > 0) {
          const examplesList = word.additionalExamples.map(ex => 
            `<li>"${ex}"</li>`
          ).join('');
          
          additionalExamplesHtml = `
            <div class="additional-examples">
              <div class="label">Additional Examples:</div>
              <ul class="examples-list">
                ${examplesList}
              </ul>
            </div>
          `;
        }
        
        // Handle word family - include ALL related words
        let wordFamilyHtml = '';
        if (word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0) {
          const description = word.wordFamily.description ? 
            `<div class="family-description">${word.wordFamily.description}</div>` : '';
          
          wordFamilyHtml = `
            <div class="word-family">
              <span class="label">Word Family:</span>
              <span class="family-words">${word.wordFamily.words.join(', ')}</span>
              ${description}
            </div>
          `;
        }
        
        // Handle collocations - include ALL of them
        let collocationsHtml = '';
        if (word.collocations && word.collocations.length > 0) {
          collocationsHtml = `
            <div class="collocations">
              <span class="label">Common Collocations:</span>
              <span class="collocation-words">${word.collocations.join(', ')}</span>
            </div>
          `;
        }
        
        // Handle usage notes - include ALL text
        let usageNotesHtml = '';
        if (word.usageNotes) {
          usageNotesHtml = `
            <div class="usage-notes">
              <span class="label">Usage Notes:</span>
              <span class="notes-text">${word.usageNotes}</span>
            </div>
          `;
        }
        
        // Handle semantic map - include ALL relationships
        let semanticMapHtml = '';
        if (word.semanticMap) {
          const semanticMap = word.semanticMap;
          
          // Synonyms
          let synonymsHtml = '';
          const synonymsArray = this.ensureSemanticArray(semanticMap.synonyms);
          if (synonymsArray.length > 0) {
            synonymsHtml = `
              <tr>
                <td class="map-label" style="background-color: #E6F7EC;">Synonyms</td>
                <td class="map-content">${synonymsArray.join(', ')}</td>
              </tr>
            `;
          }
          
          // Antonyms
          let antonymsHtml = '';
          const antonymsArray = this.ensureSemanticArray(semanticMap.antonyms);
          if (antonymsArray.length > 0) {
            antonymsHtml = `
              <tr>
                <td class="map-label" style="background-color: #FEE2E2;">Antonyms</td>
                <td class="map-content">${antonymsArray.join(', ')}</td>
              </tr>
            `;
          }
          
          // Related concepts
          let relatedConceptsHtml = '';
          const relatedConceptsArray = this.ensureSemanticArray(semanticMap.relatedConcepts);
          if (relatedConceptsArray.length > 0) {
            relatedConceptsHtml = `
              <tr>
                <td class="map-label" style="background-color: #E0E7FF;">Related Concepts</td>
                <td class="map-content">${relatedConceptsArray.join(', ')}</td>
              </tr>
            `;
          }
          
          // Contexts
          let contextsHtml = '';
          const contextsArray = this.ensureSemanticArray(semanticMap.contexts);
          if (contextsArray.length > 0) {
            contextsHtml = `
              <tr>
                <td class="map-label" style="background-color: #F3F4F6;">Contexts</td>
                <td class="map-content">${contextsArray.join(', ')}</td>
              </tr>
            `;
          }
          
          // Associated words
          let associatedWordsHtml = '';
          const associatedWordsArray = this.ensureSemanticArray(semanticMap.associatedWords);
          if (associatedWordsArray.length > 0) {
            associatedWordsHtml = `
              <tr>
                <td class="map-label" style="background-color: #FEF3C7;">Associated Words</td>
                <td class="map-content">${associatedWordsArray.join(', ')}</td>
              </tr>
            `;
          }
          
          // Only create the semantic map if we have any content
          if (synonymsHtml || antonymsHtml || relatedConceptsHtml || contextsHtml || associatedWordsHtml) {
            semanticMapHtml = `
              <div class="semantic-map">
                <div class="map-title">Semantic Map</div>
                <table class="map-table">
                  ${synonymsHtml}
                  ${antonymsHtml}
                  ${relatedConceptsHtml}
                  ${contextsHtml}
                  ${associatedWordsHtml}
                </table>
              </div>
            `;
          }
        }
        
        // Combine all sections into a vocabulary card
        return `
          <div class="vocabulary-card" style="border-left-color: ${posColor};">
            <div class="term-container">
              <h2 class="term" style="color: ${posColor};">${word.term}</h2>
              <span class="part-of-speech">(${word.partOfSpeech})</span>
            </div>
            
            ${pronunciationHtml}
            
            <div class="definition">
              <span class="label">Definition:</span>
              <span class="definition-text">${word.definition || 'No definition available'}</span>
            </div>
            
            ${examplesHtml}
            ${additionalExamplesHtml}
            ${wordFamilyHtml}
            ${collocationsHtml}
            ${usageNotesHtml}
            ${semanticMapHtml}
          </div>
        `;
      }).join('');
      
      // Create a complete HTML document with styling
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${lessonData.title} - Vocabulary Review</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
              background-color: #f9fafb;
            }
            
            .brand-header {
              background: linear-gradient(135deg, #051d40 0%, #0a2854 100%);
              color: white;
              padding: 20px 30px;
              margin: -20px -20px 40px -20px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .brand-line {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .brand-logo {
              font-size: 1.5em;
              font-weight: 700;
              color: #edc437;
            }
            
            .brand-url {
              font-size: 1.1em;
              color: #edc437;
              font-weight: 500;
            }
            
            .brand-tagline {
              font-size: 0.95em;
              color: #e5e7eb;
              font-weight: 400;
              text-align: center;
            }
            
            .lesson-header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            h1 {
              color: #3B82F6;
              margin-bottom: 10px;
            }
            
            .subtitle {
              color: #6B7280;
              font-size: 18px;
              margin-bottom: 20px;
            }
            
            .introduction {
              background-color: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            
            .vocabulary-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              padding: 20px;
              margin-bottom: 30px;
              border-left: 5px solid #3B82F6;
            }
            
            .term-container {
              display: flex;
              align-items: baseline;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            
            .term {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              margin-right: 10px;
            }
            
            .part-of-speech {
              font-style: italic;
              color: #6B7280;
            }
            
            .pronunciation {
              margin-bottom: 10px;
            }
            
            .phonetic {
              font-style: italic;
              color: #6B7280;
            }
            
            .definition {
              margin-bottom: 15px;
            }
            
            .example {
              background-color: #f3f4f6;
              padding: 10px 15px;
              border-radius: 4px;
              margin-bottom: 15px;
              border-left: 4px solid #3B82F6;
            }
            
            .example-text {
              font-style: italic;
              padding-left: 10px;
            }
            
            .additional-examples {
              margin-bottom: 15px;
            }
            
            .examples-list {
              font-style: italic;
              color: #4B5563;
            }
            
            .examples-list li {
              margin-bottom: 8px;
            }
            
            .word-family, .collocations, .usage-notes {
              margin-bottom: 15px;
              padding: 10px;
              background-color: #FAFAFA;
              border-radius: 4px;
            }
            
            .label {
              font-weight: bold;
              color: #374151;
              margin-right: 5px;
            }
            
            .family-description {
              font-style: italic;
              color: #6B7280;
              margin-top: 5px;
              padding-left: 15px;
            }
            
            .semantic-map {
              margin-top: 20px;
            }
            
            .map-title {
              font-weight: bold;
              color: #4B5563;
              font-size: 18px;
              margin-bottom: 10px;
            }
            
            .map-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              border: 1px solid #e5e7eb;
            }
            
            .map-table td {
              border: 1px solid #d1d5db;
              padding: 8px 12px;
            }
            
            .map-label {
              font-weight: bold;
              width: 25%;
            }
            
            .map-content {
              width: 75%;
            }
            
            .footer {
              margin-top: 40px;
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
              background: #f9fafb;
              margin-left: -20px;
              margin-right: -20px;
              margin-bottom: -20px;
              padding-left: 20px;
              padding-right: 20px;
              padding-bottom: 20px;
            }
            
            .footer-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }
            
            .generation-info {
              color: #6B7280;
              font-size: 0.9em;
            }
            
            .brand-footer {
              text-align: right;
            }
            
            .powered-by {
              color: #051d40;
              font-size: 0.95em;
              margin-bottom: 4px;
            }
            
            .footer-tagline {
              color: #6B7280;
              font-size: 0.85em;
              font-style: italic;
            }
            
            @media print {
              body {
                background-color: white;
              }
              
              .vocabulary-card {
                break-inside: avoid;
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #e5e7eb;
              }
              
              .introduction {
                background-color: #f8f9fa;
              }
              
              .example {
                background-color: #f8f9fa;
              }
            }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div class="brand-line">
              <div class="brand-logo">
                <a href="https://planwiseesl.com" target="_blank" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center;">
                  <img src="data:image/png;base64,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" alt="PlanwiseESL Logo" style="height: 80px; width: auto; vertical-align: middle; margin-right: 8px;"/>
                  PlanwiseESL
                </a>
              </div>
              <div class="brand-url">
                <a href="https://planwiseesl.com" target="_blank" style="color: #051d40; text-decoration: none; font-weight: 500;">planwiseesl.com</a>
              </div>
            </div>
            <div class="brand-tagline">AI-Powered ESL Lesson Generator</div>
          </div>
          
          <div class="lesson-header">
            <h1>${lessonData.title}</h1>
            <div class="subtitle">Vocabulary Review • CEFR Level ${lessonData.level} • ${words.length} Words</div>
          </div>
          
          <div class="introduction">
            <p>This vocabulary review contains comprehensive information about each word including definitions, examples, word families, collocations, and usage notes. Study these words to enhance your vocabulary and understanding.</p>
            <p><strong>Color Key:</strong> <span style="color: #3B82F6">■</span> Nouns • <span style="color: #10B981">■</span> Verbs • <span style="color: #F59E0B">■</span> Adjectives • <span style="color: #F97316">■</span> Adverbs</p>
          </div>
          
          <div class="vocabulary-content">
            ${vocabularyHtml}
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <div class="generation-info">Generated on ${new Date().toLocaleDateString()}</div>
              <div class="brand-footer">
                <div class="powered-by">Powered by <strong><a href="https://planwiseesl.com" target="_blank" style="color: #051d40; text-decoration: none;">PlanwiseESL.com</a></strong></div>
                <div class="footer-tagline">Create your own AI lessons at <a href="https://planwiseesl.com" target="_blank" style="color: #6B7280; text-decoration: underline;">planwiseesl.com</a></div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      return htmlContent;
    } catch (error: any) {
      console.error('HTML generation error:', error);
      throw new Error(`HTML generation failed: ${error.message}`);
    }
  }
  private getPartOfSpeechColor(partOfSpeech: string): string {
    const colors: Record<string, string> = {
      'noun': '#3B82F6',      // Blue
      'verb': '#10B981',      // Green  
      'adjective': '#F59E0B', // Yellow/Amber
      'adverb': '#F97316',    // Orange
      'preposition': '#6B7280', // Gray
      'conjunction': '#6B7280', // Gray
      'article': '#6B7280',     // Gray
      'pronoun': '#8B5CF6',     // Purple
    };
    
    return colors[partOfSpeech.toLowerCase()] || '#6B7280';
  }

  private getSemanticGroupColor(group: string): string {
    const colors: Record<string, string> = {
      'business': '#1E40AF',
      'technology': '#7C3AED', 
      'nature': '#059669',
      'emotions': '#DC2626',
      'culture': '#92400E',
      'education': '#0D9488',
      'health': '#C2410C',
      'travel': '#0891B2',
    };
    
    // Generate consistent color based on group name if not predefined
    if (!group || !colors[group.toLowerCase()]) {
      const hash = group?.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0) || 0;
      
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 60%, 45%)`;
    }
    
    return colors[group.toLowerCase()];
  }

  private formatPronunciation(pronunciation: any): string {
    if (typeof pronunciation === 'string') {
      return pronunciation;
    }
    
    if (pronunciation?.syllables && pronunciation?.stressIndex !== undefined) {
      const syllables = pronunciation.syllables.map((syl: string, index: number) => {
        return index === pronunciation.stressIndex ? `<strong>${syl}</strong>` : syl;
      });
      return syllables.join('-');
    }
    
    return pronunciation?.phoneticGuide || '';
  }

  private normalizeVocabularyWord(word: any): VocabularyWord {
    // Handle different field names from older lessons
    const term = word.term || word.word || 'Unknown Word';
    const definition = word.definition || 'No definition available';
    const example = word.example || `Example sentence using "${term}".`;
    const partOfSpeech = word.partOfSpeech || word.pos || 'noun';
    
    // Handle pronunciation field which can be string or object
    let pronunciation = undefined;
    if (word.pronunciation) {
      if (typeof word.pronunciation === 'string') {
        pronunciation = {
          syllables: [word.pronunciation],
          stressIndex: 0,
          phoneticGuide: word.pronunciation
        };
      } else if (typeof word.pronunciation === 'object') {
        pronunciation = {
          syllables: word.pronunciation.syllables || [word.pronunciation.value || word.pronunciation.ipa || term],
          stressIndex: word.pronunciation.stressIndex || 0,
          phoneticGuide: word.pronunciation.phoneticGuide || word.pronunciation.value || word.pronunciation.ipa
        };
      }
    } else if (word.syllables && Array.isArray(word.syllables)) {
      pronunciation = {
        syllables: word.syllables,
        stressIndex: word.stressIndex || 0,
        phoneticGuide: word.phoneticGuide
      };
    }

    return {
      term,
      partOfSpeech,
      definition,
      example,
      pronunciation,
      semanticGroup: word.semanticGroup || word.category || word.group,
      additionalExamples: Array.isArray(word.additionalExamples) ? word.additionalExamples : 
                          Array.isArray(word.examples) ? word.examples.slice(1) : [],
      wordFamily: word.wordFamily || (word.relatedWords ? {
        words: Array.isArray(word.relatedWords) ? word.relatedWords : [],
        description: word.wordFamilyDescription || ''
      } : undefined),
      collocations: Array.isArray(word.collocations) ? word.collocations : [],
      usageNotes: word.usageNotes || word.usage,
      semanticMap: word.semanticMap
    };
  }

  private generateHTML(lessonData: LessonData): string {
    const vocabularySection = lessonData.sections.find(section => section.type === 'vocabulary');
    let words: VocabularyWord[] = [];

    if (vocabularySection?.words) {
      // Normalize all vocabulary words to ensure compatibility
      words = vocabularySection.words.map(word => this.normalizeVocabularyWord(word));
    } else {
      // Fallback: Look for vocabulary in different formats
      for (const section of lessonData.sections) {
        // Check for targetVocabulary field
        if (section.targetVocabulary) {
          if (Array.isArray(section.targetVocabulary)) {
            words = section.targetVocabulary.map(word => this.normalizeVocabularyWord(
              typeof word === 'string' ? { word, definition: 'No definition available' } : word
            ));
          } else if (typeof section.targetVocabulary === 'object') {
            // Handle object format where keys are words and values are definitions
            words = Object.entries(section.targetVocabulary).map(([term, definition]) => 
              this.normalizeVocabularyWord({
                word: term,
                definition: typeof definition === 'string' ? definition : 'No definition available'
              })
            );
          }
          break;
        }
        
        // Check for vocabulary field
        if (section.vocabulary) {
          if (Array.isArray(section.vocabulary)) {
            words = section.vocabulary.map(word => this.normalizeVocabularyWord(
              typeof word === 'string' ? { word, definition: 'No definition available' } : word
            ));
          } else if (typeof section.vocabulary === 'object') {
            words = Object.entries(section.vocabulary).map(([term, definition]) => 
              this.normalizeVocabularyWord({
                word: term,
                definition: typeof definition === 'string' ? definition : 'No definition available'
              })
            );
          }
          break;
        }
      }
    }

    // If still no words found, generate a notice
    if (words.length === 0) {
      words = [{
        term: 'No Vocabulary Found',
        partOfSpeech: 'notice',
        definition: 'This lesson does not contain extractable vocabulary words.',
        example: 'Please regenerate the lesson to include vocabulary words.'
      }];
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vocabulary Review - ${lessonData.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          background: #FFFFFF;
          padding: 20px;
        }
        
        .brand-header {
          background: linear-gradient(135deg, #051d40 0%, #0a2854 100%);
          color: white;
          padding: 20px 30px;
          margin: -20px -20px 30px -20px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .brand-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .brand-logo {
          font-size: 1.5em;
          font-weight: 700;
          color: #edc437;
        }
        
        .brand-url {
          font-size: 1.1em;
          color: #edc437;
          font-weight: 500;
        }
        
        .brand-tagline {
          font-size: 0.95em;
          color: #e5e7eb;
          font-weight: 400;
          text-align: center;
        }
        
        .lesson-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 20px;
        }
        
        .lesson-title {
          font-size: 28px;
          font-weight: bold;
          color: #1E40AF;
          margin-bottom: 8px;
        }
        
        .lesson-subtitle {
          font-size: 16px;
          color: #6B7280;
          font-weight: 500;
        }
        
        .color-key {
          background: #F8FAFC;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .color-key h3 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #374151;
          text-align: center;
        }
        
        .key-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .key-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .key-symbols {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 14px;
          color: #6B7280;
          margin-top: 10px;
        }
        
        .vocabulary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .word-card {
          background: #FFFFFF;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          break-inside: avoid;
        }
        
        .word-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .word-term {
          font-size: 24px;
          font-weight: bold;
          color: #1F2937;
        }
        
        .pos-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }
        
        .pronunciation {
          font-size: 14px;
          color: #6B7280;
          font-style: italic;
          margin-left: auto;
        }
        
        .definition {
          font-size: 16px;
          color: #374151;
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .example {
          background: #F3F4F6;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #3B82F6;
          margin-bottom: 15px;
          font-style: italic;
          color: #4B5563;
        }
        
        .word-details {
          display: grid;
          gap: 12px;
        }
        
        .detail-section {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: flex-start;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          min-width: 80px;
        }
        
        .detail-content {
          flex: 1;
          font-size: 14px;
          color: #6B7280;
        }
        
        .word-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .word-tag {
          background: #EDF2F7;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: #4A5568;
          border: 1px solid #CBD5E0;
        }
        
        .semantic-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
        }
        
        .semantic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }
        
        .semantic-item {
          text-align: center;
        }
        
        .semantic-label {
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .semantic-words {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px;
        }
        
        .semantic-tag {
          background: #F0FDF4;
          color: #166534;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid #BBFFC7;
        }
        
        .usage-notes {
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          border-radius: 6px;
          padding: 8px;
          font-size: 13px;
          color: #92400E;
          margin-top: 10px;
        }
        
        .semantic-group-tag {
          position: absolute;
          top: -8px;
          right: 15px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }
        
        .word-card {
          position: relative;
        }
        
        @media print {
          body {
            padding: 15px;
          }
          
          .vocabulary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .word-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
        
        .footer {
          margin-top: 40px;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
          background: #f8fafc;
          margin-left: -20px;
          margin-right: -20px;
          margin-bottom: -20px;
          padding-left: 20px;
          padding-right: 20px;
          padding-bottom: 20px;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .generation-info {
          color: #6B7280;
          font-size: 0.9em;
        }
        
        .brand-footer {
          text-align: right;
        }
        
        .powered-by {
          color: #051d40;
          font-size: 0.95em;
          margin-bottom: 4px;
        }
        
        .footer-tagline {
          color: #6B7280;
          font-size: 0.85em;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="brand-header">
        <div class="brand-line">
          <div class="brand-logo">🎯 PlanwiseESL</div>
          <div class="brand-url">planwiseesl.com</div>
        </div>
        <div class="brand-tagline">AI-Powered ESL Lesson Generator</div>
      </div>
      
      <div class="lesson-header">
        <h1 class="lesson-title">${lessonData.title}</h1>
        <p class="lesson-subtitle">Vocabulary Review • CEFR Level ${lessonData.level} • ${words.length} Words</p>
      </div>
      
      <div class="color-key">
        <h3>🎨 Color Key</h3>
        <div class="key-grid">
          <div class="key-item">
            <div class="color-dot" style="background-color: #3B82F6;"></div>
            <span>Nouns</span>
          </div>
          <div class="key-item">
            <div class="color-dot" style="background-color: #10B981;"></div>
            <span>Verbs</span>
          </div>
          <div class="key-item">
            <div class="color-dot" style="background-color: #F59E0B;"></div>
            <span>Adjectives</span>
          </div>
          <div class="key-item">
            <div class="color-dot" style="background-color: #F97316;"></div>
            <span>Adverbs</span>
          </div>
        </div>
        <div class="key-symbols">
          <span>💭 Example Sentence</span>
          <span>🔗 Related Words</span>
          <span>📝 Usage Notes</span>
        </div>
      </div>
      
      <div class="vocabulary-grid">
        ${words.map(word => `
          <div class="word-card">
            ${word.semanticGroup ? `
              <div class="semantic-group-tag" style="background-color: ${this.getSemanticGroupColor(word.semanticGroup)};">
                ${word.semanticGroup}
              </div>
            ` : ''}
            
            <div class="word-header">
              <h2 class="word-term">${word.term}</h2>
              <span class="pos-tag" style="background-color: ${this.getPartOfSpeechColor(word.partOfSpeech)};">
                ${word.partOfSpeech}
              </span>
              ${word.pronunciation ? `
                <span class="pronunciation">/${this.formatPronunciation(word.pronunciation)}/</span>
              ` : ''}
            </div>
            
            <div class="definition">
              ${word.definition}
            </div>
            
            <div class="example">
              💭 ${word.example}
            </div>
            
            <div class="word-details">
              ${word.collocations && word.collocations.length > 0 ? `
                <div class="detail-section">
                  <span class="detail-label">🔗 With:</span>
                  <div class="word-list">
                    ${word.collocations.map(collocation => `
                      <span class="word-tag">${collocation}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${word.wordFamily && word.wordFamily.words.length > 0 ? `
                <div class="detail-section">
                  <span class="detail-label">👨‍👩‍👧‍👦 Family:</span>
                  <div class="word-list">
                    ${word.wordFamily.words.map(familyWord => `
                      <span class="word-tag">${familyWord}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${word.semanticMap ? `
              <div class="semantic-section">
                <div class="semantic-grid">
                  ${word.semanticMap.synonyms && word.semanticMap.synonyms.length > 0 ? `
                    <div class="semantic-item">
                      <div class="semantic-label">Similar</div>
                      <div class="semantic-words">
                        ${word.semanticMap.synonyms.slice(0, 3).map(syn => `
                          <span class="semantic-tag">${syn}</span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${word.semanticMap.contexts && word.semanticMap.contexts.length > 0 ? `
                    <div class="semantic-item">
                      <div class="semantic-label">Used in</div>
                      <div class="semantic-words">
                        ${word.semanticMap.contexts.slice(0, 2).map(context => `
                          <span class="semantic-tag">${context}</span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            
            ${word.usageNotes ? `
              <div class="usage-notes">
                📝 ${word.usageNotes}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <div class="footer-content">
          <div class="generation-info">Generated on ${new Date().toLocaleDateString()}</div>
          <div class="brand-footer">
            <div class="powered-by">Powered by <strong>PlanwiseESL.com</strong></div>
            <div class="footer-tagline">Create your own AI lessons at planwiseesl.com</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async generateVocabularyReviewPDF(lessonData: LessonData): Promise<Buffer> {
    try {
      console.log('Generating detailed vocabulary PDF with all content...');
      
      // Get vocabulary words from the lesson
      const vocabularySection = lessonData.sections.find(section => section.type === 'vocabulary');
      let words: VocabularyWord[] = [];
      
      if (vocabularySection?.words) {
        // Normalize all vocabulary words to ensure compatibility
        words = vocabularySection.words.map(word => this.normalizeVocabularyWord(word));
      }
      
      if (words.length === 0) {
        throw new Error('No vocabulary words found in this lesson');
      }
      
      // Create a new jsPDF instance (A4 size in portrait orientation)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font and colors
      doc.setFont('helvetica', 'normal');
      
      // ---- TITLE SECTION ----
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175); // Primary blue
      const title = lessonData.title.length > 60 ? lessonData.title.substring(0, 60) + '...' : lessonData.title;
      doc.text(title, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // Gray
      doc.text(`Vocabulary Review • CEFR Level ${lessonData.level} • ${words.length} Words`, 105, 28, { align: 'center' });
      
      doc.setDrawColor(59, 130, 246); // Blue
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      
      // ---- INTRODUCTION ----
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      const introText = "This vocabulary review contains all information for each word including definitions, examples, related words, and usage notes. Study these words to enhance your vocabulary and understanding.";
      const introLines = doc.splitTextToSize(introText, 170);
      doc.text(introLines, 20, 40);
      
      // ---- COLOR LEGEND ----
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text('Word Categories:', 20, 53);
      
      doc.setFillColor(59, 130, 246); // Blue for nouns
      doc.circle(25, 58, 2, 'F');
      doc.text('Noun', 30, 60);
      
      doc.setFillColor(16, 185, 129); // Green for verbs
      doc.circle(60, 58, 2, 'F');
      doc.text('Verb', 65, 60);
      
      doc.setFillColor(245, 158, 11); // Amber for adjectives
      doc.circle(95, 58, 2, 'F');
      doc.text('Adjective', 100, 60);
      
      doc.setFillColor(249, 115, 22); // Orange for adverbs
      doc.circle(140, 58, 2, 'F');
      doc.text('Adverb', 145, 60);
      
      let yPosition = 70; // Starting position for vocabulary content
      
      // ---- VOCABULARY WORDS ----
      words.forEach(word => {
        // Calculate space needed for this word
        let wordHeight = 40; // Base height
        
        // Add space for additional fields
        if (word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0) wordHeight += 10;
        if (word.collocations && word.collocations.length > 0) wordHeight += 10;
        if (word.usageNotes) wordHeight += 10;
        if (word.semanticMap) {
          const semanticMapFields = [
            word.semanticMap.synonyms, 
            word.semanticMap.antonyms, 
            word.semanticMap.relatedConcepts, 
            word.semanticMap.contexts,
            word.semanticMap.associatedWords
          ].filter(field => field && field.length > 0);
          
          if (semanticMapFields.length > 0) {
            wordHeight += 10 + (semanticMapFields.length * 6);
          }
        }
        
        // Check if we need a new page
        if (yPosition + wordHeight > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        // ---- WORD TERM & PART OF SPEECH ----
        let posColor: number[] = [107, 114, 128]; // Default gray
        switch(word.partOfSpeech.toLowerCase()) {
          case 'noun': posColor = [59, 130, 246]; break; // Blue
          case 'verb': posColor = [16, 185, 129]; break; // Green
          case 'adjective': posColor = [245, 158, 11]; break; // Amber
          case 'adverb': posColor = [249, 115, 22]; break; // Orange
        }
        
        // Term with colored underline
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(word.term, 20, yPosition);
        
        // Part of speech
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        const termWidth = doc.getTextWidth(word.term);
        doc.text(`(${word.partOfSpeech})`, 22 + termWidth, yPosition);
        
        // Colored underline for the word
        doc.setDrawColor(posColor[0], posColor[1], posColor[2]);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition + 2, 20 + termWidth + 5, yPosition + 2);
        
        // ---- PRONUNCIATION ----
        if (word.pronunciation) {
          let pronText = '';
          if (typeof word.pronunciation === 'string') {
            pronText = word.pronunciation;
          } else if (word.pronunciation.phoneticGuide) {
            pronText = word.pronunciation.phoneticGuide;
          } else if (word.pronunciation.syllables && Array.isArray(word.pronunciation.syllables)) {
            pronText = word.pronunciation.syllables.join('-');
          }
          
          if (pronText) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`/${pronText}/`, 130, yPosition);
          }
        }
        
        // ---- DEFINITION ----
        yPosition += 8;
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Definition:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        
        const definition = word.definition || "No definition available";
        const defLines = doc.splitTextToSize(definition, 170);
        // Use up to 4 lines for definition
        const displayDefLines = defLines.length > 4 ? 
                                [...defLines.slice(0, 3), defLines[3] + '...'] : 
                                defLines;
        
        doc.text(displayDefLines, 20, yPosition + 5);
        
        // ---- EXAMPLE SENTENCE ----
        yPosition += 5 + (displayDefLines.length * 4);
        if (word.example) {
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Example:', 20, yPosition);
          doc.setFont('helvetica', 'italic');
          
          // Draw example background
          doc.setFillColor(245, 245, 245);
          doc.setDrawColor(200, 200, 200);
          doc.roundedRect(20, yPosition + 2, 170, 10, 1, 1, 'F');
          
          // Add blue left border
          doc.setFillColor(posColor[0], posColor[1], posColor[2]);
          doc.rect(20, yPosition + 2, 1, 10, 'F');
          
          // Example text
          doc.setTextColor(80, 80, 80);
          const exampleLines = doc.splitTextToSize(`"${word.example}"`, 165);
          const displayExLines = exampleLines.length > 2 ? 
                              [...exampleLines.slice(0, 1), exampleLines[1] + '...'] : 
                              exampleLines;
          
          doc.text(displayExLines, 25, yPosition + 7);
          doc.setFont('helvetica', 'normal');
          
          yPosition += 15;
        }
        
        // ---- WORD FAMILY ----
        if (word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Related Words:', 20, yPosition);
          doc.setFont('helvetica', 'normal');
          
          const familyText = word.wordFamily.words.join(', ');
          const familyLines = doc.splitTextToSize(familyText, 135);
          const displayFamilyLines = familyLines.length > 1 ? 
                                    [familyLines[0] + '...'] : 
                                    familyLines;
          
          doc.text(displayFamilyLines, 60, yPosition);
          
          yPosition += 6;
        }
        
        // ---- COLLOCATIONS ----
        if (word.collocations && word.collocations.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Common with:', 20, yPosition);
          doc.setFont('helvetica', 'normal');
          
          const collocationsText = word.collocations.join(', ');
          const collocationsLines = doc.splitTextToSize(collocationsText, 135);
          const displayCollocationsLines = collocationsLines.length > 1 ? 
                                          [collocationsLines[0] + '...'] : 
                                          collocationsLines;
          
          doc.text(displayCollocationsLines, 60, yPosition);
          
          yPosition += 6;
        }
        
        // ---- USAGE NOTES ----
        if (word.usageNotes) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Usage Notes:', 20, yPosition);
          doc.setFont('helvetica', 'normal');
          
          const usageLines = doc.splitTextToSize(word.usageNotes, 135);
          const displayUsageLines = usageLines.length > 1 ? 
                                  [usageLines[0] + '...'] : 
                                  usageLines;
          
          doc.text(displayUsageLines, 60, yPosition);
          
          yPosition += 6;
        }
        
        // ---- SEMANTIC MAP ----
        if (word.semanticMap) {
          const semanticMap = word.semanticMap;
          let hasContent = false;
          
          // Check if there's any content to display
          if ((semanticMap.synonyms && semanticMap.synonyms.length > 0) ||
              (semanticMap.antonyms && semanticMap.antonyms.length > 0) ||
              (semanticMap.relatedConcepts && semanticMap.relatedConcepts.length > 0) ||
              (semanticMap.contexts && semanticMap.contexts.length > 0) ||
              (semanticMap.associatedWords && semanticMap.associatedWords.length > 0)) {
            
            hasContent = true;
            yPosition += 2;
            
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.setFont('helvetica', 'bold');
            doc.text('Semantic Map:', 20, yPosition);
            doc.setFont('helvetica', 'normal');
            
            yPosition += 5;
            
            // Synonyms
            if (semanticMap.synonyms && semanticMap.synonyms.length > 0) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Synonyms:', 25, yPosition);
              doc.setFont('helvetica', 'normal');
              
              const synonymText = this.ensureSemanticArray(semanticMap.synonyms).join(', ');
              const synonymLines = doc.splitTextToSize(synonymText, 120);
              const displaySynonymLines = synonymLines.length > 1 ? 
                                        [synonymLines[0] + '...'] : 
                                        synonymLines;
              
              doc.text(displaySynonymLines, 60, yPosition);
              
              yPosition += 5;
            }
            
            // Antonyms
            if (semanticMap.antonyms && semanticMap.antonyms.length > 0) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Antonyms:', 25, yPosition);
              doc.setFont('helvetica', 'normal');
              
              const antonymText = this.ensureSemanticArray(semanticMap.antonyms).join(', ');
              const antonymLines = doc.splitTextToSize(antonymText, 120);
              const displayAntonymLines = antonymLines.length > 1 ? 
                                        [antonymLines[0] + '...'] : 
                                        antonymLines;
              
              doc.text(displayAntonymLines, 60, yPosition);
              
              yPosition += 5;
            }
            
            // Related concepts
            if (semanticMap.relatedConcepts && semanticMap.relatedConcepts.length > 0) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Related:', 25, yPosition);
              doc.setFont('helvetica', 'normal');
              
              const relatedText = this.ensureSemanticArray(semanticMap.relatedConcepts).join(', ');
              const relatedLines = doc.splitTextToSize(relatedText, 120);
              const displayRelatedLines = relatedLines.length > 1 ? 
                                        [relatedLines[0] + '...'] : 
                                        relatedLines;
              
              doc.text(displayRelatedLines, 60, yPosition);
              
              yPosition += 5;
            }
            
            // Add more semantic data if present
            if (semanticMap.contexts && semanticMap.contexts.length > 0) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Contexts:', 25, yPosition);
              doc.setFont('helvetica', 'normal');
              
              const contextsText = this.ensureSemanticArray(semanticMap.contexts).join(', ');
              const contextsLines = doc.splitTextToSize(contextsText, 120);
              const displayContextsLines = contextsLines.length > 1 ? 
                                          [contextsLines[0] + '...'] : 
                                          contextsLines;
              
              doc.text(displayContextsLines, 60, yPosition);
              
              yPosition += 5;
            }
          }
        }
        
        // ---- SEPARATOR LINE ----
        yPosition += 5;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(20, yPosition, 190, yPosition);
        
        yPosition += 8; // Space after separator
      });
      
      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      }
      
      // Generate PDF
      const pdfOutput = doc.output('arraybuffer');
      console.log(`PDF generated successfully with jsPDF, size: ${pdfOutput.byteLength} bytes`);
      
      return Buffer.from(pdfOutput);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService(); 