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
  lessonContent: any;
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
  onBefore?: () => void; // Optional: function to run before showing this step
}

export function InteractiveTutorial({ 
  isOpen, 
  onClose, 
  lessonTopic,
  cefrLevel,
  lessonContent
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);

  useEffect(() => {
    const allPossibleSteps: TutorialStep[] = [
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
        id: 'tabs-intro',
        title: 'Lesson Tab Navigation',
        description: 'Use the tabs at the top to jump to any section of your lesson.',
        targetSelector: '[data-testid="lesson-tabs-list"]',
        instruction: 'These tabs let you control the lesson flow. Let\'s start by going to the "Warmup" section.',
        icon: <Navigation className="h-6 w-6" />,
        color: 'blue',
        position: 'bottom',
        waitForClick: false,
      },
      {
        id: 'warmup-tab',
        title: 'Go to the Warmup Section',
        description: 'Lessons always start with a warmup to engage students.',
        targetSelector: '[data-testid="tab-warmup"]',
        instruction: 'Click the "Warmup" tab to begin.',
        icon: <MessageCircle className="h-6 w-6" />,
        color: 'green',
        position: 'bottom',
        waitForClick: true
      },
      {
        id: 'bottom-nav-intro',
        title: 'Step-by-Step Navigation',
        description: 'You can also move through the lesson sequentially using the arrows at the bottom.',
        targetSelector: '[data-testid="section-nav-next"]',
        instruction: 'This is great for keeping students focused. Click "Next" to proceed to the vocabulary section.',
        icon: <ChevronRight className="h-6 w-6" />,
        color: 'gray',
        position: 'top',
        waitForClick: true,
      },
      {
        id: 'vocab-intro',
        title: 'Vocabulary Section',
        description: 'This section introduces key vocabulary. You can navigate through words here.',
        targetSelector: '[data-testid="vocab-card"]',
        instruction: 'Use the small arrows on the vocabulary card to see each word.',
        icon: <BookOpen className="h-6 w-6" />,
        color: 'amber',
        position: 'bottom',
        waitForClick: false,
      },
      {
        id: 'vocab-navigation',
        title: 'Navigate Through Vocabulary',
        description: 'Let\'s try moving to the next word.',
        targetSelector: '[data-testid="vocab-nav-next"]',
        instruction: 'Click the right arrow to see the next word.',
        icon: <ChevronRight className="h-6 w-6" />,
        color: 'amber',
        position: 'right',
        waitForClick: true,
      },
      {
        id: 'freestyle-nav',
        title: 'You\'re in Control',
        description: 'Now you know the two ways to navigate your lesson!',
        targetSelector: '[data-testid="lesson-tabs-list"]',
        instruction: 'Feel free to use the tabs to jump to any section, or the arrows to move step-by-step.',
        icon: <MousePointer className="h-6 w-6" />,
        color: 'purple',
        position: 'bottom',
        waitForClick: false,
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
    ];

    if (!lessonContent || !lessonContent.sections) {
      setTutorialSteps(allPossibleSteps);
      return;
    }

    const availableTabIds = lessonContent.sections.map((s: any) => s.type);

    const dynamicSteps = allPossibleSteps.filter(step => {
      if (step.id === 'warmup-tab') {
        return availableTabIds.includes('warmup') || availableTabIds.includes('warm-up');
      }
      if (step.id === 'vocab-intro' || step.id === 'vocab-navigation') {
        return availableTabIds.includes('vocabulary');
      }
      if (step.id.endsWith('-tab')) {
        const tabId = step.id.replace('-tab', '');
        return availableTabIds.includes(tabId);
      }
      return true;
    });

    setTutorialSteps(dynamicSteps);
  }, [lessonContent]);
  
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [highlightStyle, setHighlightStyle] = useState({});
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
    } else {
      console.warn(`Tutorial: Could not find element with selector: ${selector}`);
      setHighlightedElement(null);
    }
  };

  const updatePositions = () => {
    if (!highlightedElement || !currentStepData) {
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = highlightedElement.getBoundingClientRect();
    
    setHighlightStyle({
      left: rect.left - 8,
      top: rect.top - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    });

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
  };


  // Effect to highlight the current step's target
  useEffect(() => {
    if (isOpen && currentStepData) {
      if (currentStepData.onBefore) {
        currentStepData.onBefore();
      }
      // Use rAF to wait for layout to be stable
      requestAnimationFrame(() => {
        setTimeout(() => {
          highlightTarget(currentStepData.targetSelector);
        }, 100); // A small extra delay after click seems to help
      });
    }
  }, [currentStep, isOpen, currentStepData]);

  // Effect to update tooltip on element or window change
  useEffect(() => {
    if (!highlightedElement) {
      setHighlightStyle({ display: 'none' });
      return;
    };
    updatePositions();

    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true); // Use capture to get all scroll events

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [highlightedElement, currentStepData]);


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

  if (!isOpen || tutorialSteps.length === 0) return null;

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
              ...highlightStyle,
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