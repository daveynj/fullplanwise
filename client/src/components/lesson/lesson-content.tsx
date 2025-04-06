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
import { Button } from "@/components/ui/button"; // Added import for Button

interface LessonContentProps {
  content: any;
}

type SectionType = 
  | "notes" 
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
      
      // Check if this is a Gemini-formatted response (usually has different structure)
      const isGeminiResponse = content.provider === 'gemini';
      if (isGeminiResponse) {
        console.log("Detected Gemini-formatted response - applying special processing");
      }
      
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
        "notes", "warmup", "warm-up", "reading", "vocabulary", "comprehension", 
        "sentenceFrames", "grammar", "discussion", "speaking", "quiz", "assessment"
      ];
      
      // Clone the content to avoid modifying the original
      const processedContent = {...content};
      
      // Special handling for Gemini responses
      if (processedContent.provider === 'gemini') {
        console.log("Applying Gemini-specific processing");
        
        // For Gemini, if sections aren't already in the correct format, try to extract them
        // Check if we need to extract sections from the top-level object
        if (!processedContent.sections || !Array.isArray(processedContent.sections) || processedContent.sections.length === 0) {
          console.log("No proper sections array found in Gemini response, attempting to create one");
          
          // Create sections array if it doesn't exist
          if (!processedContent.sections) {
            processedContent.sections = [];
          }
          
          // Look for reading sections
          if (processedContent.reading || processedContent.readingText || processedContent.readingPassage) {
            const readingContent = processedContent.reading || processedContent.readingText || processedContent.readingPassage;
            processedContent.sections.push({
              type: 'reading',
              title: 'Reading',
              content: readingContent,
              paragraphs: Array.isArray(readingContent) ? readingContent : 
                readingContent.split(/\n\n+/).filter((p: string) => p.trim().length > 0)
            });
            
            console.log("Added reading section from top-level keys");
          }
          
          // Look for vocabulary sections
          if (processedContent.vocabulary || processedContent.targetVocabulary) {
            const vocabContent = processedContent.vocabulary || processedContent.targetVocabulary;
            let vocabularyWords = [];
            
            // Handle various formats for vocabulary
            if (Array.isArray(vocabContent)) {
              vocabularyWords = vocabContent.map((word: any) => {
                if (typeof word === 'string') {
                  return { word, definition: 'No definition provided' };
                } else if (typeof word === 'object') {
                  return word;
                }
                return null;
              }).filter(Boolean);
            } else if (typeof vocabContent === 'object') {
              // Handle object format (term: definition)
              for (const [term, definition] of Object.entries(vocabContent)) {
                vocabularyWords.push({ 
                  word: term, 
                  definition: typeof definition === 'string' ? definition : 'No definition provided'
                });
              }
            }
            
            if (vocabularyWords.length > 0) {
              processedContent.sections.push({
                type: 'vocabulary',
                title: 'Vocabulary',
                words: vocabularyWords
              });
              
              console.log("Added vocabulary section from top-level keys");
            }
          }
          
          // Look for comprehension sections
          if (processedContent.comprehension || processedContent.comprehensionQuestions) {
            const compContent = processedContent.comprehension || processedContent.comprehensionQuestions;
            let questions = [];
            
            // Handle various formats for comprehension questions
            if (Array.isArray(compContent)) {
              questions = compContent;
            } else if (typeof compContent === 'object') {
              // Handle object format (question: answer)
              for (const [question, answer] of Object.entries(compContent)) {
                if (question.includes('?')) {
                  questions.push({ 
                    question, 
                    answer: typeof answer === 'string' ? answer : 'No answer provided'
                  });
                }
              }
            }
            
            if (questions.length > 0) {
              processedContent.sections.push({
                type: 'comprehension',
                title: 'Reading Comprehension',
                questions: questions
              });
              
              console.log("Added comprehension section from top-level keys");
            }
          }
          
          // Look for discussion sections
          if (processedContent.discussion || processedContent.discussionQuestions) {
            const discContent = processedContent.discussion || processedContent.discussionQuestions;
            let questions = [];
            
            // Handle various formats for discussion questions
            if (Array.isArray(discContent)) {
              questions = discContent.map((q: any) => {
                if (typeof q === 'string') {
                  return { question: q };
                } else if (typeof q === 'object' && q.question) {
                  return q;
                }
                return null;
              }).filter(Boolean);
            } else if (typeof discContent === 'object') {
              // Handle object format 
              for (const [question, followUp] of Object.entries(discContent)) {
                if (question.includes('?') || question.length > 10) {
                  questions.push({ 
                    question, 
                    followUp: typeof followUp === 'string' ? [followUp] : []
                  });
                }
              }
            }
            
            if (questions.length > 0) {
              processedContent.sections.push({
                type: 'discussion',
                title: 'Discussion Questions',
                questions: questions
              });
              
              console.log("Added discussion section from top-level keys");
            }
          }
          
          // Look for quiz sections
          if (processedContent.quiz || processedContent.quizQuestions || processedContent.assessment) {
            const quizContent = processedContent.quiz || processedContent.quizQuestions || processedContent.assessment;
            let questions = [];
            
            // Handle various formats for quiz questions
            if (Array.isArray(quizContent)) {
              questions = quizContent;
            } else if (typeof quizContent === 'object') {
              // Handle object format (question: answer)
              for (const [question, answer] of Object.entries(quizContent)) {
                if (question.includes('?') || question.length > 10) {
                  questions.push({ 
                    question, 
                    answer: typeof answer === 'string' ? answer : 'No answer provided'
                  });
                }
              }
            }
            
            if (questions.length > 0) {
              processedContent.sections.push({
                type: 'quiz',
                title: 'Quiz',
                questions: questions
              });
              
              console.log("Added quiz section from top-level keys");
            }
          }
        }
      }
      
      // Make sure sections are properly structured
      if (processedContent.sections && Array.isArray(processedContent.sections)) {
        const normalizedSections: any[] = [];
        
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
        // Check if we need to add the comprehension section
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
            // Don't create sample questions, just keep the empty array
            // We'll only show what came from the AI response
          }
          
          parsedContent.sections.push(comprehensionSection);
        }
        
        console.log("Parsed Content sections:", JSON.stringify(parsedContent.sections));
        
        // Ensure we have the other main sections in our lesson content
        const requiredSections = ['reading', 'vocabulary', 'discussion', 'quiz'];
        const existingSectionTypes = parsedContent.sections.map((s: any) => s.type);
        
        console.log("Existing section types:", existingSectionTypes);
        
        // We no longer add missing sections with default content
        // Instead, we'll just display what we have from the AI response
        
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
          
          // Extract embedded section data, but don't add default content
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
                  }
                }
                
                // Only add the section if we found actual content
                if (newSection.content) {
                  // Try to extract paragraphs if content is available
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
                  
                  // Only add if we have real content
                  extractedSections.push(newSection);
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
                    // Only add if we found actual vocabulary words
                    if (words.length > 0) {
                      newSection.words = words;
                      extractedSections.push(newSection);
                    }
                  } else if (Array.isArray(sectionObject.targetVocabulary) && sectionObject.targetVocabulary.length > 0) {
                    newSection.words = sectionObject.targetVocabulary.map((word: string) => ({
                      word: word,
                      definition: "No definition provided"
                    }));
                    extractedSections.push(newSection);
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
                    // Only add if we found actual questions
                    if (questionArray.length > 0) {
                      newSection.questions = questionArray;
                      extractedSections.push(newSection);
                    }
                  } else if (typeof sectionObject.questions === 'string' && sectionObject.questions.trim()) {
                    // Questions are in a string - try to parse
                    newSection.questions = [{ question: sectionObject.questions, answer: "" }];
                    extractedSections.push(newSection);
                  }
                }
              }
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
    "notes": {
      icon: GraduationCap,
      label: "Teacher Notes",
      color: "bg-blue-100",
      textColor: "text-blue-700",
      description: "Teaching guidance and tips"
    },
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
    const section = 
      findSection("warmup") || 
      findSection("warm-up") || 
      findSection("sentenceFrames") || // Some Qwen responses use sentenceFrames for warm-up
      parsedContent.sections[0]; // Last resort, use the first section
    
    if (!section) return <p>No warm-up content available</p>;
    
    console.log("Warm-up section attempt:", section);

    // VOCABULARY EXTRACTION:
    // The Qwen API provides vocabulary in different structures
    const vocabWords: VocabularyWord[] = [];
    
    // We'll extract vocabulary words using direct key matching based on the sample images
    const vocabularySection = parsedContent.sections.find((s: any) => s.type === 'vocabulary');
    
    if (vocabularySection) {
      // Get vocabulary words from the content
      // Do not use hardcoded fallback values - extract from the actual content
      
      // Look for the 'words' array in the vocabulary section (Gemini format)
      if (vocabularySection.words && Array.isArray(vocabularySection.words)) {
        vocabularySection.words.forEach((wordData: any) => {
          if (typeof wordData === 'object') {
            // Handle complex pronunciation object structure
            let pronunciationData;
            if (wordData.pronunciation && typeof wordData.pronunciation === 'object') {
              // Keep the object structure intact
              pronunciationData = wordData.pronunciation;
            } else {
              // Use the string value or extract from pronunciation field
              pronunciationData = wordData.pronunciation || "";
            }
            
            vocabWords.push({
              word: wordData.term || wordData.word || "",
              partOfSpeech: wordData.partOfSpeech || "noun",
              definition: wordData.definition || "",
              example: wordData.example || "",
              pronunciation: pronunciationData,
              syllables: wordData.syllables,
              stressIndex: wordData.stressIndex,
              phoneticGuide: wordData.phoneticGuide,
              imageBase64: wordData.imageBase64 || null,
              
              // New enhanced vocabulary fields
              semanticGroup: wordData.semanticGroup || wordData.category || wordData.group,
              additionalExamples: Array.isArray(wordData.additionalExamples) ? wordData.additionalExamples : 
                                  Array.isArray(wordData.examples) ? wordData.examples.slice(1) : undefined,
              wordFamily: wordData.wordFamily || (wordData.relatedWords ? {
                words: Array.isArray(wordData.relatedWords) ? wordData.relatedWords : [],
                description: typeof wordData.wordFamilyDescription === 'string' ? wordData.wordFamilyDescription : undefined
              } : undefined),
              collocations: Array.isArray(wordData.collocations) ? wordData.collocations : undefined,
              usageNotes: wordData.usageNotes || wordData.usage || undefined
            });
          }
        });
        console.log("Extracted vocabulary words from Gemini format:", vocabWords);
      }
      
      // Check for targetVocabulary in warmup section (also common in Gemini format)
      if (section.targetVocabulary && Array.isArray(section.targetVocabulary) && vocabWords.length === 0) {
        section.targetVocabulary.forEach((term: string) => {
          if (typeof term === 'string') {
            vocabWords.push({
              word: term,
              partOfSpeech: "noun",
              definition: "Definition will be provided by teacher",
              example: ""
            });
          }
        });
        console.log("Extracted vocabulary from targetVocabulary:", vocabWords);
      }
    }
    
    // No hard-coded fallback vocabulary - only use AI-generated content
    // If we don't have any vocabulary, we'll display a message to generate new content

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
    
    // No hard-coded fallback questions - only use AI-generated content
    // We'll display a message if no questions are available

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
      <div className="space-y-4">
        {/* Warm-up Header Card */}
        <Card className="border-2 border-amber-300 bg-amber-50 shadow-md">
          <CardHeader className="py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-amber-700 text-xl font-bold">
                <Flame className="h-5 w-5" />
                Warm-up
              </CardTitle>
              <div className="flex items-center text-sm font-medium text-amber-700">
                <ClockIcon className="mr-1 h-4 w-4" />
                5-10 minutes
              </div>
            </div>
            <CardDescription className="text-sm text-amber-700 font-medium">
              {section.title || "Exploring vocabulary and activating prior knowledge"}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Compact Warm-up Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Column 1: Image + Discussion */}
          <div className="space-y-4">
            {/* Image with Pagination Controls */}
            <div className="bg-white rounded-md border-2 border-amber-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-amber-800 font-bold text-base flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Vocabulary Preview
                </h3>
                <div className="text-amber-800 font-bold text-base">
                  {currentWord.word || "Vocabulary"}
                </div>
              </div>
              
              {/* Image container */}
              <div className="relative h-48 mb-3 rounded-md overflow-hidden border-2 border-amber-200">
                {currentWord.imageBase64 ? (
                  <img 
                    src={`data:image/png;base64,${currentWord.imageBase64}`}
                    alt={`Illustration for ${currentWord.word}`}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <Image className="h-12 w-12 text-amber-300" />
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between bg-amber-50 rounded-md p-2 border-2 border-amber-200 text-sm">
                <button 
                  onClick={goToPrevWord}
                  className="p-2 text-amber-700 hover:bg-amber-100 rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-bold">{currentWordIndex + 1} of {totalWords}</span>
                <button 
                  onClick={goToNextWord}
                  className="p-2 text-amber-700 hover:bg-amber-100 rounded-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Discussion Questions - Limited to just 3 shown by default */}
            <div className="bg-white rounded-md border-2 border-amber-200 p-3 shadow-sm">
              <h3 className="text-amber-800 font-bold text-base flex items-center mb-3">
                <MessageCircle className="mr-2 h-4 w-4" />
                Discussion Questions
              </h3>
              
              <div className="space-y-3">
                {discussionQuestions.slice(0, 3).map((question, idx) => (
                  <div 
                    key={`question-${idx}`} 
                    className="p-3 bg-amber-50 border-2 border-amber-200 rounded-md"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-amber-900 text-base font-medium">{question}</p>
                    </div>
                  </div>
                ))}
                {discussionQuestions.length > 3 && (
                  <div className="text-center text-sm font-bold text-amber-600">
                    +{discussionQuestions.length - 3} more questions
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Column 2: Vocabulary Cards Carousel */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-md border-2 border-amber-200 h-full shadow-sm">
              <div className="p-3">
                <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2 mb-3">
                  <h3 className="text-amber-800 font-bold text-base flex items-center">
                    <BookIcon className="mr-2 h-4 w-4" />
                    Target Vocabulary
                  </h3>
                  
                  {vocabWords.length > 0 && (
                    <div className="flex">
                      {vocabWords.map((_, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentWordIndex(idx)}
                          className={`w-3 h-3 rounded-full mx-1 ${
                            idx === currentWordIndex ? 'bg-amber-500' : 'bg-amber-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Vocabulary Card */}
                <VocabularyCard word={{
                  ...currentWord,
                  // Removed imageBase64 here so image only displays in left column
                  imageBase64: null
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReadingTabSection = () => {
    const section = findSection('reading');
    // Use the imported ReadingSection component
    return <ReadingSection section={section} />;
  };

  const VocabularySection = () => {
    const section = findSection('vocabulary');
    
    const [activeCard, setActiveCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // For debugging - log the actual section structure
    console.log("Vocabulary section structure:", section);
    
    // Extract vocabulary words from the section
    const extractedVocabWords: VocabularyWord[] = [];
    
    // Look for the 'words' array in the vocabulary section (Gemini format)
    if (section.words && Array.isArray(section.words)) {
      section.words.forEach((wordData: any) => {
        if (typeof wordData === 'object') {
          // Handle complex pronunciation object structure
          let pronunciationData;
          if (wordData.pronunciation && typeof wordData.pronunciation === 'object') {
            // Keep the object structure intact
            pronunciationData = wordData.pronunciation;
          } else {
            // Use the string value or extract from pronunciation field
            pronunciationData = wordData.pronunciation || "";
          }
          
          extractedVocabWords.push({
            word: wordData.term || wordData.word || "",
            partOfSpeech: wordData.partOfSpeech || "noun",
            definition: wordData.definition || "",
            example: wordData.example || "",
            pronunciation: pronunciationData,
            syllables: wordData.syllables,
            stressIndex: wordData.stressIndex,
            phoneticGuide: wordData.phoneticGuide,
            imageBase64: wordData.imageBase64 || null,
            
            // New enhanced vocabulary fields
            semanticGroup: wordData.semanticGroup || wordData.category || wordData.group,
            additionalExamples: Array.isArray(wordData.additionalExamples) ? wordData.additionalExamples : 
                               Array.isArray(wordData.examples) ? wordData.examples.slice(1) : undefined,
            wordFamily: wordData.wordFamily || (wordData.relatedWords ? {
              words: Array.isArray(wordData.relatedWords) ? wordData.relatedWords : [],
              description: typeof wordData.wordFamilyDescription === 'string' ? wordData.wordFamilyDescription : undefined
            } : undefined),
            collocations: Array.isArray(wordData.collocations) ? wordData.collocations : undefined,
            usageNotes: wordData.usageNotes || wordData.usage || undefined
          });
        }
      });
      console.log("Extracted vocabulary words from Gemini format:", extractedVocabWords);
    }
    
    // Use the extracted vocabulary words
    const words: VocabularyWord[] = extractedVocabWords;
    
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
            
{/* No controls needed */}
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
                    {/* Image background */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {currentWord.imageBase64 ? (
                        /* Show actual image when available */
                        <img 
                          src={`data:image/png;base64,${currentWord.imageBase64}`}
                          alt={`Illustration for ${currentWord.word}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        /* Placeholder gradient when no image is available */
                        <div className="w-full h-full overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-green-100 flex items-center justify-center">
                            <Image className="h-24 w-24 text-blue-300 opacity-20" />
                          </div>
                        </div>
                      )}
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
                        <p className="font-medium text-gray-800">{currentWord.definition}</p>
                      </div>
                    </div>
                    
                    {/* Example */}
                    <div>
                      <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Example:
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                        <p className="italic font-medium text-gray-800">"{currentWord.example}"</p>
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
        
        {/* Teacher notes have been moved to the notes tab */}
      </div>
    );
  };

  const ComprehensionSection = () => {
    const section = findSection('comprehension');
    
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
                        <p className="text-gray-800 font-medium">{questions[activeQuestion].question || "No question text available"}</p>
                        
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
                              <span className="font-medium text-gray-800">{option}</span>
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
        
        {/* Teacher notes have been moved to the notes tab */}
      </div>
    );
  };

  const SentenceFramesSectionWrapper = () => {
    // Try both sentenceFrames and grammar as possible section types
    const section = findSection('sentenceFrames') || findSection('grammar');
    
    // Use the imported SentenceFramesSection component
    return <SentenceFramesSection section={section} />;
  };
  
  // We're now using our specialized QuizExtractor component for the quiz/assessment sections

  // Teacher Notes Section to collect all teacher notes
  const TeacherNotesSection = () => {
    // Collect all teacher notes from all sections
    const allNotes: {[key: string]: string} = {};
    
    if (Array.isArray(parsedContent.sections)) {
      parsedContent.sections.forEach((section: any) => {
        if (section && typeof section === 'object' && section.teacherNotes) {
          // Use section type or title as the key
          const sectionName = section.title || 
                             (section.type && sectionDetails[section.type as SectionType] ? 
                              sectionDetails[section.type as SectionType].label : 
                              section.type) || 
                             "Untitled Section";
          
          allNotes[sectionName] = section.teacherNotes;
        }
      });
    }
    
    const noteKeys = Object.keys(allNotes);
    
    return (
      <div className="space-y-6">
        {/* Notes Header Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <GraduationCap className="h-5 w-5" />
              Teacher Notes
            </CardTitle>
            <CardDescription>
              Teaching guidance, suggestions, and additional resources
            </CardDescription>
          </CardHeader>
        </Card>
        
        {noteKeys.length > 0 ? (
          <Card>
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-blue-700">Teaching Guidance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {noteKeys.map((sectionName) => (
                  <div key={sectionName} className="p-4 border border-blue-100 rounded-lg">
                    <h3 className="text-blue-800 font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {sectionName}
                    </h3>
                    <div className="pl-6 border-l-2 border-blue-100 text-gray-700">
                      <p>{allNotes[sectionName]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-blue-300" />
                <h3 className="mt-4 text-lg font-medium">No teacher notes available</h3>
                <p className="mt-2 text-sm text-gray-500">This lesson doesn't include specific teaching notes or guidance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Get all available sections for tabs
  console.log("Original sections:", parsedContent.sections);
  
  // Create arrays to store the section types from the content and our desired display order
  let contentSectionTypes: string[] = [];
  const displayOrder: string[] = ["warmup", "reading", "comprehension", "vocabulary", "sentenceFrames", "discussion", "quiz"];
  // Note: "notes" tab is handled separately via the TeacherNotesSection component
  
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
    if (sectionType === "warmup" && hasSectionType("warm-up")) {
      availableSections.push("warmup");
    } 
    else if (sectionType === "sentenceFrames" && (hasSectionType("sentenceFrames") || hasSectionType("grammar"))) {
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
  
  // Always add the notes tab regardless of whether we have teacher notes or not
  if (!availableSections.includes("notes")) {
    availableSections.push("notes");
  }
  
  // If no standard sections found, fall back to filtering and mapping
  if (availableSections.length === 0) {
    const fallbackSections = parsedContent.sections
      .filter((s: any) => s && typeof s === 'object' && s.type && typeof s.type === 'string')
      .map((s: any) => s.type);
    
    availableSections.push(...fallbackSections);
  }
    
  console.log("Available sections for tabs:", availableSections);
  
  // Navigation logic
  const currentIndex = availableSections.indexOf(activeTab);
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveTab(availableSections[currentIndex - 1]);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < availableSections.length - 1) {
      setActiveTab(availableSections[currentIndex + 1]);
    }
  };
  
  return (
    <div className="lesson-content max-w-7xl mx-auto"> {/* Increased max-width */}
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
        <div className="p-1 text-xl leading-relaxed"> {/* Changed text-lg to text-xl */}
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
          
          <TabsContent value="notes" className="m-0">
            <TeacherNotesSection />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          aria-label="Previous Section"
          className="flex items-center"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Section {currentIndex + 1} of {availableSections.length}
        </span>
        <Button 
          variant="outline" 
          onClick={handleNext} 
          disabled={currentIndex === availableSections.length - 1}
          aria-label="Next Section"
          className="flex items-center"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
