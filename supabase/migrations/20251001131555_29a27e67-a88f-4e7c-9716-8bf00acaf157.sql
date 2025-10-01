-- Fix billing sync trigger to handle both INSERT and UPDATE operations
CREATE OR REPLACE FUNCTION public.create_billing_from_visit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Handle both INSERT and UPDATE operations when payment_status is set
    IF NEW.payment_status IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
        
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
$function$;