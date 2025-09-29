-- Fix billing foreign key constraint issue
-- The current trigger tries to use visit_id as appointment_id but the constraint expects actual appointments
-- We need to either remove the constraint or change the logic

-- First, let's drop the foreign key constraint since we're using visit-based billing, not appointment-based
ALTER TABLE public.billing DROP CONSTRAINT IF EXISTS billing_appointment_id_fkey;

-- Update the billing table to use visit_id properly and make appointment_id nullable
-- since we're working with patient visits, not appointments
ALTER TABLE public.billing 
  ALTER COLUMN appointment_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS visit_id UUID;

-- Add a proper foreign key to patient_visits
ALTER TABLE public.billing 
  ADD CONSTRAINT billing_visit_id_fkey 
  FOREIGN KEY (visit_id) REFERENCES public.patient_visits(id) ON DELETE CASCADE;

-- Update the trigger function to use visit_id correctly
CREATE OR REPLACE FUNCTION public.create_billing_from_visit()
RETURNS TRIGGER AS $$
DECLARE
    billing_item_record RECORD;
BEGIN
    -- Only create billing records for completed visits that don't already have billing
    IF NEW.payment_status IS NOT NULL AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
        
        -- Check if billing record already exists for this visit
        IF NOT EXISTS (SELECT 1 FROM public.billing WHERE visit_id = NEW.id) THEN
            
            -- Create main billing record for the visit
            INSERT INTO public.billing (
                patient_id,
                visit_id,
                appointment_id,
                invoice_number,
                description,
                amount,
                due_date,
                status,
                created_by
            ) VALUES (
                NEW.patient_id,
                NEW.id,
                NULL, -- No appointment_id since this is queue-based
                'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0'),
                'Medical consultation and treatment',
                NEW.total_amount,
                CURRENT_DATE + INTERVAL '30 days',
                CASE NEW.payment_status 
                    WHEN 'paid' THEN 'paid'
                    WHEN 'partial' THEN 'pending'
                    ELSE 'pending'
                END,
                NEW.doctor_id
            );
            
        ELSE
            -- Update existing billing record status if visit payment status changes
            UPDATE public.billing 
            SET 
                status = CASE NEW.payment_status 
                    WHEN 'paid' THEN 'paid'
                    WHEN 'partial' THEN 'pending'
                    ELSE 'pending'
                END,
                amount = NEW.total_amount,
                updated_at = now()
            WHERE visit_id = NEW.id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;