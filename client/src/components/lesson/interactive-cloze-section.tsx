import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, PenTool, RefreshCw, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  rectIntersection
} from "@dnd-kit/core";
import {
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ClozeItem {
  id: number;
  answer: string;
  userAnswer: string;
  isCorrect: boolean | null;
}

interface InteractiveClozeProps {
  title?: string;
  text: string;
  wordBank?: string[];
  teacherNotes?: string;
}

// Draggable word component
function DraggableWord({ id, word, isUsed }: { 
  id: string;
  word: string;
  isUsed: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isUsed });

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
      className={`px-3 py-1.5 m-1 rounded-md border-2 shadow-sm transition-all text-center 
        ${isUsed 
          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
          : isDragging
            ? "border-blue-400 bg-blue-50 text-blue-800 shadow-md"
            : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50 cursor-grab"
        } font-medium`}
    >
      {word}
    </motion.div>
  );
}

// Droppable blank component
function DroppableBlank({ 
  id, 
  index, 
  userAnswer, 
  isCorrect,
  onRemove,
  isOver
}: { 
  id: number;
  index: number;
  userAnswer: string;
  isCorrect: boolean | null;
  onRemove: (id: number) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `blank-${id}`,
  });

  return (
    <div 
      ref={setNodeRef}
      data-blank-id={id}
      className={`inline-flex items-center justify-center min-w-[100px] h-[36px] px-2 mx-1 border-b-2 rounded-sm relative
        ${isOver && !userAnswer ? "border-blue-500 bg-blue-100 shadow-inner" : ""}
        ${userAnswer 
          ? isCorrect === true
            ? "border-green-400 bg-green-50"
            : isCorrect === false
              ? "border-red-400 bg-red-50"
              : "border-blue-400 bg-blue-50"
          : "border-blue-300 bg-blue-50/50"
        }`}
      onClick={() => userAnswer && onRemove(id)}
    >
      {userAnswer ? (
        <div className={`py-1 px-2 rounded-sm text-center font-medium whitespace-nowrap
          ${isCorrect === true
            ? "text-green-700"
            : isCorrect === false
              ? "text-red-700"
            : "text-blue-700"
          } cursor-pointer hover:line-through`}
        >
          {userAnswer}
        </div>
      ) : (
        <div className="text-blue-400 text-sm font-medium">
          {isOver ? "Drop here" : `Blank ${index}`}
        </div>
      )}
    </div>
  );
}

