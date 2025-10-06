import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TenantSubscription {
  subscription_status: string;
  grace_period_ends_at: string | null;
  is_comped: boolean | null;
}

export function useSubscriptionGuard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [tenant, setTenant] = useState<TenantSubscription | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      // If no user or profile yet, keep loading
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      // Super admin bypasses ALL checks - immediate access
      if (profile.role === 'super_admin') {
        setHasAccess(true);
        setLoading(false);
        setTenant(null); // Super admin doesn't need tenant info
        return; // Exit early, no navigation
      }

      // Regular users need tenant validation
      if (!profile.tenant_id) {
        setHasAccess(false);
        setLoading(false);
        navigate('/billing/inactive');
        return;
      }

      try {
        // Get tenant subscription status
        const { data: tenantData, error } = await supabase
          .from('tenants')
          .select('subscription_status, grace_period_ends_at, is_comped')
          .eq('id', profile.tenant_id)
          .single();

        if (error || !tenantData) {
          console.error('Error fetching tenant:', error);
          setHasAccess(false);
          setLoading(false);
          navigate('/billing/inactive');
          return;
        }

        setTenant(tenantData);

        // Check access based on subscription status
        const allowedStatuses = ['active', 'trialing'];
        let accessGranted = allowedStatuses.includes(tenantData.subscription_status);

        // Grant access to comp'd accounts
        if (tenantData.is_comped && tenantData.subscription_status === 'comped') {
          accessGranted = true;
        }

        // Grace period check for past_due subscriptions
        if (tenantData.subscription_status === 'past_due' && tenantData.grace_period_ends_at) {
          const gracePeriodEnd = new Date(tenantData.grace_period_ends_at);
          const now = new Date();
          
          if (gracePeriodEnd > now) {
            // Still within grace period - allow access
            accessGranted = true;
          }
        }

        if (!accessGranted) {
          navigate('/billing/inactive');
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Subscription check error:', error);
        setHasAccess(false);
        navigate('/billing/inactive');
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user, profile, navigate]);

  // For super admins, return immediate access with no tenant restrictions
  const isSuperAdmin = profile?.role === 'super_admin';
  
  return { 
    loading, 
    hasAccess: isSuperAdmin ? true : hasAccess, 
    tenant: isSuperAdmin ? null : tenant,
    isInGracePeriod: isSuperAdmin ? false : (
      tenant?.subscription_status === 'past_due' && 
      tenant?.grace_period_ends_at && 
      new Date(tenant.grace_period_ends_at) > new Date()
    ),
    isSuperAdmin
  };
}