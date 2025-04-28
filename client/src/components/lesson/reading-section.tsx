import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  Sparkles as SparklesIcon,
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReadingSectionProps {
  section?: any;
}

export function ReadingSection({ section }: ReadingSectionProps) {
  const [activeParagraph, setActiveParagraph] = useState(0);
  
  // Extract paragraphs from the section
  let sectionParagraphs: string[] = [];
  
  if (section?.paragraphs && Array.isArray(section.paragraphs)) {
    sectionParagraphs = section.paragraphs;
  } else if (section?.content) {
    sectionParagraphs = [section.content];
  } else if (section?.introduction) {
    sectionParagraphs = [section.introduction];
  }
  
  console.log("Reading section paragraphs:", sectionParagraphs);
  
  // Calculate completion percentage
  const completionPercentage = sectionParagraphs.length > 0 
    ? Math.round(((activeParagraph + 1) / sectionParagraphs.length) * 100)
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Section header with icon */}
      <div className="bg-blue-50 rounded-lg p-6 flex items-center gap-4">
        <BookOpen className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-blue-600 font-semibold text-2xl">Reading</h2>
          <p className="text-gray-600 text-base">Read and analyze the text with guided support</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Reading header */}
        <div className="bg-blue-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-600">Reading</span>
          </div>
          <span className="text-sm text-gray-500">Estimated time: 15-20 minutes</span>
        </div>
        
        {/* Reading title */}
        <div className="p-6 border-b flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BookmarkIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-2xl">{section?.title || "Reading Text"}</h3>
            <div className="flex items-center gap-4 text-base text-gray-500 mt-2">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>15-20 minutes</span>
              </div>
              <div className="flex items-center">
                <InfoIcon className="h-5 w-5 mr-2" />
                <span>Adapted for clarity</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Removed fixed introduction - first paragraph will serve as introduction */}
        
        {/* Progress indicator */}
        {sectionParagraphs.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between bg-blue-50">
            <div className="flex items-center text-blue-600">
              <SparklesIcon className="h-5 w-5 mr-2" />
              <span className="text-base font-medium">Paragraph {activeParagraph + 1} of {sectionParagraphs.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-medium text-blue-600">{completionPercentage}% Complete</span>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reading content */}
        <div className="p-8 border-t">
          {sectionParagraphs.length > 0 ? (
            <div className="leading-relaxed text-xl font-bold text-gray-900 tracking-wide max-w-[1600px] mx-auto">
              {sectionParagraphs[activeParagraph]}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No reading content available
            </div>
          )}
        </div>
        
        {/* Navigation */}
        {sectionParagraphs.length > 1 && (
          <div className="p-6 flex justify-between border-t">
            <button
              onClick={() => setActiveParagraph(prev => Math.max(0, prev - 1))}
              disabled={activeParagraph === 0}
              className="px-6 py-3 border border-blue-200 rounded-md text-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50 font-medium"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            
            {/* Pagination dots */}
            <div className="flex items-center gap-2">
              {sectionParagraphs.map((_: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveParagraph(idx)}
                  className={`w-3 h-3 rounded-full ${
                    idx === activeParagraph ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to paragraph ${idx + 1}`}
                ></button>
              ))}
            </div>
            
            <button
              onClick={() => setActiveParagraph(prev => Math.min(sectionParagraphs.length - 1, prev + 1))}
              disabled={activeParagraph === sectionParagraphs.length - 1}
              className="px-6 py-3 border border-blue-200 rounded-md text-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50 font-medium"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        )}
      </div>
      
      {/* Teacher notes have been moved to the notes tab */}
    </div>
  );
}