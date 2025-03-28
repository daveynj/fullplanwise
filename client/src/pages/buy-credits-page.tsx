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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CreditBadge } from "@/components/shared/credit-badge";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  CreditCard as CreditCardIcon, 
  Loader2 
} from "lucide-react";

// Import Stripe components only if VITE_STRIPE_PUBLIC_KEY is available
let Elements: any;
let PaymentElement: any;
let useElements: any;
let useStripe: any;
let loadStripe: any;
let stripePromise: any;

// Check if Stripe key is available and import components
if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  const stripeImport = await import('@stripe/react-stripe-js');
  const stripeJsImport = await import('@stripe/stripe-js');
  
  Elements = stripeImport.Elements;
  PaymentElement = stripeImport.PaymentElement;
  useElements = stripeImport.useElements;
  useStripe = stripeImport.useStripe;
  loadStripe = stripeJsImport.loadStripe;
  
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
}

// Credit package options
const creditPackages = [
  { id: "basic", title: "Basic", credits: 20, price: 9.99, popular: false },
  { id: "standard", title: "Standard", credits: 50, price: 19.99, popular: true },
  { id: "premium", title: "Premium", credits: 100, price: 34.99, popular: false },
];

// Subscription options
const subscriptionPlans = [
  { id: "pro_monthly", title: "Pro Monthly", credits: 50, price: 24.99, period: "month", features: [
    "50 credits per month",
    "Access to all CEFR levels",
    "AI-generated images",
    "Priority support"
  ]},
  { id: "pro_yearly", title: "Pro Yearly", credits: 600, price: 239.88, period: "year", features: [
    "50 credits per month (600 total)",
    "Access to all CEFR levels",
    "AI-generated images",
    "Priority support",
    "Save 20% compared to monthly"
  ], recommended: true },
];

