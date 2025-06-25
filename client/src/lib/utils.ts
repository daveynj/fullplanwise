import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to extract quiz questions from lesson content
 * Works with various AI response formats
 */
export function extractQuizQuestions(content: any): { question: string; answer: string; type?: string; options?: string[] }[] {
  if (!content) return [];
  
  let questions: { question: string; answer: string; type?: string; options?: string[] }[] = [];
  
  try {
    // Case 1: Look for direct quiz section in the content structure
    if (content.sections && Array.isArray(content.sections)) {
      const section = content.sections.find((s: any) => 
        s.type === 'quiz' || s.type === 'assessment' || 
        (s.title && typeof s.title === 'string' && 
         (s.title.toLowerCase().includes('quiz') || s.title.toLowerCase().includes('assessment')))
      );
      
      if (section && section.questions && Array.isArray(section.questions) && section.questions.length > 0) {
        return section.questions;
      }
    }
    
    // Case 2: Look for quiz questions directly in the content
    if (content.quiz && typeof content.quiz === 'object') {
      if (Array.isArray(content.quiz)) {
        return content.quiz;
      } else if (content.quiz.questions && Array.isArray(content.quiz.questions)) {
        return content.quiz.questions;
      }
    }
    
    // No questions found in content, return empty array
    return [];
    
  } catch (err) {
    console.error("Error extracting quiz questions:", err);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Utility to extract comprehension questions from lesson content
 * Works with various AI response formats
 */
export function extractComprehensionQuestions(content: any): { question: string; answer: string; type?: string; options?: string[] }[] {
  if (!content) return [];
  
  let questions: { question: string; answer: string; type?: string; options?: string[] }[] = [];
  
  try {
    // Case 1: Look for direct comprehension section in the content structure
    if (content.sections && Array.isArray(content.sections)) {
      const section = content.sections.find((s: any) => 
        s.type === 'comprehension' || 
        (s.title && typeof s.title === 'string' && s.title.toLowerCase().includes('comprehension'))
      );
      
      if (section && section.questions && Array.isArray(section.questions) && section.questions.length > 0) {
        return section.questions;
      }
    }
    
    // Case 2: Look for question and answer pairs in the root content
    const questionKeys = Object.keys(content).filter(key => {
      if (typeof key !== 'string') return false;
      return (
        key.includes('?') && 
        key.length > 15 && 
        typeof content[key] === 'string' &&
        content[key].length > 10
      );
    });
    
    if (questionKeys.length >= 3) {
      questions = questionKeys.map(q => ({
        question: q,
        answer: typeof content[q] === 'string' ? content[q] : '',
        type: q.toLowerCase().includes('true') || q.toLowerCase().includes('false') ? 'true-false' : 'multiple-choice'
      }));
      
      if (questions.length >= 3) {
        return questions;
      }
    }
    
    // No questions found in content, return empty array
    return [];
    
  } catch (err) {
    console.error("Error extracting comprehension questions:", err);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Utility to extract discussion questions from lesson content
 * Works with various AI response formats
 */
export function extractDiscussionQuestions(content: any): any[] {
  if (!content) return [];
  
  const questions: any[] = [];
  
  try {
    console.log("Extracting discussion questions from:", JSON.stringify(content).substring(0, 500));
    
    // NEW APPROACH: Look for structured string discussion prompt responses in reading
    // Some AI responses put the structured discussion paragraph + questions in a string within reading
    if (content.sections && Array.isArray(content.sections)) {
      // First check reading sections for discussion prompts
      const readingSections = content.sections.filter((s: any) => 
        s && typeof s === 'object' && (s.type === 'reading' || s.type === 'post-reading')
      );
      
      for (const readingSection of readingSections) {
        // Check various possible fields for discussion content
        const possibleFields = ['afterReading', 'discussion', 'discussionQuestions', 'postReading', 'followUp'];
        
        for (const field of possibleFields) {
          if (readingSection[field] && typeof readingSection[field] === 'string') {
            const text = readingSection[field];
            console.log(`Found potential discussion content in reading section.${field}:`, text.substring(0, 100));
            
            // Try to extract a paragraph and questions pattern
            const lines = text.split(/\n+/);
            
            // Look for paragraph (typically the first few non-empty lines without question marks)
            let paragraphContext = "";
            let followUpQuestions: string[] = [];
            
            // First, find paragraph content (lines without question marks, at the beginning)
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line && !line.includes('?') && paragraphContext.length < 500 && followUpQuestions.length === 0) {
                if (paragraphContext) paragraphContext += " ";
                paragraphContext += line;
              } else if (line && line.includes('?')) {
                // Once we hit a question, record it and stop considering text as part of paragraph
                followUpQuestions.push(line);
              }
            }
            
            if (paragraphContext && followUpQuestions.length > 0) {
              console.log("Extracted discussion paragraph:", paragraphContext.substring(0, 100));
              console.log("Extracted follow-up questions:", followUpQuestions);
              
              // Create a discussion question for each follow-up question
              followUpQuestions.forEach((q, idx) => {
                questions.push({
                  question: q,
                  paragraphContext,
                  level: q.toLowerCase().includes("critical") ? "critical" : "basic"
                });
              });
              
              if (questions.length > 0) {
                console.log("Successfully extracted discussion questions from reading section content");
                return questions;
              }
            }
          }
        }
      }
    }
    
    // Standard case: Look for discussion section in sections array
    if (content.sections && Array.isArray(content.sections)) {
      console.log("Looking for discussion section in sections array");
      const discussionSection = content.sections.find((s: any) => 
        s && typeof s === 'object' && s.type === 'discussion'
      );
      
      if (discussionSection) {
        console.log("Found discussion section:", JSON.stringify(discussionSection));
        
        // Extract introduction if available
        let introduction = discussionSection.introduction || "";
        
        // Check if we have a paragraph context at the section level
        let sectionParagraphContext = discussionSection.paragraphContext || discussionSection.context || "";
        
        // If introduction looks like a paragraph (has periods, no questions), it might be the paragraph context
        if (!sectionParagraphContext && introduction && introduction.includes('.') && !introduction.includes('?')) {
          console.log("Introduction looks like a paragraph context, storing it as such");
          sectionParagraphContext = introduction;
        }
        
        if (sectionParagraphContext) {
          console.log("Found section-level paragraph context:", sectionParagraphContext.substring(0, 100));
        }
        
        // DIRECT KEY EXTRACTION - Special case for the specific format seen in logs
        // This is a critical case for AI formats where question keys are the actual questions
        const allKeys = Object.keys(discussionSection);
        console.log("Looking for direct question keys in discussion section:", allKeys);
        const questionKeys = allKeys.filter(key => 
          typeof key === 'string' && 
          key.includes('?') && 
          key !== 'type' && 
          key !== 'title' && 
          key !== 'introduction'
        );
        
        if (questionKeys.length > 0) {
          console.log("Found question keys directly in section:", questionKeys);
          questionKeys.forEach(questionText => {
            questions.push({
              question: questionText.trim(),
              introduction: introduction,
              level: "basic"
            });
          });
          
          if (questions.length > 0) {
            console.log("Successfully extracted direct question keys:", questions);
            return questions;
          }
        }
        
        // Handle AI format with questions as array or object
        if (discussionSection.questions) {
          if (Array.isArray(discussionSection.questions)) {
            // Handle array format
            console.log("Discussion questions as array:", discussionSection.questions);
            
            // Map the questions, but with enhanced structure debugging
            const processedQuestions = discussionSection.questions.map((q: any) => {
              console.log("Processing discussion question item:", q);
              
              if (typeof q === 'string') {
                return { 
                  question: q, 
                  introduction: introduction,
                  paragraphContext: sectionParagraphContext || null
                };
              } else if (typeof q === 'object') {
                // Look for paragraph context, followUp, and other possible fields
                console.log("Question object fields:", Object.keys(q));
                
                // Check for paragraph context in various possible field names
                const paragraphContext = q.paragraphContext || q.context || q.paragraph || q.introduction || "";
                if (paragraphContext) {
                  console.log("Found paragraph context:", paragraphContext.substring(0, 100) + "...");
                }
                
                // Check for follow-up questions in various possible field names
                const followUp = q.followUp || q.followUpQuestions || [];
                if (Array.isArray(followUp) && followUp.length > 0) {
                  console.log("Found follow-up questions:", followUp);
                } else if (typeof q.answer === 'string' && q.answer.trim()) {
                  // If there's an answer field but no followUp, the answer might contain follow-up information
                  console.log("Found possible follow-up in answer field:", q.answer);
                }
                
                return { 
                  ...q, 
                  introduction: q.introduction || introduction,
                  // Explicitly ensure followUp and paragraphContext are included
                  followUp: followUp,
                  paragraphContext: paragraphContext
                };
              }
              return null;
            }).filter(Boolean);
            
            console.log("Final processed questions:", processedQuestions);
            return processedQuestions;
          } else if (typeof discussionSection.questions === 'object') {
            // Handle object format (AI sometimes returns objects instead of arrays)
            console.log("Discussion questions as object:", discussionSection.questions);
            
            // Special case: Check if question keys themselves contain question marks
            // This handles various AI response formats
            const directQuestionKeys = Object.keys(discussionSection.questions).filter(
              key => typeof key === 'string' && key.includes('?')
            );
            
            if (directQuestionKeys.length > 0) {
              console.log("Found direct question keys in questions object:", directQuestionKeys);
              
              directQuestionKeys.forEach(questionText => {
                questions.push({
                  question: questionText.trim(),
                  introduction: introduction,
                  paragraphContext: sectionParagraphContext || null,
                  level: "basic"
                });
              });
              
              if (questions.length > 0) {
                console.log("Extracted direct question keys from questions object:", questions);
                return questions;
              }
            }
            
            // Standard case: Look for question keys/values
            const questionKeys = Object.keys(discussionSection.questions).filter(
              key => typeof discussionSection.questions[key] === 'string' && 
                    (key.includes('question') || discussionSection.questions[key].includes('?'))
            );
            
            if (questionKeys.length > 0) {
              questionKeys.forEach(key => {
                const question = discussionSection.questions[key];
                if (question && typeof question === 'string' && question.trim().length > 0) {
                  questions.push({ 
                    question: question.trim(),
                    introduction: introduction,
                    paragraphContext: sectionParagraphContext || null,
                    level: "basic"
                  });
                }
              });
              
              if (questions.length > 0) {
                console.log("Extracted questions from object:", questions);
                return questions;
              }
            }
          }
        }
      }
    }
    
    // Case 2: Try to find discussion section directly in content
    if (content.discussion && typeof content.discussion === 'object') {
      console.log("Found discussion object directly in content");
      const discussionData = content.discussion;
      
      // Extract introduction
      let introduction = "";
      if (discussionData.introduction && typeof discussionData.introduction === 'string') {
        introduction = discussionData.introduction;
      }
      
      // Extract questions
      if (discussionData.questions) {
        if (Array.isArray(discussionData.questions)) {
          // Handle array format
          return discussionData.questions.map((q: any) => {
            if (typeof q === 'string') {
              return { question: q, introduction: introduction };
            } else if (typeof q === 'object') {
              return { ...q, introduction: q.introduction || introduction };
            }
            return null;
          }).filter(Boolean);
        } else if (typeof discussionData.questions === 'object') {
          // Extract questions from question object (common in AI responses)
          const extractedQuestions: any[] = [];
          const questionValues = Object.values(discussionData.questions).filter(
            (val: any) => typeof val === 'string' && val.includes('?')
          );
          
          questionValues.forEach((q: any) => {
            if (typeof q === 'string') {
              extractedQuestions.push({
                question: q,
                introduction: introduction,
                level: "basic"
              });
            }
          });
          
          if (extractedQuestions.length > 0) {
            return extractedQuestions;
          }
        }
      }
    }
    
    // Case 3: Fallback - look for any strings that look like questions in the lesson
    console.log("Trying to extract questions from direct string properties");
    const allStringProperties = Object.entries(content)
      .filter(([key, value]) => typeof value === 'string' && value.includes('?') && value.length > 20)
      .map(([key, value]) => ({ key, value }));
    
    if (allStringProperties.length > 0) {
      for (const { key, value } of allStringProperties) {
        if (key.toLowerCase().includes('question') || 
            key.toLowerCase().includes('discussion') || 
            key.toLowerCase().includes('speaking')) {
          
          // Split by line breaks and extract questions
          const lines = String(value).split(/[\r\n]+/);
          const questionLines = lines.filter(line => line.includes('?'));
          
          questionLines.forEach(line => {
            if (line.length > 20) {
              questions.push({
                question: line.trim(),
                level: line.toLowerCase().includes('critical') ? 'critical' : 'basic'
              });
            }
          });
        }
      }
      
      if (questions.length > 0) {
        console.log("Extracted questions from string properties:", questions);
        return questions;
      }
    }
    
    // If we get to this point and haven't found valid discussion questions, 
    // log the issue and return an empty array for the component to handle
    console.log("No discussion questions found in the API response");
    return [];
  } catch (err) {
    console.error("Error extracting discussion questions:", err);
    return [];
  }
}
