import { DiscussionSection } from "./discussion-section";
import { extractDiscussionQuestions } from "@/lib/utils";

interface DiscussionQuestion {
  question: string;
  level?: "basic" | "critical";
  introduction?: string; // Introduction sentence before the question
  focusVocabulary?: string[];
  followUp?: string[];
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
    
    if (discussionSection && discussionSection.introduction && typeof discussionSection.introduction === 'string') {
      sectionIntroduction = discussionSection.introduction;
    }
  } else if (content.discussion && content.discussion.introduction && typeof content.discussion.introduction === 'string') {
    sectionIntroduction = content.discussion.introduction;
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