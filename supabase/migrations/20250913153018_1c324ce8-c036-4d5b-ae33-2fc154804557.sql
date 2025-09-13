-- Add missing fields to patients table for enhanced registration form
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS preferred_name TEXT,
ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT CHECK (referral_source IN ('walk-in', 'doctor-referral', 'online-booking', 'others')),
ADD COLUMN IF NOT EXISTS visit_reason TEXT CHECK (visit_reason IN ('consultation', 'follow-up', 'emergency', 'others')),
ADD COLUMN IF NOT EXISTS additional_notes TEXT;