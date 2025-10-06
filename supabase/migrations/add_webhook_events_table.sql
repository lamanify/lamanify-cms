-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Add columns to tenants table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='is_comped') THEN
    ALTER TABLE tenants ADD COLUMN is_comped BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='comp_reason') THEN
    ALTER TABLE tenants ADD COLUMN comp_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='grace_period_ends_at') THEN
    ALTER TABLE tenants ADD COLUMN grace_period_ends_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='current_period_start') THEN
    ALTER TABLE tenants ADD COLUMN current_period_start TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='current_period_end') THEN
    ALTER TABLE tenants ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='plan_code') THEN
    ALTER TABLE tenants ADD COLUMN plan_code TEXT DEFAULT 'crm_basic';
  END IF;
END $$;

-- Update subscription_status enum to include new statuses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM (
      'active', 
      'inactive', 
      'canceled', 
      'past_due', 
      'trialing', 
      'comped'
    );
  END IF;
END $$;

-- Add RLS policies for webhook_events table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook events
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Comment the table
COMMENT ON TABLE webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN tenants.is_comped IS 'True if subscription is complimentary (100% discount)';
COMMENT ON COLUMN tenants.comp_reason IS 'Reason for complimentary access';
COMMENT ON COLUMN tenants.grace_period_ends_at IS '7-day grace period end date for past_due subscriptions';