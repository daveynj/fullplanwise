import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lesson } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { 
  BookOpen, 
  Search, 
  Download, 
  Plus, 
  Filter, 
  Calendar, 
  Loader2,
  Trash2,
  AlertTriangle 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LessonHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cefrFilter, setCefrFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const { toast } = useToast();
  
  // Fetch all lessons
  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    retry: false,
  });
  
  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await apiRequest("DELETE", `/api/lessons/${lessonId}`);
    },
    onSuccess: () => {
      // Invalidate lessons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      
      toast({
        title: "Lesson deleted",
        description: "The lesson has been permanently removed.",
      });
      
      // Reset state
      setLessonToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle delete confirmation
  const handleDeleteLesson = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };
  
  // Confirm deletion
  const confirmDelete = () => {
    if (lessonToDelete) {
      deleteLessonMutation.mutate(lessonToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  // Filter lessons based on search and filters
  const filteredLessons = lessons.filter((lesson: Lesson) => {
    const matchesSearch = 
      searchQuery === "" || 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCefr = cefrFilter === "" || cefrFilter === "all" || lesson.cefrLevel === cefrFilter;
    
    let matchesDate = true;
    if (dateFilter && dateFilter !== "all" && lesson.createdAt) {
      const lessonDate = new Date(lesson.createdAt);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (dateFilter === "today") {
        matchesDate = lessonDate.toDateString() === today.toDateString();
      } else if (dateFilter === "week") {
        matchesDate = lessonDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate = lessonDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesCefr && matchesDate;
  });
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get label for date filter
  const getDateFilterLabel = (filter: string) => {
    switch (filter) {
      case "today": return "Today";
      case "week": return "Past Week";
      case "month": return "Past Month";
      case "all": return "All Time";
      default: return "Time Period";
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-nunito font-bold">Lesson History</h1>
                  <p className="text-gray-600">All your created lessons in one place</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link href="/generate">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" /> New Lesson
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Search and filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                  <Input 
                    type="text" 
                    placeholder="Search by title or topic..." 
                    className="pl-10 pr-4 py-2 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                </div>
                
                <div className="relative">
                  <Select value={cefrFilter} onValueChange={setCefrFilter}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-gray-400" />
                        <span>
                          {cefrFilter === "all" ? "All Levels" : cefrFilter || "CEFR Level"}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span>
                          {getDateFilterLabel(dateFilter)}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Lessons list */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLessons.length > 0 ? (
                <div className="space-y-4">
                  {filteredLessons.map((lesson: Lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start">
                            <div className="bg-primary/10 p-2 rounded-lg mr-4 flex-shrink-0">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-nunito font-semibold text-lg">{lesson.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  CEFR {lesson.cefrLevel}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {lesson.createdAt ? formatDate(lesson.createdAt) : 'No date'}
                                </span>
                                {lesson.studentId && (
                                  <Badge variant="outline" className="bg-gray-100">
                                    Student #{lesson.studentId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                            <Link href={`/history/${lesson.id}`}>
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                View Lesson
                              </Button>
                            </Link>
                            <Link href={`/fullscreen/${lesson.id}`}>
                              <Button size="sm" variant="outline" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700">
                                Fullscreen View
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                              onClick={() => handleDeleteLesson(lesson)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                    {searchQuery || (cefrFilter && cefrFilter !== "all") || (dateFilter && dateFilter !== "all") ? (
                      <>
                        <h3 className="text-xl font-nunito font-semibold mb-2">No lessons found</h3>
                        <p className="text-gray-500 text-center mb-4">
                          No lessons match your current filters.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery("");
                            setCefrFilter("all");
                            setDateFilter("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-nunito font-semibold mb-2">No lessons yet</h3>
                        <p className="text-gray-500 text-center mb-4">
                          You haven't created any lessons yet. Generate your first lesson to get started.
                        </p>
                        <Link href="/generate">
                          <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Create Your First Lesson
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lessonToDelete ? (
                <>
                  Are you sure you want to delete the lesson <span className="font-semibold">"{lessonToDelete.title}"</span>?
                  <br />
                  <br />
                  This action cannot be undone and all lesson content will be permanently removed.
                </>
              ) : (
                <>Confirm lesson deletion</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLessonMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete Lesson</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
