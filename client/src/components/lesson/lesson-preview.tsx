import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Download, Share, Maximize2 } from "lucide-react";
import { LessonContent } from "./lesson-content";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface LessonPreviewProps {
  lesson: any;
  onSave: () => void; // Kept for backward compatibility
  savePending: boolean; // Kept for backward compatibility
}

export function LessonPreview({ lesson }: LessonPreviewProps) {
  const [activeTab, setActiveTab] = useState("lesson");
  const { toast } = useToast();
  
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
    if (lesson.content && typeof lesson.content === 'string') {
      try {
        // First attempt to parse as JSON directly
        console.log("Attempting to parse lesson content as JSON");
        parsedContent = JSON.parse(lesson.content);
        console.log("Successfully parsed lesson content as JSON:", parsedContent);
      } catch (parseError) {
        console.warn("Failed to parse lesson content as JSON, attempting cleanup:", parseError);
        
        // Clean up the content before attempting to parse again
        let cleanedContent = lesson.content
          .replace(/```json\s*/g, '') // Remove markdown code blocks
          .replace(/```\s*$/g, '')
          .trim();
        
        try {
          parsedContent = JSON.parse(cleanedContent);
          console.log("Successfully parsed cleaned lesson content");
        } catch (secondError) {
          console.error("Failed to parse cleaned content, falling back to direct content:", secondError);
          
          // Use the raw content as fallback
          parsedContent = { 
            title: lesson.title || "Lesson Preview",
            sections: [{ 
              type: 'error', 
              title: "JSON Parsing Error",
              content: 'The lesson content could not be parsed correctly. Please try regenerating the lesson.' 
            }],
            rawContent: lesson.content // Store the raw content for debugging
          };
        }
      }
    } 
    else if (lesson.content && typeof lesson.content === 'object') {
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
  
  // Special handling for Qwen's unique format
  // Look for sections that have questionable format (with colons instead of proper JSON)
  parsedContent.sections.forEach((section, index) => {
    if (section && typeof section === 'object') {
      // Check for improperly formatted arrays
      Object.keys(section).forEach(key => {
        const value = section[key];
        
        // If we find a string value that looks like it should be an array
        if (typeof value === 'string' && value.includes(':') && value.includes(',')) {
          console.log(`Found potentially malformed array in section ${section.type}, key ${key}`);
          
          // Try to convert it to an array
          const items = value.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
          if (items.length > 0) {
            console.log(`Converting string "${value}" to array with ${items.length} items`);
            section[key] = items;
          }
        }
        
        // If we have a property that should be an array but isn't
        if (['questions', 'options', 'targetVocabulary', 'paragraphs'].includes(key) && !Array.isArray(value)) {
          console.log(`Property ${key} should be an array but is ${typeof value}`);
          
          if (typeof value === 'string') {
            // Try to convert the string to an array with one item
            section[key] = [value];
          } else if (typeof value === 'object') {
            // If it's an object, try to extract values into an array
            section[key] = Object.values(value).filter(v => v !== null && v !== undefined);
          }
        }
      });
    }
  });

  const handleDownloadPDF = async (format = 'pdf') => {
    try {
      // Check if lesson has vocabulary
      const vocabularySection = parsedContent.sections?.find((section: any) => section.type === 'vocabulary');
      if (!vocabularySection || !vocabularySection.words || vocabularySection.words.length === 0) {
        toast({
          title: "No vocabulary found",
          description: "This lesson doesn't contain vocabulary words to include in a review PDF.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: format === 'html' ? "Generating HTML..." : "Generating PDF...",
        description: format === 'html' 
          ? "Please wait while we create your comprehensive vocabulary review HTML document."
          : "Please wait while we create your vocabulary review PDF.",
      });

      const apiUrl = format === 'html' 
        ? `/api/lessons/${lesson.id}/pdf?format=html` 
        : `/api/lessons/${lesson.id}/pdf`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Set filename based on format
      if (format === 'html') {
        a.download = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
      } else {
        a.download = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      }
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: format === 'html' ? "HTML downloaded!" : "PDF downloaded!",
        description: format === 'html'
          ? "Your comprehensive vocabulary HTML document has been downloaded successfully."
          : "Your vocabulary review PDF has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to generate the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="w-full justify-start px-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="lesson"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-medium"
          >
            Lesson Preview
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-medium"
          >
            Teacher Notes
          </TabsTrigger>
          <TabsTrigger
            value="slides"
            className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-medium"
          >
            Slides
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lesson" className="flex-1 overflow-y-auto p-6 m-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-nunito font-bold text-gray-800">{parsedContent.title}</h2>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-semibold">
                CEFR {lesson.cefrLevel}
              </span>
              <button className="ml-3 text-gray-400 hover:text-primary">
                <Edit className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <button 
                  className="ml-2 text-gray-400 hover:text-primary" 
                  onClick={() => handleDownloadPDF('pdf')}
                  title="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  className="ml-1 text-xs px-2 py-1 text-gray-400 hover:text-primary border border-gray-200 rounded-md"
                  onClick={() => handleDownloadPDF('html')}
                  title="Download HTML with complete vocabulary data"
                >
                  HTML
                </button>
              </div>
            </div>
          </div>
          
          <LessonContent content={parsedContent} />
        </TabsContent>
        
        <TabsContent value="notes" className="flex-1 overflow-y-auto p-6 m-0">
          <h2 className="text-xl font-nunito font-semibold mb-4">Teacher Notes</h2>
          
          {parsedContent.teacherNotes ? (
            <div className="bg-gray-light rounded-lg p-4 mb-4">
              <p>{parsedContent.teacherNotes}</p>
            </div>
          ) : (
            // Look for teacher notes in sections
            parsedContent.sections?.some((section: any) => section.teacherNotes) ? (
              parsedContent.sections
                .filter((section: any) => section.teacherNotes)
                .map((section: any, idx: number) => (
                  <div key={`teacher-note-${idx}`} className="bg-gray-light rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2">{section.title || 'Section Notes'}</h3>
                    <p>{section.teacherNotes}</p>
                  </div>
                ))
            ) : (
              <div className="bg-gray-light rounded-lg p-4 mb-4 text-gray-500 italic">
                <p>No teacher notes are available for this lesson.</p>
              </div>
            )
          )}
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
