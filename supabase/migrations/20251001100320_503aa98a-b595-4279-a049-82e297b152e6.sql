-- Create stock adjustment audit table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.stock_adjustment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID REFERENCES public.stock_movements(id) ON DELETE SET NULL,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_number TEXT,
  adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  before_data JSONB,
  after_data JSONB,
  approval_status TEXT DEFAULT 'approved',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_adjustment_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view adjustment audit" ON public.stock_adjustment_audit
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create adjustment audit" ON public.stock_adjustment_audit
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_audit_medication ON public.stock_adjustment_audit(medication_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_audit_adjusted_by ON public.stock_adjustment_audit(adjusted_by);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_audit_adjusted_at ON public.stock_adjustment_audit(adjusted_at DESC);

-- Function to automatically log stock adjustments
CREATE OR REPLACE FUNCTION public.log_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log adjustment type movements
  IF NEW.movement_type = 'adjustment' THEN
    INSERT INTO public.stock_adjustment_audit (
      movement_id,
      medication_id,
      previous_stock,
      new_stock,
      adjustment_quantity,
      reason,
      reference_id,
      adjusted_by,
      before_data,
      after_data
    )
    SELECT
      NEW.id,
      NEW.medication_id,
      COALESCE(NEW.stock_after - NEW.quantity, 0),
      NEW.stock_after,
      NEW.quantity,
      COALESCE(NEW.reason, 'Stock adjustment'),
      NEW.reference_id,
      NEW.created_by,
      jsonb_build_object(
        'medication_id', NEW.medication_id,
        'stock_before', COALESCE(NEW.stock_after - NEW.quantity, 0),
        'movement_type', NEW.movement_type
      ),
      jsonb_build_object(
        'medication_id', NEW.medication_id,
        'stock_after', NEW.stock_after,
        'quantity', NEW.quantity,
        'reason', NEW.reason
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic audit logging
DROP TRIGGER IF EXISTS trigger_log_stock_adjustment ON public.stock_movements;
CREATE TRIGGER trigger_log_stock_adjustment
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stock_adjustment();