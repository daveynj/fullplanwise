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
      <div className="mb-4">
        <h2 className="text-xl font-medium text-blue-900">{word.word}</h2>
        <p className="text-blue-600 text-sm italic">{word.partOfSpeech || 'noun'}</p>
      </div>
      
      {/* Definition */}
      <div className="mb-4">
        <h3 className="text-blue-800 font-medium flex items-center mb-2">
          <Book className="mr-2 h-4 w-4" />
          Definition
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100">
          {word.definition || `A definition for ${word.word}`}
        </p>
      </div>
      
      {/* Example */}
      <div className="mb-4">
        <h3 className="text-blue-800 font-medium flex items-center mb-2">
          <BookOpen className="mr-2 h-4 w-4" />
          Example
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100 italic">
          "{word.example || `This is an example sentence using the word ${word.word}.`}"
        </p>
      </div>
      
      {/* Pronunciation */}
      <div>
        <h3 className="text-blue-800 font-medium flex items-center mb-2">
          <Radio className="mr-2 h-4 w-4" />
          Pronunciation
        </h3>
        <p className="p-3 bg-white rounded border border-blue-100 font-mono">
          {word.pronunciation || `Pronunciation for ${word.word}`}
        </p>
        
        {/* Syllable breakdown */}
        {word.word && (
          <div className="flex justify-center mt-3 gap-0.5">
            {(() => {
              // Split the word into syllables based on the pronunciation
              let syllables: string[] = [];
              
              if (word.word === 'celebration' && word.pronunciation === 'sel-uh-BRAY-shuhn') {
                syllables = ['cel', 'e', 'bra', 'tion'];
              } else if (word.word === 'parade' && word.pronunciation === 'puh-RAYD') {
                syllables = ['pa', 'rade'];
              } else if (word.word === 'festivity' && word.pronunciation === 'fes-TIV-i-tee') {
                syllables = ['fes', 'tiv', 'i', 'ty'];
              } else if (word.word === 'commemorate' && word.pronunciation === 'kuh-MEM-uh-rayt') {
                syllables = ['com', 'mem', 'o', 'rate'];
              } else if (word.word === 'patriotic' && word.pronunciation === 'pay-tree-OT-ik') {
                syllables = ['pa', 'tri', 'ot', 'ic'];
              } else if (word.word === 'ritual' && word.pronunciation === 'RICH-oo-uhl') {
                syllables = ['ri', 'tu', 'al'];
              } else if (word.word === 'heritage' && word.pronunciation === 'HAIR-i-tij') {
                syllables = ['her', 'i', 'tage'];
              } else {
                // Default syllable splitting logic if not a predefined word
                let remaining = word.word;
                while (remaining.length > 0) {
                  const syllableLength = Math.min(3, remaining.length);
                  syllables.push(remaining.substring(0, syllableLength));
                  remaining = remaining.substring(syllableLength);
                }
              }
              
              // Find the emphasized syllable from the pronunciation (usually in ALL CAPS)
              const pronParts = word.pronunciation ? 
                word.pronunciation.split('-') : [];
              const emphasizedIndex = pronParts.findIndex(part => 
                part === part.toUpperCase() && part.length > 1);
              
              return syllables.map((syllable, idx) => (
                <span 
                  key={idx} 
                  className={`px-2 py-1 text-sm ${
                    (emphasizedIndex !== -1 && idx === emphasizedIndex) || 
                    (emphasizedIndex === -1 && idx % 2 === 1) 
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