import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MessageSquare, 
  Users, 
  Target, 
  BookOpen, 
  CheckCircle,
  ArrowRight,
  Play
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
      title: "Your Lesson is Ready!",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      description: "This is a conversation-based lesson designed to get your student talking",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-800 mb-2">Key Difference</h4>
            <p className="text-blue-700">
              This isn't a grammar drill or textbook exercise. It's a <strong>conversation catalyst</strong> 
              that uses {lessonTopic} to naturally practice {cefrLevel} level English.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <h5 className="font-semibold text-red-600 mb-1">Traditional Lessons</h5>
              <p className="text-sm text-red-500">Drill exercises, fill-in-blanks</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <h5 className="font-semibold text-green-600 mb-1">Your PlanwiseESL Lesson</h5>
              <p className="text-sm text-green-500">Natural conversation practice</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Perfect 60-Minute Lesson Flow",
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      description: "Follow this timing to keep conversations flowing naturally",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary">5 min</Badge>
            <div>
              <h4 className="font-medium">Warm-up Questions</h4>
              <p className="text-sm text-gray-600">Get them talking immediately - use personal connection questions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary">10 min</Badge>
            <div>
              <h4 className="font-medium">Vocabulary Introduction</h4>
              <p className="text-sm text-gray-600">Introduce words through examples, not definitions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary">20 min</Badge>
            <div>
              <h4 className="font-medium">Reading & Discussion</h4>
              <p className="text-sm text-gray-600">Read together, then dive into discussion questions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary">15 min</Badge>
            <div>
              <h4 className="font-medium">Practice Activities</h4>
              <p className="text-sm text-gray-600">Interactive exercises to reinforce vocabulary</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary">10 min</Badge>
            <div>
              <h4 className="font-medium">Wrap-up & Application</h4>
              <p className="text-sm text-gray-600">Connect lesson to their real life</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Make It Conversational",
      icon: <MessageSquare className="h-8 w-8 text-purple-500" />,
      description: "Transform lesson content into natural conversation",
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3">Conversation Starters</h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Instead of:</strong> "What does 'challenging' mean?"</p>
              <p className="text-sm text-purple-700"><strong>Try:</strong> "Tell me about something challenging you did recently..."</p>
              <hr className="my-2 border-purple-200" />
              <p className="text-sm"><strong>Instead of:</strong> "Read this text out loud"</p>
              <p className="text-sm text-purple-700"><strong>Try:</strong> "This reminds me of... what do you think about...?"</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Card className="p-3">
              <h5 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Keep It Natural
              </h5>
              <p className="text-sm text-gray-600 mt-1">
                Let the conversation flow based on their responses. Use the lesson as a guide, not a script.
              </p>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "You're Ready to Teach!",
      icon: <Play className="h-8 w-8 text-green-500" />,
      description: "Start with confidence - your lesson is designed for conversation success",
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Quick Confidence Boosters</h4>
            <ul className="space-y-2 text-green-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-sm">The vocabulary is perfectly chosen for natural conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-sm">Discussion questions are designed to get students talking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-sm">Grammar is integrated naturally, not forced</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-sm">Activities are interactive and engaging</span>
              </li>
            </ul>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">
              Remember: Your role is to facilitate conversation, not lecture.
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Let your student do 70% of the talking - you guide and encourage!
            </p>
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