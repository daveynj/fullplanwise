import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, Radio } from "lucide-react";

interface ComprehensionExtractorProps {
  content: any;
}

export const ComprehensionExtractor = ({ content }: ComprehensionExtractorProps) => {
  console.log("COMPREHENSION EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  const [activeQuestion, setActiveQuestion] = useState(0);
  let questionsFound = false;
  let extractedQuestions: any[] = [];
  
  // Approach 1: Try to directly extract comprehension questions from the flat structure
  if (typeof content === "object" && content !== null) {
    try {
      // Look for a comprehension section directly in the content
      if (content.comprehension && typeof content.comprehension === 'object') {
        console.log("FOUND COMPREHENSION SECTION AT ROOT LEVEL");
        
        // Check if questions is a valid array
        if (content.comprehension.questions && 
            Array.isArray(content.comprehension.questions) && 
            content.comprehension.questions.length > 0) {
          console.log("FOUND QUESTIONS ARRAY IN COMPREHENSION SECTION:", content.comprehension.questions.length);
          extractedQuestions = content.comprehension.questions;
          questionsFound = true;
        }
        
        // Check if questions is an object mapping
        else if (content.comprehension.questions && 
                typeof content.comprehension.questions === 'object') {
          console.log("FOUND QUESTIONS OBJECT IN COMPREHENSION SECTION");
          const questionKeys = Object.keys(content.comprehension.questions).filter(key => 
            typeof key === 'string' && key.includes('?')
          );
          
          if (questionKeys.length > 0) {
            extractedQuestions = questionKeys.map(q => ({
              question: q,
              answer: content.comprehension.questions[q] || ''
            }));
            questionsFound = true;
          }
        }
        
        // Look for direct question properties in the comprehension object
        if (!questionsFound) {
          const questionKeys = Object.keys(content.comprehension).filter(key => 
            typeof key === 'string' && 
            (key.includes('?') || key.toLowerCase().includes('question')) && 
            key !== 'questions' && 
            key !== 'type' && 
            key !== 'title'
          );
          
          if (questionKeys.length > 0) {
            console.log("FOUND DIRECT QUESTION KEYS IN COMPREHENSION SECTION:", questionKeys);
            extractedQuestions = questionKeys.map(q => ({
              question: q,
              answer: typeof content.comprehension[q] === 'string' ? content.comprehension[q] : ''
            }));
            questionsFound = true;
          }
        }
      }
    } catch (err) {
      console.error("Error trying to extract direct comprehension questions:", err);
    }
  }
  
  // Approach 2: Look for comprehension in sections array
  if (!questionsFound && typeof content === "object" && content !== null && Array.isArray(content.sections)) {
    try {
      const comprehensionSection = content.sections.find((section: any) => 
        section && typeof section === 'object' && section.type === 'comprehension'
      );
      
      if (comprehensionSection) {
        console.log("FOUND COMPREHENSION SECTION IN SECTIONS ARRAY");
        
        // Check if questions is a valid array
        if (comprehensionSection.questions && 
            Array.isArray(comprehensionSection.questions) && 
            comprehensionSection.questions.length > 0) {
          console.log("FOUND QUESTIONS ARRAY IN SECTION:", comprehensionSection.questions.length);
          extractedQuestions = comprehensionSection.questions;
          questionsFound = true;
        }
        
        // Check if questions is an object mapping
        else if (comprehensionSection.questions && 
                typeof comprehensionSection.questions === 'object') {
          console.log("FOUND QUESTIONS OBJECT IN SECTION");
          const questionKeys = Object.keys(comprehensionSection.questions).filter(key => 
            typeof key === 'string' && (key.includes('?') || key.toLowerCase().includes('question'))
          );
          
          if (questionKeys.length > 0) {
            extractedQuestions = questionKeys.map(q => ({
              question: q,
              answer: comprehensionSection.questions[q] || ''
            }));
            questionsFound = true;
          }
        }
        
        // Look for direct question properties in the section
        if (!questionsFound) {
          const questionKeys = Object.keys(comprehensionSection).filter(key => 
            typeof key === 'string' && 
            (key.includes('?') || key.toLowerCase().includes('question')) && 
            key !== 'questions' && 
            key !== 'type' && 
            key !== 'title'
          );
          
          if (questionKeys.length > 0) {
            console.log("FOUND DIRECT QUESTION KEYS IN SECTION:", questionKeys);
            extractedQuestions = questionKeys.map(q => ({
              question: q,
              answer: typeof comprehensionSection[q] === 'string' ? comprehensionSection[q] : ''
            }));
            questionsFound = true;
          }
        }
      }
    } catch (err) {
      console.error("Error trying to extract comprehension questions from sections:", err);
    }
  }
  
  // Approach 3: Search for question patterns in all content keys
  if (!questionsFound && typeof content === "object" && content !== null) {
    try {
      // Find all keys containing "what", "why", "how", "when", "where", "who", or "?" 
      const allKeys = Object.keys(content);
      const questionLikeKeys = allKeys.filter(key => {
        if (typeof key !== 'string') return false;
        const lowerKey = key.toLowerCase();
        return (
          key.includes('?') || 
          lowerKey.startsWith('what ') || 
          lowerKey.startsWith('why ') || 
          lowerKey.startsWith('how ') || 
          lowerKey.startsWith('when ') || 
          lowerKey.startsWith('where ') || 
          lowerKey.startsWith('who ') || 
          lowerKey.startsWith('which ')
        );
      });
      
      if (questionLikeKeys.length > 0) {
        console.log("FOUND QUESTION-LIKE KEYS AT ROOT LEVEL:", questionLikeKeys);
        extractedQuestions = questionLikeKeys.map(q => ({
          question: q,
          answer: typeof content[q] === 'string' ? content[q] : ''
        }));
        questionsFound = true;
      }
    } catch (err) {
      console.error("Error searching for questions in content:", err);
    }
  }
  
  // Check if we have found any questions
  if (!questionsFound || extractedQuestions.length === 0) {
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
                    {extractedQuestions[activeQuestion].type === "true-false" && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        Decide if the statement is true or false based on the text.
                      </p>
                    )}
                    
                    {extractedQuestions[activeQuestion].type === "multiple-choice" && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        Choose the best answer based on the text.
                      </p>
                    )}
                  </div>
                  
                  {/* Options based on question type */}
                  <div className="space-y-2 mt-4">
                    {extractedQuestions[activeQuestion].options && Array.isArray(extractedQuestions[activeQuestion].options) && 
                      extractedQuestions[activeQuestion].options.map((option: string, idx: number) => (
                        <div key={`option-${idx}`} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50">
                          <Radio className="h-4 w-4 mr-3 text-gray-400" />
                          <span>{option}</span>
                        </div>
                      ))
                    }
                    
                    {/* If there are no options, show the answer instead */}
                    {(!extractedQuestions[activeQuestion].options || 
                     !Array.isArray(extractedQuestions[activeQuestion].options) || 
                     extractedQuestions[activeQuestion].options.length === 0) && 
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