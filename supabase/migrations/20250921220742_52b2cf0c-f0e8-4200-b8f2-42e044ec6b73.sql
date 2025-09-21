-- Add advanced data fields to billing table for per-invoice staff information
ALTER TABLE public.billing 
ADD COLUMN staff_name TEXT,
ADD COLUMN staff_ic_passport TEXT,
ADD COLUMN relationship_to_patient TEXT DEFAULT 'self';

-- Create index for better performance on staff information queries
CREATE INDEX IF NOT EXISTS idx_billing_staff_info ON public.billing(staff_name, relationship_to_patient);

-- Add constraint to ensure relationship_to_patient uses valid values
ALTER TABLE public.billing 
ADD CONSTRAINT chk_relationship_to_patient 
CHECK (relationship_to_patient IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other'));

-- Update RLS policies to ensure staff can manage billing with new fields
-- The existing policies already cover these operations, so no changes needed

-- Add comment for documentation
COMMENT ON COLUMN public.billing.staff_name IS 'Name of the staff member or person associated with this billing item';
COMMENT ON COLUMN public.billing.staff_ic_passport IS 'IC number or passport number of the staff member';
COMMENT ON COLUMN public.billing.relationship_to_patient IS 'Relationship of the staff member to the patient (self, spouse, child, parent, sibling, other)';