import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { LessonContent } from "@/components/lesson/lesson-content";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, ExpandIcon, MinimizeIcon, Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lesson } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function FullScreenLessonPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState("lesson");
  
  // Extract lesson ID from URL
  const lessonId = location.split("/")[2];
  
  // Fetch lesson data
  const { data: lesson, isLoading, error } = useQuery<Lesson>({
    queryKey: [`/api/lessons/${lessonId}`],
    retry: false,
  });
  
  // Parse the content if it's a string (from database)
  const [parsedContent, setParsedContent] = useState<any>(null);
  
  useEffect(() => {
    if (lesson && lesson.content) {
      try {
        // Handle both string and object formats consistently
        if (typeof lesson.content === 'string') {
          try {
            // Try to parse it as JSON
            console.log("LESSON CONTENT (STRING):", lesson.content.substring(0, 500) + "...");
            const parsed = JSON.parse(lesson.content);
            console.log("PARSED LESSON CONTENT (FIRST 100 KEYS):", 
              Object.keys(parsed).slice(0, 100));
            
            if (parsed.sections && Array.isArray(parsed.sections)) {
              console.log("SECTIONS TYPES:", parsed.sections.map((s: any) => s.type));
              // Log the comprehension and discussion sections
              const comprehensionSection = parsed.sections.find((s: any) => s.type === 'comprehension');
              const discussionSection = parsed.sections.find((s: any) => s.type === 'discussion');
              
              console.log("COMPREHENSION SECTION:", comprehensionSection ? 
                 JSON.stringify(comprehensionSection).substring(0, 500) : "Not found");
              console.log("DISCUSSION SECTION:", discussionSection ? 
                 JSON.stringify(discussionSection).substring(0, 500) : "Not found");
            }
            
            setParsedContent(parsed);
          } catch (jsonError) {
            console.error("Error parsing JSON string:", jsonError);
            setParsedContent({ 
              title: lesson.title,
              sections: [{ 
                type: 'error', 
                content: 'Error parsing lesson content' 
              }] 
            });
          }
        } else {
          // It's already an object (from direct API response)
          console.log("LESSON CONTENT (OBJECT):", 
            JSON.stringify(lesson.content).substring(0, 500) + "...");
          console.log("CONTENT KEYS:", Object.keys(lesson.content).slice(0, 100));
          
          // Check for sections
          const lessonContent = lesson.content as any;
          if (lessonContent.sections && Array.isArray(lessonContent.sections)) {
            console.log("SECTIONS TYPES:", lessonContent.sections.map((s: any) => s.type));
            const comprehensionSection = lessonContent.sections.find((s: any) => s.type === 'comprehension');
            const discussionSection = lessonContent.sections.find((s: any) => s.type === 'discussion');
            
            console.log("COMPREHENSION SECTION:", comprehensionSection ? 
              JSON.stringify(comprehensionSection).substring(0, 500) : "Not found");
            console.log("DISCUSSION SECTION:", discussionSection ? 
              JSON.stringify(discussionSection).substring(0, 500) : "Not found");
          }
          
          setParsedContent(lessonContent);
        }
        
      } catch (e) {
        console.error("Unexpected error handling content:", e);
        setParsedContent({ 
          title: lesson.title,
          sections: [{ 
            type: 'error', 
            content: 'Error processing lesson content' 
          }] 
        });
      }
    }
  }, [lesson]);
  
  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        toast({
          title: "Fullscreen error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
          variant: "destructive",
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
          // Manually refresh lessons cache to ensure data is available
          queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        });
      }
    }
  };

  // Print lesson
  const printLesson = () => {
    window.print();
  };
  
  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary border-primary/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-nunito font-bold mb-2">Error Loading Lesson</h3>
          <p className="text-gray-500 mb-4">
            {error instanceof Error ? error.message : "The requested lesson could not be found."}
          </p>
          <Button 
            variant="default" 
            className="bg-primary text-white font-medium"
            onClick={() => window.location.replace("/history")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lessons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white print:bg-white">
      {/* Header - hidden when printing */}
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="flex justify-between items-center px-5 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-primary mr-4 p-2"
              onClick={() => window.location.replace("/history")}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Exit</span>
            </Button>
            <h1 className="text-xl font-nunito font-bold text-gray-800 truncate max-w-md">
              {lesson.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={printLesson}
              className="text-gray-600"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullScreen}
              className="text-gray-600"
            >
              {isFullScreen ? (
                <>
                  <MinimizeIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <ExpandIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </Button>
            <div className="flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-semibold">
              <span>CEFR {lesson.cefrLevel}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="w-full justify-start px-4 py-1 bg-gray-50 border-b border-gray-200 rounded-none print:hidden">
            <TabsTrigger
              value="lesson"
              className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-medium"
            >
              Lesson
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-medium"
            >
              Teacher Notes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lesson" className="flex-1 overflow-y-auto p-6 m-0">
            {parsedContent && <LessonContent content={parsedContent} />}
          </TabsContent>
          
          <TabsContent value="notes" className="flex-1 overflow-y-auto p-6 m-0">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-nunito font-semibold mb-4">Teacher Notes</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Lesson Objectives</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Develop vocabulary related to {lesson.topic}</li>
                  <li>Practice reading comprehension with {lesson.cefrLevel}-level text</li>
                  <li>Encourage critical thinking about {lesson.topic}</li>
                  <li>Practice expressing opinions using provided sentence frames</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Student Background</h3>
                <p>
                  {(parsedContent as any)?.teacherNotes || 
                   `This lesson is designed for ${lesson.cefrLevel} level students. Focus on helping them use the new vocabulary actively in discussion.`}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Additional Resources</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Short video clips (2-3 minutes) if time permits</li>
                  <li>Infographic on {lesson.topic}</li>
                  <li>Follow-up homework suggestion: Write a short paragraph about {lesson.topic}</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}