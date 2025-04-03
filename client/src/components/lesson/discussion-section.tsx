import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  MessageCircle,
  GraduationCap,
} from "lucide-react";

interface DiscussionQuestion {
  question: string;
  level?: "basic" | "critical";
  topic?: string;
  focusVocabulary?: string[];
  followUp?: string[];
  paragraphContext?: string;
}

interface DiscussionSectionProps {
  section?: any;
}

export function DiscussionSection({ section }: DiscussionSectionProps) {
  if (!section) return <p>No discussion content available</p>;

  // Process discussion questions from the section
  let questions: DiscussionQuestion[] = [];

  try {
    // Add more detailed debugging to understand the structure
    console.log("Discussion section structure:", JSON.stringify(section, null, 2));
    
    // Check the structure of the entire content object (the parent of this section)
    console.log("Discussion section keys:", Object.keys(section));
    if (section.questions) {
      console.log("Discussion questions type:", typeof section.questions);
      
      if (typeof section.questions === "object" && !Array.isArray(section.questions)) {
        console.log("Questions object keys:", Object.keys(section.questions));
      }
    }
    
    // Check for direct question-like keys in the section
    const questionLikeKeys = Object.keys(section).filter(key => 
      key.includes("?") || ["What", "Why", "How", "Which", "Where", "When"].some(w => key.includes(w))
    );
    if (questionLikeKeys.length > 0) {
      console.log("Found question-like keys in section:", questionLikeKeys);
    }
    
    // Attempt to extract questions from various possible formats
    if (section.questions && Array.isArray(section.questions)) {
      questions = section.questions;
    } else if (section.discussionQuestions && Array.isArray(section.discussionQuestions)) {
      questions = section.discussionQuestions;
    } else if (section.questions && typeof section.questions === 'object' && !Array.isArray(section.questions)) {
      // Handle questions as object where keys are questions and values might be answers or descriptions
      // This is the Qwen format from the example
      console.log("Processing Qwen question object format");
      const extractedQuestions: DiscussionQuestion[] = [];
      
      for (const questionText in section.questions) {
        if (typeof questionText === 'string' && questionText.trim()) {
          extractedQuestions.push({
            question: questionText,
            level: questionText.includes('critical') ? 'critical' : 'basic',
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
          const question = section[key];
          extractedQuestions.push({
            question: question.question || question.text || key,
            level: question.level || (key.includes("critical") ? "critical" : "basic"),
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
      
      // Handle the case where questions are direct key-value pairs in the section (Qwen format)
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
          
          extractedQuestions.push({
            question: key,
            level: key.toLowerCase().includes("critical") ? "critical" : "basic",
            focusVocabulary: vocabWords,
            followUp: typeof section[key] === "string" ? [section[key]] : []
          });
        }
      }
      
      if (extractedQuestions.length > 0) {
        questions = extractedQuestions;
      }
    }
  } catch (error) {
    console.error("Error processing discussion questions:", error);
  }

  return (
    <div className="space-y-6">
      {/* Main section header */}
      <div className="bg-indigo-50 rounded-lg p-4 flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-indigo-600 font-medium text-lg">Discussion</h2>
          <p className="text-gray-600 text-sm">Reflect on the reading through guided discussion</p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-indigo-50">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <MessageCircle className="h-5 w-5" />
            {section.title || "Post-reading Discussion"} ({questions.length} questions)
          </CardTitle>
          <CardDescription>
            {section.introduction || "Discuss these questions to deepen understanding of the reading"}
          </CardDescription>
        </CardHeader>
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
                        {/* Paragraph context if available */}
                        {q.paragraphContext && (
                          <div className="mb-4 p-3 bg-gray-50 border rounded-md text-gray-700 italic">
                            <p>{q.paragraphContext}</p>
                          </div>
                        )}
                        
                        {/* Topic introduction paragraph if available */}
                        {q.topic && (
                          <p className="text-gray-700 mb-4">{q.topic}</p>
                        )}
                        
                        <h3 className="text-xl font-medium mb-4">{q.question}</h3>
                        
                        {/* Focus vocabulary */}
                        {Array.isArray(q.focusVocabulary) && q.focusVocabulary.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-md mb-4">
                            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                              <Book className="h-4 w-4" /> Focus Vocabulary
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {q.focusVocabulary.map((word, wIdx) => (
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
                              {q.followUp.map((follow, fIdx) => (
                                <li key={`followup-${fIdx}`}>{follow}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Image placeholder */}
                      <div className="md:w-5/12 border rounded-md p-2 bg-gray-50">
                        <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 text-gray-400" />
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
}