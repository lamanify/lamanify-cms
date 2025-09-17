-- Enable real-time for patient_queue table
ALTER TABLE public.patient_queue REPLICA IDENTITY FULL;

-- Add patient_queue to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_queue;