import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { extractComprehensionQuestions } from "@/lib/utils";

interface ComprehensionQuestion {
  question: string;
  answer: string;
  type?: "true-false" | "multiple-choice" | string;
  options?: string[];
}

interface ComprehensionExtractorProps {
  content: any;
}

export const ComprehensionExtractor = ({ content }: ComprehensionExtractorProps) => {
  console.log("COMPREHENSION EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  console.log("COMPREHENSION EXTRACTOR CONTENT:", JSON.stringify(content, null, 2).substring(0, 500));
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Use the utility function to extract comprehension questions
  const extractedQuestions: ComprehensionQuestion[] = extractComprehensionQuestions(content);
  console.log("EXTRACTED COMPREHENSION QUESTIONS:", extractedQuestions);
  
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
          {content.comprehension?.introduction && (
            <CardDescription>{content.comprehension.introduction}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => {
                  setActiveQuestion(prev => (prev > 0 ? prev - 1 : prev));
                  setSelectedOption(null);
                }}
                disabled={activeQuestion === 0}
                className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                aria-label="Previous question"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-gray-500">Question {activeQuestion + 1} of {extractedQuestions.length}</span>
              <button 
                onClick={() => {
                  setActiveQuestion(prev => (prev < extractedQuestions.length - 1 ? prev + 1 : prev));
                  setSelectedOption(null);
                }}
                disabled={activeQuestion === extractedQuestions.length - 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                aria-label="Next question"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 border rounded-lg">
              {extractedQuestions[activeQuestion] ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-lg mb-2">Question {activeQuestion + 1}</h3>
                    <p className="text-gray-800">{extractedQuestions[activeQuestion].question || "No question text available"}</p>
                    
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
                        <div 
                          onClick={() => setSelectedOption('True')}
                          className={`flex items-center p-3 border ${
                            selectedOption === 'True' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                          } rounded hover:bg-purple-50 cursor-pointer transition-colors`}
                        >
                          <div className={`h-4 w-4 mr-3 rounded-full ${
                            selectedOption === 'True' ? 'bg-purple-500' : 'bg-gray-200'
                          }`} />
                          <span>True</span>
                        </div>
                        
                        <div 
                          onClick={() => setSelectedOption('False')}
                          className={`flex items-center p-3 border ${
                            selectedOption === 'False' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                          } rounded hover:bg-purple-50 cursor-pointer transition-colors`}
                        >
                          <div className={`h-4 w-4 mr-3 rounded-full ${
                            selectedOption === 'False' ? 'bg-purple-500' : 'bg-gray-200'
                          }`} />
                          <span>False</span>
                        </div>
                      </div>
                    )}
                    
                    {'options' in extractedQuestions[activeQuestion] && 
                     Array.isArray(extractedQuestions[activeQuestion].options) && 
                     extractedQuestions[activeQuestion].options.length > 0 && 
                     extractedQuestions[activeQuestion].type !== "true-false" && (
                      <div className="space-y-2">
                        {extractedQuestions[activeQuestion].options.map((option: string, idx: number) => (
                          <div 
                            key={`option-${idx}`} 
                            onClick={() => setSelectedOption(option)}
                            className={`flex items-center p-3 border ${
                              selectedOption === option ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                            } rounded hover:bg-purple-50 cursor-pointer transition-colors`}
                          >
                            <div className={`h-4 w-4 mr-3 rounded-full ${
                              selectedOption === option ? 'bg-purple-500' : 'bg-gray-200'
                            }`} />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Progress indicator dots */}
                    <div className="flex justify-center space-x-2 mt-8">
                      {extractedQuestions.map((_, index) => (
                        <div
                          key={`dot-${index}`}
                          className={`h-2 w-2 rounded-full ${
                            activeQuestion === index ? 'bg-purple-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Question details not available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Teacher notes */}
      {content.comprehension?.teacherNotes && (
        <Card className="border-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-600">
              <HelpCircle className="h-4 w-4" />
              Teacher Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-gray-700">
            <p>{content.comprehension.teacherNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};