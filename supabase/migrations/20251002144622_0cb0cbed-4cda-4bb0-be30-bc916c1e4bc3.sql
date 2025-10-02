-- Phase 2 Batch 4: Purchase Orders, Quotations, Pre-consultation

-- PO_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage PO templates" ON public.po_templates;
CREATE POLICY "Admins can manage PO templates" ON public.po_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view PO templates" ON public.po_templates;
CREATE POLICY "Staff can view PO templates" ON public.po_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PRE_CONSULTATION_FORMS
DROP POLICY IF EXISTS "Admins can manage pre-consultation forms" ON public.pre_consultation_forms;
CREATE POLICY "Admins can manage pre-consultation forms" ON public.pre_consultation_forms FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view pre-consultation forms" ON public.pre_consultation_forms;
CREATE POLICY "Staff can view pre-consultation forms" ON public.pre_consultation_forms FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PRICE_TIERS
DROP POLICY IF EXISTS "Admins can manage price tiers" ON public.price_tiers;
CREATE POLICY "Admins can manage price tiers" ON public.price_tiers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can view price tiers" ON public.price_tiers;
CREATE POLICY "Staff can view price tiers" ON public.price_tiers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PURCHASE_ORDER_AUDIT
DROP POLICY IF EXISTS "Staff can manage purchase order audit" ON public.purchase_order_audit;
CREATE POLICY "Staff can manage purchase order audit" ON public.purchase_order_audit FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PURCHASE_ORDER_DOCUMENTS
DROP POLICY IF EXISTS "Staff can manage PO documents" ON public.purchase_order_documents;
CREATE POLICY "Staff can manage PO documents" ON public.purchase_order_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PURCHASE_ORDER_ITEMS
DROP POLICY IF EXISTS "Staff can manage purchase order items" ON public.purchase_order_items;
CREATE POLICY "Staff can manage purchase order items" ON public.purchase_order_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- PURCHASE_ORDERS
DROP POLICY IF EXISTS "Staff can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Staff can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUEUE_SESSIONS
DROP POLICY IF EXISTS "Staff can manage queue sessions" ON public.queue_sessions;
CREATE POLICY "Staff can manage queue sessions" ON public.queue_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUOTATION_COMPARISONS
DROP POLICY IF EXISTS "Staff can manage quotation comparisons" ON public.quotation_comparisons;
CREATE POLICY "Staff can manage quotation comparisons" ON public.quotation_comparisons FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUOTATION_ITEMS
DROP POLICY IF EXISTS "Staff can manage quotation items" ON public.quotation_items;
CREATE POLICY "Staff can manage quotation items" ON public.quotation_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUOTATION_REQUEST_ITEMS
DROP POLICY IF EXISTS "Staff can manage quotation request items" ON public.quotation_request_items;
CREATE POLICY "Staff can manage quotation request items" ON public.quotation_request_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUOTATION_REQUESTS
DROP POLICY IF EXISTS "Staff can manage quotation requests" ON public.quotation_requests;
CREATE POLICY "Staff can manage quotation requests" ON public.quotation_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));

-- QUOTATIONS
DROP POLICY IF EXISTS "Staff can manage quotations" ON public.quotations;
CREATE POLICY "Staff can manage quotations" ON public.quotations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse') OR public.has_role(auth.uid(), 'receptionist'));