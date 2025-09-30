-- Add billing_party_snapshot column to billing table for storing billing party details
ALTER TABLE public.billing 
ADD COLUMN IF NOT EXISTS billing_party_snapshot JSONB DEFAULT NULL;

COMMENT ON COLUMN public.billing.billing_party_snapshot IS 'Stores snapshot of billing party details including staff_name, staff_ic, relationship, and billing_address';