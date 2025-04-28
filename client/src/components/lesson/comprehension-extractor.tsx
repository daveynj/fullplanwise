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
          description="A short test to test your understanding of the reading."
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
      <SectionHeader
        title="Comprehension"
        description="Answer these questions to check your understanding of the reading passage."
        icon={HelpCircle}
        color="purple"
      />
      
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <HelpCircle className="h-5 w-5" />
            Progress
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
                              optionClass += " border-green-500 bg-green-50/50";
                            }
                          } else {
                            optionClass += isSelected 
                              ? " border-purple-500 bg-purple-50" 
                              : " hover:border-purple-200 hover:bg-purple-50/50";
                          }
                          
                          return (
                            <div 
                              key={idx}
                              className={optionClass}
                              onClick={() => !submitted && setSelectedOption(option)}
                            >
                              <div className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 flex items-center justify-center border 
                                ${isSelected 
                                  ? submitted 
                                    ? isCorrect ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500" 
                                    : "border-purple-500 bg-purple-500" 
                                  : "border-gray-300"}`}
                              >
                                {isSelected && (
                                  <Radio className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium text-lg text-gray-700">{option}</span>
                              {submitted && (
                                <div className="ml-auto">
                                  {isSelected && isCorrect && <CheckCircle2 className="text-green-500 h-5 w-5" />}
                                  {isSelected && !isCorrect && <XCircle className="text-red-500 h-5 w-5" />}
                                  {!isSelected && isCorrect && <CheckCircle2 className="text-green-500/60 h-5 w-5" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {'options' in extractedQuestions[activeQuestion] && extractedQuestions[activeQuestion].options && 
                      Array.isArray(extractedQuestions[activeQuestion].options) && 
                      extractedQuestions[activeQuestion].type !== "true-false" && (
                      <div className="space-y-2">
                        {extractedQuestions[activeQuestion].options?.map((option, idx) => {
                          const optionText = typeof option === 'string' ? option : option.text;
                          const isCorrect = typeof option === 'object' ? option.correct : getCorrectAnswer(extractedQuestions[activeQuestion]) === optionText;
                          
                          const isSelected = selectedOption === optionText;
                          
                          let optionClass = "flex items-center p-3 border rounded-md cursor-pointer";
                          
                          if (submitted) {
                            if (isSelected && isCorrect) {
                              optionClass += " border-green-500 bg-green-50";
                            } else if (isSelected && !isCorrect) {
                              optionClass += " border-red-500 bg-red-50";
                            } else if (isCorrect) {
                              optionClass += " border-green-500 bg-green-50/50";
                            }
                          } else {
                            optionClass += isSelected 
                              ? " border-purple-500 bg-purple-50" 
                              : " hover:border-purple-200 hover:bg-purple-50/50";
                          }
                          
                          return (
                            <div 
                              key={idx}
                              className={optionClass}
                              onClick={() => !submitted && setSelectedOption(optionText)}
                            >
                              <div className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 flex items-center justify-center border 
                                ${isSelected 
                                  ? submitted 
                                    ? isCorrect ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500" 
                                    : "border-purple-500 bg-purple-500" 
                                  : "border-gray-300"}`}
                              >
                                {isSelected && (
                                  <Radio className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium text-lg text-gray-700">{optionText}</span>
                              {submitted && (
                                <div className="ml-auto">
                                  {isSelected && isCorrect && <CheckCircle2 className="text-green-500 h-5 w-5" />}
                                  {isSelected && !isCorrect && <XCircle className="text-red-500 h-5 w-5" />}
                                  {!isSelected && isCorrect && <CheckCircle2 className="text-green-500/60 h-5 w-5" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No question available</p>
              )}

              {/* Feedback after submission */}
              {submitted && (
                <div className="mt-4 p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-50">
                  <div className="flex items-start gap-2">
                    {selectedOption === getCorrectAnswer(extractedQuestions[activeQuestion]) ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-700">Correct!</h4>
                          {extractedQuestions[activeQuestion].explanation && (
                            <p className="text-gray-600 mt-1">{extractedQuestions[activeQuestion].explanation}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-700">Incorrect</h4>
                          <p className="text-gray-600 mt-1">
                            The correct answer is: <span className="font-semibold">{getCorrectAnswer(extractedQuestions[activeQuestion])}</span>
                          </p>
                          {extractedQuestions[activeQuestion].explanation && (
                            <p className="text-gray-600 mt-1">{extractedQuestions[activeQuestion].explanation}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={activeQuestion === 0}
                  className="text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={activeQuestion === extractedQuestions.length - 1}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};