export function InteractiveClozeSection({ 
  title = "Fill in the Blanks", 
  text, 
  wordBank = [],
  teacherNotes
}: InteractiveClozeProps) {
  // State to hold the shuffled word bank
  const [shuffledWordBank, setShuffledWordBank] = useState<string[]>([]);
  
  useEffect(() => {
    // Shuffle the incoming wordBank and set it to state
    const shuffleArray = (array: string[]) => {
      let currentIndex = array.length, randomIndex;
      const newArray = [...array]; // Create a copy
      // While there remain elements to shuffle.
      while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [newArray[currentIndex], newArray[randomIndex]] = [
          newArray[randomIndex], newArray[currentIndex]];
      }
      return newArray;
    };
    setShuffledWordBank(shuffleArray(wordBank || []));
  }, [wordBank]); // Re-shuffle if the wordBank prop changes
  
  // Parse the text to extract cloze items
  const [clozeItems, setClozeItems] = useState<ClozeItem[]>(() => {
    const items: ClozeItem[] = [];
    const regex = /\[(\d+):([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const id = parseInt(match[1]);
      const answer = match[2];
      
      items.push({
        id,
        answer,
        userAnswer: "",
        isCorrect: null
      });
    }
    
    return items;
  });
  
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  
  // For drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [overBlankId, setOverBlankId] = useState<string | null>(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    })
  );
  
  // Set a word to a blank
  const setWordToBlank = (blankId: number, word: string) => {
    setClozeItems(prev => 
      prev.map(item => 
        item.id === blankId ? { ...item, userAnswer: word, isCorrect: null } : item
      )
    );
    
    // Add to used words list
    if (!usedWords.includes(word)) {
      setUsedWords(prev => [...prev, word]);
    }
    
    // Reset checked state when answers change
    if (isChecked) {
      setIsChecked(false);
      setScore(null);
    }
  };
  
  // Remove word from blank
  const removeWordFromBlank = (blankId: number) => {
    // Find the word to remove from used list
    const itemToRemove = clozeItems.find(item => item.id === blankId);
    if (itemToRemove?.userAnswer) {
      setUsedWords(prev => prev.filter(word => word !== itemToRemove.userAnswer));
    }
    
    // Clear the blank
    setClozeItems(prev => 
      prev.map(item => 
        item.id === blankId ? { ...item, userAnswer: "", isCorrect: null } : item
      )
    );
    
    // Reset checked state when answers change
    if (isChecked) {
      setIsChecked(false);
      setScore(null);
    }
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  // Handle drag over
  const handleDragOver = (event: any) => {
    const { over } = event;
    setOverBlankId(over ? over.id : null);
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverBlankId(null);
    
    const { active, over } = event;
    if (!over) return;
    
    // Check if we're dropping onto a blank
    const overId = over.id.toString();
    if (overId.startsWith('blank-')) {
      const blankId = parseInt(overId.replace('blank-', ''));
      const wordId = active.id.toString();
      if (wordId.startsWith('word-')) {
        const word = wordId.replace('word-', '');
        setWordToBlank(blankId, word);
      }
    }
  };
  
  // Check all answers
  const checkAnswers = () => {
    const updatedItems = clozeItems.map(item => ({
      ...item,
      isCorrect: item.userAnswer.trim().toLowerCase() === item.answer.trim().toLowerCase()
    }));
    
    setClozeItems(updatedItems);
    setIsChecked(true);
    
    // Calculate score
    const correct = updatedItems.filter(item => item.isCorrect).length;
    setScore({ correct, total: updatedItems.length });
  };
  
  // Reset all answers
  const resetAnswers = () => {
    setClozeItems(prev => 
      prev.map(item => ({ ...item, userAnswer: "", isCorrect: null }))
    );
    setUsedWords([]);
    setIsChecked(false);
    setScore(null);
  };
  
  return (
    <div className="interactive-cloze">
      <Card className="mb-6 border-l-4 border-l-blue-400 shadow-md">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-blue-500" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>
            Drag and drop words to fill in the blanks in the text.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Text with blanks with proper droppable zones */}
            <div className="text-lg leading-relaxed mb-8 p-5 bg-blue-50/40 rounded-md border border-blue-100">
              {(() => { // IIFE to allow logging within JSX
                const regex = /\[\s*(\d+)\s*:[^\u005D]+\s*\]/; // More flexible regex
                const parts = text.split(regex);
                console.log("[InteractiveClozeSection] Text split parts:", parts);
                return parts.map((part, index) => {
                  // Even indices are text parts, odd indices are blank IDs (captured group)
                  if (index % 2 === 0) {
                    return <span key={index}>{part}</span>;
                  } else {
                    const blankId = parseInt(part);
                    const blankItem = clozeItems.find(item => item.id === blankId);
                    
                    if (blankItem) {
                      return (
                        <DroppableBlank
                          key={`blank-${blankId}`}
                          id={blankId}
                          index={blankId}
                          userAnswer={blankItem.userAnswer}
                          isCorrect={blankItem.isCorrect}
                          onRemove={removeWordFromBlank}
                          isOver={overBlankId === `blank-${blankId}`}
                        />
                      );
                    }
                    return null;
                  }
                });
              })()}
            </div>
            
            {/* Word bank with draggable words */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Drag words to the blanks:
              </h4>
              <div className="flex flex-wrap gap-1 p-4 bg-blue-50/30 rounded-md border border-blue-100 min-h-[80px]">
                {shuffledWordBank.length > 0 ? (
                  shuffledWordBank.map((word, index) => (
                    <DraggableWord
                      key={`word-${word}-${index}`}
                      id={`word-${word}`}
                      word={word}
                      isUsed={usedWords.includes(word)}
                    />
                  ))
                ) : (
                  <div className="text-gray-500 italic">No word bank provided</div>
                )}
              </div>
            </div>
            
            {/* Drag overlay */}
            <DragOverlay adjustScale zIndex={100}>
              {activeId && activeId.startsWith('word-') && (
                <div className="px-3 py-1.5 rounded-md border-2 border-blue-400 bg-blue-100 text-blue-800 shadow-lg font-medium">
                  {activeId.replace('word-', '')}
                </div>
              )}
            </DragOverlay>
          </DndContext>
          
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md text-blue-800">
            <div className="flex gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Drag words from the word bank to fill in the blanks. Click on a word in a blank to remove it.
              </p>
            </div>
          </div>
          
          {/* Score display */}
          {isChecked && score && (
            <Alert 
              className={`mt-6 transition-all duration-300 ${
                score.correct === score.total 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <AlertDescription className="flex items-center gap-2">
                {score.correct === score.total ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <span className="font-medium">Score: {score.correct} out of {score.total} correct</span>
                  {score.correct !== score.total && (
                    <span className="ml-1 text-sm">
                      (Incorrect words are highlighted in red)
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Teacher notes if provided */}
          {teacherNotes && (
            <div className="mt-6 p-4 border-l-4 border-l-blue-200 bg-blue-50/30">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Teacher Notes:
              </h4>
              <p className="text-gray-700 text-sm">{teacherNotes}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 border-t p-4">
          <Button 
            variant="outline" 
            onClick={resetAnswers}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={checkAnswers}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Check Answers
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 