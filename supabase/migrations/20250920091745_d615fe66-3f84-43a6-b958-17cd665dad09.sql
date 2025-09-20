-- Phase 1: Database Structure Enhancement for Price Tiers

-- 1. Enhance price_tiers table with missing fields
ALTER TABLE public.price_tiers 
ADD COLUMN IF NOT EXISTS is_default_for_panel boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_claim_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS coverage_rules jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS eligibility_rules jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requires_verification boolean DEFAULT false;

-- 2. Create tier assignment audit log table
CREATE TABLE IF NOT EXISTS public.tier_assignment_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  previous_tier_id uuid,
  new_tier_id uuid,
  assigned_by uuid NOT NULL,
  assignment_reason text,
  assignment_method text NOT NULL DEFAULT 'manual', -- 'manual', 'automatic', 'panel_based'
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tier assignment log
ALTER TABLE public.tier_assignment_log ENABLE ROW LEVEL SECURITY;

-- 3. Enhance panels_price_tiers table to include default tier selection
ALTER TABLE public.panels_price_tiers 
ADD COLUMN IF NOT EXISTS is_default_tier boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_order integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS effective_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS effective_until date DEFAULT NULL;

-- Create unique constraint to ensure only one default tier per panel
CREATE UNIQUE INDEX IF NOT EXISTS panels_price_tiers_default_unique 
ON public.panels_price_tiers (panel_id, is_default_tier) 
WHERE is_default_tier = true;

-- 4. Create RLS policies for tier assignment log
CREATE POLICY "Staff can view tier assignment log" 
ON public.tier_assignment_log 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create tier assignment log entries" 
ON public.tier_assignment_log 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can manage tier assignment log" 
ON public.tier_assignment_log 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

-- 5. Create function to log tier assignments
CREATE OR REPLACE FUNCTION public.log_tier_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when assigned_tier_id changes
  IF (OLD.assigned_tier_id IS DISTINCT FROM NEW.assigned_tier_id) THEN
    INSERT INTO public.tier_assignment_log (
      patient_id,
      previous_tier_id,
      new_tier_id,
      assigned_by,
      assignment_reason,
      assignment_method,
      metadata
    ) VALUES (
      NEW.id,
      OLD.assigned_tier_id,
      NEW.assigned_tier_id,
      COALESCE(NEW.tier_assigned_by, auth.uid()),
      'Tier assignment updated',
      CASE 
        WHEN NEW.tier_assigned_by IS NOT NULL THEN 'manual'
        ELSE 'automatic'
      END,
      jsonb_build_object(
        'previous_tier_assigned_at', OLD.tier_assigned_at,
        'new_tier_assigned_at', NEW.tier_assigned_at,
        'updated_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create trigger for automatic tier assignment logging
DROP TRIGGER IF EXISTS trigger_log_tier_assignment ON public.patients;
CREATE TRIGGER trigger_log_tier_assignment
  AFTER UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tier_assignment();

-- 7. Create function to get default tier for panel
CREATE OR REPLACE FUNCTION public.get_default_tier_for_panel(p_panel_id uuid)
RETURNS uuid AS $$
DECLARE
  default_tier_id uuid;
BEGIN
  SELECT pt.tier_id INTO default_tier_id
  FROM public.panels_price_tiers pt
  WHERE pt.panel_id = p_panel_id 
    AND pt.is_default_tier = true
    AND (pt.effective_from IS NULL OR pt.effective_from <= CURRENT_DATE)
    AND (pt.effective_until IS NULL OR pt.effective_until >= CURRENT_DATE)
  ORDER BY pt.priority_order ASC
  LIMIT 1;
  
  RETURN default_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 8. Create function to check tier eligibility
CREATE OR REPLACE FUNCTION public.check_tier_eligibility(p_patient_id uuid, p_tier_id uuid)
RETURNS boolean AS $$
DECLARE
  tier_eligibility_rules jsonb;
  patient_info record;
  is_eligible boolean := true;
BEGIN
  -- Get tier eligibility rules
  SELECT eligibility_rules INTO tier_eligibility_rules
  FROM public.price_tiers
  WHERE id = p_tier_id;
  
  -- If no rules defined, assume eligible
  IF tier_eligibility_rules IS NULL OR tier_eligibility_rules = '{}' THEN
    RETURN true;
  END IF;
  
  -- Get patient information
  SELECT * INTO patient_info
  FROM public.patients
  WHERE id = p_patient_id;
  
  -- TODO: Implement specific eligibility rule checking logic
  -- This is a placeholder that can be extended based on specific rules
  
  RETURN is_eligible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 9. Add comments to document the new fields
COMMENT ON COLUMN public.price_tiers.is_default_for_panel IS 'Whether this tier should be the default for patients under associated panels';
COMMENT ON COLUMN public.price_tiers.max_claim_amount IS 'Maximum claim amount allowed per visit for this tier';
COMMENT ON COLUMN public.price_tiers.coverage_rules IS 'JSON rules defining what services/medications are covered';
COMMENT ON COLUMN public.price_tiers.eligibility_rules IS 'JSON rules defining eligibility criteria for this tier';
COMMENT ON COLUMN public.price_tiers.requires_verification IS 'Whether tier assignment requires verification process';

COMMENT ON TABLE public.tier_assignment_log IS 'Audit log for all tier assignments and changes';
COMMENT ON COLUMN public.panels_price_tiers.is_default_tier IS 'Whether this is the default tier for the panel';
COMMENT ON COLUMN public.panels_price_tiers.priority_order IS 'Priority order for tier selection (lower = higher priority)';
COMMENT ON COLUMN public.panels_price_tiers.effective_from IS 'Date from which this tier assignment is effective';
COMMENT ON COLUMN public.panels_price_tiers.effective_until IS 'Date until which this tier assignment is effective';