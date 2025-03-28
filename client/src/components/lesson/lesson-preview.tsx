import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Download, Share } from "lucide-react";
import { LessonContent } from "./lesson-content";

interface LessonPreviewProps {
  lesson: any;
  onSave: () => void;
  savePending: boolean;
}

export function LessonPreview({ lesson, onSave, savePending }: LessonPreviewProps) {
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
  
  // Parse the content if it's a string (assuming it's JSON)
  let parsedContent;
  try {
    parsedContent = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
  } catch (e) {
    parsedContent = { 
      title: lesson.title,
      sections: [{ 
        type: 'error', 
        content: 'Error parsing lesson content' 
      }] 
    };
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
                    {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                  </div>
                </div>
                <div className="p-2 text-center text-sm font-semibold truncate">
                  {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <div className="border-t border-gray-200 p-4 flex justify-between items-center mt-auto">
          <div>
            <Button variant="outline" className="bg-white border border-gray-300 text-text font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition mr-2">
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Button>
            <Button 
              variant="outline" 
              className="bg-white border border-gray-300 text-text font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              onClick={onSave}
              disabled={savePending}
            >
              <Download className="mr-1 h-4 w-4" /> Save
            </Button>
          </div>
          <div>
            <Button className="bg-[#28A745] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition">
              <Share className="mr-1 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
