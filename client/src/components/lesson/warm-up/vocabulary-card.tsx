import React from 'react';
import { Book, BookOpen, Radio } from 'lucide-react';

export interface VocabularyWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  pronunciation?: string;
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
  
  // Define pronunciation data structure with API data or fallbacks
  let wordData = {
    // If we have phoneticGuide from the API, use it, otherwise fall back to pronunciation field or default message
    pronunciation: word.phoneticGuide || word.pronunciation || "Pronunciation not available",
    
    // If we have syllables from the API, use them, otherwise split the word into characters
    syllables: word.syllables || [normalizedWord],
    
    // If we have stressIndex from the API, use it, otherwise default to 0
    emphasisIndex: word.stressIndex !== undefined ? word.stressIndex : 0
  };

  return (
    <div className="bg-blue-50 rounded-md p-5 border border-blue-100">
      <div className="mb-3">
        <h2 className="text-2xl font-medium text-blue-900">{word.word}</h2>
        <p className="text-blue-600 text-base">{word.partOfSpeech || 'noun'}</p>
      </div>
      
      {/* Definition */}
      <div className="mb-4">
        <h3 className="text-blue-800 font-medium flex items-center mb-2 text-base">
          <Book className="mr-2 h-5 w-5" />
          Definition
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100 text-lg">
          {word.definition || `A definition for ${word.word}`}
        </p>
      </div>
      
      {/* Example */}
      <div className="mb-4">
        <h3 className="text-blue-800 font-medium flex items-center mb-2 text-base">
          <BookOpen className="mr-2 h-5 w-5" />
          Example
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100 italic text-lg">
          "{word.example || `This is an example sentence using the word ${word.word}.`}"
        </p>
      </div>
      
      {/* Pronunciation */}
      <div>
        <h3 className="text-blue-800 font-medium flex items-center mb-2 text-base">
          <Radio className="mr-2 h-5 w-5" />
          Pronunciation
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100 font-mono text-lg">
          {wordData.pronunciation}
        </p>
        
        {/* Syllable breakdown - using predefined data */}
        <div className="flex justify-center mt-3 gap-1">
          {wordData.syllables.map((syllable: string, idx: number) => (
            <span 
              key={idx}
              className={`px-3 py-2 text-base ${
                idx === wordData.emphasisIndex
                  ? 'bg-blue-200 text-blue-800 font-bold' 
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