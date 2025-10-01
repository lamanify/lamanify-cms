import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: string;
  endpoint_url: string;
  api_key_masked: string;
  api_key_last4: string;
  authentication_type: 'api_key' | 'bearer_token' | 'basic_auth';
  headers: Record<string, string>;
  is_active: boolean;
  retry_attempts: number;
  timeout_seconds: number;
  webhook_url?: string;
  webhook_secret_last4?: string;
  created_at: string;
  last_used_at?: string;
  success_count: number;
  error_count: number;
}

export interface WebhookDelivery {
  id: string;
  integration_config_id: string;
  status_code: number;
  signature_valid: boolean;
  response_time_ms: number;
  error_message?: string;
  delivered_at: string;
}

export function useClaimsIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('claims-integrations', {
        method: 'GET',
      });

      if (response.error) throw response.error;
      setIntegrations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (config: Partial<IntegrationConfig> & { api_key: string }) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('claims-integrations', {
        method: 'POST',
        body: config,
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: 'Integration created successfully',
      });

      await fetchIntegrations();
      return response.data;
    } catch (error: any) {
      console.error('Error creating integration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create integration',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (id: string, updates: Partial<IntegrationConfig> & { api_key?: string }) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke(`claims-integrations/${id}`, {
        method: 'PUT',
        body: updates,
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: 'Integration updated successfully',
      });

      await fetchIntegrations();
      return response.data;
    } catch (error: any) {
      console.error('Error updating integration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update integration',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteIntegration = async (id: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke(`claims-integrations/${id}`, {
        method: 'DELETE',
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: 'Integration deleted successfully',
      });

      await fetchIntegrations();
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete integration',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (id: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke(`claims-integrations/${id}/test`, {
        method: 'POST',
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        description: result.success 
          ? `API endpoint responded in ${result.response_time_ms}ms`
          : result.error || 'Unable to connect to API endpoint',
        variant: result.success ? 'default' : 'destructive',
      });

      return result;
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Test Failed',
        description: error.message || 'Error testing connection',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookDeliveries = async (configId: string): Promise<WebhookDelivery[]> => {
    try {
      const response = await supabase.functions.invoke(`claims-integrations/${configId}/webhooks`, {
        method: 'GET',
      });

      if (response.error) throw response.error;
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching webhook deliveries:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return {
    integrations,
    loading,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    fetchWebhookDeliveries,
  };
}
