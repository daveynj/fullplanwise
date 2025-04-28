import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Keep motion if needed for transitions
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lightbulb, Copy, Info, Languages, BookOpen, Pencil, AlignJustify } from "lucide-react"; // Keep/add necessary icons
import { Badge } from "@/components/ui/badge";
// Import the NEW data structure types
import { 
  SentenceFramePattern, 
  SentenceFrameComponent as NewSentenceFrameComponent, // Rename to avoid conflict if needed
  SentenceFrameExample 
} from '../../../../types/lessonContentTypes'; // Adjust path as necessary
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { ListTree, Zap, MessageSquareQuote, HelpCircle, GraduationCap, BookText } from 'lucide-react'; // Add needed icons

// --- Define the OLD data structures (for backward compatibility) ---
// Keep these temporarily to define the props for the old layout component
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
  // Add any other fields specific to the old format
  interactiveExamples?: any[]; // Example: if old format had this
}


interface SentenceFramesSectionProps {
  section: {
    type: string;
    title: string;
    // The frames array can contain objects matching EITHER the old or new structure
    frames: (OldSentenceFrameData | SentenceFramePattern)[]; 
  } | null;
}

// --- Type Guard to check for the new structure ---
function isNewSentenceFramePattern(frame: any): frame is SentenceFramePattern {
  return frame && 
         typeof frame.patternTemplate === 'string' && // Check for a field unique to the new structure
         typeof frame.visualStructure === 'object' && // Check for another key structure
         Array.isArray(frame.examples) && // Check if examples array exists
         (frame.examples.length === 0 || typeof frame.examples[0] === 'object'); // Check if examples are objects (if any exist)
}

