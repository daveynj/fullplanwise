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
  
  // Define predefined sentence frames based on the template design
  const predefinedFrames: SentenceFrame[] = [
    {
      title: "Expressing and justifying opinions",
      level: "intermediate",
      pattern: "I think _____ is important because _____, and it also helps people to _____.",
      examples: [
        "I think festivals are important because they bring people together, and it also helps people to learn about their culture.",
        "I think celebrations are important because they make us happy, and it also helps people to relax after hard work."
      ],
      usage: "Use this pattern to express opinions about why certain events matter.",
      grammarFocus: "Present simple tense with opinion expressions and causal conjunctions"
    },
    {
      title: "Describing past experiences and emotions",
      level: "intermediate",
      pattern: "When I went to _____, I saw _____, and it made me feel _____.",
      examples: [
        "When I went to the Lunar New Year celebration, I saw traditional dragon dances, and it made me feel excited.",
        "When I went to my friend's wedding ceremony, I saw beautiful decorations, and it made me feel joyful."
      ],
      usage: "Use this pattern to share personal experiences related to celebrations.",
      grammarFocus: "Past simple tense with emotional responses"
    }
  ];
  
  // Use our predefined frames for consistent display
  const frames = predefinedFrames;

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