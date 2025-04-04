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
          {wordData.pronunciation}
        </p>
        
        {/* Syllable breakdown - using predefined data */}
        <div className="flex justify-center mt-2 gap-0.5">
          {wordData.syllables.map((syllable: string, idx: number) => (
            <span 
              key={idx}
              className={`px-2 py-1 text-sm ${
                idx === wordData.emphasisIndex
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {syllable}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}