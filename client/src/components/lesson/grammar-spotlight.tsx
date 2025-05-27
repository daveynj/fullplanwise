import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Target, ArrowDown, ArrowRight, Eye, X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { VisualGrammarDisplay } from "./visual-grammar-display";
import { AIDrivenGrammarVisual } from "./ai-driven-grammar-visual";

interface GrammarSpotlightProps {
  grammarData: any;
  onSkip?: () => void;
  onComplete?: () => void;
}

export function GrammarSpotlight({ grammarData, onSkip, onComplete }: GrammarSpotlightProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Extract examples from the lesson text
  const examples = grammarData.examples || [];
  const practiceExamples = grammarData.visualSteps?.[0]?.visualElements?.examples || [];
  
  // Get categories if available (like Place, Time, Movement for prepositions)
  const categories = grammarData.visualSteps?.[0]?.visualElements?.categories || [];
  
  // Get the grammar type (like "prepositions")
  const grammarType = grammarData.grammarType || 'grammar elements';
  const grammarTitle = grammarData.title || 'Grammar Focus';

  // Create comprehensive steps to show all content
  const contentSteps = [
    {
      title: "Visual Grammar Guide",
      content: "visual-display"
    },
    {
      title: "Pattern Recognition",
      content: "lesson-text"
    },
    {
      title: "Categories",
      content: "categories"
    },
    {
      title: "Practice Examples", 
      content: "practice"
    }
  ].filter(step => {
    // Always include the visual display as the first step
    if (step.content === "visual-display") return true;
    // Only include other steps that have content
    if (step.content === "lesson-text" && examples.length > 0) return true;
    if (step.content === "categories" && categories.length > 0) return true;
    if (step.content === "practice" && practiceExamples.length > 0) return true;
    return false;
  });

  const handleNext = () => {
    if (currentStep < contentSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    const step = contentSteps[currentStep];
    if (!step) return null;

    switch (step.content) {
      case "visual-display":
        // Use AI-driven visual if we have visualLayout data, otherwise fall back to static
        if (grammarData.visualLayout) {
          return <AIDrivenGrammarVisual grammarData={grammarData} />;
        } else {
          return (
            <VisualGrammarDisplay
              grammarType={grammarType}
              title={grammarTitle}
              description={grammarData.description || `Understanding ${grammarType}`}
              examples={examples}
              visualSteps={grammarData.visualSteps || []}
            />
          );
        }

      case "lesson-text":
        // Helper function to extract just the grammar words from phrases
        const extractGrammarWords = (highlightedText: string, grammarType: string) => {
          const phrases = highlightedText.split('**').filter((_, index) => index % 2 === 1);
          
          // Define grammar word lists for accurate extraction
          const grammarWordLists = {
            prepositions: [
              'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'at',
              'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'by',
              'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like',
              'near', 'of', 'off', 'on', 'onto', 'over', 'through', 'throughout', 'to',
              'toward', 'under', 'until', 'up', 'upon', 'with', 'within', 'without'
            ],
            conjunctions: [
              'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'although', 'because', 'since',
              'unless', 'until', 'while', 'if', 'when', 'where', 'whereas', 'however'
            ],
            articles: ['a', 'an', 'the'],
            pronouns: [
              'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
              'my', 'your', 'his', 'hers', 'its', 'our', 'their', 'myself', 'yourself',
              'himself', 'herself', 'itself', 'ourselves', 'themselves'
            ],
            modalverbs: [
              'can', 'could', 'may', 'might', 'will', 'would', 'shall', 'should', 'must', 'ought'
            ],
            relativeclauses: [
              'who', 'whom', 'whose', 'which', 'that', 'where', 'when', 'why'
            ],
            // For verb tenses, we need to handle them differently since they're complex patterns
            presentperfect: [], // Will handle with pattern matching
            pastperfect: [], // Will handle with pattern matching  
            conditionals: [], // Will handle with pattern matching
            passivevoice: [], // Will handle with pattern matching
            comparatives: [], // Will handle with pattern matching
            futureforms: [], // Will handle with pattern matching
            phrasalverbs: [], // Will handle with pattern matching
            gerundsinfinitives: [] // Will handle with pattern matching
          };

          // Get the word list for this grammar type
          const typeKey = grammarType.toLowerCase().replace(/[_\s]+/g, '');
          const wordList = grammarWordLists[typeKey as keyof typeof grammarWordLists] || [];
          
          // For complex grammar patterns, use pattern-based extraction
          const extractComplexGrammar = (text: string, grammarType: string): string[] => {
            const lowerType = grammarType.toLowerCase().replace(/[_\s]+/g, '');
            const grammarWords: string[] = [];
            
            switch (lowerType) {
              case 'presentperfect':
                // Extract have/has + past participle
                const ppMatches = text.match(/\b(?:have|has)\s+\w+/gi) || [];
                ppMatches.forEach(match => {
                  const parts = match.split(/\s+/);
                  grammarWords.push(...parts);
                });
                break;
                
              case 'pastperfect':
                // Extract had + past participle
                const pastPerfectMatches = text.match(/\bhad\s+\w+/gi) || [];
                pastPerfectMatches.forEach(match => {
                  const parts = match.split(/\s+/);
                  grammarWords.push(...parts);
                });
                break;
                
              case 'conditionals':
                // Extract if, would, could, might, etc.
                const conditionalWords = ['if', 'would', 'could', 'might', 'should', 'unless', 'provided', 'suppose'];
                conditionalWords.forEach(word => {
                  const regex = new RegExp(`\\b${word}\\b`, 'gi');
                  if (regex.test(text)) {
                    grammarWords.push(word);
                  }
                });
                break;
                
              case 'passivevoice':
                // Extract be + past participle
                const passiveMatches = text.match(/\b(?:am|is|are|was|were|being|been)\s+\w+ed\b|\b(?:am|is|are|was|were|being|been)\s+(?:done|taken|made|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|gotten|grown|hidden|known|left|lost|met|paid|read|run|said|sold|sent|shown|thought|told|understood|won|worn)\b/gi) || [];
                passiveMatches.forEach(match => {
                  const parts = match.split(/\s+/);
                  grammarWords.push(...parts);
                });
                break;
                
              case 'comparatives':
                // Extract comparative and superlative forms
                const comparativeMatches = text.match(/\b\w+er\s+than\b|\bmore\s+\w+\s+than\b|\bthe\s+\w+est\b|\bthe\s+most\s+\w+\b/gi) || [];
                comparativeMatches.forEach(match => {
                  // Extract key words like "more", "than", "most", comparative adjectives
                  if (match.includes('more')) grammarWords.push('more');
                  if (match.includes('most')) grammarWords.push('most');
                  if (match.includes('than')) grammarWords.push('than');
                  // Extract the comparative adjective
                  const adjMatch = match.match(/\b\w+er\b|\b\w+est\b/gi);
                  if (adjMatch) grammarWords.push(...adjMatch);
                });
                break;
                
              case 'futureforms':
                // Extract will, going to, shall
                const futureWords = ['will', 'shall', 'going'];
                futureWords.forEach(word => {
                  const regex = new RegExp(`\\b${word}\\b`, 'gi');
                  if (regex.test(text)) {
                    grammarWords.push(word);
                  }
                });
                break;
                
              case 'phrasalverbs':
                // Extract verb + particle combinations
                const phrasalMatches = text.match(/\b\w+\s+(?:up|down|in|out|on|off|over|back|away|through|around|along|across|after|into|onto)\b/gi) || [];
                phrasalMatches.forEach(match => {
                  const parts = match.split(/\s+/);
                  // Take the verb and particle
                  if (parts.length >= 2) {
                    grammarWords.push(parts[0], parts[1]);
                  }
                });
                break;
                
              case 'gerundsinfinitives':
                // Extract -ing forms and to + verb
                const gerundMatches = text.match(/\b\w+ing\b/gi) || [];
                const infinitiveMatches = text.match(/\bto\s+\w+\b/gi) || [];
                grammarWords.push(...gerundMatches);
                infinitiveMatches.forEach(match => {
                  const parts = match.split(/\s+/);
                  grammarWords.push(...parts);
                });
                break;
            }
            
            return [...new Set(grammarWords)]; // Remove duplicates
          };
          
          // Extract only the actual grammar words from each phrase
          const grammarWords: string[] = [];
          
          if (wordList.length > 0) {
            // Use word list approach for simple word types
            phrases.forEach(phrase => {
              const words = phrase.toLowerCase().split(/\s+/);
              words.forEach(word => {
                // Clean word of punctuation
                const cleanWord = word.replace(/[.,;:!?'"()]/g, '');
                if (wordList.includes(cleanWord)) {
                  grammarWords.push(cleanWord);
                }
              });
            });
          } else {
            // Use pattern-based approach for complex grammar
            const complexGrammarWords = extractComplexGrammar(highlightedText, grammarType);
            grammarWords.push(...complexGrammarWords);
          }

          return grammarWords;
        };

        const grammarWords = extractGrammarWords(examples[0].highlighted || '', grammarType);

        return (
          <div className="space-y-6">
            {/* Original text with CORRECTED highlights */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">FROM YOUR LESSON:</h4>
              <div className="text-xl leading-relaxed border border-gray-200 rounded-lg p-4 bg-gray-50">
                {/* Show the original text but highlight ONLY the grammar words */}
                <p>
                  {examples[0].highlighted?.split('**').map((part, index) => {
                    if (index % 2 === 0) {
                      // This is regular text - check if it contains any grammar words to highlight
                      let processedText = part;
                      grammarWords.forEach(grammarWord => {
                        const regex = new RegExp(`\\b${grammarWord}\\b`, 'gi');
                        processedText = processedText.replace(regex, (match) => 
                          `<span class="bg-yellow-200 font-bold px-1 rounded text-black border-2 border-yellow-400">${match}</span>`
                        );
                      });
                      return <span key={index} dangerouslySetInnerHTML={{ __html: processedText }} />;
                    } else {
                      // This was the old highlighted phrase - now highlight only grammar words within it
                      let processedText = part;
                      grammarWords.forEach(grammarWord => {
                        const regex = new RegExp(`\\b${grammarWord}\\b`, 'gi');
                        processedText = processedText.replace(regex, (match) => 
                          `<span class="bg-yellow-200 font-bold px-1 rounded text-black border-2 border-yellow-400">${match}</span>`
                        );
                      });
                      return <span key={index} dangerouslySetInnerHTML={{ __html: processedText }} />;
                    }
                  })}
                </p>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="flex items-center justify-center">
              <ArrowDown className="h-8 w-8 text-purple-600" />
            </div>

            {/* Show ONLY the actual grammar words */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">THE {grammarType.toUpperCase()} ARE:</h4>
              <div className="flex flex-wrap gap-3 justify-center">
                {grammarWords.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-yellow-200 border-2 border-yellow-400 rounded-lg px-4 py-2"
                  >
                    <span className="text-lg font-bold text-black">{word}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Show count */}
              <div className="text-center mt-3">
                <p className="text-sm text-gray-600">
                  Found {grammarWords.length} {grammarType.toLowerCase()} in this sentence
                </p>
              </div>
            </div>

            {/* Show what they do */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-center">
                <h4 className="text-lg font-bold text-purple-800 mb-2">
                  {grammarType.toUpperCase()} are words that...
                </h4>
                <p className="text-purple-700 text-lg">
                  {examples[0].explanation || `${grammarType} show relationships between words`}
                </p>
              </div>
            </div>
          </div>
        );

      case "categories":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-purple-800 mb-2">
                {grammarType.toUpperCase()} CATEGORIES
              </h4>
              <p className="text-purple-700">Different types and their uses</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <h5 className="font-bold text-blue-800 text-center text-lg mb-2">
                    {category}
                  </h5>
                  {/* You could add examples for each category here if available in data */}
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "practice":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-green-800 mb-2">
                PRACTICE EXAMPLES
              </h4>
              <p className="text-green-700">More examples to practice with</p>
            </div>
            
            <div className="grid gap-3">
              {practiceExamples.slice(0, 8).map((example, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-lg text-gray-800">{example}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Clear Header with Grammar Type */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Target className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-purple-800">{grammarType.toUpperCase()}</h2>
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

      {/* Progress indicator */}
      {contentSteps.length > 1 && (
        <div className="flex justify-center gap-2">
          {contentSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep ? 'bg-purple-600' : 
                index < currentStep ? 'bg-purple-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content Area */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Eye className="h-6 w-6" />
            {contentSteps[currentStep]?.title || 'Grammar Content'}
            {contentSteps.length > 1 && (
              <Badge variant="outline" className="ml-auto">
                {currentStep + 1} of {contentSteps.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="px-6"
          >
            Skip for now
          </Button>
          
          {currentStep === contentSteps.length - 1 ? (
            <Button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700 px-6"
            >
              Got it!
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 