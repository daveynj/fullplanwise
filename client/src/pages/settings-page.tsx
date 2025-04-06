import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Settings, Bell, Lock, Loader2, CreditCard, Calendar, Badge, Gift, Check, ExternalLink } from "lucide-react";
import { CreditBadge } from "@/components/shared/credit-badge";

// Profile update schema
const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

// Password update schema
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
type PasswordUpdateValues = z.infer<typeof passwordUpdateSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Profile update form
  const profileForm = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });
  
  // Password update form
  const passwordForm = useForm<PasswordUpdateValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Profile update mutation (mock - would connect to a real API endpoint)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateValues) => {
      // In a real implementation, this would hit a profile update API endpoint
      // For now, we'll simulate a successful response
      return { success: true, data };
    },
    onSuccess: () => {
      // In a real implementation, this would invalidate user data and update the auth context
      // queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation (mock - would connect to a real API endpoint)
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdateValues) => {
      // In a real implementation, this would hit a password update API endpoint
      // For now, we'll simulate a successful response
      return { success: true };
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle profile form submission
  const onProfileSubmit = (data: ProfileUpdateValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle password form submission
  const onPasswordSubmit = (data: PasswordUpdateValues) => {
    updatePasswordMutation.mutate(data);
  };
  
  // Get user initials for avatar
  const getInitials = (name: string = "") => {
    if (!name) return "";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-nunito font-bold">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            
            {/* Settings tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile" className="text-base px-6">
                  <User className="mr-2 h-4 w-4" /> Profile
                </TabsTrigger>
                <TabsTrigger value="subscription" className="text-base px-6">
                  <CreditCard className="mr-2 h-4 w-4" /> Subscription
                </TabsTrigger>
                <TabsTrigger value="password" className="text-base px-6">
                  <Lock className="mr-2 h-4 w-4" /> Password
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-base px-6">
                  <Bell className="mr-2 h-4 w-4" /> Notifications
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-nunito">Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-6">
                      <Avatar className="h-20 w-20 mr-4">
                        <AvatarFallback className="bg-primary text-white text-xl">
                          {getInitials(user?.fullName || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                        <p className="text-gray-500">{user?.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {user?.subscriptionTier === "premium" ? "Premium Account" : 
                           user?.subscriptionTier === "basic" ? "Basic Account" :
                           user?.subscriptionTier === "annual" ? "Annual Account" : "Free Account"}
                        </p>
                        {user?.subscriptionTier !== "free" && (
                          <div className="mt-1 text-sm text-primary-600 font-medium">
                            Active Subscription
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Subscription Tab */}
              <TabsContent value="subscription" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-nunito">Subscription Details</CardTitle>
                    <CardDescription>
                      Manage your subscription and view your credit balance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Current Plan */}
                    <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Badge className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Subscription Type</p>
                            <p className="text-gray-600">
                              {user?.subscriptionTier === "premium" ? "Premium Plan" : 
                               user?.subscriptionTier === "basic" ? "Basic Plan" :
                               user?.subscriptionTier === "annual" ? "Annual Plan" : "Free Plan"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Renewal Date</p>
                            <p className="text-gray-600">
                              {user?.subscriptionTier !== "free" ? 
                                // Calculate renewal date based on subscription type
                                (() => {
                                  const now = new Date();
                                  const renewalDate = new Date();
                                  
                                  // Calculate renewal date based on subscription type
                                  const days = user?.subscriptionTier === "annual" ? 365 : 30;
                                  renewalDate.setDate(now.getDate() + days);
                                  
                                  return renewalDate.toLocaleDateString();
                                })() : 
                                "No active subscription"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Gift className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Plan Benefits</p>
                            <ul className="mt-1 text-gray-600 text-sm space-y-1">
                              {user?.subscriptionTier === "premium" && (
                                <>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> 60 credits per month
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Priority support
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Advanced AI lesson generation
                                  </li>
                                </>
                              )}
                              
                              {user?.subscriptionTier === "basic" && (
                                <>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> 20 credits per month
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Email support
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Standard AI lesson generation
                                  </li>
                                </>
                              )}
                              
                              {user?.subscriptionTier === "annual" && (
                                <>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> 250 credits per year
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Priority support
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Advanced AI lesson generation
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Best value (save over monthly plans)
                                  </li>
                                </>
                              )}
                              
                              {user?.subscriptionTier === "free" && (
                                <>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> 3 free credits
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" /> Basic lesson generation
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <CreditCard className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Current Credit Balance</p>
                            <div className="mt-2">
                              <CreditBadge credits={user?.credits || 0} size="large" />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              {user?.subscriptionTier !== "free" ? 
                                `Your subscription renews credits automatically each ${user?.subscriptionTier === "annual" ? "year" : "month"}.` : 
                                "Purchase credits or subscribe to a plan to generate more lessons."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Subscription Management */}
                    <div className="mb-6 p-5 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
                      
                      <div className="flex flex-col md:flex-row gap-3">
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => setLocation("/buy-credits")}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          {user?.subscriptionTier === "free" ? "Subscribe to a Plan" : "Change Plan"}
                        </Button>
                        
                        {user?.subscriptionTier !== "free" && (
                          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            Cancel Subscription
                          </Button>
                        )}
                      </div>
                      
                      {user?.subscriptionTier !== "free" && (
                        <p className="text-sm text-gray-500 mt-3">
                          Your subscription will remain active until the current billing period ends, even if you cancel.
                        </p>
                      )}
                    </div>
                    
                    {/* Buy Additional Credits */}
                    <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-lg font-semibold mb-2">Need More Credits?</h3>
                      <p className="text-gray-600 mb-4">
                        You can purchase additional credits at any time without changing your subscription plan.
                      </p>
                      
                      <Button 
                        variant="outline" 
                        className="bg-white border-primary text-primary hover:bg-primary/5"
                        onClick={() => setLocation("/buy-credits")}
                      >
                        Buy Additional Credits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Password Tab */}
              <TabsContent value="password" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-nunito">Change Password</CardTitle>
                    <CardDescription>
                      Update your password to maintain account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Use at least 6 characters, including a mix of letters and numbers.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : "Update Password"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-nunito">Notification Settings</CardTitle>
                    <CardDescription>
                      Manage your notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive emails about your account and activity</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-semibold">New Features</h3>
                          <p className="text-sm text-gray-500">Get notified when we release new features</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Credit Alerts</h3>
                          <p className="text-sm text-gray-500">Receive notifications when your credits are running low</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="bg-primary hover:bg-primary/90">
                      Save Preferences
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Account Danger Zone */}
            <div className="mt-8">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="font-nunito text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Actions in this section can have permanent consequences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Delete Account</h3>
                      <p className="text-sm text-gray-500">
                        Once you delete your account, there is no going back. This action cannot be undone.
                      </p>
                    </div>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
