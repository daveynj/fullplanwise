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
  
  // Handle complex pronunciation object - with type safety
  const getPronunciationData = () => {
    // Handle complex pronunciation object
    if (word.pronunciation && typeof word.pronunciation === 'object') {
      const pronounceObj = word.pronunciation as any; // Safely cast to any
      return {
        pronunciation: pronounceObj.ipa || pronounceObj.value || pronounceObj.phoneticGuide || "/pronunciation/",
        syllables: pronounceObj.syllables || word.syllables || [normalizedWord],
        emphasisIndex: pronounceObj.stressIndex !== undefined ? pronounceObj.stressIndex : (word.stressIndex || 0)
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
        
        {/* Pronunciation Section - With actual pronunciation data */}
        <div className="bg-blue-50 p-3">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.4998 7.5C19.4998 10.5376 17.5374 13 14.9998 13C14.2009 13 13.4482 12.8137 12.7664 12.492C12.607 12.8057 12.4263 13.1065 12.2251 13.3946C12.8343 13.7803 13.5448 14 14.2998 14C17.3374 14 19.9998 11.0376 19.9998 8C19.9998 4.96243 17.3374 2 14.2998 2C11.8296 2 9.61231 3.98544 8.94177 6.65429C9.48961 6.73937 10.0153 6.8922 10.5104 7.10468C11.0403 4.94321 12.7132 3.5 14.9998 3.5C16.933 3.5 18.4998 5.29086 18.4998 7.5Z" fill="currentColor"/>
              <path d="M4 7.5C4 10.5376 5.96243 13 8.5 13C9.29894 13 10.0516 12.8137 10.7334 12.492C10.8928 12.8057 11.0735 13.1065 11.2747 13.3946C10.6655 13.7803 9.95501 14 9.19995 14C6.16238 14 3.5 11.0376 3.5 8C3.5 4.96243 6.16238 2 9.19995 2C11.6702 2 13.8875 3.98544 14.558 6.65429C14.0102 6.73937 13.4845 6.8922 12.9894 7.10468C12.4595 4.94321 10.7866 3.5 8.5 3.5C6.56714 3.5 4.99998 5.29086 4.99998 7.5L4 7.5Z" fill="currentColor"/>
              <path d="M17.9216 15.1271C17.6886 14.897 17.3122 14.899 17.0821 15.1321L14.8649 17.3804L12.6477 15.1321C12.4177 14.899 12.0412 14.897 11.8082 15.1271C11.5752 15.3572 11.5732 15.7336 11.8032 15.9667L14.4407 18.6384C14.5595 18.7589 14.7122 18.8192 14.8649 18.8192C15.0177 18.8192 15.1704 18.7589 15.2891 18.6384L17.9266 15.9667C18.1567 15.7336 18.1547 15.3572 17.9216 15.1271Z" fill="currentColor"/>
              <path d="M7.91946 15.9667L5.68228 18.2349C5.45224 18.468 5.45423 18.8444 5.68732 19.0744C5.8023 19.1882 5.95444 19.246 6.10698 19.246C6.26132 19.246 6.41606 19.1866 6.53183 19.0689L9.19582 16.3579C9.41587 16.1348 9.42023 15.7684 9.20552 15.5383C8.9908 15.3083 8.61992 15.304 8.39781 15.5282L7.91946 15.9667Z" fill="currentColor"/>
            </svg>
            <span className="text-blue-700 font-medium">Pronunciation</span>
          </div>
          <div className="ml-7 mt-1">
            <p className="text-xl font-mono">
              {wordData.pronunciation}
            </p>
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