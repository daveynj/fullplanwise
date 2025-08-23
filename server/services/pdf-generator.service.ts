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
                <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL Logo" style="height: 32px; width: auto; vertical-align: middle; margin-right: 8px;"/>
                PlanwiseESL
              </div>
              <div class="brand-url">planwiseesl.com</div>
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
                <div class="powered-by">Powered by <strong>PlanwiseESL.com</strong></div>
                <div class="footer-tagline">Create your own AI lessons at planwiseesl.com</div>
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