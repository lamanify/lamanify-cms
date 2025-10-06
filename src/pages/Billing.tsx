import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Crown, ArrowLeft, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Billing() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Permission check - only tenant owners and super admins
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              Only clinic owners can manage billing and subscription settings.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch tenant billing info
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-billing', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id
  });

  const handleManageBilling = async () => {
    if (!profile?.tenant_id) {
      toast({
        title: "Error",
        description: "No tenant information found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: profile.tenant_id })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: 'Trial' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Payment Failed' },
      canceled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Canceled' },
      comped: { color: 'bg-purple-100 text-purple-800', icon: Crown, text: 'Complimentary' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Inactive' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  };

  const statusBadge = getStatusBadge(tenant?.subscription_status || 'inactive');
  const StatusIcon = statusBadge.icon;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your LamaniHub subscription and billing settings
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="transactions">Patient Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <CardDescription>LamaniHub Professional - Healthcare CRM</CardDescription>
                </div>
                <Badge className={statusBadge.color}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusBadge.text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comp'd Badge */}
              {tenant?.is_comped && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <div className="font-medium text-purple-800 mb-1">
                      🎁 Complimentary Access - {tenant.comp_reason === 'google_ads_bundle' ? 'Google Ads Package' : 'Partner Plan'}
                    </div>
                    <div className="text-sm text-purple-700">
                      You're not being charged for LamaniHub. This access is included with your service package.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Active Subscription Info */}
              {tenant?.subscription_status === 'active' && !tenant?.is_comped && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Amount:</span>
                      <span className="font-medium">RM 69 / month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next billing date:</span>
                      <span className="font-medium">
                        {tenant.current_period_end 
                          ? new Date(tenant.current_period_end).toLocaleDateString('en-MY', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Not available'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current period:</span>
                      <span className="font-medium">
                        {tenant.current_period_start 
                          ? new Date(tenant.current_period_start).toLocaleDateString('en-MY')
                          : 'N/A'
                        } - {tenant.current_period_end 
                          ? new Date(tenant.current_period_end).toLocaleDateString('en-MY')
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clinic subdomain:</span>
                      <span className="font-medium">{tenant.subdomain}.lamanihub.com</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Past Due Warning */}
              {tenant?.subscription_status === 'past_due' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="font-medium text-yellow-800 mb-1">
                      ⚠️ Payment Failed
                    </div>
                    <div className="text-sm text-yellow-700">
                      Please update your payment method to avoid losing access.
                      {tenant.grace_period_ends_at && (
                        <> Access expires on {new Date(tenant.grace_period_ends_at).toLocaleDateString('en-MY')}.</>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Canceled Status */}
              {tenant?.subscription_status === 'canceled' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-medium text-red-800 mb-1">
                      Subscription Canceled
                    </div>
                    <div className="text-sm text-red-700">
                      Your subscription has been canceled. Reactivate to continue using LamaniHub.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                {tenant?.is_comped ? (
                  <Button 
                    onClick={handleManageBilling}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? 'Loading...' : 'Switch to Self-Pay Plan'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleManageBilling}
                    disabled={loading}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? 'Loading...' : 'Manage Billing & Payment'}
                  </Button>
                )}
                
                <div className="text-xs text-muted-foreground text-center">
                  Securely managed by Stripe • Update payment methods, view invoices, and download receipts
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Included in Your Plan</CardTitle>
              <CardDescription>
                Complete healthcare management system for Malaysian clinics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Patient Management System</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Appointment Scheduling</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Queue Management</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Billing & Invoicing</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Medical Records Storage</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Reports & Analytics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">WhatsApp Integration</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Multi-user Access</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Cloud Backup & Security</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 Priority Support</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">PDPA Compliance</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Data Export & Backup</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Need help?</span>
                  <div className="space-x-4">
                    <span>📧 support@lamanify.com</span>
                    <span>📞 +60 12-345 6789</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Patient Billing Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                Patient billing and invoicing features will be available in the next update.
              </p>
              <Badge variant="outline">
                Feature in Development
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}