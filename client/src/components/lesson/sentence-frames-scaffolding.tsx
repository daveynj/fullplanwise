import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowDown, Play, CheckCircle, RotateCcw } from "lucide-react";

// Import the scaffolding types
import { 
  LowerLevelScaffolding,
  SentenceWorkshopActivity,
  PatternTrainer,
  SentenceBuildingStep 
} from '../../../types/lessonContentTypes';

interface ScaffoldingProps {
  scaffolding: LowerLevelScaffolding;
  topic: string;
}

// Sentence Workshop Component - Progressive sentence building
function SentenceWorkshop({ activities, topic }: { activities: SentenceWorkshopActivity[], topic: string }) {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  if (!activities || activities.length === 0) return null;

  const activity = activities[currentActivity];
  const step = activity.steps[currentStep];

  const nextStep = () => {
    if (currentStep < activity.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const resetSteps = () => {
    setCurrentStep(0);
  };

  const nextActivity = () => {
    if (currentActivity < activities.length - 1) {
      setCurrentActivity(currentActivity + 1);
      setCurrentStep(0);
    }
  };

  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
        <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          <Play className="h-5 w-5" />
          Sentence Workshop: {activity.name}
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="bg-white">
            Activity {currentActivity + 1} of {activities.length}
          </Badge>
          <Badge variant="outline" className="bg-white">
            Step {currentStep + 1} of {activity.steps.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Current Step Display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              step.level === 'word' ? 'bg-green-500' :
              step.level === 'phrase' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}>
              {currentStep + 1}
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 capitalize">{step.level}</h4>
              {step.explanation && (
                <p className="text-sm text-blue-600">{step.explanation}</p>
              )}
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded border border-blue-300">
            <p className="text-xl font-mono text-gray-800">{step.example}</p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="flex items-center justify-center gap-2 py-3">
          {activity.steps.map((s, index) => (
            <React.Fragment key={index}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                index <= currentStep 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
              </div>
              {index < activity.steps.length - 1 && (
                <ArrowRight className={`h-4 w-4 ${index < currentStep ? 'text-blue-500' : 'text-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            onClick={resetSteps}
            disabled={currentStep === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
          
          {currentStep < activity.steps.length - 1 ? (
            <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
              Next Step
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : currentActivity < activities.length - 1 ? (
            <Button onClick={nextActivity} className="bg-green-600 hover:bg-green-700">
              Next Activity
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Workshop Complete!</span>
            </div>
          )}
        </div>

        {activity.teachingNotes && (
          <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-4">
            <p className="text-sm text-amber-800">
              <strong>Teaching Note:</strong> {activity.teachingNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pattern Trainer Component - Interactive drag-and-drop pattern practice
function PatternTrainerComponent({ trainer }: { trainer: PatternTrainer }) {
  const [selectedWords, setSelectedWords] = useState<{[key: string]: string}>({});
  const [builtSentence, setBuiltSentence] = useState('');
  const [currentExample, setCurrentExample] = useState(0);
  const [draggedWord, setDraggedWord] = useState<{word: string, category: string} | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const wordCategories = Object.keys(trainer.scaffolding).filter(key => 
    Array.isArray(trainer.scaffolding[key]) && trainer.scaffolding[key]!.length > 0
  );

  const selectWord = (category: string, word: string) => {
    const newSelection = { ...selectedWords, [category]: word };
    setSelectedWords(newSelection);
    updateBuiltSentence(newSelection);
  };

  const updateBuiltSentence = (selection: {[key: string]: string}) => {
    let sentence = trainer.pattern;
    
    // Try multiple placeholder formats to match different AI providers
    Object.entries(selection).forEach(([cat, selectedWord]) => {
      const placeholders = [
        `[${cat}]`,              // exact match: [adjectives]
        `[${cat.toUpperCase()}]`, // uppercase: [ADJECTIVES] 
        `[${cat.slice(0, -1)}]`,  // singular: [adjective] from adjectives
        `[${cat.slice(0, -1).toUpperCase()}]` // singular uppercase: [ADJECTIVE]
      ];
      
      placeholders.forEach(placeholder => {
        sentence = sentence.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), selectedWord);
      });
    });
    
    setBuiltSentence(sentence);
  };

  const handleDragStart = (word: string, category: string) => {
    setDraggedWord({ word, category });
  };

  const handleDragEnd = () => {
    setDraggedWord(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDropTarget(category);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (draggedWord) {
      selectWord(targetCategory, draggedWord.word);
    }
    setDropTarget(null);
    setDraggedWord(null);
  };

  const resetSelection = () => {
    setSelectedWords({});
    setBuiltSentence('');
  };

  const nextExample = () => {
    setCurrentExample((prev) => (prev + 1) % trainer.examples.length);
  };

  return (
    <Card className="border-green-200 shadow-sm">
      <CardHeader className="bg-green-50 p-4 border-b border-green-200">
        <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {trainer.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Pattern Display */}
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Pattern:</h4>
          <p className="font-mono text-lg text-gray-800">{trainer.pattern}</p>
        </div>

        {/* Word Banks */}
        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Choose your words (click or drag):</h4>
          {wordCategories.map((category, index) => {
            const words = trainer.scaffolding[category] || [];
            const colorClasses = [
              'border-blue-300 bg-blue-50 text-blue-700',
              'border-purple-300 bg-purple-50 text-purple-700', 
              'border-orange-300 bg-orange-50 text-orange-700',
              'border-pink-300 bg-pink-50 text-pink-700',
              'border-teal-300 bg-teal-50 text-teal-700'
            ][index % 5];

            return (
              <div key={category} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {category}:
                </label>
                <div 
                  className={`min-h-[60px] p-2 rounded border-2 border-dashed transition-colors ${
                    dropTarget === category ? 'border-green-400 bg-green-50' : 'border-gray-300'
                  }`}
                  onDragOver={(e) => handleDragOver(e, category)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, category)}
                >
                  <div className="flex flex-wrap gap-2">
                    {words.map((word, wordIndex) => (
                      <Button
                        key={wordIndex}
                        variant="outline"
                        size="sm"
                        draggable
                        onClick={() => selectWord(category, word)}
                        onDragStart={() => handleDragStart(word, category)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move ${colorClasses} ${
                          selectedWords[category] === word ? 'ring-2 ring-offset-1 ring-green-400' : ''
                        } ${
                          draggedWord?.word === word ? 'opacity-50' : ''
                        }`}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Built Sentence Display */}
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Your Sentence:</h4>
          <p className="text-lg font-mono bg-white p-3 rounded border min-h-[60px] flex items-center">
            {builtSentence || trainer.pattern}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={resetSelection}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button variant="outline" onClick={nextExample}>
            Show Example
          </Button>
        </div>

        {/* Example Display */}
        {trainer.examples && trainer.examples.length > 0 && (
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">Example:</h4>
            <p className="text-yellow-700">{trainer.examples[currentExample]}</p>
          </div>
        )}

        {/* Instructions */}
        {trainer.instructions && trainer.instructions.length > 0 && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1">
              {trainer.instructions.map((instruction, index) => (
                <li key={index} className="text-blue-700 text-sm">{instruction}</li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Visual Maps Component - Color-coded sentence structure
function VisualMaps({ maps }: { maps: Array<{pattern: string, colorCoding: {[component: string]: string}, example: string}> }) {
  if (!maps || maps.length === 0) return null;

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
        <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
          <ArrowDown className="h-5 w-5" />
          Sentence Structure Maps
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {maps.map((map, index) => (
          <div key={index} className="space-y-3">
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">Pattern:</h4>
              <p className="font-mono text-lg">{map.pattern}</p>
            </div>
            
            <div className="bg-white p-3 rounded border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">Color-Coded Example:</h4>
              <div className="text-lg space-x-1">
                {map.example.split(' ').map((word, wordIndex) => {
                  // Find which component this word belongs to
                  const component = Object.keys(map.colorCoding).find(comp => 
                    map.example.toLowerCase().includes(comp.toLowerCase()) && 
                    word.toLowerCase().includes(comp.toLowerCase().split(' ')[0])
                  );
                  
                  const colorClass = component ? `bg-${map.colorCoding[component]}-100 text-${map.colorCoding[component]}-800` : 'text-gray-800';
                  
                  return (
                    <span key={wordIndex} className={`px-1 py-0.5 rounded ${colorClass}`}>
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(map.colorCoding).map(([component, color]) => (
                <Badge key={component} className={`bg-${color}-100 text-${color}-800 border-${color}-300`}>
                  {component}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Main Scaffolding Component
export function SentenceFramesScaffolding({ scaffolding, topic }: ScaffoldingProps) {
  return (
    <div className="space-y-6">
      {/* Sentence Workshop */}
      {scaffolding.sentenceWorkshop && scaffolding.sentenceWorkshop.length > 0 && (
        <SentenceWorkshop activities={scaffolding.sentenceWorkshop} topic={topic} />
      )}

      {/* Pattern Trainer */}
      {scaffolding.patternTrainer && (
        <PatternTrainerComponent trainer={scaffolding.patternTrainer} />
      )}

      {/* Visual Maps */}
      {scaffolding.visualMaps && scaffolding.visualMaps.length > 0 && (
        <VisualMaps maps={scaffolding.visualMaps} />
      )}
    </div>
  );
} 