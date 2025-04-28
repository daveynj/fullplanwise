import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lightbulb, Copy, Info, Languages, BookOpen, Pencil, AlignJustify, ListTree, Zap, MessageSquareQuote } from "lucide-react";
import { SectionHeader } from "./shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the data structure types
import { 
  SentenceFramePattern, 
  SentenceFrameComponent,
  SentenceFrameExample 
} from '../../../../types/lessonContentTypes';

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
  grammarFocus?: string;
  structureBreakdown: OldStructureComponent[];
  exampleSentences: string[];
  practicePrompt?: string;
  teachingTips?: string;
  interactiveExamples?: any[];
}

interface SentenceFramesSectionProps {
  section: {
    type: string;
    title: string;
    frames: (OldSentenceFrameData | SentenceFramePattern)[];
  } | null;
}

// Type guard to detect new enhanced format
function isEnhancedPattern(frame: any): frame is SentenceFramePattern {
  console.log("Checking enhanced pattern with keys:", Object.keys(frame || {}));
  return (
    typeof frame === 'object' &&
    frame !== null &&
    // Check for basic properties that could be in either format
    ('pattern' in frame) &&
    // Check for enhanced teaching content 
    (
      // Gemini format has 'examples' as an array of strings
      ('examples' in frame && Array.isArray(frame.examples)) ||
      // Check for other enhanced format properties
      ('readingExample' in frame) ||
      ('teachingTips' in frame) ||
      ('communicativeFunction' in frame) ||
      ('grammarFocus' in frame)
    ) &&
    // Explicitly check that it's NOT the legacy format
    !('structureBreakdown' in frame && Array.isArray(frame.structureBreakdown)) &&
    !('exampleSentences' in frame && Array.isArray(frame.exampleSentences))
  );
}

// Type guard for legacy format detection
function isLegacyPattern(frame: any): frame is OldSentenceFrameData {
  return (
    typeof frame === 'object' &&
    frame !== null &&
    ('pattern' in frame) &&
    (('structureBreakdown' in frame && Array.isArray(frame.structureBreakdown)) || 
     ('exampleSentences' in frame && Array.isArray(frame.exampleSentences)))
  );
}

// Helper function to get a consistent color based on component name
function getComponentColor(name: string): string {
  // Simple hash function to consistently map names to colors
  const colorOptions = ['blue', 'green', 'amber', 'purple', 'indigo', 'rose', 'cyan', 'teal'];
  let hash = 0;
  
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % colorOptions.length;
  }
  
  return colorOptions[hash];
}

