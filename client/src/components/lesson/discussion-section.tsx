import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MessageCircle,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { SectionHeader } from "./shared/section-header";

interface DiscussionQuestion {
  question: string;
  level?: "basic" | "critical";
  topic?: string;
  introduction?: string; // Introduction sentence before the question
  focusVocabulary?: string[];
  followUp?: string[];
  paragraphContext?: string;
  answer?: string; // Add support for answer field
  imageBase64?: string | null; // Added for Stability AI image
}

interface DiscussionSectionProps {
  section?: any;
}

export function DiscussionSection({ section }: DiscussionSectionProps) {
  if (!section) return <p>No discussion content available</p>;

  // Process discussion questions from the section
  let questions: DiscussionQuestion[] = [];
  let sectionTitle = section.title || "Post-reading Discussion"; // Keep section title

  try {
    console.log("Discussion section structure:", JSON.stringify({
      type: section.type,
      title: section.title,
      questions: section.questions
    }, null, 2));
    
    // First, check if the section has questions as key-value pairs
    if (section.questions) {
      // Handle format where questions is an object with question-answer pairs
      if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
        console.log("Found question-answer object format");
        
        const questionKeys = Object.keys(section.questions).filter(key => 
          typeof key === 'string' && 
          key.trim().length > 0 &&
          key !== 'question' && // Skip placeholder keys
          key !== 'answer'
        );
        
        if (questionKeys.length > 0) {
          const validQuestions: DiscussionQuestion[] = questionKeys.map(questionText => {
            const answer = section.questions[questionText];
            const level = questionText.toLowerCase().includes('critical') ? 'critical' : 'basic';
            return {
              question: questionText,
              level: level as "basic" | "critical",
              followUp: typeof answer === 'string' && answer.trim() ? [answer] : []
            };
          });
          
          questions = validQuestions;
          console.log("Extracted questions from object format:", questions.length);
        }
      }
      
      // Otherwise check if we have questions directly in the section.questions array
      if (Array.isArray(section.questions) && section.questions.length > 0) {
        console.log("Found questions array in section:", section.questions.length, "questions");
        
        // Clean up any malformed questions and ensure paragraphContext is kept
        const validQuestions = section.questions.filter((q: any) => 
          q && typeof q === 'object' && (q.question || q.text)
        ).map((q: any) => ({
          question: q.question || q.text || "Discussion question",
          level: q.level || "basic",
          introduction: q.introduction || "", // Keep this if AI provides it per question
          focusVocabulary: q.focusVocabulary || q.vocabulary || [],
          followUp: q.followUp || [],
          paragraphContext: q.paragraphContext || q.context || q.paragraph || "", // Prioritize paragraphContext
          topic: q.topic || "",
          imageBase64: q.imageBase64 || null, // Keep imageBase64
          imagePrompt: q.imagePrompt || "" // Keep imagePrompt
        }));
        
        if (validQuestions.length > 0) {
            questions = validQuestions;
            console.log("Using questions array with", questions.length, "valid questions including paragraphContext");
        } else {
            console.warn("Questions array found but no valid questions extracted.");
        }
      }
    }
    
    // If no valid questions found in array, look for keys that look like discussion questions 
    // but aren't standard section properties
    const questionPatterns = [
      /how/i, /why/i, /what/i, /which/i, /where/i, /when/i, /who/i, 
      /can/i, /do you think/i, /should/i, /could/i, /would/i, /discuss/i
    ];
    
    const discussionQuestionsKeys = Object.keys(section).filter(key => 
      // Check for question patterns
      (key.includes("?") || questionPatterns.some(pattern => pattern.test(key))) && 
      // Avoid standard section keys
      !["type", "title", "introduction", "content", "questions"].includes(key) &&
      // Make sure the value is a string or object (not a function or other JS construct)
      (typeof section[key] === "string" || typeof section[key] === "object")
    );
    
    if (discussionQuestionsKeys.length > 0) {
      console.log("Found direct discussion question keys:", discussionQuestionsKeys);
      
      const extractedDirectQuestions: DiscussionQuestion[] = [];
      
      for (const key of discussionQuestionsKeys) {
        const value = section[key] || "";
        const focusWords: string[] = [];
        
        // Extract vocabulary focus words from question (quoted or emphasized words)
        const emphasisPattern = /'([^']+)'|"([^"]+)"/g;
        let match;
        while ((match = emphasisPattern.exec(key)) !== null) {
          const word = match[1] || match[2];
          if (word && !focusWords.includes(word)) {
            focusWords.push(word);
          }
        }
        
        extractedDirectQuestions.push({
          question: key,
          level: key.toLowerCase().includes("critical") ? "critical" : "basic",
          focusVocabulary: focusWords,
          followUp: typeof value === "string" ? [value] : []
        });
      }
      
      if (extractedDirectQuestions.length > 0) {
        questions = extractedDirectQuestions;
        console.log("Using extracted direct questions:", questions.length);
      }
    }
    
    // Attempt to extract questions from various possible formats
    if (section.questions && Array.isArray(section.questions)) {
      questions = section.questions;
    } else if (section.discussionQuestions && Array.isArray(section.discussionQuestions)) {
      questions = section.discussionQuestions;
    } else if (section.questions && typeof section.questions === 'object' && !Array.isArray(section.questions)) {
      // Handle questions as object where keys are questions and values might be answers or descriptions
      // This handles various AI response formats
      console.log("Processing question object format");
      const extractedQuestions: DiscussionQuestion[] = [];
      
      for (const questionText in section.questions) {
        if (typeof questionText === 'string' && questionText.trim()) {
          const qLevel = questionText.includes('critical') ? 'critical' : 'basic';
          extractedQuestions.push({
            question: questionText,
            level: qLevel as "basic" | "critical",
            focusVocabulary: [],
            followUp: []
          });
        }
      }
      
      if (extractedQuestions.length > 0) {
        questions = extractedQuestions;
      }
    } else {
      // Try to parse questions from other possible formats
      const extractedQuestions: DiscussionQuestion[] = [];
      
      // Check if the section has properties that match question patterns
      const keys = Object.keys(section);
      for (const key of keys) {
        if (
          (key.includes("question") || /^[0-9]+$/.test(key)) && 
          typeof section[key] === "object"
        ) {
          // This might be a question object
          const question: any = section[key];
          const qLevel = question.level || (key.includes("critical") ? "critical" : "basic");
          extractedQuestions.push({
            question: question.question || question.text || key,
            level: qLevel as "basic" | "critical",
            topic: question.topic || question.context,
            focusVocabulary: question.focusVocabulary || question.vocabulary || [],
            followUp: question.followUp || question.followUpQuestions || [],
            paragraphContext: question.paragraphContext || question.paragraph || question.context
          });
        } else if (
          (key.includes("question") || /^[0-9]+$/.test(key)) && 
          typeof section[key] === "string"
        ) {
          // This might be a question string directly
          extractedQuestions.push({
            question: section[key],
            level: "basic",
            focusVocabulary: [] 
          });
        }
      }
      
      // Handle the case where questions are direct key-value pairs in the section
      // Example: "How might commercialization affect holidays?": "Some answer or more context"
      const questionPatterns = [
        /how/i, /why/i, /what/i, /which/i, /where/i, /when/i, /who/i, 
        /can/i, /do you think/i, /should/i, /could/i, /would/i
      ];
      
      for (const key of keys) {
        if (
          // Avoid keys that are likely not questions
          !["type", "title", "introduction", "content", "questions"].includes(key) &&
          // Check if key looks like a question
          (key.includes("?") || questionPatterns.some(pattern => pattern.test(key)))
        ) {
          console.log("Found potential question as direct key:", key);
          
          // Get vocabulary words that might be mentioned in the question
          const vocabWords: string[] = [];
          const questionWords = key.toLowerCase().split(/\s+/);
          
          // Look for emphasized words that might be vocab focus
          const emphasisPatterns = [/'([^']+)'/g, /"([^"]+)"/g];
          let match;
          
          for (const pattern of emphasisPatterns) {
            while ((match = pattern.exec(key)) !== null) {
              if (match[1] && !vocabWords.includes(match[1])) {
                vocabWords.push(match[1]);
              }
            }
          }
          
          const qLevel = key.toLowerCase().includes("critical") ? "critical" : "basic";
          extractedQuestions.push({
            question: key,
            level: qLevel as "basic" | "critical",
            focusVocabulary: vocabWords,
            followUp: typeof section[key] === "string" ? [section[key]] : []
          });
        }
      }
      
      if (extractedQuestions.length > 0) {
        questions = extractedQuestions;
      }
    }
 
    // Update section title if it's the speaking section
    if (section.type === 'speaking') {
        sectionTitle = section.title || "Speaking Activity";
    }
  } catch (error) {
    console.error("Error processing discussion questions:", error);
  }
  
  const description = section.description || "Read the text and answer the discussion questions. Use key vocabulary from the lesson.";

  // Render the discussion section
  return (
    <div className="space-y-4">
      {/* Main section header with consistent styling */}
      <SectionHeader
        icon={MessageCircle}
        title={sectionTitle}
        description={description}
        color="indigo"
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {questions.length > 0 ? (
              questions.map((q, idx) => (
                <div key={`discussion-${idx}`} className="border border-indigo-200 rounded-lg overflow-hidden">
                  <div className={`p-3 ${q.level === 'critical' ? 'bg-indigo-100' : 'bg-blue-50'}`}>
                    <span className="text-sm font-medium">
                      {q.level === 'critical' ? 'Critical Analysis' : 'Basic Understanding'}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {/* Question content */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Text content area */}
                      <div className="md:w-7/12 space-y-4">
                         {/* Paragraph context rendered PER question - with improved styling */}
                        {q.paragraphContext && (
                          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md shadow-sm">
                            <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2 pb-2 border-b border-blue-200">
                               <BookOpen className="h-5 w-5 text-blue-600" /> Reading Context
                            </h4>
                            <p className="italic text-gray-800 leading-relaxed text-xl font-bold">{q.paragraphContext}</p>
                          </div>
                        )}
                        
                        {/* Question Number and Text - with improved styling */}
                        <div className="p-3 bg-indigo-100 rounded-md border-l-4 border-indigo-500">
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-500 text-white rounded-full font-bold mt-1">
                              {idx + 1}
                            </span>
                            <h3 className="text-indigo-900 text-xl font-nunito font-bold">{q.question}</h3>
                          </div>
                        </div>
                        
                        {/* Topic introduction paragraph (if AI still provides it, display it) */}
                        {q.topic && (
                          <p className="text-gray-700 italic pl-10 font-medium">{q.topic}</p>
                        )}
                        
                        {/* Question introduction sentence (if AI still provides it, display it) */}
                        {q.introduction && (
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-gray-700 ml-10">
                            <p className="italic font-medium text-gray-800">{q.introduction}</p>
                          </div>
                        )}
                        
                        {/* Focus vocabulary */}
                        {Array.isArray(q.focusVocabulary) && q.focusVocabulary.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-md ml-10">
                            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                              <BookOpen className="h-4 w-4 text-green-600" /> Focus Vocabulary
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {q.focusVocabulary.map((word, wIdx) => (
                                <Badge key={wIdx} variant="outline" className="bg-white border-green-200 text-green-800">
                                  {word}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Follow-up questions - with improved styling */}
                        {q.followUp && q.followUp.length > 0 && (
                          <div className="ml-6 mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
                            <h4 className="text-sm font-medium mb-2 text-indigo-700 flex items-center">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Follow-up Questions:
                            </h4>
                            <ul className="space-y-2 pl-2">
                              {q.followUp.map((follow, fIdx) => (
                                <li key={`followup-${fIdx}`} className="flex items-start gap-2">
                                  <span className="inline-flex items-center justify-center h-5 w-5 bg-indigo-200 text-indigo-800 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                                    {String.fromCharCode(97 + fIdx)}
                                  </span>
                                  <span className="text-gray-800 text-xl font-bold">{follow}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                       {/* Image Display */}
                       <div className="md:w-5/12">
                        {q.imageBase64 ? (
                          <img 
                            src={`data:image/png;base64,${q.imageBase64}`}
                            alt={`Illustration for discussion question`}
                            className="rounded-lg border border-indigo-200 shadow-sm max-w-full h-auto aspect-video object-cover"
                          />
                        ) : (
                           <div className="border rounded-md p-2 bg-gray-50">
                            <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                        )}
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
              <FileText className="h-4 w-4" />
              Teacher Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-gray-700">
            <p className="font-medium text-gray-800">{section.teacherNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}