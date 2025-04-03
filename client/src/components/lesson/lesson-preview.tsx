import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Download, Share, Maximize2 } from "lucide-react";
import { LessonContent } from "./lesson-content";
import { Link } from "wouter";

interface LessonPreviewProps {
  lesson: any;
  onSave: () => void; // Kept for backward compatibility
  savePending: boolean; // Kept for backward compatibility
}

export function LessonPreview({ lesson }: LessonPreviewProps) {
  const [activeTab, setActiveTab] = useState("lesson");
  
  // If no lesson has been generated yet
  if (!lesson) {
    return (
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className="tab-button px-6 py-4 font-semibold text-primary border-b-2 border-primary"
              onClick={() => setActiveTab("lesson")}
            >
              Lesson Preview
            </button>
            <button
              className="tab-button px-6 py-4 font-semibold text-gray-500 hover:text-primary"
              onClick={() => setActiveTab("notes")}
            >
              Teacher Notes
            </button>
            <button
              className="tab-button px-6 py-4 font-semibold text-gray-500 hover:text-primary"
              onClick={() => setActiveTab("slides")}
            >
              Slides
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-10 text-center">
          <div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 text-gray-400">📚</div>
            </div>
            <h3 className="text-xl font-nunito font-bold mb-2">No Lesson Generated Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Fill in the lesson parameters on the left and click "Generate Lesson" to create your AI-powered lesson content.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  // Parse the content if it's a string (from database)
  let parsedContent;
  try {
    if (typeof lesson.content === 'string') {
      try {
        // Try to parse it as JSON
        parsedContent = JSON.parse(lesson.content);
        console.log("Successfully parsed string content");
      } catch (jsonError) {
        console.error("Error parsing JSON string:", jsonError);
        
        // Try to clean up the JSON string and parse again
        try {
          const cleanedContent = lesson.content
            .replace(/```json\s*/g, '')
            .replace(/```\s*$/g, '')
            .trim();
          
          console.log("Attempting to parse cleaned JSON");
          parsedContent = JSON.parse(cleanedContent);
          console.log("Successfully parsed cleaned JSON content");
        } catch (secondJsonError) {
          console.error("Error parsing cleaned JSON:", secondJsonError);
          
          // Try to fix malformed JSON with colons instead of commas
          try {
            console.log("Attempting to fix malformed JSON structure with colons");
            let fixedContent = lesson.content
              .replace(/"([^"]+)":\s*{([^}]+)}:\s*/g, '"$1": {$2},') // Fix objects with trailing colons
              .replace(/},\s*"([^"]+)":\s*{/g, '}, "$1": {') // Fix comma placement between objects
              .replace(/},\s*"([^"]+)":\s*"/g, '}, "$1": "') // Fix comma placement for string values
              .replace(/"\s*,\s*"([^"]+)":/g, '", "$1":') // Fix array-like structures
              .replace(/},\s*}/g, '}}') // Fix nested object closures
              .replace(/],\s*}/g, ']}') // Fix array closures in objects
              .replace(/"\s*:\s*"([^"]+)"\s*:/g, '": "$1",') // Fix object properties misusing colons
              .replace(/},(?!\s*["}])/g, '},'); // Add missing commas after objects
            
            parsedContent = JSON.parse(fixedContent);
            console.log("Successfully parsed fixed JSON structure");
          } catch (fixError) {
            console.error("Failed to fix JSON structure:", fixError);
            
            // If all parsing fails, set a structured error object that will display well in the UI
            parsedContent = { 
              title: lesson.title || "Lesson Preview",
              sections: [
                { 
                  type: 'reading', 
                  title: "Reading",
                  content: "The lesson content couldn't be parsed properly. Please try regenerating the lesson."
                },
                { 
                  type: 'error', 
                  title: "Error Details",
                  content: 'The system encountered an error parsing the lesson JSON. This is likely due to a formatting issue in the API response.' 
                }
              ] 
            };
          }
        }
      }
    } else if (lesson.content && typeof lesson.content === 'object') {
      // It's already an object (from direct API response)
      console.log("Content is already an object, no parsing needed");
      parsedContent = lesson.content;
    } else {
      // Handle the case where content is null, undefined, or an unexpected type
      console.warn("Lesson content is missing or has an unexpected type:", typeof lesson.content);
      parsedContent = { 
        title: lesson.title || "Lesson Preview",
        sections: [{ 
          type: 'error', 
          title: "Error",
          content: 'Lesson content is missing or has an unexpected format.' 
        }] 
      };
    }
    
    console.log("Parsed content:", parsedContent);
  } catch (e) {
    console.error("Unexpected error handling content:", e);
    parsedContent = { 
      title: lesson.title || "Lesson Preview",
      sections: [{ 
        type: 'error', 
        title: "Processing Error",
        content: 'An unexpected error occurred while processing the lesson content.' 
      }] 
    };
  }
  
  // Final validation - ensure we have sections
  if (!parsedContent.sections || !Array.isArray(parsedContent.sections) || parsedContent.sections.length === 0) {
    console.warn("Parsed content has no valid sections, adding fallback error section");
    parsedContent.sections = [{ 
      type: 'error', 
      title: "Content Error",
      content: 'The lesson structure is incomplete or invalid. Please try regenerating the lesson.' 
    }];
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="w-full justify-start px-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="lesson"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Lesson Preview
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Teacher Notes
          </TabsTrigger>
          <TabsTrigger
            value="slides"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Slides
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lesson" className="flex-1 overflow-y-auto p-6 m-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-nunito font-bold">{parsedContent.title}</h2>
            <div className="flex items-center">
              <span className="bg-primary text-white px-3 py-1 rounded-md text-sm">
                CEFR {lesson.cefrLevel}
              </span>
              <button className="ml-3 text-gray-400 hover:text-primary">
                <Edit className="h-5 w-5" />
              </button>
              <button className="ml-2 text-gray-400 hover:text-primary">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <LessonContent content={parsedContent} />
        </TabsContent>
        
        <TabsContent value="notes" className="flex-1 overflow-y-auto p-6 m-0">
          <h2 className="text-xl font-nunito font-semibold mb-4">Teacher Notes</h2>
          
          <div className="bg-gray-light rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Lesson Objectives</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Develop vocabulary related to {lesson.topic}</li>
              <li>Practice reading comprehension with {lesson.cefrLevel}-level text</li>
              <li>Encourage critical thinking about {lesson.topic}</li>
              <li>Practice expressing opinions using provided sentence frames</li>
            </ul>
          </div>
          
          <div className="bg-gray-light rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Student Background</h3>
            <p>
              {parsedContent.teacherNotes || 
               `This lesson is designed for ${lesson.cefrLevel} level students. Focus on helping them use the new vocabulary actively in discussion.`}
            </p>
          </div>
          
          <div className="bg-gray-light rounded-lg p-4">
            <h3 className="font-semibold mb-2">Additional Resources</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Short video clips (2-3 minutes) if time permits</li>
              <li>Infographic on {lesson.topic}</li>
              <li>Follow-up homework suggestion: Write a short paragraph about {lesson.topic}</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="slides" className="flex-1 overflow-y-auto p-6 m-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-nunito font-semibold">Presentation Slides</h2>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition text-sm">
              <Share className="mr-2 h-4 w-4" /> Present Mode
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {parsedContent.sections && parsedContent.sections.map((section: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition">
                <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                  <div className="text-xl font-nunito font-semibold p-4 text-center">
                    {section.type ? section.type.charAt(0).toUpperCase() + section.type.slice(1) : "Section"}
                  </div>
                </div>
                <div className="p-2 text-center text-sm font-semibold truncate">
                  {section.type ? section.type.charAt(0).toUpperCase() + section.type.slice(1) : "Section"}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <div className="border-t border-gray-200 p-4 flex justify-between items-center mt-auto">
          <div>
            {lesson.id && 
              <span className="text-green-600 text-sm font-medium flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lesson saved automatically
              </span>
            }
          </div>
          <div className="flex space-x-2">
            <Button className="bg-[#28A745] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition">
              <Share className="mr-1 h-4 w-4" /> Share
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              onClick={() => {
                if (lesson.id) {
                  window.location.href = `/fullscreen/${lesson.id}`;
                }
              }}
              disabled={!lesson.id}
            >
              <Maximize2 className="mr-1 h-4 w-4" /> Fullscreen
            </Button>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
