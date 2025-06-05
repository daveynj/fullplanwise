import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ArrowRight, Lightbulb, Copy, Info, Languages, BookOpen, Pencil, AlignJustify, ListTree, Zap, MessageSquareQuote, Target, Shuffle, Play, CheckCircle, AlertCircle, Brain, Palette, Users, Volume2, Eye, MessageCircle, Sparkles, Heart, Globe } from "lucide-react";
import { SectionHeader } from "./shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import the data structure types
import { 
  SentenceFramePattern, 
  SentenceFrameComponent,
  SentenceFrameExample 
} from '../../../types/lessonContentTypes';

// Import the scaffolding component
import { SentenceFramesScaffolding } from './sentence-frames-scaffolding';

// Define the OLD data structures (for backward compatibility)
interface OldStructureComponent {
  componentName: string;
  description: string;
  examples: string[];
}

interface OldSentenceFrameData {
  pattern: string;
  level?: "basic" | "intermediate" | "advanced";
  title?: string;
  usage?: string;
  communicativeFunction?: string;
  components?: OldStructureComponent[];
  examples?: string[];
  alternatives?: string[];
  teachingNotes?: string;
  visualStructure?: string;
}

// Helper function to get component color safely
function getComponentColor(label: string): string {
  const colorMap: { [key: string]: string } = {
    'Evaluative Adjective': 'blue',
    'Infinitive Action': 'green', 
    'Reason Clause': 'purple',
    'Subject': 'red',
    'Verb': 'orange',
    'Object': 'yellow',
    'default': 'gray'
  };
  return colorMap[label] || colorMap.default;
}

// Helper function to analyze structure
function analyzeStructure(obj: any) {
  if (!obj) {
    console.log("Object is null or undefined");
    return;
  }
  
  console.log("Object type:", typeof obj);
  if (Array.isArray(obj)) {
    console.log("Array length:", obj.length);
    if (obj.length > 0) {
      console.log("First item:", obj[0]);
    }
  } else if (typeof obj === 'object') {
    console.log("Keys:", Object.keys(obj));
    
    // Log specific fields we're looking for
    console.log("Has 'frames':", obj.hasOwnProperty('frames'));
    console.log("Has 'title':", obj.hasOwnProperty('title'));
    console.log("Has 'pattern':", obj.hasOwnProperty('pattern'));
  }
}

interface SentenceFramesSectionProps {
  section: {
    title?: string;
    frames?: SentenceFramePattern[];
    description?: string;
    topic?: string;
    introduction?: string;
    // Old structure fallback
    pattern?: string;
    components?: OldStructureComponent[];
    examples?: string[];
  };
}

