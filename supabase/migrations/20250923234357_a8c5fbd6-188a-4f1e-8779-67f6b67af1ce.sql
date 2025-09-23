-- Add missing fields to patients table to align with queue registration
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS nric TEXT,
ADD COLUMN IF NOT EXISTS passport TEXT, 
ADD COLUMN IF NOT EXISTS birth_cert TEXT,
ADD COLUMN IF NOT EXISTS insurance_info TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Malaysia',
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add check constraint for urgency level
ALTER TABLE patients 
ADD CONSTRAINT patients_urgency_level_check 
CHECK (urgency_level IN ('normal', 'urgent', 'emergency'));

-- Create index for better search performance on identity documents
CREATE INDEX IF NOT EXISTS idx_patients_nric ON patients(nric) WHERE nric IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_passport ON patients(passport) WHERE passport IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_birth_cert ON patients(birth_cert) WHERE birth_cert IS NOT NULL;