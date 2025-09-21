-- Fix search path security warnings for recently created functions
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;