import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentForm } from "@/components/student/student-form";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Edit, ArrowLeft, Plus, User } from "lucide-react";
import { Student } from "@shared/schema";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = parseInt(id);
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
  // Fetch student details
  const { 
    data: student,
    isLoading: isStudentLoading, 
    error: studentError 
  } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    retry: false,
  });
  
  // Fetch student's lessons
  const { 
    data: lessons = [],
    isLoading: isLessonsLoading
  } = useQuery({
    queryKey: [`/api/lessons/student/${studentId}`],
    enabled: !!studentId,
    retry: false,
  });
  
  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (studentData: Partial<Student>) => {
      const res = await apiRequest("PUT", `/api/students/${studentId}`, studentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Student updated successfully!",
        description: "The student profile has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update student",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission for student edit
  const handleUpdateStudent = (data: Omit<Student, 'id' | 'teacherId' | 'createdAt'>) => {
    updateStudentMutation.mutate(data);
  };

  // If error loading student
  if (studentError) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
                <p className="text-gray-600 mb-6">The student you're looking for doesn't exist or you don't have access to it.</p>
                <Link href="/students">
                  <Button className="bg-primary hover:bg-primary/90">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name: string = "") => {
    if (!name) return "";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Back button and page header */}
            <div className="mb-6">
              <Link href="/students">
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
                </Button>
              </Link>
              
              {isStudentLoading ? (
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                  <div>
                    <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ) : student ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-nunito font-bold">{student.name}</h1>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-800">
                          CEFR {student.cefrLevel}
                        </Badge>
                        {student.email && (
                          <span className="text-gray-500">{student.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex space-x-3">
                    <Link href={`/generate?studentId=${student.id}`}>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> New Lesson
                      </Button>
                    </Link>
                    
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="font-nunito text-xl">Edit Student</DialogTitle>
                        </DialogHeader>
                        {student && (
                          <StudentForm 
                            onSubmit={handleUpdateStudent}
                            isSubmitting={updateStudentMutation.isPending}
                            defaultValues={{
                              name: student.name,
                              cefrLevel: student.cefrLevel,
                              email: student.email || "",
                              notes: student.notes || "",
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Content tabs */}
            {student && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="info" className="text-base px-6">
                    <User className="mr-2 h-4 w-4" /> Student Info
                  </TabsTrigger>
                  <TabsTrigger value="lessons" className="text-base px-6">
                    <BookOpen className="mr-2 h-4 w-4" /> Lesson History
                  </TabsTrigger>
                </TabsList>
                
                {/* Student Info Tab */}
                <TabsContent value="info" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-nunito">Student Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                            <p className="mt-1">{student.name}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">CEFR Level</h3>
                            <p className="mt-1">{student.cefrLevel}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p className="mt-1">{student.email || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Added on</h3>
                            <p className="mt-1">{formatDate(student.createdAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-nunito">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {student.notes ? (
                          <p className="text-gray-600">{student.notes}</p>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500">No notes added for this student.</p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => setIsEditDialogOpen(true)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Add Notes
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Lesson History Tab */}
                <TabsContent value="lessons" className="mt-0">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="font-nunito">Lesson History</CardTitle>
                      <Link href={`/generate?studentId=${student.id}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <Plus className="mr-2 h-4 w-4" /> New Lesson
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      {isLessonsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : lessons.length > 0 ? (
                        <div className="space-y-4">
                          {lessons.map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                              <div className="bg-primary/10 p-2 rounded-lg mr-4">
                                <BookOpen className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{lesson.title}</h4>
                                <div className="flex items-center mt-1">
                                  <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800">
                                    CEFR {lesson.cefrLevel}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(lesson.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <Link href={`/history/${lesson.id}`}>
                                <Button variant="outline" size="sm">View</Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                          <p className="text-gray-500 mb-6">
                            No lessons have been created for this student yet.
                          </p>
                          <Link href={`/generate?studentId=${student.id}`}>
                            <Button className="bg-primary hover:bg-primary/90">
                              <Plus className="mr-2 h-4 w-4" /> Create First Lesson
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
