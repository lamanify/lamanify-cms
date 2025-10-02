-- Phase 2: Update RLS Policies to Use Secure has_role() Function
-- This migration fixes 166 vulnerable RLS policies that use get_user_role()
-- Replaces with secure has_role() SECURITY DEFINER function

-- APPOINTMENT_CHECK_IN_LINKS
DROP POLICY IF EXISTS "Staff can manage check-in links" ON public.appointment_check_in_links;
CREATE POLICY "Staff can manage check-in links"
ON public.appointment_check_in_links FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- APPOINTMENT_RESOURCES
DROP POLICY IF EXISTS "Staff can manage appointment resources" ON public.appointment_resources;
CREATE POLICY "Staff can manage appointment resources"
ON public.appointment_resources FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- APPOINTMENT_WAITLIST
DROP POLICY IF EXISTS "Staff can manage appointment waitlist" ON public.appointment_waitlist;
CREATE POLICY "Staff can manage appointment waitlist"
ON public.appointment_waitlist FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can create appointments" ON public.appointments;
CREATE POLICY "Staff can create appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
CREATE POLICY "Staff can update appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- BILLING
DROP POLICY IF EXISTS "Admins can delete billing" ON public.billing;
CREATE POLICY "Admins can delete billing"
ON public.billing FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can create billing" ON public.billing;
CREATE POLICY "Staff can create billing"
ON public.billing FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can update billing" ON public.billing;
CREATE POLICY "Staff can update billing"
ON public.billing FOR UPDATE TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- CANCELLATION_POLICIES
DROP POLICY IF EXISTS "Admins can manage cancellation policies" ON public.cancellation_policies;
CREATE POLICY "Admins can manage cancellation policies"
ON public.cancellation_policies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view cancellation policies" ON public.cancellation_policies;
CREATE POLICY "Staff can view cancellation policies"
ON public.cancellation_policies FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- CLINIC_HEADER_SETTINGS
DROP POLICY IF EXISTS "Admins can manage header settings" ON public.clinic_header_settings;
CREATE POLICY "Admins can manage header settings"
ON public.clinic_header_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view header settings" ON public.clinic_header_settings;
CREATE POLICY "Staff can view header settings"
ON public.clinic_header_settings FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- CLINIC_SETTINGS
DROP POLICY IF EXISTS "Admins can delete clinic settings" ON public.clinic_settings;
CREATE POLICY "Admins can delete clinic settings"
ON public.clinic_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert clinic settings" ON public.clinic_settings;
CREATE POLICY "Admins can insert clinic settings"
ON public.clinic_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update clinic settings" ON public.clinic_settings;
CREATE POLICY "Admins can update clinic settings"
ON public.clinic_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view clinic settings" ON public.clinic_settings;
CREATE POLICY "Admins can view clinic settings"
ON public.clinic_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- COMMUNICATION_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage communication templates" ON public.communication_templates;
CREATE POLICY "Admins can manage communication templates"
ON public.communication_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view communication templates" ON public.communication_templates;
CREATE POLICY "Staff can view communication templates"
ON public.communication_templates FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- COMPLIANCE_SETTINGS
DROP POLICY IF EXISTS "Admins can manage compliance settings" ON public.compliance_settings;
CREATE POLICY "Admins can manage compliance settings"
ON public.compliance_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view compliance settings" ON public.compliance_settings;
CREATE POLICY "Staff can view compliance settings"
ON public.compliance_settings FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- COMPLIANCE_SUBMISSIONS
DROP POLICY IF EXISTS "Staff can manage compliance submissions" ON public.compliance_submissions;
CREATE POLICY "Staff can manage compliance submissions"
ON public.compliance_submissions FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);