-- Add panel-related columns to billing table
ALTER TABLE public.billing 
ADD COLUMN panel_id uuid REFERENCES public.panels(id),
ADD COLUMN claim_number text,
ADD COLUMN claim_status text DEFAULT 'pending',
ADD COLUMN submission_date date,
ADD COLUMN claim_submitted_by uuid REFERENCES public.profiles(id),
ADD COLUMN panel_reference_number text,
ADD COLUMN claim_notes text;

-- Create panel_claims table for detailed claim tracking
CREATE TABLE public.panel_claims (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_number text NOT NULL UNIQUE,
    panel_id uuid NOT NULL REFERENCES public.panels(id),
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    total_items integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft',
    submitted_at timestamp with time zone,
    submitted_by uuid REFERENCES public.profiles(id),
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES public.profiles(id),
    paid_at timestamp with time zone,
    paid_amount numeric DEFAULT 0,
    rejection_reason text,
    panel_reference_number text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create panel_claim_items junction table linking claims to billing records
CREATE TABLE public.panel_claim_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id uuid NOT NULL REFERENCES public.panel_claims(id) ON DELETE CASCADE,
    billing_id uuid NOT NULL REFERENCES public.billing(id) ON DELETE CASCADE,
    item_amount numeric NOT NULL,
    claim_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'included',
    rejection_reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(claim_id, billing_id)
);

-- Add RLS policies for panel_claims
ALTER TABLE public.panel_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view panel claims" ON public.panel_claims
FOR SELECT USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create panel claims" ON public.panel_claims
FOR INSERT WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update panel claims" ON public.panel_claims
FOR UPDATE USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete panel claims" ON public.panel_claims
FOR DELETE USING (get_user_role() = 'admin'::user_role);

-- Add RLS policies for panel_claim_items
ALTER TABLE public.panel_claim_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view panel claim items" ON public.panel_claim_items
FOR SELECT USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create panel claim items" ON public.panel_claim_items
FOR INSERT WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update panel claim items" ON public.panel_claim_items
FOR UPDATE USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete panel claim items" ON public.panel_claim_items
FOR DELETE USING (get_user_role() = 'admin'::user_role);

-- Create function to generate claim numbers
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    RETURN 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_panel_claims_updated_at
    BEFORE UPDATE ON public.panel_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_panel_claims_panel_id ON public.panel_claims(panel_id);
CREATE INDEX idx_panel_claims_status ON public.panel_claims(status);
CREATE INDEX idx_panel_claims_billing_period ON public.panel_claims(billing_period_start, billing_period_end);
CREATE INDEX idx_billing_panel_id ON public.billing(panel_id);
CREATE INDEX idx_billing_claim_status ON public.billing(claim_status);
CREATE INDEX idx_panel_claim_items_claim_id ON public.panel_claim_items(claim_id);
CREATE INDEX idx_panel_claim_items_billing_id ON public.panel_claim_items(billing_id);