-- Create integration configurations table with encrypted keys
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_key_last4 TEXT NOT NULL,
  authentication_type TEXT NOT NULL DEFAULT 'api_key',
  headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  webhook_url TEXT,
  webhook_secret_last4 TEXT,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create webhook deliveries tracking table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_config_id UUID REFERENCES public.integration_configs(id) ON DELETE CASCADE,
  status_code INTEGER,
  signature_valid BOOLEAN,
  payload_hash TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for webhook deliveries lookup
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_config_id ON public.webhook_deliveries(integration_config_id, delivered_at DESC);

-- Enable RLS
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_configs
CREATE POLICY "Staff can manage integration configs"
ON public.integration_configs
FOR ALL
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- RLS policies for webhook_deliveries
CREATE POLICY "Staff can view webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "System can insert webhook deliveries"
ON public.webhook_deliveries
FOR INSERT
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_integration_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_integration_configs_updated_at
BEFORE UPDATE ON public.integration_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_integration_configs_updated_at();