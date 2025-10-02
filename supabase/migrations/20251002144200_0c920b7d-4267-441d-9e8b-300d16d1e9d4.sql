-- Phase 2 Batch 3: Update RLS Policies (Packages, Panels, Patients)

-- PACKAGE_ITEMS
DROP POLICY IF EXISTS "Admins can manage package items" ON public.package_items;
CREATE POLICY "Admins can manage package items"
ON public.package_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view package items" ON public.package_items;
CREATE POLICY "Staff can view package items"
ON public.package_items FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PACKAGES
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages"
ON public.packages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view packages" ON public.packages;
CREATE POLICY "Staff can view packages"
ON public.packages FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIM_DOCUMENTS
DROP POLICY IF EXISTS "Staff can manage panel claim documents" ON public.panel_claim_documents;
CREATE POLICY "Staff can manage panel claim documents"
ON public.panel_claim_documents FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIM_ITEMS
DROP POLICY IF EXISTS "Admins can delete panel claim items" ON public.panel_claim_items;
CREATE POLICY "Admins can delete panel claim items"
ON public.panel_claim_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can create panel claim items" ON public.panel_claim_items;
CREATE POLICY "Staff can create panel claim items"
ON public.panel_claim_items FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can update panel claim items" ON public.panel_claim_items;
CREATE POLICY "Staff can update panel claim items"
ON public.panel_claim_items FOR UPDATE TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can view panel claim items" ON public.panel_claim_items;
CREATE POLICY "Staff can view panel claim items"
ON public.panel_claim_items FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIM_NOTES
DROP POLICY IF EXISTS "Staff can manage panel claim notes" ON public.panel_claim_notes;
CREATE POLICY "Staff can manage panel claim notes"
ON public.panel_claim_notes FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS
DROP POLICY IF EXISTS "Admins can delete panel claims" ON public.panel_claims;
CREATE POLICY "Admins can delete panel claims"
ON public.panel_claims FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can create panel claims" ON public.panel_claims;
CREATE POLICY "Staff can create panel claims"
ON public.panel_claims FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can update panel claims" ON public.panel_claims;
CREATE POLICY "Staff can update panel claims"
ON public.panel_claims FOR UPDATE TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

DROP POLICY IF EXISTS "Staff can view panel claims" ON public.panel_claims;
CREATE POLICY "Staff can view panel claims"
ON public.panel_claims FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_APPROVAL_REQUESTS
DROP POLICY IF EXISTS "Staff can manage approval requests" ON public.panel_claims_approval_requests;
CREATE POLICY "Staff can manage approval requests"
ON public.panel_claims_approval_requests FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_APPROVAL_WORKFLOWS
DROP POLICY IF EXISTS "Admins can manage panel claims approval workflows" ON public.panel_claims_approval_workflows;
CREATE POLICY "Admins can manage panel claims approval workflows"
ON public.panel_claims_approval_workflows FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view panel claims approval workflows" ON public.panel_claims_approval_workflows;
CREATE POLICY "Staff can view panel claims approval workflows"
ON public.panel_claims_approval_workflows FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_AUDIT
DROP POLICY IF EXISTS "Staff can manage panel claims audit" ON public.panel_claims_audit;
CREATE POLICY "Staff can manage panel claims audit"
ON public.panel_claims_audit FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_NOTIFICATIONS
DROP POLICY IF EXISTS "Staff can manage panel claims notifications" ON public.panel_claims_notifications;
CREATE POLICY "Staff can manage panel claims notifications"
ON public.panel_claims_notifications FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_RECONCILIATION
DROP POLICY IF EXISTS "Staff can manage panel claims reconciliation" ON public.panel_claims_reconciliation;
CREATE POLICY "Staff can manage panel claims reconciliation"
ON public.panel_claims_reconciliation FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_SCHEDULED_REPORTS
DROP POLICY IF EXISTS "Staff can manage panel claims scheduled reports" ON public.panel_claims_scheduled_reports;
CREATE POLICY "Staff can manage panel claims scheduled reports"
ON public.panel_claims_scheduled_reports FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_SCHEDULES
DROP POLICY IF EXISTS "Admins can manage panel claims schedules" ON public.panel_claims_schedules;
CREATE POLICY "Admins can manage panel claims schedules"
ON public.panel_claims_schedules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view panel claims schedules" ON public.panel_claims_schedules;
CREATE POLICY "Staff can view panel claims schedules"
ON public.panel_claims_schedules FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANEL_CLAIMS_STATUS_RULES
DROP POLICY IF EXISTS "Admins can manage panel claims status rules" ON public.panel_claims_status_rules;
CREATE POLICY "Admins can manage panel claims status rules"
ON public.panel_claims_status_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view panel claims status rules" ON public.panel_claims_status_rules;
CREATE POLICY "Staff can view panel claims status rules"
ON public.panel_claims_status_rules FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANELS
DROP POLICY IF EXISTS "Admins can delete panels" ON public.panels;
CREATE POLICY "Admins can delete panels"
ON public.panels FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage panels" ON public.panels;
CREATE POLICY "Admins can manage panels"
ON public.panels FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view panels" ON public.panels;
CREATE POLICY "Staff can view panels"
ON public.panels FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);

-- PANELS_PRICE_TIERS
DROP POLICY IF EXISTS "Admins can manage panels_price_tiers" ON public.panels_price_tiers;
CREATE POLICY "Admins can manage panels_price_tiers"
ON public.panels_price_tiers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view panels_price_tiers" ON public.panels_price_tiers;
CREATE POLICY "Staff can view panels_price_tiers"
ON public.panels_price_tiers FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'receptionist')
);