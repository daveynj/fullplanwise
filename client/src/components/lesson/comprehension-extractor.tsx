import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, Radio } from "lucide-react";
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
  
  // Use the utility function to extract comprehension questions
  const extractedQuestions: ComprehensionQuestion[] = extractComprehensionQuestions(content);
  console.log("EXTRACTED COMPREHENSION QUESTIONS:", extractedQuestions);
  
  // Check if we have found any questions
  if (extractedQuestions.length === 0) {
    return (
      <div className="space-y-6">
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
                onClick={() => setActiveQuestion(prev => (prev > 0 ? prev - 1 : prev))}
                disabled={activeQuestion === 0}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                ‹ Previous
              </button>
              <span className="text-sm text-gray-500">Question {activeQuestion + 1} of {extractedQuestions.length}</span>
              <button 
                onClick={() => setActiveQuestion(prev => (prev < extractedQuestions.length - 1 ? prev + 1 : prev))}
                disabled={activeQuestion === extractedQuestions.length - 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next ›
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
                    {'options' in extractedQuestions[activeQuestion] && 
                     Array.isArray(extractedQuestions[activeQuestion].options) && 
                     extractedQuestions[activeQuestion].options.length > 0 && 
                      extractedQuestions[activeQuestion].options.map((option: string, idx: number) => (
                        <div key={`option-${idx}`} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50">
                          <Radio className="h-4 w-4 mr-3 text-gray-400" />
                          <span>{option}</span>
                        </div>
                      ))
                    }
                    
                    {/* If there are no options, show the answer instead */}
                    {(!('options' in extractedQuestions[activeQuestion]) || 
                     !Array.isArray(extractedQuestions[activeQuestion].options) || 
                     extractedQuestions[activeQuestion].options?.length === 0) && 
                     extractedQuestions[activeQuestion].answer && (
                      <div className="p-4 border-t mt-4">
                        <h4 className="font-medium text-gray-700 mb-1">Answer:</h4>
                        <p className="text-gray-600">{extractedQuestions[activeQuestion].answer}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Question details not available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};