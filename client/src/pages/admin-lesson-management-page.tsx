import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Globe, Eye, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";

interface Lesson {
  id: number;
  title: string;
  topic: string;
  cefrLevel: string;
  category: string;
  isPublic: boolean;
  publicCategory?: string;
  createdAt: string;
  teacherName: string;
}

interface PaginatedLessons {
  lessons: Lesson[];
  total: number;
}

export default function AdminLessonManagementPage() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedPublicCategory, setSelectedPublicCategory] = useState("general-english");
  const [makePublicDialogOpen, setMakePublicDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: adminLessons, isLoading, refetch } = useQuery<PaginatedLessons>({
    queryKey: ["/api/admin/lessons", { page: 1, pageSize: 50 }],
    staleTime: 5000,
  });

  const handleMakePublic = async () => {
    if (!selectedLesson) return;

    try {
      await apiRequest("PATCH", `/api/lessons/${selectedLesson.id}/public`, {
        publicCategory: selectedPublicCategory
      });

      toast({
        title: "Lesson made public",
        description: `"${selectedLesson.title}" is now available in the public library`,
      });

      setMakePublicDialogOpen(false);
      setSelectedLesson(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error making lesson public",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Lesson Management</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Manage lessons across the platform and curate the public library.
            </p>
          </div>

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
              {adminLessons?.lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg leading-tight">
                        {lesson.title}
                      </CardTitle>
                      <div className="flex flex-col gap-2">
                        <Badge className={getCefrColor(lesson.cefrLevel)}>
                          {lesson.cefrLevel}
                        </Badge>
                        {lesson.isPublic && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {lesson.topic} • by {lesson.teacherName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {lesson.category}
                        </Badge>
                        {lesson.publicCategory && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            {PUBLIC_LIBRARY_LABELS[lesson.publicCategory as keyof typeof PUBLIC_LIBRARY_LABELS]}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/lessons/${lesson.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {!lesson.isPublic && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setMakePublicDialogOpen(true);
                            }}
                            className="flex-1"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Make Public
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!adminLessons?.lessons || adminLessons.lessons.length === 0) && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No lessons found</h3>
              <p className="text-gray-500">Lessons will appear here as users create them.</p>
            </div>
          )}

          {/* Make Public Dialog */}
          <Dialog open={makePublicDialogOpen} onOpenChange={setMakePublicDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Lesson Public</DialogTitle>
                <DialogDescription>
                  Add "{selectedLesson?.title}" to the public library. Choose a category to help users find it easily.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Public Library Category</label>
                <Select value={selectedPublicCategory} onValueChange={setSelectedPublicCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PUBLIC_LIBRARY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setMakePublicDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMakePublic}>
                  Make Public
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}