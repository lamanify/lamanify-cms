-- Create E-Invoicing & Compliance Framework tables

-- Create e_invoice_templates table for compliance templates
CREATE TABLE public.e_invoice_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('lhdn_standard', 'lhdn_simplified', 'lhdn_self_billed', 'international')),
    template_version TEXT NOT NULL DEFAULT '1.0',
    compliance_country TEXT NOT NULL DEFAULT 'MY',
    template_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create e_invoices table for generated invoices
CREATE TABLE public.e_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL, -- Reference to billing table
    uin TEXT NOT NULL UNIQUE, -- Unique Invoice Number
    template_id UUID,
    invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    qr_code_data TEXT,
    qr_code_url TEXT,
    digital_signature JSONB,
    compliance_status TEXT NOT NULL DEFAULT 'draft' CHECK (compliance_status IN ('draft', 'validated', 'submitted', 'accepted', 'rejected')),
    submission_id TEXT,
    submission_date TIMESTAMP WITH TIME ZONE,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    lhdn_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create compliance_submissions table
CREATE TABLE public.compliance_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('lhdn_einvoice', 'gst_return', 'tax_filing')),
    submission_batch_id TEXT,
    invoice_ids UUID[] DEFAULT '{}',
    submission_status TEXT NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    total_invoices INTEGER NOT NULL DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,
    failed_submissions INTEGER DEFAULT 0,
    submission_data JSONB DEFAULT '{}'::jsonb,
    api_response JSONB,
    error_details JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create compliance_settings table
CREATE TABLE public.compliance_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code TEXT NOT NULL DEFAULT 'MY',
    setting_category TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(country_code, setting_category, setting_key)
);

-- Create digital_signatures table
CREATE TABLE public.digital_signatures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    signature_type TEXT NOT NULL CHECK (signature_type IN ('pkcs7', 'xml_dsig', 'pdf_signature')),
    signature_data TEXT NOT NULL,
    certificate_info JSONB,
    signing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_valid BOOLEAN DEFAULT true,
    validation_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Add foreign key constraints
ALTER TABLE public.e_invoices 
ADD CONSTRAINT fk_einvoice_billing 
FOREIGN KEY (invoice_id) REFERENCES public.billing(id) ON DELETE CASCADE;

ALTER TABLE public.e_invoices 
ADD CONSTRAINT fk_einvoice_template 
FOREIGN KEY (template_id) REFERENCES public.e_invoice_templates(id);

ALTER TABLE public.digital_signatures 
ADD CONSTRAINT fk_signature_einvoice 
FOREIGN KEY (invoice_id) REFERENCES public.e_invoices(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_e_invoices_uin ON public.e_invoices(uin);
CREATE INDEX idx_e_invoices_status ON public.e_invoices(compliance_status);
CREATE INDEX idx_e_invoices_submission_date ON public.e_invoices(submission_date);
CREATE INDEX idx_compliance_submissions_status ON public.compliance_submissions(submission_status);
CREATE INDEX idx_compliance_submissions_batch ON public.compliance_submissions(submission_batch_id);

-- Enable RLS on all tables
ALTER TABLE public.e_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can manage e-invoice templates" ON public.e_invoice_templates
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage e-invoices" ON public.e_invoices
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage compliance submissions" ON public.compliance_submissions
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can manage compliance settings" ON public.compliance_settings
FOR ALL USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view compliance settings" ON public.compliance_settings
FOR SELECT USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage digital signatures" ON public.digital_signatures
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Add update triggers
CREATE TRIGGER update_e_invoice_templates_updated_at
    BEFORE UPDATE ON public.e_invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_e_invoices_updated_at
    BEFORE UPDATE ON public.e_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_settings_updated_at
    BEFORE UPDATE ON public.compliance_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default LHDN compliance templates
INSERT INTO public.e_invoice_templates (template_name, template_type, compliance_country, template_content, validation_rules) VALUES
('LHDN Standard Invoice', 'lhdn_standard', 'MY', 
'{
  "invoice_type": "01",
  "invoice_code": "INV",
  "currency": "MYR",
  "tax_scheme": "GST",
  "required_fields": ["supplier", "buyer", "invoice_lines", "tax_total", "legal_monetary_total"],
  "supplier_fields": ["name", "registration_number", "tax_number", "address", "contact"],
  "buyer_fields": ["name", "registration_number", "address"],
  "line_fields": ["item_code", "description", "quantity", "unit_price", "tax_rate", "line_total"]
}'::jsonb,
'{
  "max_line_items": 999,
  "required_tax_categories": ["Standard", "Zero", "Exempt"],
  "allowed_currencies": ["MYR"],
  "date_format": "YYYY-MM-DD"
}'::jsonb),

