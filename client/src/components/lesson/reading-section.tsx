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

const paragraphs = [
  "Independence Day is perhaps one of the most iconic national holidays celebrated worldwide. In countries like the United States, it marks the birth of a nation and is commemorated with grand festivities. Fireworks explode across the sky, families gather for barbecues, and cities host elaborate parades. These activities not only entertain but also reinforce a sense of unity and patriotism among citizens. Have you ever wondered why such rituals hold so much significance? It's because they connect us to our past and remind us of the struggles that shaped our present.",
  
  "New Year's Eve is another holiday steeped in tradition and festivity. While different cultures may celebrate it at different times, the core concept remains the same: bidding farewell to the old year and welcoming the new one with hope and optimism. From New York's Times Square ball drop to the colorful lantern festivals in Asia, people worldwide engage in rituals that symbolize letting go of the past and embracing new beginnings. These celebrations often involve fireworks, special meals, and spending time with loved ones—all practices that strengthen community bonds and provide a sense of continuity amid life's changes.",
  
  "Religious festivals also play a crucial role in shaping national identity. Diwali, Eid al-Fitr, and Christmas are just a few examples of holidays that transcend individual faiths to become part of broader cultural landscapes. During Diwali, homes are adorned with lights, and families exchange gifts as a way to honor their heritage. Similarly, Eid al-Fitr marks the end of Ramadan with prayers, feasts, and charitable acts. These celebrations foster a spirit of inclusivity and mutual respect, reminding us of the importance of understanding diverse traditions.",
  
  "While national holidays often evoke joy and excitement, they can also serve as opportunities for reflection and remembrance. Martin Luther King Jr. Day in the United States, for instance, commemorates not only the life of a great civil rights leader but also prompts citizens to reflect on the ongoing struggle for equality and justice. By designating specific days for such contemplation, societies acknowledge both their achievements and the work that still lies ahead. These moments of collective reflection are essential for fostering a sense of responsibility toward building a better future.",
  
  "In our increasingly globalized world, national holidays continue to evolve while maintaining their core purpose: bringing people together. They provide a shared vocabulary of symbols, rituals, and experiences that help define what it means to belong to a particular community or nation. Whether through the solemn commemoration of historical events or joyous celebrations of cultural heritage, these special days remind us of our interconnectedness and the values we hold dear. By participating in these traditions, we not only honor our past but also actively shape the cultural narrative for future generations."
];

interface ReadingSectionProps {
  section?: any;
}

export function ReadingSection({ section }: ReadingSectionProps) {
  const [activeParagraph, setActiveParagraph] = useState(0);
  
  // Calculate completion percentage
  const completionPercentage = Math.round(((activeParagraph + 1) / paragraphs.length) * 100);
  
  return (
    <div className="space-y-6">
      {/* Section header with icon */}
      <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-blue-600 font-medium text-lg">Reading</h2>
          <p className="text-gray-600 text-sm">Read and analyze the text with guided support</p>
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
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <BookmarkIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{section?.title || "National Holidays"}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>15-20 minutes</span>
              </div>
              <div className="flex items-center">
                <InfoIcon className="h-4 w-4 mr-1" />
                <span>Adapted for clarity</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center text-blue-600">
            <SparklesIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Paragraph {activeParagraph + 1} of {paragraphs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{completionPercentage}% Complete</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Reading content */}
        <div className="p-6 border-t">
          <div className="leading-relaxed text-gray-800 text-xl">
            {paragraphs[activeParagraph]}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="p-4 flex justify-between border-t">
          <button
            onClick={() => setActiveParagraph(prev => Math.max(0, prev - 1))}
            disabled={activeParagraph === 0}
            className="px-4 py-2 border border-blue-200 rounded-md text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-blue-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          {/* Pagination dots */}
          <div className="flex items-center gap-1">
            {paragraphs.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveParagraph(idx)}
                className={`w-2 h-2 rounded-full ${
                  idx === activeParagraph ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`Go to paragraph ${idx + 1}`}
              ></button>
            ))}
          </div>
          
          <button
            onClick={() => setActiveParagraph(prev => Math.min(paragraphs.length - 1, prev + 1))}
            disabled={activeParagraph === paragraphs.length - 1}
            className="px-4 py-2 border border-blue-200 rounded-md text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-blue-600"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      
      {/* Teacher notes */}
      {section?.teacherNotes && (
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
}