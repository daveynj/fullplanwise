import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { useFreeTrial } from "@/hooks/use-free-trial";
import { format } from 'date-fns';

// Subscription plan
const unlimitedPlan = {
  id: "unlimited_monthly",
  title: "Unlimited Plan",
  price: 19,
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
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, priceId }: { planId: string, priceId: string }) => {
      console.log(`Creating subscription: planId=${planId}, priceId=${priceId}`);
      const res = await apiRequest("POST", "/api/subscriptions/create", { planId, priceId });
      
      if (!res.ok) {
        const data = await res.json();
        
        if (res.status === 409 && data.retryNeeded) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log("Customer ID reset, retrying subscription creation...");
          const retryRes = await apiRequest("POST", "/api/subscriptions/create", { planId, priceId });
          
          if (!retryRes.ok) {
            const retryError = await retryRes.json();
            throw new Error(retryError.message || "Failed on retry attempt. Please try again later.");
          }
          
          return await retryRes.json();
        }
        
        throw new Error(data.message || `Subscription error (${res.status}): Please try again.`);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
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
                {isFreeTrialActive ? "Free Trial Active" : "Subscribe for Unlimited Access"}
              </h1>
              <p className="text-gray-600 mt-2">
                {isFreeTrialActive 
                  ? `All lesson generations are free until ${freeTrialEndDate ? format(freeTrialEndDate, "MMMM do, yyyy") : ''}.`
                  : "Join our unlimited plan to generate as many AI-powered lessons as you need."
                }
              </p>
            </div>

            {isFreeTrialActive ? (
              <Card className="max-w-3xl mx-auto text-center py-12">
                <CardHeader>
                  <CardTitle className="text-2xl font-nunito">Payments Disabled During Free Trial</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-700">
                    You currently have unlimited access to lesson generation. Subscriptions will be available after the free trial period ends.
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
                        const priceId = 'price_unlimited_monthly'; // This should match the key in your server's stripeProductMap
                        createSubscriptionMutation.mutate({ 
                          planId: unlimitedPlan.id, 
                          priceId 
                        });
                      }}
                      disabled={createSubscriptionMutation.isPending}
                    >
                      {createSubscriptionMutation.isPending ? (
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