('LHDN Simplified Invoice', 'lhdn_simplified', 'MY',
'{
  "invoice_type": "02", 
  "invoice_code": "SIV",
  "currency": "MYR",
  "tax_scheme": "GST",
  "simplified": true,
  "required_fields": ["supplier", "total_amount", "tax_total"],
  "max_amount": 1000.00
}'::jsonb,
'{
  "max_amount": 1000.00,
  "simplified_buyer_info": true
}'::jsonb),

('LHDN Self-Billed Invoice', 'lhdn_self_billed', 'MY',
'{
  "invoice_type": "03",
  "invoice_code": "SBI", 
  "currency": "MYR",
  "tax_scheme": "GST",
  "self_billed": true,
  "required_fields": ["supplier", "buyer", "invoice_lines", "tax_total", "legal_monetary_total"]
}'::jsonb,
'{
  "requires_supplier_consent": true,
  "special_authorization": true
}'::jsonb);

-- Insert default compliance settings for Malaysia
INSERT INTO public.compliance_settings (country_code, setting_category, setting_key, setting_value, description) VALUES
('MY', 'lhdn', 'api_url', 'https://api.hasil.gov.my/einvoice/v1', 'LHDN E-Invoice API endpoint'),
('MY', 'lhdn', 'submission_format', 'JSON', 'Required submission format'),
('MY', 'lhdn', 'max_batch_size', '100', 'Maximum invoices per batch submission'),
('MY', 'lhdn', 'timeout_seconds', '300', 'API timeout in seconds'),
('MY', 'invoice', 'uin_prefix', 'EI', 'UIN prefix for e-invoices'),
('MY', 'invoice', 'uin_format', 'EI{YYYY}{MM}{DD}{HHMMSS}{###}', 'UIN generation format'),
('MY', 'tax', 'gst_rate_standard', '6', 'Standard GST rate percentage'),
('MY', 'tax', 'gst_rate_zero', '0', 'Zero-rated GST percentage'),
('MY', 'compliance', 'mandatory_fields', '["supplier_tin", "buyer_name", "invoice_date", "total_amount"]', 'Mandatory fields for compliance'),
('MY', 'digital_signature', 'required', 'false', 'Whether digital signatures are mandatory'),
('MY', 'digital_signature', 'algorithm', 'SHA-256', 'Digital signature algorithm');

-- Create function to generate UIN (Unique Invoice Number)
CREATE OR REPLACE FUNCTION public.generate_uin()
RETURNS TEXT AS $$
DECLARE
    uin_prefix TEXT;
    uin_format TEXT;
    formatted_uin TEXT;
    current_time TIMESTAMP := now();
    sequence_num INTEGER;
BEGIN
    -- Get UIN settings
    SELECT setting_value INTO uin_prefix 
    FROM public.compliance_settings 
    WHERE country_code = 'MY' AND setting_key = 'uin_prefix';
    
    SELECT setting_value INTO uin_format 
    FROM public.compliance_settings 
    WHERE country_code = 'MY' AND setting_key = 'uin_format';
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(RIGHT(uin, 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.e_invoices
    WHERE DATE(created_at) = DATE(current_time)
    AND uin LIKE uin_prefix || TO_CHAR(current_time, 'YYYYMMDD') || '%';
    
    -- Generate UIN
    formatted_uin := uin_prefix || 
                    TO_CHAR(current_time, 'YYYYMMDD') || 
                    TO_CHAR(current_time, 'HH24MISS') || 
                    LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN formatted_uin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;