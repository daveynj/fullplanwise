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
  
  // No hardcoded data - we'll use the AI-generated data entirely

  // Log the raw word data to see what we're working with
  console.log(`WORD DATA FOR "${normalizedWord}":`, {
    wordObj: word,
    pronunciation: word.pronunciation,
    syllables: word.syllables,
    stressIndex: word.stressIndex,
    phoneticGuide: word.phoneticGuide
  });
  
  // Handle complex pronunciation object - with type safety
  const getPronunciationData = () => {
    let pronouncedValue = "";
    let syllablesArray: string[] = [];
    let emphasisIdx = 0;
    
    // First get the PHONETIC PRONUNCIATION
    // First check if we have a direct pronunciation string
    if (typeof word.pronunciation === 'string' && word.pronunciation) {
      pronouncedValue = word.pronunciation;
      console.log(`STRING PRONUNCIATION FOR "${normalizedWord}":`, pronouncedValue);
    }
    // Check for pronunciation object with value or ipa field
    else if (word.pronunciation && typeof word.pronunciation === 'object') {
      const pronounceObj = word.pronunciation as any;
      console.log(`OBJECT PRONUNCIATION FOR "${normalizedWord}":`, pronounceObj);
      
      // If we have a direct value/ipa field, use that
      if (pronounceObj.value) {
        pronouncedValue = pronounceObj.value;
      }
      else if (pronounceObj.ipa) {
        pronouncedValue = pronounceObj.ipa;
      }
      else if (pronounceObj.phoneticGuide) {
        pronouncedValue = pronounceObj.phoneticGuide;
      }
      // If no direct pronunciation field but we have syllables, create a phonetic guide
      else if (pronounceObj.syllables && Array.isArray(pronounceObj.syllables) && pronounceObj.syllables.length > 0) {
        const syllables = pronounceObj.syllables;
        const emphIndex = pronounceObj.stressIndex !== undefined ? pronounceObj.stressIndex : 0;
        
        pronouncedValue = syllables.map((s: string, i: number) => 
          i === emphIndex ? s.toUpperCase() : s.toLowerCase()
        ).join('-');
      }
    }
    // Check for direct phoneticGuide field
    else if (word.phoneticGuide) {
      pronouncedValue = word.phoneticGuide;
    }
    
    // Now get the SYLLABLES for the boxes
    // Handle complex pronunciation object
    if (word.pronunciation && typeof word.pronunciation === 'object') {
      const pronounceObj = word.pronunciation as any;
      
      // Get the syllables from the pronunciation object or fall back to word syllables
      syllablesArray = pronounceObj.syllables && Array.isArray(pronounceObj.syllables) && pronounceObj.syllables.length > 0
        ? pronounceObj.syllables
        : word.syllables && Array.isArray(word.syllables) && word.syllables.length > 0
          ? word.syllables
          : word.word?.match(/[bcdfghjklmnpqrstvwxz]*[aeiouy]+[bcdfghjklmnpqrstvwxz]*/gi) || [normalizedWord];
          
      // Get the stress index
      emphasisIdx = pronounceObj.stressIndex !== undefined 
        ? pronounceObj.stressIndex 
        : word.stressIndex !== undefined 
          ? word.stressIndex 
          : 0;
    }
    else {
      // Get syllables from direct field
      syllablesArray = word.syllables && Array.isArray(word.syllables) && word.syllables.length > 0
        ? word.syllables
        : word.word?.match(/[bcdfghjklmnpqrstvwxz]*[aeiouy]+[bcdfghjklmnpqrstvwxz]*/gi) || [normalizedWord];
        
      // Get emphasis index from direct field
      emphasisIdx = word.stressIndex !== undefined ? word.stressIndex : 0;
    }
    
    // If we STILL don't have a pronunciation value, create one from syllables
    if ((!pronouncedValue || pronouncedValue.trim() === "") && syllablesArray.length > 0) {
      pronouncedValue = syllablesArray.map((s, i) => 
        i === emphasisIdx ? s.toUpperCase() : s.toLowerCase()
      ).join('-');
    }
    
    // If all else fails, use the word itself
    if (!pronouncedValue || pronouncedValue.trim() === "") {
      pronouncedValue = normalizedWord.toUpperCase();
    }
    
    return {
      pronunciation: pronouncedValue,
      syllables: syllablesArray,
      emphasisIndex: emphasisIdx
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
    <div className="flex flex-col md:flex-row bg-gray-50 rounded-md p-0 border-2 border-blue-200 shadow-md overflow-hidden">
      {/* Left Side: Image (similar to reference) */}
      {word.imageBase64 ? (
        <div className="w-full md:w-1/3 bg-gray-100 flex items-center justify-center">
          <img 
            src={`data:image/png;base64,${word.imageBase64}`} 
            alt={`Visual representation of ${word.word}`}
            className="w-full h-full object-cover"
            style={{ width: "100%", height: "100%", minHeight: "280px", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div className="hidden md:flex w-full md:w-1/3 bg-gray-100 items-center justify-center">
          <div className="text-gray-400 text-center p-6">
            <p>No image available</p>
          </div>
        </div>
      )}
      
      {/* Right Side: Content */}
      <div className="w-full md:w-2/3 p-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          
          {/* Pronunciation Section - Styled EXACTLY like the reference image but with DYNAMIC data */}
          <div className="bg-blue-50 rounded-md p-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                   className="h-5 w-5 text-blue-700 mr-2">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4"></path>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <span className="text-blue-700 font-semibold text-lg">Pronunciation</span>
            </div>
            
            {/* Styled exactly like the reference image but with DYNAMIC data */}
            <div className="text-center mt-4">
              {/* PART 1: The phonetic pronunciation like KAIR-ak-ter */}
              <div className="text-2xl font-medium text-blue-800 mb-4">
                {/* Use the processed pronunciation data from getPronunciationData() */}
                {wordData.pronunciation.toUpperCase()}
              </div>
              
              {/* PART 2: Syllable boxes with appropriate emphasis */}
              <div className="flex justify-center gap-2">
                {/* Always use the same wordData that we have in the pronunciation display */}
                {wordData.syllables && wordData.syllables.length > 0 ? (
                  wordData.syllables.map((syllable, idx) => (
                    <div 
                      key={idx}
                      className={`min-w-[80px] py-2 px-4 rounded-md ${
                        idx === wordData.emphasisIndex 
                          ? 'bg-blue-600 text-white font-medium' 
                          : 'bg-white text-gray-800 font-medium'
                      } flex items-center justify-center text-lg`}
                    >
                      {syllable.toLowerCase()}
                    </div>
                  ))
                ) : (
                  // If no syllables data available, break the word into syllables manually
                  word.word.split('').map((letter, idx) => (
                    <div 
                      key={idx}
                      className={`min-w-[40px] py-2 px-3 rounded-md ${
                        idx === 1 // Arbitrarily highlight the second letter for visual example
                          ? 'bg-blue-600 text-white font-medium' 
                          : 'bg-white text-gray-800 font-medium'
                      } flex items-center justify-center text-lg`}
                    >
                      {letter.toLowerCase()}
                    </div>
                  ))
                )}
              </div>
            </div>
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
      </div>
    </div>
  );
}