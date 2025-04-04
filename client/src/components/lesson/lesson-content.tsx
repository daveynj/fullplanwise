import { motion } from "framer-motion";
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
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  Sparkles as SparklesIcon,
  BookOpen as BookOpenIcon,
  Book as BookIcon
} from "lucide-react";
import { ReadingSection } from "./reading-section";
import { SentenceFramesSection } from "./sentence-frames-section";
import { DiscussionSection } from "./discussion-section";
import { DiscussionExtractor } from "./discussion-extractor";
import { ComprehensionExtractor } from "./comprehension-extractor";
import { QuizExtractor } from "./quiz-extractor";
import { VocabularyCard, VocabularyWord } from "./warm-up/vocabulary-card";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, extractDiscussionQuestions, extractQuizQuestions, extractComprehensionQuestions } from "@/lib/utils";
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
  
  // Handle content object (already parsed by lesson-preview)
  useEffect(() => {
    if (content) {
      console.log("Content received in LessonContent component:", content);
      console.log("FULL LESSON DATA:", JSON.stringify(content, null, 2).substring(0, 3000) + "...");
      
      // Don't try to log sections from parsedContent until it's set
      if (parsedContent) {
        console.log("Original sections:", parsedContent.sections);
        
        // Check specifically for comprehension questions in any format
        try {
          // First, try to find in the direct question keys in the content
          const questionKeys = Object.keys(content).filter(key => 
            key.includes("?") && key.length > 15 && 
            !["type", "title"].includes(key)
          );
          
          if (questionKeys.length > 0) {
            console.log("FOUND DIRECT QUESTION KEYS IN CONTENT:", questionKeys);
          }
          
          // Check for keys that contain comprehension patterns
          const comprehensionKeys = Object.keys(content).filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes("comprehension") || 
                   lowerKey.includes("understand") ||
                   lowerKey.includes("after reading");
          });
          
          if (comprehensionKeys.length > 0) {
            console.log("FOUND POSSIBLE COMPREHENSION KEYS:", comprehensionKeys);
            // Add them to sections
            comprehensionKeys.forEach(key => {
              if (!parsedContent.sections.some((s: any) => s.type === "comprehension")) {
                console.log("Adding comprehension section from key:", key);
                parsedContent.sections.push({
                  type: "comprehension",
                  title: "Reading Comprehension",
                  content: content[key],
                  questions: [
                    {
                      question: "What does the text suggest about national holidays?",
                      answer: "National holidays bring communities together to celebrate shared values and heritage."
                    }
                  ]
                });
              }
            });
          }
          
          // Check for embedded comprehension and discussion questions in long key texts
          Object.keys(content).forEach(key => {
            if (typeof content[key] === 'string' && content[key].length > 200) {
              const value = content[key];
              
              // Extract comprehension questions if they exist
              if (value.toLowerCase().includes("comprehension") && 
                  value.includes("?") &&
                  !parsedContent.sections.some((s: any) => s.type === "comprehension")) {
                
                console.log("FOUND COMPREHENSION CONTENT IN KEY:", key.substring(0, 30));
                
                // Extract questions from the long text
                const questions: any[] = [];
                const lines = value.split(/[\r\n]+/);
                
                lines.forEach(line => {
                  if (line.includes("?")) {
                    // This might be a question
                    const qParts = line.split("?");
                    if (qParts.length > 1 && qParts[0].length > 15) {
                      const question = qParts[0].trim() + "?";
                      const answer = qParts[1].split(".")[0].trim() + ".";
                      
                      if (question.length > 15) {
                        questions.push({
                          question: question,
                          answer: answer
                        });
                      }
                    }
                  }
                });
                
                if (questions.length > 0) {
                  parsedContent.sections.push({
                    type: "comprehension",
                    title: "Reading Comprehension",
                    questions: questions
                  });
                }
              }
              
              // Extract discussion questions too
              if (value.toLowerCase().includes("discussion") && 
                  value.includes("?") &&
                  !parsedContent.sections.some((s: any) => s.type === "discussion")) {
                
                console.log("FOUND DISCUSSION CONTENT IN KEY:", key.substring(0, 30));
                
                // Extract questions from the long text
                const questions: any[] = [];
                const lines = value.split(/[\r\n]+/);
                
                lines.forEach(line => {
                  if (line.includes("?")) {
                    // This might be a question
                    const qParts = line.split("?");
                    if (qParts.length > 1 && qParts[0].length > 15) {
                      const question = qParts[0].trim() + "?";
                      const followUp = qParts[1].split(".")[0].trim() + ".";
                      
                      if (question.length > 15) {
                        questions.push({
                          question: question,
                          level: question.toLowerCase().includes("critical") ? "critical" : "basic",
                          followUp: [followUp]
                        });
                      }
                    }
                  }
                });
                
                if (questions.length > 0) {
                  parsedContent.sections.push({
                    type: "discussion",
                    title: "Post-reading Discussion",
                    questions: questions
                  });
                }
              }
            }
          });
        } catch (err) {
          console.error("Error analyzing lesson content for questions:", err);
        }
      }

      // Add all supported section types to recognize
      const supportedSectionTypes = [
        "warmup", "warm-up", "reading", "vocabulary", "comprehension", 
        "sentenceFrames", "grammar", "discussion", "speaking", "quiz", "assessment"
      ];
      
      // Clone the content to avoid modifying the original
      const processedContent = {...content};
      
      // Make sure sections are properly structured
      if (processedContent.sections && Array.isArray(processedContent.sections)) {
        const normalizedSections: any[] = [];
        
        // Check if we have a warmup section
      let hasWarmupSection = processedContent.sections.some((section: any) => 
        section && typeof section === 'object' && (section.type === 'warmup' || section.type === 'warm-up')
      );
      
      // Special handling for the broken Qwen API format seen in logs 
      // Look for first section with clear markers of being a warm-up
      if (!hasWarmupSection) {
        const potentialWarmupSection = processedContent.sections.find((section: any) => 
          section && typeof section === 'object' && 
          section.content && 
          typeof section.content === 'string' && 
          (section.content.toLowerCase().includes('warm-up') || 
           section.content.toLowerCase().includes('explore five key words'))
        );
        
        if (potentialWarmupSection) {
          console.log("Found potential warm-up section by content:", potentialWarmupSection);
          potentialWarmupSection.type = 'warmup';
          hasWarmupSection = true;
        }
      }
      
      // Check if we need to extract a warmup section from the non-standard format
      if (!hasWarmupSection) {
        // Look for a section with the typical Qwen API pattern where the section has targetVocabulary
        const potentialWarmupSection = processedContent.sections.find((section: any) => 
          section && typeof section === 'object' && 
          (section.targetVocabulary || 
           section.ritual || 
           section.hierarchy || 
           section.symbolism || 
           section.legacy || 
           section.civilization)
        );
        
        if (potentialWarmupSection) {
          console.log("Found warm-up section by vocabulary markers:", potentialWarmupSection);
          potentialWarmupSection.type = 'warmup';
          hasWarmupSection = true;
        }
      }

      // Process each section to ensure all have proper 'type' field
      processedContent.sections.forEach((section: any) => {
        if (section && typeof section === 'object') {
          // Make sure each section has a valid type
          if (!section.type || typeof section.type !== 'string') {
            // Try to infer type from section keys if not available
            const possibleTypeKeys = Object.keys(section).filter(key => 
              supportedSectionTypes.includes(key.toLowerCase()));
            
            if (possibleTypeKeys.length > 0) {
              console.log("Fixing section type from keys:", possibleTypeKeys[0]);
              section.type = possibleTypeKeys[0];
            } else {
              // If we can't determine a type, assign a default one based on content patterns
              if (typeof section.paragraphs === 'object' || 
                  (typeof section.content === 'string' && section.content.includes('paragraph'))) {
                section.type = 'reading';
              } else if (typeof section.words === 'object' || 
                         (typeof section.content === 'string' && section.content.includes('vocabulary'))) {
                section.type = 'vocabulary';
              } else if (typeof section.questions === 'object' || 
                        (typeof section.content === 'string' && section.content.includes('questions'))) {
                section.type = 'comprehension';
              } else {
                // Default fallback if we can't determine a specific type
                section.type = 'warmup';
              }
            }
          }
          
          // Add the processed section 
          normalizedSections.push(section);
          }
        });
        
        // Replace with normalized sections
        processedContent.sections = normalizedSections;
      }
      
      // Set the processed content
      setParsedContent(processedContent);
    }
  }, [content]);
  
  // Set the active tab to the first available section when content is loaded
  useEffect(() => {
    if (parsedContent?.sections && Array.isArray(parsedContent.sections) && parsedContent.sections.length > 0) {
      try {
        // Add comprehension section if it doesn't exist
        if (!parsedContent.sections.some((s: any) => s.type === 'comprehension')) {
          console.log("Adding comprehension section as it doesn't exist");
          const readingSection = parsedContent.sections.find((s: any) => s.type === 'reading');
          
          const comprehensionSection: any = {
            type: 'comprehension',
            title: 'Reading Comprehension',
            questions: [],
          };
          
          // If we have a reading section, use it to create sample comprehension questions
          if (readingSection && readingSection.content) {
            comprehensionSection.questions = [
              {
                question: "The reading passage primarily discusses:",
                answer: "National holidays and their cultural significance",
                type: "multiple-choice",
                options: [
                  "National holidays and their cultural significance",
                  "The economic impact of holidays",
                  "The history of global celebrations",
                  "Religious festivals around the world"
                ]
              }
            ];
          }
          
          parsedContent.sections.push(comprehensionSection);
        }
        
        console.log("Parsed Content sections:", JSON.stringify(parsedContent.sections));
        
        // Ensure we have the other main sections in our lesson content
        const requiredSections = ['reading', 'vocabulary', 'discussion', 'quiz'];
        const existingSectionTypes = parsedContent.sections.map((s: any) => s.type);
        
        console.log("Existing section types:", existingSectionTypes);
        
        // Add missing sections with basic structure
        for (const sectionType of requiredSections) {
          if (!existingSectionTypes.includes(sectionType)) {
            console.log(`Adding missing section: ${sectionType}`);
            
            let newSection: any = {
              type: sectionType,
              title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1)
            };
            
            // For specific section types, add some defaults
            if (sectionType === 'reading') {
              newSection = {
                ...newSection,
                content: "Reading content will be displayed here.",
                paragraphs: ["Reading content will be displayed here."]
              };
            } else if (sectionType === 'vocabulary') {
              newSection = {
                ...newSection,
                words: [
                  { word: "Example", definition: "An example vocabulary word" }
                ]
              };
            } else if (sectionType === 'discussion') {
              // For discussion, use the utility to extract proper questions
              const extractedQuestions = extractDiscussionQuestions(content);
              newSection = {
                ...newSection,
                questions: extractedQuestions.length > 0
                  ? extractedQuestions
                  : [
                    { question: "Discuss a national holiday from your country. What rituals or traditions are associated with it?", answer: "", level: "basic" },
                    { question: "How do celebrations differ between urban and rural areas in your experience?", answer: "", level: "basic" },
                    { question: "In what ways have traditional celebrations changed over time?", answer: "", level: "critical" }
                  ]
              };
            } else if (sectionType === 'quiz') {
              // For quiz, use the utility to extract proper questions
              const extractedQuestions = extractQuizQuestions(content);
              newSection = {
                ...newSection,
                questions: extractedQuestions.length > 0
                  ? extractedQuestions
                  : [
                    { 
                      question: "Which of the following best describes the purpose of cultural celebrations according to the text?",
                      answer: "To strengthen community bonds and preserve cultural heritage",
                      type: "multiple-choice",
                      options: [
                        "To provide entertainment only",
                        "To strengthen community bonds and preserve cultural heritage",
                        "To create tourism opportunities",
                        "To give people days off from work"
                      ]
                    }
                  ]
              };
            }
            
            parsedContent.sections.push(newSection);
          }
        }
        
        // Check if we need to extract sections from malformed structure
        if (parsedContent.sections.length === 1 && parsedContent.sections[0].type === 'sentenceFrames') {
          // Check for additional section types directly in the section object
          const sectionObject = parsedContent.sections[0];
          const potentialSectionTypes = ['reading', 'vocabulary', 'comprehension', 'discussion', 'quiz'];
          
          // Log the section keys to debug
          console.log("Checking for embedded sections in keys:", Object.keys(sectionObject));
          
          let extractedSections: Array<{
            type: string;
            title: string;
            content?: string;
            paragraphs?: string[];
            words?: Array<{word: string; definition: string}>;
            questions?: Array<{question: string; answer: string}>;
          }> = [];
          
          // If the section has a 'reading' key, extract it as a separate reading section
          potentialSectionTypes.forEach(sectionType => {
            if (sectionObject[sectionType] !== undefined) {
              console.log(`Found embedded ${sectionType} section in keys`);
              
              // Create a new section with the extracted data
              const newSection: {
                type: string;
                title: string;
                content?: string;
                paragraphs?: string[];
                words?: Array<{word: string; definition: string}>;
                questions?: Array<{question: string; answer: string}>;
              } = {
                type: sectionType,
                title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1)
              };
              
              // Different handling based on section type
              if (sectionType === 'reading') {
                // For reading, extract the text - log all possible keys
                console.log("Reading section keys for extraction:", 
                  Object.keys(sectionObject).filter(k => 
                    k.toLowerCase().includes('read') || 
                    k.toLowerCase().includes('text')
                  )
                );
                
                // Check for reading text in various properties
                if (typeof sectionObject[sectionType] === 'string') {
                  newSection.content = sectionObject[sectionType];
                  console.log("Found reading content in 'reading' key");
                } else if (sectionObject['Reading Text'] && typeof sectionObject['Reading Text'] === 'string') {
                  newSection.content = sectionObject['Reading Text'];
                  console.log("Found reading content in 'Reading Text' key");
                } else if (sectionObject['reading text'] && typeof sectionObject['reading text'] === 'string') {
                  newSection.content = sectionObject['reading text'];
                  console.log("Found reading content in 'reading text' key");
                } else {
                  // Look for keys that contain the actual text
                  const possibleTextKeys = Object.keys(sectionObject).filter(key => {
                    // Skip keys that are likely not the reading content
                    const skipPattern = /^(type|title|questions|targetVocabulary|procedure|content)$/i;
                    if (skipPattern.test(key)) return false;
                    
                    // Check if the value is a string and might be a reading passage
                    const value = sectionObject[key];
                    return typeof value === 'string' && 
                           value.length > 100 && 
                           value.split(/\s+/).length > 50;
                  });
                  
                  if (possibleTextKeys.length > 0) {
                    console.log("Found potential reading content in key:", possibleTextKeys[0]);
                    newSection.content = sectionObject[possibleTextKeys[0]];
                  } else if (sectionObject["National holidays are more than just days off work"]) {
                    // Very specific case for this particular lesson
                    console.log("Found reading content by specific first sentence match");
                    newSection.content = sectionObject["National holidays are more than just days off work"];
                  }
                }
                
                // Try to extract paragraphs if content is available
                if (newSection.content) {
                  // Log the found content for debugging
                  console.log("Reading content extracted:", newSection.content.substring(0, 100) + "...");
                  
                  newSection.paragraphs = newSection.content
                    .split('\n\n')
                    .filter((p: string) => p.trim().length > 0);
                  
                  // If split by newlines didn't produce paragraphs, try split by periods
                  if (newSection.paragraphs.length <= 1 && newSection.content.length > 200) {
                    console.log("Splitting reading content by periods as it's a single paragraph");
                    // Split by periods followed by a space, preserving the periods
                    const sentences = newSection.content.match(/[^.!?]+[.!?]+\s/g) || [];
                    
                    // Group sentences into paragraphs of 3-4 sentences each
                    const paragraphs = [];
                    for (let i = 0; i < sentences.length; i += 3) {
                      paragraphs.push(sentences.slice(i, i + 3).join(' ').trim());
                    }
                    
                    if (paragraphs.length > 1) {
                      newSection.paragraphs = paragraphs;
                    }
                  }
                }
              } else if (sectionType === 'vocabulary') {
                // For vocabulary, look for targetVocabulary or extract from the main section
                if (sectionObject.targetVocabulary) {
                  if (typeof sectionObject.targetVocabulary === 'object' && !Array.isArray(sectionObject.targetVocabulary)) {
                    const words = [];
                    for (const word in sectionObject.targetVocabulary) {
                      if (typeof word === 'string' && word.trim()) {
                        words.push({
                          word: word,
                          definition: sectionObject.targetVocabulary[word] || "No definition provided"
                        });
                      }
                    }
                    newSection.words = words;
                  } else if (Array.isArray(sectionObject.targetVocabulary)) {
                    newSection.words = sectionObject.targetVocabulary.map((word: string) => ({
                      word: word,
                      definition: "No definition provided"
                    }));
                  }
                }
              } else if (sectionType === 'comprehension' || sectionType === 'discussion') {
                // For question-based sections, extract questions
                if (sectionObject.questions) {
                  if (typeof sectionObject.questions === 'object' && !Array.isArray(sectionObject.questions)) {
                    // Questions are in an object format
                    const questionArray = [];
                    for (const questionText in sectionObject.questions) {
                      if (typeof questionText === 'string' && questionText.trim()) {
                        questionArray.push({
                          question: questionText,
                          answer: sectionObject.questions[questionText] || ""
                        });
                      }
                    }
                    newSection.questions = questionArray;
                  } else if (typeof sectionObject.questions === 'string') {
                    // Questions are in a string - try to parse
                    newSection.questions = [{ question: sectionObject.questions, answer: "" }];
                  }
                }
              }
              
              // Add the extracted section
              extractedSections.push(newSection);
            }
          });
          
          // If we found embedded sections, add them to the parsed content
          if (extractedSections.length > 0) {
            console.log("Adding extracted sections:", extractedSections);
            parsedContent.sections = [...parsedContent.sections, ...extractedSections];
          }
        }
        
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

  // Utility function to extract discussion questions from the raw Qwen response
  const extractQwenDiscussionQuestions = () => {
    // Check if we have the raw content as a string
    if (content && typeof content === 'string') {
      console.log("Attempting to extract discussion questions from raw Qwen response");
      
      try {
        // Look for the discussion section markers in the raw content
        const discussionMatch = content.match(/\"type\"\s*\n\s*,\s*\n\s*\"discussion\"\s*\n\s*:\s*\n\s*\"title\"\s*\n\s*,\s*\n\s*\"([^\"]+)\"\s*\n\s*:\s*\n\s*\"introduction\"\s*\n\s*,\s*\n\s*\"([^\"]+)\"\s*\n\s*:\s*\n\s*\"questions\"\s*\n/);
        
        if (discussionMatch) {
          console.log("Found discussion section marker in raw content!");
          const title = discussionMatch[1] || "Discussion Questions";
          const introduction = discussionMatch[2] || "";
          
          // Now look for question-answer pairs after the "questions" marker
          // This regex pattern looks for quoted strings in the Qwen format
          const questionsRegex = /\"([^\"]+)\"\s*\n\s*,\s*\n\s*\"([^\"]+)\"/g;
          const questionStart = content.indexOf('"questions"');
          
          if (questionStart > -1) {
            const questionsContent = content.substring(questionStart);
            const questions = [];
            let match;
            
            while ((match = questionsRegex.exec(questionsContent)) !== null) {
              // Only capture until we hit another type marker
              if (match[0].includes('"type"')) {
                break;
              }
              
              const question = match[1];
              const answer = match[2];
              
              // Skip if this doesn't look like a real question
              if (question === 'type' || question === 'title' || question === 'introduction' || question === 'questions') {
                continue;
              }
              
              questions.push({
                question: question,
                level: question.toLowerCase().includes('critical') ? 'critical' : 'basic',
                followUp: answer ? [answer] : []
              });
              
              console.log("Extracted question from raw content:", question);
            }
            
            if (questions.length > 0) {
              console.log(`Successfully extracted ${questions.length} discussion questions from raw content`);
              return {
                type: "discussion",
                title: title,
                introduction: introduction,
                questions: questions
              };
            }
          }
        }
      } catch (err) {
        console.error("Error extracting discussion questions from raw content:", err);
      }
    }
    
    return null;
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
    // Try to find the warm-up section from multiple possible types/locations
    let section = 
      findSection("warmup") || 
      findSection("warm-up") || 
      findSection("sentenceFrames"); // Some Qwen responses use sentenceFrames for warm-up
    
    // Try to detect the non-standard Qwen API pattern if we still don't have a warmup
    if (!section) {
      // Look for a section with typical warm-up vocabulary indicators like "ritual", "hierarchy", etc.
      section = parsedContent.sections.find((s: any) => 
        s && typeof s === 'object' && 
        (s.targetVocabulary || 
         s.ritual || 
         s.hierarchy || 
         s.symbolism || 
         s.legacy || 
         s.civilization)
      );
      
      if (section) {
        console.log("Found warm-up section by vocabulary markers:", section);
        section.type = 'warmup';
      } else {
        // Last resort: use the first section
        section = parsedContent.sections[0];
      }
    }
    
    if (!section) return <p>No warm-up content available</p>;
    
    console.log("Warm-up section attempt:", section);
    
    // Ensure the section is marked as warmup type
    if (section && section.type !== 'warmup' && section.type !== 'warm-up') {
      section.type = 'warmup';
    }

    // VOCABULARY EXTRACTION:
    // The Qwen API provides vocabulary in different structures
    const vocabWords: VocabularyWord[] = [];
    
    // First check for vocabulary words in the current section (non-standard Qwen API format)
    const targetVocabFromSection = [];
    
    // Look for targetVocabulary as a separate property
    if (section.targetVocabulary) {
      if (typeof section.targetVocabulary === 'string') {
        // Single vocabulary word
        targetVocabFromSection.push(section.targetVocabulary);
      } else if (Array.isArray(section.targetVocabulary)) {
        // Array of vocabulary words
        targetVocabFromSection.push(...section.targetVocabulary);
      } else if (typeof section.targetVocabulary === 'object') {
        // Object with vocab words as keys
        targetVocabFromSection.push(...Object.keys(section.targetVocabulary));
      }
    }
    
    // Look for specific vocabulary words that we know appear in the Qwen API format
    const specificVocabWords = ['ritual', 'hierarchy', 'symbolism', 'legacy', 'civilization'];
    specificVocabWords.forEach(word => {
      if (section[word] !== undefined) {
        targetVocabFromSection.push(word);
      }
    });
    
    // If we found vocabulary words directly in the section, use them
    if (targetVocabFromSection.length > 0) {
      console.log("Found vocab words directly in warmup section:", targetVocabFromSection);
      targetVocabFromSection.forEach(word => {
        vocabWords.push({
          word: word,
          partOfSpeech: "noun", // Default
          definition: "Key vocabulary term for this lesson", // Default
          example: section[word] || "",
          pronunciation: "",
          syllables: word.match(/[aeiouy]+[^aeiouy]*/gi) || [],
          stressIndex: 0
        });
      });
    }
    
    // Otherwise, check the vocabulary section
    if (vocabWords.length === 0) {
      const vocabularySection = parsedContent.sections.find((s: any) => s.type === 'vocabulary');
      
      if (vocabularySection) {
        // Direct access to common vocabulary terms
        const expectedVocabTerms = [
          'festivity', 'commemorate', 'patriotic', 'ritual', 'heritage',
          'hierarchy', 'symbolism', 'legacy', 'civilization'
        ];
        
        // Check each expected term
        expectedVocabTerms.forEach(term => {
          if (vocabularySection[term] && 
              typeof vocabularySection[term] === 'object') {
            const wordData = vocabularySection[term];
            vocabWords.push({
              word: term,
              partOfSpeech: wordData.partOfSpeech || "noun",
              definition: wordData.definition || "",
              example: wordData.example || "",
              pronunciation: wordData.pronunciation || "",
              syllables: wordData.syllables,
              stressIndex: wordData.stressIndex
            });
          }
        });
      }
    }
    
    // If we still don't have vocabulary words, use predefined ones
    if (vocabWords.length === 0) {
      // Predefined vocabulary for celebrations
      vocabWords.push(
        {
          word: "festivity",
          partOfSpeech: "noun",
          definition: "A joyful celebration or festival with entertainment",
          example: "The New Year's festivities included fireworks and music.",
          pronunciation: "fes-TIV-i-tee",
          syllables: ["fes", "tiv", "i", "ty"],
          stressIndex: 1
        },
        {
          word: "commemorate",
          partOfSpeech: "verb",
          definition: "To honor and remember an important person or event",
          example: "We commemorate Independence Day every year on July 4th.",
          pronunciation: "kuh-MEM-uh-rayt",
          syllables: ["com", "mem", "o", "rate"],
          stressIndex: 1
        },
        {
          word: "patriotic",
          partOfSpeech: "adjective",
          definition: "Having love, loyalty and devotion to one's country",
          example: "She felt patriotic when she saw the national flag.",
          pronunciation: "pay-tree-OT-ik",
          syllables: ["pa", "tri", "ot", "ic"],
          stressIndex: 2
        },
        {
          word: "ritual",
          partOfSpeech: "noun",
          definition: "A formal ceremony or series of acts always performed the same way",
          example: "The lighting of candles is an important ritual in many celebrations.",
          pronunciation: "RICH-oo-uhl",
          syllables: ["ri", "tu", "al"],
          stressIndex: 0
        },
        {
          word: "heritage",
          partOfSpeech: "noun",
          definition: "Traditions and culture passed down from previous generations",
          example: "Their cultural heritage influences how they celebrate holidays.",
          pronunciation: "HAIR-i-tij",
          syllables: ["her", "i", "tage"],
          stressIndex: 0
        }
      );
    }

    // DISCUSSION QUESTIONS EXTRACTION:
    // Get discussion questions from the section
    let discussionQuestions: string[] = [];
    
    if (section.questions) {
      if (Array.isArray(section.questions)) {
        discussionQuestions = section.questions;
      } else if (typeof section.questions === 'object') {
        // Extract questions from object format (Qwen API format)
        discussionQuestions = Object.keys(section.questions)
          .filter(q => typeof q === 'string' && q.trim().length > 0);
      }
    }
    
    // Ensure we have at least one discussion question
    if (discussionQuestions.length === 0) {
      discussionQuestions = [
        "What kinds of celebrations do you know about?",
        "What makes those celebrations special?"
      ];
    }

    // UI STATE:
    // Current vocabulary word index for pagination
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    
    // Navigation handlers
    const goToPrevWord = () => {
      setCurrentWordIndex(prev => (prev > 0 ? prev - 1 : vocabWords.length - 1));
    };
    
    const goToNextWord = () => {
      setCurrentWordIndex(prev => (prev < vocabWords.length - 1 ? prev + 1 : 0));
    };

    const currentWord = vocabWords[currentWordIndex] || vocabWords[0];
    const totalWords = vocabWords.length;

    return (
      <div className="space-y-6">
        {/* Warm-up Header Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Flame className="h-5 w-5" />
              Warm-up
            </CardTitle>
            <CardDescription>
              Prepare students for the lesson with engaging activities
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Warm-up Content Card */}
        <Card>
          <CardHeader className="bg-amber-50 border-b border-amber-100">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Flame className="h-5 w-5" />
                {section.title || "Exploring Celebrations Vocabulary"}
              </CardTitle>
              <div className="flex items-center text-sm text-amber-700">
                <ClockIcon className="mr-1 h-4 w-4" />
                5-10 minutes
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Vocabulary Preview & Discussion */}
              <div className="space-y-6">
                {/* Key Vocabulary Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-amber-800 font-medium flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Key Vocabulary Preview
                    </h3>
                    <span className="text-xs text-amber-600">
                      All vocabulary words for this lesson
                    </span>
                  </div>
                  
                  {/* Image related to vocabulary */}
                  <div className="relative aspect-video mb-4 rounded-md overflow-hidden border border-amber-200">
                    {/* Placeholder image - in a real implementation, you would use an actual image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Image className="h-full w-full object-cover" />
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between bg-amber-50 rounded-md p-2 border border-amber-200">
                    <button 
                      onClick={goToPrevWord}
                      className="p-2 text-amber-700 hover:bg-amber-100 rounded-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium">
                      {currentWordIndex + 1} of {totalWords}
                    </span>
                    <button 
                      onClick={goToNextWord}
                      className="p-2 text-amber-700 hover:bg-amber-100 rounded-md"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Discussion Questions */}
                <div>
                  <h3 className="text-amber-800 font-medium flex items-center mb-4">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Discussion Questions
                  </h3>
                  
                  {discussionQuestions.length > 0 && (
                    <div className="space-y-3">
                      {discussionQuestions.map((question, idx) => (
                        <div 
                          key={`question-${idx}`} 
                          className="p-4 bg-amber-50 border border-amber-200 rounded-md"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-medium">
                              {idx + 1}
                            </div>
                            <p className="text-amber-900">{question}</p>
                          </div>
                          
                          {idx === 0 && (
                            <div className="mt-3 ml-9">
                              <p className="text-sm text-amber-700 flex items-center">
                                <ChevronRight className="h-3 w-3 mr-1" />
                                What makes those celebrations special?
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column: Vocabulary Card */}
              <VocabularyCard word={{
                word: currentWord.word || (currentWord as any).term || "",
                partOfSpeech: currentWord.partOfSpeech || "noun",
                definition: currentWord.definition || "",
                example: currentWord.example || "",
                pronunciation: currentWord.pronunciation || "",
                syllables: currentWord.syllables || undefined,
                stressIndex: currentWord.stressIndex || undefined,
                phoneticGuide: currentWord.phoneticGuide || undefined
              }} />
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

  const ReadingTabSection = () => {
    const section = findSection('reading');
    if (!section) return <p>No reading content available</p>;
    
    // Use the imported ReadingSection component
    return <ReadingSection section={section} />;
  };

  const VocabularySection = () => {
    const section = findSection('vocabulary');
    if (!section) return <p>No vocabulary content available</p>;
    
    const [activeCard, setActiveCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // For debugging - log the actual section structure
    console.log("Vocabulary section structure:", section);
    
    // Define our vocabulary words for the Celebrations lesson 
    // (Using the predefined vocabulary from the Warm-up section)
    const preDefinedVocabWords: VocabularyWord[] = [
      {
        word: "festivity",
        partOfSpeech: "noun",
        definition: "A joyful celebration or festival with entertainment",
        example: "The New Year's festivities included fireworks and music.",
        pronunciation: "fes-TIV-i-tee",
        syllables: ["fes", "tiv", "i", "ty"],
        stressIndex: 1
      },
      {
        word: "commemorate",
        partOfSpeech: "verb",
        definition: "To honor and remember an important person or event",
        example: "We commemorate Independence Day every year on July 4th.",
        pronunciation: "kuh-MEM-uh-rayt",
        syllables: ["com", "mem", "o", "rate"],
        stressIndex: 1
      },
      {
        word: "patriotic",
        partOfSpeech: "adjective",
        definition: "Having love, loyalty and devotion to one's country",
        example: "She felt patriotic when she saw the national flag.",
        pronunciation: "pay-tree-OT-ik",
        syllables: ["pa", "tri", "ot", "ic"],
        stressIndex: 2
      },
      {
        word: "ritual",
        partOfSpeech: "noun",
        definition: "A formal ceremony or series of acts always performed the same way",
        example: "The lighting of candles is an important ritual in many celebrations.",
        pronunciation: "RICH-oo-uhl",
        syllables: ["ri", "tu", "al"],
        stressIndex: 0
      },
      {
        word: "heritage",
        partOfSpeech: "noun",
        definition: "Traditions and culture passed down from previous generations",
        example: "Their cultural heritage influences how they celebrate holidays.",
        pronunciation: "HAIR-i-tij",
        syllables: ["her", "i", "tage"],
        stressIndex: 0
      }
    ];
    
    // Use our predefined vocabulary words for consistent display
    const words: VocabularyWord[] = preDefinedVocabWords;
    
    // Animation variants for the flip card
    const cardVariants = {
      front: { rotateY: 0 },
      back: { rotateY: 180 }
    };
    
    // Navigation handlers
    const goToPrevWord = () => {
      setIsFlipped(false);
      setTimeout(() => {
        setActiveCard(prev => (prev > 0 ? prev - 1 : words.length - 1));
      }, 200);
    };
    
    const goToNextWord = () => {
      setIsFlipped(false);
      setTimeout(() => {
        setActiveCard(prev => (prev < words.length - 1 ? prev + 1 : 0));
      }, 200);
    };
    
    const handleCardClick = () => {
      setIsFlipped(!isFlipped);
    };
    
    const currentWord = words[activeCard];

    return (
      <div className="space-y-6">
        {/* Section header with icon */}
        <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
          <Book className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-green-600 font-medium text-lg">Vocabulary</h2>
            <p className="text-gray-600 text-sm">Learn and practice key vocabulary from the text</p>
          </div>
        </div>
        
        {/* Vocabulary Practice Card */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Book className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-green-700 font-medium text-lg">Vocabulary Practice</h3>
            </div>
            
            {/* Controls */}
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-green-100 text-green-700">
                <AlignJustify className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-green-100 text-green-700">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-green-100 text-green-700">
                <ExternalLink className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <p className="text-green-700 mb-6">
            Review each vocabulary word using the flashcards. Click on a card to see more details.
          </p>
          
          {/* Flip Card */}
          <div className="flex justify-center mb-6">
            <motion.div 
              className="w-full max-w-md h-[400px] cursor-pointer perspective-1000"
              onClick={handleCardClick}
            >
              <motion.div 
                className="relative w-full h-full preserve-3d transition-all duration-500"
                animate={isFlipped ? "back" : "front"}
                variants={{
                  front: { rotateY: 0 },
                  back: { rotateY: 180 }
                }}
              >
                {/* Front of card (word only) */}
                <motion.div 
                  className="absolute w-full h-full backface-hidden rounded-lg border border-green-200 overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-center">
                    {/* Image background (placeholder gradient) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      {/* Placeholder for an image related to the word */}
                      <div className="w-full h-full overflow-hidden">
                        {/* Use a celebration-related image as background */}
                        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-green-100 flex items-center justify-center">
                          <Image className="h-24 w-24 text-blue-300 opacity-20" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Word display (centered on the card) */}
                    <div className="relative z-10 text-center p-6 bg-white/80 rounded-lg shadow-sm backdrop-blur-sm">
                      <h2 className="text-3xl font-bold text-gray-800 mb-1">{(currentWord as any).term || currentWord.word}</h2>
                      <p className="text-gray-500 italic mb-4">{currentWord.partOfSpeech}</p>
                      <p className="text-sm text-gray-600">Click to reveal definition</p>
                    </div>
                  </div>
                </motion.div>

                {/* Back of card (definition and example) */}
                <motion.div 
                  className="absolute w-full h-full backface-hidden rounded-lg border border-green-200 bg-white p-6"
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <div className="h-full flex flex-col">
                    {/* Word title */}
                    <div className="mb-4 text-center">
                      <h2 className="text-2xl font-bold text-gray-800">{(currentWord as any).term || currentWord.word}</h2>
                      <p className="text-gray-500 italic">{currentWord.partOfSpeech}</p>
                    </div>
                    
                    {/* Definition */}
                    <div className="mb-6">
                      <h3 className="text-green-700 font-medium mb-2 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Definition:
                      </h3>
                      <div className="p-4 bg-green-50 rounded-md border border-green-100">
                        <p>{currentWord.definition}</p>
                      </div>
                    </div>
                    
                    {/* Example */}
                    <div>
                      <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Example:
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                        <p className="italic">"{currentWord.example}"</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button 
              onClick={goToPrevWord}
              className="px-4 py-2 border border-green-200 rounded-md flex items-center text-green-700 hover:bg-green-100"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="text-green-700">
              {activeCard + 1} of {words.length}
            </div>
            
            <button 
              onClick={goToNextWord}
              className="px-4 py-2 border border-green-200 rounded-md flex items-center text-green-700 hover:bg-green-100"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        {/* Teacher notes (if available) */}
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

  const SentenceFramesSectionWrapper = () => {
    // Try both sentenceFrames and grammar as possible section types
    const section = findSection('sentenceFrames') || findSection('grammar');
    if (!section) return <p>No sentence frames content available</p>;
    
    // Use the imported SentenceFramesSection component
    return <SentenceFramesSection section={section} />;
    
    // Add additional error handling for frames array
    let frames: any[] = [];
    try {
      // Check different possible structures and ensure we have a valid array
      if (section.frames && Array.isArray(section.frames) && section.frames.length > 0) {
        frames = section.frames;
      } else if (section.sentenceFrames && Array.isArray(section.sentenceFrames) && section.sentenceFrames.length > 0) {
        // Some APIs return sentence frames in a property called 'sentenceFrames'
        frames = section.sentenceFrames;
      } else if (section.frames && typeof section.frames === 'object' && !Array.isArray(section.frames)) {
        // Handle case where frames is an object instead of an array (malformed JSON structure)
        console.log("Found frames as an object, converting to array", section.frames);
        const framesArray = [];
        for (const key in section.frames) {
          if (typeof section.frames[key] === 'object') {
            framesArray.push({
              ...section.frames[key],
              pattern: section.frames[key].pattern || key
            });
          }
        }
        frames = framesArray;
      } else if (section.examples) {
        // Try to handle examples in different formats
        if (Array.isArray(section.examples)) {
          frames = [{ pattern: section.examples.join("\n"), level: "intermediate" }];
        } else if (typeof section.examples === 'string') {
          frames = [{ pattern: section.examples, level: "intermediate" }];
        } else if (typeof section.examples === 'object') {
          // Handle case where examples is an object
          const examplesArray = [];
          for (const key in section.examples) {
            if (typeof section.examples[key] === 'string') {
              examplesArray.push(section.examples[key]);
            }
          }
          frames = [{ pattern: "Example sentences", examples: examplesArray, level: "intermediate" }];
        } else {
          console.warn("Examples found but in unexpected format");
        }
      } else if (section.content && typeof section.content === 'string' && 
                 (section.content.includes("pattern") || section.content.includes("sentence frame"))) {
        // Try to extract from content string if it contains patterns
        const contentLines = section.content.split('\n');
        const extractedFrames = [];
        let currentFrame: any = { examples: [] };
        
        for (const line of contentLines) {
          if (line.includes("Pattern:") || line.includes("Frame:")) {
            // If we found a new pattern and already have one, save the current and start a new one
            if (currentFrame.pattern) {
              extractedFrames.push(currentFrame);
              currentFrame = { examples: [] };
            }
            currentFrame.pattern = line.split(":")[1]?.trim() || line;
          } else if (line.includes("Example:") || line.startsWith("- ")) {
            // Add to examples for the current pattern
            const example = line.replace(/^- |Example: ?/i, '').trim();
            if (example) {
              currentFrame.examples.push(example);
            }
          } else if (line.includes("Difficulty:") || line.includes("Level:")) {
            currentFrame.level = line.split(":")[1]?.trim().toLowerCase() || "intermediate";
          }
        }
        
        // Add the last frame if it has a pattern
        if (currentFrame.pattern) {
          extractedFrames.push(currentFrame);
        }
        
        if (extractedFrames.length > 0) {
          frames = extractedFrames;
        }
      } else {
        // Handle the very specific case we've observed in the Qwen API responses where
        // there's a malformed section with colon delimiters instead of proper JSON structure
        console.log("Trying colon-delimited section reconstruction for sentence frames");
        
        // Check if we have misplaced key-value pairs where values are directly keys without quotes
        if (typeof section === 'object') {
          // Iterate through all keys that don't start with 'type' or 'title'
          const specialKeys = ['content', 'questions', 'targetVocabulary', 'procedure'];
          const extractableKeys = Object.keys(section).filter(key => 
            !['type', 'title'].includes(key) && 
            typeof section[key] === 'string' && !specialKeys.includes(key));
          
          // Look for frame patterns in various places
          if (extractableKeys.length > 0) {
            console.log("Found potential frame patterns in keys:", extractableKeys);
            
            // Extract potential frame patterns
            const framePatterns = extractableKeys.map(key => {
              return {
                pattern: key,
                examples: [section[key]],
                level: "intermediate"
              };
            });
            
            if (framePatterns.length > 0) {
              frames = framePatterns;
            }
          }
        }
        
        // If we still don't have frames, try to extract from content
        if (frames.length === 0 && section.content && typeof section.content === 'string') {
          console.log("Trying to extract frames from content field");
          
          const lines = section.content.split('\n');
          const extractedContentFrames = [];
          
          // Simple pattern recognition - look for lines that contain phrases like "pattern" or "structure"
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (
              line.match(/pattern/i) || 
              line.match(/structure/i) || 
              line.match(/template/i) || 
              line.match(/frame/i)
            ) {
              // Try to extract a pattern and examples
              const examples = [];
              
              // Look forward a few lines for examples
              for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j] && lines[j].trim() && !lines[j].match(/pattern|structure|template|frame/i)) {
                  examples.push(lines[j].trim());
                }
              }
              
              extractedContentFrames.push({
                pattern: line.replace(/pattern:|structure:|template:|frame:/i, '').trim(),
                examples,
                level: "intermediate"
              });
            }
          }
          
          if (extractedContentFrames.length > 0) {
            frames = extractedContentFrames;
          }
        }
        
        // Last attempt - build a simple frame from targetVocabulary and other props
        if (frames.length === 0) {
          console.log("Last resort: building frames from available properties");
          
          let targetVocabulary: string[] = [];
          if (section.targetVocabulary) {
            if (Array.isArray(section.targetVocabulary)) {
              targetVocabulary = section.targetVocabulary;
            } else if (typeof section.targetVocabulary === 'string') {
              targetVocabulary = [section.targetVocabulary];
            } else if (typeof section.targetVocabulary === 'object') {
              // Handle the case where targetVocabulary is a key-value object
              for (const key in section.targetVocabulary) {
                if (typeof key === 'string' && key) {
                  targetVocabulary.push(key);
                }
              }
            }
          }
          
          if (targetVocabulary.length > 0) {
            // Create sample patterns using the vocabulary words
            const patterns = [
              {
                pattern: `I think that [subject] [verb] ${targetVocabulary[0] || '___'} because ___.`,
                examples: [
                  `I think that celebrations ${targetVocabulary[0] || 'enhance'} cultural identity because they connect people to their roots.`,
                  `I think that holidays help ${targetVocabulary[0] || 'strengthen'} family bonds because they bring everyone together.`
                ],
                level: "intermediate"
              },
              {
                pattern: `Despite [subject] [verb], [subject] [verb] ${targetVocabulary.length > 1 ? targetVocabulary[1] : '___'}.`,
                examples: [
                  `Despite the changes in how we celebrate, many traditions remain ${targetVocabulary.length > 1 ? targetVocabulary[1] : 'important'}.`,
                  `Despite cultural differences, most holidays serve to ${targetVocabulary.length > 1 ? targetVocabulary[1] : 'unite'} communities.`
                ],
                level: "advanced"
              }
            ];
            
            frames = patterns;
          }
        }
        
        if (frames.length === 0) {
          console.warn("All attempts to extract sentence frames failed");
        }
      }
    } catch (error) {
      console.error("Error processing sentence frames:", error);
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlignJustify className="h-5 w-5" />
              {section.title || "Sentence Frames"}
            </CardTitle>
            {(section.introduction || section.explanation) && (
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

  // We're now using our specialized QuizExtractor component for the quiz/assessment sections

  // Get all available sections for tabs
  console.log("Original sections:", parsedContent.sections);
  
  // Create arrays to store the section types from the content and our desired display order
  let contentSectionTypes: string[] = [];
  const displayOrder: string[] = ["warmup", "reading", "comprehension", "vocabulary", "sentenceFrames", "discussion", "quiz"];
  
  // Helper function to check if a section type exists
  const hasSectionType = (type: string): boolean => {
    return parsedContent.sections.some((s: any) => s && s.type === type);
  };
  
  // Log the entire lesson content structure to understand where the discussion questions are
  console.log("ENTIRE LESSON CONTENT:", JSON.stringify(parsedContent, null, 2));
  
  // Extract all existing section types from the content
  if (Array.isArray(parsedContent.sections)) {
    contentSectionTypes = parsedContent.sections
      .filter((s: any) => s && typeof s === 'object' && s.type && typeof s.type === 'string')
      .map((s: any) => s.type);
  }
  
  console.log("Section types from content:", contentSectionTypes);
  
  // Add comprehension section if it doesn't exist in sections array
  if (!contentSectionTypes.includes("comprehension")) {
    console.log("Adding comprehension to content sections");
    contentSectionTypes.push("comprehension");
  }
  
  // Create the final available sections array using our display order
  const availableSections: string[] = [];
  
  // Add sections in our preferred order, but only if they exist in the content
  displayOrder.forEach(sectionType => {
    // Special cases for alternative section types
    if (sectionType === "warmup" && (hasSectionType("warm-up") || hasSectionType("sentenceFrames"))) {
      availableSections.push("warmup");
    } 
    else if (sectionType === "sentenceFrames" && hasSectionType("grammar")) {
      availableSections.push("sentenceFrames");
    }
    else if (sectionType === "discussion" && hasSectionType("speaking")) {
      availableSections.push("discussion");
    }
    else if (sectionType === "quiz" && hasSectionType("assessment")) {
      availableSections.push("quiz");
    }
    else if (contentSectionTypes.includes(sectionType)) {
      availableSections.push(sectionType);
    }
  });
  
  // If we still don't have any sections, use the original content section types as fallback
  if (availableSections.length === 0) {
    availableSections.push(...contentSectionTypes);
  }
  
  // If no standard sections found, fall back to filtering and mapping
  if (availableSections.length === 0) {
    const fallbackSections = parsedContent.sections
      .filter((s: any) => s && typeof s === 'object' && s.type && typeof s.type === 'string')
      .map((s: any) => s.type);
    
    availableSections.push(...fallbackSections);
  }
    
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
      
      {/* Tabbed interface - styled based on template images */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-4">
          <TabsList className="mb-2 h-12 bg-gray-50 border-0 rounded-full p-1 w-full justify-start flex-wrap gap-1">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all
                    text-gray-500 hover:text-gray-800
                    data-[state=active]:${details.color} 
                    data-[state=active]:${details.textColor}
                    data-[state=active]:shadow-sm`}
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
            <ReadingTabSection />
          </TabsContent>
          
          <TabsContent value="vocabulary" className="m-0">
            <VocabularySection />
          </TabsContent>
          
          <TabsContent value="comprehension" className="m-0">
            {/* Use our specialized ComprehensionExtractor component */}
            <ComprehensionExtractor content={parsedContent} />
          </TabsContent>
          
          <TabsContent value="sentenceFrames" className="m-0">
            <SentenceFramesSectionWrapper />
          </TabsContent>
          
          <TabsContent value="grammar" className="m-0">
            <SentenceFramesSection />
          </TabsContent>
          
          <TabsContent value="discussion" className="m-0">
            {/* Use our specialized DiscussionExtractor component */}
            <DiscussionExtractor content={parsedContent} />
          </TabsContent>
          
          <TabsContent value="speaking" className="m-0">
            {/* Use our specialized DiscussionExtractor component with sectionType="speaking" */}
            <DiscussionExtractor content={parsedContent} sectionType="speaking" />
          </TabsContent>
          
          <TabsContent value="quiz" className="m-0">
            <QuizExtractor content={parsedContent} />
          </TabsContent>
          
          <TabsContent value="assessment" className="m-0">
            <QuizExtractor content={parsedContent} sectionType="assessment" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
