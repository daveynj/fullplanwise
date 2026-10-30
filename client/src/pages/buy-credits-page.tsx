import { useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  CreditCard as CreditCardIcon, 
  Loader2 
} from "lucide-react";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { format } from 'date-fns';

// Subscription plan
const unlimitedPlan = {
  id: "unlimited_monthly",
  title: "Unlimited Plan",
  price: 19.99,
  period: "month",
  features: [
    "Unlimited lesson generations",
    "Access to all CEFR levels",
    "AI-generated images",
    "Priority email support",
    "Fair use policy applies"
  ]
};

export default function BuyCreditsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const submitting = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const isSubscriber = user?.subscriptionTier === "unlimited";
  const { isInTrial, isPersonalTrial, trialDaysRemaining, trialExpiresAt, freeCreditsRemaining } = useTrialStatus();
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, priceId }: { planId: string, priceId: string }) => {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, priceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "ALREADY_SUBSCRIBED") {
          void queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
        throw new Error(data.message || `Subscription error (${res.status}): Please try again.`);
      }
      if (!data.url) throw new Error("Checkout is unavailable. Please contact support.");
      return data;
    },
    retry: false,
    onSuccess: (data) => {
      setRedirecting(true);
      window.location.href = data.url;
    },
    onError: (error: any) => {
      submitting.current = false;
      toast({
        title: "Error Creating Subscription",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-nunito font-bold">
                {isSubscriber ? "Your Unlimited Subscription" : isInTrial ? "Free Trial Active" : "Subscribe for Unlimited Access"}
              </h1>
              <p className="text-gray-600 mt-2">
                {isSubscriber ? "You already have Unlimited access. Manage your subscription from your account." : isInTrial
                  ? `You have ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} of unlimited lesson generation remaining${freeCreditsRemaining > 0 ? `, plus ${freeCreditsRemaining} free credit${freeCreditsRemaining !== 1 ? 's' : ''} after trial ends` : ''}.`
                  : freeCreditsRemaining > 0 
                    ? `You have ${freeCreditsRemaining} free lesson credit${freeCreditsRemaining !== 1 ? 's' : ''} remaining. Subscribe for unlimited access.`
                    : "Join our unlimited plan to generate as many AI-powered lessons as you need."
                }
              </p>
            </div>

            {isSubscriber ? (
              <Card className="max-w-3xl mx-auto text-center py-12">
                <CardHeader>
                  <CardTitle>Your subscription is already set up</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>No need to subscribe again, including if cancellation is scheduled.</p>
                  <Button className="mt-4" asChild><a href="/settings">Manage subscription</a></Button>
                </CardContent>
              </Card>
            ) : isInTrial ? (
              <Card className="max-w-3xl mx-auto text-center py-12">
                <CardHeader>
                  <CardTitle className="text-2xl font-nunito">Free Trial Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-700">
                    You have unlimited lesson generation for {trialDaysRemaining} more day{trialDaysRemaining !== 1 ? 's' : ''}. Subscribe anytime for continued unlimited access after your trial ends.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-center">
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle className="font-nunito">{unlimitedPlan.title}</CardTitle>
                    <CardDescription>
                      The best value for active teachers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-nunito font-bold">
                      ${unlimitedPlan.price.toFixed(2)}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        /{unlimitedPlan.period}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {unlimitedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => {
                        if (!user || isSubscriber || submitting.current || redirecting) return;
                        submitting.current = true;
                        const priceId = 'price_unlimited_monthly'; // This should match the key in your server's stripeProductMap
                        createSubscriptionMutation.mutate({ 
                          planId: unlimitedPlan.id, 
                          priceId 
                        });
                      }}
                      disabled={!user || isSubscriber || createSubscriptionMutation.isPending || redirecting}
                    >
                      {createSubscriptionMutation.isPending || redirecting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="mr-2 h-5 w-5" />
                          Subscribe Now
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
