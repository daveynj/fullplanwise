import { DiscussionSection } from "./discussion-section";

interface DiscussionExtractorProps {
  content: any;
}

export const DiscussionExtractor = ({ content, sectionType = "discussion" }: DiscussionExtractorProps & { sectionType?: string }) => {
  console.log("DISCUSSION EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  let questionsFound = false;
  
  // Approach 1: Try to directly extract discussion questions from the flat structure
  if (typeof content === "object" && content !== null) {
    try {
      // Look for keys that might be questions (containing a question mark)
      const questionKeys = Object.keys(content).filter(key => 
        typeof key === 'string' && 
        key.includes('?') && 
        key !== 'type' && 
        key !== 'title' && 
        key !== 'introduction'
      );
      
      if (questionKeys.length > 0) {
        console.log("FOUND DIRECT QUESTION KEYS:", questionKeys);
        
        // Create questions array from these keys
        const questions = questionKeys.map(q => ({
          question: q,
          level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
          followUp: typeof content[q] === 'string' ? [content[q]] : []
        }));
        
        // Create a discussion section
        const section = {
          type: sectionType,
          title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
          introduction: "Discuss the following questions:",
          questions
        };
        
        console.log("EXTRACTED DIRECT QUESTIONS:", questions.length);
        questionsFound = true;
        return <DiscussionSection section={section} />;
      }
    } catch (err) {
      console.error("Error trying to extract direct questions:", err);
    }
  }
  
  // Approach 2: Try to find a section matching our section type in the sections array
  if (typeof content === "object" && content !== null && Array.isArray(content.sections)) {
    try {
      const targetSection = content.sections.find((section: any) => 
        section && typeof section === 'object' && section.type === sectionType
      );
      
      if (targetSection) {
        console.log(`FOUND ${sectionType.toUpperCase()} SECTION:`, targetSection);
        
        // If it already has questions array, use it directly
        if (Array.isArray(targetSection.questions) && targetSection.questions.length > 0) {
          console.log("SECTION ALREADY HAS QUESTIONS ARRAY:", targetSection.questions.length);
          questionsFound = true;
          return <DiscussionSection section={targetSection} />;
        }
        
        // If questions is an object, convert it to array
        if (targetSection.questions && typeof targetSection.questions === 'object') {
          const questionKeys = Object.keys(targetSection.questions).filter(q => 
            typeof q === 'string' && 
            q.trim() && 
            q !== 'question' &&
            q !== 'type' && 
            q !== 'title'
          );
          
          if (questionKeys.length > 0) {
            const convertedQuestions = questionKeys.map(q => ({
              question: q,
              level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
              followUp: [targetSection.questions[q] || '']
            }));
            
            const processedSection = {
              ...targetSection,
              questions: convertedQuestions
            };
            
            console.log("CONVERTED OBJECT QUESTIONS TO ARRAY:", convertedQuestions.length);
            questionsFound = true;
            return <DiscussionSection section={processedSection} />;
          }
        }
        
        // Look for direct question properties in the section
        const sectionQuestionKeys = Object.keys(targetSection).filter(key => 
          typeof key === 'string' && 
          key.includes('?') && 
          key !== 'type' && 
          key !== 'title' && 
          key !== 'introduction' &&
          key !== 'questions'
        );
        
        if (sectionQuestionKeys.length > 0) {
          console.log("FOUND DIRECT QUESTION KEYS IN SECTION:", sectionQuestionKeys);
          
          const questions = sectionQuestionKeys.map(q => ({
            question: q,
            level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
            followUp: typeof targetSection[q] === 'string' ? [targetSection[q]] : []
          }));
          
          const section = {
            ...targetSection,
            questions
          };
          
          questionsFound = true;
          return <DiscussionSection section={section} />;
        }
      }
    } catch (err) {
      console.error("Error trying to extract section questions:", err);
    }
  }
  
  // Approach 3: Look for the appropriate section type at root level
  if (typeof content === "object" && content !== null) {
    try {
      // Check for discussion or speaking at the root level based on sectionType
      const rootSection = content[sectionType];
      
      if (rootSection && typeof rootSection === 'object') {
        console.log(`FOUND ROOT LEVEL ${sectionType.toUpperCase()}:`, rootSection);
        
        // Case 1: rootSection.questions is array
        if (Array.isArray(rootSection.questions) && rootSection.questions.length > 0) {
          const section = {
            type: sectionType,
            title: rootSection.title || `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
            introduction: rootSection.introduction || "",
            questions: rootSection.questions
          };
          
          questionsFound = true;
          return <DiscussionSection section={section} />;
        }
        
        // Case 2: rootSection.questions is object
        if (rootSection.questions && typeof rootSection.questions === 'object') {
          const questionKeys = Object.keys(rootSection.questions).filter(q => 
            typeof q === 'string' && q.trim() && q !== 'question'
          );
          
          if (questionKeys.length > 0) {
            const questions = questionKeys.map(q => ({
              question: q,
              level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
              followUp: [rootSection.questions[q] || '']
            }));
            
            const section = {
              type: sectionType,
              title: rootSection.title || `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
              introduction: rootSection.introduction || "",
              questions
            };
            
            questionsFound = true;
            return <DiscussionSection section={section} />;
          }
        }
        
        // Case 3: Direct question keys in rootSection object
        const directQuestionKeys = Object.keys(rootSection).filter(key => 
          typeof key === 'string' && 
          key.includes('?') && 
          key !== 'type' && 
          key !== 'title' && 
          key !== 'introduction' &&
          key !== 'questions'
        );
        
        if (directQuestionKeys.length > 0) {
          const questions = directQuestionKeys.map(q => ({
            question: q,
            level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
            followUp: typeof rootSection[q] === 'string' ? [rootSection[q]] : []
          }));
          
          const section = {
            type: sectionType,
            title: rootSection.title || `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
            introduction: rootSection.introduction || "",
            questions
          };
          
          questionsFound = true;
          return <DiscussionSection section={section} />;
        }
      }
    } catch (err) {
      console.error(`Error trying to extract root ${sectionType} questions:`, err);
    }
  }
  
  // Approach 4: Check all sections for question-like properties
  if (typeof content === "object" && content !== null && Array.isArray(content.sections)) {
    try {
      // Go through all sections and look for question-like properties
      for (const section of content.sections) {
        if (section && typeof section === 'object') {
          const questionKeys = Object.keys(section).filter(key => 
            typeof key === 'string' && 
            key.includes('?') && 
            key !== 'type' && 
            key !== 'title'
          );
          
          if (questionKeys.length > 0) {
            console.log("FOUND QUESTION KEYS IN ARBITRARY SECTION:", questionKeys);
            
            const questions = questionKeys.map(q => ({
              question: q,
              level: q.toLowerCase().includes('critical') ? 'critical' : 'basic',
              followUp: typeof section[q] === 'string' ? [section[q]] : []
            }));
            
            const fabricatedSection = {
              type: sectionType,
              title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
              introduction: "Discuss the following questions:",
              questions
            };
            
            questionsFound = true;
            return <DiscussionSection section={fabricatedSection} />;
          }
        }
      }
    } catch (err) {
      console.error("Error checking all sections for questions:", err);
    }
  }
  
  // Approach 5: If all else failed, provide an extremely basic fallback
  if (!questionsFound) {
    console.log("NO DISCUSSION QUESTIONS FOUND, USING FALLBACK");
    
    // Check if we have a string content, we could try to extract manually
    if (typeof content === 'string') {
      try {
        // Extract any lines that look like questions from the raw text
        const lines = content.split('\n');
        const questionLines = lines.filter(line => 
          line.includes('?') && line.length > 20
        );
        
        if (questionLines.length > 0) {
          console.log("EXTRACTED QUESTIONS FROM RAW STRING:", questionLines.length);
          
          const questions = questionLines.map(q => ({
            question: q.trim(),
            level: 'basic',
            followUp: []
          }));
          
          const section = {
            type: sectionType,
            title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
            introduction: "Discuss the following questions:",
            questions
          };
          
          return <DiscussionSection section={section} />;
        }
      } catch (err) {
        console.error("Error extracting from raw string:", err);
      }
    }
    
    // Absolute last resort
    return <DiscussionSection section={{
      type: sectionType,
      title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
      introduction: `No ${sectionType} questions were found for this lesson.`,
      questions: []
    }} />;
  }
  
  // This should never be reached due to the fallback above
  return null;
};