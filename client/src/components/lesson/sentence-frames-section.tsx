import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lightbulb, Copy, Info, Languages, BookOpen, Pencil, AlignJustify, ListTree, Zap, MessageSquareQuote, Target, Shuffle, Play, CheckCircle, AlertCircle, Brain, Palette } from "lucide-react";
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
    // Old structure fallback
    pattern?: string;
    components?: OldStructureComponent[];
    examples?: string[];
  };
}

export function SentenceFramesSection({ section }: SentenceFramesSectionProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  // Debug: Analyze the entire section structure
  console.log("Raw sentence frames section data:");
  analyzeStructure(section);
  
  // Compatibility layer
  let frames: SentenceFramePattern[] = [];
  
  if (section.frames && Array.isArray(section.frames)) {
    // New structure (preferred)
    frames = section.frames;
    console.log("Using new frames structure, found:", frames.length, "frames");
  } else if (section.pattern) {
    // Old structure conversion
    console.log("Converting old structure to new frames format");
    
    // Create a single frame from old structure
    const legacyFrame: SentenceFramePattern = {
      pattern: section.pattern,
      communicativeFunction: section.title || "Express ideas clearly",
      examples: section.examples?.map(example => ({ text: example })) || [],
      components: section.components?.map(comp => ({
        name: comp.componentName,
        description: comp.description,
        examples: comp.examples
      })) || []
    };
    
    frames = [legacyFrame];
  }
  
  // Safety check - if no frames, display a message
  if (frames.length === 0) {
    return (
      <div className="my-8">
        <SectionHeader 
          title="Sentence Frames" 
          description="Help students structure their language with these patterns"
          icon={<AlignJustify className="h-5 w-5" />}
        />
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No sentence frames were found for this lesson. You can create your own frames or regenerate the lesson.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Get the current frame
  const frame = frames[currentFrameIndex];
  
  // Function to navigate between frames
  const navigateFrames = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    } else if (direction === 'prev' && currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };
  
  // Extract examples, converting from new format to simple array if needed
  const examples = frame.examples?.map(ex => typeof ex === 'string' ? ex : ex.text || "") || [];
  
  return (
    <div className="my-8">
      <SectionHeader 
        title="Sentence Frames" 
        description="Help students structure their language with these patterns"
        icon={<AlignJustify className="h-5 w-5" />}
      />
      
      {/* Frame navigation controls if we have multiple frames */}
      {frames.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateFrames('prev')}
            disabled={currentFrameIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Pattern
          </Button>
          
          <span className="text-sm text-gray-500">
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
      
      {/* Tabs for different aspects of the sentence frame */}
      <Tabs defaultValue="pattern" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pattern" className="flex items-center gap-1">
            <ListTree className="h-4 w-4" /> Pattern
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-1">
            <Pencil className="h-4 w-4" /> Examples
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-1">
            <Play className="h-4 w-4" /> Practice
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Content */}
        {/* 1. Sentence Pattern Tab */}
        <TabsContent value="pattern" className="space-y-6">
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <ListTree className="h-5 w-5"/>
                Sentence Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="font-mono p-4 bg-white rounded-lg border border-blue-300 text-gray-900 relative text-xl font-bold shadow-inner">
                {frame.patternTemplate || frame.pattern}
                <button 
                  className="absolute right-2 top-2 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                  onClick={() => navigator.clipboard.writeText(frame.patternTemplate || frame.pattern || "")}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              {/* Show pattern information */}
              <div className="space-y-4">
                {/* Level indicator - could be a string or old enum format */}
                {(frame.level || frame.proficiencyLevel) && (
                  <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${
                      (frame.level === 'advanced' || frame.proficiencyLevel === 'advanced') 
                        ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                        : (frame.level === 'intermediate' || frame.proficiencyLevel === 'intermediate')
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}>
                      {frame.proficiencyLevel || frame.level || 'Basic'} Level
                    </Badge>
                    
                    <span className="text-sm text-gray-500">
                      {frame.proficiencyLevel === 'advanced' || frame.level === 'advanced' 
                        ? 'For advanced students with strong language skills'
                        : frame.proficiencyLevel === 'intermediate' || frame.level === 'intermediate'
                          ? 'For students with developing language proficiency'
                          : 'Suitable for beginners and foundation building'
                      }
                    </span>
                  </div>
                )}
                
                {/* Communicative function */}
                {frame.communicativeFunction && (
                  <div className="text-base text-blue-900 flex items-start gap-2">
                    <Target className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" />
                    <div>
                      <span className="font-semibold">Function:</span> {frame.communicativeFunction}
                    </div>
                  </div>
                )}
                
                {/* Usage description */}
                {(frame.usage || frame.usageNotes) && (
                  <div className="text-base text-blue-900 flex items-start gap-2">
                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" />
                    <div>
                      <span className="font-semibold">Usage:</span> {frame.usageNotes || frame.usage}
                    </div>
                  </div>
                )}
                
                {/* Title/name for the pattern if available */}
                {frame.title && (
                  <div className="text-base text-blue-900 flex items-start gap-2 mt-2">
                    <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" /> 
                    <div className="text-lg">
                      <span className="font-semibold">Title:</span> {frame.title}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {frame.grammarFocus && (Array.isArray(frame.grammarFocus) ? frame.grammarFocus.length > 0 : frame.grammarFocus) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gray-500"/>
                  Grammar Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {Array.isArray(frame.grammarFocus) ? (
                  <ul className="space-y-2">
                    {frame.grammarFocus.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">{frame.grammarFocus}</p>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Components of the sentence pattern - shown if available */}
          {frame.components && frame.components.length > 0 && (
            <Card className="border-green-200 shadow-sm">
              <CardHeader className="bg-green-50 p-4 border-b border-green-200">
                <CardTitle className="text-base font-semibold text-green-800 flex items-center gap-2">
                  <Languages className="h-5 w-5 text-green-700"/>
                  Pattern Components
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Display each component */}
                  {frame.components.map((component, idx) => (
                    <div key={idx} className="border-b border-green-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                      <h3 className="font-medium text-green-800 mb-1 flex items-center gap-1">
                        <Badge className="bg-green-100 text-green-800">Component {idx + 1}</Badge>
                        {component.name}
                      </h3>
                      {component.description && (
                        <p className="text-gray-700 mb-2">{component.description}</p>
                      )}
                      {component.examples && component.examples.length > 0 && (
                        <div className="bg-white p-3 rounded-md border border-green-200">
                          <h4 className="text-sm font-medium text-green-800 mb-1">Examples:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            {component.examples.map((example, exIdx) => (
                              <li key={exIdx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Visual Pattern Builder */}
          {frame.visualStructure && (
            <Card className="border-purple-200 shadow-sm">
              <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
                <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-700"/>
                  Visual Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <pre className="whitespace-pre-wrap font-mono text-gray-800 text-sm">
                    {frame.visualStructure}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Teaching Notes */}
          {frame.teachingNotes && (
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="bg-amber-50 p-4 border-b border-amber-200">
                <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-amber-700"/>
                  Teaching Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-white p-4 rounded-lg border border-amber-200">
                  <p className="text-gray-700">{frame.teachingNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Discussion Prompts */}
          {frame.discussionPrompts && frame.discussionPrompts.length > 0 && (
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
                <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-blue-700"/>
                  Discussion Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {frame.discussionPrompts.map((prompt, idx) => (
                    <li key={idx} className="bg-white p-3 rounded-md border border-blue-200">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700">{prompt}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 3. Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card className="border-amber-200 shadow-sm">
            <CardHeader className="bg-amber-50 p-4 border-b border-amber-200">
              <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Example Sentences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {examples.length > 0 ? (
                <ul className="divide-y divide-amber-100">
                  {examples.map((example, idx) => (
                    <li key={idx} className="p-4 hover:bg-amber-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-100 text-amber-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{example}</p>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
                          onClick={() => navigator.clipboard.writeText(example)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No examples available for this pattern.
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Alternative patterns if available */}
          {frame.alternatives && frame.alternatives.length > 0 && (
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
                <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-blue-700"/>
                  Alternative Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-blue-100">
                  {frame.alternatives.map((alt, idx) => (
                    <li key={idx} className="p-4 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-mono">{alt}</p>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                          onClick={() => navigator.clipboard.writeText(alt)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 3. Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          <ExamplePracticeCard frame={frame} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Example Practice Card Component
function ExamplePracticeCard({ frame }: { frame: SentenceFramePattern }) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Get examples from either format
  const examples = frame.examples?.map(ex => typeof ex === 'string' ? ex : ex.text || "") || [];
  
  // Select a random example if not already selected
  React.useEffect(() => {
    if (!selectedExample && examples.length > 0) {
      const randomIndex = Math.floor(Math.random() * examples.length);
      setSelectedExample(examples[randomIndex]);
    }
  }, [examples, selectedExample]);
  
  // Generate a practice exercise by blanking out parts of the selected example
  const generateExercise = () => {
    if (!selectedExample) return { blankedText: '', answer: '' };
    
    // Simple approach: blank out a random word that's at least 4 characters long
    const words = selectedExample.split(' ');
    const eligibleWords = words.filter(word => word.length >= 4);
    
    if (eligibleWords.length === 0) return { blankedText: selectedExample, answer: '' };
    
    const wordToBlank = eligibleWords[Math.floor(Math.random() * eligibleWords.length)];
    const blankedText = selectedExample.replace(wordToBlank, '_______');
    
    return { blankedText, answer: wordToBlank };
  };
  
  const { blankedText, answer } = generateExercise();
  
  return (
    <Card className="shadow-sm border-amber-200">
      <CardContent className="p-0">
        <div className="bg-amber-50 p-5 border-b border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Practice with Pattern
          </h3>
          
          <p className="text-gray-700 mb-4">
            Use this pattern to practice forming sentences. Try to identify the missing words in the examples.
          </p>
          
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-amber-800">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {!completed ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Fill in the blank:</h4>
                <p className="text-lg mb-4">{blankedText}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      setCompleted(true);
                      setProgress(prev => Math.min(prev + 20, 100));
                    }}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Check Answer
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedExample(null);
                      setCompleted(false);
                    }}
                  >
                    Try Another
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Hint
                </h4>
                <p className="text-gray-700">
                  Look at the pattern structure: <span className="font-mono">{frame.pattern}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-1">
                <CheckCircle className="h-5 w-5" />
                Correct Answer
              </h4>
              <p className="text-lg mb-2">{selectedExample}</p>
              <p className="text-gray-700">The missing word was: <span className="font-medium text-green-800">{answer}</span></p>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => {
                    setSelectedExample(null);
                    setCompleted(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue Practice
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Visual Pattern Builder
function VisualPatternBuilder({ frame }: { frame: SentenceFramePattern }) {
  const [selectedComponents, setSelectedComponents] = useState<{[key: string]: string}>({});
  const [builtSentence, setBuiltSentence] = useState('');
  
  // Create a simplified version of the visual structure if one isn't provided
  const visualStructure = frame.visualStructure ? frame.visualStructure.split('\n') : 
    frame.pattern ? frame.pattern.split(/[_]+/).filter(Boolean).map((part, i, arr) => {
      // If this is the last part, don't add a blank
      if (i === arr.length - 1) return part;
      return `${part} [BLANK ${i+1}]`;
    }) : [];
  
  // Generate component options from the frame components
  const componentOptions = frame.components?.reduce((acc, comp) => {
    if (comp.name && comp.examples && comp.examples.length > 0) {
      acc[comp.name] = comp.examples;
    }
    return acc;
  }, {} as {[key: string]: string[]}) || {};
  
  // Build a sentence when component selections change
  React.useEffect(() => {
    if (Object.keys(selectedComponents).length === 0) return;
    
    let result = frame.pattern || '';
    
    // Replace blanks with selected components
    for (const [componentName, value] of Object.entries(selectedComponents)) {
      // Find the component in the original list to get its position
      const componentIndex = frame.components?.findIndex(c => c.name === componentName) || 0;
      
      // Replace the appropriate blank (assume one blank per component for simplicity)
      const placeholder = `_____`; // 5 underscores typically used as placeholder
      
      // Split by placeholder, replace the nth occurrence
      const parts = result.split(placeholder);
      if (parts.length > componentIndex + 1) {
        parts[componentIndex] = parts[componentIndex] + value;
        result = parts.join(placeholder);
      }
    }
    
    // Remove any remaining blanks
    result = result.replace(/_+/g, '___');
    
    setBuiltSentence(result);
  }, [selectedComponents, frame]);
  
  return (
    <Card className="shadow-sm border-purple-200">
      <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
        <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-700"/>
          Visual Pattern Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {visualStructure.length > 0 ? (
          <>
            <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-4">
              {/* Structure visualization */}
              <div className="font-mono text-sm">
                {visualStructure.map((line, i) => (
                  <div key={i} className="py-1">{line}</div>
                ))}
              </div>
              
              {/* Component selectors */}
              {Object.keys(componentOptions).length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-purple-100">
                  <h3 className="font-medium text-purple-800">Build Your Own Sentence</h3>
                  
                  {Object.entries(componentOptions).map(([componentName, examples], idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 block">
                        {componentName}:
                      </label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        value={selectedComponents[componentName] || ''}
                        onChange={(e) => setSelectedComponents({
                          ...selectedComponents,
                          [componentName]: e.target.value
                        })}
                      >
                        <option value="">Select an option...</option>
                        {examples.map((example, i) => (
                          <option key={i} value={example}>{example}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Built sentence preview */}
            {builtSentence && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Your Sentence:</h3>
                <p className="text-gray-800 font-medium">{builtSentence}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 p-4">
            No visual structure available for this pattern.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Cultural Adaptation Component
function CulturalAdaptation({ frame }: { frame: SentenceFramePattern }) {
  if (!frame.culturalAdaptation) return null;

  return (
    <Card className="border-teal-200 shadow-sm">
      <CardHeader className="bg-teal-50 p-4 border-b border-teal-200">
        <CardTitle className="text-base font-semibold text-teal-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-700"/>
          Cultural Adaptation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="bg-white p-4 rounded-lg border border-teal-200">
          <p className="text-gray-700">{frame.culturalAdaptation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
