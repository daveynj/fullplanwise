import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { LessonContent } from "@/components/lesson/lesson-content";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, ExpandIcon, MinimizeIcon, Download, FileJson, Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lesson } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SEOHead } from "@/components/SEOHead";
import { lessonPublicMetadata, publicLessonRemixHref } from "@shared/lesson-public-metadata";
import { LessonDesignPanel } from "@/components/lesson/lesson-design-panel";
import { tutorLinkFor } from "@shared/tutor-link";
import { TopRemixBanner, VocabFlashcardCTA, FreeLessonLicenceNote } from "@/components/public-lesson-ctas";
import { StudentMemoryNoteBanner } from "@/components/lesson/student-memory-note";
import { RelatedPublicLessons } from "@/components/related-public-lessons";
import { lessonPath } from "@shared/lesson-url";
import { trackEvent } from "@/lib/analytics";

class LessonNotFoundError extends Error {
  constructor() {
    super("Lesson not found");
    this.name = "LessonNotFoundError";
  }
}

export default function FullScreenLessonPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState("lesson");
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const { user } = useAuth();
  
  const parts = location.split("/");
  const lessonApi = parts[1] === "esl-lessons"
    ? `/api/public-lessons/${encodeURIComponent(parts[3])}`
    : `/api/lessons/${parts[2]}`;
  
  // Fetch lesson data with optimized caching. Only a real 404 from the API
  // counts as "not found"; any other failure (network error, blocked request,
  // 5xx) keeps showing the loading state so the page never presents an error
  // screen that search engines read as a missing page.
  const { data: lesson, error } = useQuery<Lesson>({
    queryKey: [lessonApi],
    queryFn: async () => {
      const res = await fetch(lessonApi, { credentials: "include" });
      if (res.status === 404) throw new LessonNotFoundError();
      if (!res.ok) throw new Error(`Failed to load lesson (${res.status})`);
      return res.json();
    },
    retry: (failureCount, err) => !(err instanceof LessonNotFoundError) && failureCount < 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  const isNotFound = error instanceof LessonNotFoundError;
  const lessonId = lesson?.id;

  // Internal numeric links can navigate without a server request. Replace
  // those too, without losing query parameters or the lesson's scroll position.
  useEffect(() => {
    if ((location.startsWith("/lessons/") || location.startsWith("/esl-lessons/")) &&
        lesson?.isPublic && lesson.publicSlug && location !== lessonPath(lesson)) {
      window.history.replaceState(null, "", lessonPath(lesson) + window.location.search + window.location.hash);
    }
  }, [lesson, location]);
  
  // Parse the content if it's a string (from database)
  const [parsedContent, setParsedContent] = useState<any>(null);
  
  useEffect(() => {
    if (lesson && lesson.content) {
      try {
        // Handle both string and object formats consistently
        if (typeof lesson.content === 'string') {
          try {
            // Try to parse it as JSON
            console.log("LESSON CONTENT (STRING):", String(lesson.content).substring(0, 500) + "...");
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
            
            // Include grammarSpotlight data from the top-level lesson object
            const enhancedParsedContent = {
              ...parsed,
              grammarSpotlight: lesson.grammarSpotlight
            };
            
            console.log("Grammar spotlight data in lesson (JSON case):", lesson.grammarSpotlight ? "Found" : "Not found");
            if (lesson.grammarSpotlight) {
              console.log("Grammar spotlight data (JSON case):", lesson.grammarSpotlight);
            }
            
            setParsedContent(enhancedParsedContent);
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
          
          // Include grammarSpotlight data from the top-level lesson object
          const enhancedLessonContent = {
            ...lessonContent,
            grammarSpotlight: lesson.grammarSpotlight
          };
          
          console.log("Grammar spotlight data in lesson:", lesson.grammarSpotlight ? "Found" : "Not found");
          if (lesson.grammarSpotlight) {
            console.log("Grammar spotlight data:", lesson.grammarSpotlight);
          }
          
          setParsedContent(enhancedLessonContent);
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

  // Download lesson as JSON (admin only)
  const downloadLessonJSON = () => {
    if (!lesson) return;
    
    const lessonData = {
      id: lesson.id,
      title: lesson.title,
      topic: lesson.topic,
      cefrLevel: lesson.cefrLevel,
      content: parsedContent || lesson.content,
      notes: lesson.notes,
      category: lesson.category,
      tags: lesson.tags,
      createdAt: lesson.createdAt
    };
    
    const blob = new Blob([JSON.stringify(lessonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-${lesson.id}-${lesson.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your lesson JSON file is downloading.",
    });
  };


  
  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Not found: only when the API actually answered 404.
  if (isNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-nunito font-bold mb-2">Lesson Not Found</h3>
          <p className="text-gray-500 mb-4">The requested lesson could not be found.</p>
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

  // Loading, or a failed request that wasn't a 404: keep the loading state.
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary border-primary/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading lesson...</p>
          {error && (
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Reload
            </Button>
          )}
        </div>
      </div>
    );
  }

  const metadata = lessonPublicMetadata(lesson);
  const showPublicLessonPromos = lesson.isPublic && (!user || user.isAdmin);
  const remixHref = publicLessonRemixHref(lesson.title, lesson.cefrLevel, !!user);
  // Each public lesson links to the matching page on Dave's tutoring site (shared/tutor-link.ts).
  const tutorLink = tutorLinkFor(lesson);
  const vocabularySignupHref = "/auth?register=true&source=vocab-cta";
  return (
    <>
      {/* SEO meta tags for shared lessons */}
      {lesson && (
        <SEOHead
          title={metadata.title}
          description={metadata.description}
          keywords={[
            'ESL lesson',
            lesson.title,
            lesson.cefrLevel,
            'English teaching',
            'language learning',
            'vocabulary',
            'reading comprehension'
          ]}
          canonicalUrl={metadata.canonicalPath}
          // Only library (public) lessons belong in search results; private share links do not
          noindex={!lesson.isPublic}
          ogImage={metadata.imagePath}
          ogImageAlt={metadata.imageAlt}
          ogImageDimensions={null}
          ogType="article"
        />
      )}
      
      <div className="min-h-screen flex flex-col bg-white print:bg-white">
      {/* Header - hidden when printing */}
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="flex justify-between items-center px-5 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-primary mr-4 p-2"
              onClick={() => {
                // If user is authenticated, go to their lesson history
                // If not authenticated (viewing shared lesson), close or go to homepage
                if (user) {
                  window.location.replace("/history");
                } else {
                  // For shared lessons, try to close the tab or go to homepage
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.replace("/");
                  }
                }
              }}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Exit</span>
            </Button>
            <h1 className="text-xl font-nunito font-bold text-gray-800 truncate max-w-md">
              {lesson.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Download JSON button - Admin only */}
            {user?.isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadLessonJSON}
                className="text-gray-600 bg-green-50 border-green-200 hover:bg-green-100"
                data-testid="button-download-json"
              >
                <FileJson className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download JSON</span>
                <span className="sm:hidden">JSON</span>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-gray-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <a
                href={`/api/lessons/${lessonId}/pdf?format=html`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("public_library_pdf_downloaded", { lesson_id: lesson?.id, cefr_level: lesson?.cefrLevel })}
                className="inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download for PDF</span>
                <span className="sm:hidden">PDF</span>
              </a>
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
            {/* Library lessons explain their design to visitors (not to the teacher who owns them). */}
            {parsedContent && lesson.isPublic && lesson.teacherId !== user?.id && (
              <LessonDesignPanel content={parsedContent} signedIn={!!user} tutorLink={tutorLink} />
            )}
            {parsedContent && lesson.isPublic && (!user || user.isAdmin) && (
              <div className="max-w-4xl mx-auto mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-700 print:hidden">
                <span>
                  Created by <strong className="text-brand-navy">Dave Jackson</strong> (British ESL teacher · 11 yrs) — designed as a teacher-led lesson.
                </span>
                <span>
                  Learning English?{" "}
                  <a
                    href={tutorLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2 hover:text-amber-700"
                  >
                    {tutorLink.linkText} →
                  </a>
                </span>
              </div>
            )}
            {user && lesson.teacherId === user.id && lesson.studentId && (
              <StudentMemoryNoteBanner lessonId={lesson.id} studentId={lesson.studentId} />
            )}
            {showPublicLessonPromos && (
              <TopRemixBanner title={lesson.title} href={remixHref} />
            )}
            {parsedContent && (
              <LessonContent
                content={parsedContent}
                vocabularyCta={showPublicLessonPromos ? <VocabFlashcardCTA href={vocabularySignupHref} /> : undefined}
              />
            )}
            {parsedContent && lesson.isPublic && <FreeLessonLicenceNote />}
            {lesson.isPublic && (
              <RelatedPublicLessons lesson={{ id: lesson.id, title: lesson.title, cefrLevel: lesson.cefrLevel, tags: lesson.tags }} />
            )}
            {parsedContent && lesson.isPublic && (!user || user.isAdmin) && (
              <aside className="mt-10 max-w-4xl mx-auto rounded-2xl bg-brand-navy text-white p-6 md:p-8 flex flex-col gap-6 print:hidden">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="md:border-r md:border-white/15 md:pr-6">
                    <p className="text-xs uppercase tracking-wider text-brand-yellow font-semibold mb-1">
                      For English learners · Teacher-led lesson
                    </p>
                    <h2 className="font-nunito text-xl font-bold">
                      {tutorLink.belowTaughtLevels ? "Learning English with a teacher?" : "Want to take this lesson 1-on-1 with Dave?"}
                    </h2>
                    <p className="text-sm text-white/80 mt-1 mb-4">
                      Created by Dave Jackson (British ESL teacher, 11 years &amp; 2,000+ students). These lessons are designed to be taught live with a teacher.
                    </p>
                    <a
                      href={tutorLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-white text-brand-navy font-bold px-5 py-2.5 text-sm hover:bg-amber-50 transition-colors shadow"
                    >
                      {tutorLink.linkText} →
                    </a>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-brand-yellow font-semibold mb-1">
                      For ESL teachers · 5-day free trial
                    </p>
                    <h2 className="font-nunito text-xl font-bold">
                      Create lessons like this on any topic
                    </h2>
                    <p className="text-sm text-white/80 mt-1 mb-4">
                      Generate a complete CEFR A1–C2 lesson in 1–2 minutes with learner dashboard, flashcards, and printable Vocabulary Review PDF.
                    </p>
                    <a
                      href="/auth?register=true"
                      className="inline-flex items-center justify-center rounded-full bg-brand-yellow text-brand-navy font-bold px-5 py-2.5 text-sm hover:bg-amber-300 transition-colors shadow-lg"
                    >
                      Make Your First Lesson Free →
                    </a>
                  </div>
                </div>
              </aside>
            )}
            {lesson?.isPublic && (
              <div className="max-w-5xl mx-auto mt-6 mb-6 rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm print:hidden">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-navy">
                  <Share2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Found this free lesson useful? Share it with a fellow teacher or student:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const shareUrl = `https://planwiseesl.com${lessonPath(lesson)}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopiedShareLink(true);
                        toast({ title: "Link copied!", description: shareUrl });
                        setTimeout(() => setCopiedShareLink(false), 2500);
                      } catch {
                        toast({ title: "Share link", description: shareUrl });
                      }
                    }}
                  >
                    {copiedShareLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      "Copy link"
                    )}
                  </Button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Free ${lesson.cefrLevel} ESL lesson (${lesson.title}) — no login required: https://planwiseesl.com${lessonPath(lesson)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="button" size="sm" variant="outline">
                      WhatsApp
                    </Button>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      `https://planwiseesl.com${lessonPath(lesson)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="button" size="sm" variant="outline">
                      LinkedIn
                    </Button>
                  </a>
                </div>
              </div>
            )}
            {lesson?.isPublic && (!user || user.isAdmin) && (
              <p className="max-w-5xl mx-auto mb-10 px-4 text-center text-sm text-slate-500 print:hidden">
                Created by <span className="font-medium text-brand-navy">Dave Jackson</span> (British ESL teacher). These lessons are designed to be teacher-led.{tutorLink.belowTaughtLevels ? " " : " If you’re an English learner: "}
                <a
                  href={tutorLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2 hover:text-amber-700"
                >
                  {tutorLink.linkText}
                </a>
                .
              </p>
            )}
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
    </>
  );
}