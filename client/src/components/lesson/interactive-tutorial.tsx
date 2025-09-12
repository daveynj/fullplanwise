import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ChevronRight, 
  Lightbulb, 
  MousePointer, 
  Eye,
  Target,
  BookOpen,
  MessageCircle,
  ArrowRight,
  Navigation,
  Play
} from "lucide-react";

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTopic?: string;
  cefrLevel?: string;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // data-testid selector
  instruction: string;
  icon: React.ReactNode;
  color: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForClick: boolean;
  skipToTab?: string; // Optional: which tab to switch to before showing this step
}

export function InteractiveTutorial({ 
  isOpen, 
  onClose, 
  lessonTopic,
  cefrLevel 
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialSteps] = useState<TutorialStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to Your Interactive Lesson!',
      description: 'Let me show you how to navigate and teach with this lesson interface.',
      targetSelector: '',
      instruction: 'Click "Start Tour" to begin the interactive guide.',
      icon: <Play className="h-6 w-6" />,
      color: 'blue',
      position: 'center',
      waitForClick: false
    },
    {
      id: 'warmup-tab',
      title: 'Start with Warmup Questions',
      description: 'Always begin lessons with warmup to activate prior knowledge.',
      targetSelector: '[data-testid="tab-warmup"]',
      instruction: 'Click the "Warmup" tab to see the lesson warmup questions.',
      icon: <MessageCircle className="h-6 w-6" />,
      color: 'green',
      position: 'bottom',
      waitForClick: true
    },
    {
      id: 'vocab-tab',
      title: 'Introduce New Vocabulary',
      description: 'Move to vocabulary after warmup to pre-teach essential words.',
      targetSelector: '[data-testid="tab-vocabulary"]',
      instruction: 'Click the "Vocabulary" tab to view the vocabulary introduction.',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'amber',
      position: 'bottom',
      waitForClick: true,
      skipToTab: 'vocabulary'
    },
    {
      id: 'vocab-navigation',
      title: 'Navigate Through Vocabulary Words',
      description: 'Use the arrows to go through each vocabulary word with your student.',
      targetSelector: '[data-testid="vocab-nav-next"]',
      instruction: 'Click the right arrow to move to the next vocabulary word.',
      icon: <ChevronRight className="h-6 w-6" />,
      color: 'amber',
      position: 'top',
      waitForClick: true
    },
    {
      id: 'reading-tab',
      title: 'Practice Reading Together',
      description: 'After vocabulary, move to reading to see words in context.',
      targetSelector: '[data-testid="tab-reading"]',
      instruction: 'Click the "Reading" tab to access the reading passage.',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'blue',
      position: 'bottom',
      waitForClick: true
    },
    {
      id: 'discussion-tab',
      title: 'Encourage Discussion',
      description: 'End with discussion questions to promote critical thinking.',
      targetSelector: '[data-testid="tab-discussion"]',
      instruction: 'Click the "Discussion" tab to see conversation questions.',
      icon: <MessageCircle className="h-6 w-6" />,
      color: 'purple',
      position: 'bottom',
      waitForClick: true
    },
    {
      id: 'bottom-navigation',
      title: 'Use Bottom Navigation',
      description: 'Bottom arrows help students focus on current section content.',
      targetSelector: '[data-testid="section-nav-next"]',
      instruction: 'Click "Next" to guide students step-by-step through sections.',
      icon: <Navigation className="h-6 w-6" />,
      color: 'gray',
      position: 'top',
      waitForClick: true
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Teach!',
      description: 'Remember: Let students do most of the talking. Guide, correct pronunciation, and ask "Why?" or "Can you tell me more?"',
      targetSelector: '',
      instruction: 'You now know how to navigate the lesson interface effectively.',
      icon: <Target className="h-6 w-6" />,
      color: 'green',
      position: 'center',
      waitForClick: false
    }
  ]);

  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tutorialRef = useRef<HTMLDivElement>(null);

  const currentStepData = tutorialSteps[currentStep];

  // Function to find and highlight the target element
  const highlightTarget = (selector: string) => {
    if (!selector) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      
      // Calculate tooltip position based on element position and step position preference
      const rect = element.getBoundingClientRect();
      const tooltipOffset = 20;
      
      let x = 0, y = 0;
      
      switch (currentStepData.position) {
        case 'top':
          x = rect.left + (rect.width / 2);
          y = rect.top - tooltipOffset;
          break;
        case 'bottom':
          x = rect.left + (rect.width / 2);
          y = rect.bottom + tooltipOffset;
          break;
        case 'left':
          x = rect.left - tooltipOffset;
          y = rect.top + (rect.height / 2);
          break;
        case 'right':
          x = rect.right + tooltipOffset;
          y = rect.top + (rect.height / 2);
          break;
        case 'center':
        default:
          x = window.innerWidth / 2;
          y = window.innerHeight / 2;
          break;
      }
      
      setTooltipPosition({ x, y });
    } else {
      console.warn(`Tutorial: Could not find element with selector: ${selector}`);
      setHighlightedElement(null);
    }
  };

  // Effect to highlight the current step's target
  useEffect(() => {
    if (isOpen && currentStepData) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        highlightTarget(currentStepData.targetSelector);
      }, 300);
    }
  }, [currentStep, isOpen, currentStepData]);

  // Effect to handle clicks on highlighted elements
  useEffect(() => {
    if (!isOpen || !currentStepData.waitForClick || !highlightedElement) return;

    const handleClick = (event: Event) => {
      // Allow the click to perform its normal action first
      // DO NOT prevent default or stop propagation
      
      // Add a small delay to let the UI action complete before advancing tutorial
      setTimeout(() => {
        // Move to next step after the UI has had time to update
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onClose();
        }
      }, 150); // Short delay to let UI actions complete
    };

    // Use normal event listening, not capture mode
    highlightedElement.addEventListener('click', handleClick, false);

    return () => {
      highlightedElement.removeEventListener('click', handleClick, false);
    };
  }, [isOpen, currentStepData, highlightedElement, currentStep, tutorialSteps.length, onClose]);

  // Function to switch to a specific tab (for steps that require it)
  // Removed automatic tab switching - let users click naturally during tutorial

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop/Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        style={{ pointerEvents: 'none' }}
      >
        {/* Spotlight effect around highlighted element */}
        {highlightedElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute border-4 border-white rounded-lg shadow-lg pointer-events-none"
            style={{
              left: highlightedElement.getBoundingClientRect().left - 8,
              top: highlightedElement.getBoundingClientRect().top - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.8)`,
            }}
          />
        )}
      </motion.div>

      {/* Tutorial Tooltip */}
      <motion.div
        ref={tutorialRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: currentStepData.position === 'center' ? '50%' : tooltipPosition.x,
          top: currentStepData.position === 'center' ? '50%' : tooltipPosition.y,
          transform: currentStepData.position === 'center' ? 'translate(-50%, -50%)' : 
                    currentStepData.position === 'top' ? 'translate(-50%, -100%)' :
                    currentStepData.position === 'bottom' ? 'translate(-50%, 0%)' :
                    currentStepData.position === 'left' ? 'translate(-100%, -50%)' :
                    currentStepData.position === 'right' ? 'translate(0%, -50%)' : 'none'
        }}
      >
        <Card className="w-80 max-w-[90vw] shadow-2xl border-2">
          <CardHeader className={`bg-${currentStepData.color}-50 border-b border-${currentStepData.color}-200`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${currentStepData.color}-100 rounded-full`}>
                  {currentStepData.icon}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{currentStepData.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{currentStepData.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentStep
                          ? `bg-${currentStepData.color}-500`
                          : index < currentStep
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </span>
              </div>

              {/* Instruction */}
              <div className={`p-3 bg-${currentStepData.color}-50 rounded-lg border border-${currentStepData.color}-200`}>
                <div className="flex items-start gap-2">
                  {currentStepData.waitForClick ? (
                    <MousePointer className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Eye className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium">{currentStepData.instruction}</p>
                </div>
              </div>

              {/* Teaching tip */}
              {currentStepData.id === 'vocab-navigation' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>Teaching Tip:</strong> For each word, have the student read aloud, then discuss the definition and examples together.
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500 text-sm"
                >
                  Skip Tutorial
                </Button>
                
                {!currentStepData.waitForClick && (
                  <Button
                    onClick={handleNext}
                    className={`bg-${currentStepData.color}-600 hover:bg-${currentStepData.color}-700`}
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      'Start Teaching!'
                    ) : currentStep === 0 ? (
                      <>Start Tour <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                )}
                
                {currentStepData.waitForClick && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Click the highlighted element to continue</p>
                    <div className="flex items-center gap-1 text-blue-600">
                      <MousePointer className="h-3 w-3" />
                      <span className="text-xs font-medium">Waiting for click...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}