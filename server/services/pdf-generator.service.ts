import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
        
        .header {
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
      </style>
    </head>
    <body>
      <div class="header">
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
    </body>
    </html>
    `;
  }

  async generateVocabularyReviewPDF(lessonData: LessonData): Promise<Buffer> {
    let browser;
    
    try {
      console.log('Launching browser for PDF generation...');
      
      // Generate the HTML content first
      const html = this.generateHTML(lessonData);
      
      // Look for firefox which we installed as system dependency
      let executablePath;
      try {
        const { glob } = await import('glob');
        const matches = await glob('/nix/store/*/bin/firefox');
        if (matches.length > 0) {
          executablePath = matches[0];
          console.log(`Found Firefox at: ${executablePath}`);
        }
      } catch (err) {
        console.log('Error finding Firefox via glob:', err);
      }
      
      // If glob didn't work, try using which
      if (!executablePath) {
        try {
          const { execSync } = await import('child_process');
          executablePath = execSync('which firefox').toString().trim();
          console.log(`Found Firefox via which: ${executablePath}`);
        } catch (err) {
          console.log('Could not find Firefox via which');
        }
      }
      
      // Launch options for browser
      const launchOptions: any = {
        args: [
          '--headless',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        headless: true,
        ignoreHTTPSErrors: true,
        defaultViewport: { width: 794, height: 1123 },
        timeout: 30000
      };
      
      // Add executablePath if found
      if (executablePath) {
        launchOptions.executablePath = executablePath;
        launchOptions.product = 'firefox';
      }
      
      console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2));
      
      try {
        browser = await puppeteer.launch(launchOptions);
        console.log('Browser launched successfully');

        const page = await browser.newPage();
        
        // Set viewport explicitly
        await page.setViewport({ width: 794, height: 1123 });
        
        console.log('Setting PDF content...');
        
        // Set content with shorter timeout
        await page.setContent(html, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 // Reduced timeout
        });
        
        console.log('Generating PDF...');
        
        // Generate PDF with optimized settings
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          },
          printBackground: true,
          preferCSSPageSize: false,
          timeout: 15000 // Reduced timeout
        });

        console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        return Buffer.from(pdfBuffer);
      } finally {
        if (browser) {
          await browser.close();
          console.log('Browser closed successfully');
        }
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('TimeoutError') || error.message.includes('Timed out')) {
        throw new Error(`PDF generation timed out. This may be due to system resources. Please try again.`);
      } else if (error.message.includes('spawn') || error.message.includes('ENOENT')) {
        throw new Error(`Browser executable not found. Please try a different document format.`);
      } else if (error.message.includes('Protocol error')) {
        throw new Error(`Browser communication error. Please try again later.`);
      } else {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService(); 