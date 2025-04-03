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

type PronunciationData = {
  [key: string]: {
    pronunciation: string;
    syllables: string[];
    emphasisIndex: number;
  };
};

export function VocabularyCard({ word }: VocabularyCardProps) {
  // Hardcoded pronunciation and syllable data for demonstration
  const pronunciationData: PronunciationData = {
    parade: {
      pronunciation: "puh-RAYD",
      syllables: ["pa", "rade"],
      emphasisIndex: 1
    },
    festivity: {
      pronunciation: "fes-TIV-i-tee",
      syllables: ["fes", "tiv", "i", "ty"],
      emphasisIndex: 1
    },
    commemorate: {
      pronunciation: "kuh-MEM-uh-rayt",
      syllables: ["com", "mem", "o", "rate"],
      emphasisIndex: 1
    },
    patriotic: {
      pronunciation: "pay-tree-OT-ik",
      syllables: ["pa", "tri", "ot", "ic"],
      emphasisIndex: 2
    },
    ritual: {
      pronunciation: "RICH-oo-uhl",
      syllables: ["ri", "tu", "al"],
      emphasisIndex: 0
    },
    heritage: {
      pronunciation: "HAIR-i-tij",
      syllables: ["her", "i", "tage"],
      emphasisIndex: 0
    },
    celebration: {
      pronunciation: "sel-uh-BRAY-shuhn",
      syllables: ["cel", "e", "bra", "tion"],
      emphasisIndex: 2
    }
  };
  
  // Look up the word in our pronunciation data
  const normalizedWord = word.word?.toLowerCase() || '';
  let wordData = {
    pronunciation: word.pronunciation || "Pronunciation not available",
    syllables: [normalizedWord],
    emphasisIndex: 0
  };
  
  // Check if we have this word in our pronunciation data
  if (normalizedWord && normalizedWord in pronunciationData) {
    wordData = pronunciationData[normalizedWord];
  }

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