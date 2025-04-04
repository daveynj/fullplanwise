import { DiscussionSection } from "./discussion-section";
import { extractDiscussionQuestions } from "@/lib/utils";

interface DiscussionQuestion {
  question: string;
  level?: "basic" | "critical";
  introduction?: string; // Introduction sentence before the question
  focusVocabulary?: string[];
  followUp?: string[];
  paragraphContext?: string; // Context paragraph for the discussion question
  answer?: string;
}

interface DiscussionExtractorProps {
  content: any;
}

export const DiscussionExtractor = ({ content, sectionType = "discussion" }: DiscussionExtractorProps & { sectionType?: string }) => {
  console.log("DISCUSSION EXTRACTOR RECEIVED CONTENT TYPE:", typeof content);
  console.log("DISCUSSION EXTRACTOR CONTENT:", JSON.stringify(content, null, 2).substring(0, 500));
  
  // Find the section's introduction if available
  let sectionIntroduction = "";
  
  // Extract introduction from content if available
  if (content.sections && Array.isArray(content.sections)) {
    const discussionSection = content.sections.find(
      (s: any) => s && typeof s === 'object' && s.type === 'discussion'
    );
    
    if (discussionSection) {
      console.log("Found discussion section in content:", discussionSection);
      
      // Extract introduction if available
      if (discussionSection.introduction && typeof discussionSection.introduction === 'string') {
        sectionIntroduction = discussionSection.introduction;
        console.log("Found section introduction:", sectionIntroduction.substring(0, 100));
      }
      
      // Try to get paragraph context if available - this is a key addition for our new format
      const paragraphContext = discussionSection.paragraphContext || 
                              discussionSection.context || 
                              discussionSection.paragraph;
                              
      if (paragraphContext && typeof paragraphContext === 'string') {
        console.log("Found paragraph context in discussion section:", paragraphContext.substring(0, 100));
        // Store it as the introduction if no other intro exists
        if (!sectionIntroduction) {
          sectionIntroduction = paragraphContext;
        }
      }
    }
  } else if (content.discussion && typeof content.discussion === 'object') {
    console.log("Found discussion object directly in content");
    
    // Extract introduction if available
    if (content.discussion.introduction && typeof content.discussion.introduction === 'string') {
      sectionIntroduction = content.discussion.introduction;
      console.log("Found direct discussion introduction:", sectionIntroduction.substring(0, 100));
    }
    
    // Try to get paragraph context if available
    const paragraphContext = content.discussion.paragraphContext || 
                            content.discussion.context || 
                            content.discussion.paragraph;
                            
    if (paragraphContext && typeof paragraphContext === 'string') {
      console.log("Found paragraph context in direct discussion:", paragraphContext.substring(0, 100));
      // Store it as the introduction if no other intro exists
      if (!sectionIntroduction) {
        sectionIntroduction = paragraphContext;
      }
    }
  }
  
  // Use our utility function to extract discussion questions
  const extractedQuestions: DiscussionQuestion[] = extractDiscussionQuestions(content);
  console.log("EXTRACTED DISCUSSION QUESTIONS:", extractedQuestions);
  
  if (extractedQuestions.length > 0) {
    // Create a discussion section with the extracted questions
    const section = {
      type: sectionType,
      title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
      introduction: sectionIntroduction || "Discuss the following questions to deepen understanding, using the vocabulary from this lesson when appropriate.",
      questions: extractedQuestions
    };
    
    return <DiscussionSection section={section} />;
  }
  
  // If our utility doesn't find questions, return a section with empty questions
  return <DiscussionSection section={{
    type: sectionType,
    title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
    introduction: `No ${sectionType} questions were found for this lesson.`,
    questions: []
  }} />;
};