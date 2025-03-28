import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StudentForm } from "@/components/student/student-form";
import { StudentCard } from "@/components/student/student-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { Student, InsertStudent } from "@shared/schema";

export default function StudentsPage() {
  const { toast } = useToast();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    retry: false,
  });
  
  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (studentData: Omit<InsertStudent, 'teacherId'>) => {
      const res = await apiRequest("POST", "/api/students", studentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsAddStudentOpen(false);
      toast({
        title: "Student added successfully!",
        description: "The new student has been added to your list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add student",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student deleted",
        description: "The student has been removed from your list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete student",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddStudent = (studentData: Omit<InsertStudent, 'teacherId'>) => {
    addStudentMutation.mutate(studentData);
  };
  
  const handleDeleteStudent = (studentId: number) => {
    deleteStudentMutation.mutate(studentId);
  };
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.cefrLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                <h1 className="text-2xl md:text-3xl font-nunito font-bold">Students</h1>
                <p className="text-gray-600">Manage your student profiles and track progress</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-nunito text-xl">Add New Student</DialogTitle>
                    </DialogHeader>
                    <StudentForm onSubmit={handleAddStudent} isSubmitting={addStudentMutation.isPending} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Search and filters */}
            <div className="mb-6">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search students by name or level..." 
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
              </div>
            </div>
            
            {/* Students grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard 
                    key={student.id} 
                    student={student} 
                    onDelete={() => handleDeleteStudent(student.id)} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mb-4" />
                  {searchQuery ? (
                    <>
                      <h3 className="text-xl font-nunito font-semibold mb-2">No students found</h3>
                      <p className="text-gray-500 text-center mb-4">
                        No students match your search query "{searchQuery}".
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-nunito font-semibold mb-2">No students yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        Add your first student to start creating personalized lessons.
                      </p>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => setIsAddStudentOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Student
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
