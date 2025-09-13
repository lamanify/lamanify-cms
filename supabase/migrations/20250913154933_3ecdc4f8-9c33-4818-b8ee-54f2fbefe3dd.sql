-- Add tables for comprehensive consultation system

-- Create consultation sessions table to track active consultations
CREATE TABLE IF NOT EXISTS public.consultation_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    queue_id UUID,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'emergency')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medications master table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand_name TEXT,
    generic_name TEXT,
    category TEXT,
    dosage_forms TEXT[], -- ['tablet', 'syrup', 'injection']
    strength_options TEXT[], -- ['10mg', '25mg', '50mg']
    interactions TEXT[],
    contraindications TEXT[],
    side_effects TEXT[],
    price_per_unit NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services/procedures master table
CREATE TABLE IF NOT EXISTS public.medical_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    price NUMERIC(10,2) NOT NULL,
    requires_equipment BOOLEAN DEFAULT false,
    preparation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment items table (medicines and services prescribed in consultation)
CREATE TABLE IF NOT EXISTS public.treatment_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_session_id UUID NOT NULL,
    consultation_note_id UUID,
    item_type TEXT NOT NULL CHECK (item_type IN ('medication', 'service')),
    medication_id UUID,
    service_id UUID,
    quantity INTEGER DEFAULT 1,
    dosage_instructions TEXT,
    rate NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    duration_days INTEGER,
    frequency TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultation files table for document uploads
CREATE TABLE IF NOT EXISTS public.consultation_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_session_id UUID NOT NULL,
    consultation_note_id UUID,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consultation_sessions
CREATE POLICY "Doctors can view consultation sessions" 
ON public.consultation_sessions 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

CREATE POLICY "Doctors can create consultation sessions" 
ON public.consultation_sessions 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

CREATE POLICY "Doctors can update consultation sessions" 
ON public.consultation_sessions 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

-- Create RLS policies for medications (viewable by all staff)
CREATE POLICY "Staff can view medications" 
ON public.medications 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can manage medications" 
ON public.medications 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

-- Create RLS policies for medical_services
CREATE POLICY "Staff can view medical services" 
ON public.medical_services 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can manage medical services" 
ON public.medical_services 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

-- Create RLS policies for treatment_items
CREATE POLICY "Doctors can view treatment items" 
ON public.treatment_items 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

CREATE POLICY "Doctors can create treatment items" 
ON public.treatment_items 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

CREATE POLICY "Doctors can update treatment items" 
ON public.treatment_items 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

-- Create RLS policies for consultation_files
CREATE POLICY "Doctors can view consultation files" 
ON public.consultation_files 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

CREATE POLICY "Doctors can upload consultation files" 
ON public.consultation_files 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role]));

-- Add foreign key constraints
ALTER TABLE public.treatment_items
ADD CONSTRAINT fk_treatment_items_consultation_session
FOREIGN KEY (consultation_session_id) REFERENCES public.consultation_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.treatment_items
ADD CONSTRAINT fk_treatment_items_consultation_note
FOREIGN KEY (consultation_note_id) REFERENCES public.consultation_notes(id) ON DELETE CASCADE;

ALTER TABLE public.treatment_items
ADD CONSTRAINT fk_treatment_items_medication
FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE SET NULL;

ALTER TABLE public.treatment_items
ADD CONSTRAINT fk_treatment_items_service
FOREIGN KEY (service_id) REFERENCES public.medical_services(id) ON DELETE SET NULL;

ALTER TABLE public.consultation_files
ADD CONSTRAINT fk_consultation_files_session
FOREIGN KEY (consultation_session_id) REFERENCES public.consultation_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.consultation_files
ADD CONSTRAINT fk_consultation_files_note
FOREIGN KEY (consultation_note_id) REFERENCES public.consultation_notes(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_consultation_sessions_doctor_id ON public.consultation_sessions(doctor_id);
CREATE INDEX idx_consultation_sessions_patient_id ON public.consultation_sessions(patient_id);
CREATE INDEX idx_consultation_sessions_status ON public.consultation_sessions(status);
CREATE INDEX idx_treatment_items_consultation_session ON public.treatment_items(consultation_session_id);
CREATE INDEX idx_medications_name ON public.medications(name);
CREATE INDEX idx_medical_services_category ON public.medical_services(category);

-- Add trigger for updated_at columns
CREATE TRIGGER update_consultation_sessions_updated_at
BEFORE UPDATE ON public.consultation_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_services_updated_at
BEFORE UPDATE ON public.medical_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_items_updated_at
BEFORE UPDATE ON public.treatment_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample medications
INSERT INTO public.medications (name, brand_name, generic_name, category, dosage_forms, strength_options, price_per_unit) VALUES
('Paracetamol', 'Tylenol', 'Acetaminophen', 'Analgesic', ARRAY['tablet', 'syrup'], ARRAY['500mg', '650mg'], 2.50),
('Amoxicillin', 'Amoxil', 'Amoxicillin', 'Antibiotic', ARRAY['capsule', 'syrup'], ARRAY['250mg', '500mg'], 15.00),
('Omeprazole', 'Prilosec', 'Omeprazole', 'Antacid', ARRAY['capsule'], ARRAY['20mg', '40mg'], 25.00),
('Metformin', 'Glucophage', 'Metformin', 'Antidiabetic', ARRAY['tablet'], ARRAY['500mg', '850mg', '1000mg'], 12.00),
('Aspirin', 'Bayer', 'Acetylsalicylic acid', 'Analgesic', ARRAY['tablet'], ARRAY['75mg', '300mg'], 5.00)
ON CONFLICT DO NOTHING;

-- Insert sample medical services
INSERT INTO public.medical_services (name, category, description, duration_minutes, price) VALUES
('General Consultation', 'Consultation', 'Standard medical consultation', 30, 50.00),
('Follow-up Consultation', 'Consultation', 'Follow-up visit for existing condition', 20, 30.00),
('Blood Pressure Check', 'Vital Signs', 'Blood pressure measurement and monitoring', 10, 15.00),
('ECG', 'Diagnostic', 'Electrocardiogram test', 15, 75.00),
('Blood Sugar Test', 'Laboratory', 'Random blood glucose test', 5, 20.00),
('Vaccination', 'Preventive', 'Routine vaccination administration', 10, 40.00),
('Wound Dressing', 'Treatment', 'Wound cleaning and dressing', 20, 35.00)
ON CONFLICT DO NOTHING;