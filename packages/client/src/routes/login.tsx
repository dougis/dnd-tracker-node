import { createFileRoute, Link } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/login' as any)({
  component: Login,
});

function Login() {
  const handleLogin = async (data: { email: string; password: string }) => {
    console.log('Login attempt:', data);
    // TODO: Implement actual login logic
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm 
            onSubmit={handleLogin} 
            signUpLink={
              <Link to={"/register" as any} className="text-primary hover:underline">
                Sign up
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}