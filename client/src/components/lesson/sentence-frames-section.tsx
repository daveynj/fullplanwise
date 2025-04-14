import { 
  AlignLeft,
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Lightbulb, 
  MessageCircle,
  MessageSquare,
  GraduationCap,
  Pencil,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SentenceFrameSectionProps {
  section?: any;
}

interface SentenceFrame {
  title: string;
  level: "basic" | "intermediate" | "advanced";
  pattern: string;
  examples: string[];
  usage?: string;
  grammarFocus?: string;
  communicativeFunction?: string; 
  teachingTips?: string;
}

// The target vocabulary words for the sentence frames
const vocabList = ['festivity', 'commemorate', 'patriotic', 'ritual', 'heritage'];

// Define the structure of the data we expect for each frame
interface InteractiveExample {
  exampleSentence: string;
  phraseBank: string[];
}

interface SentenceFrameData {
  pattern: string;
  level?: "basic" | "intermediate" | "advanced"; // Make level optional for flexibility
  title?: string; // Make optional
  usage?: string;
  communicativeFunction?: string;
  grammarFocus?: string;
  teachingTips?: string;
  interactiveExamples: InteractiveExample[]; 
}

interface InteractiveSentenceFrameProps {
  section: {
    type: string;
    title: string;
    frames: SentenceFrameData[];
  } | null;
}

// Draggable Phrase Component (Adapted from DraggableWord)
function DraggablePhrase({ id, phrase, isUsed }: { 
  id: string;
  phrase: string;
  isUsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isUsed,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isUsed ? 0.5 : isDragging ? 0.8 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: isUsed ? 0.5 : 1 }}
      whileHover={!isUsed ? { scale: 1.05 } : {}}
      className={`px-3 py-1.5 m-1 rounded-md border-2 shadow-sm transition-all text-center whitespace-nowrap 
        ${isUsed 
          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
          : isDragging
            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-md"
            : "border-amber-300 bg-white text-amber-700 hover:bg-amber-50 cursor-grab"
        } font-medium`}
    >
      {phrase}
    </motion.div>
  );
}

