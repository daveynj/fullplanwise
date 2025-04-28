import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, Shuffle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  Active,
  Over
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SentenceItem {
  id: number;
  words: string[];
  correctSentence: string;
  currentOrder: number[];
  isCorrect: boolean | null;
}

interface SentenceUnscrambleProps {
  title?: string;
  sentences: Array<{
    words: string[];
    correctSentence: string;
  }>;
  teacherNotes?: string;
}

// Sortable word component
function SortableWord({ id, word, isChecked, isCorrect, isDragging }: { 
  id: number;
  word: string;
  isChecked: boolean;
  isCorrect: boolean | null;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSortableDragging ? 10 : 1,
    opacity: isSortableDragging ? 0.8 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`px-4 py-2 rounded-md border-2 shadow-sm transition-all min-w-[60px] text-center 
        ${isChecked
          ? isCorrect 
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-red-300 bg-red-50 text-red-700"
          : isSortableDragging
            ? "border-cyan-400 bg-cyan-50 text-cyan-800 shadow-xl"
            : "border-cyan-200 bg-white text-gray-700 hover:bg-cyan-50"
        } cursor-grab active:cursor-grabbing font-medium m-1`}
    >
      <span className="text-xl font-bold">{word}</span>
    </motion.div>
  );
}

// Word display for overlay
function WordDisplay({ word, isChecked, isCorrect }: {
  word: string;
  isChecked: boolean;
  isCorrect: boolean | null;
}) {
  return (
    <div className={`px-4 py-2 rounded-md border-2 shadow-lg transform scale-105 transition-all min-w-[60px] text-center 
      ${isChecked
        ? isCorrect 
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-red-300 bg-red-50 text-red-700"
        : "border-cyan-400 bg-cyan-100 text-cyan-800"
      } font-medium`}
    >
      <span className="text-xl font-bold">{word}</span>
    </div>
  );
}

