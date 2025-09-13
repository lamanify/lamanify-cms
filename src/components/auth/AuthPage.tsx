import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Activity } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const { user, signIn, signUp, resetPassword } = useAuth();

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signIn(signInData.email, signInData.password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.firstName,
      signUpData.lastName
    );
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await resetPassword(forgotPasswordEmail);
    if (!result.error) {
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ClinicCare</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure clinic management system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {!showForgotPassword ? (
                  <div className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signInData.email}
                          onChange={(e) =>
                            setSignInData({ ...signInData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <button
                            type="button"
                            className="text-sm text-primary hover:underline"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={(e) =>
                            setSignInData({ ...signInData, password: e.target.value })
                          }
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Reset Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordEmail('');
                          }}
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        placeholder="First name"
                        value={signUpData.firstName}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        placeholder="Last name"
                        value={signUpData.lastName}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}