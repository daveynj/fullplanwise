import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, BarChart2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch students for quick access
  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });
  
  // Fetch recent lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/lessons"],
    retry: false,
  });

  // For demo purposes, we'll show the most recent lessons
  const recentLessons = lessons.slice(0, 3);

  // Get stats for the dashboard
  const stats = [
    { 
      title: "Total Lessons", 
      value: lessons.length, 
      icon: <BookOpen className="h-8 w-8 text-primary" />, 
      trend: "+5% from last week",
      color: "bg-blue-50" 
    },
    { 
      title: "Students", 
      value: students.length, 
      icon: <Users className="h-8 w-8 text-[#FFB400]" />, 
      trend: "No change",
      color: "bg-amber-50" 
    },
    { 
      title: "Credits", 
      value: user?.credits || 0, 
      icon: <Clock className="h-8 w-8 text-[#28A745]" />, 
      trend: user?.credits ? "Available for lessons" : "Purchase credits",
      color: "bg-green-50" 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome section */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-nunito font-bold mb-2">Welcome, {user?.fullName}!</h1>
              <p className="text-gray-600">Here's what's happening with your PLAN WISE ESL teaching</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">{stat.title}</p>
                        <h3 className="text-2xl font-nunito font-bold">{stat.value}</h3>
                        <p className="text-xs text-gray-500">{stat.trend}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-nunito font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/generate">
                  <Button className="w-full bg-primary hover:bg-primary/90 h-auto py-4 text-left flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-left">Generate New Lesson</p>
                      <p className="text-xs text-white/80 mt-1">Create a lesson plan</p>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/students">
                  <Button variant="outline" className="w-full h-auto py-4 text-left flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-left">Add Student</p>
                      <p className="text-xs text-gray-500 mt-1">Create a student profile</p>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/buy-credits">
                  <Button variant="outline" className="w-full h-auto py-4 text-left flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-left">Purchase Credits</p>
                      <p className="text-xs text-gray-500 mt-1">Add more lesson credits</p>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="outline" className="w-full h-auto py-4 text-left flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-left">Lesson History</p>
                      <p className="text-xs text-gray-500 mt-1">View past lessons</p>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Lessons */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="font-nunito">Recent Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLessons.length > 0 ? (
                    <div className="space-y-4">
                      {recentLessons.map((lesson, idx) => (
                        <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="bg-primary/10 p-2 rounded-lg mr-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{lesson.title}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(lesson.createdAt).toLocaleDateString()}
                              {lesson.studentId && ` • Student #${lesson.studentId}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No lessons yet</p>
                      <Link href="/generate">
                        <Button className="mt-3 bg-primary hover:bg-primary/90">
                          Create Your First Lesson
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Students */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="font-nunito">Your Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length > 0 ? (
                    <div className="space-y-4">
                      {students.slice(0, 5).map((student, idx) => (
                        <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="bg-amber-100 p-2 rounded-lg mr-3">
                            <Users className="h-5 w-5 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{student.name}</h4>
                            <p className="text-xs text-gray-500">
                              Level: {student.cefrLevel}
                              {student.email && ` • ${student.email}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No students added yet</p>
                      <Link href="/students">
                        <Button className="mt-3 bg-primary hover:bg-primary/90">
                          Add Your First Student
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
