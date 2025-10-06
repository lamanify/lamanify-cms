import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Building2, Users, Calendar, CreditCard, Activity, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PricingFormData {
  email: string;
  clinicName: string;
  subdomain: string;
}

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PricingFormData>({
    email: '',
    clinicName: '',
    subdomain: ''
  });
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const canceled = searchParams.get('canceled');

  const features = [
    'Patient Management System',
    'Appointment Scheduling',
    'Queue Management',
    'Billing & Invoicing',
    'Medical Records',
    'Reports & Analytics',
    'WhatsApp Integration',
    'Multi-user Access',
    'Cloud Backup',
    '24/7 Support'
  ];

  const handleInputChange = (field: keyof PricingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'subdomain') {
      setSubdomainAvailable(null);
      if (value.length > 2) {
        checkSubdomainAvailability(value);
      }
    }
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    setSubdomainChecking(true);
    try {
      // In a real implementation, this would call your API
      // For now, we'll simulate the check
      const response = await fetch('/api/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });
      
      if (response.ok) {
        const { available } = await response.json();
        setSubdomainAvailable(available);
      }
    } catch (error) {
      console.error('Error checking subdomain:', error);
    } finally {
      setSubdomainChecking(false);
    }
  };

  const handleStartSubscription = async () => {
    // Validate form
    if (!formData.email || !formData.clinicName || !formData.subdomain) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast({
        title: "Invalid Subdomain",
        description: "Subdomain can only contain lowercase letters, numbers, and hyphens.",
        variant: "destructive"
      });
      return;
    }

    if (subdomainAvailable === false) {
      toast({
        title: "Subdomain Taken",
        description: "This subdomain is already taken. Please choose another.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          clinicName: formData.clinicName,
          subdomain: formData.subdomain
        })
      });

      const { sessionId, url, error } = await response.json();

      if (error) {
        toast({
          title: "Checkout Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">LamaniHub</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Complete Healthcare Management System for Malaysian Clinics
          </p>
        </div>

        {/* Canceled Alert */}
        {canceled && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Payment was canceled. No worries! You can try again anytime.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Pricing Card */}
          <Card className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
              🚀 Launch Special
            </Badge>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Professional Plan</CardTitle>
              <CardDescription>Everything you need to run your clinic</CardDescription>
              <div className="pt-4">
                <div className="text-4xl font-bold text-primary">RM49</div>
                <div className="text-sm text-muted-foreground">/month per clinic</div>
                <div className="text-xs text-green-600 font-medium mt-1">
                  🎯 First 100 clinics get 50% off for 6 months!
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Secure payment via Stripe</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                  <Building2 className="h-4 w-4" />
                  <span>Cancel anytime, no long-term contracts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Up Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Start Your Free Trial</span>
              </CardTitle>
              <CardDescription>
                Set up your clinic workspace in under 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@yourclinic.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name *</Label>
                <Input
                  id="clinicName"
                  placeholder="Amazing Clinic Sdn Bhd"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Choose Your Workspace URL *</Label>
                <div className="flex">
                  <Input
                    id="subdomain"
                    placeholder="amazing-clinic"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase())}
                    className="rounded-r-none"
                    required
                  />
                  <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                    .lamanihub.com
                  </div>
                </div>
                {subdomainChecking && (
                  <p className="text-xs text-muted-foreground">Checking availability...</p>
                )}
                {subdomainAvailable === true && (
                  <p className="text-xs text-green-600 flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>Available!</span>
                  </p>
                )}
                {subdomainAvailable === false && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <X className="h-3 w-3" />
                    <span>Already taken</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This will be your clinic's login URL
                </p>
              </div>

              <Button 
                onClick={handleStartSubscription} 
                disabled={loading || subdomainAvailable === false}
                className="w-full" 
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating checkout...</span>
                  </div>
                ) : (
                  'Start for RM49/month'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By clicking "Start", you agree to our terms of service and privacy policy.
                You can cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <span>🔒 256-bit SSL Encryption</span>
            <span>🇲🇾 Malaysian Data Compliance</span>
            <span>⚡ 99.9% Uptime SLA</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')}
            className="text-primary"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}