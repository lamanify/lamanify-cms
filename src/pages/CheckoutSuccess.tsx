import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'success' | 'error';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Verifying payment...');
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Simulate progress steps
    const steps = [
      'Verifying payment...',
      'Creating your workspace...',
      'Setting up your clinic profile...',
      'Configuring your database...',
      'Finalizing setup...'
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(steps[stepIndex]);
        setProgress((stepIndex / (steps.length - 1)) * 90); // Max 90% during setup
      }
    }, 1500);

    // Poll for tenant creation (webhook may take a few seconds)
    const checkTenantReady = async () => {
      const maxAttempts = 30; // 30 seconds
      let attempts = 0;
      
      const interval = setInterval(async () => {
        attempts++;
        
        try {
          // Check if user is authenticated first
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Check if user profile exists and has active subscription
            const { data: profile } = await supabase
              .from('profiles')
              .select(`
                id,
                tenant_id,
                tenants (
                  id,
                  subscription_status,
                  subdomain,
                  clinic_name
                )
              `)
              .eq('id', user.id)
              .single();

            if (profile?.tenants?.subscription_status === 'active') {
              clearInterval(interval);
              clearInterval(stepInterval);
              setProgress(100);
              setCurrentStep('Setup complete!');
              setStatus('success');
              
              // Redirect to dashboard after a brief celebration
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
              return;
            }
          } else {
            // If no user is authenticated, check by session_id via API
            const response = await fetch('/api/check-setup-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId })
            });
            
            if (response.ok) {
              const { ready, user_id } = await response.json();
              if (ready && user_id) {
                // Auto-sign in the user if setup is complete
                const { error } = await supabase.auth.signInWithPassword({
                  email: '', // This would come from the webhook
                  password: '' // Or use a magic link/token approach
                });
                
                if (!error) {
                  clearInterval(interval);
                  clearInterval(stepInterval);
                  setProgress(100);
                  setCurrentStep('Setup complete!');
                  setStatus('success');
                  
                  setTimeout(() => {
                    navigate('/dashboard');
                  }, 2000);
                  return;
                }
              }
            }
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            clearInterval(stepInterval);
            setStatus('error');
          }
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            clearInterval(stepInterval);
            setStatus('error');
          }
        }
      }, 1000);
    };

    checkTenantReady();

    // Cleanup on unmount
    return () => {
      clearInterval(stepInterval);
    };
  }, [sessionId, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Activity className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">LamaniHub</h1>
          </div>

          {/* Progress Ring */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </div>

          {/* Status Text */}
          <h2 className="text-2xl font-semibold mb-2">Setting up your workspace...</h2>
          <p className="text-muted-foreground mb-4">{currentStep}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm text-muted-foreground">
            This usually takes less than 30 seconds. Please don't close this window.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Activity className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">LamaniHub</h1>
          </div>

          {/* Success Animation */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
          </div>

          <h2 className="text-2xl font-semibold mb-2 text-green-600">Welcome to LamaniHub!</h2>
          <p className="text-muted-foreground mb-6">
            Your clinic workspace is ready. Redirecting to your dashboard...
          </p>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Activity className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">LamaniHub</h1>
        </div>

        {/* Error State */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Setup taking longer than expected</h2>
        <p className="text-muted-foreground mb-6">
          Don't worry! Your payment was successful. Our team is setting up your workspace manually.
          You'll receive an email with login details within 10 minutes.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
          >
            Try Dashboard Access
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            Back to Pricing
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Need help? Contact us at support@lamanihub.com
        </p>
      </div>
    </div>
  );
}