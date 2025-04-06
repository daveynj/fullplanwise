import React from 'react';
import { Book, BookOpen, Radio, Lightbulb, MessageSquare, Heart, Users, Tag } from 'lucide-react';

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
  
  // New fields for enhanced vocabulary learning
  semanticGroup?: string;                   // Category/theme this word belongs to
  additionalExamples?: string[];            // Multiple examples showing different contexts
  wordFamily?: {                            // Related words from the same family
    words: string[];
    description?: string;
  };
  collocations?: string[];                  // Common phrases with this word
  usageNotes?: string;                      // Additional information about word usage
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
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-medium text-blue-900">{word.word}</h2>
          <p className="text-blue-600 text-sm">{word.partOfSpeech || 'noun'}</p>
        </div>
        
        {/* Semantic Group Tag */}
        {word.semanticGroup && (
          <div className="bg-blue-100 py-1 px-3 rounded-full flex items-center">
            <Tag className="h-3 w-3 mr-1 text-blue-700" />
            <span className="text-xs text-blue-800">{word.semanticGroup}</span>
          </div>
        )}
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
      
      {/* Additional Examples - Not expandable */}
      {word.additionalExamples && word.additionalExamples.length > 0 && (
        <div className="mb-3">
          <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            More Examples
          </h3>
          <div className="p-2 bg-white rounded border border-blue-100 space-y-2">
            {word.additionalExamples.map((example, index) => (
              <p key={index} className="italic text-sm border-l-2 border-blue-300 pl-2">
                "{example}"
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Usage Notes */}
      {word.usageNotes && (
        <div className="mb-3">
          <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
            <Lightbulb className="mr-2 h-4 w-4" />
            Usage Notes
          </h3>
          <p className="p-2 bg-white rounded border border-blue-100 text-sm">
            {word.usageNotes}
          </p>
        </div>
      )}
      
      {/* Word Family - Not expandable */}
      {word.wordFamily && word.wordFamily.words.length > 0 && (
        <div className="mb-3">
          <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
            <Heart className="mr-2 h-4 w-4" />
            Word Family
          </h3>
          <div className="p-3 bg-white rounded border border-blue-100">
            {word.wordFamily.description && (
              <p className="text-sm mb-2">{word.wordFamily.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {word.wordFamily.words.map((relatedWord, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {relatedWord}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Collocations - Not expandable */}
      {word.collocations && word.collocations.length > 0 && (
        <div className="mb-3">
          <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
            <Users className="mr-2 h-4 w-4" />
            Common Phrases
          </h3>
          <div className="p-2 bg-white rounded border border-blue-100">
            <div className="flex flex-wrap gap-1">
              {word.collocations.map((collocation, index) => (
                <span key={index} className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded text-sm inline-block m-1">
                  {collocation}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Pronunciation */}
      <div>
        <h3 className="text-blue-800 font-medium flex items-center mb-1 text-sm">
          <Radio className="mr-2 h-4 w-4" />
          Pronunciation
        </h3>
        <div className="p-3 bg-blue-100 rounded-md border border-blue-200 space-y-2">
          <p className="font-mono text-blue-900">
            {wordData.pronunciation}
          </p>
          
          {/* Syllable breakdown */}
          <div className="flex justify-center gap-0.5"> 
            {wordData.syllables.map((syllable: string, idx: number) => (
              <span 
                key={idx}
                className={`px-2 py-1 text-sm rounded ${
                  idx === wordData.emphasisIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {syllable}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Image if available */}
      {word.imageBase64 && (
        <div className="mt-3">
          <img 
            src={`data:image/png;base64,${word.imageBase64}`} 
            alt={`Visual representation of ${word.word}`}
            className="rounded-md w-full object-cover mt-2 border border-blue-200"
          />
        </div>
      )}
    </div>
  );
}