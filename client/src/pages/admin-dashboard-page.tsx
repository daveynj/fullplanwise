import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Calendar, UserCheck, UserX, Clock, BookOpen, Users, Activity, TrendingUp, BarChart3, Eye, Zap } from "lucide-react";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@shared/schema";

interface UserWithLessonStats {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  credits: number;
  lessonCount: number;
  mostRecentLessonDate: string | null;
  subscriptionTier: string;
}

interface PaginatedUsers {
  users: UserWithLessonStats[];
  total: number;
}

interface AdminAnalytics {
  totalUsers: number;
  activeUsersLast30Days: number;
  activeUsersLast7Days: number;
  totalLessons: number;
  lessonsLast30Days: number;
  lessonsLast7Days: number;
  topCategories: Array<{category: string, count: number}>;
  userGrowthData: Array<{date: string, users: number, lessons: number}>;
  cefrDistribution: Array<{level: string, count: number}>;
  averageLessonsPerUser: number;
  topUsers: Array<{username: string, lessonCount: number, lastActive: string}>;
}

interface AdminLesson {
  id: number;
  title: string;
  topic: string;
  cefrLevel: string;
  category: string;
  createdAt: string;
  teacherName: string;
  contentPreview: string;
}

interface PaginatedLessons {
  lessons: AdminLesson[];
  total: number;
}

