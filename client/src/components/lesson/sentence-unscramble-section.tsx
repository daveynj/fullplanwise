import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, Shuffle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./shared/section-header";
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

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Shuffle}
        title={title}
        description="Drag and drop the words to form a correct sentence."
        color="cyan"
      />
      
      <Card className="overflow-hidden border-cyan-200">
        <CardHeader className="bg-cyan-50 border-b border-cyan-100 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-cyan-700 flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-100 border-cyan-200">
                {currentIndex + 1} / {sentenceItems.length}
              </Badge>
              <span>Sentence {currentIndex + 1}</span>
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={prevSentence} 
                disabled={currentIndex === 0}
                className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-100"
              >
                Previous
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={nextSentence} 
                disabled={currentIndex === sentenceItems.length - 1}
                className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-100"
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-8">
            {/* Draggable words area */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-wrap justify-center items-center min-h-[100px] p-4 rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/50 w-full">
                <SortableContext 
                  items={Array.from({ length: currentItem.currentOrder.length }, (_, index) => index)}
                  strategy={horizontalListSortingStrategy}
                >
                  {currentItem.currentOrder.map((wordIndex, index) => (
                    <SortableWord
                      key={index}
                      id={index}
                      word={currentItem.words[wordIndex]}
                      isChecked={isChecked}
                      isCorrect={currentItem.isCorrect}
                    />
                  ))}
                </SortableContext>
                
                {/* Drag overlay */}
                <DragOverlay adjustScale={true} zIndex={100}>
                  {activeId !== null && (
                    <WordDisplay 
                      word={currentItem.words[currentItem.currentOrder[activeId as number]]}
                      isChecked={isChecked}
                      isCorrect={currentItem.isCorrect}
                    />
                  )}
                </DragOverlay>
              </div>
            </DndContext>
            
            {/* Feedback area */}
            {isChecked && (
              <Alert
                className={`${
                  currentItem.isCorrect
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {currentItem.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <AlertDescription className="font-medium">
                    {currentItem.isCorrect
                      ? "Correct! Well done."
                      : "Not quite right. Try again."}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {/* Correct answer display (when wrong) */}
            {isChecked && !currentItem.isCorrect && (
              <div className="w-full p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Correct sentence:
                </p>
                <p className="text-gray-800 text-xl font-bold">
                  {currentItem.correctSentence}
                </p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Button
                onClick={shuffleSentence}
                variant="outline"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
              
              <Button
                onClick={checkSentence}
                variant="default"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Answer
              </Button>
            </div>
          </div>
        </CardContent>
        
        {currentIndex === sentenceItems.length - 1 && (
          <CardFooter className="bg-cyan-50/50 border-t border-cyan-100 p-4">
            <p className="text-green-700 font-medium w-full text-center">
              Great job! You've completed all the sentences.
            </p>
          </CardFooter>
        )}
      </Card>
      
      {/* Teacher notes */}
      {teacherNotes && (
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Teacher Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-gray-700">{teacherNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 