import { 
  Flame, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  AlignJustify, 
  MessageCircle, 
  CheckSquare 
} from "lucide-react";
import { useState, useEffect } from "react";

interface LessonContentProps {
  content: any;
}

export function LessonContent({ content }: LessonContentProps) {
  const [parsedContent, setParsedContent] = useState<any>(null);
  
  // Parse the content if it's a string (from database)
  useEffect(() => {
    if (content) {
      try {
        // If it's a string (from database), parse it
        if (typeof content === 'string') {
          setParsedContent(JSON.parse(content));
        } else {
          // If it's already an object (from direct API response)
          setParsedContent(content);
        }
      } catch (err) {
        console.error("Error parsing lesson content:", err);
        setParsedContent(null);
      }
    }
  }, [content]);
  
  // Show loading state while parsing
  if (!parsedContent) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading lesson content...</p>
      </div>
    );
  }
  
  // Handle missing or invalid sections
  if (!parsedContent.sections || !Array.isArray(parsedContent.sections)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No lesson content available</p>
      </div>
    );
  }

  // Map of section types to their icons and background colors
  const sectionStyles: Record<string, { icon: React.ReactNode; bgColor: string }> = {
    "warm-up": { 
      icon: <Flame className="text-[#FFB400] text-xl" />, 
      bgColor: "bg-amber-100" 
    },
    "vocabulary": { 
      icon: <BookOpen className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "reading": { 
      icon: <FileText className="text-[#28A745] text-xl" />, 
      bgColor: "bg-green-100" 
    },
    "comprehension": { 
      icon: <HelpCircle className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "sentences": { 
      icon: <AlignJustify className="text-[#FFB400] text-xl" />, 
      bgColor: "bg-amber-100" 
    },
    "discussion": { 
      icon: <MessageCircle className="text-[#28A745] text-xl" />, 
      bgColor: "bg-green-100" 
    },
    "quiz": { 
      icon: <CheckSquare className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
    "homework": { 
      icon: <BookOpen className="text-primary text-xl" />, 
      bgColor: "bg-primary/20" 
    },
  };
  
  // Function to get section heading from type
  const getSectionHeading = (type: string): string => {
    const headings: Record<string, string> = {
      "warm-up": "Warm-up Activity",
      "vocabulary": "Key Vocabulary",
      "reading": "Reading Passage",
      "comprehension": "Comprehension Questions",
      "sentences": "Sentence Frames",
      "discussion": "Discussion Questions",
      "quiz": "Quiz",
      "homework": "Homework",
    };
    
    return headings[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to safely render content with splitting
  const renderContentWithSplit = (content: any, splitPattern: string) => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      return content.split(splitPattern).map((item: string, i: number) => (
        <p key={i}>{item.trim()}</p>
      ));
    }
    
    // If not a string, just render as is
    return <p>{String(content)}</p>;
  };

  return (
    <div className="lesson-content space-y-8">
      {parsedContent.sections.map((section: any, index: number) => {
        const style = sectionStyles[section.type] || { 
          icon: <BookOpen className="text-primary text-xl" />, 
          bgColor: "bg-gray-100" 
        };
        
        return (
          <section key={index}>
            <div className="flex items-center mb-3">
              <div className={`${style.bgColor} p-1.5 rounded-lg mr-2`}>
                {style.icon}
              </div>
              <h3 className="font-nunito font-semibold text-lg">
                {getSectionHeading(section.type)}
              </h3>
            </div>
            <div className="bg-gray-light rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                {/* Render different content based on section type */}
                {section.type === "vocabulary" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safely render vocabulary content */}
                    {typeof section.content === 'string' ? section.content : String(section.content)}
                  </div>
                ) : section.type === "comprehension" || section.type === "discussion" ? (
                  <ol className="list-decimal list-inside space-y-3">
                    {/* Render as a list if it's questions */}
                    {typeof section.content === 'string' && section.content.split('\n').map((line: string, i: number) => (
                      <li key={i}>{line.trim()}</li>
                    ))}
                    {typeof section.content !== 'string' && <li>{String(section.content)}</li>}
                  </ol>
                ) : section.type === "quiz" ? (
                  <div>
                    {/* Render quiz content safely */}
                    {typeof section.content === 'string' ? section.content : String(section.content)}
                  </div>
                ) : (
                  // Default rendering for other section types
                  <div className="space-y-3">
                    {typeof section.content === 'string' ? 
                      section.content.split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      )) : 
                      <p>{String(section.content)}</p>
                    }
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
