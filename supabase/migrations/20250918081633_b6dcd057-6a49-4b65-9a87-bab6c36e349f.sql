-- Add foreign key constraints for proper table relationships
-- This will fix the Supabase relationship detection issues

-- Add foreign key constraint between patient_queue and patients
ALTER TABLE public.patient_queue 
ADD CONSTRAINT fk_patient_queue_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Add foreign key constraint between patient_queue and profiles (for assigned_doctor_id)
ALTER TABLE public.patient_queue 
ADD CONSTRAINT fk_patient_queue_assigned_doctor_id 
FOREIGN KEY (assigned_doctor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;