import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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

export function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Parse URL query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      page: parseInt(params.get("page") || "1"),
      pageSize: parseInt(params.get("pageSize") || "10"),
      search: params.get("search") || "",
      dateFilter: params.get("dateFilter") || "all"
    };
  };

  const queryParams = getQueryParams();
  const [searchInput, setSearchInput] = useState<string>(queryParams.search);
  const [currentPage, setCurrentPage] = useState<number>(queryParams.page);

  // Effect to update state when URL parameters change
  useEffect(() => {
    const params = getQueryParams();
    setSearchInput(params.search);
    setCurrentPage(params.page);
  }, [window.location.search]);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  // Fetch users with lesson stats
  const { 
    data, 
    isLoading,
    refetch
  } = useQuery<PaginatedUsers>({
    queryKey: ['/api/admin/users/lesson-stats', queryParams.page, queryParams.pageSize, queryParams.search, queryParams.dateFilter],
    enabled: !authLoading && !!user?.isAdmin,
  });

  // Update URL with new query parameters
  const updateUrlParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of Object.entries(params)) {
      newParams.set(key, value.toString());
    }
    
    setLocation(`/admin?${newParams.toString()}`);
  };

  // Handle search
  const handleSearch = () => {
    updateUrlParams({ page: 1, search: searchInput });
  };

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    updateUrlParams({ page: 1, dateFilter: value });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
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
  const totalPages = data ? Math.ceil(data.total / queryParams.pageSize) : 0;

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
              <p className="text-gray-600">View and manage users and their lesson generation activity.</p>
            </div>
            
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
                    <Select value={queryParams.dateFilter} onValueChange={handleDateFilterChange}>
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
                          // Show current page, first, last and one page before/after current
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
                          
                          // Show ellipsis between page groups
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