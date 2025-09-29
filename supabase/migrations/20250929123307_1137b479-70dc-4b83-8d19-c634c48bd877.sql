-- Create function to automatically create billing records when patient visit is finalized
CREATE OR REPLACE FUNCTION public.create_billing_from_visit()
RETURNS TRIGGER AS $$
DECLARE
    billing_item_record RECORD;
BEGIN
    -- Only create billing records for completed visits that don't already have billing
    IF NEW.payment_status IS NOT NULL AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
        
        -- Check if billing record already exists for this visit
        IF NOT EXISTS (SELECT 1 FROM public.billing WHERE appointment_id = NEW.id) THEN
            
            -- Create main billing record for the visit
            INSERT INTO public.billing (
                patient_id,
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
            
        END IF;
        
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
        WHERE appointment_id = NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create billing records
DROP TRIGGER IF EXISTS trigger_create_billing_from_visit ON public.patient_visits;
CREATE TRIGGER trigger_create_billing_from_visit
    AFTER UPDATE ON public.patient_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.create_billing_from_visit();