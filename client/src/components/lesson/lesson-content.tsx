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
  GraduationCap,
  Copy,
  Image,
  ExternalLink,
  LucideIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LessonContentProps {
  content: any;
}

type SectionType = 
  | "warmup" 
  | "warm-up" 
  | "reading" 
  | "vocabulary" 
  | "comprehension" 
  | "sentenceFrames" 
  | "grammar" 
  | "discussion" 
  | "speaking" 
  | "quiz" 
  | "assessment";

interface SectionDetails {
  icon: LucideIcon;
  label: string;
  color: string;
  textColor: string;
  description: string;
}

export function LessonContent({ content }: LessonContentProps) {
  const [parsedContent, setParsedContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>(""); 
  
  // Parse the content if it's a string (from database)
  useEffect(() => {
    if (content) {
      console.log("Raw content type:", typeof content);
      console.log("Raw content preview:", typeof content === 'string' 
        ? content.substring(0, 500) + '...' 
        : JSON.stringify(content).substring(0, 500) + '...');
      
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
        console.error("Content that failed to parse:", typeof content === 'string' ? content : "Not a string");
        setParsedContent(null);
      }
    }
  }, [content]);
  
  // Set the active tab to the first available section when content is loaded
  useEffect(() => {
    if (parsedContent?.sections && Array.isArray(parsedContent.sections) && parsedContent.sections.length > 0) {
      try {
        // Find first section with a valid type
        const validSections = parsedContent.sections.filter(
          (s: any) => s && typeof s === 'object' && s.type && typeof s.type === 'string'
        );
        
        console.log("Valid sections:", validSections.map((s: any) => s.type));
        
        if (validSections.length > 0) {
          const firstType = validSections[0].type;
          console.log("Setting active tab to:", firstType);
          setActiveTab(firstType);
        } else {
          console.warn("No valid section types found in the content");
        }
      } catch (err) {
        console.error("Error setting active tab:", err);
      }
    }
  }, [parsedContent]);
  
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

  // Map of section types to their details
  const sectionDetails: Record<SectionType, SectionDetails> = {
    "warmup": { 
      icon: Flame, 
      label: "Warm-up",
      color: "bg-amber-100",
      textColor: "text-amber-700",
      description: "Introduce key vocabulary and topic"
    },
    "warm-up": { 
      icon: Flame, 
      label: "Warm-up",
      color: "bg-amber-100",
      textColor: "text-amber-700",
      description: "Introduce key vocabulary and topic"
    },
    "reading": { 
      icon: BookOpen, 
      label: "Reading",
      color: "bg-blue-100",
      textColor: "text-blue-700",
      description: "Read and analyze the text with guided support"
    },
    "vocabulary": { 
      icon: Book, 
      label: "Vocabulary",
      color: "bg-green-100",
      textColor: "text-green-700",
      description: "Learn and practice key vocabulary from the text"
    },
    "comprehension": { 
      icon: HelpCircle, 
      label: "Comprehension",
      color: "bg-purple-100",
      textColor: "text-purple-700",
      description: "Check understanding with targeted questions"
    },
    "sentenceFrames": { 
      icon: AlignJustify, 
      label: "Sentence Frames",
      color: "bg-yellow-100",
      textColor: "text-yellow-700",
      description: "Practice grammar patterns using sentence frames"
    },
    "grammar": { 
      icon: AlignJustify, 
      label: "Grammar",
      color: "bg-yellow-100",
      textColor: "text-yellow-700",
      description: "Learn and practice grammar patterns"
    },
    "discussion": { 
      icon: MessageCircle, 
      label: "Post-reading Discussion",
      color: "bg-indigo-100",
      textColor: "text-indigo-700",
      description: "Discuss and reflect on the reading"
    },
    "speaking": { 
      icon: MessageCircle, 
      label: "Speaking Activity",
      color: "bg-indigo-100",
      textColor: "text-indigo-700",
      description: "Practice speaking skills related to the topic"
    },
    "quiz": { 
      icon: CheckSquare, 
      label: "Quiz",
      color: "bg-cyan-100",
      textColor: "text-cyan-700",
      description: "Test knowledge and understanding of the lesson"
    },
    "assessment": { 
      icon: CheckSquare, 
      label: "Assessment",
      color: "bg-cyan-100",
      textColor: "text-cyan-700",
      description: "Evaluate understanding through questions"
    }
  };

  // Function to find a section by type with error handling
  const findSection = (type: string) => {
    try {
      if (Array.isArray(parsedContent.sections)) {
        return parsedContent.sections.find((section: any) => section && typeof section === 'object' && section.type === type);
      }
      return undefined;
    } catch (error) {
      console.error("Error finding section", type, error);
      return undefined;
    }
  };

  // Components for each section type
  const WarmupSection = () => {
    const sectionType = activeTab === "warm-up" ? "warm-up" : "warmup";
    const section = findSection(sectionType);
    if (!section) return <p>No warm-up content available</p>;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-amber-50">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Flame className="h-5 w-5" />
              {section.title || "Warm-up Activity"}
            </CardTitle>
            <CardDescription>{section.content}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Display warm-up questions if available */}
              {section.questions && Array.isArray(section.questions) && section.questions.length > 0 && (
                <div className="space-y-2">
                  {section.questions.map((question: string, idx: number) => (
                    <div key={`question-${idx}`} className="p-4 border border-amber-200 bg-amber-50 rounded-md">
                      <p>{question}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Display target vocabulary if available */}
              {section.targetVocabulary && section.targetVocabulary.length > 0 && (
                <div className="mt-6">
                  <p className="font-medium text-gray-700 mb-2">Key vocabulary to introduce:</p>
                  <div className="flex flex-wrap gap-2">
                    {section.targetVocabulary.map((word: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const ReadingSection = () => {
    const section = findSection('reading');
    if (!section) return <p>No reading content available</p>;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BookOpen className="h-5 w-5" />
              {section.title || "Reading Passage"}
            </CardTitle>
            {section.introduction && <CardDescription>{section.introduction}</CardDescription>}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-white p-6 rounded-lg border border-blue-100 space-y-4">
              {/* If paragraphs array is available, use it */}
              {section.paragraphs && Array.isArray(section.paragraphs) ? (
                section.paragraphs.map((paragraph: string, idx: number) => (
                  <p key={`paragraph-${idx}`} className="text-gray-800 leading-relaxed">{paragraph}</p>
                ))
              ) : (
                // Otherwise use content
                <div className="prose max-w-none">
                  {typeof section.content === 'string' ? 
                    section.content.split('\n\n').map((paragraph: string, i: number) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    )) : 
                    <p>{section.content || 'No reading content available'}</p>
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const VocabularySection = () => {
    const section = findSection('vocabulary');
    if (!section) return <p>No vocabulary content available</p>;
    
    const [activeCard, setActiveCard] = useState(0);
    
    // Add additional error handling for words array
    let words: any[] = [];
    try {
      // Check if words is a valid array
      if (section.words && Array.isArray(section.words) && section.words.length > 0) {
        words = section.words;
      } else {
        console.warn("No valid words array found in vocabulary section");
      }
    } catch (error) {
      console.error("Error accessing vocabulary words:", error);
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Book className="h-5 w-5" />
              Vocabulary Practice
            </CardTitle>
            <CardDescription>
              Review each vocabulary word using the flashcards. Click on a card to see more details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {words.length > 0 ? (
              <div>
                <div className="p-4 border rounded-lg bg-white mb-4">
                  {/* Pagination controls */}
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={() => setActiveCard(prev => (prev > 0 ? prev - 1 : prev))}
                      disabled={activeCard === 0}
                      className="px-3 py-1 border rounded-md disabled:opacity-50"
                    >
                      ‹ Previous
                    </button>
                    <span className="text-sm text-gray-500">{activeCard + 1} of {words.length}</span>
                    <button 
                      onClick={() => setActiveCard(prev => (prev < words.length - 1 ? prev + 1 : prev))}
                      disabled={activeCard === words.length - 1}
                      className="px-3 py-1 border rounded-md disabled:opacity-50"
                    >
                      Next ›
                    </button>
                  </div>

                  {/* Vocabulary card with error handling */}
                  <div className="p-4 border rounded-lg">
                    {words[activeCard] && typeof words[activeCard] === 'object' ? (
                      <>
                        <div className="mb-3 text-center">
                          <h3 className="font-bold text-xl">{words[activeCard].term || "Vocabulary Term"}</h3>
                          <p className="text-gray-500 text-sm">({words[activeCard].partOfSpeech || "noun"})</p>
                        </div>
                        
                        <div className="space-y-4 mt-4">
                          <div className="bg-green-50 p-3 rounded-md">
                            <p className="font-medium text-sm text-green-700">Definition:</p>
                            <p>{words[activeCard].definition || "No definition available"}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="font-medium text-sm text-blue-700">Example:</p>
                            <p className="italic">"{words[activeCard].example || "No example available"}"</p>
                          </div>
                          
                          {words[activeCard].pronunciation && (
                            <div className="bg-purple-50 p-3 rounded-md">
                              <p className="font-medium text-sm text-purple-700">Pronunciation:</p>
                              <p>{words[activeCard].pronunciation}</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500">Invalid vocabulary card data</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No vocabulary words available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Practice activity if available */}
        {section.practice && (
          <Card className="border-green-100">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-sm text-green-700">Practice Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>{section.practice}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const ComprehensionSection = () => {
    const section = findSection('comprehension');
    if (!section) return <p>No comprehension content available</p>;
    
    const [activeQuestion, setActiveQuestion] = useState(0);
    
    // Add additional error handling for questions array
    let questions: any[] = [];
    try {
      // Check if questions is a valid array
      if (section.questions && Array.isArray(section.questions) && section.questions.length > 0) {
        questions = section.questions;
      } else {
        console.warn("No valid questions array found in comprehension section");
      }
    } catch (error) {
      console.error("Error accessing comprehension questions:", error);
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <HelpCircle className="h-5 w-5" />
              Reading Comprehension Questions
            </CardTitle>
            {section.introduction && (
              <CardDescription>{section.introduction}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {questions.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={() => setActiveQuestion(prev => (prev > 0 ? prev - 1 : prev))}
                    disabled={activeQuestion === 0}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    ‹ Previous
                  </button>
                  <span className="text-sm text-gray-500">Question {activeQuestion + 1} of {questions.length}</span>
                  <button 
                    onClick={() => setActiveQuestion(prev => (prev < questions.length - 1 ? prev + 1 : prev))}
                    disabled={activeQuestion === questions.length - 1}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Next ›
                  </button>
                </div>

                <div className="p-5 border rounded-lg">
                  {questions[activeQuestion] && typeof questions[activeQuestion] === 'object' ? (
                    <>
                      <div className="mb-4">
                        <h3 className="font-medium text-lg mb-2">Question {activeQuestion + 1}</h3>
                        <p className="text-gray-800">{questions[activeQuestion].question || "No question text available"}</p>
                        
                        {/* Instructions based on question type */}
                        {questions[activeQuestion].type === "true-false" && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            Decide if the statement is true or false based on the text.
                          </p>
                        )}
                        
                        {questions[activeQuestion].type === "multiple-choice" && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            Choose the best answer based on the text.
                          </p>
                        )}
                      </div>
                      
                      {/* Options based on question type */}
                      <div className="space-y-2 mt-4">
                        {questions[activeQuestion].options && Array.isArray(questions[activeQuestion].options) && 
                          questions[activeQuestion].options.map((option: string, idx: number) => (
                            <div key={`option-${idx}`} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50">
                              <Radio className="h-4 w-4 mr-3 text-gray-400" />
                              <span>{option}</span>
                            </div>
                          ))
                        }
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500">Invalid question data</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No comprehension questions available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const SentenceFramesSection = () => {
    // Try both sentenceFrames and grammar as possible section types
    const section = findSection('sentenceFrames') || findSection('grammar');
    if (!section) return <p>No sentence frames content available</p>;
    
    // Get frames from different possible structures
    const frames = section.frames || 
                  (section.examples ? [{ pattern: section.examples, level: "intermediate" }] : []);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlignJustify className="h-5 w-5" />
              {section.title || "Sentence Frames"}
            </CardTitle>
            {section.introduction && (
              <CardDescription>{section.introduction || section.explanation}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {frames.length > 0 ? (
                frames.map((frame: any, idx: number) => (
                  <div key={`frame-${idx}`} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {/* Frame level */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn(
                        frame.level === 'basic' ? 'bg-green-100 text-green-700 border-green-200' : 
                        frame.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                        'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {frame.level ? frame.level.charAt(0).toUpperCase() + frame.level.slice(1) : 'Intermediate'}
                      </Badge>
                      {frame.grammarFocus && <span className="text-sm text-gray-500">{frame.grammarFocus}</span>}
                    </div>
                    
                    {/* Sentence pattern */}
                    <div className="p-3 bg-white rounded border border-yellow-200 mb-4 font-mono">
                      {frame.pattern}
                      <button className="float-right text-gray-400 hover:text-gray-600">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Examples */}
                    {frame.examples && frame.examples.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                          <FileText className="h-4 w-4" /> Examples
                        </h4>
                        <div className="space-y-2">
                          {frame.examples.map((example: string, eIdx: number) => (
                            <p key={`example-${eIdx}`} className="text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-100">
                              {example}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Usage */}
                    {frame.usage && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                          <Lightbulb className="h-4 w-4" /> Usage
                        </h4>
                        <p className="text-sm text-gray-700">{frame.usage}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Fallback for traditional grammar structure
                <div className="space-y-4">
                  {section.explanation && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <h4 className="font-medium mb-2">Grammar Explanation</h4>
                      <p>{section.explanation}</p>
                    </div>
                  )}
                  {section.examples && !frames.length && (
                    <div className="space-y-2">
                      <h4 className="font-medium mb-2">Examples</h4>
                      {Array.isArray(section.examples) ? 
                        section.examples.map((example: string, i: number) => (
                          <p key={i} className="p-2 bg-yellow-50 border border-yellow-100 rounded">{example}</p>
                        )) : 
                        <p className="p-2 bg-yellow-50 border border-yellow-100 rounded">{section.examples}</p>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const DiscussionSection = () => {
    // Try both discussion and speaking as possible section types
    const section = findSection('discussion') || findSection('speaking');
    if (!section) return <p>No discussion content available</p>;
    
    // Extract questions from different possible formats
    let questions = [];
    if (section.questions) {
      if (Array.isArray(section.questions)) {
        if (typeof section.questions[0] === 'string') {
          // Simple string array
          questions = section.questions.map((q: string) => ({ 
            question: q, 
            level: "basic", 
            focusVocabulary: [] 
          }));
        } else {
          // Already in proper format
          questions = section.questions;
        }
      } else if (typeof section.questions === 'string') {
        // Single string
        questions = [{ 
          question: section.questions, 
          level: "basic", 
          focusVocabulary: [] 
        }];
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-indigo-50">
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <MessageCircle className="h-5 w-5" />
              {section.title || "Post-reading Discussion"}
            </CardTitle>
            {section.introduction && (
              <CardDescription>{section.introduction}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {questions.length > 0 ? (
                questions.map((q: any, idx: number) => (
                  <div key={`discussion-${idx}`} className="border border-indigo-200 rounded-lg overflow-hidden">
                    <div className={`p-3 ${q.level === 'critical' ? 'bg-indigo-100' : 'bg-blue-50'}`}>
                      <span className="text-sm font-medium">
                        {q.level === 'critical' ? 'Critical Analysis' : 'Basic Understanding'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      {/* Question introduction */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full font-medium">
                          {idx + 1}
                        </span>
                        {Array.isArray(q.focusVocabulary) && q.focusVocabulary.length > 0 && (
                          <p className="text-gray-600">
                            This discussion incorporates key vocabulary including {q.focusVocabulary.join(', ')}. 
                            Using these terms in your discussion will help reinforce their meaning and usage in context.
                          </p>
                        )}
                      </div>
                      
                      {/* Question content */}
                      <div className="mt-4 flex flex-col md:flex-row gap-4 items-start">
                        <div className="md:w-7/12">
                          <h3 className="text-xl font-medium mb-4">{q.question}</h3>
                          
                          {/* Focus vocabulary */}
                          {Array.isArray(q.focusVocabulary) && q.focusVocabulary.length > 0 && (
                            <div className="bg-green-50 p-3 rounded-md mb-4">
                              <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                                <Book className="h-4 w-4" /> Focus Vocabulary
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {q.focusVocabulary.map((word: string, wIdx: number) => (
                                  <Badge key={wIdx} variant="outline" className="bg-green-50 border-green-200">
                                    {word}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Follow-up questions */}
                          {q.followUp && q.followUp.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Follow-up Questions:</h4>
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {q.followUp.map((follow: string, fIdx: number) => (
                                  <li key={`followup-${fIdx}`}>{follow}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Image placeholder */}
                        <div className="md:w-5/12 border rounded-md p-2 bg-gray-50">
                          <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No discussion questions available</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const QuizSection = () => {
    // Try both quiz and assessment as possible section types
    const section = findSection('quiz') || findSection('assessment');
    if (!section) return <p>No quiz content available</p>;
    
    const [activeQuestion, setActiveQuestion] = useState(0);
    const questions = section.questions || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-cyan-50">
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <CheckSquare className="h-5 w-5" />
              {section.title || "Knowledge Check Quiz"}
            </CardTitle>
            <CardDescription>
              {section.introduction || "Test knowledge and understanding of the lesson"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {questions.length > 0 ? (
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
                    <p>{questions[activeQuestion].question || 
                         questions[activeQuestion].content?.question || 
                         "Question text"}</p>
                    <p className="text-sm text-gray-500 mt-1">Choose the best answer.</p>
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-3">
                    {(questions[activeQuestion].options || 
                      questions[activeQuestion].content?.options || 
                      ["Option A", "Option B", "Option C", "Option D"]).map((option: string, idx: number) => (
                      <div key={`quiz-option-${idx}`} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                          {['A', 'B', 'C', 'D'][idx]}
                        </div>
                        <span>{option}</span>
                      </div>
                    ))}
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
            ) : (
              <p className="text-gray-500">No quiz questions available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Teacher notes */}
        {section.teacherNotes && (
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <GraduationCap className="h-4 w-4" />
                Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-gray-700">
              <p>{section.teacherNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Get all available sections for tabs
  console.log("Original sections:", parsedContent.sections);
  
  // Make sure sections exist and have valid types before mapping
  const availableSections = parsedContent.sections && Array.isArray(parsedContent.sections)
    ? parsedContent.sections
        .filter((s: any) => s && typeof s === 'object' && s.type && typeof s.type === 'string')
        .map((s: any) => s.type)
    : [];
    
  console.log("Available sections for tabs:", availableSections);
  
  return (
    <div className="lesson-content max-w-5xl mx-auto">
      {/* Lesson header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{parsedContent.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            Level: {parsedContent.level}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            Focus: {parsedContent.focus}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            Time: {parsedContent.estimatedTime} minutes
          </span>
        </div>
      </div>
      
      {/* Tabbed interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="mb-6 h-14 bg-white border-b w-full justify-start">
            {availableSections.map((sectionType: string) => {
              // Find the matching section definition
              const details = sectionDetails[sectionType as SectionType] || {
                icon: BookOpen,
                label: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
                color: "bg-gray-100",
                textColor: "text-gray-700",
                description: "Section content"
              };
              
              const Icon = details.icon;
              
              return (
                <TabsTrigger 
                  key={sectionType} 
                  value={sectionType}
                  className={`flex items-center gap-2 px-4 py-2 h-full data-[state=active]:${details.color} data-[state=active]:${details.textColor}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{details.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        
        {/* Section content */}
        <div className="p-1">
          <TabsContent value="warmup" className="m-0">
            <WarmupSection />
          </TabsContent>
          
          <TabsContent value="warm-up" className="m-0">
            <WarmupSection />
          </TabsContent>
          
          <TabsContent value="reading" className="m-0">
            <ReadingSection />
          </TabsContent>
          
          <TabsContent value="vocabulary" className="m-0">
            <VocabularySection />
          </TabsContent>
          
          <TabsContent value="comprehension" className="m-0">
            <ComprehensionSection />
          </TabsContent>
          
          <TabsContent value="sentenceFrames" className="m-0">
            <SentenceFramesSection />
          </TabsContent>
          
          <TabsContent value="grammar" className="m-0">
            <SentenceFramesSection />
          </TabsContent>
          
          <TabsContent value="discussion" className="m-0">
            <DiscussionSection />
          </TabsContent>
          
          <TabsContent value="speaking" className="m-0">
            <DiscussionSection />
          </TabsContent>
          
          <TabsContent value="quiz" className="m-0">
            <QuizSection />
          </TabsContent>
          
          <TabsContent value="assessment" className="m-0">
            <QuizSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
