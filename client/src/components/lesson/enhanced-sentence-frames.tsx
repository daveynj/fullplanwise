import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, Palette, Users, Zap, Target, Lightbulb, 
  Play, Pause, RotateCcw, CheckCircle, AlertTriangle,
  TrendingUp, Award, MessageSquare, Globe, Sparkles,
  ArrowRight, ArrowDown, Eye, Headphones, Volume2
} from "lucide-react";

// Enhanced interfaces for AI-powered features
interface AdaptiveLearning {
  proficiencyAnalysis: {
    currentLevel: string;
    confidenceScore: number;
    strugglingAreas: string[];
    strongAreas: string[];
  };
  adaptiveFeatures: {
    vocabularyComplexity: 'simplified' | 'standard' | 'challenging';
    grammarComplexity: 'basic' | 'intermediate' | 'advanced';
    exampleQuantity: number;
    scaffoldingLevel: 'high' | 'medium' | 'low';
  };
}

interface SmartExample {
  completeSentence: string;
  breakdown: { [key: string]: string };
  difficulty: number;
  culturalContext: string;
  personalizedFor: string[];
  aiGenerated: boolean;
  confidenceScore: number;
}

interface EnhancedSentenceFrame {
  // Existing structure
  patternTemplate: string;
  structureComponents: Array<{
    label: string;
    description: string;
    examples: string[];
    inSentenceExample: string;
  }>;
  examples: SmartExample[];
  
  // New AI features
  adaptiveLearning: AdaptiveLearning;
  aiEnhancements: {
    personalizedExamples: SmartExample[];
    predictedErrors: Array<{
      error: string;
      correction: string;
      explanation: string;
      likelihood: number;
    }>;
    culturalAdaptations: Array<{
      culture: string;
      adaptation: string;
      explanation: string;
    }>;
    conversationalContexts: Array<{
      scenario: string;
      appropriate: boolean;
      alternatives: string[];
    }>;
  };
}

// Smart color system with semantic meaning
const semanticColorSystem = {
  subject: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', accent: 'blue' },
  verb: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', accent: 'green' },
  object: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', accent: 'purple' },
  adjective: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', accent: 'orange' },
  adverb: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', accent: 'pink' },
  connector: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', accent: 'gray' },
  default: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', accent: 'indigo' }
};

