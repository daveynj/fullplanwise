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
  
  // Extract frames from the section data
  let frames: SentenceFrame[] = [];
  
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
      const framesArray: SentenceFrame[] = [];
      for (const key in section.frames) {
        if (typeof section.frames[key] === 'object') {
          framesArray.push({
            title: key,
            level: section.frames[key].level || "intermediate",
            pattern: section.frames[key].pattern || key,
            examples: Array.isArray(section.frames[key].examples) 
              ? section.frames[key].examples 
              : [section.frames[key].examples || ""],
            usage: section.frames[key].usage,
            grammarFocus: section.frames[key].grammarFocus
          });
        }
      }
      frames = framesArray;
    } else if (section.examples) {
      // Try to handle examples in different formats
      if (Array.isArray(section.examples)) {
        frames = [{ 
          title: "Example Patterns",
          level: "intermediate",
          pattern: section.examples.join("\n"), 
          examples: section.examples
        }];
      } else if (typeof section.examples === 'string') {
        frames = [{ 
          title: "Example Pattern",
          level: "intermediate",
          pattern: section.examples, 
          examples: [section.examples]
        }];
      } else if (typeof section.examples === 'object') {
        // Handle case where examples is an object
        const examplesArray = [];
        for (const key in section.examples) {
          if (typeof section.examples[key] === 'string') {
            examplesArray.push(section.examples[key]);
          }
        }
        frames = [{ 
          title: "Example Patterns",
          level: "intermediate",
          pattern: "Example sentences", 
          examples: examplesArray
        }];
      }
    } else if (section.content && typeof section.content === 'string') {
      // Try to extract from content string if it contains patterns
      const contentLines = section.content.split('\n');
      const extractedFrames: SentenceFrame[] = [];
      let currentFrame: Partial<SentenceFrame> = { 
        title: "Extracted Pattern",
        level: "intermediate", 
        examples: [] 
      };
      
      for (const line of contentLines) {
        if (line.includes("Pattern:") || line.includes("Frame:")) {
          // If we found a new pattern and already have one, save the current and start a new one
          if (currentFrame.pattern) {
            extractedFrames.push(currentFrame as SentenceFrame);
            currentFrame = { 
              title: "Extracted Pattern",
              level: "intermediate", 
              examples: [] 
            };
          }
          currentFrame.pattern = line.split(":")[1]?.trim() || line;
        } else if (line.includes("Example:") || line.startsWith("- ")) {
          // Add to examples for the current pattern
          const example = line.replace(/^- |Example: ?/i, '').trim();
          if (example && currentFrame.examples) {
            currentFrame.examples.push(example);
          }
        } else if (line.includes("Difficulty:") || line.includes("Level:")) {
          currentFrame.level = line.split(":")[1]?.trim().toLowerCase() as "basic" | "intermediate" | "advanced" || "intermediate";
        } else if (line.includes("Usage:")) {
          currentFrame.usage = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Grammar:") || line.includes("Focus:")) {
          currentFrame.grammarFocus = line.split(":")[1]?.trim() || "";
        }
      }
      
      // Add the last frame if it has a pattern
      if (currentFrame.pattern && currentFrame.examples?.length) {
        extractedFrames.push(currentFrame as SentenceFrame);
      }
      
      if (extractedFrames.length > 0) {
        frames = extractedFrames;
      }
    }
    
    // If we still don't have any frames, use targetVocabulary to create some
    if (frames.length === 0 && section.targetVocabulary) {
      let targetVocabulary: string[] = [];
      if (Array.isArray(section.targetVocabulary)) {
        targetVocabulary = section.targetVocabulary;
      } else if (typeof section.targetVocabulary === 'string') {
        targetVocabulary = [section.targetVocabulary];
      } else if (typeof section.targetVocabulary === 'object') {
        // Extract keys from targetVocabulary object
        targetVocabulary = Object.keys(section.targetVocabulary);
      }
      
      if (targetVocabulary.length > 0) {
        // Create frames using the vocabulary words
        const firstWord = targetVocabulary[0] || '___';
        const secondWord = targetVocabulary.length > 1 ? targetVocabulary[1] : '___';
        
        frames = [
          {
            title: "Using target vocabulary",
            level: "intermediate",
            pattern: `I think ${firstWord} is important because _____, and it also helps people to _____.`,
            examples: [
              `I think ${firstWord} is important because it brings communities together, and it also helps people to celebrate their heritage.`,
            ]
          },
          {
            title: "More advanced structure",
            level: "advanced",
            pattern: `Despite [subject] [verb], [subject] [verb] ${secondWord}.`,
            examples: [
              `Despite the changes in how we celebrate, many traditions remain ${secondWord}.`
            ]
          }
        ];
      }
    }
  } catch (error) {
    console.error("Error processing sentence frames:", error);
  }
  
  // If we still have no frames, provide an informative message
  if (frames.length === 0) {
    frames = [
      {
        title: "No frames found",
        level: "intermediate",
        pattern: "No sentence frames were found in the content. Please check the API response.",
        examples: ["Sample sentence that would go here."]
      }
    ];
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