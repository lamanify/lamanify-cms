-- Create patient_visits table for permanent visit history
CREATE TABLE public.patient_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  queue_id UUID NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_id UUID,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending'::text,
  visit_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient_visits
ALTER TABLE public.patient_visits ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_visits
CREATE POLICY "Staff can view patient visits" 
ON public.patient_visits 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create patient visits" 
ON public.patient_visits 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update patient visits" 
ON public.patient_visits 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete patient visits" 
ON public.patient_visits 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Add trigger for updating timestamps
CREATE TRIGGER update_patient_visits_updated_at
BEFORE UPDATE ON public.patient_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status column to queue_sessions for tracking archived sessions
ALTER TABLE public.queue_sessions 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;