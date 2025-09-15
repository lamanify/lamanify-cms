-- Create clinic_settings table for comprehensive admin configuration
CREATE TABLE public.clinic_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSONB,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(setting_category, setting_key)
);

-- Enable RLS on clinic_settings
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for clinic_settings (only admins can manage)
CREATE POLICY "Admins can view clinic settings" 
ON public.clinic_settings 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role]));

CREATE POLICY "Admins can insert clinic settings" 
ON public.clinic_settings 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role]));

CREATE POLICY "Admins can update clinic settings" 
ON public.clinic_settings 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role]));

CREATE POLICY "Admins can delete clinic settings" 
ON public.clinic_settings 
FOR DELETE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default clinic settings
INSERT INTO public.clinic_settings (setting_category, setting_key, setting_value, data_type, description, is_required) VALUES
-- Basic Clinic Information
('basic_info', 'clinic_name', 'My Clinic', 'string', 'Name of the clinic', true),
('basic_info', 'license_number', '', 'string', 'Medical license number', false),
('basic_info', 'address_line1', '', 'string', 'Primary address line', false),
('basic_info', 'address_line2', '', 'string', 'Secondary address line (optional)', false),
('basic_info', 'city', '', 'string', 'City', false),
('basic_info', 'state', '', 'string', 'State/Province', false),
('basic_info', 'postal_code', '', 'string', 'Postal/ZIP code', false),
('basic_info', 'country', 'Malaysia', 'string', 'Country', false),
('basic_info', 'phone_primary', '', 'string', 'Primary phone number', false),
('basic_info', 'phone_secondary', '', 'string', 'Secondary phone number (optional)', false),
('basic_info', 'email', '', 'string', 'Clinic email address', false),
('basic_info', 'timezone', 'Asia/Kuala_Lumpur', 'string', 'Clinic timezone', false),
('basic_info', 'operating_hours', '{"monday":{"open":"09:00","close":"17:00","closed":false},"tuesday":{"open":"09:00","close":"17:00","closed":false},"wednesday":{"open":"09:00","close":"17:00","closed":false},"thursday":{"open":"09:00","close":"17:00","closed":false},"friday":{"open":"09:00","close":"17:00","closed":false},"saturday":{"open":"09:00","close":"13:00","closed":false},"sunday":{"open":"09:00","close":"13:00","closed":true}}', 'json', 'Operating hours for each day of the week', false),

-- Staff & User Management
('staff', 'max_doctors', '10', 'number', 'Maximum number of doctors allowed', false),
('staff', 'max_staff_members', '50', 'number', 'Maximum number of staff members allowed', false),
('staff', 'default_user_role', 'receptionist', 'string', 'Default role for new staff members', false),
('staff', 'require_staff_approval', 'true', 'boolean', 'Require admin approval for new staff accounts', false),

-- System Preferences
('system', 'patient_id_format', 'numeric', 'string', 'Format for auto-generated patient IDs (numeric, alphanumeric)', false),
('system', 'patient_id_prefix', '', 'string', 'Prefix for patient IDs (optional)', false),
('system', 'queue_auto_reset', 'true', 'boolean', 'Automatically reset queue daily', false),
('system', 'max_queue_size', '100', 'number', 'Maximum number of patients in daily queue', false),
('system', 'consultation_timeout_minutes', '60', 'number', 'Consultation timeout in minutes', false),
('system', 'default_appointment_duration', '30', 'number', 'Default appointment duration in minutes', false),
('system', 'enable_patient_portal', 'false', 'boolean', 'Enable patient portal access', false),

-- Payment & Billing Settings
('payment', 'default_currency', 'MYR', 'string', 'Default currency code (MYR, USD, etc.)', false),
('payment', 'tax_rate', '0.00', 'number', 'Default tax rate percentage', false),
('payment', 'price_rounding', 'nearest_cent', 'string', 'Price rounding rules (nearest_cent, round_up, round_down)', false),
('payment', 'receipt_template', 'standard', 'string', 'Receipt template to use', false),
('payment', 'payment_methods', '["cash","card","bank_transfer"]', 'json', 'Available payment methods', false),
('payment', 'require_payment_confirmation', 'false', 'boolean', 'Require confirmation before processing payments', false),

-- Notification Settings
('notifications', 'sms_enabled', 'false', 'boolean', 'Enable SMS notifications', false),
('notifications', 'email_enabled', 'true', 'boolean', 'Enable email notifications', false),
('notifications', 'patient_reminders', 'true', 'boolean', 'Send appointment reminders to patients', false),
('notifications', 'reminder_hours_before', '24', 'number', 'Hours before appointment to send reminder', false),
('notifications', 'staff_notifications', 'true', 'boolean', 'Enable staff system notifications', false),
('notifications', 'system_alerts', 'true', 'boolean', 'Enable system alert notifications', false);