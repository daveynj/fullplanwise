import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthenticatedLandingRedirect } from "./lib/authenticated-landing-redirect";
import { AuthProvider } from "./hooks/use-auth";
import TwitterCard from "@/components/TwitterCard";

// Pages needed on first visit stay in the main bundle
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";

// Everything else is loaded on demand so first load downloads less JavaScript
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const LessonGeneratorPage = lazy(() => import("@/pages/lesson-generator-page"));
const StudentsPage = lazy(() => import("@/pages/students-page"));
const StudentDetailPage = lazy(() => import("@/pages/student-detail-page"));
const LessonHistoryPage = lazy(() => import("@/pages/lesson-history-page"));
const BuyCreditsPage = lazy(() => import("@/pages/buy-credits-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const FullScreenLessonPage = lazy(() => import("@/pages/full-screen-lesson-page"));
const SubscriptionSuccessPage = lazy(() => import("@/pages/subscription-success-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page"));
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin-dashboard-page").then((m) => ({ default: m.AdminDashboardPage })),
);
const TwitterCardPreview = lazy(() => import("@/pages/twitter-card-preview"));
const GrammarTestPage = lazy(() => import("@/pages/grammar-test-page"));
const GrammarComponentShowcase = lazy(() =>
  import("@/components/lesson/grammar-component-showcase").then((m) => ({
    default: m.GrammarComponentShowcase,
  })),
);
const PublicLibraryPage = lazy(() => import("@/pages/public-library-page"));
const AdminLessonManagementPage = lazy(() => import("@/pages/admin-lesson-management-page"));
const BlogIndex = lazy(() => import("@/pages/blog-index"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const PublicLessonsIndexPage = lazy(() => import("@/pages/public-lessons-index-page"));
const AdminBlogPosts = lazy(() => import("@/pages/admin-blog-posts"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function GrammarShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <GrammarComponentShowcase />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <AuthenticatedLandingRedirect path="/" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/generate" component={LessonGeneratorPage} />
      <ProtectedRoute path="/students" component={StudentsPage} />
      <ProtectedRoute path="/students/:id" component={StudentDetailPage} />
      <ProtectedRoute path="/history" component={LessonHistoryPage} />
      <ProtectedRoute path="/history/:id" component={FullScreenLessonPage} />
      <Route path="/lessons/:id" component={FullScreenLessonPage} />
      <ProtectedRoute path="/fullscreen/:id" component={FullScreenLessonPage} />
      <ProtectedRoute path="/public-library" component={PublicLibraryPage} />
      <ProtectedRoute path="/buy-credits" component={BuyCreditsPage} />
      <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/lessons" component={AdminLessonManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/blog" component={AdminBlogPosts} requireAdmin={true} />
      <ProtectedRoute path="/grammar-test" component={GrammarTestPage} />
      <ProtectedRoute path="/grammar-showcase" component={GrammarShowcasePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/esl-lessons" component={PublicLessonsIndexPage} />
      <Route path="/esl-lessons/:level" component={PublicLessonsIndexPage} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog" component={BlogIndex} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/twitter-card" component={TwitterCardPreview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Twitter Card for social sharing */}
        <TwitterCard 
          title="Create CEFR leveled ESL lessons on any topic"
          description="Instant ESL Lessons. Smarter, Faster. Planwise generates full ESL lessons with AI — in seconds."
          image="/images/twitter-card-new-design.png"
        />
        <Suspense fallback={<PageLoader />}>
          <Router />
        </Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
