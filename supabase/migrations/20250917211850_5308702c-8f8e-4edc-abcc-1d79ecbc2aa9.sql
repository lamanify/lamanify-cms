-- Create queue_sessions table
CREATE TABLE public.queue_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  session_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for queue_sessions
CREATE POLICY "Staff can view queue sessions"
ON public.queue_sessions
FOR SELECT
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create queue sessions"
ON public.queue_sessions
FOR INSERT
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update queue sessions"
ON public.queue_sessions
FOR UPDATE
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete queue sessions"
ON public.queue_sessions
FOR DELETE
USING (get_user_role() = 'admin'::user_role);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_queue_sessions_updated_at
BEFORE UPDATE ON public.queue_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();