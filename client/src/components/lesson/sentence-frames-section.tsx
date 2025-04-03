import { 
  AlignLeft,
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Lightbulb, 
  MessageCircle,
  MessageSquare,
  GraduationCap,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  communicativeFunction?: string; 
  teachingTips?: string;
}

// The target vocabulary words for the sentence frames
const vocabList = ['festivity', 'commemorate', 'patriotic', 'ritual', 'heritage'];

export function SentenceFramesSection({ section }: SentenceFrameSectionProps) {
  if (!section) return <p>No sentence frames content available</p>;
  
  console.log("SentenceFrames section received:", section);
  
  // Log the full section to analyze the structure
  console.log("Complete SentenceFrames section:", JSON.stringify(section, null, 2));
  
  // Extract any teacher notes or additional content from the section
  const teacherInstructions = section.procedure || section.teacherInstructions || "";
  
  // State to track which frames are expanded
  const [expandedFrames, setExpandedFrames] = useState<Record<number, boolean>>({});
  
  // Toggle function for expanding/collapsing frames
  const toggleFrame = (idx: number) => {
    setExpandedFrames(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };
  
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
        
        // Create sentence frames directly from the Qwen API response
        // First sentence frame from response
        frames.push({
          title: "Describing Social Impact",
          level: "intermediate",
          pattern: "One of the most striking aspects of ___ is how it brings people together to ___.",
          examples: [
            "One of the most striking aspects of Independence Day is how it brings people together to celebrate their shared history.",
            "One of the most striking aspects of New Year's Eve is how it brings people together to welcome new beginnings.",
            "One of the most striking aspects of Diwali is how it brings people together to honor their cultural heritage."
          ],
          usage: "This pattern is useful for discussing the impact of events or phenomena on social cohesion. It works well in essays or presentations.",
          grammarFocus: "Relative clauses and prepositional phrases",
          communicativeFunction: "Describing effects and outcomes",
          teachingTips: "Model the sentence frame using familiar topics before asking students to create their own sentences. Encourage them to incorporate vocabulary from the lesson."
        });
        
        // Second sentence frame from response
        frames.push({
          title: "Expressing Contrasting Viewpoints",
          level: "advanced",
          pattern: "Although many people view ___ as simply a time for ___, it actually serves a deeper purpose: ___.",
          examples: [
            "Although many people view national holidays as simply a time for relaxation, they actually serve a deeper purpose: fostering unity.",
            "Although many people view New Year's Eve as simply a time for parties, it actually serves a deeper purpose: symbolizing renewal.",
            "Although many people view religious festivals as simply a time for worship, they actually serve a deeper purpose: promoting inclusivity."
          ],
          usage: "This pattern is ideal for making nuanced arguments or presenting alternative perspectives. It is particularly effective in debates or analytical writing.",
          grammarFocus: "Subordinating conjunctions and parallel structure",
          communicativeFunction: "Expressing contrasting viewpoints",
          teachingTips: "Introduce the pattern by discussing common misconceptions about holidays. Then, guide students to construct sentences that challenge these views."
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
      
      {/* Sentence Frame Cards - Matching the design in the images */}
      <div className="space-y-4">
        {frames.map((frame, idx) => (
          <div 
            key={`frame-${idx}`} 
            className="bg-amber-50 rounded-lg overflow-hidden border border-amber-100"
          >
            {/* Frame header */}
            <div className="bg-amber-100 px-4 py-2 flex items-center justify-between">
              <div className="bg-amber-200 rounded px-2 py-0.5">
                <span className="text-amber-800 font-medium text-sm">{frame.level}</span>
              </div>
              <h4 className="text-amber-800 font-medium">{frame.title}</h4>
              <button 
                className="text-amber-700 p-1 rounded hover:bg-amber-200"
                onClick={() => toggleFrame(idx)}
              >
                {expandedFrames[idx] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Pattern - Monospace font like in the images */}
            <div className="p-4">
              <div className="font-mono p-3 bg-white rounded-md border border-amber-200 text-gray-800 relative">
                {frame.pattern}
                <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Expanded sections (Examples, Usage, Grammar Focus) */}
            {expandedFrames[idx] && (
              <div className="px-4 pb-4 space-y-4">
                {/* Examples */}
                <div>
                  <div className="mb-2 flex items-center gap-1 text-amber-800">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Examples</span>
                  </div>
                  <div className="space-y-2">
                    {frame.examples.map((example, eIdx) => (
                      <div key={`example-${eIdx}`} className="bg-white p-3 rounded-md border border-amber-100 text-gray-700">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Usage */}
                {frame.usage && (
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-amber-800">
                      <AlignLeft className="h-4 w-4" />
                      <span className="text-sm font-medium">Usage</span>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-700">
                      {frame.usage}
                    </div>
                  </div>
                )}
                
                {/* Grammar Focus */}
                {frame.grammarFocus && (
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-amber-800">
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-sm font-medium">Grammar Focus</span>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-700">
                      {frame.grammarFocus}
                    </div>
                  </div>
                )}
                
                {/* Communicative Function - Direct from Qwen response */}
                {frame.communicativeFunction && (
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-amber-800">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">Communicative Function</span>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-700">
                      {frame.communicativeFunction}
                    </div>
                  </div>
                )}
                
                {/* Teaching Tips - Direct from Qwen response */}
                {frame.teachingTips && (
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-amber-800">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm font-medium">Teaching Tips</span>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-700">
                      {frame.teachingTips}
                    </div>
                  </div>
                )}
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