import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Target, ArrowDown, ArrowRight, Eye, X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { EnhancedGrammarMaster } from "./enhanced-grammar-master";

interface GrammarSpotlightProps {
  grammarData: any;
  onSkip?: () => void;
  onComplete?: () => void;
}

export function GrammarSpotlight({ grammarData, onSkip, onComplete }: GrammarSpotlightProps) {
  // The grammarData is the AI-generated grammarSpotlight object
  const grammarType = grammarData.grammarType || 'grammar_elements';
  const grammarTitle = grammarData.title || 'Grammar Focus';
  
  // Get the first example from the AI-generated examples
  const examples = grammarData.examples || [];
  const firstExample = examples[0];
  
  // Extract sentence from the AI-generated structure
  const sentence = firstExample?.sentence || '';
  const highlightedText = firstExample?.highlighted || '';

  // Extract grammar words from the AI's highlighted text
  const extractGrammarWords = (highlightedText: string, grammarType: string): string[] => {
    if (!highlightedText) return [];
    
    // Extract words between ** markers (AI highlighting format)
    const grammarWords: string[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = regex.exec(highlightedText)) !== null) {
      const highlightedPhrase = match[1].trim();
      
      // For modal verbs, extract individual modal verbs
      if (grammarType.toLowerCase().includes('modal')) {
        const modalVerbs = ['can', 'could', 'may', 'might', 'will', 'would', 'shall', 'should', 'must', 'ought'];
        modalVerbs.forEach(modal => {
          if (highlightedPhrase.toLowerCase().includes(modal.toLowerCase())) {
            grammarWords.push(modal);
          }
        });
      } else {
        // For other grammar types, add the highlighted phrase
        grammarWords.push(highlightedPhrase);
      }
    }
    
    return [...new Set(grammarWords)]; // Remove duplicates
  };

  const grammarWords = extractGrammarWords(highlightedText, grammarType);
  const explanation = firstExample?.explanation || grammarData.description || `Understanding ${grammarType.replace(/_/g, ' ')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Target className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-purple-800">{grammarType.toUpperCase().replace(/_/g, ' ')}</h2>
              <p className="text-purple-600">{grammarTitle}</p>
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

      {/* Enhanced Grammar System */}
      <EnhancedGrammarMaster
        grammarType={grammarType}
        sentence={sentence}
        grammarWords={grammarWords}
        explanation={explanation}
        onNext={() => {
          if (onComplete) {
            onComplete();
          }
        }}
      />
    </div>
  );
} 