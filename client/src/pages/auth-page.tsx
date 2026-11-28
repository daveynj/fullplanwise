import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { afterSignInPath } from "@shared/auth-redirect";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { siteFacts, trialText, priceText } from "@shared/site-facts";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Once signed in (or already signed in), go to the page the teacher was
  // trying to open, e.g. /generate from an email link; otherwise the dashboard.
  const [afterSignIn] = useState(() => afterSignInPath(window.location.search));
  const [pendingLesson] = useState<{ topic: string; level: string } | null>(() => {
    try {
      const target = new URL(afterSignIn, "https://planwiseesl.com");
      if (target.pathname !== "/generate") return null;
      const topic = target.searchParams.get("topic")?.trim();
      const level = target.searchParams.get("level")?.trim();
      return topic ? { topic, level: level || "B2" } : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (user) {
      navigate(afterSignIn);
    }
  }, [user, navigate, afterSignIn]);

  // Set active tab from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "true") {
      setActiveTab("register");
    }
  }, []);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 3-field Register form (Name, Email, Password — username auto-generated server-side)
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      username: "",
    });
  };

  return (
    <div className="flex min-h-screen bg-brand-light">
      <SEOHead
        title={`Log In or Start Your Free Trial | ${siteFacts.brand}`}
        description={`Log in to ${siteFacts.brand}, or create a free account: complete CEFR-levelled ESL lessons in ${siteFacts.generationTime}. ${trialText}, no credit card needed.`}
        keywords={[
          "ESL teacher login",
          "AI lesson planning account",
          "ESL teacher registration",
          "PlanWise ESL sign up",
          "ESL lesson generator login",
          "CEFR lesson planning tool",
          "AI ESL teaching platform"
        ]}
        canonicalUrl={`${siteFacts.url}/auth`}
        noindex
        robots="noindex, follow"
      />

      {/* Left side - Auth forms */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-4 sm:px-6 lg:px-10 py-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex items-center justify-center mb-6 group">
            <img src="/PlanWise_ESL_logo.png" alt="PlanWise ESL logo" className="h-12 w-auto" />
            <span className="text-center text-3xl font-nunito font-bold text-brand-navy ml-3 uppercase tracking-tight">
              PlanWise ESL
            </span>
          </Link>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-navy font-semibold"
              >
                Log In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-navy font-semibold"
              >
                Start Free Trial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-slate-200/80 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-nunito text-2xl text-brand-navy">Welcome back</CardTitle>
                  <CardDescription>
                    Log in to access your lessons, students and dashboards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-navy">Email or Username</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="username"
                                placeholder="you@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-navy">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showLoginPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  placeholder="••••••••"
                                  className="pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowLoginPassword((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                >
                                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        variant="brand"
                        size="lg"
                        className="w-full font-semibold"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Sign in"}
                      </Button>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <Link to="/forgot-password" className="text-brand-navy/80 hover:text-brand-navy hover:underline">
                          Forgot password?
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveTab("register")}
                          className="font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
                        >
                          New here? Try free for 14 days →
                        </button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-amber-200/80 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 w-fit mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {trialText} · No credit card
                  </div>
                  <CardTitle className="font-nunito text-2xl text-brand-navy">
                    {pendingLesson
                      ? `Ready to build your ${pendingLesson.level} lesson`
                      : "Make your first lesson in 2 minutes"}
                  </CardTitle>
                  <CardDescription>
                    {pendingLesson ? (
                      <>
                        Topic: <span className="font-semibold text-brand-navy">“{pendingLesson.topic}”</span>. Create your free account and we’ll open the generator pre-filled.
                      </>
                    ) : (
                      <>Unlimited CEFR A1–C2 lessons during your {trialText}. Keep everything you create.</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-navy">Your Name</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="name"
                                placeholder="e.g. Sarah Jenkins"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-navy">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-navy">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showRegisterPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  placeholder="At least 6 characters"
                                  className="pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRegisterPassword((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                                >
                                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        variant="brand"
                        size="lg"
                        className="w-full font-bold text-base shadow-lg shadow-brand-yellow/30"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting up your account...
                          </>
                        ) : "Start My 14-Day Free Trial"}
                      </Button>

                      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1 text-center">
                        <Lock className="h-3 w-3 flex-shrink-0" />
                        No credit card required · Then {priceText} Unlimited, cancel anytime
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Premium Value & Trust Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-navy items-center justify-center p-12">
        <div className="max-w-lg text-brand-light">
          <span className="inline-block bg-white/10 border border-white/15 text-brand-yellow text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-6">
            Built by a working ESL teacher
          </span>
          <h1 className="text-4xl font-nunito font-bold leading-tight mb-4">
            Bespoke ESL lessons your students actually remember
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            In {siteFacts.generationTime}, build a complete CEFR A1–C2 conversation lesson on any topic—following a scientific 8-stage teaching sequence.
          </p>

          <div className="space-y-4 mb-10">
            {[
              "Full pedagogical sequence: warm-up recall, rich vocab (word families, collocations & usage notes), levelled reading, recall flashcards, semantic maps, exercises & deep discussion.",
              "Tracks every student’s vocabulary so you never repeat words by accident—and recycles earlier words naturally when relevant.",
              "Zero-login private learner dashboard with past lessons, flashcards, and student-created custom lessons.",
              "One-click printable Vocabulary Review study PDF to send straight after class.",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-yellow mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/90 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm italic text-white/85 leading-relaxed mb-3">
              “I built PlanWise ESL for my own one-to-one students and still plan every lesson with it six days a week.”
            </p>
            <p className="text-xs font-semibold text-brand-yellow">
              Dave Jackson · British ESL teacher since 2015 · 2,000+ students taught
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