// Updated EnhancedFrameLayout with better Gemini support
function EnhancedFrameLayout({ frame }: { frame: SentenceFramePattern }) {
  // console.log("Rendering EnhancedFrameLayout with frame data:", frame);

  // Map component labels to colors for consistent use
  const colorMap = frame.structureComponents ? 
    frame.structureComponents.reduce((acc, comp) => {
      acc[comp.label] = getComponentColor(comp.label);
      return acc;
    }, {} as Record<string, string>) : {};
    
  // Function to highlight parts of the example sentence
  const highlightSentence = (completeSentence: string, breakdown: { [key: string]: string }): React.ReactNode => {
    let highlighted = completeSentence;
    Object.entries(breakdown).forEach(([label, text]) => {
      const color = colorMap[label] || 'gray';
      highlighted = highlighted.replace(
        text,
        `<span class="font-semibold text-${color}-700 bg-${color}-100 px-1 py-0.5 rounded">${text}</span>`
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

  return (
    <Tabs defaultValue="pattern" className="w-full">
      {/* Tab Triggers */}
      <TabsList className="grid w-full grid-cols-3 bg-gray-100 mb-4 p-1 h-auto rounded-lg border border-gray-200">
        <TabsTrigger value="pattern" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 py-1.5">Sentence Pattern</TabsTrigger>
        <TabsTrigger value="structure" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 py-1.5">Structure Breakdown</TabsTrigger>
        <TabsTrigger value="examples" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 py-1.5">Examples</TabsTrigger>
      </TabsList>

      {/* Tab Content */}
      {/* 1. Sentence Pattern Tab */}
      <TabsContent value="pattern" className="space-y-6">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
            <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2"><ListTree className="h-5 w-5"/>Sentence Pattern</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="font-mono p-4 bg-white rounded-lg border border-blue-300 text-gray-900 relative text-xl font-bold shadow-inner">
              {frame.patternTemplate || frame.pattern}
              <button 
                className="absolute right-2 top-2 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                onClick={() => navigator.clipboard.writeText(frame.patternTemplate || frame.pattern || "")}
                title="Copy Pattern"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="text-base text-blue-900 flex items-start gap-2">
              <Languages className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" /> 
              <div className="text-lg">
                 <span className="font-semibold">Language Function:</span> {frame.languageFunction || frame.communicativeFunction || "Express ideas effectively"}
              </div>
            </div>
            
            {frame.title && (
              <div className="text-base text-blue-900 flex items-start gap-2 mt-2">
                <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" /> 
                <div className="text-lg">
                  <span className="font-semibold">Title:</span> {frame.title}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {frame.grammarFocus && (Array.isArray(frame.grammarFocus) ? frame.grammarFocus.length > 0 : frame.grammarFocus) && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2"><Zap className="h-5 w-5 text-gray-500"/>Grammar Focus</CardTitle>
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
                <Info className="h-5 w-5 text-blue-500"/>Level Information
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
              <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2"><MessageSquareQuote className="h-5 w-5 text-purple-600"/>Pattern Variations</CardTitle>
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
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* 2. Structure Breakdown Tab */}
      <TabsContent value="structure" className="space-y-6">
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="bg-green-50 p-4 border-b border-green-200">
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2"><AlignJustify className="h-5 w-5" />Structure Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Handle both structured components or simple examples */}
            {frame.structureComponents && frame.structureComponents.length > 0 ? (
              <div className="space-y-4">
                {frame.structureComponents.map((component, idx) => {
                  const color = getComponentColor(component.label);
                  return (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pb-3 border-b border-gray-100">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800 md:w-1/4`}>
                        {component.label}
                      </div>
                      <div className="md:w-3/4">
                        <p className="text-gray-700">{component.description}</p>
                        {component.examples && component.examples.length > 0 && (
                          <div className="mt-1 text-sm text-gray-500">
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
                  <h3 className="font-medium text-green-800 mb-2">Pattern Usage</h3>
                  <p className="text-gray-700">
                    {frame.usageNotes || `This sentence pattern helps students practice using ${frame.communicativeFunction || 'appropriate language structures'}.`}
                  </p>
                </div>
                
                {/* Show the key elements that can be filled in */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">Key Elements</h3>
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
      </TabsContent>

      {/* 3. Examples Tab */}
      <TabsContent value="examples" className="space-y-6">
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50 p-4 border-b border-amber-200">
            <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2"><Pencil className="h-5 w-5" />Example Sentences</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Handle both enhanced example objects and plain example strings (Gemini format) */}
            {Array.isArray(frame.examples) && frame.examples.length > 0 && (
              <div className="space-y-3">
                {frame.examples.map((example, idx) => {
                  // Check if this is an enhanced example object or a simple string (Gemini format)
                  if (typeof example === 'string') {
                    // Gemini format with simple string examples
                    return (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-amber-600 font-medium">Example {idx + 1}</span>
                          <button 
                            className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
                            onClick={() => navigator.clipboard.writeText(example)}
                            title="Copy Example"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-800 text-lg">{example}</p>
                      </div>
                    );
                  } else if (example.completeSentence) {
                    // Enhanced format with completeSentence
                    return (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-amber-600 font-medium">Example {idx + 1}</span>
                          <button 
                            className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
                            onClick={() => navigator.clipboard.writeText(example.completeSentence)}
                            title="Copy Example"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-gray-800 text-lg">
                          {example.componentBreakdown
                            ? highlightSentence(example.completeSentence, example.componentBreakdown)
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

        {/* Teaching Notes Card */}
        {(frame.usageNotes || frame.teachingTips) && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-500"/>Notes & Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {frame.usageNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Usage Notes:</h4>
                  <p className="p-2 bg-white rounded border border-gray-200 text-gray-800">{frame.usageNotes}</p>
                </div>
              )}
              {frame.teachingTips && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Teaching Tips:</h4>
                  <p className="p-2 bg-white rounded border border-gray-200 text-gray-800">{frame.teachingTips}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Component for the OLD Legacy Layout
function OldSentenceFrameLayout({ currentFrame }: { currentFrame: OldSentenceFrameData }) {
  // Get the level for proper display
  const level = currentFrame.level || "intermediate";
  
  return (
    <Card className="shadow-sm border-amber-200">
      <CardContent className="p-0">
        <div className="bg-amber-50 p-5 border-b border-amber-200">
          <div className="mb-4">
            <Badge className={`${
              level === "basic" ? "bg-green-100 text-green-800 border-green-200" :
              level === "advanced" ? "bg-red-100 text-red-800 border-red-200" :
              "bg-blue-100 text-blue-800 border-blue-200"
            } px-3 py-1 text-xs font-medium rounded-full`}>
              {level.charAt(0).toUpperCase() + level.slice(1)} Level
            </Badge>
          </div>
          
          {/* Main Pattern */}
          <div className="font-mono p-4 bg-white rounded-lg border border-amber-300 text-gray-900 text-lg relative shadow-inner mb-4">
            {currentFrame.pattern}
            <button 
              className="absolute right-2 top-2 text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
              onClick={() => navigator.clipboard.writeText(currentFrame.pattern)}
              title="Copy Pattern"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          
          {/* Communicative Function or Usage */}
          {(currentFrame.communicativeFunction || currentFrame.usage) && (
            <div className="flex items-start gap-2.5 mt-4">
              <Languages className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xl font-bold">
                 <span className="font-semibold">Function:</span> {currentFrame.communicativeFunction || currentFrame.usage}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Structure Breakdown */} 
        {currentFrame.structureBreakdown && currentFrame.structureBreakdown.length > 0 && (
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">Sentence Structure Breakdown</h3>
            <div className="space-y-4">
              {currentFrame.structureBreakdown.map((component, index) => (
                <div key={index} 
                    className="p-4 rounded-md border-l-4 border-amber-400 bg-gray-50/80 shadow-sm border border-gray-200">
                  <p className="font-semibold text-lg text-gray-800">{component.componentName}</p>
                  <p className="text-base text-gray-700 mt-1 italic text-xl font-bold">{component.description}</p>
                  {component.examples && component.examples.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-500 mb-1.5">Examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {component.examples.map((ex, exIndex) => (
                          <Badge key={exIndex} variant="secondary" 
                                className="text-sm font-medium border-gray-300 text-gray-800 shadow-sm px-2.5 py-1">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Example Sentences */} 
        {currentFrame.exampleSentences && currentFrame.exampleSentences.length > 0 && (
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5 text-gray-500"/> Example Sentences</h3>
            <ul className="list-disc space-y-2 pl-6 text-gray-800 text-lg">
              {currentFrame.exampleSentences.map((sentence, index) => (
                <li key={index}>{sentence}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Practice Activity */} 
        {currentFrame.practicePrompt && (
          <div className="p-5 bg-green-50/60">
            <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-3 flex items-center gap-2"><Pencil className="h-5 w-5"/> Practice Activity</h3>
            <div className="p-4 bg-white border border-green-200 rounded-lg text-green-900 space-y-3 shadow-sm">
               <p className="text-base font-semibold">Create your own sentence using this pattern:</p>
               <p className="font-mono text-lg bg-green-100 p-3 rounded border border-green-200">{currentFrame.pattern}</p>
               <p className="text-base text-gray-700 mt-1">{currentFrame.practicePrompt}</p>
            </div>
          </div>
        )}

        {/* Section 5: Optional Grammar Focus / Teaching Tips */} 
        {(currentFrame.grammarFocus || currentFrame.teachingTips) && (
          <div className="p-5 text-base space-y-4 bg-gray-50 border-t border-gray-200">
            {currentFrame.grammarFocus && (
              <div className="flex items-start gap-2.5">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                <div className="text-xl font-bold"><strong className="text-gray-800 font-semibold">Grammar Focus:</strong> <span className="text-gray-700">{currentFrame.grammarFocus}</span></div>
              </div>
            )}
            {currentFrame.teachingTips && (
              <div className="flex items-start gap-2.5">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                <div className="text-xl font-bold"><strong className="text-gray-800 font-semibold">Teaching Tips:</strong> <span className="text-gray-700">{currentFrame.teachingTips}</span></div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Overhauled Component 
// Add a utility function to analyze the data structure deeply
function analyzeStructure(data: any, path = 'root'): void {
  console.log(`===== ANALYZING SENTENCE FRAMES DATA STRUCTURE =====`);
  
  // Log basic information about the object
  console.log(`${path} type:`, typeof data);
  if (data === null) {
    console.log(`${path} is null`);
    return;
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      console.log(`${path} is Array with ${data.length} items`);
      if (data.length > 0) {
        // Show the structure of the first item as an example
        console.log(`${path}[0] sample:`, typeof data[0]);
        analyzeStructure(data[0], `${path}[0]`);
      }
    } else {
      // It's an object - log its keys
      const keys = Object.keys(data);
      console.log(`${path} is Object with keys:`, keys);
      
      // For each key, log its type and maybe value
      keys.forEach(key => {
        const value = data[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`${path}.${key} type:`, typeof value, Array.isArray(value) ? `(Array of ${value.length})` : '(Object)');
          
          // For important keys, go deeper
          if (key === 'frames' || key === 'pattern' || key === 'content' || 
              key === 'structureComponents' || key === 'examples') {
            analyzeStructure(value, `${path}.${key}`);
          }
        } else {
          // For primitive values, show the actual value
          console.log(`${path}.${key}:`, typeof value, value);
        }
      });
    }
  } else {
    // It's a primitive value
    console.log(`${path} value:`, data);
  }
}

export function SentenceFramesSection({ section }: SentenceFramesSectionProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  // Debug: Analyze the entire section structure
  console.log("Raw sentence frames section data:");
  analyzeStructure(section);

  // Basic guard clauses
  if (!section || !Array.isArray(section.frames) || section.frames.length === 0) {
    console.error("Invalid sentence frames section structure");
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={AlignJustify}
          title="Sentence Frames"
          description="Learn structural patterns for effective communication"
          color="amber"
        />
        <div className="p-6 text-center bg-amber-50 rounded-lg border border-amber-200">
          <Info className="mx-auto h-12 w-12 text-amber-400 mb-3" />
          <h3 className="text-lg font-medium text-amber-700 mb-2">No Sentence Frames Available</h3>
          <p className="text-amber-600 text-sm max-w-md mx-auto">
            This lesson doesn't include sentence frame data in the expected format.
          </p>
          <div className="mt-4 p-2 border border-amber-200 bg-amber-100 rounded text-sm text-left">
            <p className="font-medium">Debug Information:</p>
            <p>Section type: {typeof section}</p>
            <p>Has frames property: {section && 'frames' in section ? 'Yes' : 'No'}</p>
            <p>Other keys: {section ? Object.keys(section).join(', ') : 'None'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Navigation Handlers
  const handlePrevFrame = () => {
    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextFrame = () => {
    setCurrentFrameIndex(prev => Math.min(section.frames.length - 1, prev + 1));
  };

  // Get the data for the current frame
  const currentFrame = section.frames[currentFrameIndex];
  
  // Check if currentFrame actually exists (robustness)
  if (!currentFrame) {
     console.error("Current frame data is missing or invalid at index:", currentFrameIndex);
     return (
       <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
         <Info className="mx-auto h-12 w-12 text-red-400 mb-3" />
         <h3 className="text-lg font-medium text-red-700 mb-2">Invalid Frame Data</h3>
         <p className="text-red-600 text-sm max-w-md mx-auto">
           The data for the selected sentence frame is missing or incorrectly formatted.
         </p>
       </div>
     );
  }
  
  // Log the current frame to debug
  console.log("Current sentence frame data:", currentFrame);
  
  // Determine which layout to render using the type guard
  const useNewLayout = isEnhancedPattern(currentFrame);
  console.log("Using enhanced layout:", useNewLayout);
  
  const frameTitle = useNewLayout 
    ? (currentFrame as SentenceFramePattern).patternTemplate || (currentFrame as SentenceFramePattern).pattern
    : (currentFrame as OldSentenceFrameData).title || `Sentence Pattern ${currentFrameIndex + 1}`;

  // Rendering Logic
  return (
    <div className="sentence-frames-section space-y-4">
      {/* Section Header with consistent styling */}
      <SectionHeader
        icon={AlignJustify}
        title="Sentence Frames"
        description="Learn structural patterns for effective communication"
        color="amber"
      />
      
      {/* Pattern Navigation & Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-medium text-amber-800">
          {frameTitle}
        </div>
        <div className="flex gap-1">
          <Button 
            variant="outline" size="icon" 
            onClick={handlePrevFrame} 
            disabled={currentFrameIndex === 0}
            aria-label="Previous Pattern"
            className="h-8 w-8 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-md font-medium border border-gray-200">
            Pattern {currentFrameIndex + 1} of {section.frames.length}
          </span>
          <Button 
            variant="outline" size="icon" 
            onClick={handleNextFrame} 
            disabled={currentFrameIndex >= section.frames.length - 1}
            aria-label="Next Pattern"
            className="h-8 w-8 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Conditional Rendering Call */}
      {useNewLayout ? (
        <EnhancedFrameLayout frame={currentFrame as SentenceFramePattern} />
      ) : (
        <OldSentenceFrameLayout currentFrame={currentFrame as OldSentenceFrameData} />
      )}
    </div>
  );
}