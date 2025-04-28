import React, { useState } from 'react';
import { BookOpen, Mic, Lightbulb, MessageSquare, Heart, Users, ChevronDown, ChevronUp, Tag } from 'lucide-react';

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
              <BookOpen className="mr-2 h-4 w-4" />
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
        <div className="grid grid-cols-2 gap-3">
          {/* Left side: Image or Example */}
          {word.imageBase64 ? (
            <div className="bg-white rounded-md overflow-hidden h-[170px] border-2 border-blue-200">
              <img 
                src={`data:image/png;base64,${word.imageBase64}`} 
                alt={`Visual representation of ${word.word}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-white rounded-md p-4 h-[170px] border-2 border-blue-200 flex flex-col">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-700 mr-2" />
                <span className="text-blue-700 font-semibold">Example</span>
              </div>
              <p className="text-sm font-medium mt-2 flex-1 flex items-center italic">
                "{word.example || `This is an example sentence using the word ${word.word}.`}"
              </p>
            </div>
          )}
          
          {/* Right side: Pronunciation and Definition - split into two sections */}
          <div className="flex flex-col gap-3">
            {/* Pronunciation Section - Styled EXACTLY like the reference image */}
            <div className="bg-blue-50 rounded-md p-4 h-[85px] flex-1 border-2 border-blue-200">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                     className="h-5 w-5 text-blue-700 mr-2">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4"></path>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span className="text-blue-700 font-semibold">Pronunciation</span>
              </div>
              
              {/* PART 1: The phonetic pronunciation like BLAHK */}
              <div className="text-center mt-2">
                <div className="text-xl font-medium text-blue-800">
                  {wordData.pronunciation.toUpperCase()}
                </div>
                
                {/* PART 2: Syllable boxes with appropriate emphasis */}
                <div className="flex justify-center gap-2 mt-2">
                  {wordData.syllables && wordData.syllables.length > 0 ? (
                    wordData.syllables.map((syllable, idx) => (
                      <div 
                        key={idx}
                        className={`py-1 px-2 rounded-md ${
                          idx === wordData.emphasisIndex 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-800 border border-blue-200'
                        } flex items-center justify-center text-xs font-medium`}
                      >
                        {syllable.toUpperCase()}
                      </div>
                    ))
                  ) : (
                    <div className="py-1 px-2 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                      {word.word.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Definition Section - Matches the reference image */}
            <div className="bg-white rounded-md p-4 h-[85px] flex-1 border-2 border-blue-200">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-700 mr-2" />
                <span className="text-blue-700 font-semibold">Definition</span>
              </div>
              <p className="text-sm font-medium mt-2 line-clamp-2">
                {word.definition || `A definition for ${word.word}`}
              </p>
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
  );
}