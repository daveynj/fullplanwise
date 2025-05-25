import { jsPDF } from 'jspdf';

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
    try {
      console.log('Starting basic PDF generation for vocabulary review...');
      
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
      
      // Add header
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175); // Primary blue
      const title = lessonData.title.length > 60 ? lessonData.title.substring(0, 60) + '...' : lessonData.title;
      doc.text(title, 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100); // Gray
      doc.text(`Vocabulary Review • CEFR Level ${lessonData.level} • ${words.length} Words`, 20, 28);
      
      doc.setDrawColor(59, 130, 246); // Blue
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      
      // Add color key
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Word Categories', 20, 42);
      
      doc.setFontSize(10);
      
      // Basic legend with safe colors
      doc.setFillColor(59, 130, 246); // Blue for nouns
      doc.rect(20, 45, 5, 5, 'F');
      doc.text('Noun', 30, 49);
      
      doc.setFillColor(16, 185, 129); // Green for verbs
      doc.rect(60, 45, 5, 5, 'F');
      doc.text('Verb', 70, 49);
      
      doc.setFillColor(245, 158, 11); // Amber for adjectives
      doc.rect(100, 45, 5, 5, 'F');
      doc.text('Adjective', 110, 49);
      
      doc.setFillColor(249, 115, 22); // Orange for adverbs
      doc.rect(150, 45, 5, 5, 'F');
      doc.text('Adverb', 160, 49);
      
      let y = 60; // Start position for vocabulary words
      
      // Process each vocabulary word
      for (const word of words) {
        // Calculate needed height
        let cardHeight = 60; // Basic height
        
        // Add more height for additional content
        if (word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0) {
          cardHeight += 10;
        }
        if (word.collocations && word.collocations.length > 0) {
          cardHeight += 10;
        }
        if (word.usageNotes) {
          cardHeight += 10;
        }
        
        // Check if we need a new page
        if (y + cardHeight > 270) {
          doc.addPage();
          y = 20;
        }
        
        // Draw card background
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(20, y, 170, cardHeight, 3, 3, 'FD');
        
        // Word term with appropriate color based on part of speech
        doc.setFontSize(16);
        let wordColor;
        
        switch(word.partOfSpeech.toLowerCase()) {
          case 'noun': wordColor = [59, 130, 246]; break; // Blue
          case 'verb': wordColor = [16, 185, 129]; break; // Green  
          case 'adjective': wordColor = [245, 158, 11]; break; // Amber
          case 'adverb': wordColor = [249, 115, 22]; break; // Orange
          default: wordColor = [100, 100, 100]; // Gray
        }
        
        doc.setTextColor(wordColor[0], wordColor[1], wordColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(word.term, 25, y + 15);
        
        // Part of speech
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text(`(${word.partOfSpeech})`, 25 + doc.getTextWidth(word.term) + 5, y + 15);
        
        // Pronunciation if available
        if (word.pronunciation) {
          let pronText = '';
          if (typeof word.pronunciation === 'string') {
            pronText = word.pronunciation;
          } else if (word.pronunciation.phoneticGuide) {
            pronText = word.pronunciation.phoneticGuide;
          } else if (word.pronunciation.syllables) {
            pronText = word.pronunciation.syllables.join('-');
          }
          
          if (pronText) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`/${pronText}/`, 120, y + 15);
          }
        }
        
        // Definition
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        const definition = word.definition || "No definition available";
        const splitDefinition = doc.splitTextToSize(definition, 160);
        
        // Show up to 3 lines for definition
        const defLines = splitDefinition.length > 3 ? 
          [splitDefinition[0], splitDefinition[1], splitDefinition[2] + '...'] : 
          splitDefinition;
        
        doc.text(defLines, 25, y + 25);
        
        // Example sentence
        if (word.example) {
          const exampleY = y + 25 + (defLines.length * 5);
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.setFont('helvetica', 'italic');
          
          const example = word.example;
          const splitExample = doc.splitTextToSize(`"${example}"`, 160);
          
          // Show up to 2 lines for example
          const exLines = splitExample.length > 2 ? 
            [splitExample[0], splitExample[1] + '...'] : 
            splitExample;
          
          doc.text(exLines, 25, exampleY);
        }
        
        let additionalInfoY = y + 40;
        
        // Word family
        if (word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Related Words:', 25, additionalInfoY);
          
          doc.setFont('helvetica', 'normal');
          const familyWords = word.wordFamily.words.join(', ');
          const truncatedFamily = familyWords.length > 90 ? familyWords.substring(0, 90) + '...' : familyWords;
          doc.text(truncatedFamily, 70, additionalInfoY);
          
          additionalInfoY += 10;
        }
        
        // Collocations
        if (word.collocations && word.collocations.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Common with:', 25, additionalInfoY);
          
          doc.setFont('helvetica', 'normal');
          const collocations = word.collocations.join(', ');
          const truncatedCollocations = collocations.length > 90 ? collocations.substring(0, 90) + '...' : collocations;
          doc.text(truncatedCollocations, 70, additionalInfoY);
          
          additionalInfoY += 10;
        }
        
        // Usage notes
        if (word.usageNotes) {
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text('Usage Note:', 25, additionalInfoY);
          
          doc.setFont('helvetica', 'normal');
          const truncatedNotes = word.usageNotes.length > 90 ? word.usageNotes.substring(0, 90) + '...' : word.usageNotes;
          doc.text(truncatedNotes, 70, additionalInfoY);
        }
        
        // Move to next word position
        y += cardHeight + 10;
      }
      
      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
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