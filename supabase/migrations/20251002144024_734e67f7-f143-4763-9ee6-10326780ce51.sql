-- Phase 2 Batch 2: Update RLS Policies (Consultation, Documents, Medical)

-- CONSULTATION_FILES
DROP POLICY IF EXISTS "Doctors can upload consultation files" ON public.consultation_files;
CREATE POLICY "Doctors can upload consultation files"
ON public.consultation_files FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

DROP POLICY IF EXISTS "Doctors can view consultation files" ON public.consultation_files;
CREATE POLICY "Doctors can view consultation files"
ON public.consultation_files FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

-- CONSULTATION_NOTES
DROP POLICY IF EXISTS "Admins can delete consultation notes" ON public.consultation_notes;
CREATE POLICY "Admins can delete consultation notes"
ON public.consultation_notes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Doctors and admins can view consultation notes" ON public.consultation_notes;
CREATE POLICY "Doctors and admins can view consultation notes"
ON public.consultation_notes FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    doctor_id = auth.uid()
);

DROP POLICY IF EXISTS "Doctors can create consultation notes" ON public.consultation_notes;
CREATE POLICY "Doctors can create consultation notes"
ON public.consultation_notes FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;
CREATE POLICY "Doctors can update their own consultation notes"
ON public.consultation_notes FOR UPDATE TO authenticated
USING (
    doctor_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
);

-- CONSULTATION_SESSIONS
DROP POLICY IF EXISTS "Doctors can create consultation sessions" ON public.consultation_sessions;
CREATE POLICY "Doctors can create consultation sessions"
ON public.consultation_sessions FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

DROP POLICY IF EXISTS "Doctors can update consultation sessions" ON public.consultation_sessions;
CREATE POLICY "Doctors can update consultation sessions"
ON public.consultation_sessions FOR UPDATE TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

DROP POLICY IF EXISTS "Doctors can view consultation sessions" ON public.consultation_sessions;
CREATE POLICY "Doctors can view consultation sessions"
ON public.consultation_sessions FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
);

-- DIGITAL_SIGNATURES
DROP POLICY IF EXISTS "Staff can manage digital signatures" ON public.digital_signatures;
CREATE POLICY "Staff can manage digital signatures"
ON public.digital_signatures FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- DOCUMENT_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage document templates" ON public.document_templates;
CREATE POLICY "Admins can manage document templates"
ON public.document_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view document templates" ON public.document_templates;
CREATE POLICY "Staff can view document templates"
ON public.document_templates FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- E_INVOICE_TEMPLATES
DROP POLICY IF EXISTS "Staff can manage e-invoice templates" ON public.e_invoice_templates;
CREATE POLICY "Staff can manage e-invoice templates"
ON public.e_invoice_templates FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- E_INVOICES
DROP POLICY IF EXISTS "Staff can manage e-invoices" ON public.e_invoices;
CREATE POLICY "Staff can manage e-invoices"
ON public.e_invoices FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- FOLLOW_UP_CAMPAIGNS
DROP POLICY IF EXISTS "Admins can manage follow-up campaigns" ON public.follow_up_campaigns;
CREATE POLICY "Admins can manage follow-up campaigns"
ON public.follow_up_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view follow-up campaigns" ON public.follow_up_campaigns;
CREATE POLICY "Staff can view follow-up campaigns"
ON public.follow_up_campaigns FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- INTEGRATION_CONFIGS
DROP POLICY IF EXISTS "Staff can manage integration configs" ON public.integration_configs;
CREATE POLICY "Staff can manage integration configs"
ON public.integration_configs FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- MEDICAL_SERVICES
DROP POLICY IF EXISTS "Admins can manage medical services" ON public.medical_services;
CREATE POLICY "Admins can manage medical services"
ON public.medical_services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view medical services" ON public.medical_services;
CREATE POLICY "Staff can view medical services"
ON public.medical_services FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- MEDICATION_DOSAGE_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage medication dosage templates" ON public.medication_dosage_templates;
CREATE POLICY "Admins can manage medication dosage templates"
ON public.medication_dosage_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view medication dosage templates" ON public.medication_dosage_templates;
CREATE POLICY "Staff can view medication dosage templates"
ON public.medication_dosage_templates FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- MEDICATION_PRICING
DROP POLICY IF EXISTS "Admins can manage medication pricing" ON public.medication_pricing;
CREATE POLICY "Admins can manage medication pricing"
ON public.medication_pricing FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view medication pricing" ON public.medication_pricing;
CREATE POLICY "Staff can view medication pricing"
ON public.medication_pricing FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- MEDICATIONS
DROP POLICY IF EXISTS "Admins can manage medications" ON public.medications;
CREATE POLICY "Admins can manage medications"
ON public.medications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view medications" ON public.medications;
CREATE POLICY "Staff can view medications"
ON public.medications FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);