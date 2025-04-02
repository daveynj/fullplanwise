import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LessonForm } from "@/components/lesson/lesson-form";
import { LessonPreview } from "@/components/lesson/lesson-preview";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LessonGenerateParams, Student } from "@shared/schema";

export default function LessonGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  
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
      setGeneratedLesson(data);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({
        title: "Lesson generated successfully!",
        description: "Your lesson has been created and saved automatically.",
      });
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
            
            {/* Lesson form and preview container */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Lesson generator form */}
              <div className="lg:col-span-2">
                <LessonForm 
                  students={students} 
                  onSubmit={handleGenerateLesson} 
                  credits={user?.credits || 0}
                />
              </div>
              
              {/* Lesson preview */}
              <div className="lg:col-span-3">
                <LessonPreview 
                  lesson={generatedLesson} 
                  onSave={() => {}} // Empty function as saving is automatic
                  savePending={false}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <LoadingOverlay isLoading={generatingLesson} />
    </div>
  );
}
