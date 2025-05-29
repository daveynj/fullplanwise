import React from 'react';
import { EnhancedPatternRecognition } from './enhanced-pattern-recognition';
import { EnhancedTimelineConnection } from './enhanced-timeline-connection';
import { EnhancedModalScale } from './enhanced-modal-scale';
import { EnhancedDecisionTree } from './enhanced-decision-tree';
import { EnhancedTransformation } from './enhanced-transformation';

interface EnhancedGrammarMasterProps {
  grammarType: string;
  sentence: string;
  grammarWords: string[];
  explanation: string;
  onNext: () => void;
}

export function EnhancedGrammarMaster({ 
  grammarType, 
  sentence, 
  grammarWords,
  explanation,
  onNext 
}: EnhancedGrammarMasterProps) {
  
  // Determine which visualization component to use based on grammar type
  const getVisualizationComponent = () => {
    // Normalize the grammar type (handle both RELATIVE_CLAUSES and relative_clauses)
    const type = grammarType.toLowerCase().replace(/\s+/g, '_');
    
    // Timeline-based grammar (all tense-related patterns)
    if ([
      'present_perfect', 'past_perfect', 'future_forms', 
      'simple_present', 'simple_past', 'advanced_tenses'
    ].includes(type)) {
      return (
        <>
          <EnhancedPatternRecognition
            sentence={sentence}
            grammarType={grammarType}
            grammarWords={grammarWords}
            explanation={explanation}
            onNext={() => {}}
          />
          <EnhancedTimelineConnection
            grammarType={grammarType}
            sentence={sentence}
            grammarWords={grammarWords}
            onNext={onNext}
          />
        </>
      );
    }
    
    // Scale-based grammar (intensity/certainty/level patterns)
    if ([
      'modal_verbs', 'basic_modals', 'comparative'
    ].includes(type)) {
      return (
        <>
          <EnhancedPatternRecognition
            sentence={sentence}
            grammarType={grammarType}
            grammarWords={grammarWords}
            explanation={explanation}
            onNext={() => {}}
          />
          <EnhancedModalScale
            grammarType={grammarType}
            sentence={sentence}
            grammarWords={grammarWords}
            onNext={onNext}
          />
        </>
      );
    }
    
    // Decision tree grammar (choice-based patterns)
    if ([
      'articles', 'conditionals_basic', 'conditionals_advanced',
      'relative_clauses'  // Added relative_clauses here
    ].includes(type)) {
      return (
        <>
          <EnhancedPatternRecognition
            sentence={sentence}
            grammarType={grammarType}
            grammarWords={grammarWords}
            explanation={explanation}
            onNext={() => {}}
          />
          <EnhancedDecisionTree
            grammarType={grammarType}
            sentence={sentence}
            grammarWords={grammarWords}
            onNext={onNext}
          />
        </>
      );
    }
    
    // Transformation grammar (structural changes)
    if ([
      'passive_voice', 'reported_speech', 'subjunctive'
    ].includes(type)) {
      return (
        <>
          <EnhancedPatternRecognition
            sentence={sentence}
            grammarType={grammarType}
            grammarWords={grammarWords}
            explanation={explanation}
            onNext={() => {}}
          />
          <EnhancedTransformation
            grammarType={grammarType}
            sentence={sentence}
            grammarWords={grammarWords}
            onNext={onNext}
          />
        </>
      );
    }
    
    // Enhanced pattern recognition for relationship-based grammar
    // (prepositions, etc. - these work well with deep pattern analysis)
    return (
      <EnhancedPatternRecognition
        sentence={sentence}
        grammarType={grammarType}
        grammarWords={grammarWords}
        explanation={explanation}
        onNext={onNext}
      />
    );
  };

  return (
    <div className="space-y-6">
      {getVisualizationComponent()}
    </div>
  );
} 