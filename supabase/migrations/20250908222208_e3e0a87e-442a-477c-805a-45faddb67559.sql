-- Create patient queue table for daily queue management
CREATE TABLE public.patient_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  queue_number TEXT NOT NULL,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled')),
  assigned_doctor_id UUID,
  estimated_consultation_duration INTEGER DEFAULT 30,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consultation_started_at TIMESTAMP WITH TIME ZONE,
  consultation_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(queue_date, queue_number)
);

-- Enable RLS
ALTER TABLE public.patient_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for patient queue
CREATE POLICY "All staff can view patient queue" 
ON public.patient_queue 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create queue entries" 
ON public.patient_queue 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update queue entries" 
ON public.patient_queue 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete queue entries" 
ON public.patient_queue 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create function to generate next queue number for the day
CREATE OR REPLACE FUNCTION public.generate_queue_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_patient_queue_updated_at
BEFORE UPDATE ON public.patient_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for patient_queue table
ALTER TABLE public.patient_queue REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.patient_queue;