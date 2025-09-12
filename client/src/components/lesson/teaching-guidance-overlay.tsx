import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  MousePointer, 
  BookOpen, 
  Volume2, 
  MessageCircle, 
  CheckCircle,
  ArrowRight,
  Play,
  Layout,
  ArrowLeft,
  Eye,
  Gamepad2
} from "lucide-react";

interface TeachingGuidanceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTopic?: string;
  cefrLevel?: string;
}

export function TeachingGuidanceOverlay({ 
  isOpen, 
  onClose, 
  lessonTopic,
  cefrLevel 
}: TeachingGuidanceOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const teachingSteps = [
    {
      title: "Navigate Your Lesson Interface",
      icon: <Navigation className="h-8 w-8 text-blue-500" />,
      description: "Learn how to move through lesson sections efficiently",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Section Navigation
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">• <strong>Top tabs:</strong> Click "Warmup", "Vocab Intro", "Reading", etc. to jump between sections</p>
              <p className="text-sm text-blue-700">• <strong>Bottom arrows:</strong> Use Previous/Next buttons to move step-by-step</p>
              <p className="text-sm text-blue-700">• <strong>Vocabulary navigation:</strong> Look for "1 of 5" - click arrows to go through each word</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Pro Navigation Tips
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Start with "Warmup" tab - always begin here</li>
              <li>• Use tabs to preview upcoming sections</li>
              <li>• Bottom navigation keeps students focused on current content</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Master the Warmup Section",
      icon: <MessageCircle className="h-8 w-8 text-green-500" />,
      description: "How to use warmup questions to activate prior knowledge",
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-3">Teaching Method</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600">1</Badge>
                <div>
                  <p className="font-medium text-green-800">Student reads the question aloud</p>
                  <p className="text-sm text-green-700">Let them practice reading and pronunciation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600">2</Badge>
                <div>
                  <p className="font-medium text-green-800">Student answers in their own words</p>
                  <p className="text-sm text-green-700">This activates vocabulary they already know</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600">3</Badge>
                <div>
                  <p className="font-medium text-green-800">Ask follow-up: "Can you tell me more?"</p>
                  <p className="text-sm text-green-700">Gets them talking before formal lesson content</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800"><strong>Purpose:</strong> Connect today's topic to their personal experience before introducing new vocabulary</p>
          </div>
        </div>
      )
    },
    {
      title: "Teach Vocabulary Effectively",
      icon: <Volume2 className="h-8 w-8 text-purple-500" />,
      description: "Step-by-step vocabulary introduction with pronunciation focus",
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <h4 className="font-semibold text-purple-800 mb-3">For Each Vocabulary Word</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600">1</Badge>
                <div>
                  <p className="font-medium text-purple-800">Student reads the word aloud</p>
                  <p className="text-sm text-purple-700">Correct pronunciation immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600">2</Badge>
                <div>
                  <p className="font-medium text-purple-800">Student reads the definition</p>
                  <p className="text-sm text-purple-700">Make sure they understand the meaning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600">3</Badge>
                <div>
                  <p className="font-medium text-purple-800">Read example sentences together</p>
                  <p className="text-sm text-purple-700">Show the word in context</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600">4</Badge>
                <div>
                  <p className="font-medium text-purple-800">Use arrows to go to next word</p>
                  <p className="text-sm text-purple-700">Navigate through "1 of 5" interface</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800"><strong>Key:</strong> Focus on pronunciation and seeing words in context, not memorizing definitions</p>
          </div>
        </div>
      )
    },
    {
      title: "Guide Reading & Discussion",
      icon: <BookOpen className="h-8 w-8 text-orange-500" />,
      description: "How to approach reading and facilitate comprehension questions",
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <h4 className="font-semibold text-orange-800 mb-3">Reading Approach</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-600">1</Badge>
                <div>
                  <p className="font-medium text-orange-800">Read together (paragraph by paragraph)</p>
                  <p className="text-sm text-orange-700">Take turns or read together</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-600">2</Badge>
                <div>
                  <p className="font-medium text-orange-800">Check understanding after each paragraph</p>
                  <p className="text-sm text-orange-700">"What did we just read about?"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-600">3</Badge>
                <div>
                  <p className="font-medium text-orange-800">Point out vocabulary from earlier section</p>
                  <p className="text-sm text-orange-700">"Remember this word from vocabulary?"</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Discussion Questions</h4>
            <p className="text-sm text-blue-700">Let student answer fully, then ask: "Why do you think that?" or "Can you give an example?"</p>
          </div>
        </div>
      )
    },
    {
      title: "Use Interactive Activities",
      icon: <Gamepad2 className="h-8 w-8 text-red-500" />,
      description: "How to navigate and teach with games and practice exercises",
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
            <h4 className="font-semibold text-red-800 mb-3">Activity Types & How to Use</h4>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-red-800">Word Scramble/Unscramble</h5>
                <p className="text-sm text-red-700">Student works through it, you guide when stuck</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-red-800">Fill-in-the-Blanks</h5>
                <p className="text-sm text-red-700">Read sentences together, student fills blanks</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-red-800">Sentence Frames</h5>
                <p className="text-sm text-red-700">Student completes sentences about themselves</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-red-800">Quiz Questions</h5>
                <p className="text-sm text-red-700">Ask questions, discuss student's reasoning</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-800"><strong>Navigation:</strong> Use tabs to access different activities. Each has its own instructions.</p>
          </div>
        </div>
      )
    },
    {
      title: "Quick Reference Guide",
      icon: <Eye className="h-8 w-8 text-gray-600" />,
      description: "Essential navigation and teaching reminders",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Navigation
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Top tabs for jumping sections</li>
                <li>• Bottom arrows for step-by-step</li>
                <li>• Word-by-word vocab navigation</li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Teaching Focus
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Student reads aloud</li>
                <li>• Correct pronunciation</li>
                <li>• Ask follow-up questions</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">Remember</h4>
            <p className="text-sm text-gray-700 text-center">
              Let the student do most of the talking. Your job is to guide, correct pronunciation, and ask "Why?" or "Can you tell me more?"
            </p>
          </div>
          <div className="text-center">
            <Badge className="bg-green-600 text-white px-4 py-2">You're ready to teach!</Badge>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = teachingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < teachingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <DialogTitle className="text-xl font-bold">
                {currentStepData.title}
              </DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                {currentStepData.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {teachingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {teachingSteps.length}
            </span>
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-500"
              >
                Skip Guide
              </Button>
              
              {currentStep === teachingSteps.length - 1 ? (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Teaching!
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}