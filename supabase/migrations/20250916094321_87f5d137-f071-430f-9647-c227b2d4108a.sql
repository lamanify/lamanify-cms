-- Add new columns to medications table for enhanced functionality
ALTER TABLE medications 
ADD COLUMN groups TEXT[], -- medicine groups/tags (e.g., Antibiotics)
ADD COLUMN cost_price NUMERIC DEFAULT 0, -- cost price 
ADD COLUMN stock_level INTEGER DEFAULT 0, -- current stock level
ADD COLUMN remarks TEXT, -- expiry notes, etc.
ADD COLUMN enable_dosage_settings BOOLEAN DEFAULT false; -- toggle for dosage settings

-- Create medication_dosage_templates table for default dosage settings
CREATE TABLE medication_dosage_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL,
    dosage_amount NUMERIC,
    dosage_unit TEXT, -- ml, mg, etc.
    instruction TEXT, -- After meal, Before meal, etc.
    precaution TEXT, -- Keep away from children, etc.
    frequency TEXT, -- OD, BD, TDS, QID, etc.
    duration_value INTEGER, -- number part of duration
    duration_unit TEXT, -- days, weeks, etc.
    indication TEXT, -- Infection, Fever, etc.
    dispense_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for medication_dosage_templates
ALTER TABLE medication_dosage_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage medication dosage templates"
ON medication_dosage_templates
FOR ALL
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view medication dosage templates"
ON medication_dosage_templates
FOR SELECT
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Add trigger for updated_at on medication_dosage_templates
CREATE TRIGGER update_medication_dosage_templates_updated_at
    BEFORE UPDATE ON medication_dosage_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();