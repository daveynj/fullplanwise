import React from 'react';
import { Book, BookOpen, Radio } from 'lucide-react';

export interface VocabularyWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  pronunciation?: string;
}

interface VocabularyCardProps {
  word: VocabularyWord;
}

export function VocabularyCard({ word }: VocabularyCardProps) {
  return (
    <div className="bg-blue-50 rounded-md p-5 border border-blue-100">
      <div className="mb-2">
        <h2 className="text-xl font-medium text-blue-900">{word.word}</h2>
        <p className="text-blue-600 text-sm">{word.partOfSpeech || 'noun'}</p>
      </div>
      
      {/* Definition */}
      <div className="mb-3">
        <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
          <Book className="mr-2 h-4 w-4" />
          Definition
        </h3>
        <p className="p-2 bg-white rounded border border-blue-100">
          {word.definition || `A definition for ${word.word}`}
        </p>
      </div>
      
      {/* Example */}
      <div className="mb-3">
        <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Example
        </h3>
        <p className="p-2 bg-white rounded border border-blue-100 italic">
          "{word.example || `This is an example sentence using the word ${word.word}.`}"
        </p>
      </div>
      
      {/* Pronunciation */}
      <div>
        <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
          <Radio className="mr-2 h-4 w-4" />
          Pronunciation
        </h3>
        <p className="p-2 bg-white rounded border border-blue-100 font-mono">
          {word.pronunciation || `Pronunciation for ${word.word}`}
        </p>
        
        {/* Syllable breakdown */}
        {word.word && (
          <div className="flex justify-center mt-2 gap-0.5">
            {(() => {
              // Parse pronunciation to determine syllables and emphasis
              let syllables: string[] = [];
              let emphasisIndex = -1;
              
              // Handle common patterns in pronunciation strings
              const pronString = word.pronunciation || '';
              
              if (pronString) {
                // Method 1: Check for specific word cases we know about
                if (word.word === 'celebration' && pronString.includes('BRAY')) {
                  syllables = ['cel', 'e', 'bra', 'tion'];
                  emphasisIndex = 2; // "bra" syllable is emphasized 
                } else if (word.word === 'parade' && pronString.includes('RAYD')) {
                  syllables = ['pa', 'rade'];
                  emphasisIndex = 1; // "rade" syllable is emphasized
                } else if (word.word === 'festivity' && pronString.includes('TIV')) {
                  syllables = ['fes', 'tiv', 'i', 'ty'];
                  emphasisIndex = 1; // "tiv" syllable is emphasized
                } else if (word.word === 'commemorate' && pronString.includes('MEM')) {
                  syllables = ['com', 'mem', 'o', 'rate'];
                  emphasisIndex = 1; // "mem" syllable is emphasized
                } else if (word.word === 'patriotic' && pronString.includes('OT')) {
                  syllables = ['pa', 'tri', 'ot', 'ic'];
                  emphasisIndex = 2; // "ot" syllable is emphasized
                } else if (word.word === 'ritual' && pronString.includes('RICH')) {
                  syllables = ['ri', 'tu', 'al'];
                  emphasisIndex = 0; // "ri" syllable is emphasized
                } else if (word.word === 'heritage' && pronString.includes('HAIR')) {
                  syllables = ['her', 'i', 'tage'];
                  emphasisIndex = 0; // "her" syllable is emphasized
                } 
                // Method 2: Split by dash or hyphen if it exists in the pronunciation
                else if (pronString.includes('-')) {
                  const parts = pronString.split('-');
                  // Find the emphasized part (usually in ALL CAPS)
                  emphasisIndex = parts.findIndex(part => 
                    part === part.toUpperCase() && part.length > 1);
                  
                  // Derive syllables from the word itself based on length patterns
                  let remaining = word.word;
                  const avgLength = Math.ceil(remaining.length / parts.length);
                  
                  while (remaining.length > 0) {
                    const syllableLength = Math.min(avgLength, remaining.length);
                    syllables.push(remaining.substring(0, syllableLength));
                    remaining = remaining.substring(syllableLength);
                  }
                }
                // Method 3: Look for capitalized sections in the pronunciation as emphasis
                else if (/[A-Z]{2,}/.test(pronString)) {
                  // Split the word into approximately equal parts
                  const match = pronString.match(/[A-Z]{2,}/);
                  if (match) {
                    const emphasisPosition = pronString.indexOf(match[0]) / pronString.length;
                    // Split word into reasonable syllables
                    const wordLength = word.word.length;
                    const syllableCount = Math.ceil(wordLength / 3);
                    const syllableSize = Math.ceil(wordLength / syllableCount);
                    
                    for (let i = 0; i < wordLength; i += syllableSize) {
                      syllables.push(word.word.substring(i, Math.min(i + syllableSize, wordLength)));
                    }
                    
                    // Approximate which syllable has emphasis
                    emphasisIndex = Math.floor(emphasisPosition * syllables.length);
                  }
                }
              }
                
              // Default syllable splitting if no special cases matched
              if (syllables.length === 0) {
                // Simple syllable splitting based on word length
                if (word.word.length <= 4) {
                  syllables = [word.word];
                } else if (word.word.length <= 6) {
                  syllables = [word.word.substring(0, 2), word.word.substring(2)];
                } else {
                  // For longer words, try to make meaningful chunks
                  let remaining = word.word;
                  while (remaining.length > 0) {
                    const syllableLength = Math.min(3, remaining.length);
                    syllables.push(remaining.substring(0, syllableLength));
                    remaining = remaining.substring(syllableLength);
                  }
                }
                // Default emphasis on second syllable if we have multiple
                emphasisIndex = syllables.length > 1 ? 1 : 0;
              }
              
              // Render the syllables with one emphasized
              return syllables.map((syllable, idx) => (
                <span 
                  key={idx} 
                  className={`px-2 py-1 text-sm ${
                    idx === emphasisIndex
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {syllable}
                </span>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}