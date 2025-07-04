import React, { useState } from 'react';
import { ArrowRight, Circle, FileText } from 'lucide-react';

interface VocabularyWord {
  word: string;
  semanticMap?: {
    synonyms?: string[];
    antonyms?: string[];
    relatedConcepts?: string[];
    contexts?: string[];
    associatedWords?: string[];
  };
}

interface SemanticMapProps {
  word: VocabularyWord;
}

interface SemanticConnection {
  category: string;
  words: string[];
  color: string;
  icon: JSX.Element;
}

export function VocabularySemanticMap({ word }: SemanticMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllConnections, setShowAllConnections] = useState(true);

  // DEBUG: Log what data we're receiving
  console.log('VocabularySemanticMap received word data:', {
    word: word.word,
    hasSemanticMap: !!word.semanticMap,
    semanticMapData: word.semanticMap
  });

  // Skip if no semantic map data
  if (!word.semanticMap) {
    console.log('No semantic map data found for word:', word.word);
    return null;
  }

  const { semanticMap } = word;

  // Helper function to ensure semantic map fields are arrays
  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      // Handle comma-separated strings
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  };

  // Prepare semantic connections with consistent styling
  const semanticConnections: SemanticConnection[] = [
    {
      category: 'Synonyms',
      words: ensureArray(semanticMap.synonyms),
      color: 'bg-green-100 border-green-300 text-green-800',
      icon: <Circle className="h-4 w-4 text-green-600" />
    },
    {
      category: 'Antonyms', 
      words: ensureArray(semanticMap.antonyms),
      color: 'bg-red-100 border-red-300 text-red-800',
      icon: <Circle className="h-4 w-4 text-red-600" />
    },
    {
      category: 'Related Concepts',
      words: ensureArray(semanticMap.relatedConcepts),
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      icon: <FileText className="h-4 w-4 text-blue-600" />
    },
    {
      category: 'Contexts',
      words: ensureArray(semanticMap.contexts),
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      icon: <Circle className="h-4 w-4 text-purple-600" />
    },
    {
      category: 'Associated Words',
      words: ensureArray(semanticMap.associatedWords),
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      icon: <ArrowRight className="h-4 w-4 text-orange-600" />
    }
  ].filter(connection => connection.words.length > 0);

  // Don't render if no connections
  if (semanticConnections.length === 0) {
    return null;
  }

  const toggleCategory = (category: string) => {
    console.log('Clicked category:', category, 'Current selected:', selectedCategory);
    if (selectedCategory === category) {
      // If clicking the same category, deselect it
      setSelectedCategory(null);
      setShowAllConnections(true);
    } else {
      // Select the new category and hide others
      setSelectedCategory(category);
      setShowAllConnections(false);
    }
  };

  const resetView = () => {
    setSelectedCategory(null);
    setShowAllConnections(true);
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Semantic Map</h3>
            <p className="text-lg font-medium text-gray-600 leading-relaxed">Explore connections for "{word.word}"</p>
          </div>
        </div>
      </div>

      {/* Semantic Map Visualization */}
      <div className="relative">
        {/* Central Word */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-xl shadow-lg transform transition-transform hover:scale-105">
            <h2 className="text-3xl font-bold text-center">{word.word}</h2>
          </div>
        </div>

        {/* Semantic Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {semanticConnections.map((connection, index) => {
            const isSelected = selectedCategory === connection.category;
            const isVisible = showAllConnections || selectedCategory === null || isSelected;
            
            if (!isVisible) return null;

            return (
              <div
                key={connection.category}
                className={`relative ${connection.color} border-2 rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                  isSelected ? 'ring-4 ring-blue-300 scale-105' : 'hover:scale-102'
                }`}
                onClick={() => toggleCategory(connection.category)}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {connection.icon}
                    <h4 className="font-bold text-xl">{connection.category}</h4>
                  </div>
                  <div className="text-sm font-semibold bg-white bg-opacity-70 px-2 py-1 rounded-full">
                    {connection.words.length}
                  </div>
                </div>

                {/* Words List */}
                <div className="space-y-2">
                  {connection.words.slice(0, isSelected ? connection.words.length : 3).map((wordItem, wordIndex) => (
                    <div
                      key={wordIndex}
                      className="bg-white bg-opacity-80 px-3 py-2 rounded-lg text-lg font-medium leading-relaxed border border-gray-200 hover:bg-opacity-100 transition-all"
                    >
                      {wordItem}
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {!isSelected && connection.words.length > 3 && (
                    <div className="text-center text-lg font-medium opacity-70 pt-1">
                      +{connection.words.length - 3} more...
                    </div>
                  )}
                </div>

                {/* Connection Line to Center */}
                <div className="absolute top-1/2 -left-2 w-4 h-0.5 bg-gray-400 opacity-50"></div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-lg font-medium text-gray-600 leading-relaxed">
          <p>Click on any category to focus on that connection type</p>
        </div>
      </div>
    </div>
  );
} 