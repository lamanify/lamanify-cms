-- Create panel claims audit table for tracking all status changes
CREATE TABLE public.panel_claims_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.panel_claims(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on audit table
ALTER TABLE public.panel_claims_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table
CREATE POLICY "Staff can view panel claims audit"
ON public.panel_claims_audit
FOR SELECT
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "System can insert audit records"
ON public.panel_claims_audit
FOR INSERT
WITH CHECK (true);

-- Create function to log panel claim changes
CREATE OR REPLACE FUNCTION public.log_panel_claim_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed or if it's an UPDATE operation
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.panel_claims_audit (
      claim_id,
      previous_status,
      new_status,
      previous_data,
      new_data,
      changed_by,
      metadata
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
      row_to_json(NEW)::jsonb,
      auth.uid(),
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for panel claims audit logging
CREATE TRIGGER panel_claims_audit_trigger
  AFTER INSERT OR UPDATE ON public.panel_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.log_panel_claim_change();

-- Add indexes for performance
CREATE INDEX idx_panel_claims_audit_claim_id ON public.panel_claims_audit(claim_id);
CREATE INDEX idx_panel_claims_audit_changed_at ON public.panel_claims_audit(changed_at DESC);
CREATE INDEX idx_panel_claims_audit_status ON public.panel_claims_audit(new_status);

-- Add validation function for status transitions
CREATE OR REPLACE FUNCTION public.validate_claim_status_transition(
  old_status TEXT,
  new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid status transitions
  CASE old_status
    WHEN 'draft' THEN
      RETURN new_status = ANY(ARRAY['submitted', 'rejected']);
    WHEN 'submitted' THEN
      RETURN new_status = ANY(ARRAY['approved', 'rejected']);
    WHEN 'approved' THEN
      RETURN new_status = ANY(ARRAY['paid', 'rejected']);
    WHEN 'paid' THEN
      -- Paid status is final and irreversible
      RETURN false;
    WHEN 'rejected' THEN
      -- Allow resubmission from rejected
      RETURN new_status = ANY(ARRAY['draft', 'submitted']);
    ELSE
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;