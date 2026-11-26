import { trackEvent } from "@/lib/analytics";
import { siteFacts, priceText } from "@shared/site-facts";
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
  Check,
  Sparkles,
  CreditCard as CreditCardIcon,
  Loader2,
  ShieldCheck,
  Clock
} from "lucide-react";
import { useTrialStatus } from "@/hooks/use-trial-status";

const unlimitedPlan = {
  id: "unlimited_monthly",
  title: "Unlimited Plan",
  price: Number(siteFacts.priceValue),
  period: siteFacts.pricePeriod,
  features: [
    "Unlimited CEFR A1–C2 lessons on any topic (ready in 1–2 minutes)",
    "Complete 8-stage pedagogical sequence with AI illustrations",
    "Per-student vocabulary tracking & natural cross-lesson recycling",
    "Students can create custom lessons on any subject (Unlimited exclusive)",
    "Zero-login private learner dashboards with spaced flashcards",
    "Printable Vocabulary Review study PDFs (collocations, word families, synonyms/antonyms & usage notes)",
    "Cancel anytime in one click — keep every lesson you created",
  ],
};

export default function BuyCreditsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const submitting = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const isSubscriber = user?.subscriptionTier === "unlimited";
  const { isGlobalTrial, isPersonalTrial, trialDaysRemaining } = useTrialStatus();

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
      trackEvent("begin_checkout", { currency: siteFacts.currency, value: Number(siteFacts.priceValue) });
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Page header */}
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Simple monthly plan · Cancel anytime
              </span>
              <h1 className="text-3xl md:text-4xl font-nunito font-bold text-brand-navy">
                {isSubscriber
                  ? "Your Unlimited Subscription"
                  : isGlobalTrial
                    ? "Free Trial Active"
                    : "Upgrade to PlanWise ESL Unlimited"}
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-base md:text-lg">
                {isSubscriber
                  ? "You already have Unlimited access. Manage your subscription anytime from account settings."
                  : isGlobalTrial
                    ? `Everyone has unlimited lesson generation for ${trialDaysRemaining} more day${trialDaysRemaining !== 1 ? "s" : ""}.`
                    : isPersonalTrial
                      ? `You have ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} left in your free trial. Lock in Unlimited now—and unlock student-created custom lessons immediately.`
                      : "One flat monthly plan for unlimited bespoke lessons, student dashboards, flashcards and Vocabulary Review study PDFs."}
              </p>
            </div>

            {isSubscriber ? (
              <Card className="max-w-2xl mx-auto text-center py-10">
                <CardHeader>
                  <CardTitle className="font-nunito text-2xl text-brand-navy">Your subscription is already set up</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">No need to subscribe again, including if cancellation is scheduled.</p>
                  <Button className="mt-5" variant="brand" asChild>
                    <a href="/settings">Manage subscription</a>
                  </Button>
                </CardContent>
              </Card>
            ) : isGlobalTrial ? (
              <Card className="max-w-2xl mx-auto text-center py-10">
                <CardHeader>
                  <CardTitle className="text-2xl font-nunito text-brand-navy">Free Trial Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-slate-700">
                    You have unlimited lesson generation for {trialDaysRemaining} more day{trialDaysRemaining !== 1 ? "s" : ""}. Subscriptions open as soon as the promotional period ends.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {isPersonalTrial && (
                  <div className="max-w-xl mx-auto rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-950">
                      <span className="font-bold">
                        {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} left in your free trial.
                      </span>{" "}
                      Upgrade today to unlock student-created custom lessons right away and keep generating without interruption.
                    </div>
                  </div>
                )}

                <Card className="max-w-xl mx-auto border-2 border-brand-yellow shadow-xl overflow-hidden">
                  <div className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brand-yellow font-semibold">Most Popular</p>
                      <CardTitle className="font-nunito text-2xl text-white mt-0.5">{unlimitedPlan.title}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-nunito font-bold text-brand-yellow">
                        ${unlimitedPlan.price.toFixed(2)}
                        <span className="text-sm font-normal text-white/75 ml-1">/{unlimitedPlan.period}</span>
                      </div>
                      <p className="text-xs text-white/70">~$1/lesson at 20 classes/month</p>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-600 text-base">
                      Everything you need to teach personalised, high-retention ESL classes—for Cambly, Preply, italki, freelance teachers and language schools.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {unlimitedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-slate-700 text-sm md:text-base">
                          <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                      variant="brand"
                      size="lg"
                      className="w-full font-bold text-base shadow-lg shadow-brand-yellow/30"
                      onClick={() => {
                        if (!user || isSubscriber || submitting.current || redirecting) return;
                        submitting.current = true;
                        const priceId = "price_unlimited_monthly";
                        createSubscriptionMutation.mutate({
                          planId: unlimitedPlan.id,
                          priceId,
                        });
                      }}
                      disabled={!user || isSubscriber || createSubscriptionMutation.isPending || redirecting}
                    >
                      {createSubscriptionMutation.isPending || redirecting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Opening secure checkout...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="mr-2 h-5 w-5" />
                          Subscribe Now — {priceText}
                        </>
                      )}
                    </Button>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      Secure Stripe checkout · Cancel anytime in 1 click · Keep every lesson you create
                    </p>
                  </CardFooter>
                </Card>

                <p className="text-center text-sm text-slate-500 max-w-xl mx-auto">
                  Teaching with a small or medium language school? Email{" "}
                  <a href="mailto:dave@planwiseesl.com" className="font-semibold text-brand-navy underline decoration-brand-yellow decoration-2">
                    dave@planwiseesl.com
                  </a>{" "}
                  for a simple team plan.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
