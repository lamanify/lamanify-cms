-- Create purchase order documents table
CREATE TABLE public.purchase_order_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('quotation', 'purchase_order', 'invoice', 'delivery_note', 'supplier_correspondence', 'contract', 'other')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier communications table
CREATE TABLE public.supplier_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'document_sent', 'document_received')),
  subject TEXT,
  content TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'failed', 'read')),
  recipient_email TEXT,
  sender_email TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication templates table
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('quotation_request', 'po_confirmation', 'delivery_inquiry', 'payment_reminder', 'general')),
  subject_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_order_documents
CREATE POLICY "Staff can view purchase order documents" 
ON public.purchase_order_documents 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create purchase order documents" 
ON public.purchase_order_documents 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update purchase order documents" 
ON public.purchase_order_documents 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete purchase order documents" 
ON public.purchase_order_documents 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create RLS policies for supplier_communications
CREATE POLICY "Staff can view supplier communications" 
ON public.supplier_communications 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can create supplier communications" 
ON public.supplier_communications 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update supplier communications" 
ON public.supplier_communications 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can delete supplier communications" 
ON public.supplier_communications 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create RLS policies for communication_templates
CREATE POLICY "Staff can view communication templates" 
ON public.communication_templates 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can manage communication templates" 
ON public.communication_templates 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

-- Create indexes
CREATE INDEX idx_purchase_order_documents_po_id ON public.purchase_order_documents(purchase_order_id);
CREATE INDEX idx_purchase_order_documents_quotation_id ON public.purchase_order_documents(quotation_id);
CREATE INDEX idx_purchase_order_documents_supplier_id ON public.purchase_order_documents(supplier_id);
CREATE INDEX idx_purchase_order_documents_type ON public.purchase_order_documents(document_type);

CREATE INDEX idx_supplier_communications_supplier_id ON public.supplier_communications(supplier_id);
CREATE INDEX idx_supplier_communications_po_id ON public.supplier_communications(purchase_order_id);
CREATE INDEX idx_supplier_communications_quotation_id ON public.supplier_communications(quotation_id);
CREATE INDEX idx_supplier_communications_type ON public.supplier_communications(communication_type);

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_order_documents_updated_at
BEFORE UPDATE ON public.purchase_order_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_communications_updated_at
BEFORE UPDATE ON public.supplier_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at
BEFORE UPDATE ON public.communication_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default communication templates
INSERT INTO public.communication_templates (template_name, template_type, subject_template, content_template, variables) VALUES
('Quotation Request', 'quotation_request', 'Request for Quotation - {{po_number}}', 
'Dear {{supplier_contact}},

We would like to request a quotation for the following items:

{{item_list}}

Please provide your best prices and delivery terms for the above items.

Thank you for your prompt response.

Best regards,
{{sender_name}}
{{clinic_name}}', 
'["supplier_contact", "po_number", "item_list", "sender_name", "clinic_name"]'),

('Purchase Order Confirmation', 'po_confirmation', 'Purchase Order Confirmation - {{po_number}}', 
'Dear {{supplier_contact}},

Please find attached our purchase order {{po_number}} for your confirmation.

Order Details:
- Order Date: {{order_date}}
- Expected Delivery: {{delivery_date}}
- Total Amount: {{total_amount}}

Please confirm receipt and expected delivery date.

Best regards,
{{sender_name}}
{{clinic_name}}', 
'["supplier_contact", "po_number", "order_date", "delivery_date", "total_amount", "sender_name", "clinic_name"]'),

('Delivery Inquiry', 'delivery_inquiry', 'Delivery Status Inquiry - PO {{po_number}}', 
'Dear {{supplier_contact}},

We would like to inquire about the delivery status of our purchase order {{po_number}} placed on {{order_date}}.

The expected delivery date was {{expected_delivery_date}}. Could you please provide an update on the current status?

Thank you for your assistance.

Best regards,
{{sender_name}}
{{clinic_name}}', 
'["supplier_contact", "po_number", "order_date", "expected_delivery_date", "sender_name", "clinic_name"]');