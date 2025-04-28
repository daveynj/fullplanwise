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
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { SectionHeader } from "./shared/section-header";
import { extractQuizQuestions } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Utility function to normalize text for more flexible matching
const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Remove punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    // Replace multiple spaces with single space
    .replace(/\s{2,}/g, " ");
};

// Interface for object-format options (legacy support)
interface QuizOptionObject {
  text: string;
  correct: boolean;
}

interface QuizQuestion {
  question: string;
  answer: string;
  correctAnswer?: string;
  explanation?: string;
  type?: "true-false" | "multiple-choice" | string;
  options?: Array<string | QuizOptionObject>;
}

interface QuizExtractorProps {
  content: any;
}

export const QuizExtractor = ({ content, sectionType = "quiz" }: QuizExtractorProps & { sectionType?: string }) => {
  console.log("QUIZ EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  console.log("QUIZ EXTRACTOR CONTENT:", JSON.stringify(content, null, 2).substring(0, 500));
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  
  // Use our utility function to extract quiz questions
  const questions: QuizQuestion[] = extractQuizQuestions(content);
  console.log("EXTRACTED QUIZ QUESTIONS:", questions);
  
  // Try to find section title and introduction
  const quizSection = content.sections?.find((s: any) => s.type === 'quiz' || s.type === 'assessment');
  const title = quizSection?.title || `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`;
  const introduction = quizSection?.introduction || "Test knowledge and understanding of the lesson";

  // Find the correct answer for the current question
  const getCorrectAnswer = (question: QuizQuestion): string => {
    console.log("Question data:", question);
    console.log("Correct answer field:", question.correctAnswer);
    console.log("Answer field:", question.answer);
    
    // Check for various formats of correctAnswer
    if (question.correctAnswer) {
      return question.correctAnswer;
    }
    
    // Some AI responses use 'answer' field
    if (question.answer) {
      return question.answer;
    }
    
    // If the question has options and one is marked as "correct" (object format)
    if (question.options && Array.isArray(question.options)) {
      // Check for object format options (legacy format support)
      const correctOption = question.options.find(opt => 
        typeof opt === 'object' && opt !== null && 
        'correct' in (opt as QuizOptionObject) && 
        (opt as QuizOptionObject).correct === true
      );
      
      if (correctOption && typeof correctOption === 'object' && 
          'text' in (correctOption as QuizOptionObject)) {
        return (correctOption as QuizOptionObject).text || '';
      }
    }
    
    return '';
  };

  // Check if the selected answer is correct
  const isAnswerCorrect = (): boolean => {
    if (!selectedOption) return false;
    
    const correctAnswer = getCorrectAnswer(questions[activeQuestion]);
    console.log("Comparing answers:", {
      selected: selectedOption,
      correct: correctAnswer,
      isMatch: selectedOption === correctAnswer,
      normalizedMatch: selectedOption.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    });
    
    // Try case-insensitive matching as AI responses might have different casing
    return selectedOption.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  };

  // Handle submitting an answer
  const handleSubmit = () => {
    if (!selectedOption) return;
    
    // Update the user answers array
    const newUserAnswers = [...userAnswers];
    newUserAnswers[activeQuestion] = selectedOption;
    setUserAnswers(newUserAnswers);
    
    setSubmitted(true);
  };

  // Move to the next question
  const handleNext = () => {
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(prev => prev + 1);
      setSelectedOption(userAnswers[activeQuestion + 1] || null);
      setSubmitted(false);
    }
  };

  // Move to the previous question
  const handlePrevious = () => {
    if (activeQuestion > 0) {
      setActiveQuestion(prev => prev - 1);
      setSelectedOption(userAnswers[activeQuestion - 1] || null);
      setSubmitted(false);
    }
  };
  
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={CheckSquare}
          title={title}
          description={introduction}
          color="cyan"
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No quiz questions available for this lesson.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CheckSquare}
        title={title}
        description={introduction}
        color="cyan"
      />

      <Card>
        <CardHeader className="bg-cyan-50">
          <CardTitle className="flex items-center gap-2 text-cyan-700">
            <CheckSquare className="h-5 w-5" />
            Progress
          </CardTitle>
          <CardDescription>
            Track your quiz progress
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
                <p className="text-xl font-bold">{questions[activeQuestion].question}</p>
                <p className="text-sm text-gray-500 mt-1">Choose the best answer.</p>
              </div>
              
              {/* Options */}
              <div className="space-y-3">
                {questions[activeQuestion] && 
                 Array.isArray(questions[activeQuestion].options) && 
                 questions[activeQuestion].options!.length > 0 ? (
                  questions[activeQuestion].options!.map((option: string | QuizOptionObject, idx: number) => {
                    // Handle both string and object options
                    const optionText = typeof option === 'string' 
                      ? option 
                      : (option as QuizOptionObject).text || '';
                    
                    const isSelected = selectedOption === optionText;
                    const correctAnswer = getCorrectAnswer(questions[activeQuestion]);
                    const isCorrect = optionText === correctAnswer;
                    
                    let optionClass = "flex items-center p-3 border rounded-md cursor-pointer";
                    
                    if (submitted) {
                      if (isSelected && isCorrect) {
                        optionClass += " border-green-500 bg-green-50";
                      } else if (isSelected && !isCorrect) {
                        optionClass += " border-red-500 bg-red-50";
                      } else if (isCorrect) {
                        optionClass += " border-green-500 bg-green-50 opacity-70";
                      } else {
                        optionClass += " border-gray-200 hover:bg-gray-50";
                      }
                    } else {
                      optionClass += isSelected
                        ? " border-cyan-500 bg-cyan-50"
                        : " border-gray-200 hover:bg-gray-50";
                    }

                    return (
                      <div 
                        key={`quiz-option-${idx}`} 
                        className={optionClass}
                        onClick={() => !submitted && setSelectedOption(optionText)}
                      >
                        <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                          {['A', 'B', 'C', 'D'][idx]}
                        </div>
                        <span className="text-xl font-bold">{optionText}</span>
                        
                        {submitted && isCorrect && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                        )}
                        
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="ml-auto h-5 w-5 text-red-500" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Default options if none are provided
                  ['True', 'False'].map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const correctAnswer = getCorrectAnswer(questions[activeQuestion]);
                    const isCorrect = option === correctAnswer;
                    
                    let optionClass = "flex items-center p-3 border rounded-md cursor-pointer";
                    
                    if (submitted) {
                      if (isSelected && isCorrect) {
                        optionClass += " border-green-500 bg-green-50";
                      } else if (isSelected && !isCorrect) {
                        optionClass += " border-red-500 bg-red-50";
                      } else if (isCorrect) {
                        optionClass += " border-green-500 bg-green-50 opacity-70";
                      } else {
                        optionClass += " border-gray-200 hover:bg-gray-50";
                      }
                    } else {
                      optionClass += isSelected
                        ? " border-cyan-500 bg-cyan-50"
                        : " border-gray-200 hover:bg-gray-50";
                    }

                    return (
                      <div 
                        key={`quiz-option-${idx}`} 
                        className={optionClass}
                        onClick={() => !submitted && setSelectedOption(option)}
                      >
                        <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                          {['A', 'B'][idx]}
                        </div>
                        <span className="text-xl font-bold">{option}</span>
                        
                        {submitted && isCorrect && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                        )}
                        
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="ml-auto h-5 w-5 text-red-500" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Explanation after submission */}
              {submitted && questions[activeQuestion].explanation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-700">Explanation</p>
                      <p className="text-sm text-blue-800">{questions[activeQuestion].explanation}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Submit or Continue Button */}
              <div className="mt-6 flex justify-center">
                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-md disabled:opacity-50"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={activeQuestion === questions.length - 1}
                    className="px-6 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                  >
                    Continue
                  </Button>
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between mt-4">
                <button 
                  onClick={handlePrevious}
                  disabled={activeQuestion === 0}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                  Previous
                </button>
                <button 
                  onClick={handleNext}
                  disabled={activeQuestion === questions.length - 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1"
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