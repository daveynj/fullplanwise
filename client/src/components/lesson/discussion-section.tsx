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
  Image as ImageIcon
} from "lucide-react";

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

  try {
    console.log("Discussion section structure:", JSON.stringify({
      type: section.type,
      title: section.title,
      questions: section.questions
    }, null, 2));
    
    // First, check if the section is the Qwen special format with questions as key-value pairs
    if (section.questions) {
      // Handle the Qwen format where questions is an object with question-answer pairs
      if (typeof section.questions === 'object' && !Array.isArray(section.questions)) {
        console.log("Found Qwen question-answer object format");
        
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
          console.log("Extracted questions from Qwen format:", questions.length);
        }
      }
      
      // Otherwise check if we have questions directly in the section.questions array
      if (Array.isArray(section.questions) && section.questions.length > 0) {
        console.log("Found questions array in section:", section.questions.length, "questions");
        
        // Clean up any malformed questions
        const validQuestions = section.questions.filter((q: any) => 
          q && typeof q === 'object' && (q.question || q.text)
        ).map((q: any) => ({
          question: q.question || q.text || "Discussion question",
          level: q.level || "basic",
          introduction: q.introduction || "", // Extract introduction if present
          focusVocabulary: q.focusVocabulary || q.vocabulary || [],
          followUp: q.followUp || [],
          paragraphContext: q.paragraphContext || q.context || "",
          topic: q.topic || ""
        }));
        
        // If we have valid questions use them
        if (validQuestions.length > 0 && validQuestions[0].question !== 'question') {
          questions = validQuestions;
          console.log("Using questions array with", questions.length, "valid questions");
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
      // This is the Qwen format from the example
      console.log("Processing Qwen question object format");
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
                          <div className="mb-4 p-3 bg-gray-50 border border-indigo-100 rounded-md text-gray-700 italic">
                            <h4 className="text-sm font-medium text-indigo-700 mb-2">Context:</h4>
                            <p>{q.paragraphContext}</p>
                          </div>
                        )}
                        
                        {/* Topic introduction paragraph if available */}
                        {q.topic && (
                          <p className="text-gray-700 mb-4">{q.topic}</p>
                        )}
                        
                        {/* Question introduction sentence if available */}
                        {q.introduction && (
                          <div className="p-3 mb-3 bg-blue-50 border border-blue-100 rounded-md text-gray-700">
                            <p className="italic">{q.introduction}</p>
                          </div>
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