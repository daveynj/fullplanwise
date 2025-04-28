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
import { SectionHeader } from "./shared/section-header";

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
        <SectionHeader
          title="Comprehension"
          description="Check understanding with targeted questions"
          icon={HelpCircle}
          color="purple"
        />
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No comprehension questions available for this lesson.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <HelpCircle className="h-5 w-5" />
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
                              <span className="font-medium">{option}</span>
                              
                              {submitted && (
                                <div className="ml-auto">
                                  {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                                  {!isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 opacity-70" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {'type' in extractedQuestions[activeQuestion] && extractedQuestions[activeQuestion].type !== "true-false" && (
                      <div className="space-y-2">
                        {extractedQuestions[activeQuestion].options && extractedQuestions[activeQuestion].options.map((option, idx) => {
                          // Handle options that might be plain strings or objects
                          const optionText = typeof option === 'object' && option !== null ? 
                            option.text || 'No text available' : option || 'No text available';
                          
                          const isSelected = selectedOption === optionText;
                          const correctAnswer = getCorrectAnswer(extractedQuestions[activeQuestion]);
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
                              onClick={() => !submitted && setSelectedOption(optionText)}
                              className={optionClass}
                            >
                              <div className={`h-4 w-4 mr-3 rounded-full ${
                                isSelected ? (submitted && !isCorrect ? 'bg-red-500' : 'bg-purple-500') : 'bg-gray-200'
                              }`}></div>
                              <span className="font-medium">{optionText}</span>
                              
                              {submitted && (
                                <div className="ml-auto">
                                  {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                                  {!isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 opacity-70" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Feedback area */}
                  {submitted && (
                    <div className={`mt-4 p-4 rounded-md ${
                      getCorrectAnswer(extractedQuestions[activeQuestion]) === selectedOption
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      {getCorrectAnswer(extractedQuestions[activeQuestion]) === selectedOption ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">
                              Correct!
                            </p>
                            {extractedQuestions[activeQuestion].explanation && (
                              <p className="text-sm text-green-700 mt-1">
                                {extractedQuestions[activeQuestion].explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">
                              Incorrect
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              The correct answer is: <span className="font-medium">{getCorrectAnswer(extractedQuestions[activeQuestion])}</span>
                            </p>
                            {extractedQuestions[activeQuestion].explanation && (
                              <p className="text-sm text-red-700 mt-1">
                                {extractedQuestions[activeQuestion].explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={activeQuestion === 0}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    {!submitted ? (
                      <Button 
                        onClick={handleSubmit}
                        disabled={!selectedOption}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={activeQuestion === extractedQuestions.length - 1}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Question not available.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};