import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { Loader2, Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, hasAccess } = useSubscriptionGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">LamaniHub</h1>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/billing/inactive" replace />;
  }

  return <>{children}</>;
}