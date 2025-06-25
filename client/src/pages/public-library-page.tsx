import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Copy, Search, Filter, Eye, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";

interface PublicLesson {
  id: number;
  title: string;
  topic: string;
  cefrLevel: string;
  category: string;
  createdAt: string;
  contentPreview?: string;
}

interface PaginatedPublicLessons {
  lessons: PublicLesson[];
  total: number;
}

export default function PublicLibraryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cefrFilter, setCefrFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [cefrFilter, categoryFilter]);

  const { data: publicLessons, isLoading } = useQuery<PaginatedPublicLessons>({
    queryKey: [
      "/api/public-lessons",
      {
        page: currentPage,
        pageSize,
        search: searchQuery,
        cefrLevel: cefrFilter,
        category: categoryFilter,
      }
    ],
    staleTime: 5000,
  });

  const handleCopyLesson = async (lessonId: number) => {
    try {
      await apiRequest(`/api/lessons/${lessonId}/copy`, {
        method: "POST",
      });
      
      toast({
        title: "Lesson copied",
        description: "The lesson has been added to your personal library",
      });
    } catch (error: any) {
      toast({
        title: "Error copying lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalPages = publicLessons ? Math.ceil(publicLessons.total / pageSize) : 0;

  const getCefrColor = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-700",
      A2: "bg-blue-100 text-blue-700", 
      B1: "bg-yellow-100 text-yellow-700",
      B2: "bg-orange-100 text-orange-700",
      C1: "bg-red-100 text-red-700",
      C2: "bg-purple-100 text-purple-700",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Public Lesson Library</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Access our curated collection of professional ESL lessons. Copy any lesson to your personal library at no credit cost.
            </p>
          </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lessons..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={cefrFilter} onValueChange={setCefrFilter}>
              <SelectTrigger>
                <SelectValue placeholder="CEFR Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A1">A1 - Beginner</SelectItem>
                <SelectItem value="A2">A2 - Elementary</SelectItem>
                <SelectItem value="B1">B1 - Intermediate</SelectItem>
                <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                <SelectItem value="C1">C1 - Advanced</SelectItem>
                <SelectItem value="C2">C2 - Proficiency</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(PUBLIC_LIBRARY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {publicLessons?.total || 0} lessons found
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicLessons?.lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">
                    {lesson.title}
                  </CardTitle>
                  <Badge className={getCefrColor(lesson.cefrLevel)}>
                    {lesson.cefrLevel}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {lesson.topic}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {PUBLIC_LIBRARY_LABELS[lesson.category as keyof typeof PUBLIC_LIBRARY_LABELS] || lesson.category}
                    </Badge>
                  </div>
                  
                  {lesson.contentPreview && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {lesson.contentPreview}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Link href={`/lessons/${lesson.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      onClick={() => handleCopyLesson(lesson.id)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600 px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!publicLessons?.lessons || publicLessons.lessons.length === 0) && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No lessons found</h3>
          <p className="text-gray-500">Try adjusting your search filters to find more lessons.</p>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}