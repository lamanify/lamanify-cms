-- Enable real-time for appointments table
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Add appointments table to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;