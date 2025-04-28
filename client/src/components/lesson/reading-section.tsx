import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  SparklesIcon,
} from "lucide-react";
import { SectionHeader } from "./shared/section-header";
import { SectionCard } from "./shared/section-card";

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
    <div className="space-y-4">
      {/* Section header with SectionHeader component */}
      <SectionHeader
        icon={BookOpen}
        title={section?.title || "Reading"}
        description="Read the paragraph(s) below. Use the arrows or dots to navigate between paragraphs."
        color="blue"
      />
      
      <SectionCard
        color="blue"
        noPadding
        headerRight={
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-500">15-20 minutes</span>
          </div>
        }
      >
        {/* Progress indicator */}
        {sectionParagraphs.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between bg-blue-50 border-t border-blue-100">
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
        <div className="p-8 border-t border-blue-100">
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
          <div className="p-6 flex justify-between border-t border-blue-100">
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
      </SectionCard>
    </div>
  );
}