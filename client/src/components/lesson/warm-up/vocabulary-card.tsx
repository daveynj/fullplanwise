import React, { useState } from 'react';
import { Book, BookOpen, Radio, Lightbulb, MessageSquare, Heart, Users, ChevronDown, ChevronUp, Tag } from 'lucide-react';

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

  // Check if we have any expanded content
  const hasExpandedContent = 
    (word.additionalExamples && word.additionalExamples.length > 0) || 
    (word.wordFamily && word.wordFamily.words.length > 0) || 
    (word.collocations && word.collocations.length > 0) ||
    word.usageNotes;

  return (
    <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
      {/* Header with Word and Part of Speech */}
      <div className="flex justify-between items-center border-b border-blue-100 pb-2 mb-2">
        <div>
          <h2 className="text-xl font-bold text-blue-900">{word.word}</h2>
          <p className="text-blue-600 text-xs">{word.partOfSpeech || 'noun'}</p>
        </div>
        
        {/* Semantic Group Tag */}
        {word.semanticGroup && (
          <div className="bg-blue-100 py-1 px-2 rounded-full flex items-center">
            <Tag className="h-3 w-3 mr-1 text-blue-700" />
            <span className="text-xs text-blue-800">{word.semanticGroup}</span>
          </div>
        )}
      </div>

      {/* Compact Content Grid */}
      <div className="grid grid-cols-1 gap-2">
        {/* Row 1: Definition and Example */}
        <div className="grid grid-cols-2 gap-2">
          {/* Definition */}
          <div className="bg-white rounded border border-blue-100 p-2">
            <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
              <Book className="mr-1 h-3 w-3" />
              Definition
            </h3>
            <p className="text-sm">
              {word.definition || `A definition for ${word.word}`}
            </p>
          </div>
          
          {/* Example */}
          <div className="bg-white rounded border border-blue-100 p-2">
            <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
              <BookOpen className="mr-1 h-3 w-3" />
              Example
            </h3>
            <p className="text-sm italic">
              "{word.example || `This is an example sentence using the word ${word.word}.`}"
            </p>
          </div>
        </div>
        
        {/* Row 2: Pronunciation */}
        <div className="bg-blue-100 rounded-md border border-blue-200 p-2">
          <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
            <Radio className="mr-1 h-3 w-3" />
            Pronunciation
          </h3>
          <div className="flex flex-col items-center space-y-1">
            <p className="font-mono text-blue-900 text-sm">
              {wordData.pronunciation}
            </p>
            
            {/* Syllable breakdown */}
            <div className="flex justify-center gap-0.5"> 
              {wordData.syllables.map((syllable: string, idx: number) => (
                <span 
                  key={idx}
                  className={`px-2 py-0.5 text-xs rounded ${
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
        
        {/* Row 3: Additional Content - Always visible but compact */}
        <div className="grid grid-cols-1 gap-2">
          {/* Additional Examples */}
          {word.additionalExamples && word.additionalExamples.length > 0 && (
            <div className="bg-white rounded border border-blue-100 p-2">
              <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
                <MessageSquare className="mr-1 h-3 w-3" />
                More Examples
              </h3>
              <div className="text-xs space-y-1">
                {word.additionalExamples.slice(0, 2).map((example, index) => (
                  <p key={index} className="italic border-l-2 border-blue-300 pl-2">
                    "{example}"
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {/* Word Family - Always visible */}
          {word.wordFamily && word.wordFamily.words.length > 0 && (
            <div className="bg-white rounded border border-blue-100 p-2">
              <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
                <Heart className="mr-1 h-3 w-3" />
                Word Family
              </h3>
              <div className="flex flex-wrap gap-1">
                {word.wordFamily.words.slice(0, 5).map((relatedWord, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs">
                    {relatedWord}
                  </span>
                ))}
                {word.wordFamily.words.length > 5 && (
                  <span className="text-blue-500 text-xs">+{word.wordFamily.words.length - 5} more</span>
                )}
              </div>
            </div>
          )}
          
          {/* Common Phrases - Always visible */}
          {word.collocations && word.collocations.length > 0 && (
            <div className="bg-white rounded border border-blue-100 p-2">
              <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
                <Users className="mr-1 h-3 w-3" />
                Common Phrases
              </h3>
              <div className="flex flex-wrap gap-1">
                {word.collocations.slice(0, 3).map((collocation, index) => (
                  <span key={index} className="bg-blue-50 border border-blue-200 text-blue-800 px-1.5 py-0.5 rounded text-xs inline-block">
                    {collocation}
                  </span>
                ))}
                {word.collocations.length > 3 && (
                  <span className="text-blue-500 text-xs">+{word.collocations.length - 3} more</span>
                )}
              </div>
            </div>
          )}
          
          {/* Usage Notes */}
          {word.usageNotes && (
            <div className="bg-white rounded border border-blue-100 p-2">
              <h3 className="text-blue-800 font-medium flex items-center text-xs mb-1">
                <Lightbulb className="mr-1 h-3 w-3" />
                Usage Notes
              </h3>
              <p className="text-xs">
                {word.usageNotes}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Image if available */}
      {word.imageBase64 && (
        <div className="mt-2">
          <img 
            src={`data:image/png;base64,${word.imageBase64}`} 
            alt={`Visual representation of ${word.word}`}
            className="rounded-md w-full object-cover border border-blue-200 max-h-32"
          />
        </div>
      )}
    </div>
  );
}