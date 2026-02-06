import { useState, useEffect } from "react";
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
  const { canGenerateLessons } = useTrialStatus();
  
  // Read studentId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = urlParams.get('studentId');
  
  // Force reset loading state on component mount
  useEffect(() => {
    setGeneratingLesson(false);
  }, []);
  
  // Fetch students for dropdown
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    retry: false,
  });

  // Generate lesson mutation
  const generateLessonMutation = useMutation({
    mutationFn: async (params: LessonGenerateParams) => {
      const res = await apiRequest("POST", "/api/lessons/generate", params);
      return await res.json();
    },
    onMutate: () => {
      setGeneratingLesson(true);
    },
    onSuccess: (data) => {
      setGeneratingLesson(false); // Clear loading state immediately
      
      // Redirect to the lesson view IMMEDIATELY - don't wait for queries
      if (data && data.id) {
        console.log(`Lesson generated successfully with ID: ${data.id}, redirecting immediately...`);
        
        toast({
          title: "Lesson generated successfully!",
          description: "Opening your new lesson...",
        });
        
        // Store lesson data in React Query cache to avoid database fetch
        if (data.content) {
          queryClient.setQueryData([`/api/lessons/${data.id}`], {
            id: data.id,
            title: data.title,
            topic: data.topic,
            cefrLevel: data.cefrLevel,
            content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
            grammarSpotlight: data.grammarSpotlight,
            teacherId: data.teacherId,
            studentId: data.studentId,
            notes: "Auto-saved lesson",
            category: data.category || 'general',
            tags: data.tags || [],
            isPublic: false,
            publicCategory: null,
            createdAt: data.generatedAt,
            isTemporary: data.isTemporary || false
          });
          console.log(`Cached lesson data for ID: ${data.id} - skipping database fetch`);
        }
        
        // Redirect first, then invalidate queries in background
        setLocation(`/lessons/${data.id}`);
        
        // Invalidate queries in background after redirect
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        }, 100);
      } else {
        // Fallback if no lesson ID is available
        toast({
          title: "Lesson created but couldn't be opened automatically",
          description: "Please check your lesson history to view this lesson.",
          variant: "default"
        });
        
        // Still invalidate queries for fallback case
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      }
    },
    onError: (error: Error) => {
      setGeneratingLesson(false); // Clear loading state on error
      
      toast({
        title: "Failed to generate lesson",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // This runs after both success and error
      // But we've already handled loading state in onSuccess and onError
      // so this is just a safety net
      setGeneratingLesson(false);
    }
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
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-nunito font-bold">Generate New Lesson</h1>
                <p className="text-gray-600">Create an AI-powered lesson based on your requirements</p>
              </div>
            </div>
            
            {/* Lesson form container */}
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
