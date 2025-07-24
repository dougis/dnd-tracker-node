import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const Route = createFileRoute('/dashboard' as any)({
  component: Dashboard,
});

function Dashboard() {
  // TODO: Replace with actual authentication check
  const isAuthenticated = false; // This will be replaced with real auth logic
  
  return (
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-2">Encounters</h2>
              <p className="text-muted-foreground">Manage your D&D encounters</p>
            </div>
            <div className="bg-card text-card-foreground p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-2">Characters</h2>
              <p className="text-muted-foreground">Manage player characters</p>
            </div>
            <div className="bg-card text-card-foreground p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-2">Campaign</h2>
              <p className="text-muted-foreground">Track campaign progress</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}