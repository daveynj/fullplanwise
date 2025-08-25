import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Users, Clock, BarChart2, ArrowRight, 
  CheckCircle2, Lightbulb, PenSquare, Award
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Lesson, Student } from "@shared/schema";
import { useState } from "react";
import { useFreeTrial } from "@/hooks/use-free-trial";
import { format } from 'date-fns';

// Define interface for paginated lessons
interface PaginatedLessons {
  lessons: Lesson[];
  total: number;
}

const FreeTrialBanner = () => {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();

  if (!isFreeTrialActive || !freeTrialEndDate) {
    return null;
  }

  const endDate = format(freeTrialEndDate, "MMMM do, yyyy");

  return (
    <div className="bg-brand-yellow text-brand-navy text-center py-3 px-4 font-semibold rounded-lg mb-6">
      🎉 <span className="font-bold">Limited Time Offer:</span> Get unlimited lesson generations for FREE until {endDate}!
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [showSteps, setShowSteps] = useState(false);
  const { isFreeTrialActive } = useFreeTrial();
  
  // Fetch students for quick access
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    retry: false,
  });
  
  // Fetch recent lessons (now returns paginated response)
  const { data: lessonData } = useQuery<PaginatedLessons>({
    queryKey: ["/api/lessons"],
    retry: false,
  });

  // Extract lesson array from the paginated response
  const lessons = lessonData?.lessons || [];
  const totalLessons = lessonData?.total || 0;
  
  // For demo purposes, we'll show the most recent lessons
  const recentLessons = lessons.slice(0, 3);

  // Get stats for the dashboard
  const stats = [
    { 
      title: "Total Lessons", 
      value: totalLessons, 
      icon: <BookOpen className="h-10 w-10 text-primary" />, 
      trend: "+5% from last week",
      color: "bg-blue-50" 
    },
    { 
      title: "Students", 
      value: students.length, 
      icon: <Users className="h-10 w-10 text-[#FFB400]" />, 
      trend: "No change",
      color: "bg-amber-50" 
    },
    { 
      title: "Credits", 
      value: isFreeTrialActive ? "Unlimited" : (user?.credits || 0), 
      icon: <Clock className="h-10 w-10 text-[#28A745]" />, 
      trend: isFreeTrialActive ? "Free Trial Active" : (user?.credits ? "Available for lessons" : "Purchase credits"),
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
              <h1 className="text-3xl md:text-4xl font-nunito font-bold mb-3">Welcome, {user?.fullName}!</h1>
              <p className="text-gray-700 text-xl font-medium">Here's what's happening with your PLAN WISE ESL teaching</p>
            </div>
            
            <FreeTrialBanner />

            {/* Onboarding Widget - Only shown when user has 0 lessons */}
            {totalLessons === 0 && (
              <Card className="mb-8 border-2 border-primary/30 bg-primary/5 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="shrink-0 bg-primary/10 p-4 rounded-full">
                      <BookOpen className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-nunito font-bold mb-2">Get Started with Your First Lesson</h2>
                      <p className="text-gray-600 mb-4">
                        Create your first AI-powered ESL lesson in just a few simple steps. In about 2-3 minutes, our system will generate a complete lesson with warm-up activities, reading materials, vocabulary, and more!
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <Link href="/generate">
                          <Button size="lg" className="bg-primary hover:bg-primary/90">
                            Create My First Lesson
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowSteps(!showSteps)}
                          className="flex items-center"
                        >
                          {showSteps ? 'Hide Steps' : 'Show How It Works'} 
                          {showSteps ? null : <ArrowRight className="ml-1 h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step-by-step guide - toggleable */}
                  {showSteps && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-nunito font-bold text-2xl mb-6">How to Create Your First Lesson:</h3>
                      <div className="space-y-6">
                        <div className="flex gap-5 items-start">
                          <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 text-lg font-bold">1</div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">Choose a Topic</h4>
                            <p className="text-gray-700 text-lg">Enter any topic you're interested in teaching. For example: "Environmental Conservation" or "Food and Culture".</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-5 items-start">
                          <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 text-lg font-bold">2</div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">Select Proficiency Level</h4>
                            <p className="text-gray-700 text-lg">Choose the CEFR level that matches your students' ability (A1-C2).</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-5 items-start">
                          <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 text-lg font-bold">3</div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">Click Generate</h4>
                            <p className="text-gray-700 text-lg">Our AI will create a complete lesson in 2-3 minutes. You can use it immediately or make adjustments.</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-5 items-start">
                          <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">That's it! Your lesson is ready to use</h4>
                            <p className="text-gray-700 text-lg">All lessons include warm-up activities, vocabulary, reading materials, comprehension questions, and more!</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 flex justify-center">
                        <Link href="/generate">
                          <Button className="bg-green-600 hover:bg-green-700 px-8 py-6 text-lg font-bold">
                            Start Creating Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
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
                        <p className="text-gray-600 text-lg font-medium">{stat.title}</p>
                        <h3 className="text-3xl font-nunito font-bold my-1">{stat.value}</h3>
                        <p className="text-sm text-gray-600">{stat.trend}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="mb-10">
              <h2 className="text-2xl font-nunito font-bold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/generate">
                  <Button 
                    className={`w-full ${totalLessons === 0 ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'bg-primary hover:bg-primary/90'} h-auto py-5 text-center relative`}
                  >
                    {totalLessons === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                        Start Here!
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg">
                        {totalLessons === 0 ? 'Create Your First Lesson' : 'Generate New Lesson'}
                      </p>
                      <p className="text-sm text-white/90 mt-1">
                        {totalLessons === 0 ? 'Ready in about 2-3 minutes' : 'Create a lesson plan'}
                      </p>
                    </div>
                  </Button>
                </Link>
                <Link href="/students">
                  <Button variant="outline" className="w-full h-auto py-5 text-center">
                    <div>
                      <p className="font-bold text-lg">Add Student</p>
                      <p className="text-sm text-gray-600 mt-1">Create a student profile</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/buy-credits">
                  <Button variant="outline" className="w-full h-auto py-5 text-center" disabled={isFreeTrialActive}>
                    <div>
                      <p className="font-bold text-lg">Purchase Credits</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {isFreeTrialActive ? "Disabled during trial" : "Add more lesson credits"}
                      </p>
                    </div>
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="outline" className="w-full h-auto py-5 text-center">
                    <div>
                      <p className="font-bold text-lg">Lesson History</p>
                      <p className="text-sm text-gray-600 mt-1">View past lessons</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Feature Highlights - Only shown for users with 0 lessons */}
            {totalLessons === 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-nunito font-bold mb-6">What You Can Do with PLAN WISE ESL</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-4 rounded-full mb-5">
                          <Lightbulb className="h-10 w-10 text-blue-600" />
                        </div>
                        <h3 className="font-nunito font-bold text-xl mb-3">Complete AI-Generated Lessons</h3>
                        <p className="text-gray-700 text-lg">Get full lessons including warm-up activities, vocabulary practice, reading comprehension, and discussion questions.</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-green-100 p-4 rounded-full mb-5">
                          <PenSquare className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="font-nunito font-bold text-xl mb-3">Customized for Any Level</h3>
                        <p className="text-gray-700 text-lg">Choose from CEFR levels A1 to C2 to match your students' proficiency with appropriate vocabulary and grammar.</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-purple-100 p-4 rounded-full mb-5">
                          <Award className="h-10 w-10 text-purple-600" />
                        </div>
                        <h3 className="font-nunito font-bold text-xl mb-3">Ready-to-Teach Format</h3>
                        <p className="text-gray-700 text-lg">All lessons come in a clear, structured format that you can use immediately in your classroom with minimal preparation.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Lessons */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="font-nunito text-2xl font-bold">Recent Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLessons.length > 0 ? (
                    <div className="space-y-5">
                      {recentLessons.map((lesson, idx) => (
                        <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="bg-primary/10 p-3 rounded-lg mr-4">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{lesson.title}</h4>
                            <p className="text-sm text-gray-600 font-medium">
                              {new Date(lesson.createdAt).toLocaleDateString()}
                              {lesson.studentId && ` • Student #${lesson.studentId}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <BookOpen className="h-14 w-14 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 text-lg font-medium mb-2">No lessons yet</p>
                      <Link href="/generate">
                        <Button className="mt-4 bg-primary hover:bg-primary/90 px-6 py-3 text-lg font-bold">
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
                  <CardTitle className="font-nunito text-2xl font-bold">Your Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length > 0 ? (
                    <div className="space-y-5">
                      {students.slice(0, 5).map((student: Student, idx: number) => (
                        <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="bg-amber-100 p-3 rounded-lg mr-4">
                            <Users className="h-6 w-6 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{student.name}</h4>
                            <p className="text-sm text-gray-600 font-medium">
                              Level: {student.cefrLevel}
                              {student.email && ` • ${student.email}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Users className="h-14 w-14 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 text-lg font-medium mb-2">No students added yet</p>
                      <Link href="/students">
                        <Button className="mt-4 bg-primary hover:bg-primary/90 px-6 py-3 text-lg font-bold">
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
