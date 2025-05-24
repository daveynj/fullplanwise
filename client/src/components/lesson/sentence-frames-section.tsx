import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ArrowRight, Lightbulb, Copy, Info, Languages, BookOpen, Pencil, AlignJustify, ListTree, Zap, MessageSquareQuote, Target, Shuffle, Play, CheckCircle, AlertCircle, Brain, Palette, Users } from "lucide-react";
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
    topic?: string; // Add topic for scaffolding context
    // Old structure fallback
    pattern?: string;
    components?: OldStructureComponent[];
    examples?: string[];
  };
}



// Enhanced Visual Pattern Builder with fixed color classes
function VisualPatternBuilder({ frame }: { frame: SentenceFramePattern }) {
  const [selectedComponents, setSelectedComponents] = useState<{[key: string]: string}>({});
  const [builtSentence, setBuiltSentence] = useState('');

  const components = frame.structureComponents || [];

  const buildSentence = () => {
    if (!frame.visualStructure) return '';
    
    let sentence = frame.visualStructure.start + ' ';
    frame.visualStructure.parts.forEach((part, index) => {
      if (part.connector) sentence += part.connector + ' ';
      sentence += selectedComponents[part.label] || `[${part.label}]`;
      if (index < frame.visualStructure.parts.length - 1) sentence += ' ';
    });
    sentence += frame.visualStructure.end;
    
    setBuiltSentence(sentence);
  };

  React.useEffect(() => {
    buildSentence();
  }, [selectedComponents]);

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
        <CardTitle className="text-xl font-semibold text-purple-800 flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Sentence Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-3">
          {components.map((component, index) => {
            // Use fixed color classes instead of dynamic ones
            const colorClasses = {
              select: index === 0 ? 'border-blue-300 focus:ring-blue-500 bg-blue-50' :
                      index === 1 ? 'border-green-300 focus:ring-green-500 bg-green-50' :
                      index === 2 ? 'border-purple-300 focus:ring-purple-500 bg-purple-50' :
                      index === 3 ? 'border-orange-300 focus:ring-orange-500 bg-orange-50' :
                      'border-pink-300 focus:ring-pink-500 bg-pink-50',
              label: index === 0 ? 'text-blue-700' :
                     index === 1 ? 'text-green-700' :
                     index === 2 ? 'text-purple-700' :
                     index === 3 ? 'text-orange-700' :
                     'text-pink-700'
            };
            
            return (
              <div key={component.label} className="space-y-2">
                <label className={`text-sm font-medium ${colorClasses.label}`}>
                  {component.label}
                </label>
                <select
                  value={selectedComponents[component.label] || ''}
                  onChange={(e) => setSelectedComponents(prev => ({
                    ...prev,
                    [component.label]: e.target.value
                  }))}
                  className={`w-full p-2 border rounded focus:ring-2 ${colorClasses.select}`}
                >
                  <option value="">Choose {component.label}...</option>
                  {component.examples.map((example, idx) => (
                    <option key={idx} value={example}>{example}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h4 className="text-lg font-semibold text-gray-600 mb-2">Your Sentence:</h4>
          <p className="text-xl font-bold font-mono bg-white p-3 rounded border">
            {builtSentence || 'Select components to build your sentence...'}
          </p>
        </div>

        {Object.keys(selectedComponents).length === components.length && (
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            <Play className="h-4 w-4 mr-2" />
            Practice with This Sentence
          </Button>
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
        <CardTitle className="text-xl font-semibold text-teal-800 flex items-center gap-2">
          <Languages className="h-6 w-6" />
          Cultural Context
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
          <h4 className="text-lg font-semibold text-teal-800 mb-2">Universal Application</h4>
          <p className="text-teal-700 text-xl font-bold">{frame.culturalAdaptation.universalApplication}</p>
        </div>

        {frame.culturalAdaptation.culturalNotes && (
          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <h4 className="text-lg font-semibold text-teal-800 mb-2">Teaching Notes</h4>
            <p className="text-gray-700 text-xl font-bold">{frame.culturalAdaptation.culturalNotes}</p>
          </div>
        )}

        {frame.culturalAdaptation.discussionStarters && frame.culturalAdaptation.discussionStarters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-teal-800">Discussion Starters</h4>
            <ul className="space-y-1">
              {frame.culturalAdaptation.discussionStarters.map((starter, index) => (
                <li key={index} className="flex items-start gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-xl font-bold">{starter}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Error Correction Helper
function ErrorCorrectionHelper({ frame }: { frame: SentenceFramePattern }) {
  if (!frame.errorCorrection?.commonMistakes) return null;

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader className="bg-red-50 p-4 border-b border-red-200">
        <CardTitle className="text-xl font-semibold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Common Mistakes & Corrections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {frame.errorCorrection.commonMistakes.map((mistake, index) => (
          <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-red-600">❌ Incorrect:</span>
                <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-lg font-bold">
                  {mistake.error}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-green-600">✅ Correct:</span>
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-lg font-bold">
                  {mistake.correction}
                </code>
              </div>
              <p className="text-base text-gray-600 pl-4 border-l-2 border-gray-300">
                <strong>Why:</strong> {mistake.explanation}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
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
          color="purple"
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
        color="purple"
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
      
            {/* Updated EnhancedFrameLayout with better Gemini support */}
      <EnhancedFrameLayout frame={frame} section={section} />
    </div>
  );
}

// Updated EnhancedFrameLayout with better Gemini support
function EnhancedFrameLayout({ frame, section }: { frame: SentenceFramePattern, section: SentenceFramesSectionProps['section'] }) {
  // console.log("Rendering EnhancedFrameLayout with frame data:", frame);

  // Map component labels to colors for consistent use
  const colorMap = frame.structureComponents ? 
    frame.structureComponents.reduce((acc, comp) => {
      acc[comp.label] = getComponentColor(comp.label);
      return acc;
    }, {} as Record<string, string>) : {};
    
  // Function to highlight parts of the example sentence safely
  const highlightSentence = (completeSentence: string, breakdown: { [key: string]: string }): React.ReactNode => {
    let highlighted = completeSentence;
    Object.entries(breakdown).forEach(([label, text]) => {
      const color = colorMap[label] || 'gray';
      // Use fixed color classes to avoid dynamic class issues
      const colorClass = color === 'blue' ? 'text-blue-700 bg-blue-100' :
                        color === 'green' ? 'text-green-700 bg-green-100' :
                        color === 'purple' ? 'text-purple-700 bg-purple-100' :
                        color === 'red' ? 'text-red-700 bg-red-100' :
                        color === 'orange' ? 'text-orange-700 bg-orange-100' :
                        'text-gray-700 bg-gray-100';
      
      highlighted = highlighted.replace(
        text,
        `<span class="font-semibold ${colorClass} px-1 py-0.5 rounded">${text}</span>`
      );
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Determine if we're working with Gemini format 
  // (has 'examples' as array of strings, not complex objects)
  const isGeminiFormat = 
    Array.isArray(frame.examples) && 
    frame.examples.length > 0 && 
    typeof frame.examples[0] === 'string';

  // Check if this frame has scaffolding for A1-B1 learners
  const hasScaffolding = frame.lowerLevelScaffolding && (
    frame.lowerLevelScaffolding.sentenceWorkshop?.length ||
    frame.lowerLevelScaffolding.patternTrainer ||
    frame.lowerLevelScaffolding.visualMaps?.length
  );

  return (
    <Tabs defaultValue="pattern" className="w-full">
      {/* Enhanced Tab Triggers */}
      <TabsList className={`grid w-full bg-gray-100 mb-4 p-1 h-auto rounded-lg border border-gray-200 ${
        hasScaffolding ? 'grid-cols-5' : 'grid-cols-4'
      }`}>
        <TabsTrigger value="pattern" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 py-1.5">
          <ListTree className="h-4 w-4 mr-1" />
          Pattern
        </TabsTrigger>
        <TabsTrigger value="structure" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 py-1.5">
          <Brain className="h-4 w-4 mr-1" />
          Structure
        </TabsTrigger>
        <TabsTrigger value="examples" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 py-1.5">
          <Pencil className="h-4 w-4 mr-1" />
          Examples
        </TabsTrigger>
        {hasScaffolding && (
          <TabsTrigger value="scaffold" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-cyan-600 py-1.5">
            <Play className="h-4 w-4 mr-1" />
            A1-B1
          </TabsTrigger>
        )}
        <TabsTrigger value="help" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 py-1.5">
          <Lightbulb className="h-4 w-4 mr-1" />
          Help
        </TabsTrigger>
      </TabsList>

      {/* Tab Content */}
      {/* 1. Sentence Pattern Tab */}
      <TabsContent value="pattern" className="space-y-6">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
            <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <ListTree className="h-6 w-6"/>
              Sentence Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="font-mono p-4 bg-white rounded-lg border border-blue-300 text-gray-900 relative text-2xl font-bold shadow-inner">
              {frame.patternTemplate || frame.pattern}
              <button 
                className="absolute right-2 top-2 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                onClick={() => navigator.clipboard.writeText(frame.patternTemplate || frame.pattern || "")}
                title="Copy Pattern"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <div className="text-blue-900 flex items-start gap-2">
              <Languages className="h-6 w-6 mt-0.5 flex-shrink-0 text-blue-700" /> 
              <div className="text-xl font-bold">
                 <span className="font-semibold">Language Function:</span> {frame.languageFunction || frame.communicativeFunction || "Express ideas effectively"}
              </div>
            </div>
            
            {frame.title && (
              <div className="text-blue-900 flex items-start gap-2 mt-2">
                <Lightbulb className="h-6 w-6 mt-0.5 flex-shrink-0 text-blue-700" /> 
                <div className="text-xl font-bold">
                  <span className="font-semibold">Title:</span> {frame.title}
                </div>
              </div>
            )}
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
            <CardContent className="p-5">
              {Array.isArray(frame.grammarFocus) ? (
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {frame.grammarFocus.map((point, index) => (
                    <li key={index} className="text-base">{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">{frame.grammarFocus}</p>
              )}
            </CardContent>
          </Card>
        )}

        {frame.level && (
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
              <CardTitle className="text-base font-semibold text-blue-700 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500"/>
                Level Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Badge className={`
                ${frame.level === "basic" ? "bg-green-100 text-green-800 border-green-200" :
                  frame.level === "advanced" ? "bg-red-100 text-red-800 border-red-200" :
                  "bg-blue-100 text-blue-800 border-blue-200"}
                px-3 py-1 text-xs font-medium rounded-full`}>
                {typeof frame.level === 'string' ? frame.level.charAt(0).toUpperCase() + frame.level.slice(1) : 'Intermediate'} Level
              </Badge>
            </CardContent>
          </Card>
        )}

        {frame.patternVariations && Object.keys(frame.patternVariations).length > 0 && (
          <Card className="border-purple-200 shadow-sm">
            <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
              <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-purple-600"/>
                Pattern Variations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {frame.patternVariations.negativeForm && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Negative Form:</h4>
                  <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{frame.patternVariations.negativeForm}</p>
                </div>
              )}
              {frame.patternVariations.questionForm && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Question Form:</h4>
                  <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{frame.patternVariations.questionForm}</p>
                </div>
              )}
              {frame.patternVariations.modalForm && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Modal Form:</h4>
                  <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{frame.patternVariations.modalForm}</p>
                </div>
              )}
              {frame.patternVariations.pastForm && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Past Form:</h4>
                  <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{frame.patternVariations.pastForm}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* 2. Structure Breakdown Tab */}
      <TabsContent value="structure" className="space-y-6">
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="bg-green-50 p-4 border-b border-green-200">
            <CardTitle className="text-xl font-semibold text-green-800 flex items-center gap-2">
              <AlignJustify className="h-6 w-6" />
              Structure Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Handle both structured components or simple examples */}
            {frame.structureComponents && frame.structureComponents.length > 0 ? (
              <div className="space-y-4">
                {frame.structureComponents.map((component, idx) => {
                  const color = getComponentColor(component.label);
                  return (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pb-3 border-b border-gray-100">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-white border md:w-1/4 ${
                        color === 'blue' ? 'border-blue-200 text-blue-800' :
                        color === 'green' ? 'border-green-200 text-green-800' :
                        color === 'purple' ? 'border-purple-200 text-purple-800' :
                        color === 'red' ? 'border-red-200 text-red-800' :
                        color === 'orange' ? 'border-orange-200 text-orange-800' :
                        'border-gray-200 text-gray-800'
                      }`}>
                        {component.label}
                      </div>
                      <div className="md:w-3/4">
                        <p className="text-gray-700 text-xl font-bold">{component.description}</p>
                        {component.examples && component.examples.length > 0 && (
                          <div className="mt-1 text-base text-gray-500">
                            <span className="font-medium">Examples: </span>
                            {component.examples.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // For Gemini format which might not have structureComponents
              <div className="flex flex-col gap-4">
                {/* Display a clear explanation about pattern usage */}
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Pattern Usage</h3>
                  <p className="text-gray-700 text-xl font-bold">
                    {frame.usageNotes || `This sentence pattern helps students practice using ${frame.communicativeFunction || 'appropriate language structures'}.`}
                  </p>
                </div>
                
                {/* Show the key elements that can be filled in */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Key Elements</h3>
                  {frame.pattern && (
                    <div className="space-y-3">
                      {/* Extract blanks from pattern for Gemini format */}
                      {frame.pattern.split('_____').length > 1 && (
                        <div>
                          <p className="text-gray-700 mb-2">This pattern has blanks that can be filled with:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {Array.from({ length: frame.pattern.split('_____').length - 1 }, (_, i) => (
                              <li key={i} className="text-green-700">
                                Fill-in-blank {i + 1}: <Badge className="bg-green-100 text-green-800">Noun or noun phrase</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {frame.grammarFocus && (
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-800 mb-2">Grammar Focus</h3>
                    <p className="text-gray-700">{frame.grammarFocus}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Visual Pattern Builder */}
        <VisualPatternBuilder frame={frame} />
        
        {/* Add Cultural Adaptation */}
        <CulturalAdaptation frame={frame} />
      </TabsContent>

      {/* 3. Examples Tab */}
      <TabsContent value="examples" className="space-y-6">
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50 p-4 border-b border-amber-200">
            <CardTitle className="text-xl font-semibold text-amber-800 flex items-center gap-2">
              <Pencil className="h-6 w-6" />
              Example Sentences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {frame.examples && frame.examples.length > 0 && (
              <div className="space-y-4">
                {frame.examples.map((example, idx) => {
                  // Check if this is an enhanced example object or a simple string (Gemini format)
                  if (typeof example === 'string') {
                    // Simple string format (Gemini)
                    return (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-amber-600 font-semibold text-lg">Example {idx + 1}</span>
                          <button 
                            className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
                            onClick={() => navigator.clipboard.writeText(example)}
                            title="Copy Example"
                          >
                            <Copy className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="text-gray-800 text-xl font-bold">{example}</div>
                      </div>
                    );
                  } else if (example.completeSentence) {
                    // Enhanced format with completeSentence
                    return (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-amber-600 font-semibold text-lg">Example {idx + 1}</span>
                          <button 
                            className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
                            onClick={() => navigator.clipboard.writeText(example.completeSentence)}
                            title="Copy Example"
                          >
                            <Copy className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="text-gray-800 text-xl font-bold">
                          {example.breakdown
                            ? highlightSentence(example.completeSentence, example.breakdown)
                            : (example as any).componentBreakdown
                            ? highlightSentence(example.completeSentence, (example as any).componentBreakdown)
                            : example.completeSentence
                          }
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* 4. Scaffolding Tab - NEW (A1-B1 Support) */}
      {hasScaffolding && (
        <TabsContent value="scaffold" className="space-y-6">
          <SentenceFramesScaffolding 
            scaffolding={frame.lowerLevelScaffolding!} 
            topic={section.topic || 'this lesson'}
          />
        </TabsContent>
      )}

      {/* 5. Help Tab - NEW */}
      <TabsContent value="help" className="space-y-6">
        <ErrorCorrectionHelper frame={frame} />
        
        {/* Teaching Notes Card */}
        {(frame.teachingNotes || frame.teachingTips) && (
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50 p-4 border-b border-orange-200">
              <CardTitle className="text-xl font-semibold text-orange-800 flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                Teaching Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {Array.isArray(frame.teachingNotes) ? (
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {frame.teachingNotes.map((note, index) => (
                    <li key={index} className="text-xl font-bold">{note}</li>
                  ))}
                </ul>
              ) : frame.teachingTips ? (
                <p className="text-gray-700 text-xl font-bold">{frame.teachingTips}</p>
              ) : (
                <p className="text-gray-700 text-xl font-bold">{frame.teachingNotes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Discussion Prompts */}
        {frame.discussionPrompts && frame.discussionPrompts.length > 0 && (
          <Card className="border-teal-200 shadow-sm">
            <CardHeader className="bg-teal-50 p-4 border-b border-teal-200">
              <CardTitle className="text-xl font-semibold text-teal-800 flex items-center gap-2">
                <MessageSquareQuote className="h-6 w-6" />
                Discussion Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ul className="space-y-3">
                {frame.discussionPrompts.map((prompt, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 text-xl font-bold">{prompt}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
