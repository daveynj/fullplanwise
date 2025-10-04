import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lesson, Student, CATEGORY_LABELS, CATEGORY_COLORS, LessonCategory } from "@shared/schema";
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
  Plus, 
  Filter, 
  Calendar, 
  Loader2,
  Trash2,
  AlertTriangle,
  UserPlus,
  Tag,
  Edit,
  Share
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define interface for paginated response
interface PaginatedLessons {
  lessons: Lesson[];
  total: number;
}

export default function LessonHistoryPage() {
  const { user } = useAuth();
  
  // Get teacherId from URL params for admin viewing other users' libraries
  const urlParams = new URLSearchParams(window.location.search);
  const teacherIdParam = urlParams.get('teacherId');
  const isViewingOtherUser = teacherIdParam && user?.isAdmin;
  const effectiveTeacherId = isViewingOtherUser ? parseInt(teacherIdParam) : user?.id;
  
  // State for filters and UI
  const [searchInput, setSearchInput] = useState(""); // Immediate input value
  const [searchQuery, setSearchQuery] = useState(""); // Debounced query sent to API
  const [cefrFilter, setCefrFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deletionInfo, setDeletionInfo] = useState<{assignmentCount: number, affectedStudentIds: number[], lessonTitle: string} | null>(null);
  const [deletionStrategy, setDeletionStrategy] = useState<'delete_all' | 'keep_vocabulary'>('delete_all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [lessonToAssign, setLessonToAssign] = useState<Lesson | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [lessonToEditCategory, setLessonToEditCategory] = useState<Lesson | null>(null);
  const [newCategory, setNewCategory] = useState<string>("general");
  const { toast } = useToast();
  
  // Debounce search input to reduce frequent API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Direct fetch without React Query for debugging production issues
  const debugFetchLessons = useCallback(async () => {
    try {
      console.log('Attempting direct fetch of lessons...');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchQuery,
        cefrLevel: cefrFilter,
        dateFilter: dateFilter,
        category: categoryFilter,
        ...(effectiveTeacherId && effectiveTeacherId !== user?.id ? { teacherId: effectiveTeacherId.toString() } : {})
      });
      
      const response = await fetch(`/api/lessons?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Direct fetch response status:', response.status);
      
      if (!response.ok) {
        console.error('Direct fetch error:', response.status, response.statusText);
        const text = await response.text();
        console.error('Error details:', text);
        return null;
      }
      
      const data = await response.json();
      console.log('Direct fetch successful, got lessons:', data);
      return data;
    } catch (error) {
      console.error('Direct fetch exception:', error);
      return null;
    }
  }, []);

  // State for fallback data
  const [fallbackData, setFallbackData] = useState<PaginatedLessons | null>(null);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  
  // Fetch paginated lessons with server-side filtering
  const { data: lessonData, isLoading, isError } = useQuery<PaginatedLessons>({
    queryKey: [
      "/api/lessons", 
      { 
        page: currentPage,
        search: searchQuery,
        cefrLevel: cefrFilter,
        dateFilter: dateFilter,
        category: categoryFilter,
        teacherId: effectiveTeacherId
      }
    ],
    retry: 1,
    staleTime: 0, // Don't use stale data in production environment
    refetchOnWindowFocus: false,
    enabled: !!effectiveTeacherId
  });
  
  // Fallback loading if React Query fails
  useEffect(() => {
    if (isError) {
      setIsLoadingFallback(true);
      
      debugFetchLessons()
        .then(result => {
          setFallbackData(result);
          if (result) {
            toast({
              title: "Fallback data loaded",
              description: "Using direct connection to bypass cache issues.",
            });
          }
        })
        .finally(() => {
          setIsLoadingFallback(false);
        });
    }
  }, [isError, debugFetchLessons, toast]);
  
  // Manual refresh for debugging
  const handleManualRefresh = useCallback(() => {
    setFallbackData(null);
    // Explicitly include all query parameters to ensure proper invalidation
    queryClient.invalidateQueries({ 
      queryKey: [
        "/api/lessons", 
        { 
          page: currentPage,
          search: searchQuery,
          cefrLevel: cefrFilter,
          dateFilter: dateFilter,
          category: categoryFilter,
          teacherId: effectiveTeacherId
        }
      ] 
    });
    setIsLoadingFallback(true);
    debugFetchLessons()
      .then(result => {
        setFallbackData(result);
        toast({
          title: "Lessons refreshed",
          description: "Lesson library has been manually refreshed",
        });
      })
      .finally(() => {
        setIsLoadingFallback(false);
      });
  }, [debugFetchLessons, toast, currentPage, searchQuery, cefrFilter, dateFilter, categoryFilter, effectiveTeacherId, user]);
  
  // Use data from React Query or fallback
  const effectiveData = lessonData || fallbackData;
  const effectiveLoading = isLoading || isLoadingFallback;
  
  // Fetch all students for assignment dropdown
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    retry: false,
  });
  
  // Check deletion info (assignments) mutation
  const checkDeletionInfoMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await apiRequest("GET", `/api/lessons/${lessonId}/deletion-info`);
      return await response.json();
    },
    onSuccess: (data) => {
      setDeletionInfo(data);
      setDeleteDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error checking lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete lesson mutation with strategy
  const deleteLessonMutation = useMutation({
    mutationFn: async ({ lessonId, strategy }: { lessonId: number, strategy: 'delete_all' | 'keep_vocabulary' }) => {
      // If no assignments, use simple delete
      if (!deletionInfo || deletionInfo.assignmentCount === 0) {
        await apiRequest("DELETE", `/api/lessons/${lessonId}`);
        return { strategy: null, message: "Lesson deleted successfully" };
      } else {
        // If assignments exist, use strategy-based delete
        const response = await apiRequest("POST", `/api/lessons/${lessonId}/delete-with-strategy`, { strategy });
        return await response.json();
      }
    },
    onSuccess: (data) => {
      // Invalidate lessons query to refresh the list - use precise query parameters
      queryClient.invalidateQueries({ 
        queryKey: [
          "/api/lessons", 
          { 
            page: currentPage,
            search: searchQuery,
            cefrLevel: cefrFilter,
            dateFilter: dateFilter
          }
        ] 
      });
      
      // Also invalidate student queries if lesson had assignments
      if (deletionInfo && deletionInfo.affectedStudentIds.length > 0) {
        deletionInfo.affectedStudentIds.forEach(studentId => {
          queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
        });
      }
      
      // Use message from server response instead of stale state
      toast({
        title: "Lesson deleted",
        description: data.message,
      });
      
      // Reset state
      setLessonToDelete(null);
      setDeletionInfo(null);
      setDeletionStrategy('delete_all');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Assign lesson to student mutation
  const assignLessonMutation = useMutation({
    mutationFn: async ({ lessonId, studentId }: { lessonId: number, studentId: number }) => {
      const response = await apiRequest("PUT", `/api/lessons/${lessonId}/assign`, { studentId });
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate lessons and student lessons queries to refresh the lists - use precise query parameters
      queryClient.invalidateQueries({ 
        queryKey: [
          "/api/lessons", 
          { 
            page: currentPage,
            search: searchQuery,
            cefrLevel: cefrFilter,
            dateFilter: dateFilter
          }
        ] 
      });
      
      if (selectedStudentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/lessons/student/${selectedStudentId}`] });
      }
      
      toast({
        title: "Lesson assigned",
        description: `The lesson has been assigned to the student successfully.`,
      });
      
      // Reset state
      setAssignDialogOpen(false);
      setLessonToAssign(null);
      setSelectedStudentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle delete confirmation
  const handleDeleteLesson = (lesson: Lesson) => {
    // Reset state to ensure fresh data
    setLessonToDelete(lesson);
    setDeletionInfo(null); // Clear any stale deletion info
    setDeletionStrategy('delete_all'); // Reset to default
    // Check if lesson has assignments
    checkDeletionInfoMutation.mutate(lesson.id);
  };
  
  // Confirm deletion
  const confirmDelete = () => {
    if (lessonToDelete) {
      deleteLessonMutation.mutate({ 
        lessonId: lessonToDelete.id, 
        strategy: deletionStrategy 
      });
    }
    setDeleteDialogOpen(false);
  };
  
  // Handle assign to student
  const handleAssignLesson = (lesson: Lesson) => {
    setLessonToAssign(lesson);
    setSelectedStudentId(lesson.studentId || null);
    setAssignDialogOpen(true);
  };
  
  // Confirm assignment
  const confirmAssign = () => {
    if (lessonToAssign && selectedStudentId) {
      assignLessonMutation.mutate({ 
        lessonId: lessonToAssign.id, 
        studentId: selectedStudentId 
      });
    } else {
      toast({
        title: "Please select a student",
        description: "You must select a student to assign this lesson to.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditCategory = (lesson: Lesson) => {
    setLessonToEditCategory(lesson);
    setNewCategory(lesson.category || 'general');
    setEditCategoryDialogOpen(true);
  };
  
  // Edit category mutation
  const editCategoryMutation = useMutation({
    mutationFn: async ({ lessonId, category }: { lessonId: number, category: string }) => {
      const response = await apiRequest("PATCH", `/api/lessons/${lessonId}`, { category });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [
          "/api/lessons", 
          { 
            page: currentPage,
            search: searchQuery,
            cefrLevel: cefrFilter,
            dateFilter: dateFilter,
            category: categoryFilter
          }
        ] 
      });
      
      toast({
        title: "Category updated",
        description: "The lesson category has been updated successfully.",
      });
      
      setEditCategoryDialogOpen(false);
      setLessonToEditCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const confirmEditCategory = () => {
    if (lessonToEditCategory && newCategory) {
      editCategoryMutation.mutate({ 
        lessonId: lessonToEditCategory.id, 
        category: newCategory 
      });
    }
  };
  
  // Extract data from the paginated response (use effectiveData to account for fallback)
  const lessons = effectiveData?.lessons || [];
  const totalLessons = effectiveData?.total || 0;
  const totalPages = Math.ceil(totalLessons / 10); // 10 items per page
  
  // Using server-side filtering now - no need for client-side filtering
  
  // Handle page change
  const goToPage = (page: number) => {
    // Update current page state
    setCurrentPage(page);
    
    // Force a fresh fetch from the server for the new page
    // This is important to ensure we get the correct data for the current page
    queryClient.resetQueries({ 
      queryKey: [
        "/api/lessons", 
        { 
          page: page,
          search: searchQuery,
          cefrLevel: cefrFilter,
          dateFilter: dateFilter
        }
      ],
      exact: true  // Only reset this exact query, not all queries
    });
  };
  
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
                  <h1 className="text-2xl md:text-3xl font-nunito font-bold">
                    {isViewingOtherUser ? "User's Lesson Library" : "Lesson Library"}
                  </h1>
                  <p className="text-gray-600">
                    {isViewingOtherUser ? "Viewing another user's lessons" : "All your created lessons in one place"}
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="lg:col-span-2 relative">
                  <Input 
                    type="text" 
                    placeholder="Search by title or topic..." 
                    className="pl-10 pr-4 py-2 w-full"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setCurrentPage(1); // Reset to first page on search change
                    }}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                </div>
                
                <div className="relative">
                  <Select 
                    value={cefrFilter} 
                    onValueChange={(value) => {
                      setCefrFilter(value);
                      setCurrentPage(1); // Reset to first page on filter change
                    }}
                  >
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
                  <Select 
                    value={categoryFilter} 
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                      setCurrentPage(1); // Reset to first page on category filter change
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-gray-400" />
                        <span>
                          {categoryFilter === "all" ? "All Categories" : CATEGORY_LABELS[categoryFilter as LessonCategory] || "Category"}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${CATEGORY_COLORS[key as LessonCategory]?.split(' ')[0] || 'bg-gray-100'}`}></div>
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Select 
                    value={dateFilter} 
                    onValueChange={(value) => {
                      setDateFilter(value);
                      setCurrentPage(1); // Reset to first page on date filter change
                    }}
                  >
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
              
              {/* Refresh button */}
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoadingFallback}
                  className="flex items-center gap-2"
                >
                  {isLoadingFallback ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {isLoadingFallback ? "Refreshing..." : "Refresh Lessons"}
                </Button>
              </div>
            
              {/* Lessons list */}
              {effectiveLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (effectiveData?.lessons?.length || 0) > 0 ? (
                <>
                  <div className="space-y-4">
                    {lessons.map((lesson: Lesson) => (
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
                                  {lesson.category && (
                                    <Badge variant="outline" className={CATEGORY_COLORS[lesson.category as LessonCategory] || CATEGORY_COLORS.general}>
                                      {CATEGORY_LABELS[lesson.category as LessonCategory] || 'General English'}
                                    </Badge>
                                  )}
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
                            
                            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
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
                                className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700"
                                onClick={() => {
                                  const shareUrl = `${window.location.origin}/lessons/${lesson.id}`;
                                  navigator.clipboard.writeText(shareUrl).then(() => {
                                    toast({
                                      title: "Share link copied!",
                                      description: "Students can now access this lesson without signing up.",
                                    });
                                  }).catch(() => {
                                    toast({
                                      title: "Copy failed",
                                      description: `Share this URL: ${shareUrl}`,
                                      variant: "destructive",
                                    });
                                  });
                                }}
                              >
                                <Share className="mr-2 h-4 w-4" /> Share
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                                onClick={() => handleAssignLesson(lesson)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" /> Assign to Student
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                                onClick={() => handleEditCategory(lesson)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Category
                              </Button>
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
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => goToPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={currentPage === page ? "bg-primary" : ""}
                          >
                            {page}
                          </Button>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                    {searchInput || (cefrFilter && cefrFilter !== "all") || (dateFilter && dateFilter !== "all") ? (
                      <>
                        <h3 className="text-xl font-nunito font-semibold mb-2">No lessons found</h3>
                        <p className="text-gray-500 text-center mb-4">
                          No lessons match your current filters.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchInput("");
                            setSearchQuery("");
                            setCefrFilter("all");
                            setDateFilter("all");
                            setCategoryFilter("all");
                            setCurrentPage(1); // Reset to first page on filter clear
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
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {lessonToDelete && deletionInfo ? (
                <>
                  <div>
                    Are you sure you want to delete the lesson <span className="font-semibold">"{lessonToDelete.title}"</span>?
                  </div>
                  
                  {deletionInfo.assignmentCount > 0 ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ This lesson is assigned to {deletionInfo.assignmentCount} student{deletionInfo.assignmentCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Please choose what happens to their vocabulary:
                        </p>
                      </div>
                      
                      <RadioGroup 
                        value={deletionStrategy} 
                        onValueChange={(value) => setDeletionStrategy(value as 'delete_all' | 'keep_vocabulary')}
                        className="space-y-3 mt-4"
                      >
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="delete_all" id="delete_all" className="mt-1" />
                          <Label htmlFor="delete_all" className="cursor-pointer flex-1">
                            <div className="font-semibold text-sm">Delete lesson and vocabulary</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Remove the lesson from library and delete all vocabulary words from student profiles. 
                              Use this for a complete cleanup.
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="keep_vocabulary" id="keep_vocabulary" className="mt-1" />
                          <Label htmlFor="keep_vocabulary" className="cursor-pointer flex-1">
                            <div className="font-semibold text-sm">Delete lesson, keep vocabulary</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Remove the lesson from library but preserve vocabulary in student profiles as standalone words.
                              Students keep their progress.
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      This lesson has no student assignments and will be permanently removed from your library.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Checking lesson assignments...</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkDeletionInfoMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!deletionInfo || checkDeletionInfoMutation.isPending}
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

      {/* Assign to Student Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="h-5 w-5 text-blue-500 mr-2" />
              Assign Lesson to Student
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              {lessonToAssign ? (
                <>
                  Assign the lesson <span className="font-semibold">"{lessonToAssign.title}"</span> to a student.
                </>
              ) : (
                <>Select a student to assign this lesson to.</>
              )}
            </p>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="student-select" className="text-sm font-medium">
                  Select Student
                </label>
                
                {students.length > 0 ? (
                  <Select
                    value={selectedStudentId?.toString() || ""}
                    onValueChange={(value) => setSelectedStudentId(Number(value))}
                  >
                    <SelectTrigger id="student-select" className="w-full">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border rounded-md border-gray-200 bg-gray-50 text-center">
                    <p className="text-sm text-gray-500">No students found. Create a student first.</p>
                    <Link href="/students/new">
                      <Button size="sm" variant="outline" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" /> Create Student
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setAssignDialogOpen(false);
                setLessonToAssign(null);
                setSelectedStudentId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAssign}
              className="bg-primary hover:bg-primary/90"
              disabled={!selectedStudentId || assignLessonMutation.isPending}
            >
              {assignLessonMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>Assign Lesson</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lesson Category</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Change the category for: <span className="font-semibold">{lessonToEditCategory?.title}</span>
              </p>
              
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${CATEGORY_COLORS[key as LessonCategory]?.split(' ')[0] || 'bg-gray-100'}`}></div>
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditCategoryDialogOpen(false);
                setLessonToEditCategory(null);
                setNewCategory("general");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmEditCategory}
              className="bg-primary hover:bg-primary/90"
              disabled={editCategoryMutation.isPending}
            >
              {editCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>Save Category</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}