// Droppable Blank Component (Adapted from Cloze)
function DroppableBlank({ 
  id, 
  blankIndex, 
  droppedPhrase, 
  isCorrect,
  onRemove,
  isOver
}: { 
  id: string;
  blankIndex: number;
  droppedPhrase: string | null; 
  isCorrect: boolean | null;
  onRemove: (blankId: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      data-blank-id={id}
      className={`inline-flex items-center justify-center min-w-[120px] h-[38px] px-2 mx-1 border-b-2 rounded-sm relative align-bottom 
        ${isOver && !droppedPhrase ? "border-amber-500 bg-amber-100 shadow-inner" : ""}
        ${droppedPhrase 
          ? isCorrect === true
            ? "border-green-400 bg-green-50"
            : isCorrect === false
              ? "border-red-400 bg-red-50"
              : "border-amber-400 bg-amber-50"
          : "border-amber-300 bg-amber-50/50"
        }`}
      onClick={() => droppedPhrase && onRemove(id)}
      style={{ verticalAlign: 'bottom' }}
    >
      {droppedPhrase ? (
        <div className={`py-1 px-2 rounded-sm text-center font-medium whitespace-nowrap 
          ${isCorrect === true
            ? "text-green-700"
            : isCorrect === false
              ? "text-red-700"
            : "text-amber-700"
          }
          cursor-pointer hover:line-through`}
        >
          {droppedPhrase}
        </div>
      ) : (
        <div className="text-amber-400 text-sm font-medium">
          {isOver ? "Drop here" : `Blank ${blankIndex + 1}`}
        </div>
      )}
    </div>
  );
}

// New Interactive Component
function InteractiveSentenceFrameComponent({ section }: InteractiveSentenceFrameProps) {

  if (!section || !Array.isArray(section.frames) || section.frames.length === 0) {
    return (
      <div className="p-6 text-center bg-amber-50 rounded-lg border border-amber-200">
        <Info className="mx-auto h-12 w-12 text-amber-400 mb-3" />
        <h3 className="text-lg font-medium text-amber-700 mb-2">No Interactive Sentence Frames Available</h3>
        <p className="text-amber-600 text-sm max-w-md mx-auto">This lesson doesn't include data for interactive sentence frames.</p>
      </div>
    );
  }

  // -- State Management --
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  
  // DND State
  const [activeId, setActiveId] = useState<string | null>(null); // ID of the dragged phrase
  const [overBlankId, setOverBlankId] = useState<string | null>(null); // ID of the blank being hovered over

  // State for the content of the blanks for the CURRENT example
  // Maps blankId (e.g., "frame-0-blank-0") to the dropped phrase text
  const [droppedPhrases, setDroppedPhrases] = useState<Record<string, string | null>>({}); 
  
  // State for the shuffled phrase bank for the CURRENT example
  const [shuffledPhraseBank, setShuffledPhraseBank] = useState<string[]>([]);
  
  // State to track which phrases from the bank have been used in blanks
  const [usedPhrases, setUsedPhrases] = useState<string[]>([]);

  // --- BEGIN EDIT: Add State for Checking --- 
  const [isChecked, setIsChecked] = useState(false);
  // Maps blankId (e.g., "frame-0-blank-0") to boolean or null
  const [blankCorrectness, setBlankCorrectness] = useState<Record<string, boolean | null>>({}); 
  const [overallScore, setOverallScore] = useState<{ correct: number; total: number } | null>(null);
  // --- END EDIT --- 

  // Get current frame
  const currentFrame = section.frames[currentFrameIndex];

  // --- BEGIN EDIT: Check if current frame has the NEW interactive data --- 
  const hasInteractiveData = 
       currentFrame && 
       Array.isArray(currentFrame.interactiveExamples) && 
       currentFrame.interactiveExamples.length > 0;
       
  // Get current example ONLY if data exists
  const currentExample = hasInteractiveData ? currentFrame.interactiveExamples[currentExampleIndex] : null;
  const numExamples = hasInteractiveData ? currentFrame.interactiveExamples.length : 0;
  // --- END EDIT ---

  // Effect to reset state and shuffle bank when example/frame changes
  useEffect(() => {
    console.log(`Effect triggered: Frame ${currentFrameIndex}, Example ${currentExampleIndex}`);
    setDroppedPhrases({});
    setUsedPhrases([]);
    setActiveId(null);
    setOverBlankId(null);
    setIsChecked(false);
    setBlankCorrectness({});
    setOverallScore(null);

    // --- BEGIN EDIT: Combine phraseBank and distractors, then shuffle --- 
    const correctPhrases = currentFrame.interactiveExamples[currentExampleIndex]?.phraseBank || [];
    // Get distractors, ensure it's always an array
    const distractors = currentFrame.interactiveExamples[currentExampleIndex]?.distractorPhrases || []; 
    const combinedPool = [...correctPhrases, ...distractors];
    
    console.log("Correct phrases:", correctPhrases);
    console.log("Distractors:", distractors);
    console.log("Shuffling combined pool:", combinedPool);
    setShuffledPhraseBank(shuffleArray(combinedPool)); // Use the combined pool
    // --- END EDIT --- 

  }, [currentFrameIndex, currentExampleIndex, section]);

  // --- EDIT: Define shuffleArray helper here --- 
  const shuffleArray = (array: string[]) => {
      let currentIndex = array.length, randomIndex;
      const newArray = [...array];
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
      }
      return newArray;
  };
  // --- END EDIT ---

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require moving 5px to start drag
      }
    })
  );

  // -- Helper Functions --
  
  const handleDragStart = (event: DragStartEvent) => {
    console.log("Drag Start:", event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => { // Use any type for simplicity here
    const { over } = event;
    const newOverBlankId = over ? (over.id as string) : null;
    if (newOverBlankId !== overBlankId) {
      console.log("Drag Over:", newOverBlankId);
      setOverBlankId(newOverBlankId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log("Drag End:", event);
    const { active, over } = event;
    setActiveId(null);
    setOverBlankId(null);

    if (over && active.id.startsWith('phrase-')) {
      const droppedPhraseText = (active.id as string).replace('phrase-', '');
      const targetBlankId = over.id as string;
      
      // Check if dropping onto a valid blank droppable
      if (targetBlankId.startsWith(`frame-${currentFrameIndex}-blank-`)) {
         console.log(`Dropped phrase '${droppedPhraseText}' onto blank '${targetBlankId}'`);

         // Check if the phrase is already used
         if (usedPhrases.includes(droppedPhraseText)) {
           console.log("Phrase already used, skipping drop.");
           return; // Or handle swapping later
         }

         // Update the state for the specific blank
         setDroppedPhrases(prev => {
           // If another phrase was already in this blank, mark it as unused
           const oldPhrase = prev[targetBlankId];
           if (oldPhrase) {
             setUsedPhrases(up => up.filter(p => p !== oldPhrase));
           }
           return { ...prev, [targetBlankId]: droppedPhraseText };
         });
         // Mark the newly dropped phrase as used
         setUsedPhrases(up => [...up, droppedPhraseText]);
         
         // Reset check state if an answer is changed
         setIsChecked(false);
         setBlankCorrectness({});
         setOverallScore(null);
      }
    }
  };
  
  // Function to remove a phrase from a blank
  const removePhraseFromBlank = (blankId: string) => {
    const phraseToRemove = droppedPhrases[blankId];
    if (phraseToRemove) {
      console.log(`Removing phrase '${phraseToRemove}' from blank '${blankId}'`);
      setDroppedPhrases(prev => ({ ...prev, [blankId]: null }));
      setUsedPhrases(prev => prev.filter(p => p !== phraseToRemove));
      
      // Reset check state if an answer is changed
      setIsChecked(false);
      setBlankCorrectness({});
      setOverallScore(null);
    }
  };

  // --- BEGIN EDIT: Add Navigation Handlers ---
  const handlePrevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(prev => prev - 1);
      setCurrentExampleIndex(0); // Reset example index when changing frames
    }
  };

  const handleNextFrame = () => {
    if (section && currentFrameIndex < section.frames.length - 1) {
      setCurrentFrameIndex(prev => prev + 1);
      setCurrentExampleIndex(0); // Reset example index when changing frames
    }
  };

  const handlePrevExample = () => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex(prev => prev - 1);
    }
  };

  const handleNextExample = () => {
    const numExamples = section?.frames[currentFrameIndex]?.interactiveExamples?.length || 0;
    if (currentExampleIndex < numExamples - 1) {
      setCurrentExampleIndex(prev => prev + 1);
    }
  };
  // --- END EDIT ---

  // --- BEGIN EDIT: Add Check and Reset Handlers ---
  const handleCheckAnswers = () => {
    console.log("Checking answers...");
    const numBlanks = currentFrame.pattern.split('_____').length - 1;
    const newCorrectness: Record<string, boolean | null> = {};
    let correctCount = 0;

    // Get the CORRECT phrases expected for this example
    const expectedPhrases = currentExample?.phraseBank || []; 
    // Get the phrases dropped by the user
    const droppedPhraseValues = Object.values(droppedPhrases).filter(p => p !== null) as string[];
    
    console.log("Expected Phrases (Correct Bank):", expectedPhrases);
    console.log("Dropped Phrases (User Input):", droppedPhraseValues);

    // Basic check: Did the user fill all blanks and use the correct number of phrases?
    const allBlanksFilled = droppedPhraseValues.length === numBlanks;
    // CRITICAL: Compare against expectedPhrases length, NOT numBlanks if they could differ!
    const correctNumberOfPhrases = droppedPhraseValues.length === expectedPhrases.length; 

    let isOverallCorrect = false;
    if (allBlanksFilled && correctNumberOfPhrases) {
      // Check if the SET of dropped phrases matches the SET of expected phrases
      // Trim whitespace for comparison robustness
      const droppedSet = new Set(droppedPhraseValues.map(p => p.trim()));
      const expectedSet = new Set(expectedPhrases.map(p => p.trim()));
      
      isOverallCorrect = droppedSet.size === expectedSet.size && 
                         [...droppedSet].every(value => expectedSet.has(value));
                         
      console.log("Sets match?", isOverallCorrect);
                         
      // Determine individual blank correctness 
      for (let i = 0; i < numBlanks; i++) {
          const blankId = `frame-${currentFrameIndex}-blank-${i}`;
          const dropped = droppedPhrases[blankId];
          // Mark as correct if overall set matches AND the blank is filled.
          // Mark as incorrect if overall set doesn't match OR the blank is not filled correctly 
          // (We simplify: if overall is wrong, mark all filled as wrong for now)
          if (dropped) {
              newCorrectness[blankId] = isOverallCorrect; 
          } else {
              newCorrectness[blankId] = null; // Unfilled blanks aren't marked wrong
          }
      }
      // Use the count of expected phrases for the score
      correctCount = isOverallCorrect ? expectedPhrases.length : 0; 

    } else {
       console.log("Checking failed: Incorrect number of phrases dropped or not all blanks filled.");
        // Mark all filled blanks as incorrect if counts don't match
        for (let i = 0; i < numBlanks; i++) {
            const blankId = `frame-${currentFrameIndex}-blank-${i}`;
            newCorrectness[blankId] = droppedPhrases[blankId] ? false : null;
        }
        correctCount = 0;
    }

    setBlankCorrectness(newCorrectness);
    // Use expectedPhrases length for the total score, as numBlanks might differ if pattern is complex
    setOverallScore({ correct: correctCount, total: expectedPhrases.length }); 
    setIsChecked(true);
  };

  const handleResetCurrentExample = () => {
    console.log("Resetting current example...");
    setDroppedPhrases({});
    setUsedPhrases([]);
    setIsChecked(false);
    setBlankCorrectness({});
    setOverallScore(null);
    // Optionally re-shuffle phrase bank? Maybe not necessary.
  };
  // --- END EDIT ---

  // -- Rendering Logic --
  
  // Always render the frame pattern display and navigation
  const framePatternDisplay = (
    <div className="font-mono p-3 bg-white rounded-md border border-amber-200 text-gray-800 relative text-center">
       {currentFrame.pattern}
       <button 
         className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
         onClick={() => navigator.clipboard.writeText(currentFrame.pattern)}
       >
         <Copy className="h-4 w-4" />
       </button>
    </div>
  );
  
  let interactiveBuilderContent;
  if (hasInteractiveData && currentExample) {
      // Split pattern to create blanks for the interactive part
      const patternParts = currentFrame.pattern.split('_____');
      const sentenceElements = [];
      let blankCounter = 0;
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i]) {
          sentenceElements.push(<span key={`text-${i}`}>{patternParts[i]}</span>);
        }
        if (i < patternParts.length - 1) {
          const blankIndex = blankCounter++;
          const blankId = `frame-${currentFrameIndex}-blank-${blankIndex}`;
          sentenceElements.push(
            <DroppableBlank
              key={blankId}
              id={blankId}
              blankIndex={blankIndex}
              droppedPhrase={droppedPhrases[blankId] || null}
              isCorrect={blankCorrectness[blankId]}
              onRemove={removePhraseFromBlank}
              isOver={overBlankId === blankId}
            />
          );
        }
      }
      
      interactiveBuilderContent = (
         <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
         >
            {/* Interactive Builder Area */}
             <div className="p-4 border border-dashed border-amber-300 rounded min-h-[100px] bg-amber-50/30 mb-6 text-lg leading-relaxed text-center">
               {sentenceElements}
             </div>

             {/* Draggable Phrase Bank Area */}
             <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Drag Phrases to the Blanks Above:
                </h4>
                <div className="flex flex-wrap gap-1 p-3 bg-amber-50/30 rounded-md border border-amber-100 min-h-[60px]">
                   <SortableContext 
                      items={shuffledPhraseBank.map(p => `phrase-${p}`)}
                      strategy={rectSortingStrategy}
                   >
                     {shuffledPhraseBank.length > 0 ? (
                        shuffledPhraseBank.map((phrase, index) => (
                          <DraggablePhrase
                            key={`phrase-${phrase}-${index}`}
                            id={`phrase-${phrase}`}
                            phrase={phrase}
                            isUsed={usedPhrases.includes(phrase)}
                          />
                        ))
                     ) : (
                       <div className="text-gray-500 italic">Phrase bank missing or empty.</div>
                     )}
                   </SortableContext>
                </div>
             </div>

             {/* Drag Overlay */}
             <DragOverlay adjustScale zIndex={100}>
               {activeId && activeId.startsWith('phrase-') && (
                 <div className="px-3 py-1.5 rounded-md border-2 border-amber-400 bg-amber-100 text-amber-800 shadow-lg font-medium">
                   {activeId.replace('phrase-', '')}
                 </div>
               )}
             </DragOverlay>

             {/* Feedback Area */}
             {isChecked && overallScore && (
               <Alert 
                 className={`mt-6 transition-all duration-300 ${
                   overallScore.correct === overallScore.total 
                     ? "bg-green-50 border-green-200 text-green-800"
                     : overallScore.correct === 0
                       ? "bg-red-50 border-red-200 text-red-800" 
                       : "bg-amber-50 border-amber-200 text-amber-800"
                 }`}
               >
                 <AlertDescription className="flex items-center gap-2">
                   {overallScore.correct === overallScore.total ? (
                     <CheckCircle className="h-5 w-5 text-green-500" />
                   ) : (
                     <AlertCircle className={`h-5 w-5 ${overallScore.correct === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                   )}
                   <div>
                     <span className="font-medium">Score: {overallScore.correct} out of {overallScore.total} correct</span>
                     {overallScore.correct !== overallScore.total && (
                       <span className="ml-1 text-sm">
                         (Incorrectly filled blanks are highlighted in red)
                       </span>
                     )}
                   </div>
                 </AlertDescription>
               </Alert>
             )}
         </DndContext>
      );
  } else {
      // Fallback for old data format: Show non-interactive examples if available
      const oldExamples = (currentFrame as any).examples; // Access potentially existing old examples array
      interactiveBuilderContent = (
        <div className="p-4 border border-amber-200 rounded min-h-[100px] bg-amber-50/50 mb-6 text-left">
           <p className="text-sm text-amber-700 font-medium mb-2">
             <Info className="inline h-4 w-4 mr-1"/> 
             Interactive exercise not available for this lesson format.
           </p>
           {Array.isArray(oldExamples) && oldExamples.length > 0 && (
             <div className="mt-2 space-y-1">
               <p className="text-xs text-amber-600">Example Sentences:</p>
               {oldExamples.map((ex: string, idx: number) => (
                 <p key={idx} className="text-sm text-gray-700 pl-2">- {ex}</p>
               ))}
             </div>
           )}
        </div>
      );
  }

  return (
    <div className="interactive-sentence-frame">
      <Card className="mb-6 border-l-4 border-l-amber-400 shadow-md">
        <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex justify-between items-center mb-2">
             <CardTitle>{currentFrame.title || `Sentence Frame ${currentFrameIndex + 1}`}</CardTitle>
             <div className="flex gap-1">
               <Button 
                  variant="outline" size="icon" 
                  onClick={handlePrevFrame} 
                  disabled={currentFrameIndex === 0}
                  aria-label="Previous Frame Pattern"
                  className="h-7 w-7"
                >
                 <ChevronLeft className="h-4 w-4" />
               </Button>
               <span className="text-sm px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  Frame {currentFrameIndex + 1} of {section.frames.length}
                </span>
               <Button 
                  variant="outline" size="icon" 
                  onClick={handleNextFrame} 
                  disabled={currentFrameIndex >= section.frames.length - 1}
                  aria-label="Next Frame Pattern"
                  className="h-7 w-7"
                 >
                 <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
          </div>
          {framePatternDisplay}
        </CardHeader>

        <CardContent className="pt-4">
           {hasInteractiveData && (
               <div className="flex justify-end items-center mb-4 gap-1">
                  <Button 
                     variant="ghost" size="sm" 
                     onClick={handlePrevExample} 
                     disabled={currentExampleIndex === 0}
                     aria-label="Previous Example Sentence"
                   >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev Ex.
                  </Button>
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                     Ex. {currentExampleIndex + 1} of {numExamples}
                   </span>
                  <Button 
                     variant="ghost" size="sm" 
                     onClick={handleNextExample} 
                     disabled={currentExampleIndex >= numExamples - 1}
                     aria-label="Next Example Sentence"
                   >
                    Next Ex. <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
               </div>
           )}
          
           {interactiveBuilderContent}

          {/* Other Info (Usage, Grammar, Tips) */} 
           <div className="mt-6 space-y-3 text-sm">
             {currentFrame.usage && <div><strong>Usage:</strong> {currentFrame.usage}</div>}
             {currentFrame.communicativeFunction && <div><strong>Function:</strong> {currentFrame.communicativeFunction}</div>}
             {currentFrame.grammarFocus && <div><strong>Grammar:</strong> {currentFrame.grammarFocus}</div>}
             {currentFrame.teachingTips && <div><strong>Teaching Tips:</strong> {currentFrame.teachingTips}</div>}
           </div>
        </CardContent>

        {hasInteractiveData && (
            <CardFooter className="flex justify-between bg-gray-50 border-t p-4">
               <Button variant="outline" onClick={handleResetCurrentExample} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                 <RefreshCw className="h-4 w-4 mr-2" /> Reset
               </Button>
               <Button onClick={handleCheckAnswers} className="bg-amber-600 hover:bg-amber-700">
                 Check Answer
               </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

export { InteractiveSentenceFrameComponent as SentenceFramesSection };