export function SentenceUnscrambleSection({ 
  title = "Sentence Unscramble", 
  sentences,
  teacherNotes
}: SentenceUnscrambleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentenceItems, setSentenceItems] = useState<SentenceItem[]>(() => {
    return sentences.map((sentence, index) => {
      // Create a shuffled order
      const indices = Array.from({ length: sentence.words.length }, (_, i) => i);
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      
      return {
        id: index,
        words: sentence.words,
        correctSentence: sentence.correctSentence,
        currentOrder: shuffled,
        isCorrect: null
      };
    });
  });
  
  const currentItem = sentenceItems[currentIndex];
  const [isChecked, setIsChecked] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum distance needed before drag starts
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Update the current sentence with new order
  const updateCurrentSentence = (newOrder: number[]) => {
    setSentenceItems(prev => 
      prev.map((item, idx) => 
        idx === currentIndex 
          ? { ...item, currentOrder: newOrder, isCorrect: null } 
          : item
      )
    );
    
    // Reset checked state when order changes
    if (isChecked) {
      setIsChecked(false);
    }
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = currentItem.currentOrder.findIndex(
        (_, i) => i === active.id
      );
      const newIndex = currentItem.currentOrder.findIndex(
        (_, i) => i === over.id
      );
      
      const newOrder = arrayMove(currentItem.currentOrder, oldIndex, newIndex);
      updateCurrentSentence(newOrder);
    }
  };
  
  // Shuffle the current sentence
  const shuffleSentence = () => {
    const shuffled = [...currentItem.currentOrder].sort(() => Math.random() - 0.5);
    updateCurrentSentence(shuffled);
  };
  
  // Check if the current sentence is correct
  const checkSentence = () => {
    // Construct the current sentence
    const currentSentence = currentItem.currentOrder
      .map(idx => currentItem.words[idx])
      .join(' ')
      .toLowerCase()
      .replace(/[.,?!;:]/g, '') // Remove punctuation for comparison
      .trim();
      
    // Get the correct sentence without punctuation
    const correctSentence = currentItem.correctSentence
      .toLowerCase()
      .replace(/[.,?!;:]/g, '')
      .trim();
    
    const isCorrect = currentSentence === correctSentence;
    
    setSentenceItems(prev => 
      prev.map((item, idx) => 
        idx === currentIndex ? { ...item, isCorrect } : item
      )
    );
    
    setIsChecked(true);
  };
  
  // Navigate to previous sentence
  const prevSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsChecked(false);
    }
  };
  
  // Navigate to next sentence
  const nextSentence = () => {
    if (currentIndex < sentenceItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsChecked(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = ((currentIndex + 1) / sentenceItems.length) * 100;
  
  return (
    <div className="sentence-unscramble">
      <Card className="mb-6 border-l-4 border-l-cyan-400 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-cyan-500" />
              <CardTitle>{title}</CardTitle>
            </div>
            <Badge 
              variant="outline" 
              className="bg-cyan-100 text-cyan-600 border-cyan-200"
            >
              {currentIndex + 1} of {sentenceItems.length}
            </Badge>
          </div>
          <CardDescription>
            Drag and drop the words to form a correct sentence.
          </CardDescription>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-cyan-400 transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-cyan-50 border border-cyan-100 rounded-md text-cyan-800">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Drag and drop the words to rearrange them into a grammatically correct sentence.
              </p>
            </div>
          </div>
          
          {/* Word tiles with drag and drop */}
          <div className="mb-6 p-4 bg-white rounded-md border border-cyan-100">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={currentItem.currentOrder.map((_, index) => index)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap justify-center gap-2 min-h-[60px] relative">
                  {/* Drop indicator line */}
                  {activeId !== null && (
                    <div className="absolute inset-0 border-2 border-dashed border-cyan-300 rounded-md pointer-events-none" />
                  )}
                  
                  {currentItem.currentOrder.map((wordIndex, index) => (
                    <SortableWord
                      key={index}
                      id={index}
                      word={currentItem.words[wordIndex]}
                      isChecked={isChecked}
                      isCorrect={currentItem.isCorrect}
                    />
                  ))}
                </div>
              </SortableContext>
              
              {/* Drag overlay */}
              <DragOverlay adjustScale={true} zIndex={100}>
                {activeId !== null && (
                  <WordDisplay 
                    word={currentItem.words[currentItem.currentOrder[activeId]]}
                    isChecked={isChecked}
                    isCorrect={currentItem.isCorrect}
                  />
                )}
              </DragOverlay>
            </DndContext>
          </div>
          
          {/* Current sentence preview */}
          <div className="mb-6 p-4 bg-white rounded-md border border-cyan-200 text-lg text-center font-medium">
            {currentItem.currentOrder.map(idx => currentItem.words[idx]).join(' ')}
          </div>
          
          {/* Feedback */}
          {isChecked && (
            <Alert 
              className={`mb-6 transition-all duration-300 ${
                currentItem.isCorrect 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <AlertDescription className="flex items-center gap-3">
                {currentItem.isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Correct! Your sentence is properly formed.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Not quite right.</p> 
                      <p className="text-sm mt-1">The correct sentence should be:</p>
                      <p className="mt-1 p-2 bg-white/50 rounded border border-red-100 text-gray-700">
                        "{currentItem.correctSentence}"
                      </p>
                    </div>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Teacher notes if provided */}
          {teacherNotes && (
            <div className="mt-6 p-4 border-l-4 border-l-cyan-200 bg-cyan-50/30">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Teacher Notes:
              </h4>
              <p className="text-gray-700 text-sm">{teacherNotes}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 border-t p-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={shuffleSentence}
              className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
            <Button 
              onClick={checkSentence}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Check Sentence
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={prevSentence}
              disabled={currentIndex === 0}
              className={currentIndex === 0 ? "opacity-50" : "border-gray-200 text-gray-700"}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={nextSentence}
              disabled={currentIndex === sentenceItems.length - 1}
              className={currentIndex === sentenceItems.length - 1 ? "opacity-50" : "border-gray-200 text-gray-700"}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 