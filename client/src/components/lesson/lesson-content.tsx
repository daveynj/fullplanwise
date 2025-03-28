import { 
  Flame, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  AlignJustify, 
  MessageCircle, 
  CheckSquare,
  Book,
  Radio,
  CircleCheck,
  CircleX,
  Lightbulb,
  GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";

interface LessonContentProps {
  content: any;
}

export function LessonContent({ content }: LessonContentProps) {
  const [parsedContent, setParsedContent] = useState<any>(null);
  
  // Parse the content if it's a string (from database)
  useEffect(() => {
    if (content) {
      try {
        // If it's a string (from database), parse it
        if (typeof content === 'string') {
          setParsedContent(JSON.parse(content));
        } else {
          // If it's already an object (from direct API response)
          setParsedContent(content);
        }
      } catch (err) {
        console.error("Error parsing lesson content:", err);
        setParsedContent(null);
      }
    }
  }, [content]);
  
  // Show loading state while parsing
  if (!parsedContent) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading lesson content...</p>
      </div>
    );
  }
  
  // Handle missing or invalid sections
  if (!parsedContent.sections || !Array.isArray(parsedContent.sections)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No lesson content available</p>
      </div>
    );
  }

  // Map of section types to their icons and background colors
  const sectionStyles: Record<string, { icon: React.ReactNode; bgColor: string }> = {
    "warmup": { 
      icon: <Flame className="text-[#FFB400] text-xl" />, 
      bgColor: "bg-amber-100" 
    },
    "warm-up": { 
      icon: <Flame className="text-[#FFB400] text-xl" />, 
      bgColor: "bg-amber-100" 
    },
    "vocabulary": { 
      icon: <BookOpen className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "reading": { 
      icon: <FileText className="text-[#28A745] text-xl" />, 
      bgColor: "bg-green-100" 
    },
    "comprehension": { 
      icon: <HelpCircle className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "grammar": { 
      icon: <Book className="text-[#4A6FA5] text-xl" />, 
      bgColor: "bg-blue-100" 
    },
    "speaking": { 
      icon: <MessageCircle className="text-[#28A745] text-xl" />, 
      bgColor: "bg-green-100" 
    },
    "assessment": { 
      icon: <CheckSquare className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "discussion": { 
      icon: <MessageCircle className="text-[#28A745] text-xl" />, 
      bgColor: "bg-green-100" 
    },
    "quiz": { 
      icon: <CheckSquare className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "homework": { 
      icon: <GraduationCap className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
  };
  
  // Function to get section heading from type
  const getSectionHeading = (type: string, title?: string): string => {
    // If a title is provided, use it
    if (title) return title;
    
    const headings: Record<string, string> = {
      "warmup": "Warm-up Activity",
      "warm-up": "Warm-up Activity",
      "vocabulary": "Key Vocabulary",
      "reading": "Reading Passage",
      "comprehension": "Comprehension Questions",
      "grammar": "Grammar Focus",
      "speaking": "Speaking Activity",
      "assessment": "Assessment",
      "discussion": "Discussion Questions",
      "quiz": "Quiz",
      "homework": "Homework",
    };
    
    return headings[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to safely render content with splitting
  const renderContentWithSplit = (content: any, splitPattern: string) => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      return content.split(splitPattern).map((item: string, i: number) => (
        <p key={i}>{item.trim()}</p>
      ));
    }
    
    // If not a string, just render as is
    return <p>{String(content)}</p>;
  };

  // Render vocabulary list
  const renderVocabulary = (words: any) => {
    if (!words || !Array.isArray(words)) {
      return <p>No vocabulary words available</p>;
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {words.map((word: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-md p-3">
            <p className="font-semibold text-primary">{word.term}</p>
            <p className="text-sm text-gray-700">{word.definition}</p>
            {word.example && (
              <p className="text-sm italic mt-1">"{word.example}"</p>
            )}
            {word.notes && (
              <p className="text-xs text-gray-500 mt-1">{word.notes}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render multiple choice question
  const renderMultipleChoice = (question: any, index: number) => {
    return (
      <div key={index} className="mb-4 border-b pb-4">
        <p className="font-medium mb-2">{index + 1}. {question.question || question.content?.question}</p>
        <div className="ml-4 space-y-2">
          {(question.options || question.content?.options || []).map((option: string, optIdx: number) => (
            <div key={optIdx} className="flex items-center space-x-2">
              <Radio className="text-primary h-4 w-4" />
              <span>{option}</span>
            </div>
          ))}
        </div>
        {(question.correctAnswer || question.content?.correctAnswer) && (
          <div className="mt-3 text-sm bg-green-50 p-2 rounded">
            <span className="font-medium text-green-700">Answer:</span> {question.correctAnswer || question.content?.correctAnswer}
          </div>
        )}
        {(question.explanation || question.content?.explanation) && (
          <div className="mt-2 text-sm flex items-start">
            <Lightbulb className="text-amber-500 h-4 w-4 mr-1 mt-0.5" />
            <span className="text-gray-600">{question.explanation || question.content?.explanation}</span>
          </div>
        )}
      </div>
    );
  };

  // Render true/false question
  const renderTrueFalse = (question: any, index: number) => {
    const options = question.options || question.content?.options || ["True", "False"];
    
    return (
      <div key={index} className="mb-4 border-b pb-4">
        <p className="font-medium mb-2">{index + 1}. {question.question || question.content?.question}</p>
        <div className="ml-4 space-y-2">
          {options.map((option: string, optIdx: number) => (
            <div key={optIdx} className="flex items-center space-x-2">
              {option === "True" ? 
                <CircleCheck className="text-green-600 h-4 w-4" /> : 
                <CircleX className="text-red-600 h-4 w-4" />
              }
              <span>{option}</span>
            </div>
          ))}
        </div>
        {(question.correctAnswer || question.content?.correctAnswer) && (
          <div className="mt-3 text-sm bg-green-50 p-2 rounded">
            <span className="font-medium text-green-700">Answer:</span> {question.correctAnswer || question.content?.correctAnswer}
          </div>
        )}
        {(question.explanation || question.content?.explanation) && (
          <div className="mt-2 text-sm flex items-start">
            <Lightbulb className="text-amber-500 h-4 w-4 mr-1 mt-0.5" />
            <span className="text-gray-600">{question.explanation || question.content?.explanation}</span>
          </div>
        )}
      </div>
    );
  };

  // Render assessment questions
  const renderQuestions = (questions: any) => {
    if (!questions || !Array.isArray(questions)) {
      return <p>No questions available</p>;
    }

    return (
      <div className="space-y-4">
        {questions.map((question: any, index: number) => {
          const questionType = question.type || question.content?.type || 'multiple-choice';
          
          if (questionType === 'true-false') {
            return renderTrueFalse(question, index);
          } else {
            return renderMultipleChoice(question, index);
          }
        })}
      </div>
    );
  };

  return (
    <div className="lesson-content space-y-8">
      {/* Lesson header info */}
      <div className="bg-primary/10 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-primary">{parsedContent.title}</h2>
        <div className="flex flex-wrap gap-3 mt-2">
          <span className="bg-primary/20 text-primary text-sm px-2 py-1 rounded">
            Level: {parsedContent.level}
          </span>
          <span className="bg-[#28A745]/20 text-[#28A745] text-sm px-2 py-1 rounded">
            Focus: {parsedContent.focus}
          </span>
          <span className="bg-[#FFB400]/20 text-[#FFB400] text-sm px-2 py-1 rounded">
            Time: {parsedContent.estimatedTime} minutes
          </span>
        </div>
      </div>

      {/* Lesson sections */}
      {parsedContent.sections.map((section: any, index: number) => {
        const style = sectionStyles[section.type] || { 
          icon: <BookOpen className="text-primary text-xl" />, 
          bgColor: "bg-gray-100" 
        };
        
        return (
          <section key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center p-3 bg-gray-50 border-b">
              <div className={`${style.bgColor} p-1.5 rounded-lg mr-2`}>
                {style.icon}
              </div>
              <h3 className="font-semibold text-lg">
                {getSectionHeading(section.type, section.title)}
              </h3>
              {section.timeAllocation && (
                <span className="ml-auto text-sm text-gray-500">
                  {section.timeAllocation}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                {/* Render different content based on section type */}
                {section.type === "vocabulary" && section.words ? (
                  renderVocabulary(section.words)
                ) : section.type === "reading" ? (
                  <div className="space-y-3 bg-blue-50/50 p-3 rounded border border-blue-100">
                    {renderContentWithSplit(section.content, '\n\n')}
                  </div>
                ) : section.type === "comprehension" && section.questions ? (
                  renderQuestions(section.questions)
                ) : section.type === "assessment" && section.questions ? (
                  <div>
                    {section.introduction && <p className="mb-4">{section.introduction}</p>}
                    {renderQuestions(section.questions)}
                  </div>
                ) : section.type === "grammar" ? (
                  <div className="space-y-4">
                    {section.explanation && (
                      <div className="bg-blue-50 p-3 rounded">
                        <h4 className="font-medium mb-2">Explanation</h4>
                        <p>{section.explanation}</p>
                      </div>
                    )}
                    {section.examples && Array.isArray(section.examples) && section.examples.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Examples</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {section.examples.map((example: string, i: number) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.examples && !Array.isArray(section.examples) && (
                      <div>
                        <h4 className="font-medium mb-2">Examples</h4>
                        <p>{String(section.examples)}</p>
                      </div>
                    )}
                    {section.practice && Array.isArray(section.practice) && section.practice.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Practice</h4>
                        {renderQuestions(section.practice)}
                      </div>
                    )}
                    {section.practice && !Array.isArray(section.practice) && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Practice</h4>
                        <p>{String(section.practice)}</p>
                      </div>
                    )}
                  </div>
                ) : section.type === "speaking" || section.type === "discussion" ? (
                  <div>
                    {section.introduction && <p className="mb-3">{section.introduction}</p>}
                    {section.questions && Array.isArray(section.questions) && section.questions.length > 0 && (
                      <div className="space-y-2">
                        {section.questions.map((question: string, i: number) => (
                          <div key={i} className="flex items-start">
                            <span className="font-medium mr-2">{i+1}.</span>
                            <p>{question}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {section.questions && !Array.isArray(section.questions) && (
                      <div className="space-y-2">
                        <p>{String(section.questions)}</p>
                      </div>
                    )}
                  </div>
                ) : section.type === "warmup" || section.type === "warm-up" ? (
                  <div>
                    {renderContentWithSplit(section.content, '\n\n')}
                  </div>
                ) : (
                  // Default rendering for other section types
                  <div className="space-y-3">
                    {typeof section.content === 'string' ? 
                      section.content.split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      )) : 
                      <p>{String(section.content || '')}</p>
                    }
                  </div>
                )}
                
                {/* Teacher notes if available */}
                {section.teacherNotes && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-1">Teacher Notes:</p>
                    <p className="text-sm text-gray-600">{section.teacherNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
