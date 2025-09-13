import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // If we have a token and type, this is a password reset link
    if (token && type === 'recovery') {
      // The session should be automatically set by Supabase
      console.log('Password reset link detected');
    }
  }, [token, type]);

  // If user is already authenticated and not coming from a reset link, redirect
  if (user && !token) {
    return <Navigate to="/" replace />;
  }

  // If no token is present, redirect to auth page
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setIsUpdated(true);
      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });

      // Redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUpdated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">ClinicCare</h1>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <CardTitle className="text-success">Password Updated!</CardTitle>
              <CardDescription>
                Your password has been successfully updated. You will be redirected to the dashboard shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ClinicCare</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Reset your password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}