import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthenticatedLandingRedirect } from "./lib/authenticated-landing-redirect";
import { AuthProvider } from "./hooks/use-auth";
import TwitterCard from "@/components/TwitterCard";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import LessonGeneratorPage from "@/pages/lesson-generator-page";
import StudentsPage from "@/pages/students-page";
import StudentDetailPage from "@/pages/student-detail-page";
import LessonHistoryPage from "@/pages/lesson-history-page";
import BuyCreditsPage from "@/pages/buy-credits-page";
import SettingsPage from "@/pages/settings-page";
import FullScreenLessonPage from "@/pages/full-screen-lesson-page";
import SubscriptionSuccessPage from "@/pages/subscription-success-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import { AdminDashboardPage } from "@/pages/admin-dashboard-page";
import LandingPage from "@/pages/landing-page";
import TwitterCardPreview from "@/pages/twitter-card-preview";

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
      <ProtectedRoute path="/lessons/:id" component={FullScreenLessonPage} />
      <ProtectedRoute path="/fullscreen/:id" component={FullScreenLessonPage} />
      <ProtectedRoute path="/buy-credits" component={BuyCreditsPage} />
      <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} />
      <Route path="/auth" component={AuthPage} />
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
