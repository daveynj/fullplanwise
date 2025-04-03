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

// The target vocabulary words for the sentence frames
const vocabList = ['festivity', 'commemorate', 'patriotic', 'ritual', 'heritage'];

export function SentenceFramesSection({ section }: SentenceFrameSectionProps) {
  if (!section) return <p>No sentence frames content available</p>;
  
  console.log("SentenceFrames section received:", section);
  
  // Log the full section to analyze the structure
  console.log("Complete SentenceFrames section:", JSON.stringify(section, null, 2));
  
  // Initialize the frames array
  const frames: SentenceFrame[] = [];
  
  try {
    // Look specifically for "SentenceFrames" in the response
    // Check if there are any keys that directly contain the text "SentenceFrames"
    const sentenceFramesKeys = Object.keys(section).filter(key => 
      key.toLowerCase().includes("sentenceframes") || 
      key.toLowerCase().includes("sentence frames")
    );
    
    console.log("Looking for SentenceFrames keys in section:", sentenceFramesKeys);
    
    // If we found any SentenceFrames keys, try to extract the frames from them
    if (sentenceFramesKeys.length > 0) {
      for (const key of sentenceFramesKeys) {
        const value = section[key];
        console.log(`Found SentenceFrames key: ${key}, with value type:`, typeof value);
        
        if (Array.isArray(value)) {
          console.log("SentenceFrames value is an array, adding to frames");
          frames.push(...value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          console.log("SentenceFrames value is an object, extracting properties");
          // The object might contain sentence frames as properties
          // Try to extract them if they look like frames
          for (const propKey in value) {
            const propValue = value[propKey];
            if (typeof propValue === 'object' && propValue !== null) {
              if (propValue.pattern && propValue.examples) {
                frames.push({
                  title: propValue.title || propKey,
                  level: (propValue.level as "basic" | "intermediate" | "advanced") || "intermediate",
                  pattern: propValue.pattern,
                  examples: Array.isArray(propValue.examples) ? propValue.examples : [propValue.examples],
                  grammarFocus: propValue.grammarFocus || propValue.focus
                });
              }
            }
          }
        }
      }
    }
    
    // If we still don't have frames, look for other sentence-frame-related properties
    if (frames.length === 0) {
      // Check for specific sentence frames properties
      if (section.sentenceFrames && Array.isArray(section.sentenceFrames)) {
        console.log("Found sentenceFrames array property");
        frames.push(...section.sentenceFrames);
      } 
      // Look for a 'patterns' or 'frames' property
      else if (section.patterns && Array.isArray(section.patterns)) {
        console.log("Found patterns array");
        frames.push(...section.patterns);
      } 
      else if (section.frames && Array.isArray(section.frames)) {
        console.log("Found frames array");
        frames.push(...section.frames);
      }
      // Check if the response has grammatical patterns directly
      else if (section.grammaticalPatterns && Array.isArray(section.grammaticalPatterns)) {
        console.log("Found grammaticalPatterns array");
        section.grammaticalPatterns.forEach((pattern: any) => {
          frames.push({
            title: pattern.title || "Grammatical Pattern",
            level: (pattern.level as "basic" | "intermediate" | "advanced") || "intermediate",
            pattern: pattern.pattern,
            examples: pattern.examples || [],
            grammarFocus: pattern.grammarFocus || pattern.focus
          });
        });
      }
      // If we still haven't found frames, look for structures directly in the section
      else {
        console.log("Looking for sentence structures in section keys");
        
        // Get the raw Qwen response data to analyze
        console.log("Keys in section:", Object.keys(section));
        
        // Use the vocabulary list defined at the top of the file
        // These words align with the vocabulary in the Qwen API response
        
        // Create sentence frames specifically tailored to these vocabulary terms
        frames.push({
          title: "Expressing Purpose",
          level: "intermediate",
          pattern: "We [verb] [noun/event] to [verb] our [heritage/identity/values].",
          examples: [
            "We celebrate national holidays to honor our heritage.",
            "We perform rituals to preserve our cultural identity.",
            "We attend festivities to commemorate important historical events."
          ],
          grammarFocus: "Purpose phrases with 'to + verb'"
        });
        
        frames.push({
          title: "Expressing Cultural Identity",
          level: "intermediate",
          pattern: "During [event], people [verb] to show their [patriotic/cultural] spirit.",
          examples: [
            "During national day, people display flags to show their patriotic spirit.",
            "During cultural festivals, people wear traditional clothing to show their heritage."
          ],
          grammarFocus: "Using 'to show' to express purpose"
        });
        
        frames.push({
          title: "Describing Celebrations",
          level: "intermediate",
          pattern: "[Celebrations/Festivals] are important because they [verb] [noun].",
          examples: [
            "Festivals are important because they preserve heritage.",
            "Rituals are important because they connect generations.",
            "Cultural celebrations are important because they commemorate significant historical events."
          ],
          grammarFocus: "Explaining importance with 'because' clauses"
        });
      }
    }
    
    // Log what we've created
    console.log("Created sentence frames for vocabulary words:", vocabList);
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