import React from 'react';
import { Book, BookOpen, Radio } from 'lucide-react';

export interface VocabularyWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  pronunciation?: string | { syllables?: string[], stressIndex?: number, phoneticGuide?: string };
  syllables?: string[];
  stressIndex?: number;
  phoneticGuide?: string;
  imageBase64?: string | null;
}

interface VocabularyCardProps {
  word: VocabularyWord;
}

export function VocabularyCard({ word }: VocabularyCardProps) {
  // Prepare pronunciation data from the word or use fallbacks
  const normalizedWord = word.word?.toLowerCase() || '';
  
  // Handle complex pronunciation object
  const getPronunciationData = () => {
    // Handle complex pronunciation object
    if (word.pronunciation && typeof word.pronunciation === 'object') {
      return {
        pronunciation: word.pronunciation.phoneticGuide || "Pronunciation not available",
        syllables: word.pronunciation.syllables || [normalizedWord],
        emphasisIndex: word.pronunciation.stressIndex !== undefined ? word.pronunciation.stressIndex : 0
      };
    }
    
    // Handle direct fields
    return {
      pronunciation: word.phoneticGuide || (typeof word.pronunciation === 'string' ? word.pronunciation : "Pronunciation not available"),
      syllables: word.syllables || [normalizedWord],
      emphasisIndex: word.stressIndex !== undefined ? word.stressIndex : 0
    };
  };
  
  // Define pronunciation data structure with API data or fallbacks
  const wordData = getPronunciationData();

  return (
    <div className="bg-blue-50 rounded-md p-5 border border-blue-100">
      <div className="mb-4">
        <h2 className="text-xl font-medium text-blue-900">{word.word}</h2>
        <p className="text-blue-600 text-sm">{word.partOfSpeech || 'noun'}</p>
      </div>
      
      {/* Display Image if available */}
      {word.imageBase64 && (
        <div className="mb-4 flex justify-center">
          <img 
            src={`data:image/png;base64,${word.imageBase64}`}
            alt={`Illustration for ${word.word}`}
            className="rounded-lg border border-blue-200 shadow-sm max-w-full h-auto max-h-48"
          />
        </div>
      )}
      
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
        {/* New container for pronunciation box */}
        <div className="p-3 bg-blue-100 rounded-md border border-blue-200 space-y-2">
          <p className="font-mono text-blue-900"> {/* Removed individual bg/border */}
            {wordData.pronunciation}
          </p>
          
          {/* Syllable breakdown - using predefined data */}
          <div className="flex justify-center gap-0.5"> {/* Removed mt-2, handled by space-y-2 on parent */}
            {wordData.syllables.map((syllable: string, idx: number) => (
              <span 
                key={idx}
                className={`px-2 py-1 text-sm rounded ${
                  idx === wordData.emphasisIndex
                    ? 'bg-blue-600 text-white' // Adjusted emphasis style slightly for contrast
                    : 'bg-white text-gray-700' // Adjusted non-emphasis style for contrast
                }`}
              >
                {syllable}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}