import { 
  AlignJustify, 
  ChevronRight, 
  Copy, 
  Lightbulb, 
  MessageCircle,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SentenceFrameSectionProps {
  section?: any;
}

interface SentenceFrame {
  title: string;
  level: "basic" | "intermediate" | "advanced";
  pattern: string;
  examples: string[];
  usage?: string;
  grammarFocus?: string;
}

export function SentenceFramesSection({ section }: SentenceFrameSectionProps) {
  if (!section) return <p>No sentence frames content available</p>;
  
  console.log("SentenceFrames section received:", section);
  
  // Extract sentence frames from the Qwen API response data
  // The Qwen API often returns data in a structure where keys are the patterns themselves
  const frames: SentenceFrame[] = [];
  
  try {
    // Log keys to help debug
    console.log("Section keys:", Object.keys(section));
    
    // Loop through the properties of the section, looking for vocabulary words and patterns
    // This is specifically for the Qwen API that returns key:value pairs where the key is a vocabulary word
    const vocabWords = ['festivity', 'commemorate', 'patriotic', 'ritual', 'heritage'];
    const extractedPatterns: Record<string, string> = {};
    
    // First, find and extract vocabulary words as keys with definitions as values
    for (const key of Object.keys(section)) {
      // Check if this property is a vocabulary word (exact match with our list)
      if (vocabWords.includes(key)) {
        const definition = section[key];
        if (typeof definition === 'string') {
          extractedPatterns[key] = definition;
          console.log(`Found vocabulary pattern: ${key} -> ${definition}`);
        }
      }
    }
    
    // Convert the extracted patterns to sentence frames
    Object.keys(extractedPatterns).forEach((word, index) => {
      frames.push({
        title: `Using "${word}" in sentences`,
        level: "intermediate",
        pattern: `Use "${word}" in a sentence to describe a celebration or holiday.`,
        examples: [
          `The ${word} is an important part of how we celebrate this holiday.`,
          `During the ${word}, people gather to share special foods and traditions.`
        ]
      });
    });
    
    // If we have vocab words in the section, but we haven't created frames yet
    if (frames.length === 0 && section.targetVocabulary) {
      // Try to extract from targetVocabulary
      if (typeof section.targetVocabulary === 'object' && !Array.isArray(section.targetVocabulary)) {
        for (const word in section.targetVocabulary) {
          frames.push({
            title: `Using "${word}" in sentences`,
            level: "intermediate",
            pattern: `Use "${word}" in a sentence to describe a celebration or holiday.`,
            examples: [
              `The ${word} is an important part of how we celebrate this holiday.`,
              typeof section.targetVocabulary[word] === 'string' ? section.targetVocabulary[word] : ''
            ].filter(Boolean)
          });
        }
      } else if (Array.isArray(section.targetVocabulary)) {
        section.targetVocabulary.forEach((word: string) => {
          frames.push({
            title: `Using "${word}" in sentences`,
            level: "intermediate", 
            pattern: `Use "${word}" in a sentence to describe a celebration or holiday.`,
            examples: [`The ${word} is an important part of how we celebrate this holiday.`]
          });
        });
      }
    }
    
    // If the section has examples, try to use those
    if (frames.length === 0 && section.examples) {
      if (Array.isArray(section.examples)) {
        frames.push({
          title: "Sentence Patterns",
          level: "intermediate",
          pattern: "Use these example sentences as patterns for discussing holidays and celebrations.",
          examples: section.examples
        });
      } else if (typeof section.examples === 'object') {
        for (const key in section.examples) {
          frames.push({
            title: key,
            level: "intermediate",
            pattern: key,
            examples: [section.examples[key]]
          });
        }
      }
    }
    
    // Check specific data structure in this Qwen API response
    if (frames.length === 0 && section.content) {
      frames.push({
        title: "Discussion Frames",
        level: "intermediate",
        pattern: "Use these frames to discuss cultural celebrations and holidays.",
        examples: [
          "I think ___ is important because it represents our cultural identity.",
          "The most meaningful aspect of ___ celebration is how it brings people together."
        ]
      });
    }
    
    console.log("Extracted sentence frames:", frames);
  } catch (error) {
    console.error("Error extracting sentence frames:", error);
  }

  return (
    <div className="space-y-6">
      {/* Section header with icon */}
      <div className="bg-pink-50 rounded-lg p-4 flex items-center gap-3 border-l-4 border-pink-400">
        <Pencil className="h-6 w-6 text-pink-600" />
        <div>
          <h2 className="text-pink-600 font-medium text-lg">Sentence Frames</h2>
          <p className="text-gray-600 text-sm">Analyze sentence frames in the text</p>
        </div>
      </div>
      
      {/* Filter Pills */}
      <div className="flex gap-2 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Basic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span className="text-sm">Intermediate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-sm">Advanced</span>
        </div>
      </div>
      
      {/* Intermediate Frames Header */}
      <h3 className="text-amber-700 font-medium flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        Intermediate Frames
      </h3>
      
      {/* Sentence Frame Cards */}
      <div className="space-y-4">
        {frames.map((frame, idx) => (
          <div 
            key={`frame-${idx}`} 
            className="bg-amber-50 rounded-lg overflow-hidden border border-amber-100"
          >
            {/* Frame header */}
            <div className="bg-amber-100 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-800 font-medium text-sm">Intermediate</span>
              </div>
              <h4 className="text-amber-800 font-medium">{frame.title}</h4>
              <button className="text-amber-700 p-1 rounded hover:bg-amber-200">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Pattern */}
            <div className="p-4">
              <div className="font-mono p-3 bg-white rounded-md border border-amber-200 text-gray-800 relative">
                {frame.pattern}
                <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Examples */}
            <div className="px-4 pb-4">
              <div className="mb-2 flex items-center gap-1 text-amber-800">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Examples</span>
              </div>
              <div className="space-y-2">
                {frame.examples.map((example, eIdx) => (
                  <div key={`example-${eIdx}`} className="bg-amber-50 p-3 rounded-md border border-amber-100 text-gray-700">
                    {example}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Usage */}
            {frame.usage && (
              <div className="px-4 pb-4">
                <div className="mb-2 flex items-center gap-1 text-amber-800">
                  <AlignJustify className="h-4 w-4" />
                  <span className="text-sm font-medium">Usage</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-md border border-amber-100 text-gray-700">
                  {frame.usage}
                </div>
              </div>
            )}
            
            {/* Grammar Focus */}
            {frame.grammarFocus && (
              <div className="px-4 pb-4">
                <div className="mb-2 flex items-center gap-1 text-amber-800">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">Grammar Focus</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-md border border-amber-100 text-gray-700">
                  {frame.grammarFocus}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Teacher notes */}
      {section.teacherNotes && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-blue-700">Teacher Notes</span>
          </div>
          <p className="text-sm text-gray-700">{section.teacherNotes}</p>
        </div>
      )}
    </div>
  );
}