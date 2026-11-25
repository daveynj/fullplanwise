import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { signInPathFor } from "@shared/auth-redirect";

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: {
  path: string;
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    // Come back to this exact page (including its query, e.g. a topic and
    // level from a student's idea) after signing in.
    return (
      <Route path={path}>
        <Redirect to={signInPathFor(window.location.pathname + window.location.search)} />
      </Route>
    );
  }

  // Check admin requirement
  if (requireAdmin && !user.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
