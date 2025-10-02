-- Phase 2 Final Batch 5: Remaining Tables (Recalls, Reconciliation, Resources, Stock, Suppliers, Tiers, Treatments, Webhooks)

-- RECALL_CAMPAIGNS
DROP POLICY IF EXISTS "Admins can manage recall campaigns" ON public.recall_campaigns;
CREATE POLICY "Admins can manage recall campaigns" ON public.recall_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view recall campaigns" ON public.recall_campaigns;
CREATE POLICY "Staff can view recall campaigns" ON public.recall_campaigns FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- RECONCILIATION_APPROVAL_REQUESTS
DROP POLICY IF EXISTS "Staff can manage reconciliation approval requests" ON public.reconciliation_approval_requests;
CREATE POLICY "Staff can manage reconciliation approval requests" ON public.reconciliation_approval_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- RECONCILIATION_APPROVAL_WORKFLOWS
DROP POLICY IF EXISTS "Admins can manage reconciliation workflows" ON public.reconciliation_approval_workflows;
CREATE POLICY "Admins can manage reconciliation workflows" ON public.reconciliation_approval_workflows FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view reconciliation workflows" ON public.reconciliation_approval_workflows;
CREATE POLICY "Staff can view reconciliation workflows" ON public.reconciliation_approval_workflows FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- RECONCILIATION_VARIANCE_CATEGORIES
DROP POLICY IF EXISTS "Admins can manage variance categories" ON public.reconciliation_variance_categories;
CREATE POLICY "Admins can manage variance categories" ON public.reconciliation_variance_categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view variance categories" ON public.reconciliation_variance_categories;
CREATE POLICY "Staff can view variance categories" ON public.reconciliation_variance_categories FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- REORDER_SUGGESTIONS
DROP POLICY IF EXISTS "Staff can manage reorder suggestions" ON public.reorder_suggestions;
CREATE POLICY "Staff can manage reorder suggestions" ON public.reorder_suggestions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- RESOURCES
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view resources" ON public.resources;
CREATE POLICY "Staff can view resources" ON public.resources FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- SERVICE_PRICING
DROP POLICY IF EXISTS "Admins can manage service pricing" ON public.service_pricing;
CREATE POLICY "Admins can manage service pricing" ON public.service_pricing FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view service pricing" ON public.service_pricing;
CREATE POLICY "Staff can view service pricing" ON public.service_pricing FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- STOCK_ADJUSTMENT_AUDIT
DROP POLICY IF EXISTS "Staff can manage stock adjustment audit" ON public.stock_adjustment_audit;
CREATE POLICY "Staff can manage stock adjustment audit" ON public.stock_adjustment_audit FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Staff can manage stock movements" ON public.stock_movements;
CREATE POLICY "Staff can manage stock movements" ON public.stock_movements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- SUPPLIER_CATALOG_ITEMS
DROP POLICY IF EXISTS "Staff can manage supplier catalog items" ON public.supplier_catalog_items;
CREATE POLICY "Staff can manage supplier catalog items" ON public.supplier_catalog_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- SUPPLIER_COMMUNICATIONS
DROP POLICY IF EXISTS "Staff can manage supplier communications" ON public.supplier_communications;
CREATE POLICY "Staff can manage supplier communications" ON public.supplier_communications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- SUPPLIERS
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view suppliers" ON public.suppliers;
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- TIER_ASSIGNMENT_LOG
DROP POLICY IF EXISTS "Staff can manage tier assignment log" ON public.tier_assignment_log;
CREATE POLICY "Staff can manage tier assignment log" ON public.tier_assignment_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- TIER_PAYMENT_METHODS
DROP POLICY IF EXISTS "Admins can manage tier payment methods" ON public.tier_payment_methods;
CREATE POLICY "Admins can manage tier payment methods" ON public.tier_payment_methods FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view tier payment methods" ON public.tier_payment_methods;
CREATE POLICY "Staff can view tier payment methods" ON public.tier_payment_methods FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- TREATMENT_ITEMS
DROP POLICY IF EXISTS "Staff can manage treatment items" ON public.treatment_items;
CREATE POLICY "Staff can manage treatment items" ON public.treatment_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- USER_PERMISSIONS
DROP POLICY IF EXISTS "Admins can manage user permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- WEBHOOK_DELIVERIES
DROP POLICY IF EXISTS "Staff can manage webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Staff can manage webhook deliveries" ON public.webhook_deliveries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));