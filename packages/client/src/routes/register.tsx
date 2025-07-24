import { createFileRoute, Link } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/register' as any)({
  component: Register,
});

function Register() {
  const handleRegister = async (data: { email: string; password: string; confirmPassword: string }) => {
    console.log('Registration attempt:', data);
    // TODO: Implement actual registration logic
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm 
            onSubmit={handleRegister} 
            signInLink={
              <Link to={"/login" as any} className="text-primary hover:underline">
                Sign in
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}