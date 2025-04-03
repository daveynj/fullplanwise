import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  CheckSquare, 
  Lightbulb, 
  ExternalLink,
  GraduationCap
} from "lucide-react";
import { extractQuizQuestions } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  answer: string;
  type?: "true-false" | "multiple-choice" | string;
  options?: string[];
}

interface QuizExtractorProps {
  content: any;
}

export const QuizExtractor = ({ content, sectionType = "quiz" }: QuizExtractorProps & { sectionType?: string }) => {
  console.log("QUIZ EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  console.log("QUIZ EXTRACTOR CONTENT:", JSON.stringify(content, null, 2).substring(0, 500));
  const [activeQuestion, setActiveQuestion] = useState(0);
  
  // Use our utility function to extract quiz questions
  const questions: QuizQuestion[] = extractQuizQuestions(content);
  console.log("EXTRACTED QUIZ QUESTIONS:", questions);
  
  // Try to find section title and introduction
  const quizSection = content.sections?.find((s: any) => s.type === 'quiz' || s.type === 'assessment');
  const title = quizSection?.title || `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`;
  const introduction = quizSection?.introduction || "Test knowledge and understanding of the lesson";
  
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-cyan-50">
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <CheckSquare className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {introduction}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-500">No quiz questions available for this lesson.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-cyan-50">
          <CardTitle className="flex items-center gap-2 text-cyan-700">
            <CheckSquare className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {introduction}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Multiple Choice</span>
              <div className="flex gap-2">
                <button className="w-6 h-6">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-6 h-6">
                  <Lightbulb className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="bg-cyan-50 p-3 rounded-md mb-4">
              <div className="text-sm text-cyan-700">
                Question {activeQuestion + 1} of {questions.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-cyan-600 h-1.5 rounded-full" 
                  style={{ width: `${((activeQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Question */}
            <div className="border rounded-lg p-5">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Question {activeQuestion + 1}</h3>
                <p>{questions[activeQuestion].question}</p>
                <p className="text-sm text-gray-500 mt-1">Choose the best answer.</p>
              </div>
              
              {/* Options */}
              <div className="space-y-3">
                {questions[activeQuestion] && 
                 Array.isArray(questions[activeQuestion].options) && 
                 questions[activeQuestion].options!.length > 0 ? (
                  questions[activeQuestion].options!.map((option: string, idx: number) => (
                    <div 
                      key={`quiz-option-${idx}`} 
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                        {['A', 'B', 'C', 'D'][idx]}
                      </div>
                      <span>{option}</span>
                    </div>
                  ))
                ) : (
                  // Default options if none are provided
                  ['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div 
                      key={`quiz-option-${idx}`} 
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                        {letter}
                      </div>
                      <span>Option {letter}</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button 
                  onClick={() => setActiveQuestion(prev => (prev > 0 ? prev - 1 : prev))}
                  disabled={activeQuestion === 0}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                  Previous
                </button>
                <button 
                  onClick={() => setActiveQuestion(prev => (prev < questions.length - 1 ? prev + 1 : prev))}
                  disabled={activeQuestion === questions.length - 1}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Teacher notes */}
      {quizSection?.teacherNotes && (
        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
              <GraduationCap className="h-4 w-4" />
              Teacher Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-gray-700">
            <p>{quizSection.teacherNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};