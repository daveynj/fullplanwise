import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Lightbulb, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Target,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "./shared/section-header";

interface PedagogicalSentenceFrame {
  languageFunction: string;
  grammarFocus: string[];
  tieredFrames: {
    emerging: {
      frame: string;
      description: string;
    };
    developing: {
      frame: string;
      description: string;
    };
    expanding: {
      frame: string;
      description: string;
    };
  };
  modelResponses: {
    emerging: string[];
    developing: string[];
    expanding: string[];
  };
  teachingNotes: {
    modelingTips: string;
    guidedPractice: string;
    independentUse: string;
    fadingStrategy: string;
  };
}

interface PedagogicalSentenceFramesSectionProps {
  section: {
    type: string;
    version?: string;
    title?: string;
    introduction?: string;
    pedagogicalFrames?: PedagogicalSentenceFrame[];
  };
}

export function PedagogicalSentenceFramesSection({ section }: PedagogicalSentenceFramesSectionProps) {
  const [expandedTeachingNotes, setExpandedTeachingNotes] = useState<{ [key: number]: boolean }>({});

  const toggleTeachingNotes = (index: number) => {
    setExpandedTeachingNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!section.pedagogicalFrames || section.pedagogicalFrames.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader 
          icon={MessageSquare}
          title={section.title || "Sentence Frames"}
          color="purple"
        />
        <Alert>
          <AlertDescription>
            No sentence frames available for this lesson.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={MessageSquare}
        title={section.title || "Structured Language Practice"}
        color="purple"
      />
      
      {section.introduction && (
        <Alert className="bg-purple-50 border-purple-200">
          <Lightbulb className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            {section.introduction}
          </AlertDescription>
        </Alert>
      )}

      {section.pedagogicalFrames.map((frame, frameIndex) => (
        <Card key={frameIndex} className="border-2 border-purple-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100">
            <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-3">
              <Target className="h-6 w-6" />
              {frame.languageFunction}
            </CardTitle>
            
            {/* Grammar Focus */}
            <div className="flex flex-wrap gap-2 mt-3">
              {frame.grammarFocus.map((focus, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="bg-white text-purple-700 border-purple-300"
                  data-testid={`grammar-focus-${frameIndex}-${idx}`}
                >
                  {focus}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Tiered Frames - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Emerging Level */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  <h4 className="font-bold text-green-900">Emerging</h4>
                </div>
                
                <div className="bg-white border border-green-300 rounded p-3 mb-3">
                  <p className="text-lg font-mono text-gray-800" data-testid={`frame-emerging-${frameIndex}`}>
                    {frame.tieredFrames.emerging.frame}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {frame.tieredFrames.emerging.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-800 uppercase">Model Responses:</p>
                  {Array.isArray(frame.modelResponses.emerging) ? (
                    frame.modelResponses.emerging.slice(0, 2).map((response, idx) => (
                      <p 
                        key={idx} 
                        className="text-sm text-gray-700 bg-white border border-green-200 rounded p-2"
                        data-testid={`model-emerging-${frameIndex}-${idx}`}
                      >
                        "{response}"
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-700 bg-white border border-green-200 rounded p-2">
                      "{frame.modelResponses.emerging}"
                    </p>
                  )}
                </div>
              </div>

              {/* Developing Level */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">Developing</h4>
                </div>
                
                <div className="bg-white border border-blue-300 rounded p-3 mb-3">
                  <p className="text-lg font-mono text-gray-800" data-testid={`frame-developing-${frameIndex}`}>
                    {frame.tieredFrames.developing.frame}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {frame.tieredFrames.developing.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-blue-800 uppercase">Model Responses:</p>
                  {Array.isArray(frame.modelResponses.developing) ? (
                    frame.modelResponses.developing.slice(0, 2).map((response, idx) => (
                      <p 
                        key={idx} 
                        className="text-sm text-gray-700 bg-white border border-blue-200 rounded p-2"
                        data-testid={`model-developing-${frameIndex}-${idx}`}
                      >
                        "{response}"
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-700 bg-white border border-blue-200 rounded p-2">
                      "{frame.modelResponses.developing}"
                    </p>
                  )}
                </div>
              </div>

              {/* Expanding Level */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-bold text-purple-900">Expanding</h4>
                </div>
                
                <div className="bg-white border border-purple-300 rounded p-3 mb-3">
                  <p className="text-lg font-mono text-gray-800" data-testid={`frame-expanding-${frameIndex}`}>
                    {frame.tieredFrames.expanding.frame}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {frame.tieredFrames.expanding.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-purple-800 uppercase">Model Responses:</p>
                  {Array.isArray(frame.modelResponses.expanding) ? (
                    frame.modelResponses.expanding.slice(0, 2).map((response, idx) => (
                      <p 
                        key={idx} 
                        className="text-sm text-gray-700 bg-white border border-purple-200 rounded p-2"
                        data-testid={`model-expanding-${frameIndex}-${idx}`}
                      >
                        "{response}"
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-700 bg-white border border-purple-200 rounded p-2">
                      "{frame.modelResponses.expanding}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Teaching Notes - Expandable */}
            <div className="border-t-2 border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={() => toggleTeachingNotes(frameIndex)}
                className="w-full justify-between"
                data-testid={`toggle-teaching-notes-${frameIndex}`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-semibold">Teaching Guidance (I Do / We Do / You Do)</span>
                </span>
                {expandedTeachingNotes[frameIndex] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {expandedTeachingNotes[frameIndex] && (
                <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">I Do</span>
                      Modeling Tips
                    </h5>
                    <p className="text-sm text-gray-700" data-testid={`modeling-tips-${frameIndex}`}>
                      {frame.teachingNotes.modelingTips}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-green-800 flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">We Do</span>
                      Guided Practice
                    </h5>
                    <p className="text-sm text-gray-700" data-testid={`guided-practice-${frameIndex}`}>
                      {frame.teachingNotes.guidedPractice}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-purple-800 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">You Do</span>
                      Independent Use
                    </h5>
                    <p className="text-sm text-gray-700" data-testid={`independent-use-${frameIndex}`}>
                      {frame.teachingNotes.independentUse}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-orange-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">Fading</span>
                      Removing the Scaffold
                    </h5>
                    <p className="text-sm text-gray-700" data-testid={`fading-strategy-${frameIndex}`}>
                      {frame.teachingNotes.fadingStrategy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
