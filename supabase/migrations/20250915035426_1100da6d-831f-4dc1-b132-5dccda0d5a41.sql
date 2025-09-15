-- Add 'dispensary' status to the patient_queue status check constraint
ALTER TABLE patient_queue DROP CONSTRAINT IF EXISTS patient_queue_status_check;

-- Add the updated constraint with 'dispensary' status
ALTER TABLE patient_queue ADD CONSTRAINT patient_queue_status_check 
CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'dispensary'));

-- Also fix the patient_current_medications table to add missing duration_days column
ALTER TABLE patient_current_medications ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Update existing records with default duration if needed
UPDATE patient_current_medications SET duration_days = 7 WHERE duration_days IS NULL;