import React, { useState } from 'react';
import { Book, BookOpen, Radio, Lightbulb, MessageSquare, Heart, Users, ChevronDown, ChevronUp, Tag } from 'lucide-react';

export interface VocabularyWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  pronunciation?: string | { ipa?: string, value?: string, syllables?: string[], stressIndex?: number, phoneticGuide?: string };
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
  // State for expandable sections
  const [showAdditionalExamples, setShowAdditionalExamples] = useState(false);
  const [showWordFamily, setShowWordFamily] = useState(false);
  const [showCollocations, setShowCollocations] = useState(false);
  
  // Prepare pronunciation data from the word or use fallbacks
  const normalizedWord = word.word?.toLowerCase() || '';
  
  // Handle complex pronunciation object
  const getPronunciationData = () => {
    // Handle complex pronunciation object
    if (word.pronunciation && typeof word.pronunciation === 'object') {
      return {
        pronunciation: word.pronunciation.ipa || word.pronunciation.value || word.pronunciation.phoneticGuide || "/pronunciation/",
        syllables: word.pronunciation.syllables || word.syllables || [normalizedWord],
        emphasisIndex: word.pronunciation.stressIndex !== undefined ? word.pronunciation.stressIndex : (word.stressIndex || 0)
      };
    }
    
    // Handle direct fields
    return {
      pronunciation: typeof word.pronunciation === 'string' ? word.pronunciation : (word.phoneticGuide || "/pronunciation/"),
      syllables: word.syllables || [normalizedWord],
      emphasisIndex: word.stressIndex !== undefined ? word.stressIndex : 0
    };
  };
  
  // Define pronunciation data structure with API data or fallbacks
  const wordData = getPronunciationData();

  // Check if we have any expanded content
  const hasExpandedContent = 
    (word.additionalExamples && word.additionalExamples.length > 0) || 
    (word.wordFamily && word.wordFamily.words.length > 0) || 
    (word.collocations && word.collocations.length > 0) ||
    word.usageNotes;

  return (
    <div className="bg-blue-50 rounded-md p-4 border-2 border-blue-200 shadow-md">
      {/* Header with Word and Part of Speech - Larger and bolder */}
      <div className="flex justify-between items-center border-b-2 border-blue-200 pb-3 mb-3">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-900">{word.word}</h2>
          <p className="text-blue-700 text-sm font-medium">{word.partOfSpeech || 'noun'}</p>
        </div>
        
        {/* Semantic Group Tag */}
        {word.semanticGroup && (
          <div className="bg-blue-100 py-1 px-3 rounded-full flex items-center">
            <Tag className="h-4 w-4 mr-1 text-blue-700" />
            <span className="text-sm font-medium text-blue-800">{word.semanticGroup}</span>
          </div>
        )}
      </div>

      {/* Compact Content Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Row 1: Definition and Example */}
        <div className="grid grid-cols-2 gap-3">
          {/* Definition */}
          <div className="bg-white rounded border-2 border-blue-200 p-3">
            <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
              <Book className="mr-2 h-4 w-4" />
              Definition
            </h3>
            <p className="text-base font-medium">
              {word.definition || `A definition for ${word.word}`}
            </p>
          </div>
          
          {/* Example */}
          <div className="bg-white rounded border-2 border-blue-200 p-3">
            <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
              <BookOpen className="mr-2 h-4 w-4" />
              Example
            </h3>
            <p className="text-base font-medium italic">
              "{word.example || `This is an example sentence using the word ${word.word}.`}"
            </p>
          </div>
        </div>
        
        {/* Pronunciation Section - Styled to match the exact image */}
        <div className="bg-blue-50 p-3 rounded">
          <div className="flex items-center mb-2">
            <Radio className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-700 font-medium text-lg">Pronunciation</span>
          </div>
          {wordData.pronunciation && (
            <div className="ml-7"> {/* Indented under the pronunciation heading */}
              <p className="font-mono text-xl">
                {wordData.pronunciation}
              </p>
            </div>
          )}
        </div>
        
        {/* Row 3: Additional Content - Always visible but compact */}
        <div className="grid grid-cols-1 gap-3">
          {/* Additional Examples */}
          {word.additionalExamples && word.additionalExamples.length > 0 && (
            <div className="bg-white rounded border-2 border-blue-200 p-3">
              <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
                <MessageSquare className="mr-2 h-4 w-4" />
                More Examples
              </h3>
              <div className="text-base space-y-2">
                {word.additionalExamples.slice(0, 2).map((example, index) => (
                  <p key={index} className="italic border-l-3 border-blue-400 pl-3 font-medium">
                    "{example}"
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {/* Word Family - Always visible */}
          {word.wordFamily && word.wordFamily.words && word.wordFamily.words.length > 0 && (
            <div className="bg-white rounded border-2 border-blue-200 p-3">
              <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
                <Heart className="mr-2 h-4 w-4" />
                Word Family
              </h3>
              <div className="flex flex-wrap gap-2">
                {word.wordFamily.words.slice(0, 5).map((relatedWord, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                    {relatedWord}
                  </span>
                ))}
                {word.wordFamily.words.length > 5 && (
                  <span className="text-blue-600 text-sm font-bold">+{word.wordFamily.words.length - 5} more</span>
                )}
              </div>
            </div>
          )}
          
          {/* Common Phrases - Always visible */}
          {word.collocations && Array.isArray(word.collocations) && word.collocations.length > 0 && (
            <div className="bg-white rounded border-2 border-blue-200 p-3">
              <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
                <Users className="mr-2 h-4 w-4" />
                Common Phrases
              </h3>
              <div className="flex flex-wrap gap-2">
                {word.collocations.slice(0, 3).map((collocation, index) => (
                  <span key={index} className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-bold inline-block">
                    {collocation}
                  </span>
                ))}
                {word.collocations.length > 3 && (
                  <span className="text-blue-600 text-sm font-bold">+{word.collocations.length - 3} more</span>
                )}
              </div>
            </div>
          )}
          
          {/* Usage Notes */}
          {word.usageNotes && (
            <div className="bg-white rounded border-2 border-blue-200 p-3">
              <h3 className="text-blue-800 font-bold flex items-center text-base mb-2">
                <Lightbulb className="mr-2 h-4 w-4" />
                Usage Notes
              </h3>
              <p className="text-base font-medium">
                {word.usageNotes}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Image if available */}
      {word.imageBase64 && (
        <div className="mt-3">
          <img 
            src={`data:image/png;base64,${word.imageBase64}`} 
            alt={`Visual representation of ${word.word}`}
            className="rounded-md w-full object-cover border-2 border-blue-200 max-h-36"
          />
        </div>
      )}
    </div>
  );
}