import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CreditBadge } from "@/components/shared/credit-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, ArrowLeft, Calendar, CreditCard } from "lucide-react";

interface SubscriptionDetails {
  tier: string;
  renewalDate?: string;
  monthlyCredits: number;
}

const subscriptionTierMap: Record<string, { name: string, monthlyCredits: number }> = {
  'basic': { name: 'Basic Plan', monthlyCredits: 20 },
  'premium': { name: 'Premium Plan', monthlyCredits: 60 },
  'annual': { name: 'Annual Plan', monthlyCredits: 250 }
};

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/subscription-success");
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  // When the component mounts, refresh the user data and fetch subscription details
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    
    // Show success toast
    toast({
      title: "Subscription Activated",
      description: "Your subscription has been successfully activated.",
    });

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
      
      console.log(`Subscription tier: ${tier}, forced tier from params: ${forcedTier}`);
      
      const subscriptionInfo = subscriptionTierMap[tier as string] || {
        name: 'Subscription',
        monthlyCredits: forcedTier === "annual_plan" ? 250 : 0
      };
      
      // Set the subscription details
      setSubscriptionDetails({
        tier: subscriptionInfo.name,
        renewalDate: nextRenewal.toLocaleDateString(),
        monthlyCredits: subscriptionInfo.monthlyCredits
      });
      
      setIsLoading(false);
    }
  }, [toast, sessionId, user]);
  
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
                  Thank you for subscribing. Your credits have been added to your account.
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
                    
                    <div className="pt-2 border-t mt-3">
                      {tier === 'annual' || searchParams.get("plan") === "annual_plan" ? (
                        <p className="text-gray-700">You've received <span className="font-semibold">{subscriptionDetails.monthlyCredits} credits</span> with this annual plan.</p>
                      ) : (
                        <p className="text-gray-700">You'll receive <span className="font-semibold">{subscriptionDetails.monthlyCredits} credits</span> each billing period with this plan.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Credit balance */}
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Current Credit Balance</h3>
                    <p className="text-gray-600">Use credits to generate AI lessons</p>
                  </div>
                  <CreditBadge credits={user?.credits || 0} size="large" />
                </div>
                
                {/* Action buttons */}
                <div className="text-center pt-2">
                  <Button 
                    className="bg-primary hover:bg-primary/90 min-w-[200px]"
                    onClick={() => setLocation("/dashboard")}
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