// Step 1: Natural Examples Display
function NaturalExamplesStep({ frame, onNext }: { frame: SentenceFramePattern; onNext: () => void }) {
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);

  const playAudio = (index: number, text: string) => {
    setPlayingAudio(index);
    // Use Web Speech API if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.onend = () => setPlayingAudio(null);
      speechSynthesis.speak(utterance);
    } else {
      // Fallback - just show visual feedback
      setTimeout(() => setPlayingAudio(null), 2000);
    }
  };

  const getExampleText = (example: any): string => {
    if (typeof example === 'string') {
      return example;
    }
    if (example && typeof example === 'object' && example.completeSentence) {
      return example.completeSentence;
    }
    return '';
  };

  const examples = frame.examples || [];
  const displayExamples = examples.slice(0, 3); // Show max 3 examples



  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-200">
        <CardTitle className="text-2xl font-bold text-blue-800 flex items-center gap-3">
          <MessageCircle className="h-8 w-8" />
          Listen & Learn: {frame.title || frame.languageFunction || 'Communication Pattern'}
        </CardTitle>
        <p className="text-blue-600 text-lg mt-2">
          {frame.languageFunction ? `How to: ${frame.languageFunction}` : 'See how this pattern works in natural conversation'}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {displayExamples.length > 0 ? (
          <div className="space-y-4">
            {displayExamples.map((example, index) => {
              const exampleText = getExampleText(example);
              return exampleText ? (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <button
                    onClick={() => playAudio(index, exampleText)}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      playingAudio === index 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                    title="Listen to pronunciation"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                  <p className="text-lg text-gray-800 flex-1 font-medium leading-relaxed">
                    "{exampleText}"
                  </p>
                </div>
              ) : null;
            })}
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border">
              <Info className="h-4 w-4 inline mr-2" />
              Click any sentence to hear natural pronunciation
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No examples available for this pattern</p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button 
            onClick={onNext}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
          >
            I understand these examples
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2: Pattern Discovery
function PatternDiscoveryStep({ frame, onNext, onShowPattern }: { 
  frame: SentenceFramePattern; 
  onNext: () => void; 
  onShowPattern: () => void; 
}) {
  const highlightPattern = (text: string, breakdown?: { [key: string]: string }) => {
    if (!breakdown || typeof text !== 'string') {
      return text;
    }

    let highlighted = text;
    const colors = ['bg-red-100 text-red-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700'];
    let colorIndex = 0;

    Object.entries(breakdown).forEach(([label, value]) => {
      if (highlighted.includes(value)) {
        const colorClass = colors[colorIndex % colors.length];
        highlighted = highlighted.replace(
          value,
          `<span class="font-semibold ${colorClass} px-2 py-1 rounded">${value}</span>`
        );
        colorIndex++;
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const getExampleWithBreakdown = (example: any) => {
    if (typeof example === 'string') {
      return { text: example, breakdown: null };
    }
    if (example && typeof example === 'object') {
      return {
        text: example.completeSentence || '',
        breakdown: example.breakdown || null
      };
    }
    return { text: '', breakdown: null };
  };

  const examples = frame.examples || [];
  const displayExamples = examples.slice(0, 3).map(getExampleWithBreakdown).filter(ex => ex.text);

  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
        <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-3">
          <Eye className="h-8 w-8" />
          Can You See the Pattern?
        </CardTitle>
        <p className="text-green-600 text-lg mt-2">
          Look carefully at these sentences - what do they have in common?
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {displayExamples.length > 0 ? (
          <div className="space-y-4">
            {displayExamples.map((example, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 text-lg">
                {highlightPattern(example.text, example.breakdown)}
              </div>
            ))}
            
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <Lightbulb className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-800 mb-4">
                What's the same in all these sentences?
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={onNext}
                  variant="outline"
                  size="lg"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  I see the pattern
                  <CheckCircle className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  onClick={onShowPattern}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Show me the pattern
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No examples available to analyze</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Step 3: Pattern Explanation
function PatternExplanationStep({ frame, onNext }: { frame: SentenceFramePattern; onNext: () => void }) {
  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-purple-200">
        <CardTitle className="text-2xl font-bold text-purple-800 flex items-center gap-3">
          <Sparkles className="h-8 w-8" />
          You Found It! Here's the Pattern:
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center p-6 bg-white rounded-lg border-2 border-purple-300 shadow-inner">
          <p className="text-3xl font-bold font-mono text-purple-800 mb-2">
            {frame.patternTemplate || 'Pattern template not available'}
          </p>
          <button 
            className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-100"
            onClick={() => navigator.clipboard.writeText(frame.patternTemplate || "")}
            title="Copy Pattern"
          >
            <Copy className="h-5 w-5 inline mr-2" />
            Copy this pattern
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 p-4">
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                <Target className="h-6 w-6" />
                When to use this:
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-lg text-blue-700 font-medium">
                {frame.languageFunction || 'Express your ideas effectively'}
              </p>
              {frame.grammarFocus && Array.isArray(frame.grammarFocus) && frame.grammarFocus.length > 0 && (
                <ul className="mt-3 space-y-1 text-blue-600">
                  {frame.grammarFocus.slice(0, 3).map((point, index) => (
                    <li key={index} className="text-sm">• {point}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {frame.culturalAdaptation?.universalApplication && (
            <Card className="border-teal-200">
              <CardHeader className="bg-teal-50 p-4">
                <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  Culture Note:
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-lg text-teal-700">
                  {frame.culturalAdaptation.universalApplication}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={onNext}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold"
          >
            Let me try it
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Guided Practice
function GuidedPracticeStep({ frame, onNext }: { frame: SentenceFramePattern; onNext: () => void }) {
  const [selectedComponents, setSelectedComponents] = useState<{[key: string]: string}>({});
  const [previewSentence, setPreviewSentence] = useState('');

  const components = frame.structureComponents || [];

  React.useEffect(() => {
    // Build preview sentence
    let preview = frame.patternTemplate || '';
    components.forEach((component) => {
      const selected = selectedComponents[component.label];
      if (selected) {
        // Replace blanks with selected values
        preview = preview.replace(/_{3,}/, selected);
      }
    });
    setPreviewSentence(preview);
  }, [selectedComponents, frame.patternTemplate, components]);

  const allComponentsSelected = components.length > 0 && components.every(comp => selectedComponents[comp.label]);

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b border-orange-200">
        <CardTitle className="text-2xl font-bold text-orange-800 flex items-center gap-3">
          <Brain className="h-8 w-8" />
          Build Your Sentence
        </CardTitle>
        <p className="text-orange-600 text-lg mt-2">
          Choose the parts step by step to create your own sentence
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {components.length > 0 ? (
          <div className="space-y-4">
            {components.map((component, index) => {
              const colorClasses = [
                'border-blue-300 focus:ring-blue-500 bg-blue-50',
                'border-green-300 focus:ring-green-500 bg-green-50',
                'border-purple-300 focus:ring-purple-500 bg-purple-50',
                'border-red-300 focus:ring-red-500 bg-red-50',
                'border-orange-300 focus:ring-orange-500 bg-orange-50'
              ];
              
              const labelColors = [
                'text-blue-700',
                'text-green-700', 
                'text-purple-700',
                'text-red-700',
                'text-orange-700'
              ];

              return (
                <div key={component.label} className="space-y-2">
                  <label className={`text-lg font-semibold ${labelColors[index % labelColors.length]}`}>
                    Step {index + 1}: Choose {component.label}
                  </label>
                  {component.description && (
                    <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                  )}
                  <select
                    value={selectedComponents[component.label] || ''}
                    onChange={(e) => setSelectedComponents(prev => ({
                      ...prev,
                      [component.label]: e.target.value
                    }))}
                    className={`w-full p-3 border rounded-lg focus:ring-2 text-lg ${colorClasses[index % colorClasses.length]}`}
                  >
                    <option value="">Select {component.label}...</option>
                    {component.examples && component.examples.map((example, idx) => (
                      <option key={idx} value={example}>{example}</option>
                    ))}
                    <option value="__custom__">Other (I'll tell my tutor)...</option>
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Pattern components not available</p>
          </div>
        )}

        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Your Sentence:
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-4 bg-white rounded-lg border border-orange-200 font-mono text-xl font-bold text-gray-800 min-h-[60px] flex items-center">
              {previewSentence || 'Make your selections above...'}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center pt-4">
          <Button 
            onClick={onNext}
            disabled={!allComponentsSelected}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-8 py-3 text-lg font-semibold"
          >
            This looks good
            <CheckCircle className="h-5 w-5 ml-2" />
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => setSelectedComponents({})}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Let me change it
            <Shuffle className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5: Success & Extension
function SuccessStep({ frame, selectedSentence, onReset, onAdvanced }: { 
  frame: SentenceFramePattern; 
  selectedSentence: string;
  onReset: () => void;
  onAdvanced: () => void;
}) {
  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
        <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-3">
          <CheckCircle className="h-8 w-8" />
          Great Sentence!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="p-6 bg-white rounded-lg border-2 border-green-300 shadow-inner">
          <p className="text-lg text-gray-600 mb-2">Your sentence:</p>
          <p className="text-2xl font-bold text-green-800 mb-4">"{selectedSentence}"</p>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Perfect! This is natural English.</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Ready for More?
          </h3>
          <div className="grid gap-3">
            <Button 
              onClick={onReset}
              variant="outline"
              size="lg"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Make another sentence
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            {frame.patternVariations && Object.keys(frame.patternVariations).length > 0 && (
              <Button 
                onClick={onAdvanced}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try the advanced version
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {frame.teachingNotes && frame.teachingNotes.length > 0 && (
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50 p-4">
              <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Discussion Starter:
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-lg text-purple-700">
                Think about your real relationships - what would you say using this pattern?
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

// Advanced Features (Pattern Variations)
function AdvancedFeaturesStep({ frame, onBack }: { frame: SentenceFramePattern; onBack: () => void }) {
  return (
    <Card className="border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-indigo-200">
        <CardTitle className="text-2xl font-bold text-indigo-800 flex items-center gap-3">
          <Sparkles className="h-8 w-8" />
          Advanced Practice
        </CardTitle>
        <p className="text-indigo-600 text-lg mt-2">
          Ready to explore more ways to use this pattern?
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {frame.patternVariations && Object.keys(frame.patternVariations).length > 0 ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-indigo-800 mb-4">Try these variations:</p>
            
            {frame.patternVariations.negativeForm && (
              <Card className="border-red-200">
                <CardHeader className="bg-red-50 p-3">
                  <h4 className="font-semibold text-red-800">Negative Form:</h4>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="font-mono text-lg bg-white p-3 rounded border text-red-700">
                    {frame.patternVariations.negativeForm}
                  </p>
                </CardContent>
              </Card>
            )}

            {frame.patternVariations.questionForm && (
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50 p-3">
                  <h4 className="font-semibold text-blue-800">Question Form:</h4>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="font-mono text-lg bg-white p-3 rounded border text-blue-700">
                    {frame.patternVariations.questionForm}
                  </p>
                </CardContent>
              </Card>
            )}

            {frame.patternVariations.modalForm && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50 p-3">
                  <h4 className="font-semibold text-green-800">Modal Form:</h4>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="font-mono text-lg bg-white p-3 rounded border text-green-700">
                    {frame.patternVariations.modalForm}
                  </p>
                </CardContent>
              </Card>
            )}

            {frame.patternVariations.pastForm && (
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50 p-3">
                  <h4 className="font-semibold text-purple-800">Past Form:</h4>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="font-mono text-lg bg-white p-3 rounded border text-purple-700">
                    {frame.patternVariations.pastForm}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No advanced variations available</p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to main practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component with step management
export function SentenceFramesSection({ section }: SentenceFramesSectionProps) {
  const [currentStep, setCurrentStep] = useState<'examples' | 'discovery' | 'explanation' | 'practice' | 'success' | 'advanced'>('examples');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [builtSentence, setBuiltSentence] = useState('');



  // Extract frames from section
  let frames: SentenceFramePattern[] = [];
  
  if (section.frames && Array.isArray(section.frames)) {
    frames = section.frames as SentenceFramePattern[];
  } else if (section.pattern) {
    // Legacy fallback for old structure
    const legacyFrame: SentenceFramePattern = {
      patternTemplate: section.pattern,
      languageFunction: section.title || "Express ideas clearly",
      examples: section.examples?.map(example => (typeof example === 'string' ? example : example.text || "")) || [],
      structureComponents: section.components?.map(comp => ({
        label: comp.componentName || "Component",
        description: comp.description || "",
        examples: comp.examples || [],
        inSentenceExample: ""
      })) || [],
      grammarFocus: []
    };
    frames = [legacyFrame];
  }

  // Safety check - if no frames, display a message
  if (frames.length === 0) {
    return (
      <div className="my-8">
        <SectionHeader 
          title={section.title || "Sentence Frames"} 
          description={section.introduction || section.description || "Help students structure their language with these patterns"}
          icon={<MessageCircle className="h-5 w-5" />}
          color="purple"
        />
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No sentence frames were found for this lesson. The content may still be generating.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const frame = frames[currentFrameIndex];

  const resetToBeginning = () => {
    setCurrentStep('examples');
    setBuiltSentence('');
  };

  const navigateFrames = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
      resetToBeginning();
    } else if (direction === 'prev' && currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
      resetToBeginning();
    }
  };

  return (
    <div className="my-8">
      <SectionHeader 
        title={section.title || "Sentence Frames"} 
        description={section.introduction || section.description || "Help students structure their language with these patterns"}
        icon={<MessageCircle className="h-5 w-5" />}
        color="purple"
      />
      
      {/* Frame navigation controls if we have multiple frames */}
      {frames.length > 1 && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateFrames('prev')}
            disabled={currentFrameIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Pattern
          </Button>
          
          <span className="text-sm font-medium text-gray-600">
            Pattern {currentFrameIndex + 1} of {frames.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateFrames('next')}
            disabled={currentFrameIndex === frames.length - 1}
            className="flex items-center gap-1"
          >
            Next Pattern <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step-based content */}
      {currentStep === 'examples' && (
        <NaturalExamplesStep 
          frame={frame} 
          onNext={() => setCurrentStep('discovery')} 
        />
      )}

      {currentStep === 'discovery' && (
        <PatternDiscoveryStep 
          frame={frame} 
          onNext={() => setCurrentStep('explanation')} 
          onShowPattern={() => setCurrentStep('explanation')}
        />
      )}

      {currentStep === 'explanation' && (
        <PatternExplanationStep 
          frame={frame} 
          onNext={() => setCurrentStep('practice')} 
        />
      )}

      {currentStep === 'practice' && (
        <GuidedPracticeStep 
          frame={frame} 
          onNext={() => {
            setBuiltSentence('Custom sentence built'); // Placeholder
            setCurrentStep('success');
          }} 
        />
      )}

      {currentStep === 'success' && (
        <SuccessStep 
          frame={frame} 
          selectedSentence={builtSentence}
          onReset={resetToBeginning}
          onAdvanced={() => setCurrentStep('advanced')}
        />
      )}

      {currentStep === 'advanced' && (
        <AdvancedFeaturesStep 
          frame={frame} 
          onBack={() => setCurrentStep('success')}
        />
      )}
    </div>
  );
}
