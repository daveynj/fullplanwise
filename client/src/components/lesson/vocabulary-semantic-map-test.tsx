import React from 'react';
import { VocabularyCard } from './warm-up/vocabulary-card';

// Test vocabulary word with semantic map data
const testVocabularyWord = {
  word: "innovation",
  partOfSpeech: "noun",
  definition: "The introduction of new ideas, methods, or technologies that create value or improve existing processes.",
  example: "The company's innovation in renewable energy has revolutionized the industry.",
  semanticGroup: "Technology & Progress",
  additionalExamples: [
    "Her innovation in teaching methods helped students learn more effectively.",
    "The startup's innovation disrupted the traditional market."
  ],
  wordFamily: {
    words: ["innovate", "innovative", "innovator", "innovatively"],
    description: "Words related to creating new ideas and methods"
  },
  collocations: ["technological innovation", "product innovation", "innovation hub"],
  usageNotes: "Often used in business and technology contexts to describe breakthrough ideas.",
  semanticMap: {
    synonyms: ["creativity", "invention", "breakthrough", "novelty", "originality"],
    antonyms: ["tradition", "convention", "stagnation", "conformity"],
    relatedConcepts: ["technology", "progress", "research", "development", "entrepreneurship"],
    contexts: ["business environment", "scientific research", "technology sector", "startup culture"],
    associatedWords: ["disruptive", "cutting-edge", "revolutionary", "transformative", "pioneering"]
  }
};

export function VocabularySemanticMapTest() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">🎯 Semantic Maps Implementation Test</h1>
        <p className="text-center text-gray-600 mb-6">
          This demonstrates the semantic maps feature integrated into vocabulary cards.
          The semantic map appears at the bottom of the vocabulary card when semantic data is available.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-green-800 mb-2">✅ Implementation Status:</h3>
          <ul className="text-green-700 space-y-1">
            <li>• VocabularySemanticMap component: ✅ Created</li>
            <li>• Integration with VocabularyCard: ✅ Complete</li>
            <li>• AI services updated: ✅ All three services (Qwen, Gemini, OpenAI)</li>
            <li>• Type definitions: ✅ Complete</li>
            <li>• Interactive features: ✅ Click to focus, color-coded categories</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Sample Vocabulary Card with Semantic Map</h2>
        <VocabularyCard word={testVocabularyWord} />
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">🎯 How Semantic Maps Work:</h3>
        <ul className="text-blue-700 space-y-1">
          <li>• <strong>Synonyms (Green):</strong> Words with similar meanings</li>
          <li>• <strong>Antonyms (Red):</strong> Words with opposite meanings</li>
          <li>• <strong>Related Concepts (Blue):</strong> Connected ideas and concepts</li>
          <li>• <strong>Contexts (Purple):</strong> Common situations where the word is used</li>
          <li>• <strong>Associated Words (Orange):</strong> Words commonly used together</li>
        </ul>
        <p className="text-blue-600 mt-3 font-medium">
          Click on any category in the semantic map to focus on that relationship type!
        </p>
      </div>
    </div>
  );
} 