-- Insert default WhatsApp patient communication templates
INSERT INTO public.communication_templates (
  template_name,
  template_type,
  subject_template,
  content_template,
  variables,
  is_active,
  created_by
) VALUES 
(
  'WhatsApp Appointment Reminder',
  'whatsapp_patient',
  'Appointment Reminder',
  'Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}. Please confirm your attendance. Thank you!',
  '["name", "date", "time"]'::jsonb,
  true,
  auth.uid()
),
(
  'WhatsApp Blood Report Ready',
  'whatsapp_patient', 
  'Blood Report Ready',
  'Hello {{name}}, your blood test results are ready for collection. Please visit us during clinic hours. Thank you!',
  '["name"]'::jsonb,
  true,
  auth.uid()
),
(
  'WhatsApp General Report Ready',
  'whatsapp_patient',
  'Report Ready',
  'Hi {{name}}, your {{report_type}} report is ready. Please collect it at your convenience during clinic hours.',
  '["name", "report_type"]'::jsonb,
  true,
  auth.uid()
),
(
  'WhatsApp Promotion',
  'whatsapp_patient',
  'Special Promotion',
  'Hi {{name}}, we have a special promotion on {{service_name}}! Contact us for more details. Limited time offer!',
  '["name", "service_name"]'::jsonb,
  true,
  auth.uid()
),
(
  'WhatsApp General Reminder',
  'whatsapp_patient',
  'Reminder',
  'Hello {{name}}, this is a friendly reminder from {{clinic_name}}. {{custom_message}}',
  '["name", "clinic_name", "custom_message"]'::jsonb,
  true,
  auth.uid()
);