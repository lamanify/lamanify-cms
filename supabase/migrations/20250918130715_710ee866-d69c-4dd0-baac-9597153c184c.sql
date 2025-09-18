-- Create payment_records table for individual payment transactions
CREATE TABLE public.payment_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID REFERENCES public.patient_visits(id) ON DELETE CASCADE,
    invoice_id UUID,  -- Reference to billing table if exists
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash',
    reference_number TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'confirmed',
    metadata JSONB
);

-- Enable RLS on payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_records
CREATE POLICY "Staff can view payment records" 
ON public.payment_records 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create payment records" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can update payment records" 
ON public.payment_records 
FOR UPDATE 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can delete payment records" 
ON public.payment_records 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create indexes for better performance
CREATE INDEX idx_payment_records_patient_id ON public.payment_records(patient_id);
CREATE INDEX idx_payment_records_visit_id ON public.payment_records(visit_id);
CREATE INDEX idx_payment_records_payment_date ON public.payment_records(payment_date);
CREATE INDEX idx_payment_records_status ON public.payment_records(status);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_records_updated_at
    BEFORE UPDATE ON public.payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment_status column to patient_visits table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patient_visits' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.patient_visits 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded'));
    END IF;
END $$;

-- Add total_paid column to patient_visits table to track running total
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patient_visits' 
        AND column_name = 'total_paid'
    ) THEN
        ALTER TABLE public.patient_visits 
        ADD COLUMN total_paid NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Create function to update payment status automatically
CREATE OR REPLACE FUNCTION public.update_visit_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    visit_total NUMERIC;
    payments_total NUMERIC;
BEGIN
    -- Get the visit total amount
    SELECT total_amount INTO visit_total 
    FROM public.patient_visits 
    WHERE id = COALESCE(NEW.visit_id, OLD.visit_id);
    
    -- Calculate total payments for this visit
    SELECT COALESCE(SUM(amount), 0) INTO payments_total
    FROM public.payment_records 
    WHERE visit_id = COALESCE(NEW.visit_id, OLD.visit_id) 
    AND status = 'confirmed';
    
    -- Update visit payment status and total_paid
    UPDATE public.patient_visits 
    SET 
        total_paid = payments_total,
        payment_status = CASE 
            WHEN payments_total = 0 THEN 'pending'
            WHEN payments_total >= visit_total THEN 'paid'
            ELSE 'partial'
        END,
        updated_at = now()
    WHERE id = COALESCE(NEW.visit_id, OLD.visit_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers to automatically update payment status
CREATE TRIGGER payment_records_update_visit_status
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_visit_payment_status();