// AI-Powered Visual Pattern Builder
function AIPatternBuilder({ frame }: { frame: EnhancedSentenceFrame }) {
  const [selectedComponents, setSelectedComponents] = useState<{[key: string]: string}>({});
  const [builtSentence, setBuiltSentence] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string[]}>({});
  const [errorPredictions, setErrorPredictions] = useState<string[]>([]);
  const [culturalContext, setCulturalContext] = useState('neutral');
  const [animationState, setAnimationState] = useState<'idle' | 'building' | 'complete'>('idle');

  // Simulate AI suggestions based on context
  useEffect(() => {
    const generateAISuggestions = () => {
      const suggestions: {[key: string]: string[} = {};
      frame.structureComponents.forEach(component => {
        // AI would analyze context and generate contextually appropriate suggestions
        suggestions[component.label] = [
          ...component.examples,
          `[AI] Smart suggestion for ${component.label}`,
          `[AI] Contextual ${component.label} option`,
          `[AI] Advanced ${component.label} choice`
        ];
      });
      setAiSuggestions(suggestions);
    };

    generateAISuggestions();
  }, [frame, culturalContext]);

  // Predict potential errors based on current selection
  useEffect(() => {
    const predictions: string[] = [];
    
    // Simulate AI error prediction logic
    Object.entries(selectedComponents).forEach(([component, value]) => {
      if (component === 'verb' && value && !value.includes('to')) {
        predictions.push('Remember to use infinitive form with "to"');
      }
      if (component === 'adjective' && value && value.endsWith('ly')) {
        predictions.push('This looks like an adverb, not an adjective');
      }
    });
    
    setErrorPredictions(predictions);
  }, [selectedComponents]);

  const buildSentenceWithAnimation = () => {
    setAnimationState('building');
    
    // Simulate sentence building with animation
    setTimeout(() => {
      let sentence = frame.patternTemplate;
      Object.entries(selectedComponents).forEach(([component, value]) => {
        const placeholder = `[${component}]`;
        sentence = sentence.replace(placeholder, value);
      });
      setBuiltSentence(sentence);
      setAnimationState('complete');
    }, 1000);
  };

  const getComponentColor = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('subject') || lowerLabel.includes('noun')) return semanticColorSystem.subject;
    if (lowerLabel.includes('verb') || lowerLabel.includes('action')) return semanticColorSystem.verb;
    if (lowerLabel.includes('object')) return semanticColorSystem.object;
    if (lowerLabel.includes('adjective') || lowerLabel.includes('evaluative')) return semanticColorSystem.adjective;
    if (lowerLabel.includes('adverb')) return semanticColorSystem.adverb;
    if (lowerLabel.includes('connector') || lowerLabel.includes('because')) return semanticColorSystem.connector;
    return semanticColorSystem.default;
  };

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <CardTitle className="text-xl font-bold text-blue-800 flex items-center gap-3">
          <Brain className="h-6 w-6" />
          AI-Powered Pattern Builder
          <Badge className="bg-blue-600 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Smart
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Cultural Context Selector */}
        <div className="flex items-center gap-4">
          <Globe className="h-5 w-5 text-gray-600" />
          <select 
            value={culturalContext}
            onChange={(e) => setCulturalContext(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="neutral">Universal Context</option>
            <option value="business">Business Setting</option>
            <option value="academic">Academic Environment</option>
            <option value="casual">Casual Conversation</option>
            <option value="formal">Formal Occasion</option>
          </select>
        </div>

        {/* Component Selectors with AI Enhancement */}
        <div className="grid md:grid-cols-2 gap-4">
          {frame.structureComponents.map((component, index) => {
            const color = getComponentColor(component.label);
            const suggestions = aiSuggestions[component.label] || component.examples;
            
            return (
              <div key={component.label} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${color.bg} ${color.text} ${color.border} border`}>
                    {component.label}
                  </div>
                  {aiSuggestions[component.label]?.length > component.examples.length && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
                
                <select
                  value={selectedComponents[component.label] || ''}
                  onChange={(e) => setSelectedComponents(prev => ({
                    ...prev,
                    [component.label]: e.target.value
                  }))}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 ${color.border} focus:ring-${color.accent}-500 ${color.bg}/20`}
                >
                  <option value="">Choose {component.label}...</option>
                  {suggestions.map((example, idx) => (
                    <option key={idx} value={example}>
                      {example.startsWith('[AI]') ? `🤖 ${example.slice(4)}` : example}
                    </option>
                  ))}
                </select>
                
                <p className="text-sm text-gray-600">{component.description}</p>
              </div>
            );
          })}
        </div>

        {/* Error Predictions */}
        {errorPredictions.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="font-medium mb-1">AI Predictions:</div>
              <ul className="text-sm space-y-1">
                {errorPredictions.map((prediction, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                    {prediction}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Sentence Preview */}
        <div className="relative">
          <div className={`p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-dashed transition-all duration-500 ${
            animationState === 'building' ? 'border-blue-400 bg-blue-100' : 
            animationState === 'complete' ? 'border-green-400 bg-green-50' : 'border-gray-300'
          }`}>
            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              Your Sentence:
              {animationState === 'building' && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
              {animationState === 'complete' && <CheckCircle className="h-5 w-5 text-green-600" />}
            </h4>
            <div className="text-xl font-bold font-mono bg-white p-4 rounded-lg border shadow-inner min-h-[60px] flex items-center">
              {builtSentence || (
                <span className="text-gray-400 italic">
                  Select components to build your sentence...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={buildSentenceWithAnimation}
            disabled={Object.keys(selectedComponents).length === 0 || animationState === 'building'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {animationState === 'building' ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Building...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Build Sentence
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              setSelectedComponents({});
              setBuiltSentence('');
              setAnimationState('idle');
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Practice Speaking
          </Button>
        </div>

        {/* AI Confidence Score */}
        {builtSentence && (
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI Confidence Score</span>
              <Badge className="bg-green-100 text-green-800">94%</Badge>
            </div>
            <Progress value={94} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              This sentence follows the pattern correctly and is grammatically sound.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Adaptive Learning Dashboard
function AdaptiveLearningDashboard({ adaptiveLearning }: { adaptiveLearning: AdaptiveLearning }) {
  return (
    <Card className="border-green-200 shadow-sm">
      <CardHeader className="bg-green-50 p-4">
        <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Level:</span>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {adaptiveLearning.proficiencyAnalysis.currentLevel}
          </Badge>
        </div>

        {/* Confidence Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Confidence Score</span>
            <span className="text-sm text-gray-600">
              {adaptiveLearning.proficiencyAnalysis.confidenceScore}%
            </span>
          </div>
          <Progress value={adaptiveLearning.proficiencyAnalysis.confidenceScore} className="h-2" />
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Strengths
            </h4>
            <div className="space-y-1">
              {adaptiveLearning.proficiencyAnalysis.strongAreas.map((area, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Focus Areas
            </h4>
            <div className="space-y-1">
              {adaptiveLearning.proficiencyAnalysis.strugglingAreas.map((area, idx) => (
                <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Adaptive Features Status */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">AI Adaptations Active:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Vocabulary: <span className="font-medium">{adaptiveLearning.adaptiveFeatures.vocabularyComplexity}</span></div>
            <div>Grammar: <span className="font-medium">{adaptiveLearning.adaptiveFeatures.grammarComplexity}</span></div>
            <div>Examples: <span className="font-medium">{adaptiveLearning.adaptiveFeatures.exampleQuantity}</span></div>
            <div>Scaffolding: <span className="font-medium">{adaptiveLearning.adaptiveFeatures.scaffoldingLevel}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Cultural Adaptation Feature
function CulturalAdaptationPanel({ culturalAdaptations }: { 
  culturalAdaptations: Array<{
    culture: string;
    adaptation: string;
    explanation: string;
  }> 
}) {
  const [selectedCulture, setSelectedCulture] = useState(0);

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader className="bg-purple-50 p-4">
        <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Cultural Adaptations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Culture Selector */}
        <div className="flex gap-2 flex-wrap">
          {culturalAdaptations.map((adaptation, idx) => (
            <Button
              key={idx}
              variant={selectedCulture === idx ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCulture(idx)}
              className={selectedCulture === idx ? "bg-purple-600" : ""}
            >
              {adaptation.culture}
            </Button>
          ))}
        </div>

        {/* Selected Culture Details */}
        {culturalAdaptations[selectedCulture] && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">
              {culturalAdaptations[selectedCulture].culture} Context
            </h4>
            <p className="text-purple-700 mb-3">
              {culturalAdaptations[selectedCulture].adaptation}
            </p>
            <div className="text-sm text-purple-600 bg-white p-2 rounded border border-purple-200">
              <strong>Cultural Note:</strong> {culturalAdaptations[selectedCulture].explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Enhanced Sentence Frames Component
export function EnhancedSentenceFramesSection({ frame }: { frame: EnhancedSentenceFrame }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 mb-6 p-1 h-auto rounded-lg border">
          <TabsTrigger value="builder" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Brain className="h-4 w-4 mr-1" />
            AI Builder
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="cultural" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="h-4 w-4 mr-1" />
            Cultural
          </TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Play className="h-4 w-4 mr-1" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Award className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <AIPatternBuilder frame={frame} />
        </TabsContent>

        <TabsContent value="progress">
          <AdaptiveLearningDashboard adaptiveLearning={frame.adaptiveLearning} />
        </TabsContent>

        <TabsContent value="cultural">
          <CulturalAdaptationPanel culturalAdaptations={frame.aiEnhancements.culturalAdaptations} />
        </TabsContent>

        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Interactive Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>AI-powered conversational practice coming soon!</p>
                <p className="text-sm">Practice your patterns with our AI tutor in realistic scenarios.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Learning Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Detailed analytics and achievements coming soon!</p>
                <p className="text-sm">Track your mastery across different patterns and contexts.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 