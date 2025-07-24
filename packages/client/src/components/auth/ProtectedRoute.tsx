import { useEffect, ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';

interface ProtectedRouteProps {
  children: ReactNode;
  isAuthenticated: boolean | undefined;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  isAuthenticated, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.navigate({ to: redirectTo as any });
    }
  }, [isAuthenticated, redirectTo, router]);

  // Show loading state while authentication status is being determined
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
}