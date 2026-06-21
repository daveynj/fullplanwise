import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LessonForm } from "@/components/lesson/lesson-form";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LessonGenerateParams, Student } from "@shared/schema";
import { useLocation } from "wouter";
import { useTrialStatus } from "@/hooks/use-trial-status";

export default function LessonGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { canGenerateLessons } = useTrialStatus();

  const urlParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = urlParams.get('studentId');

  useEffect(() => {
    setGeneratingLesson(false);
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    retry: false,
  });

  const handleJobComplete = (lesson: any) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setPollingJobId(null);
    setGeneratingLesson(false);

    if (lesson && lesson.id) {
      toast({
        title: "Lesson generated successfully!",
        description: "Opening your new lesson...",
      });

      if (lesson.content) {
        queryClient.setQueryData([`/api/lessons/${lesson.id}`], {
          id: lesson.id,
          title: lesson.title,
          topic: lesson.topic,
          cefrLevel: lesson.cefrLevel,
          content: typeof lesson.content === 'string' ? lesson.content : JSON.stringify(lesson.content),
          grammarSpotlight: lesson.grammarSpotlight,
          teacherId: lesson.teacherId,
          studentId: lesson.studentId,
          notes: lesson.notes || "Auto-saved lesson",
          category: lesson.category || 'general',
          tags: lesson.tags || [],
          isPublic: false,
          publicCategory: null,
          createdAt: lesson.createdAt || lesson.generatedAt,
        });
      }

      setLocation(`/lessons/${lesson.id}`);

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      }, 100);
    } else {
      toast({
        title: "Lesson created but couldn't be opened automatically",
        description: "Please check your lesson history to view this lesson.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    }
  };

  const startPolling = (jobId: string) => {
    setPollingJobId(jobId);
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/lessons/job/${jobId}`);
        const data = await res.json();

        if (data.status === 'complete') {
          handleJobComplete(data.lesson);
        } else if (data.status === 'error') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPollingJobId(null);
          setGeneratingLesson(false);
          toast({
            title: "Failed to generate lesson",
            description: data.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
        // If 'pending', keep polling
      } catch (err: any) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPollingJobId(null);
        setGeneratingLesson(false);
        toast({
          title: "Failed to generate lesson",
          description: "Lost connection while waiting. Please try again.",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  const generateLessonMutation = useMutation({
    mutationFn: async (params: LessonGenerateParams) => {
      const res = await apiRequest("POST", "/api/lessons/generate", params);
      return await res.json();
    },
    onMutate: () => {
      setGeneratingLesson(true);
    },
    onSuccess: (data) => {
      if (data.jobId) {
        // New async job pattern — start polling
        startPolling(data.jobId);
      } else if (data && data.id) {
        // Legacy direct response fallback
        handleJobComplete(data);
      } else {
        setGeneratingLesson(false);
        toast({
          title: "Lesson created but couldn't be opened automatically",
          description: "Please check your lesson history to view this lesson.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      }
    },
    onError: (error: Error) => {
      setGeneratingLesson(false);
      toast({
        title: "Failed to generate lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateLesson = (params: LessonGenerateParams) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate lessons.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateLessons && !user.isAdmin) {
      toast({
        title: "No Credits Remaining",
        description: "Your free trial has ended and you've used all your free lessons. Subscribe for unlimited access!",
        variant: "destructive",
      });
      return;
    }

    generateLessonMutation.mutate(params);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-nunito font-bold">Generate New Lesson</h1>
                <p className="text-gray-600">Create an AI-powered lesson based on your requirements</p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <LessonForm
                students={students}
                onSubmit={handleGenerateLesson}
                initialStudentId={studentIdFromUrl || undefined}
              />
            </div>
          </div>
        </main>
      </div>

      <LoadingOverlay
        isLoading={generatingLesson}
        message="Creating Your Lesson"
        progressText="Your lesson will open automatically when ready..."
      />
    </div>
  );
}