// CheckoutForm component for Stripe integration
function CheckoutForm({ amount, quantity, onSuccess }: { amount: number, quantity: number, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/buy-credits?success=true",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
    } else {
      // If no redirect happened, payment was successful
      // Update credits through the API
      try {
        await apiRequest("POST", "/api/add-credits", { quantity });
        onSuccess();
        toast({
          title: "Payment Successful",
          description: `${quantity} credits have been added to your account!`,
        });
      } catch (err: any) {
        toast({
          title: "Error Adding Credits",
          description: "Payment was successful, but there was an error adding credits. Please contact support.",
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function BuyCreditsPage() {
  const [activeTab, setActiveTab] = useState("credits");
  const [selectedPackage, setSelectedPackage] = useState<string>("standard");
  const [selectedSubscription, setSelectedSubscription] = useState<string>("pro_yearly");
  const [clientSecret, setClientSecret] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ amount, quantity }: { amount: number, quantity: number }) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", { amount, quantity });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Payment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle credit package selection
  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    const pkg = creditPackages.find(p => p.id === packageId);
    if (pkg) {
      createPaymentIntentMutation.mutate({ amount: pkg.price, quantity: pkg.credits });
    }
  };

  // Handle subscription plan selection
  const handleSelectSubscription = (planId: string) => {
    setSelectedSubscription(planId);
    // In a real implementation, we would handle subscription creation here
    // or when the user confirms the selection
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  // Get the selected package data
  const selectedPackageData = creditPackages.find(p => p.id === selectedPackage);
  
  // Handle payment button click
  const handleProceedToPayment = () => {
    if (selectedPackageData) {
      createPaymentIntentMutation.mutate({
        amount: selectedPackageData.price,
        quantity: selectedPackageData.credits
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-light">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-nunito font-bold">Buy Credits</h1>
              <p className="text-gray-600 mt-2">Purchase credits to generate AI-powered lessons</p>
              
              <div className="flex justify-center mt-4">
                <CreditBadge credits={user?.credits || 0} />
              </div>
            </div>
            
            {/* Purchase options */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="credits" className="text-base py-3">
                  <CreditCard className="mr-2 h-4 w-4" /> Pay As You Go
                </TabsTrigger>
                <TabsTrigger value="subscription" className="text-base py-3">
                  <Sparkles className="mr-2 h-4 w-4" /> Subscription
                </TabsTrigger>
              </TabsList>
              
              {/* Pay As You Go Tab */}
              <TabsContent value="credits" className="mt-0">
                {!clientSecret ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {creditPackages.map((pkg) => (
                        <Card key={pkg.id} className={`overflow-hidden ${
                          selectedPackage === pkg.id ? 'ring-2 ring-primary' : ''
                        }`}>
                          {pkg.popular && (
                            <div className="bg-primary text-white text-center py-1 text-sm font-semibold">
                              MOST POPULAR
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="font-nunito">{pkg.title}</CardTitle>
                            <CardDescription>
                              {pkg.credits} credits
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-nunito font-bold mb-4">
                              ${pkg.price.toFixed(2)}
                            </div>
                            <p className="text-sm text-gray-500">
                              That's just ${(pkg.price / pkg.credits).toFixed(2)} per credit
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className={`w-full ${
                                selectedPackage === pkg.id 
                                ? 'bg-primary hover:bg-primary/90' 
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                              }`}
                              onClick={() => handleSelectPackage(pkg.id)}
                            >
                              {selectedPackage === pkg.id ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" /> Selected
                                </>
                              ) : "Select"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <Button 
                        className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg"
                        onClick={handleProceedToPayment}
                        disabled={!selectedPackage || createPaymentIntentMutation.isPending}
                      >
                        {createPaymentIntentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCardIcon className="mr-2 h-5 w-5" />
                            Proceed to Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : stripePromise && Elements && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-nunito">Payment Details</CardTitle>
                      <CardDescription>
                        {selectedPackageData ? `Purchasing ${selectedPackageData.credits} credits for $${selectedPackageData.price.toFixed(2)}` : 'Complete your payment'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret, appearance: { theme: 'stripe' } }}
                      >
                        <CheckoutForm 
                          amount={selectedPackageData?.price || 0} 
                          quantity={selectedPackageData?.credits || 0}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setClientSecret("")}
                      >
                        Back to Package Selection
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
              
              {/* Subscription Tab */}
              <TabsContent value="subscription" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {subscriptionPlans.map((plan) => (
                    <Card key={plan.id} className={`overflow-hidden ${
                      selectedSubscription === plan.id ? 'ring-2 ring-primary' : ''
                    } ${plan.recommended ? 'relative' : ''}`}>
                      {plan.recommended && (
                        <div className="absolute top-0 right-0">
                          <Badge className="m-2 bg-amber-400 hover:bg-amber-500">RECOMMENDED</Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="font-nunito">{plan.title}</CardTitle>
                        <CardDescription>
                          {plan.credits} credits per {plan.period}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-nunito font-bold">
                          ${plan.price.toFixed(2)}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            /{plan.period}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className={`w-full ${
                            selectedSubscription === plan.id 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                          onClick={() => handleSelectSubscription(plan.id)}
                        >
                          {selectedSubscription === plan.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Selected
                            </>
                          ) : "Select"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button 
                    className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg"
                    disabled={true} // Disabled as subscription implementation would require additional backend setup
                  >
                    <CreditCardIcon className="mr-2 h-5 w-5" />
                    Subscribe Now
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Subscription feature coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* FAQ section */}
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="text-2xl font-nunito font-bold text-center mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">How many credits do I need per lesson?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Each complete lesson generation uses 1 credit. This includes warm-up activities, vocabulary, reading passages, and all other selected components.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Do credits expire?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">No, your purchased credits never expire. Use them at your own pace whenever you need to create new lessons.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">We accept all major credit cards, including Visa, Mastercard, American Express, and Discover.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Can I get a refund?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Credits are non-refundable once purchased. However, if you encounter any issues with lesson generation, please contact our support team.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