export function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // State for users tab
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // State for lessons tab
  const [lessonSearchInput, setLessonSearchInput] = useState<string>("");
  const [lessonSearchQuery, setLessonSearchQuery] = useState<string>("");
  const [lessonCategory, setLessonCategory] = useState<string>("all");
  const [lessonCefrLevel, setLessonCefrLevel] = useState<string>("all");
  const [lessonCurrentPage, setLessonCurrentPage] = useState<number>(1);
  const [lessonPageSize] = useState<number>(15);

  // Debounce search input for users
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery) {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  // Debounce search input for lessons
  useEffect(() => {
    const timer = setTimeout(() => {
      setLessonSearchQuery(lessonSearchInput);
      if (lessonSearchInput !== lessonSearchQuery) {
        setLessonCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [lessonSearchInput, lessonSearchQuery]);

  // Fetch admin analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics'],
    enabled: !authLoading && !!user?.isAdmin,
  });

  // Fetch users with lesson stats
  const { 
    data, 
    isLoading,
    refetch
  } = useQuery<PaginatedUsers>({
    queryKey: [
      '/api/admin/users/lesson-stats', 
      { 
        page: currentPage, 
        pageSize: pageSize, 
        search: searchQuery,
        dateFilter: dateFilter 
      }
    ],
    enabled: !authLoading && !!user?.isAdmin,
  });

  // Fetch admin lessons
  const { 
    data: lessonsData, 
    isLoading: lessonsLoading
  } = useQuery<PaginatedLessons>({
    queryKey: [
      '/api/admin/lessons',
      {
        page: lessonCurrentPage,
        pageSize: lessonPageSize,
        search: lessonSearchQuery,
        category: lessonCategory,
        cefrLevel: lessonCefrLevel
      }
    ],
    enabled: !authLoading && !!user?.isAdmin,
  });

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  // Handle lesson filters
  const handleLessonCategoryChange = (value: string) => {
    setLessonCategory(value);
    setLessonCurrentPage(1);
  };

  const handleLessonCefrChange = (value: string) => {
    setLessonCefrLevel(value);
    setLessonCurrentPage(1);
  };

  // If not admin, show unauthorized message
  if (!authLoading && (!user || !user.isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserX className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analytics metrics cards
  const MetricsCard = ({ title, value, change, icon, color }: {
    title: string;
    value: number | string;
    change: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
                {change}
              </span>
            </div>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Title and intro */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Comprehensive analytics and user management for your ESL platform.</p>
            </div>

            <Tabs defaultValue="analytics" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="lessons" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  All Lessons
                </TabsTrigger>
              </TabsList>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {analyticsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : analytics ? (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricsCard
                        title="Total Users"
                        value={analytics.totalUsers}
                        change={`${analytics.activeUsersLast30Days} active (30d)`}
                        icon={<Users className="h-6 w-6" />}
                        color="bg-blue-100 text-blue-800"
                      />
                      <MetricsCard
                        title="Total Lessons"
                        value={analytics.totalLessons}
                        change={`${analytics.lessonsLast30Days} created (30d)`}
                        icon={<BookOpen className="h-6 w-6" />}
                        color="bg-green-100 text-green-800"
                      />
                      <MetricsCard
                        title="MAU (30 days)"
                        value={analytics.activeUsersLast30Days}
                        change={`${analytics.activeUsersLast7Days} weekly`}
                        icon={<TrendingUp className="h-6 w-6" />}
                        color="bg-purple-100 text-purple-800"
                      />
                      <MetricsCard
                        title="Avg Lessons/User"
                        value={analytics.averageLessonsPerUser}
                        change="Platform average"
                        icon={<Activity className="h-6 w-6" />}
                        color="bg-orange-100 text-orange-800"
                      />
                    </div>

                    {/* Top Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Popular Categories
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analytics.topCategories.slice(0, 6).map((cat) => (
                              <div key={cat.category} className="flex items-center justify-between">
                                <span className="font-medium">
                                  {CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}
                                </span>
                                <Badge variant="secondary">{cat.count} lessons</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            CEFR Level Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analytics.cefrDistribution.map((level) => (
                              <div key={level.level} className="flex items-center justify-between">
                                <span className="font-medium">{level.level}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{
                                        width: `${(level.count / analytics.totalLessons) * 100}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">{level.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Users */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Most Active Users
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analytics.topUsers.slice(0, 6).map((user) => (
                            <div key={user.username} className="p-4 border rounded-lg">
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-gray-600">
                                {user.lessonCount} lessons created
                              </div>
                              <div className="text-xs text-gray-500">
                                Last active: {format(new Date(user.lastActive), 'MMM d, yyyy')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-gray-600">No analytics data available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                {/* Search and filters for users */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Search by username, email, or name..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      <div className="w-full md:w-48">
                        <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleSearch} className="w-full md:w-auto">
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Users table */}
                {isLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : data?.users ? (
                  <>
                    {/* Users Summary */}
                    <Card className="mb-6">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{data.total}</div>
                            <div className="text-sm text-gray-600">Total Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {data.users.filter(u => u.lessonCount > 0).length}
                            </div>
                            <div className="text-sm text-gray-600">Active Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {data.users.filter(u => u.isAdmin).length}
                            </div>
                            <div className="text-sm text-gray-600">Admin Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(data.users.reduce((sum, u) => sum + u.lessonCount, 0) / data.users.length * 10) / 10}
                            </div>
                            <div className="text-sm text-gray-600">Avg Lessons/User</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>User Management ({data.total} users)</span>
                          <Badge variant="secondary">
                            Page {currentPage} of {Math.ceil(data.total / pageSize)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Lessons</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.users.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <div className="font-medium">{user.username}</div>
                                    <div className="text-sm text-gray-500">{user.fullName}</div>
                                  </TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {user.lessonCount} lessons
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={user.credits > 0 ? "default" : "secondary"}>
                                      {user.credits} credits
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {user.isAdmin ? (
                                      <Badge variant="destructive">
                                        <UserCheck className="mr-1 h-3 w-3" />
                                        Admin
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">User</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {user.subscriptionTier}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {user.mostRecentLessonDate ? (
                                      <div className="text-sm">
                                        {format(new Date(user.mostRecentLessonDate), 'MMM d, yyyy')}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Never</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/history?user=${user.username}`, '_blank')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {data.total > pageSize && (
                          <div className="mt-6">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                {Array.from({ length: Math.min(5, Math.ceil(data.total / pageSize)) }, (_, i) => {
                                  const page = i + 1;
                                  return (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={page === currentPage}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                })}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(Math.ceil(data.total / pageSize), currentPage + 1))}
                                    className={currentPage >= Math.ceil(data.total / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-gray-600">No users found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Lessons Tab */}
              <TabsContent value="lessons" className="space-y-6">
                {/* Search and filters for lessons */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Search lessons, topics, or teachers..."
                          value={lessonSearchInput}
                          onChange={(e) => setLessonSearchInput(e.target.value)}
                          className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      <div className="w-full md:w-48">
                        <Select value={lessonCategory} onValueChange={handleLessonCategoryChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full md:w-32">
                        <Select value={lessonCefrLevel} onValueChange={handleLessonCefrChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="CEFR" />
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
                    </div>
                  </CardContent>
                </Card>

                {/* Lessons table */}
                {lessonsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : lessonsData?.lessons ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>All Platform Lessons ({lessonsData.total})</span>
                        <Badge variant="secondary">
                          Page {lessonCurrentPage} of {Math.ceil(lessonsData.total / lessonPageSize)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Title</th>
                              <th className="text-left p-2">Teacher</th>
                              <th className="text-left p-2">Category</th>
                              <th className="text-left p-2">CEFR</th>
                              <th className="text-left p-2">Created</th>
                              <th className="text-left p-2">Preview</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lessonsData.lessons.map((lesson) => (
                              <tr key={lesson.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                  <div className="font-medium">{lesson.title}</div>
                                  <div className="text-sm text-gray-600">{lesson.topic}</div>
                                </td>
                                <td className="p-2">{lesson.teacherName}</td>
                                <td className="p-2">
                                  <Badge variant="outline">
                                    {CATEGORY_LABELS[lesson.category as keyof typeof CATEGORY_LABELS] || lesson.category}
                                  </Badge>
                                </td>
                                <td className="p-2">
                                  <Badge variant="secondary">{lesson.cefrLevel}</Badge>
                                </td>
                                <td className="p-2 text-sm text-gray-600">
                                  {format(new Date(lesson.createdAt), 'MMM d, yyyy')}
                                </td>
                                <td className="p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`/lessons/${lesson.id}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination for lessons */}
                      {lessonsData.total > lessonPageSize && (
                        <div className="mt-6">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setLessonCurrentPage(Math.max(1, lessonCurrentPage - 1))}
                                  className={lessonCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                              {Array.from({ length: Math.min(5, Math.ceil(lessonsData.total / lessonPageSize)) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setLessonCurrentPage(page)}
                                      isActive={page === lessonCurrentPage}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => setLessonCurrentPage(Math.min(Math.ceil(lessonsData.total / lessonPageSize), lessonCurrentPage + 1))}
                                  className={lessonCurrentPage >= Math.ceil(lessonsData.total / lessonPageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-gray-600">No lessons found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}