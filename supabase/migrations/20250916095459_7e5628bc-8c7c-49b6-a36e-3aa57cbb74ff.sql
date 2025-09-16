-- Add new columns to medical_services table for enhanced service management
ALTER TABLE medical_services 
ADD COLUMN service_type TEXT DEFAULT 'Service' CHECK (service_type IN ('Service', 'Procedure', 'Investigation', 'Consultation')),
ADD COLUMN cost_price NUMERIC DEFAULT 0,
ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived'));