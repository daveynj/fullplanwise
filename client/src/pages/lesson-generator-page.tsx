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

export default function LessonGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [generatingLesson, setGeneratingLesson] = useState(false);
  
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      
      toast({
        title: "Lesson generated successfully!",
        description: "Opening your new lesson...",
      });
      
      // Redirect to the fullscreen lesson view
      if (data && data.id) {
        // Short delay to allow the toast to be seen
        setTimeout(() => {
          setLocation(`/fullscreen/${data.id}`);
        }, 500);
      } else {
        // Fallback if no lesson ID is available
        toast({
          title: "Lesson created but couldn't be opened automatically",
          description: "Please check your lesson history to view this lesson.",
          variant: "default"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate lesson",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
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
    
    if (user.credits < 1 && !user.isAdmin) {
      toast({
        title: "Insufficient credits",
        description: "Please purchase more credits to generate lessons.",
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
                credits={user?.credits || 0}
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
