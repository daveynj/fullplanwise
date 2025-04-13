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
import React, { useState } from "react";

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
  console.log("[SentenceFramesSection] Received section prop:", JSON.stringify(section, null, 2));
  
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
      key.toLowerCase().includes("sentence frames") ||
      key.toLowerCase() === "frames"
    );
    
    console.log("Looking for SentenceFrames keys in section:", sentenceFramesKeys);
    
    // If we found any SentenceFrames keys, try to extract the frames from them
    if (sentenceFramesKeys.length > 0) {
      for (const key of sentenceFramesKeys) {
        const value = section[key];
        console.log(`Found SentenceFrames key: ${key}, with value type:`, typeof value);
        
        if (Array.isArray(value)) {
          console.log("SentenceFrames value is an array, adding to frames");
          // --- BEGIN EDIT: Map frames to ensure 'level' property exists ---
          const mappedFrames = value.map((frame: any) => ({
            ...frame,
            title: frame.title || "Sentence Frame", // Ensure title exists
            level: (frame.level || frame.difficultyLevel || "intermediate") as "basic" | "intermediate" | "advanced",
            examples: Array.isArray(frame.examples) ? frame.examples : [frame.examples].filter(Boolean), // Ensure examples is array
            pattern: frame.pattern || "[Missing Pattern]", // Ensure pattern exists
            // Map other potential field name differences if needed (e.g., usageNotes -> usage)
            usage: frame.usage || frame.usageNotes,
            teachingTips: frame.teachingTips,
            grammarFocus: frame.grammarFocus || frame.focus, 
            communicativeFunction: frame.communicativeFunction
          }));
          frames.push(...mappedFrames);
          // --- END EDIT ---
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
                  level: (propValue.level || propValue.difficultyLevel || "intermediate") as "basic" | "intermediate" | "advanced",
                  pattern: propValue.pattern,
                  examples: Array.isArray(propValue.examples) ? propValue.examples : [propValue.examples],
                  usage: propValue.usage || propValue.usageNotes,
                  grammarFocus: propValue.grammarFocus || propValue.focus,
                  communicativeFunction: propValue.communicativeFunction,
                  teachingTips: propValue.teachingTips
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
        // --- BEGIN EDIT: Map frames ---
        const mappedFrames = section.sentenceFrames.map((frame: any) => ({
          ...frame,
          title: frame.title || "Sentence Frame",
          level: (frame.level || frame.difficultyLevel || "intermediate") as "basic" | "intermediate" | "advanced",
          examples: Array.isArray(frame.examples) ? frame.examples : [frame.examples].filter(Boolean),
          pattern: frame.pattern || "[Missing Pattern]",
          usage: frame.usage || frame.usageNotes,
          teachingTips: frame.teachingTips,
          grammarFocus: frame.grammarFocus || frame.focus, 
          communicativeFunction: frame.communicativeFunction
        }));
        frames.push(...mappedFrames);
        // --- END EDIT ---
      } 
      // Look for a 'patterns' or 'frames' property
      else if (section.patterns && Array.isArray(section.patterns)) {
        console.log("Found patterns array");
        // --- BEGIN EDIT: Map frames ---
        const mappedFrames = section.patterns.map((frame: any) => ({
          ...frame,
          title: frame.title || "Sentence Frame",
          level: (frame.level || frame.difficultyLevel || "intermediate") as "basic" | "intermediate" | "advanced",
          examples: Array.isArray(frame.examples) ? frame.examples : [frame.examples].filter(Boolean),
          pattern: frame.pattern || "[Missing Pattern]",
          usage: frame.usage || frame.usageNotes,
          teachingTips: frame.teachingTips,
          grammarFocus: frame.grammarFocus || frame.focus, 
          communicativeFunction: frame.communicativeFunction
        }));
        frames.push(...mappedFrames);
        // --- END EDIT ---
      } 
      else if (section.frames && Array.isArray(section.frames)) {
        console.log("Found frames array");
        // --- BEGIN EDIT: Map frames ---
        const mappedFrames = section.frames.map((frame: any) => ({
          ...frame,
          title: frame.title || "Sentence Frame",
          level: (frame.level || frame.difficultyLevel || "intermediate") as "basic" | "intermediate" | "advanced",
          examples: Array.isArray(frame.examples) ? frame.examples : [frame.examples].filter(Boolean),
          pattern: frame.pattern || "[Missing Pattern]",
          usage: frame.usage || frame.usageNotes,
          teachingTips: frame.teachingTips,
          grammarFocus: frame.grammarFocus || frame.focus, 
          communicativeFunction: frame.communicativeFunction
        }));
        frames.push(...mappedFrames);
        // --- END EDIT ---
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
        
        // Get the raw section data to analyze and log it
        console.log("Keys in section:", Object.keys(section));
        
        // If we still don't have any frames, create a fallback message
        if (frames.length === 0) {
          console.log("No sentence frames found in the API response, notifying user");
          
          // We won't push any hardcoded examples anymore
          // Let the teacher know there were no frames in this lesson
          console.log("No sentence frames were found in this lesson content");
        }
      }
    }
    
    // Log what we've created
    console.log("Created sentence frames for vocabulary words:", vocabList);
  } catch (error) {
    console.error("Error extracting sentence frames:", error);
  }

  // Render a different UI based on whether we found any frames
  const renderFrames = () => {
    // --- BEGIN EDIT: Log frames array before filtering ---
    console.log("[SentenceFramesSection renderFrames] Frames array before filtering:", JSON.stringify(frames, null, 2));
    // --- END EDIT ---
    if (frames.length === 0) {
      return (
        <div className="bg-amber-50 p-6 rounded-lg text-center border border-amber-200">
          <div className="text-amber-600 mb-2">No sentence frames available for this lesson</div>
          <p className="text-gray-600 text-sm">
            You can manually add sentence frames or select a different lesson.
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Frames by Level */}
        {['basic', 'intermediate', 'advanced'].map(level => {
          const levelFrames = frames.filter(frame => frame.level === level);
          if (levelFrames.length === 0) return null;
          
          return (
            <React.Fragment key={level}>
              <h3 className="text-amber-700 font-medium flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  level === 'basic' ? 'bg-green-500' : 
                  level === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                {level.charAt(0).toUpperCase() + level.slice(1)} Frames
              </h3>
              
              {/* Sentence Frame Cards for this level */}
              <div className="space-y-4 mb-6">
                {levelFrames.map((frame, idx) => {
                  const frameKey = `${level}-frame-${idx}`;
                  return (
                    <div 
                      key={frameKey} 
                      className="bg-amber-50 rounded-lg overflow-hidden border border-amber-100"
                    >
                      {/* Frame header */}
                      <div className="bg-amber-100 px-4 py-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className={`rounded px-2 py-0.5 ${
                            frame.level === 'basic' ? 'bg-green-100 text-green-800' : 
                            frame.level === 'intermediate' ? 'bg-amber-200 text-amber-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            <span className="font-medium text-sm">{frame.level}</span>
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
                        
                        {/* Description section at the top with both function and usage */}
                        <div className="text-amber-800 text-sm">
                          {frame.communicativeFunction && (
                            <div className="italic mb-1">{frame.communicativeFunction}</div>
                          )}
                          {frame.usage && (
                            <div>{frame.usage}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Pattern with highlighted blanks */}
                      <div className="p-4">
                        <div className="font-mono p-3 bg-white rounded-md border border-amber-200 text-gray-800 relative">
                          {/* Parse and highlight blanks in the pattern */}
                          {frame.pattern.split('_____').map((part, i, array) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < array.length - 1 && (
                                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 whitespace-nowrap">
                                  _____
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                          <button 
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                              navigator.clipboard.writeText(frame.pattern);
                              // Could add a toast notification here
                            }}
                          >
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
                                <div key={`example-${eIdx}`} className="bg-white p-3 rounded-md border border-amber-100 text-gray-800 font-medium">
                                  {example}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Grammar Focus */}
                          {frame.grammarFocus && (
                            <div>
                              <div className="mb-2 flex items-center gap-1 text-amber-800">
                                <Lightbulb className="h-4 w-4" />
                                <span className="text-sm font-medium">Grammar Focus</span>
                              </div>
                              <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-800 font-medium">
                                {frame.grammarFocus}
                              </div>
                            </div>
                          )}
                          
                          {/* Teaching Tips */}
                          {frame.teachingTips && (
                            <div>
                              <div className="mb-2 flex items-center gap-1 text-amber-800">
                                <GraduationCap className="h-4 w-4" />
                                <span className="text-sm font-medium">Teaching Tips</span>
                              </div>
                              <div className="bg-white p-3 rounded-md border border-amber-100 text-gray-800 font-medium">
                                {frame.teachingTips}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </>
    );
  };

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
      
      {/* Sentence Frames Content */}
      {renderFrames()}
      
      {/* Teacher notes */}
      {section.teacherNotes && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-blue-700">Teacher Notes</span>
          </div>
          <p className="text-sm text-gray-800 font-medium">{section.teacherNotes}</p>
        </div>
      )}
    </div>
  );
}