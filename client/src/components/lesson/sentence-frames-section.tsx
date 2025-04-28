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

// Type guard to determine if frame is in new format
function isNewSentenceFramePattern(frame: any): frame is SentenceFramePattern {
  return (
    typeof frame === 'object' &&
    frame !== null &&
    'patternTemplate' in frame &&
    'structureComponents' in frame &&
    'examples' in frame &&
    Array.isArray(frame.examples) &&
    frame.examples.length > 0 &&
    'completeSentence' in frame.examples[0]
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

// Component for the NEW Enhanced Layout
function NewSentenceFrameLayout({ currentFrame }: { currentFrame: SentenceFramePattern }) {
  // Map component labels to colors for consistent use
  const colorMap = currentFrame.structureComponents.reduce((acc, comp) => {
    acc[comp.label] = getComponentColor(comp.label);
    return acc;
  }, {} as Record<string, string>); 

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
              {currentFrame.patternTemplate}
              <button 
                className="absolute right-2 top-2 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                onClick={() => navigator.clipboard.writeText(currentFrame.patternTemplate)}
                title="Copy Pattern"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="text-base text-blue-900 flex items-start gap-2">
              <Languages className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" /> 
              <div className="text-xl font-bold">
                 <span className="font-semibold">Language Function:</span> {currentFrame.languageFunction}
              </div>
            </div>
          </CardContent>
        </Card>

        {currentFrame.grammarFocus && currentFrame.grammarFocus.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2"><Zap className="h-5 w-5 text-gray-500"/>Grammar Focus</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <ul className="list-disc space-y-2 pl-5 text-gray-700">
                        {currentFrame.grammarFocus.map((point, index) => (
                            <li key={index} className="text-base">{point}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}

        {currentFrame.patternVariations && Object.keys(currentFrame.patternVariations).length > 0 && (
            <Card className="border-purple-200 shadow-sm">
                <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
                    <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2"><MessageSquareQuote className="h-5 w-5 text-purple-600"/>Pattern Variations</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                    {currentFrame.patternVariations.negativeForm && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">Negative Form:</h4>
                            <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{currentFrame.patternVariations.negativeForm}</p>
                        </div>
                    )}
                    {currentFrame.patternVariations.questionForm && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">Question Form:</h4>
                            <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{currentFrame.patternVariations.questionForm}</p>
                        </div>
                    )}
                    {currentFrame.patternVariations.modalForm && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">Modal Form:</h4>
                            <p className="font-mono p-2 bg-white rounded border border-gray-200 text-gray-900">{currentFrame.patternVariations.modalForm}</p>
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
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2"><ListTree className="h-5 w-5"/>Structure Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
             {currentFrame.structureComponents.map((component, index) => {
                const color = colorMap[component.label] || 'gray';
                const borderColor = `border-${color}-400`;
                const bgColor = `bg-${color}-50/60`;
                const textColor = `text-${color}-800`;
                const badgeBgColor = `bg-${color}-100`;
                const badgeTextColor = `text-${color}-800`;
                const badgeBorderColor = `border-${color}-300`;
                
                return (
                  <div key={index} 
                      className={`p-4 rounded-md border-l-4 ${borderColor} ${bgColor} shadow-sm border border-gray-200`}>
                    <h4 className={`font-semibold text-lg ${textColor}`}>{component.label}</h4>
                    <p className="text-base text-gray-700 mt-1 italic text-xl font-bold">{component.description}</p>
                    {component.examples && component.examples.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-500 mb-1.5">Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {component.examples.map((ex, exIndex) => (
                            <Badge key={exIndex} 
                                  className={`font-medium ${badgeBgColor} ${badgeTextColor} ${badgeBorderColor} border shadow-sm px-2.5 py-1 text-xl font-bold`}>
                              {ex}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
          
          {/* Visual Structure Diagram */}
          {currentFrame.visualStructure && (
            <Card className="border-green-200 shadow-sm">
              <CardHeader className="bg-green-50 p-4 border-b border-green-200">
                <CardTitle className="text-base font-semibold text-green-800 flex items-center gap-2">Visual Structure</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-center space-x-2 py-6">
                  <span className="text-gray-800 font-medium px-2">{currentFrame.visualStructure.start}</span>
                  
                  {currentFrame.visualStructure.parts.map((part, index) => {
                    const color = colorMap[part.label] || 'blue';
                    return (
                      <React.Fragment key={index}>
                        <div className={`px-4 py-2 rounded-md bg-${color}-100 border border-${color}-300 text-${color}-800 font-medium flex items-center`}>
                          {part.label}
                        </div>
                        {part.connector && (
                          <span className="text-gray-600 font-medium px-1">{part.connector}</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  <span className="text-gray-800 font-medium px-2">{currentFrame.visualStructure.end}</span>
                </div>
              </CardContent>
            </Card>
          )}
      </TabsContent>

      {/* 3. Examples Tab */}
      <TabsContent value="examples" className="space-y-6">
          <Card className="border-amber-200 shadow-sm">
              <CardHeader className="bg-amber-50 p-4 border-b border-amber-200">
                <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2"><ListTree className="h-5 w-5"/>Example Sentences</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {currentFrame.examples.map((example, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
                    <p className="font-medium text-lg text-gray-800 mb-3">{example.completeSentence}</p>
                    
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Breakdown:</h4>
                    <div className="space-y-1.5 ml-2">
                      {Object.entries(example.breakdown).map(([label, value], idx) => {
                        const color = colorMap[label] || 'gray';
                        return (
                          <div key={idx} className="flex gap-2">
                            <span className={`text-sm font-semibold text-${color}-700 min-w-20`}>{label}:</span>
                            <span className={`text-sm bg-${color}-50 px-1.5 py-0.5 rounded text-${color}-800`}>{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
          </Card>

          {/* Discussion Prompts */}
          {currentFrame.discussionPrompts && currentFrame.discussionPrompts.length > 0 && (
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50 p-4 border-b border-blue-200">
                <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">Discussion Prompts</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {currentFrame.discussionPrompts.map((prompt, index) => (
                    <li key={index} className="text-base">{prompt}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Teaching Notes */}
          {currentFrame.teachingNotes && currentFrame.teachingNotes.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">Teacher Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {currentFrame.teachingNotes.map((note, index) => (
                    <li key={index} className="text-base">{note}</li>
                  ))}
                </ul>
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
export function SentenceFramesSection({ section }: SentenceFramesSectionProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Basic guard clauses
  if (!section || !Array.isArray(section.frames) || section.frames.length === 0) {
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
  
  // Determine which layout to render using the type guard
  const useNewLayout = isNewSentenceFramePattern(currentFrame);
  const frameTitle = useNewLayout 
    ? (currentFrame as SentenceFramePattern).patternTemplate
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
           {frameTitle}
        </h2>
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
        <NewSentenceFrameLayout currentFrame={currentFrame as SentenceFramePattern} />
      ) : (
        <OldSentenceFrameLayout currentFrame={currentFrame as OldSentenceFrameData} />
      )}
    </div>
  );
}