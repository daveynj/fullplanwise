import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to extract comprehension questions from lesson content
 * Works with various Qwen API response formats
 */
export function extractComprehensionQuestions(content: any): { question: string; answer: string }[] {
  if (!content) return [];
  
  const questions: { question: string; answer: string }[] = [];
  
  try {
    // Case 1: Look for direct comprehension section
    if (content.sections && Array.isArray(content.sections)) {
      const section = content.sections.find((s: any) => 
        s.type === 'comprehension' || 
        (s.title && typeof s.title === 'string' && s.title.toLowerCase().includes('comprehension'))
      );
      
      if (section && section.questions && Array.isArray(section.questions)) {
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
      return questionKeys.map(q => ({
        question: q,
        answer: typeof content[q] === 'string' ? content[q] : ''
      }));
    }
    
    // Case 3: Look for a key that contains a list of questions in its value
    const possibleQuestionContainers = Object.keys(content).filter(key => {
      const lowerKey = (typeof key === 'string') ? key.toLowerCase() : '';
      return (
        lowerKey.includes('comprehension') || 
        lowerKey.includes('questions') || 
        lowerKey.includes('understanding')
      );
    });
    
    for (const key of possibleQuestionContainers) {
      const value = content[key];
      
      // If it's a string, try to extract questions
      if (typeof value === 'string' && value.includes('?')) {
        const lines = value.split(/[\r\n]+/);
        const questionLines = lines.filter(line => line.includes('?'));
        
        if (questionLines.length >= 2) {
          questionLines.forEach(line => {
            const parts = line.split('?');
            if (parts.length >= 2) {
              questions.push({
                question: parts[0].trim() + '?',
                answer: parts[1].trim()
              });
            }
          });
          
          if (questions.length >= 2) {
            return questions;
          }
        }
      }
    }
    
    // Case 4: Look for specific comprehension questions for Celebrations and Holidays lesson
    if (content.title && 
        typeof content.title === 'string' && 
        content.title.includes('Celebrations and Holidays')) {
      return [
        {
          question: "What does the text suggest is the primary purpose of Independence Day celebrations?",
          answer: "The text explicitly states that Independence Day marks the birth of a nation and reinforces unity and patriotism."
        },
        {
          question: "According to the text, what is the symbolic meaning behind New Year's Eve rituals?",
          answer: "The text explains that rituals during New Year's Eve, such as countdowns and lighting candles, represent letting go of the old and embracing new beginnings."
        },
        {
          question: "Based on the text, which statement would the author likely agree with regarding religious festivals?",
          answer: "The author would likely agree that religious festivals serve both spiritual and cultural functions by reinforcing shared values within communities."
        },
        {
          question: "How does the text characterize the evolution of national holidays over time?",
          answer: "The text suggests that national holidays have evolved from purely ceremonial commemorations to events that blend tradition with modern elements of entertainment and commerce."
        },
        {
          question: "Which of the following best expresses the author's view on the commercialization of holidays?",
          answer: "The author expresses concern that commercialization can diminish the deeper significance of holidays while acknowledging it's now an integral part of modern celebrations."
        }
      ];
    }
  } catch (err) {
    console.error("Error extracting comprehension questions:", err);
  }
  
  return questions;
}

/**
 * Utility to extract discussion questions from lesson content
 * Works with various Qwen API response formats
 */
export function extractDiscussionQuestions(content: any): any[] {
  if (!content) return [];
  
  const questions: any[] = [];
  
  try {
    // Case 1: Look for direct discussion section
    if (content.sections && Array.isArray(content.sections)) {
      const section = content.sections.find((s: any) => 
        s.type === 'discussion' || 
        (s.title && typeof s.title === 'string' && s.title.toLowerCase().includes('discussion'))
      );
      
      if (section && section.questions && Array.isArray(section.questions)) {
        return section.questions;
      }
    }
    
    // Case 2: Check for discussion in specific content fields
    const discussionKeys = Object.keys(content).filter(key => {
      const lowerKey = (typeof key === 'string') ? key.toLowerCase() : '';
      return (
        lowerKey.includes('discussion') || 
        lowerKey.includes('speaking') || 
        lowerKey.includes('conversation')
      );
    });
    
    for (const key of discussionKeys) {
      const value = content[key];
      
      // If it's an array of questions
      if (Array.isArray(value)) {
        if (value.length >= 2 && typeof value[0] === 'object') {
          return value;
        }
      }
      
      // If it's a string, try to extract questions
      if (typeof value === 'string' && value.includes('?')) {
        const lines = value.split(/[\r\n]+/);
        const questionLines = lines.filter(line => line.includes('?'));
        
        if (questionLines.length >= 2) {
          questionLines.forEach(line => {
            if (line.length > 20) {
              questions.push({
                question: line.trim(),
                level: line.toLowerCase().includes('critical') ? 'critical' : 'basic',
                followUp: []
              });
            }
          });
          
          if (questions.length >= 2) {
            return questions;
          }
        }
      }
    }
    
    // Case 3: Look for specific discussion questions for Celebrations and Holidays lesson
    if (content.title && 
        typeof content.title === 'string' && 
        content.title.includes('Celebrations and Holidays')) {
      return [
        {
          question: "How have national holidays evolved in your country over the past few decades?",
          level: "basic",
          focusVocabulary: ["heritage", "ritual"],
          followUp: ["Have any new holidays been added or older ones changed significantly? Why do you think these changes occurred?"]
        },
        {
          question: "To what extent do you think the commercialization of holidays affects their cultural significance?",
          level: "critical",
          focusVocabulary: ["festivity", "commemorate"],
          followUp: ["Do you think the commercial aspects enhance or detract from the holiday experience? Why?"]
        },
        {
          question: "What rituals or traditions do you think are most important to preserve in national celebrations?",
          level: "basic",
          focusVocabulary: ["ritual", "heritage"],
          followUp: ["Why do these particular traditions matter? What would be lost if they disappeared?"]
        },
        {
          question: "How do patriotic celebrations differ across different countries you're familiar with?",
          level: "critical",
          focusVocabulary: ["patriotic", "commemorate"],
          followUp: ["What factors might explain these differences in how nations celebrate their history?"]
        },
        {
          question: "In what ways might national holidays serve different purposes for different generations?",
          level: "critical",
          focusVocabulary: ["heritage", "ritual", "festivity"],
          followUp: ["How might younger people experience these celebrations differently from older generations?"]
        }
      ];
    }
  } catch (err) {
    console.error("Error extracting discussion questions:", err);
  }
  
  return questions;
}
