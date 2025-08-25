import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, ArrowLeft, Calendar, CreditCard, Sparkles } from "lucide-react";

interface SubscriptionDetails {
  tier: string;
  renewalDate?: string;
}

const subscriptionTierMap: Record<string, { name: string }> = {
  'unlimited': { name: 'Unlimited Plan' },
};

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/subscription-success");
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [planTier, setPlanTier] = useState<string>('');
  const [hasProcessedSession, setHasProcessedSession] = useState<boolean>(false);
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  // When the component mounts, refresh the user data
  useEffect(() => {
    // First refresh user data
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, []);
  
  // Handle subscription processing with session ID
  useEffect(() => {
    // Only process if we have a session ID, a user, and haven't processed already
    if (sessionId && user && !hasProcessedSession && !isProcessing) {
      // Set processing state to true to prevent multiple calls
      setIsProcessing(true);
      
      // Show loading toast
      toast({
        title: "Processing Subscription",
        description: "Please wait while we activate your subscription...",
      });
      
      // Call the fetch-session endpoint to manually apply the credits
      fetch('/api/subscriptions/fetch-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })
      .then(res => res.json())
      .then(response => {
        console.log('Manual subscription application successful:', response);
        
        // Refresh user data to get updated credits
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        // Show success toast
        toast({
          title: "Subscription Activated",
          description: `Your unlimited subscription has been activated.`,
          variant: "default",
        });
        
        // Mark as processed
        setHasProcessedSession(true);
      })
      .catch(error => {
        console.error('Error applying subscription:', error);
        
        // Show error toast
        toast({
          title: "Subscription Processing Error",
          description: "There was an error activating your subscription. Please contact support.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
    } else if (!sessionId) {
      // If no session ID, just show a simple success message
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated.",
      });
    }
  }, [sessionId, user, hasProcessedSession, isProcessing, toast]);

  // Get subscription details effect
  useEffect(() => {
    // If we have a session ID and user data, try to fetch subscription details
    if (sessionId && user) {
      setIsLoading(true);
      
      // Calculate next renewal date (30 days from now for monthly, 365 for annual)
      const nextRenewal = new Date();
      if (user.subscriptionTier === 'annual') {
        nextRenewal.setDate(nextRenewal.getDate() + 365);
      } else {
        nextRenewal.setDate(nextRenewal.getDate() + 30);
      }
      
      // Force annual plan to show 250 credits for now
      const forcedTier = searchParams.get("plan");
      const tier = forcedTier === "annual_plan" ? "annual" : user?.subscriptionTier;
      
      // Save the tier to state so we can use it in the render function
      setPlanTier(tier || '');
      
      console.log(`Subscription tier: ${tier}, forced tier from params: ${forcedTier}`);
      
      const subscriptionInfo = subscriptionTierMap[tier as string] || {
        name: 'Unlimited Plan',
      };
      
      // Set the subscription details
      setSubscriptionDetails({
        tier: subscriptionInfo.name,
        renewalDate: nextRenewal.toLocaleDateString(),
      });
      
      setIsLoading(false);
    }
  }, [sessionId, user]);
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto pt-8">
            <Card className="border-green-100 shadow-lg">
              <CardHeader className="text-center pb-2">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-2" />
                <CardTitle className="text-2xl font-nunito">Subscription Activated!</CardTitle>
                <CardDescription>
                  Thank you for subscribing. You now have unlimited access to lesson generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Subscription details */}
                {!isLoading && subscriptionDetails && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg">Subscription Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Plan</p>
                          <p className="text-gray-600">{subscriptionDetails.tier}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Next Renewal</p>
                          <p className="text-gray-600">{subscriptionDetails.renewalDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Credit balance */}
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Subscription Status</h3>
                    <p className="text-gray-600">You can now generate as many lessons as you need.</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 font-semibold px-3 py-2 rounded-full">
                    <Sparkles className="h-5 w-5" />
                    <span>Unlimited Access</span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="text-center pt-2">
                  <Button 
                    className="bg-primary hover:bg-primary/90 min-w-[200px]"
                    onClick={() => setLocation("/")}
                  >
                    Go to Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="mt-2 min-w-[200px]"
                    onClick={() => setLocation("/buy-credits")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Credits Page
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500 text-center pt-4">
                  <p>You can manage or cancel your subscription anytime from your account settings.</p>
                  <p className="mt-1">If you have any questions or need assistance, please contact support.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}