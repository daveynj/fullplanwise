import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Flame, 
  BookOpen, 
  MessageCircle, 
  HelpCircle, 
  FileText, 
  Check, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Pencil, 
  PenTool,
  Clock,
  Shuffle, 
  Volume, 
  Mic, 
  Volume2, 
  Image, 
  Lightbulb, 
  MessageSquare,
  AlignJustify,
  AlignLeft,
  Compass,
  Library,
  CheckCircle,
  Target,
} from "lucide-react";
import { AudioPlayer } from "@/components/shared/audio-player";
import { handleMessageWithAPI } from '@/lib/api-helpers';
import { DiscussionSection } from './discussion-section';
import { SentenceFramesSection } from './sentence-frames-section';
import { ReadingSection } from './reading-section';
import { SectionHeader } from './shared/section-header';
import { InteractiveClozeSection } from './interactive-cloze-section';
import { SentenceUnscrambleSection } from './sentence-unscramble-section';
import { VocabularyCard, VocabularyWord } from "./warm-up/vocabulary-card";
// Pronunciation section functionality moved to warm-up
// import { PronunciationSection } from "./pronunciation-section";
// Import the extractors
import { ComprehensionExtractor } from './comprehension-extractor';
import { QuizExtractor } from './quiz-extractor';
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, extractDiscussionQuestions, extractQuizQuestions, extractComprehensionQuestions } from "@/lib/utils";
// Using wouter instead of next/navigation
import { useLocation } from "wouter";

interface LessonContentProps {
  content: any;
}

type SectionType = 
  | "notes" 
  | "overview"
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
  | "assessment"
  | "cloze"
  | "sentenceUnscramble"
  | "pronunciation"; // Added pronunciation type