// --- Component for the NEW Tabbed Layout --- 
function NewSentenceFrameLayout({ currentFrame }: { currentFrame: SentenceFramePattern }) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const handlePrevExample = () => {
    setCurrentExampleIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextExample = () => {
    setCurrentExampleIndex(prev => Math.min(currentFrame.examples.length - 1, prev + 1));
  };

  const currentExample = currentFrame.examples[currentExampleIndex];

  // Helper to get color based on component label (customize as needed)
  const getComponentColor = (label: string): string => {
    if (label.toLowerCase().includes('adjective')) return 'blue';
    if (label.toLowerCase().includes('infinitive') || label.toLowerCase().includes('verb')) return 'green';
    if (label.toLowerCase().includes('reason') || label.toLowerCase().includes('clause')) return 'amber';
    return 'gray'; // Default color
  };

  // Map component labels to colors for consistent use
  const colorMap = currentFrame.structureComponents.reduce((acc, comp) => {
    acc[comp.label] = getComponentColor(comp.label);
    return acc;
  }, {} as Record<string, string>); 

  // Function to highlight parts of the example sentence
  const highlightSentence = (sentence: string, breakdown: { [key: string]: string }): React.ReactNode => {
    let highlighted = sentence;
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
                <CardContent className="p-5 text-base">
                    <ul className="list-disc space-y-2 pl-5 text-gray-700 text-xl font-bold">
                    {currentFrame.grammarFocus.map((point, index) => (
                        <li key={index}>{point}</li>
                    ))}
                    </ul>
                </CardContent>
            </Card>
        )}

        {currentFrame.patternVariations && (Object.keys(currentFrame.patternVariations).length > 0) && (
            <Card className="border-purple-200 shadow-sm">
                 <CardHeader className="bg-purple-50 p-4 border-b border-purple-200">
                    <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2"><MessageSquareQuote className="h-5 w-5"/>Pattern Variations</CardTitle>
                </CardHeader>
                <CardContent className="p-5 text-base space-y-3">
                    {currentFrame.patternVariations.negativeForm && (
                        <div className="text-xl font-bold"><strong className="font-medium text-purple-700">Negative:</strong> {currentFrame.patternVariations.negativeForm}</div>
                    )}
                    {currentFrame.patternVariations.questionForm && (
                        <div className="text-xl font-bold"><strong className="font-medium text-purple-700">Question:</strong> {currentFrame.patternVariations.questionForm}</div>
                    )}
                    {currentFrame.patternVariations.modalForm && (
                        <div className="text-xl font-bold"><strong className="font-medium text-purple-700">With Modals:</strong> {currentFrame.patternVariations.modalForm}</div>
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
                     <p className="text-sm text-gray-600 mt-3 pt-2 border-t border-gray-200 text-xl font-bold">In the sentence: "{component.inSentenceExample}"</p>
                  </div>
                )
              })} 
            </CardContent>
         </Card>

         {/* Visual Structure Diagram */}
         <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2"><Zap className="h-5 w-5 text-gray-500"/>Visual Structure</CardTitle>
            </CardHeader>
             <CardContent className="p-5">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-100 rounded border border-gray-200">
                        <span className="text-sm font-medium text-gray-500">Start</span>
                        <span className="font-mono text-gray-800 text-xl font-bold">{currentFrame.visualStructure.start}</span>
                    </div>
                    {currentFrame.visualStructure.parts.map((part, index) => {
                        const color = colorMap[part.label] || 'gray';
                        const bgColor = `bg-${color}-100`;
                        const textColor = `text-${color}-800`;
                        const borderColor = `border-${color}-300`;
                        return (
                            <React.Fragment key={index}>
                                {part.connector && (
                                    <div className="flex items-center justify-center text-xs font-medium text-gray-500">
                                        <span>{part.connector}</span>
                                    </div>
                                )}
                                <div className={`flex items-center justify-between p-2 ${bgColor} rounded border ${borderColor}`}>
                                    <span className={`text-sm font-medium ${textColor} text-xl font-bold`}>{part.label}</span>
                                    {/* Optional: Could show example text here if needed */}
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div className="flex items-center justify-between p-2 bg-gray-100 rounded border border-gray-200">
                        <span className="text-sm font-medium text-gray-500">End</span>
                        <span className="font-mono text-gray-800 text-xl font-bold">{currentFrame.visualStructure.end}</span>
                    </div>
                </div>
            </CardContent>
         </Card>
      </TabsContent>

      {/* 3. Examples Tab */}
      <TabsContent value="examples" className="space-y-6">
        {currentExample ? (
          <> 
            <Card className="border-amber-200 shadow-sm">
               <CardHeader className="bg-amber-50 p-4 border-b border-amber-200 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2"><BookText className="h-5 w-5"/>Complete Sentence</CardTitle>
                  {/* Example Navigation */} 
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" size="icon" 
                      onClick={handlePrevExample} 
                      disabled={currentExampleIndex === 0}
                      aria-label="Previous Example"
                      className="h-7 w-7 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium border border-gray-200">
                      Example {currentExampleIndex + 1} of {currentFrame.examples.length}
                    </span>
                    <Button 
                      variant="outline" size="icon" 
                      onClick={handleNextExample} 
                      disabled={currentExampleIndex >= currentFrame.examples.length - 1}
                      aria-label="Next Example"
                      className="h-7 w-7 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
               </CardHeader>
               <CardContent className="p-5 space-y-4">
                 <div className="text-xl p-4 bg-white rounded border border-amber-300 shadow-inner">
                    {highlightSentence(currentExample.completeSentence, currentExample.breakdown)}
                  </div>
                  {/* Example Breakdown */} 
                  <div className="space-y-2 pt-3">
                     {Object.entries(currentExample.breakdown).map(([label, text]) => {
                        const color = colorMap[label] || 'gray';
                        const bgColor = `bg-${color}-100`;
                        const textColor = `text-${color}-800`;
                        const borderColor = `border-${color}-300`;

                        return (
                          <div key={label} className={`flex items-start gap-3 p-2 ${bgColor} rounded border ${borderColor} text-sm`}>
                              <span className={`font-semibold ${textColor} capitalize w-24 flex-shrink-0`}>{label}:</span>
                              <span className="text-gray-900">{text}</span>
                          </div>
                        )
                     })}
                  </div>
               </CardContent>
            </Card>

            {currentFrame.teachingNotes && currentFrame.teachingNotes.length > 0 && (
                <Card className="border-indigo-200 shadow-sm">
                    <CardHeader className="bg-indigo-50 p-4 border-b border-indigo-200">
                        <CardTitle className="text-base font-semibold text-indigo-800 flex items-center gap-2"><GraduationCap className="h-5 w-5"/>Teaching Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-base">
                        <ul className="list-disc space-y-2 pl-5 text-gray-700">
                        {currentFrame.teachingNotes.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {currentFrame.discussionPrompts && currentFrame.discussionPrompts.length > 0 && (
                 <Card className="border-teal-200 shadow-sm">
                    <CardHeader className="bg-teal-50 p-4 border-b border-teal-200">
                        <CardTitle className="text-base font-semibold text-teal-800 flex items-center gap-2"><HelpCircle className="h-5 w-5"/>Discussion Prompts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-base">
                        <ul className="list-disc space-y-2 pl-5 text-gray-700">
                        {currentFrame.discussionPrompts.map((prompt, index) => (
                            <li key={index}>{prompt}</li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
          </>
        ) : (
           <div className="p-6 text-center text-gray-500">No examples available for this pattern.</div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// --- Component for the OLD Layout ---
function OldSentenceFrameLayout({ currentFrame }: { currentFrame: OldSentenceFrameData }) {
  // This contains the original rendering logic from the SentenceFramesSection component
  return (
      // --- Main Content Card --- // Extracted from the original component below
      <Card className="overflow-hidden border-gray-200 shadow-sm"> 
        {/* Section 1: Pattern and Function */} 
        <div className="p-5 bg-amber-50 border-b border-amber-200">
          <h3 className="text-base font-semibold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Info className="h-4 w-4"/>Sentence Pattern</h3>
          <div className="font-mono p-4 bg-white rounded-lg border border-amber-300 text-gray-900 relative text-xl font-bold mb-4 shadow-inner">
            {currentFrame.pattern} 
            <button 
              className="absolute right-2 top-2 text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-100/50"
              onClick={() => navigator.clipboard.writeText(currentFrame.pattern)}
              title="Copy Pattern"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {currentFrame.communicativeFunction && (
            <div className="text-base text-amber-900 flex items-start gap-2">
              <Languages className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-700" /> 
              <div className="text-xl font-bold">
                 <span className="font-semibold">Language Function:</span> {currentFrame.communicativeFunction}
                 {currentFrame.usage && <span className="block text-sm text-gray-600 italic mt-1">{currentFrame.usage}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Structure Breakdown */} 
        {currentFrame.structureBreakdown && currentFrame.structureBreakdown.length > 0 && ( // Check if breakdown exists
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">Sentence Structure Breakdown</h3>
            <div className="space-y-4">
              {currentFrame.structureBreakdown.map((component, index) => {
                // Use consistent styling with left amber border for structure tie-in
                return (
                  <div key={index} 
                      className={`p-4 rounded-md border-l-4 border-amber-400 bg-gray-50/80 shadow-sm border border-gray-200`}>
                    <p className={`font-semibold text-lg text-gray-800`}>{component.componentName}</p>
                    <p className="text-base text-gray-700 mt-1 italic text-xl font-bold">{component.description}</p>
                    {component.examples && component.examples.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-500 mb-1.5">Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {component.examples.map((ex, exIndex) => (
                            // Use secondary badge style, ensure readability
                            <Badge key={exIndex} variant="secondary" 
                                  className={`text-sm font-medium border-gray-300 text-gray-800 shadow-sm px-2.5 py-1`}>
                              {ex}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )} {/* End Structure Breakdown Section */}

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
        <Card className="shadow-sm border-gray-200 mt-6"> {/* Added margin-top */}
          <CardContent className="p-5 text-base space-y-4">
            {currentFrame.grammarFocus && 
              <div className="flex items-start gap-2.5">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                <div className="text-xl font-bold"><strong className="text-gray-800 font-semibold">Grammar Focus:</strong> <span className="text-gray-700">{currentFrame.grammarFocus}</span></div>
              </div>
            }
            {currentFrame.teachingTips && 
               <div className="flex items-start gap-2.5">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                  <div className="text-xl font-bold"><strong className="text-gray-800 font-semibold">Teaching Tips:</strong> <span className="text-gray-700">{currentFrame.teachingTips}</span></div>
                </div>
            }
          </CardContent>
        </Card>
      )}
    </Card> // End Main Content Card
  );
}


// --- Main Overhauled Component --- 
export function SentenceFramesSection({ section }: SentenceFramesSectionProps) {

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Basic guard clauses
  if (!section || !Array.isArray(section.frames) || section.frames.length === 0) {
    return (
      <div className="p-6 text-center bg-amber-50 rounded-lg border border-amber-200">
        <Info className="mx-auto h-12 w-12 text-amber-400 mb-3" />
        <h3 className="text-lg font-medium text-amber-700 mb-2">No Sentence Frames Available</h3>
        <p className="text-amber-600 text-sm max-w-md mx-auto">
          This lesson doesn't include sentence frame data in the expected format.
        </p>
      </div>
    );
  }
  
  // --- Navigation Handlers --- 
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
    ? (currentFrame as SentenceFramePattern).patternTemplate // Use patternTemplate for new layout title? Or add a title field?
    : (currentFrame as OldSentenceFrameData).title || `Sentence Pattern ${currentFrameIndex + 1}`;

  // --- Rendering Logic --- 
  return (
    <div className="sentence-frames-section space-y-6">
       {/* --- Top Navigation & Title (Common to both layouts) --- */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
           {/* Determine title based on layout? Or add title to new structure? */}
           {frameTitle} 
        </h2>
         <div className="flex gap-1">
           {/* Prev/Next Frame Buttons */} 
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

      {/* --- Conditional Rendering Call --- */}
      {useNewLayout ? (
        <NewSentenceFrameLayout currentFrame={currentFrame as SentenceFramePattern} />
      ) : (
        <OldSentenceFrameLayout currentFrame={currentFrame as OldSentenceFrameData} />
      )}
      
    </div>
  );
}