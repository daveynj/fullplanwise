import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, BookOpen, Calendar, RefreshCw, Plus, Minus, CreditCard, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Interface for user with lesson stats
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

// Interface for paginated users
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // State for credit management dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithLessonStats | null>(null);
  const [creditAmount, setCreditAmount] = useState(1);
  const [creditAction, setCreditAction] = useState<'add' | 'subtract' | 'set'>('add');

  // Mutation for updating user credits
  const updateCreditsMutation = useMutation({
    mutationFn: async (params: { userId: number, credits: number, action: 'add' | 'subtract' | 'set' }) => {
      const response = await fetch('/api/admin/update-user-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update credits');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Credits updated successfully",
        description: data.message,
      });
      
      // Close the dialog
      setIsDialogOpen(false);
      
      // Reset form
      setCreditAmount(1);
      setSelectedUser(null);
      
      // Invalidate the users query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/lesson-stats'] });
      
      // If we updated the current user's credits, refresh the user data
      if (selectedUser?.id === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle opening the credit management dialog
  const handleOpenCreditDialog = (user: UserWithLessonStats) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Handle submitting the credit update
  const handleUpdateCredits = () => {
    if (!selectedUser) return;
    
    updateCreditsMutation.mutate({
      userId: selectedUser.id,
      credits: creditAmount,
      action: creditAction,
    });
  };

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  // If not authenticated or not admin, show a loading state
  if (authLoading || (!user || !user.isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

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
            
            {/* Search and filters */}
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
                        <SelectValue placeholder="Date filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} className="md:w-auto">
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                  <Button variant="outline" onClick={() => refetch()} className="md:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Users table */}
            <Card>
              <CardHeader>
                <CardTitle>Users and Lesson Activity</CardTitle>
                <CardDescription>
                  {data ? `Showing ${data.users.length} of ${data.total} users` : "Loading users..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center">Loading user data...</div>
                ) : !data || data.users.length === 0 ? (
                  <div className="py-8 text-center">No users found matching your criteria.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              <BookOpen className="mr-2 h-4 w-4" />
                              Lessons
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Last Lesson
                            </div>
                          </TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.fullName || "-"}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.lessonCount}</TableCell>
                            <TableCell>{formatDate(user.mostRecentLessonDate)}</TableCell>
                            <TableCell>{user.credits}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                user.subscriptionTier === 'premium' || user.subscriptionTier === 'annual' 
                                  ? 'bg-green-100 text-green-800' 
                                  : user.subscriptionTier === 'basic' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {user.isAdmin ? (
                                <span className="inline-block px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs">
                                  Yes
                                </span>
                              ) : "No"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setCreditAction('add');
                                    setIsDialogOpen(true);
                                  }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Credits
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setCreditAction('subtract');
                                    setIsDialogOpen(true);
                                  }}>
                                    <Minus className="mr-2 h-4 w-4" />
                                    Remove Credits
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setCreditAction('set');
                                    setIsDialogOpen(true);
                                  }}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Set Credits
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              {totalPages > 1 && (
                <CardFooter>
                  <div className="w-full">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(pageNum);
                                  }}
                                  isActive={pageNum === currentPage}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          if (
                            (pageNum === 2 && currentPage > 3) || 
                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={`ellipsis-${pageNum}`}>
                                <span className="px-4">...</span>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </main>
      </div>
      
      {/* Credits Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {creditAction === 'add' 
                ? 'Add Credits' 
                : creditAction === 'subtract' 
                  ? 'Remove Credits' 
                  : 'Set Credits'
              }
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  User: <strong>{selectedUser.username}</strong> (Current credits: {selectedUser.credits})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="credit-action" className="text-sm font-medium">Action</label>
              <Select value={creditAction} onValueChange={(value) => setCreditAction(value as 'add' | 'subtract' | 'set')}>
                <SelectTrigger id="credit-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Credits</SelectItem>
                  <SelectItem value="subtract">Remove Credits</SelectItem>
                  <SelectItem value="set">Set Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="credit-amount" className="text-sm font-medium">Credit Amount</label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-gray-500">
                {creditAction === 'add' 
                  ? `This will add ${creditAmount} credits to the user's account.` 
                  : creditAction === 'subtract' 
                    ? `This will remove ${creditAmount} credits from the user's account.` 
                    : `This will set the user's credits to exactly ${creditAmount}.`
                }
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCredits} 
              disabled={updateCreditsMutation.isPending}
              className={`${
                creditAction === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : creditAction === 'subtract' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : ''
              }`}
            >
              {updateCreditsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {creditAction === 'add' && <Plus className="mr-2 h-4 w-4" />}
                  {creditAction === 'subtract' && <Minus className="mr-2 h-4 w-4" />}
                  {creditAction === 'set' && <CreditCard className="mr-2 h-4 w-4" />}
                  
                  {creditAction === 'add' 
                    ? 'Add Credits' 
                    : creditAction === 'subtract' 
                      ? 'Remove Credits' 
                      : 'Set Credits'
                  }
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}