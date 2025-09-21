-- Fix function search path security warnings
-- Update functions to have explicit search_path settings

-- Fix generate_queue_number function
CREATE OR REPLACE FUNCTION public.generate_queue_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    next_number INTEGER;
    queue_num TEXT;
BEGIN
    -- Get the next queue number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(queue_number FROM 2) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.patient_queue
    WHERE queue_date = CURRENT_DATE;
    
    -- Format as Q001, Q002, etc.
    queue_num := 'Q' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN queue_num;
END;
$function$;

-- Fix generate_claim_number function
CREATE OR REPLACE FUNCTION public.generate_claim_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    RETURN 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
END;
$function$;

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
END;
$function$;