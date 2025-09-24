-- Update the patient_queue status constraint to allow 'urgent' status
ALTER TABLE public.patient_queue 
DROP CONSTRAINT IF EXISTS patient_queue_status_check;

-- Add the updated constraint with 'urgent' included
ALTER TABLE public.patient_queue 
ADD CONSTRAINT patient_queue_status_check 
CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'dispensary', 'urgent'));