// Define a type for Lucide icons since we don't have the actual type
type LucideIcon = React.ElementType;

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
  const [location, setLocation] = useLocation();
  
  // Handle content object (already parsed by lesson-preview)
  useEffect(() => {
    if (content) {
      console.log("Content received in LessonContent component:", content);
      
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
          
          // Look for cloze (fill-in-the-blanks) activities
          if (processedContent.cloze || processedContent.fillInTheBlanks || processedContent.fillInBlanks || processedContent.clozeActivity) {
            console.log("Found cloze activity in Gemini response");
            const clozeContent = processedContent.cloze || processedContent.fillInTheBlanks || processedContent.fillInBlanks || processedContent.clozeActivity;
            let clozeText = "";
            let wordBank: string[] = [];
            
            if (typeof clozeContent === 'string') {
              // If it's a string, assume it contains the cloze text with [n:word] format
              clozeText = clozeContent;
              
              // Extract word bank from the text if in [n:word] format
              const matches = clozeText.match(/\[(\d+):([^\]]+)\]/g) || [];
              wordBank = matches.map(match => {
                const word = match.match(/\[(\d+):([^\]]+)\]/)?.[2] || "";
                return word;
              });
            } else if (typeof clozeContent === 'object') {
              // Handle object format with text and wordBank properties
              if (clozeContent.text) {
                clozeText = clozeContent.text;
              } else if (clozeContent.passage || clozeContent.content) {
                clozeText = clozeContent.passage || clozeContent.content;
              }
              
              // Get word bank from the object
              if (Array.isArray(clozeContent.wordBank)) {
                wordBank = clozeContent.wordBank;
              } else if (Array.isArray(clozeContent.words)) {
                wordBank = clozeContent.words;
              } else if (typeof clozeContent.wordBank === 'string') {
                wordBank = clozeContent.wordBank.split(/[,\s]+/).filter(Boolean);
              }
              
              // If we have a text but no blanks in [n:word] format, try to convert
              if (clozeText && !clozeText.includes('[') && Array.isArray(wordBank) && wordBank.length > 0) {
                // Replace words in text with [n:word] format
                wordBank.forEach((word, index) => {
                  const regex = new RegExp(`\\b${word}\\b`, 'i');
                  clozeText = clozeText.replace(regex, `[${index + 1}:${word}]`);
                });
              }
            }
            
            if (clozeText) {
              // Add to processedContent
              processedContent.cloze = {
                text: clozeText,
                wordBank: wordBank
              };
              
              // Add to sections
              processedContent.sections.push({
                type: 'cloze',
                title: 'Fill in the Blanks'
              });
              
              console.log("Added cloze section from top-level keys");
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
            
            // --- BEGIN EDIT: Extract data for cloze and sentenceUnscramble --- 
            // Check if this section is the cloze or sentenceUnscramble section
            // and extract its data to the top-level of processedContent
            if (section.type === 'cloze') {
              console.log("Found cloze section in array, extracting data to processedContent.cloze");
              processedContent.cloze = {
                 text: section.text || "",
                 wordBank: section.wordBank || [],
                 title: section.title || "Fill in the Blanks", // Preserve title if available
                 teacherNotes: section.teacherNotes || "" // Preserve notes if available
              };
            }
            
            if (section.type === 'sentenceUnscramble') {
              console.log("Found sentenceUnscramble section in array, extracting data to processedContent.sentenceUnscramble");
              processedContent.sentenceUnscramble = {
                sentences: section.sentences || [],
                title: section.title || "Sentence Unscramble", // Preserve title if available
                teacherNotes: section.teacherNotes || "" // Preserve notes if available
              };
            }
            
            // --- END EDIT: Remove Sentence Frames Data Extraction ---
            
            // Add the processed section 
            normalizedSections.push(section);
          }
        });
        
        // Replace with normalized sections
        processedContent.sections = normalizedSections;
      }
      
      // Set the processed content
      setParsedContent(processedContent);
      
      // --- BEGIN EDIT: Log final state of sentenceFrames section ---
      const finalSentenceFramesSection = processedContent.sections?.find((s: any) => s?.type === 'sentenceFrames' || s?.type === 'grammar');
      console.log("SentenceFrames section in final processedContent.sections:", JSON.stringify(finalSentenceFramesSection, null, 2));
      // --- END EDIT ---
      
      // --- BEGIN EDIT: Set initial active tab ---
      // Determine available sections AFTER processing
      const finalSectionTypes = processedContent.sections?.map((s: any) => s?.type).filter(Boolean) || [];
      
      // Make sure we have an overview section for all lessons
      if (!finalSectionTypes.includes('overview')) {
        console.log("Adding overview section as it doesn't exist");
        // Create an overview section if it doesn't exist
        processedContent.sections.unshift({
          type: 'overview',
          title: 'Lesson Overview',
          content: processedContent.description || 
                  (processedContent.title ? `Overview of ${processedContent.title}` : 'Lesson Overview'),
          objectives: processedContent.objectives || []
        });
        // Add to finalSectionTypes
        finalSectionTypes.unshift('overview');
      }
      
      // Add pronunciation to displayOrder
      const displayOrder: string[] = ["overview", "warmup", "reading", "comprehension", "vocabulary", "pronunciation", "sentenceFrames", "cloze", "sentenceUnscramble", "discussion", "quiz"];
      const orderedAvailableSections = displayOrder.filter(type => {
         // Check for primary type or alternatives
         if (type === 'warmup') return finalSectionTypes.includes('warmup') || finalSectionTypes.includes('warm-up');
         if (type === 'sentenceFrames') return finalSectionTypes.includes('sentenceFrames') || finalSectionTypes.includes('grammar');
         if (type === 'discussion') return finalSectionTypes.includes('discussion') || finalSectionTypes.includes('speaking');
         if (type === 'quiz') return finalSectionTypes.includes('quiz') || finalSectionTypes.includes('assessment');
         // Check for specific types like 'cloze', 'sentenceUnscramble', 'pronunciation' which might be top-level or in sections
         if (type === 'cloze') return !!processedContent.cloze || finalSectionTypes.includes('cloze');
         if (type === 'sentenceUnscramble') return !!processedContent.sentenceUnscramble || finalSectionTypes.includes('sentenceUnscramble');
         if (type === 'pronunciation') return !!processedContent.pronunciation || finalSectionTypes.includes('pronunciation'); // Check for pronunciation data
         // Default check
         return finalSectionTypes.includes(type);
      });
      // Add any remaining types not in displayOrder (like 'notes' or custom ones)
      finalSectionTypes.forEach((type: string) => {
         if (!orderedAvailableSections.includes(type)) {
             // Ensure notes is always last if present
             if (type === 'notes') return; 
             orderedAvailableSections.push(type);
         }
      });
      if (finalSectionTypes.includes('notes')) {
          orderedAvailableSections.push('notes');
      }
      
      if (orderedAvailableSections.length > 0 && !activeTab) { // Set only if not already set
          console.log("Setting initial active tab to:", orderedAvailableSections[0]);
          setActiveTab(orderedAvailableSections[0]);
      }
      // --- END EDIT ---
    }
  }, [content, activeTab]);
  
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
      icon: FileText,
      label: "Teacher Notes",
      color: "bg-blue-100",
      textColor: "text-blue-700",
      description: "Teaching guidance and tips"
    },
    "overview": {
      icon: Lightbulb,
      label: "Overview",
      color: "bg-indigo-100",
      textColor: "text-indigo-700",
      description: "Lesson overview and warm-up questions"
    },
    "warmup": { 
      icon: Flame, 
      label: "Vocab Introduction",
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
      icon: BookOpen, 
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
      icon: AlignLeft,
      label: "Sentence Frames",
      color: "amber",
      textColor: "amber",
      description: "Learn structural patterns for effective communication"
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
      icon: Check, 
      label: "Quiz",
      color: "bg-cyan-100",
      textColor: "text-cyan-700",
      description: "Test knowledge and understanding of the lesson"
    },
    "assessment": { 
      icon: Check, 
      label: "Assessment",
      color: "bg-cyan-100",
      textColor: "text-cyan-700",
      description: "Evaluate understanding through questions"
    },
    "cloze": {
      icon: PenTool,
      label: "Fill in the Blanks",
      color: "bg-pink-100",
      textColor: "text-pink-700",
      description: "Practice vocabulary and grammar with fill-in-the-blank exercises"
    },
    "sentenceUnscramble": {
      icon: Shuffle,
      label: "Sentence Unscramble",
      color: "bg-cyan-100",
      textColor: "text-cyan-700",
      description: "Practice correct word order in English sentences"
    },
    "pronunciation": { // Added pronunciation details
      icon: Mic,
      label: "Pronunciation",
      color: "bg-green-100",
      textColor: "text-green-700",
      description: "Practice pronunciation of key words"
    },
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
  
  // Helper function to find a section by type with error handling
  const findSection = (type: SectionType | string) => {
    try {
      if (Array.isArray(parsedContent.sections)) {
        // Find based on type, allowing for alternatives
        const found = parsedContent.sections.find((section: any) => {
          if (!section || typeof section !== 'object') return false;
          if (type === 'warmup') return section.type === 'warmup' || section.type === 'warm-up';
          if (type === 'sentenceFrames') return section.type === 'sentenceFrames' || section.type === 'grammar';
          if (type === 'discussion') return section.type === 'discussion' || section.type === 'speaking';
          if (type === 'quiz') return section.type === 'quiz' || section.type === 'assessment';
          if (type === 'pronunciation') return section.type === 'pronunciation'; // Specifically check for pronunciation type
          return section.type === type;
        });

        // Log if found
        if (found) {
           console.log(`[findSection] Found section for type '${type}':`, found);
        } else {
           console.log(`[findSection] No section found for type '${type}' in sections array.`);
           // Check top-level for specific types if not found in array
           if (type === 'cloze' && parsedContent.cloze) return { type: 'cloze', ...parsedContent.cloze };
           if (type === 'sentenceUnscramble' && parsedContent.sentenceUnscramble) return { type: 'sentenceUnscramble', ...parsedContent.sentenceUnscramble };
           if (type === 'pronunciation' && parsedContent.pronunciation) return { type: 'pronunciation', ...parsedContent.pronunciation }; // Check top-level pronunciation
        }
        return found;
      } else {
        console.warn('[findSection] parsedContent.sections is not an array');
        // Check top-level for specific types if sections array is missing/invalid
        if (type === 'cloze' && parsedContent.cloze) return { type: 'cloze', ...parsedContent.cloze };
        if (type === 'sentenceUnscramble' && parsedContent.sentenceUnscramble) return { type: 'sentenceUnscramble', ...parsedContent.sentenceUnscramble };
        if (type === 'pronunciation' && parsedContent.pronunciation) return { type: 'pronunciation', ...parsedContent.pronunciation }; // Check top-level pronunciation
        return null;
      }
    } catch (error) {
      console.error(`[findSection] Error finding section type '${type}':`, error);
      return null;
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

    // Format the pronunciation guide
    const formatPronunciation = (pronunciation: string) => {
      if (!pronunciation) return "";
      // If it's already in phonetic format with slashes, return as is
      if (pronunciation.startsWith('/') && pronunciation.endsWith('/')) return pronunciation;
      // Otherwise, add phonetic slashes
      return `/${pronunciation}/`;
    };
    
    // Extract the word from the example sentence and highlight it
    const highlightWordInExample = (example: string, word: string) => {
      if (!example || !word) return example;
      
      // Case-insensitive replace to highlight all instances of the word
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return example.replace(regex, (match) => `<span class="font-bold text-blue-600">${match}</span>`);
    };
    
    return (
      <div className="space-y-6">
        {/* --- REMOVED Separate Section Title --- */}
        {/* <div className="flex items-center gap-3 mb-5 bg-amber-50 p-4 rounded-lg"> ... </div> */}
        
        {/* Vocabulary card layout - full width */}
        <div className="w-full">
          {/* Navigation Controls */}
          <div className="flex justify-center items-center mb-4 bg-amber-50 rounded-full px-6 py-2 w-max mx-auto">
            <button 
              onClick={goToPrevWord}
              className="p-1 text-amber-700 hover:bg-amber-100 rounded-full"
              aria-label="Previous vocabulary word"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="text-amber-900 font-medium mx-3">
              {vocabWords.length > 0 ? `${currentWordIndex + 1} of ${vocabWords.length}` : 'No vocabulary words'}
            </span>
            
            <button 
              onClick={goToNextWord}
              className="p-1 text-amber-700 hover:bg-amber-100 rounded-full"
              aria-label="Next vocabulary word"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Main Word Card */}
          <SectionHeader
            icon={Flame}
            title="Vocab Introduction"
            description="Review the vocabulary word: check pronunciation, definition, and examples. Ask questions if needed."
            color="amber"
          />
          
          <Card className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
            
            {/* CardContent now contains the flex row for image + details */}
            <CardContent className="p-0"> {/* Remove padding here, handled inside */}
              <div className="flex flex-col md:flex-row">
                  {/* Left: Image */}
                  <div className="w-full md:w-[30%] bg-gray-100 flex items-center justify-center">
                    {currentWord?.imageBase64 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src={`data:image/png;base64,${currentWord.imageBase64}`}
                          alt={`Image for ${currentWord.word}`}
                          className="w-full object-contain"
                          style={{ minHeight: '200px', maxHeight: '280px' }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <Lightbulb className="h-16 w-16 text-amber-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Word Info + Pronunciation/Definition */}
                  {/* Added padding back here */}
                  <div className="w-full md:w-[70%] p-6 flex flex-col">
                    <div className="mb-3">
                      <h2 className="text-3xl font-bold text-gray-800">{currentWord?.word}</h2>
                      <p className="text-gray-600 italic">{currentWord?.partOfSpeech}</p>
                    </div>
                    
                    {/* --- NEW: Flex container for Pronunciation and Definition --- */}
                    <div className="flex flex-col md:flex-row gap-4 flex-grow"> {/* Use flex-grow to fill space */} 
                      {/* Left Side: Pronunciation */}
                      <div className="w-full md:w-1/2">
                        {/* Pronunciation display - styled EXACTLY like the reference image with dynamic data */}
                        <div className="bg-blue-50 rounded-md p-4 h-full"> {/* Added h-full */} 
                          <div className="flex items-center mb-4"> {/* Added margin-bottom */} 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                 className="h-5 w-5 text-blue-700 mr-2">
                              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
                              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4"></path>
                              <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                            <span className="text-blue-700 font-semibold text-lg">Pronunciation</span>
                          </div>
                          
                          {/* Styled EXACTLY like the reference image with dynamic data */}
                          <div className="text-center mt-4">
                            {/* PART 1: Phonetic pronunciation in format like "KAIR-ak-ter" */}
                            <div className="text-2xl font-medium text-blue-800 mb-4">
                              {(() => {
                                // Get phonetic pronunciation data - should be in format like "KAIR-ak-ter"
                                
                                // First check if we have a direct pronunciation string
                                if (typeof currentWord?.pronunciation === 'string' && currentWord.pronunciation) {
                                  return currentWord.pronunciation.toUpperCase();
                                }
                                
                                // Check for pronunciation object with value or ipa field
                                if (currentWord?.pronunciation && typeof currentWord.pronunciation === 'object') {
                                  const pronounceObj = currentWord.pronunciation as any;
                                  
                                  // If we have a direct value/ipa field, use that
                                  if (pronounceObj.value) {
                                    return pronounceObj.value.toUpperCase();
                                  }
                                  
                                  if (pronounceObj.ipa) {
                                    return pronounceObj.ipa.toUpperCase();
                                  }
                                  
                                  if (pronounceObj.phoneticGuide) {
                                    return pronounceObj.phoneticGuide.toUpperCase();
                                  }
                                  
                                  // If we have syllables, create a phonetic guide
                                  const syllables = pronounceObj.syllables || [];
                                  const emphasisIdx = pronounceObj.stressIndex !== undefined ? pronounceObj.stressIndex : 0;
                                  
                                  if (syllables.length > 0) {
                                    return syllables.map((s: string, i: number) => 
                                      i === emphasisIdx ? s.toUpperCase() : s.toLowerCase()
                                    ).join('-');
                                  }
                                }
                                
                                // Check for direct phoneticGuide field
                                if (currentWord?.phoneticGuide) {
                                  return currentWord.phoneticGuide.toUpperCase();
                                }
                                
                                // Use syllables to create a phonetic guide as fallback
                                if (currentWord?.syllables && Array.isArray(currentWord.syllables) && currentWord.syllables.length > 0) {
                                  const emphasisIdx = currentWord.stressIndex !== undefined ? currentWord.stressIndex : 0;
                                  
                                  // Format exactly like "KAIR-ak-ter" with the emphasized syllable in UPPERCASE
                                  return currentWord.syllables.map((s, i) => 
                                    i === emphasisIdx ? s.toUpperCase() : s.toLowerCase()
                                  ).join('-');
                                }
                                
                                // Absolute fallback, just use the word
                                return currentWord?.word?.toUpperCase() || "";
                              })()}
                            </div>
                            
                            {/* PART 2: Syllable boxes with appropriate emphasis - EXACTLY as in reference image */}
                            <div className="flex justify-center gap-2 flex-wrap"> {/* Added flex-wrap */} 
                              {(() => {
                                // Get syllables and emphasis index
                                let syllables: string[] = [];
                                let emphasisIdx = 0;
                                
                                // Handle complex pronunciation object
                                if (currentWord?.pronunciation && typeof currentWord.pronunciation === 'object') {
                                  const pronounceObj = currentWord.pronunciation as any;
                                  
                                  // Get syllables from pronunciation object or fall back
                                  syllables = pronounceObj.syllables && Array.isArray(pronounceObj.syllables) && pronounceObj.syllables.length > 0
                                    ? pronounceObj.syllables
                                    : currentWord.syllables && Array.isArray(currentWord.syllables) && currentWord.syllables.length > 0
                                      ? currentWord.syllables
                                      : currentWord?.word?.match(/[bcdfghjklmnpqrstvwxz]*[aeiouy]+[bcdfghjklmnpqrstvwxz]*/gi) || [currentWord?.word || ""];
                                      
                                  // Get emphasis index
                                  emphasisIdx = pronounceObj.stressIndex !== undefined 
                                    ? pronounceObj.stressIndex 
                                    : currentWord.stressIndex !== undefined 
                                      ? currentWord.stressIndex 
                                      : 0;
                                } 
                                // Handle direct fields
                                else {
                                  // Get syllables from direct field
                                  syllables = currentWord?.syllables && Array.isArray(currentWord.syllables) && currentWord.syllables.length > 0
                                    ? currentWord.syllables
                                    : currentWord?.word?.match(/[bcdfghjklmnpqrstvwxz]*[aeiouy]+[bcdfghjklmnpqrstvwxz]*/gi) || [currentWord?.word || ""];
                                    
                                  // Get emphasis index
                                  emphasisIdx = currentWord?.stressIndex !== undefined ? currentWord.stressIndex : 0;
                                }
                                
                                // Return the syllable boxes
                                return syllables.map((syllable, idx) => (
                                  <div 
                                    key={idx}
                                    className={`min-w-[60px] py-1 px-2 rounded-md text-base ${
                                      idx === emphasisIdx
                                        ? 'bg-blue-600 text-white font-medium' 
                                        : 'bg-white text-gray-800 font-medium'
                                    } flex items-center justify-center`}
                                  >
                                    {syllable.toLowerCase()}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side: Definition */}
                      <div className="w-full md:w-1/2">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full"> {/* Added h-full */} 
                          <div className="p-4 border-b flex items-center">
                            <BookOpen className="h-5 w-5 text-blue-600 mr-2" /> {/* Adjusted icon size */} 
                            <h3 className="font-semibold text-blue-600 text-lg">Definition</h3> {/* Adjusted font size/weight */} 
                          </div>
                          <div className="p-4">
                            {/* Definition: Adjusted font size and weight */}
                            <p className="text-gray-800 text-xl font-bold">{currentWord?.definition}</p> 
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* --- END NEW Flex container --- */}
                    
                    {/* Additional information can go here if needed in the future */} 
                    {/* Removed the syllable display div from here as it's now in pronunciation */}
                  </div>
                </div>
            </CardContent>
          </Card>
          {/* END Main Word Card */}

          {/* Combined Example Sentences Card */}
          {(() => {
            // Collect all example sentences
            const allExamples = [];
            
            // Add the main example if it exists
            if (currentWord?.example) {
              allExamples.push(currentWord.example);
            }
            
            // Add additional examples if they exist
            if (currentWord?.additionalExamples && Array.isArray(currentWord.additionalExamples)) {
              allExamples.push(...currentWord.additionalExamples);
            }

            if (allExamples.length > 0) {
              return (
                // Make this the main card for examples
                <Card className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
                  {/* Standardized CardHeader for Examples */}
                  <CardHeader className="bg-blue-50 border-b border-blue-200 p-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-xl font-semibold text-blue-700">Example Sentences</CardTitle>
                        {/* No instruction needed here as it's self-explanatory */} 
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-5">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                      {allExamples.map((example, idx) => (
                        <p 
                          key={idx}
                          className="text-gray-800 text-xl font-bold"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightWordInExample(example, currentWord.word || "") 
                          }}
                        ></p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}
          {/* END Example Sentences Card */}

          {/* Other cards (Word Family, Common Phrases, Usage Notes) - Add standardized headers */}

          {/* Two Column Layout for Word Family and Common Phrases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Word Family Card */}
            {currentWord?.wordFamily && currentWord.wordFamily.words && currentWord.wordFamily.words.length > 0 && (
              <Card className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                 {/* Standardized Header */}
                 <CardHeader className="bg-blue-50 border-b border-blue-200 p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                         <CardTitle className="text-xl font-semibold text-blue-700">Word Family</CardTitle>
                      </div>
                    </div>
                 </CardHeader>
                 {/* Remove old header */}
                 {/* <div className="p-4 border-b flex items-center"> ... </div> */}
                
                 <CardContent className="p-5">
                  <p className="text-gray-600 mb-3 text-sm">Related words in this family:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.wordFamily.words.map((word, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xl font-bold">
                        {word}
                      </span>
                    ))}
                  </div>
                  
                  {currentWord.wordFamily.description && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md text-gray-700">
                      <p className="text-xl font-bold"><span className="font-medium">Note:</span> {currentWord.wordFamily.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Common Phrases Card */}
            {currentWord?.collocations && currentWord.collocations.length > 0 && (
              <Card className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                 {/* Standardized Header */}
                 <CardHeader className="bg-blue-50 border-b border-blue-200 p-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                         <CardTitle className="text-xl font-semibold text-blue-700">Common Phrases</CardTitle>
                      </div>
                    </div>
                 </CardHeader>
                 {/* Remove old header */}
                 {/* <div className="p-4 border-b flex items-center"> ... </div> */}

                 <CardContent className="p-5">
                  <p className="text-gray-600 mb-3 text-sm">Frequently used with:</p>
                  <ul className="space-y-2 list-disc pl-5">
                    {currentWord.collocations.map((phrase, idx) => (
                      <li key={idx} className="text-gray-800 text-xl font-bold">
                        <span dangerouslySetInnerHTML={{
                          __html: highlightWordInExample(phrase, currentWord.word)
                        }}></span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Usage Notes Card */}
          {currentWord?.usageNotes && (
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Standardized Header */}
              <CardHeader className="bg-blue-50 border-b border-blue-200 p-4">
                 <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div>
                       <CardTitle className="text-xl font-semibold text-blue-700">Usage Notes</CardTitle>
                    </div>
                 </div>
              </CardHeader>
              {/* Remove old header */}
              {/* <div className="p-4 border-b flex items-center"> ... </div> */}

              <CardContent className="p-5">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-gray-800 text-xl font-bold">{currentWord.usageNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
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
    
    // Log raw vocabulary section data to examine its structure
    console.log("RAW VOCABULARY SECTION:", section);
    
    const [activeCard, setActiveCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Extract vocabulary words from the section
    const extractedVocabWords: VocabularyWord[] = [];
    
    // No hardcoded pronunciation data - we'll use the AI-generated data directly
    
    // Look for the 'words' array in the vocabulary section (Gemini format)
    if (section.words && Array.isArray(section.words)) {
      section.words.forEach((wordData: any) => {
        if (typeof wordData === 'object') {
          // Use only the AI-generated data
          extractedVocabWords.push({
            word: wordData.term || wordData.word || "",
            partOfSpeech: wordData.partOfSpeech || "noun",
            definition: wordData.definition || "",
            example: wordData.example || "",
            
            // Use only the AI-generated data
            pronunciation: wordData.pronunciation || wordData.phonetic || wordData.ipa,
            
            syllables: wordData.syllables && Array.isArray(wordData.syllables) && wordData.syllables.length > 0 
                     ? wordData.syllables : undefined,
            
            stressIndex: wordData.stressIndex !== undefined ? wordData.stressIndex : undefined,
            
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
      // Log the vocabulary words to help with debugging
      console.log('Extracted vocabulary words:', extractedVocabWords.map(w => ({
        word: w.word,
        pronunciation: w.pronunciation,
        syllables: w.syllables,
        stressIndex: w.stressIndex
      })));
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
        {/* Using the reusable SectionHeader component */}
        <SectionHeader
          title="Vocabulary"
          description="Review the flashcard. Try defining the word in your own words and using it in a sentence."
          icon={BookOpen}
          color="green"
        />
        
        {/* Vocabulary Practice Card */}
        <div className="bg-green-50/30 rounded-lg p-4 border border-green-100">
          {/* Word count and progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 font-medium">
                Word {activeCard + 1} of {words.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 font-medium">Progress</span>
              <div className="w-32 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-600 h-1.5 rounded-full" 
                  style={{ width: `${((activeCard + 1) / words.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Flip Card */}
          <div className="flex justify-center mb-6">
            <motion.div 
              className="w-full max-w-md h-[320px] cursor-pointer perspective-1000"
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

                {/* Back of card (definition and example) - PRONUNCIATION REMOVED as requested */}
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
                        {/* Definition on flip card */}
                        <p className="text-gray-800 text-xl font-bold">{currentWord.definition}</p> {/* Applied text-xl font-bold */} 
                      </div>
                    </div>
                    
                    {/* Example */}
                    <div>
                      <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Example:
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                         {/* Example on flip card */}
                        <p className="italic text-gray-800 text-xl font-bold">"{currentWord.example}"</p> {/* Applied text-xl font-bold */} 
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
                              <Mic className="h-4 w-4 mr-3 text-gray-400" />
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

  // Teacher Notes Section to collect all teacher notes
  // Overview component that displays the lesson title and warm-up questions in a new tab
  const OverviewSection = () => {
    const lesson = parsedContent?.lesson || {};
    
    // --- Corrected Warm-up Question Fetching ---
    // Try to find the warm-up section from multiple possible types/locations
    const warmupSection = 
      findSection("warmup") || 
      findSection("warm-up"); 
      // Removed sentenceFrames and first section fallback for clarity in overview
      
    let warmupQuestions: string[] = [];
    if (warmupSection?.questions) {
      if (Array.isArray(warmupSection.questions)) {
        warmupQuestions = warmupSection.questions.filter((q: any): q is string => typeof q === 'string');
      } else if (typeof warmupSection.questions === 'object') {
        // Handle object format (e.g., Qwen API) - assuming keys are the questions
        warmupQuestions = Object.keys(warmupSection.questions)
          .filter(q => typeof q === 'string' && q.trim().length > 0);
      }
    }
    // If still no questions, check the top-level parsedContent as a fallback
    if (warmupQuestions.length === 0 && Array.isArray(parsedContent?.warmUpQuestions)) {
        warmupQuestions = parsedContent.warmUpQuestions.filter((q: any): q is string => typeof q === 'string');
    }
    // --- End Correction ---

    const title = lesson.title || "Lesson Overview"; // Use a default title if none found

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-6 p-6"
      >
        {/* --- REMOVED Separate Section Header --- */}

        {/* Lesson Metadata - Keep this above the warm-up card */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {lesson.level && <Badge variant="secondary" className="bg-blue-100 text-blue-800"><FileText className="mr-1 h-4 w-4" /> Level: {lesson.level}</Badge>}
          {lesson.focus && <Badge variant="secondary" className="bg-green-100 text-green-800"><Target className="mr-1 h-4 w-4" /> Focus: {lesson.focus}</Badge>}
          {lesson.time && <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Clock className="mr-1 h-4 w-4" /> Time: {lesson.time}</Badge>}
        </div>

        {/* --- REMOVED OLD Introductory Text & Instructions --- */}
        {/* <div className="flex items-center gap-3 mb-2 text-gray-700"> ... </div> */}
        {/* <p className="text-xl font-bold text-gray-600 mb-4 pl-9"> ... </p> */}
        

        {/* Section Header with SectionHeader component */}
        <SectionHeader
          icon={Lightbulb}
          title="Overview & Warm-up"
          description="Read each question below. Take 1-2 minutes per question to think about your answer and share it briefly."
          color="blue"
        />
        
        {/* Warm-up Questions Card */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {/* Remove old CardHeader content if any */}
          {/* <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4"> ... </CardHeader> */}
          
          <CardContent className="p-6">
            {warmupQuestions.length > 0 ? (
              <ul className="space-y-4">
                {warmupQuestions.map((q: string, index: number) => (
                  <li key={index} className="flex items-start p-4 bg-blue-50 border border-blue-100 rounded-md shadow-sm">
                    <span className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {/* Question Text */}
                    <p className="text-gray-700 leading-relaxed text-xl font-bold">{q}</p> {/* Applied text-xl font-bold */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No warm-up questions available for this lesson.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

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
        {/* Notes Header using SectionHeader */}
        <SectionHeader
          icon={FileText}
          title="Teacher Notes"
          description="Teaching guidance, suggestions, and additional resources"
          color="blue"
        />
        
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
                <FileText className="mx-auto h-12 w-12 text-blue-300" />
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
  const displayOrder: string[] = ["overview", "warmup", "reading", "comprehension", "vocabulary", "pronunciation", "sentenceFrames", "cloze", "sentenceUnscramble", "discussion", "quiz"];
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
  
  // Add pronunciation section if it doesn't exist in sections array but data exists top-level
  if (!contentSectionTypes.includes("pronunciation") && parsedContent.pronunciation) {
    console.log("Adding pronunciation to content sections from top-level data");
    contentSectionTypes.push("pronunciation");
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
  
  // Always add the overview tab as the first tab
  if (!availableSections.includes("overview")) {
    availableSections.unshift("overview");
  }
  
  // If we still don't have any sections, use the original content section types as fallback
  if (availableSections.length === 1) { // Only overview tab
    availableSections.push(...contentSectionTypes);
  }
  
  // Always add the notes tab regardless of whether we have teacher notes or not
  if (!availableSections.includes("notes")) {
    // Check if 'notes' type actually exists in the data before adding
    if (contentSectionTypes.includes("notes")) {
       availableSections.push("notes");
    }
  }
  
  // If no standard sections found, fall back to filtering and mapping
  
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
  
  // Creating the main render tree for the lesson
  const renderTree = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Compass className="h-5 w-5" />,
      render: <OverviewSection />
    },
    {
      id: 'warmup',
      label: 'Warm-up',
      icon: <Flame className="h-5 w-5" />,
      render: (
        (() => {
          if (!(hasSectionType('warmup') || hasSectionType('warm-up'))) return null;
          return <WarmupSection />;
        })()
      )
    },
    {
      id: 'reading',
      label: 'Reading',
      icon: <BookOpen className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('reading')) return null;
          return <ReadingTabSection />;
        })()
      )
    },
    {
      id: 'vocabulary',
      label: 'Vocabulary',
      icon: <Library className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('vocabulary')) return null;
          return <VocabularySection />;
        })()
      )
    },
    {
      id: 'comprehension',
      label: 'Comprehension',
      icon: <CheckCircle className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('comprehension')) return null;
          return <ComprehensionExtractor content={parsedContent} />;
        })()
      )
    },
    {
      id: 'sentenceFrames',
      label: 'Sentence Frames',
      icon: <AlignJustify className="h-5 w-5" />,
      render: (
        (() => {
          const sentenceFramesData = findSection('sentenceFrames');
          
          // DEBUG: Examine the actual data
          console.log("=========== EXAMINING SENTENCE FRAMES DATA ===========");
          console.log("1. Direct section data:", sentenceFramesData);
          console.log("2. Available section types:", 
            JSON.stringify(parsedContent.sections?.map((s: any) => s.type))
          );
          
          // Just log the sentence frames to understand what we're dealing with
          if (!sentenceFramesData) {
            console.log("No sentenceFrames data found");
            return <div className="p-4">Sentence frames data not available or could not be found. 
              <div className="mt-2 text-sm text-gray-500">Examining data structure for future fixes.</div>
            </div>;
          }
          
          console.log("3. Structure of sentenceFramesData:", 
            JSON.stringify({
              keys: Object.keys(sentenceFramesData),
              hasFrames: Array.isArray(sentenceFramesData.frames),
              framesCount: Array.isArray(sentenceFramesData.frames) ? sentenceFramesData.frames.length : 0,
              hasContent: sentenceFramesData.content !== undefined,
              contentType: sentenceFramesData.content ? typeof sentenceFramesData.content : "n/a",
              hasPattern: sentenceFramesData.pattern !== undefined,
              hasPatterns: sentenceFramesData.patterns !== undefined
            })
          );
          
          if (Array.isArray(sentenceFramesData.frames) && sentenceFramesData.frames.length > 0) {
            console.log("4. First frame structure:", 
              JSON.stringify({
                keys: Object.keys(sentenceFramesData.frames[0]),
                hasTemplate: sentenceFramesData.frames[0].patternTemplate !== undefined,
                hasComponents: Array.isArray(sentenceFramesData.frames[0].structureComponents)
              })
            );
          }
          
          // Create a properly formatted section for rendering
          const formattedSection = {
            type: 'sentenceFrames',
            title: sentenceFramesData.title || 'Sentence Frames',
            frames: Array.isArray(sentenceFramesData.frames) 
              ? sentenceFramesData.frames 
              : sentenceFramesData.content && typeof sentenceFramesData.content === 'object'
                ? [sentenceFramesData.content]
                : []
          };
          
          return <SentenceFramesSection section={formattedSection} />;
        })()
      )
    },
    {
      id: 'grammar',
      label: 'Grammar',
      icon: <AlignLeft className="h-5 w-5" />,
      render: (
        (() => {
          const grammarData = findSection('grammar');
          console.log("Grammar data found:", grammarData);
          if (!grammarData) {
            console.log("No grammar data found");
            return <div className="p-4">Grammar data not available</div>;
          }
          
          // Create a properly formatted section object if needed
          const formattedSection = {
            type: 'grammar',
            title: grammarData.title || 'Grammar',
            frames: Array.isArray(grammarData.frames) 
              ? grammarData.frames 
              : grammarData.content && typeof grammarData.content === 'object'
                ? [grammarData.content]
                : []
          };
          
          console.log("Formatted grammar section:", formattedSection);
          return <SentenceFramesSection section={formattedSection} />;
        })()
      )
    },
    {
      id: 'cloze',
      label: 'Fill in the Blanks',
      icon: <Pencil className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('cloze')) return null;
          const clozeData = parsedContent.cloze || findSection('cloze');
          if (!clozeData) return <div>No cloze activity data found</div>;
          return <InteractiveClozeSection 
            title={clozeData.title || "Fill in the Blanks"} 
            text={clozeData.text || ""} 
            wordBank={clozeData.wordBank || []} 
          />;
        })()
      )
    },
    {
      id: 'sentenceUnscramble',
      label: 'Sentence Unscramble',
      icon: <Shuffle className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('sentenceUnscramble')) return null;
          const unscrambleData = parsedContent.sentenceUnscramble || findSection('sentenceUnscramble');
          return <SentenceUnscrambleSection 
            sentences={unscrambleData?.sentences || []}
            title={unscrambleData?.title || "Sentence Unscramble"}
          />;
        })()
      )
    },
    {
      id: 'discussion',
      label: 'Discussion',
      icon: <MessageSquare className="h-5 w-5" />,
      render: (
        (() => {
          const discussionData = findSection('discussion');
          if (!discussionData) return null;
          return <DiscussionSection section={discussionData} />;
        })()
      )
    },
    {
      id: 'pronunciation',
      label: 'Pronunciation',
      icon: <Volume2 className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('pronunciation')) return null;
          return <div className="p-4">Pronunciation practice integrated in vocabulary warm-up</div>;
        })()
      )
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: <HelpCircle className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('quiz')) return null;
          return <QuizExtractor content={parsedContent} />;
        })()
      )
    },
    {
      id: 'notes',
      label: 'Teacher Notes',
      icon: <FileText className="h-5 w-5" />,
      render: (
        (() => {
          if (!hasSectionType('notes')) return null;
          return <TeacherNotesSection />;
        })()
      )
    }
  ];
  
  return (
    <div className="lesson-content w-[95%] max-w-[1800px] mx-auto"> {/* Increased width for better screen space utilization */}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 relative">
        <TabsList className="flex overflow-x-auto whitespace-nowrap justify-start p-1 h-auto rounded-lg bg-gray-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {availableSections.map((section) => {
            // Handle sections as strings and provide fallback details
            const sectionType = section as string;
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
                key={section} 
                value={section}
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
        
        {/* Section content */}
        <div className="p-1 text-2xl leading-relaxed"> {/* Increased text size for better readability */}
          {renderTree.map((item) => (
            <TabsContent key={item.id} value={item.id} className="m-0">
              {item.render}
            </TabsContent>
          ))}
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
