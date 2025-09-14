-- Create patient activities table for comprehensive activity tracking
CREATE TABLE public.patient_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- consultation, medication, payment, communication, appointment, vital_signs, lab_results, system_note
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    staff_member_id UUID REFERENCES public.profiles(id),
    title VARCHAR(200) NOT NULL, -- Brief description
    content TEXT, -- Detailed content (consultation notes, etc.)
    metadata JSONB, -- Flexible data (medication details, payment info, etc.)
    related_record_id UUID, -- Link to consultation, payment, etc.
    status VARCHAR(50) DEFAULT 'active', -- active, archived, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_patient_activities_patient_id ON public.patient_activities(patient_id);
CREATE INDEX idx_patient_activities_type_date ON public.patient_activities(activity_type, activity_date DESC);
CREATE INDEX idx_patient_activities_staff ON public.patient_activities(staff_member_id);
CREATE INDEX idx_patient_activities_date ON public.patient_activities(activity_date DESC);

-- Enable RLS
ALTER TABLE public.patient_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view patient activities" 
ON public.patient_activities 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create patient activities" 
ON public.patient_activities 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update patient activities" 
ON public.patient_activities 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete patient activities" 
ON public.patient_activities 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patient_activities_updated_at
BEFORE UPDATE ON public.patient_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.patient_activities IS 'Comprehensive activity tracking for patients - consultations, medications, payments, communications, etc.';

-- Create current medications tracking table
CREATE TABLE public.patient_current_medications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    prescribed_date DATE NOT NULL,
    prescribed_by UUID REFERENCES public.profiles(id),
    refill_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, discontinued, completed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for medications
ALTER TABLE public.patient_current_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage current medications" 
ON public.patient_current_medications 
FOR ALL 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create trigger for medications timestamp updates
CREATE TRIGGER update_patient_medications_updated_at
BEFORE UPDATE ON public.patient_current_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();