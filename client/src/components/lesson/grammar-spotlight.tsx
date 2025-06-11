import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Target, ArrowDown, ArrowRight, Eye, X, RotateCcw, Brain, Lightbulb, Clock, CheckCircle2, Play, Zap, TrendingUp, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedModalScale } from './enhanced-modal-scale';
import { EnhancedDecisionTree } from './enhanced-decision-tree';
import { EnhancedPatternRecognition } from './enhanced-pattern-recognition';
import { EnhancedTimelineConnection } from './enhanced-timeline-connection';
import { EnhancedTransformation } from './enhanced-transformation';

interface GrammarSpotlightProps {
  grammarData: any;
  onSkip?: () => void;
  onComplete?: () => void;
}

export function GrammarSpotlight({ grammarData, onSkip, onComplete }: GrammarSpotlightProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedExample, setSelectedExample] = useState<number>(0);
  const [highlightedPart, setHighlightedPart] = useState<string>('');
  
  // Use AI-generated content directly
  const grammarType = grammarData?.grammarType || 'grammar_concept';
  const title = grammarData?.title || 'Grammar Focus';
  const description = grammarData?.description || '';
  const examples = grammarData?.examples || [];
  const logicExplanation = grammarData?.logicExplanation || {};
  const visualLayout = grammarData?.visualLayout || {};

  // Create progressive steps from AI content
  const progressiveSteps = [
    {
      id: 'need',
      title: 'Why This Exists',
      content: logicExplanation.communicationNeed || description,
      icon: Brain
    },
    {
      id: 'solution', 
      title: 'How It Works',
      content: logicExplanation.logicalSolution,
      icon: Lightbulb
    },
    {
      id: 'usage',
      title: 'When to Use',
      content: logicExplanation.usagePattern,
      icon: Clock
    },
    {
      id: 'impact',
      title: 'Communication Effect',
      content: logicExplanation.communicationImpact,
      icon: TrendingUp
    }
  ].filter(step => step.content); // Only include steps with AI content

  // Helper functions for visual components
  const getGrammarVisual = (type: string) => {
    const visualType = visualLayout?.recommendedType || type;
    
    if (visualType.includes('timeline') || type.includes('perfect') || type.includes('tense')) {
      return (
        <div className="bg-blue-50 rounded-lg p-4 my-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-blue-800 font-bold text-sm">PAST</span>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-600" />
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">BRIDGE</span>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-600" />
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">NOW</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (visualType.includes('scale') || type.includes('modal') || type.includes('certainty')) {
      return (
        <div className="bg-purple-50 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between">
            <span className="text-purple-700 text-sm">Low Certainty</span>
            <Scale className="h-6 w-6 text-purple-600" />
            <span className="text-purple-700 text-sm">High Certainty</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {['might', 'could', 'should', 'will', 'must'].map((modal, idx) => (
              <div key={modal} className={`text-center p-2 rounded ${
                idx < 2 ? 'bg-red-100 text-red-700' :
                idx < 4 ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                <span className="text-xs font-medium">{modal}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), stepIndex]));
    if (stepIndex < progressiveSteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const renderInteractiveExample = (example: any, index: number) => {
    if (!example.sentence) return null;
    
    const highlighted = example.highlighted || '';
    const sentence = example.sentence;
    
    // Extract highlighted parts using ** markers
    const parts = sentence.split(/(\*\*[^*]+\*\*)/);
    
    return (
      <div 
        key={index}
        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
          selectedExample === index 
            ? 'border-amber-400 bg-amber-50' 
            : 'border-amber-200 bg-white hover:border-amber-300'
        }`}
        onClick={() => setSelectedExample(index)}
      >
                 <div className="text-xl font-medium text-amber-900 mb-2">
           {parts.map((part: string, partIndex: number) => {
             if (part.startsWith('**') && part.endsWith('**')) {
               const cleanPart = part.slice(2, -2);
               return (
                 <span
                   key={partIndex}
                   className={`px-2 py-1 rounded cursor-pointer transition-all ${
                     highlightedPart === cleanPart
                       ? 'bg-amber-400 text-amber-900'
                       : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                   }`}
                   onClick={(e) => {
                     e.stopPropagation();
                     setHighlightedPart(highlightedPart === cleanPart ? '' : cleanPart);
                   }}
                 >
                   {cleanPart}
                 </span>
               );
             }
             return <span key={partIndex}>{part}</span>;
           })}
        </div>
        
        {selectedExample === index && example.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-amber-700 text-sm mt-2 p-3 bg-amber-100 rounded"
          >
            {example.explanation}
          </motion.div>
        )}
        
        {highlightedPart && selectedExample === index && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-blue-100 rounded text-blue-800 text-sm"
          >
            <strong>"{highlightedPart}"</strong> - This is the key grammar element
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Target className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-purple-800">{grammarType.toUpperCase().replace(/_/g, ' ')}</h2>
              <p className="text-purple-600">{title}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {progressiveSteps.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          {progressiveSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = completedSteps.has(index);
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                </div>
                <span className={`text-sm text-center ${isActive ? 'font-semibold' : ''}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progressive Content Display */}
      {progressiveSteps.length > 0 && currentStep < progressiveSteps.length && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {React.createElement(progressiveSteps[currentStep].icon, { 
                className: "h-6 w-6 text-blue-600" 
              })}
              {progressiveSteps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 leading-relaxed mb-4">
              {progressiveSteps[currentStep].content}
            </p>
            
            {/* Show visual for current step */}
            {currentStep === 1 && getGrammarVisual(grammarType)}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => handleStepComplete(currentStep)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === progressiveSteps.length - 1 ? 'Complete Understanding' : 'Next Step'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Examples */}
      {examples.length > 0 && completedSteps.size >= 2 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Interactive Examples
              <Badge variant="outline">Click to explore</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examples.map((example: any, index: number) => renderInteractiveExample(example, index))}
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {completedSteps.size === progressiveSteps.length && (
        <div className="flex justify-center">
          <Button 
            onClick={onComplete}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Grammar Understood - Continue Lesson
          </Button>
        </div>
      )}
    </div>
  );
} 