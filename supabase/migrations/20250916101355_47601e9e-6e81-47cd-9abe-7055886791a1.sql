-- Create clinic header settings table
CREATE TABLE public.clinic_header_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_name VARCHAR(200) NOT NULL DEFAULT '',
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document templates table
CREATE TABLE public.document_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    price_from DECIMAL(10,2),
    price_to DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.clinic_header_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for clinic_header_settings
CREATE POLICY "Admins can manage header settings" 
ON public.clinic_header_settings 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view header settings" 
ON public.clinic_header_settings 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create policies for document_templates
CREATE POLICY "Admins can manage document templates" 
ON public.document_templates 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view document templates" 
ON public.document_templates 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create triggers for updating timestamps
CREATE TRIGGER update_clinic_header_settings_updated_at
BEFORE UPDATE ON public.clinic_header_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default header settings
INSERT INTO public.clinic_header_settings (clinic_name, address, phone, email)
VALUES ('Your Clinic Name', 'Your Clinic Address', '+60 12-345 6789', 'info@yourclinic.com');

-- Insert default templates
INSERT INTO public.document_templates (template_name, template_type, description, content, price_from, price_to)
VALUES 
('Medical Certificate Default', 'Medical certificate', 'Standard medical certificate template', 
'<p><strong>MEDICAL CERTIFICATE</strong></p>
<p>This is to certify that <strong>{{patient_name}}</strong> (IC: {{identification}}) has been examined by me on <strong>{{visit_date}}</strong>.</p>
<p>Diagnosis: <strong>{{diagnosis}}</strong></p>
<p>I hereby recommend medical leave from <strong>{{visit_date}}</strong> for <strong>{{mc_days}}</strong> day(s).</p>
<p>Doctor: <strong>{{doctor_name}}</strong><br>Date: <strong>{{visit_date}}</strong></p>', 
50.00, 120.00),

('Referral Letter', 'Medical document', 'Patient referral to specialist', 
'<p><strong>REFERRAL LETTER</strong></p>
<p>Dear Doctor,</p>
<p>I am referring <strong>{{patient_name}}</strong> ({{age}} years old, {{gender}}) for your expert opinion and management.</p>
<p>Clinical History: <strong>{{diagnosis}}</strong></p>
<p>Please find attached relevant investigations and reports.</p>
<p>Thank you for your kind attention.</p>
<p>Yours sincerely,<br><strong>{{doctor_name}}</strong></p>', 
0.00, 0.00),

('Pre Employment Form Driver', 'Medical records', 'Pre-employment medical examination for drivers', 
'<p><strong>PRE-EMPLOYMENT MEDICAL EXAMINATION - DRIVER</strong></p>
<p>Patient: <strong>{{patient_name}}</strong><br>IC: <strong>{{identification}}</strong><br>Age: <strong>{{age}}</strong><br>Gender: <strong>{{gender}}</strong></p>
<p>Medical Examination Results:</p>
<p>Vision: Normal<br>Hearing: Normal<br>Blood Pressure: Normal<br>General Health: Fit for duty</p>
<p>Examined by: <strong>{{doctor_name}}</strong><br>Date: <strong>{{visit_date}}</strong></p>', 
80.00, 150.00);