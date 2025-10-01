import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using base64 and XOR (for demo - use proper encryption in production)
const encryptKey = (key: string): string => {
  const salt = Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-prod';
  const encrypted = Array.from(key).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
  ).join('');
  return btoa(encrypted);
};

const decryptKey = (encrypted: string): string => {
  const salt = Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-prod';
  const decoded = atob(encrypted);
  return Array.from(decoded).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
  ).join('');
};

const maskApiKey = (key: string): string => {
  if (key.length <= 4) return '••••';
  return '••••' + key.slice(-4);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const configId = pathParts[pathParts.length - 1];
    const action = pathParts[pathParts.length - 2];

    // GET - Retrieve integrations
    if (req.method === 'GET' && !configId.includes('test')) {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mask API keys in response
      const masked = data.map(config => ({
        ...config,
        api_key_masked: maskApiKey(config.api_key_last4),
        api_key_encrypted: undefined, // Never send encrypted key to client
      }));

      return new Response(JSON.stringify(masked), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new integration
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, provider, endpoint_url, api_key, authentication_type, headers, 
              retry_attempts, timeout_seconds, webhook_url, is_active } = body;

      // Encrypt API key
      const encrypted = encryptKey(api_key);
      const last4 = api_key.slice(-4);

      const { data, error } = await supabase
        .from('integration_configs')
        .insert({
          name,
          provider,
          endpoint_url,
          api_key_encrypted: encrypted,
          api_key_last4: last4,
          authentication_type,
          headers: headers || {},
          retry_attempts: retry_attempts || 3,
          timeout_seconds: timeout_seconds || 30,
          webhook_url,
          is_active: is_active !== false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        ...data,
        api_key_masked: maskApiKey(last4),
        api_key_encrypted: undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update integration
    if (req.method === 'PUT' && configId) {
      const body = await req.json();
      const updateData: any = { ...body };

      // If new API key provided, encrypt it
      if (body.api_key) {
        updateData.api_key_encrypted = encryptKey(body.api_key);
        updateData.api_key_last4 = body.api_key.slice(-4);
        delete updateData.api_key;
      }

      const { data, error } = await supabase
        .from('integration_configs')
        .update(updateData)
        .eq('id', configId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        ...data,
        api_key_masked: maskApiKey(data.api_key_last4),
        api_key_encrypted: undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Test connection
    if (req.method === 'POST' && action === 'test') {
      const startTime = Date.now();
      
      // Get integration config
      const { data: config, error: configError } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('id', configId)
        .single();

      if (configError) throw configError;

      try {
        // Decrypt API key for testing
        const decryptedKey = decryptKey(config.api_key_encrypted);

        // Build headers based on auth type
        const testHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...config.headers,
        };

        if (config.authentication_type === 'api_key') {
          testHeaders['X-API-Key'] = decryptedKey;
        } else if (config.authentication_type === 'bearer_token') {
          testHeaders['Authorization'] = `Bearer ${decryptedKey}`;
        }

        // Make test request (timeout after 10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const testResponse = await fetch(config.endpoint_url, {
          method: 'POST',
          headers: testHeaders,
          body: JSON.stringify({ test: true }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // Log test result
        await supabase.from('webhook_deliveries').insert({
          integration_config_id: configId,
          status_code: testResponse.status,
          signature_valid: testResponse.ok,
          response_time_ms: responseTime,
        });

        return new Response(JSON.stringify({
          success: testResponse.ok,
          status_code: testResponse.status,
          response_time_ms: responseTime,
          message: testResponse.ok ? 'Connection successful' : 'Connection failed',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (testError: any) {
        const responseTime = Date.now() - startTime;
        
        // Log failed test
        await supabase.from('webhook_deliveries').insert({
          integration_config_id: configId,
          status_code: 0,
          signature_valid: false,
          response_time_ms: responseTime,
          error_message: testError.message,
        });

        return new Response(JSON.stringify({
          success: false,
          status_code: 0,
          response_time_ms: responseTime,
          error: testError.message,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // GET - Webhook deliveries
    if (req.method === 'GET' && url.pathname.includes('webhooks')) {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('integration_config_id', configId)
        .order('delivered_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Remove integration
    if (req.method === 'DELETE' && configId) {
      const { error } = await supabase
        .from('integration_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in claims-integrations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
