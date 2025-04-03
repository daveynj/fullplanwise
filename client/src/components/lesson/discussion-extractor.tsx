import { DiscussionSection } from "./discussion-section";
import { extractDiscussionQuestions } from "@/lib/utils";

interface DiscussionQuestion {
  question: string;
  level?: "basic" | "critical";
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
  
  // Use our utility function to extract discussion questions
  const extractedQuestions: DiscussionQuestion[] = extractDiscussionQuestions(content);
  console.log("EXTRACTED DISCUSSION QUESTIONS:", extractedQuestions);
  
  if (extractedQuestions.length > 0) {
    // Create a discussion section with the extracted questions
    const section = {
      type: sectionType,
      title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
      introduction: "Discuss the following questions to deepen understanding, using the vocabulary from this lesson when appropriate.",
      questions: extractedQuestions
    };
    
    return <DiscussionSection section={section} />;
  }
  
  // If our utility doesn't find questions, provide a fallback
  return <DiscussionSection section={{
    type: sectionType,
    title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Questions`,
    introduction: `No ${sectionType} questions were found for this lesson.`,
    questions: []
  }} />;
};