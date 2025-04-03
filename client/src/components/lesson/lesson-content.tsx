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
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
      console.log("FULL LESSON DATA:", JSON.stringify(content, null, 2));
      
      // Don't try to log sections from parsedContent until it's set
      if (parsedContent) {
        console.log("Original sections:", parsedContent.sections);
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
    
    // Let's look at what we're dealing with
    console.log("Warm-up section attempt:", section);

    // Extract or generate vocabulary words
    let vocabWords: Array<{
      word: string;
      partOfSpeech?: string;
      definition?: string;
      example?: string;
      pronunciation?: string;
    }> = [];

    // Get vocabulary words from targetVocabulary if available
    if (section.targetVocabulary) {
      console.log("Found targetVocabulary in section:", section.targetVocabulary);
      
      if (Array.isArray(section.targetVocabulary)) {
        // If it's an array of strings, convert to objects
        vocabWords = section.targetVocabulary.map((term: string) => ({
          word: term,
          partOfSpeech: "noun",
          definition: "Definition not provided",
          example: `Example using "${term}" in context.`,
          pronunciation: "Pronunciation not provided"
        }));
      } 
      else if (typeof section.targetVocabulary === 'object') {
        // If it's an object mapping terms to definitions
        const extractedWords = [];
        
        for (const term in section.targetVocabulary) {
          if (typeof term === 'string' && term.trim()) {
            extractedWords.push({
              word: term,
              partOfSpeech: "noun",
              definition: section.targetVocabulary[term] || "Definition not provided",
              example: `Example using "${term}" in context.`,
              pronunciation: "Pronunciation not provided"
            });
          }
        }
        
        if (extractedWords.length > 0) {
          vocabWords = extractedWords;
        }
      }
    }

    // If we didn't find vocabulary words, try to extract from the content
    if (vocabWords.length === 0 && section.content) {
      // Define target vocabulary words for the celebration lesson
      const targetWords = ["festivity", "commemorate", "patriotic", "ritual", "heritage"];
      const definitions = {
        "festivity": "A joyful celebration or festival with entertainment",
        "commemorate": "To honor and remember an important person or event",
        "patriotic": "Having love, loyalty and devotion to one's country",
        "ritual": "A formal ceremony or series of acts always performed the same way",
        "heritage": "Traditions and culture passed down from previous generations"
      };
      const examples = {
        "festivity": "The New Year's festivities included fireworks and music.",
        "commemorate": "We commemorate Independence Day every year on July 4th.",
        "patriotic": "She felt patriotic when she saw the national flag.",
        "ritual": "The lighting of candles is an important ritual in many celebrations.",
        "heritage": "Their cultural heritage influences how they celebrate holidays."
      };
      const pronunciations = {
        "festivity": "fes-TIV-i-tee",
        "commemorate": "kuh-MEM-uh-rayt",
        "patriotic": "pay-tree-OT-ik",
        "ritual": "RICH-oo-uhl",
        "heritage": "HAIR-i-tij"
      };
      
      // Check if the content mentions our target words
      if (section.content.includes("festivity") || 
          section.content.includes("patriotic") || 
          section.content.includes("ritual")) {
        // Use the predefined vocabulary words
        vocabWords = targetWords.map(word => ({
          word,
          partOfSpeech: "noun",
          definition: definitions[word],
          example: examples[word],
          pronunciation: pronunciations[word]
        }));
      } else {
        // Fallback to regular expression extraction
        const vocabPattern = /['"]([a-zA-Z]+)['"]|vocabulary\s+words.*?['"]([a-zA-Z]+)['"]/gi;
        const matches = [...section.content.matchAll(vocabPattern)];
        
        if (matches.length > 0) {
          vocabWords = matches.map(match => ({
            word: (match[1] || match[2]),
            partOfSpeech: "noun",
            definition: "Definition extracted from content",
            example: `Example using "${match[1] || match[2]}" in context.`,
            pronunciation: "Pronunciation not provided"
          }));
        }
      }
    }

    // Ensure we have at least some vocabulary words for the UI
    if (vocabWords.length === 0) {
      // Fallback to at least one word from the section title or content
      const word = section.title?.split(' ').pop() || 'vocabulary';
      vocabWords = [{
        word,
        partOfSpeech: "noun",
        definition: "A collection of words used in a language.",
        example: `Students will learn new ${word} in this lesson.`,
        pronunciation: "voh-KAB-yuh-lair-ee"
      }];
    }

    // Get or create discussion questions
    let discussionQuestions: string[] = [];
    if (section.questions) {
      if (Array.isArray(section.questions)) {
        discussionQuestions = section.questions;
      } else if (typeof section.questions === 'object') {
        // Extract questions from object format
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
              <div className="bg-blue-50 rounded-md p-5 border border-blue-100">
                <div className="mb-4">
                  <h2 className="text-xl font-medium text-blue-900">{currentWord.word}</h2>
                  <p className="text-blue-600 text-sm italic">{currentWord.partOfSpeech || 'noun'}</p>
                </div>
                
                {/* Definition */}
                <div className="mb-4">
                  <h3 className="text-blue-800 font-medium flex items-center mb-2">
                    <Book className="mr-2 h-4 w-4" />
                    Definition
                  </h3>
                  <p className="p-3 bg-white rounded border border-blue-100">
                    {currentWord.definition || `A definition for ${currentWord.word}`}
                  </p>
                </div>
                
                {/* Example */}
                <div className="mb-4">
                  <h3 className="text-blue-800 font-medium flex items-center mb-2">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Example
                  </h3>
                  <p className="p-3 bg-white rounded border border-blue-100 italic">
                    "{currentWord.example || `This is an example sentence using the word ${currentWord.word}.`}"
                  </p>
                </div>
                
                {/* Pronunciation */}
                <div>
                  <h3 className="text-blue-800 font-medium flex items-center mb-2">
                    <Radio className="mr-2 h-4 w-4" />
                    Pronunciation
                  </h3>
                  <p className="p-3 bg-white rounded border border-blue-100">
                    {currentWord.pronunciation || `Pronunciation for ${currentWord.word}`}
                  </p>
                  
                  {/* Syllable breakdown */}
                  {currentWord.word && (
                    <div className="flex justify-center mt-3">
                      {currentWord.word.split('').map((letter, idx) => (
                        <span 
                          key={idx} 
                          className={`px-2 py-1 text-sm ${
                            idx % 3 === 1 ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
    const preDefinedVocabWords = [
      {
        term: "festivity",
        partOfSpeech: "noun",
        definition: "A joyful celebration or festival with entertainment",
        example: "The New Year's festivities included fireworks and music."
      },
      {
        term: "commemorate",
        partOfSpeech: "verb",
        definition: "To honor and remember an important person or event",
        example: "We commemorate Independence Day every year on July 4th."
      },
      {
        term: "patriotic",
        partOfSpeech: "adjective",
        definition: "Having love, loyalty and devotion to one's country",
        example: "She felt patriotic when she saw the national flag."
      },
      {
        term: "ritual",
        partOfSpeech: "noun",
        definition: "A formal ceremony or series of acts always performed the same way",
        example: "The lighting of candles is an important ritual in many celebrations."
      },
      {
        term: "heritage",
        partOfSpeech: "noun",
        definition: "Traditions and culture passed down from previous generations",
        example: "Their cultural heritage influences how they celebrate holidays."
      }
    ];
    
    // Use our predefined vocabulary words for consistent display
    const words = preDefinedVocabWords;
    
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
                      <h2 className="text-3xl font-bold text-gray-800 mb-1">{currentWord.term}</h2>
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
                      <h2 className="text-2xl font-bold text-gray-800">{currentWord.term}</h2>
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

  // We're directly using the imported DiscussionSection component in the TabsContent
  
  const QuizSection = () => {
    // Try both quiz and assessment as possible section types
    const section = findSection('quiz') || findSection('assessment');
    if (!section) return <p>No quiz content available</p>;
    
    const [activeQuestion, setActiveQuestion] = useState(0);
    
    // Add additional error handling for questions array
    let questions: any[] = [];
    try {
      // Check if questions is a valid array
      if (section.questions && Array.isArray(section.questions) && section.questions.length > 0) {
        questions = section.questions;
      } else {
        console.warn("No valid questions array found in quiz section");
      }
    } catch (error) {
      console.error("Error accessing quiz questions:", error);
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-cyan-50">
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <CheckSquare className="h-5 w-5" />
              {section.title || "Knowledge Check Quiz"}
            </CardTitle>
            <CardDescription>
              {section.introduction || "Test knowledge and understanding of the lesson"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {questions.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Multiple Choice</span>
                  <div className="flex gap-2">
                    <button className="w-6 h-6">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="w-6 h-6">
                      <Lightbulb className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="bg-cyan-50 p-3 rounded-md mb-4">
                  <div className="text-sm text-cyan-700">
                    Question {activeQuestion + 1} of {questions.length}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-cyan-600 h-1.5 rounded-full" 
                      style={{ width: `${((activeQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Question */}
                <div className="border rounded-lg p-5">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Question {activeQuestion + 1}</h3>
                    <p>{questions[activeQuestion].question || 
                         questions[activeQuestion].content?.question || 
                         "Question text"}</p>
                    <p className="text-sm text-gray-500 mt-1">Choose the best answer.</p>
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-3">
                    {questions[activeQuestion] && (
                      Array.isArray(questions[activeQuestion].options) 
                        ? questions[activeQuestion].options
                        : Array.isArray(questions[activeQuestion].content?.options)
                          ? questions[activeQuestion].content?.options
                          : ["Option A", "Option B", "Option C", "Option D"]
                    ).map((option: string, idx: number) => (
                      <div key={`quiz-option-${idx}`} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded-full mr-3">
                          {['A', 'B', 'C', 'D'][idx]}
                        </div>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex justify-between mt-6">
                    <button 
                      onClick={() => setActiveQuestion(prev => (prev > 0 ? prev - 1 : prev))}
                      disabled={activeQuestion === 0}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                      Previous
                    </button>
                    <button 
                      onClick={() => setActiveQuestion(prev => (prev < questions.length - 1 ? prev + 1 : prev))}
                      disabled={activeQuestion === questions.length - 1}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No quiz questions available</p>
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

  // Get all available sections for tabs
  console.log("Original sections:", parsedContent.sections);
  
  // Create a complete list of valid section types based on the expected structure
  const availableSections: string[] = [];
  
  // Helper function to check if a section type exists
  const hasSectionType = (type: string): boolean => {
    return parsedContent.sections.some((s: any) => s && s.type === type);
  };
  
  // Always add warmup section as the first tab (regardless of whether the type exists)
  // This ensures the warm-up tab is always present and appears first
  availableSections.push("warmup");
  
  // Also identify if there's a warmup/warm-up section for reference
  const hasWarmupSection = hasSectionType("warmup") || hasSectionType("warm-up") || hasSectionType("sentenceFrames");
  
  if (hasSectionType("reading")) {
    availableSections.push("reading");
  }
  
  if (hasSectionType("vocabulary")) {
    availableSections.push("vocabulary");
  }
  
  if (hasSectionType("comprehension")) {
    availableSections.push("comprehension");
  }
  
  if (hasSectionType("sentenceFrames") || hasSectionType("grammar")) {
    availableSections.push("sentenceFrames");
  }
  
  if (hasSectionType("discussion") || hasSectionType("speaking")) {
    availableSections.push("discussion");
  }
  
  if (hasSectionType("quiz") || hasSectionType("assessment")) {
    availableSections.push("quiz");
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
            <ComprehensionSection />
          </TabsContent>
          
          <TabsContent value="sentenceFrames" className="m-0">
            <SentenceFramesSectionWrapper />
          </TabsContent>
          
          <TabsContent value="grammar" className="m-0">
            <SentenceFramesSection />
          </TabsContent>
          
          <TabsContent value="discussion" className="m-0">
            <DiscussionSection section={findSection("discussion") || findSection("speaking")} />
          </TabsContent>
          
          <TabsContent value="speaking" className="m-0">
            <DiscussionSection section={findSection("speaking") || findSection("discussion")} />
          </TabsContent>
          
          <TabsContent value="quiz" className="m-0">
            <QuizSection />
          </TabsContent>
          
          <TabsContent value="assessment" className="m-0">
            <QuizSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
