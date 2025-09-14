-- Add patient_id field to patients table
ALTER TABLE public.patients 
ADD COLUMN patient_id TEXT UNIQUE;

-- Create index for better performance on patient_id lookups
CREATE INDEX idx_patients_patient_id ON public.patients(patient_id);

-- Add comment for documentation
COMMENT ON COLUMN public.patients.patient_id IS 'Human-readable numeric patient ID (10-13 digits)';