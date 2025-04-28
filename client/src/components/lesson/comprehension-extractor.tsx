import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  HelpCircle, 
  Radio, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { extractComprehensionQuestions } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Interface for object-format options (for consistency with quiz-extractor)
interface ComprehensionOptionObject {
  text: string;
  correct: boolean;
}

interface ComprehensionQuestion {
  question: string;
  answer: string;
  correctAnswer?: string;
  explanation?: string;
  type?: "true-false" | "multiple-choice" | string;
  options?: Array<string | ComprehensionOptionObject>;
}

interface ComprehensionExtractorProps {
  content: any;
}

export const ComprehensionExtractor = ({ content }: ComprehensionExtractorProps) => {
  console.log("COMPREHENSION EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  console.log("COMPREHENSION EXTRACTOR CONTENT:", JSON.stringify(content, null, 2).substring(0, 500));
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  
  // Use the utility function to extract comprehension questions
  const extractedQuestions: ComprehensionQuestion[] = extractComprehensionQuestions(content);
  console.log("EXTRACTED COMPREHENSION QUESTIONS:", extractedQuestions);
  
  // Find the correct answer for the current question
  const getCorrectAnswer = (question: ComprehensionQuestion): string => {
    console.log("Getting correct answer for:", question);
    
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
        'correct' in (opt as ComprehensionOptionObject) && 
        (opt as ComprehensionOptionObject).correct === true
      );
      
      if (correctOption && typeof correctOption === 'object' && 
          'text' in (correctOption as ComprehensionOptionObject)) {
        return (correctOption as ComprehensionOptionObject).text || '';
      }
    }
    
    return '';
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
    if (activeQuestion < extractedQuestions.length - 1) {
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
  
  // Check if we have found any questions
  if (extractedQuestions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header for the comprehension section */}
        <div className="bg-purple-50 rounded-lg p-4 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-purple-600 font-medium text-lg">Comprehension</h2>
            <p className="text-gray-600 text-sm">Check understanding with targeted questions</p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <HelpCircle className="h-5 w-5" />
              Reading Comprehension Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-500">No comprehension questions available for this lesson.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* --- NEW: Standard Section Header --- */}

      <div className="bg-purple-50 rounded-lg p-4 flex items-center gap-3 border border-purple-200 shadow-sm">
          <HelpCircle className="h-7 w-7 text-purple-500 flex-shrink-0" />
          <div>
            <h2 className="text-purple-700 font-semibold text-xl">Comprehension</h2>
            <p className="text-gray-600 text-lg font-medium mt-1">
              Read the question and choose the best answer based on the text.
            </p>
          </div>
        </div>
        
      {/* --- END Header --- */}

      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <HelpCircle className="h-5 w-5" />
            Reading Comprehension Questions
          </CardTitle>
          {content.comprehension?.introduction && (
            <CardDescription>{content.comprehension.introduction}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            {/* Progress indicator */}
            <div className="bg-purple-50 p-3 rounded-md mb-4">
              <div className="text-sm text-purple-700">
                Question {activeQuestion + 1} of {extractedQuestions.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full" 
                  style={{ width: `${((activeQuestion + 1) / extractedQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 border rounded-lg">
              {extractedQuestions[activeQuestion] ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-2">Question {activeQuestion + 1}</h3>
                    <p className="text-gray-900 text-xl font-bold">{extractedQuestions[activeQuestion].question || "No question text available"}</p>
                    
                    {/* Instructions based on question type */}
                    {'type' in extractedQuestions[activeQuestion] && extractedQuestions[activeQuestion].type === "true-false" && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        Decide if the statement is true or false based on the text.
                      </p>
                    )}
                    
                    {'type' in extractedQuestions[activeQuestion] && extractedQuestions[activeQuestion].type === "multiple-choice" && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        Choose the best answer based on the text.
                      </p>
                    )}
                  </div>
                  
                  {/* Options based on question type */}
                  <div className="space-y-2 mt-4">
                    {'type' in extractedQuestions[activeQuestion] && extractedQuestions[activeQuestion].type === "true-false" && (
                      <div className="space-y-2">
                        {['True', 'False'].map((option, idx) => {
                          const isSelected = selectedOption === option;
                          const correctAnswer = getCorrectAnswer(extractedQuestions[activeQuestion]);
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
                              optionClass += " border-gray-200 hover:bg-purple-50";
                            }
                          } else {
                            optionClass += isSelected
                              ? " border-purple-500 bg-purple-50"
                              : " border-gray-200 hover:bg-purple-50";
                          }

                          return (
                            <div 
                              key={`option-${idx}`}
                              onClick={() => !submitted && setSelectedOption(option)}
                              className={optionClass}
                            >
                              <div className={`h-4 w-4 mr-3 rounded-full ${
                                isSelected ? (submitted && !isCorrect ? 'bg-red-500' : 'bg-purple-500') : 'bg-gray-200'
                              }`}></div>