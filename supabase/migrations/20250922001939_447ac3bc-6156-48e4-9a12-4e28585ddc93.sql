-- Phase 1: Extended Workflow & Quotation Management
-- Add quotation management tables and extend PO workflow

-- Create quotation_requests table
CREATE TABLE public.quotation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
  requested_by UUID NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_by_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'received', 'expired', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_request_items table
CREATE TABLE public.quotation_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_request_id UUID NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id),
  item_description TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'Tablet',
  specifications TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table (supplier responses)
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  quotation_request_id UUID NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'under_review', 'accepted', 'rejected', 'expired')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  supplier_reference TEXT,
  comparison_notes TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID,
  rejected_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  quotation_request_item_id UUID REFERENCES public.quotation_request_items(id),
  medication_id UUID REFERENCES public.medications(id),
  item_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,4) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'Tablet',
  brand TEXT,
  specifications TEXT,
  delivery_time_days INTEGER,
  minimum_order_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_comparisons table for side-by-side analysis
CREATE TABLE public.quotation_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_request_id UUID NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quotation_ids UUID[] NOT NULL,
  comparison_criteria JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend purchase_orders table with quotation relationship
ALTER TABLE public.purchase_orders 
ADD COLUMN quotation_id UUID REFERENCES public.quotations(id),
ADD COLUMN quotation_request_id UUID REFERENCES public.quotation_requests(id);

-- Update purchase order status to include quotation workflow
-- First, create new enum with extended statuses
CREATE TYPE po_status_new AS ENUM (
  'draft',
  'quotation_requested', 
  'quotation_received',
  'pending_approval',
  'approved',
  'ordered',
  'partially_received',
  'received',
  'closed',
  'cancelled'
);

-- Add new status column temporarily
ALTER TABLE public.purchase_orders ADD COLUMN status_new po_status_new;

-- Update existing statuses to new enum values
UPDATE public.purchase_orders 
SET status_new = CASE 
  WHEN status = 'draft' THEN 'draft'::po_status_new
  WHEN status = 'pending_approval' THEN 'pending_approval'::po_status_new
  WHEN status = 'approved' THEN 'approved'::po_status_new
  WHEN status = 'received' THEN 'received'::po_status_new
  WHEN status = 'cancelled' THEN 'cancelled'::po_status_new
  ELSE 'draft'::po_status_new
END;

-- Drop old status column and rename new one
ALTER TABLE public.purchase_orders DROP COLUMN status;
ALTER TABLE public.purchase_orders RENAME COLUMN status_new TO status;
ALTER TABLE public.purchase_orders ALTER COLUMN status SET DEFAULT 'draft'::po_status_new;
ALTER TABLE public.purchase_orders ALTER COLUMN status SET NOT NULL;

-- Drop old enum
DROP TYPE IF EXISTS po_status;

-- Rename new enum to original name
ALTER TYPE po_status_new RENAME TO po_status;

-- Create sequences for numbering
CREATE SEQUENCE IF NOT EXISTS quotation_request_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS quotation_sequence START 1;

-- Create function to generate quotation request numbers
CREATE OR REPLACE FUNCTION public.generate_quotation_request_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN 'QR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('quotation_request_sequence')::TEXT, 6, '0');
END;
$$;

-- Create function to generate quotation numbers
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN 'QT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('quotation_sequence')::TEXT, 6, '0');
END;
$$;

-- Create function to convert quotation to purchase order
CREATE OR REPLACE FUNCTION public.convert_quotation_to_po(
  p_quotation_id UUID,
  p_created_by UUID DEFAULT auth.uid()
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quotation_record RECORD;
  po_id UUID;
  item_record RECORD;
BEGIN
  -- Get quotation details
  SELECT q.*, s.name as supplier_name, qr.title as request_title
  INTO quotation_record
  FROM quotations q
  JOIN suppliers s ON q.supplier_id = s.id
  JOIN quotation_requests qr ON q.quotation_request_id = qr.id
  WHERE q.id = p_quotation_id AND q.status = 'accepted';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found or not accepted';
  END IF;
  
  -- Create purchase order
  INSERT INTO purchase_orders (
    po_number,
    supplier_id,
    quotation_id,
    quotation_request_id,
    order_date,
    expected_delivery_date,
    status,
    total_amount,
    payment_terms,
    delivery_terms,
    notes,
    created_by
  ) VALUES (
    generate_po_number(),
    quotation_record.supplier_id,
    p_quotation_id,
    quotation_record.quotation_request_id,
    CURRENT_DATE,
    CURRENT_DATE + (quotation_record.delivery_terms::integer || ' days')::interval,
    'approved',
    quotation_record.total_amount,
    quotation_record.payment_terms,
    quotation_record.delivery_terms,
    'Generated from quotation ' || quotation_record.quotation_number,
    p_created_by
  ) RETURNING id INTO po_id;
  
  -- Copy quotation items to purchase order items
  FOR item_record IN 
    SELECT * FROM quotation_items WHERE quotation_id = p_quotation_id
  LOOP
    INSERT INTO purchase_order_items (
      purchase_order_id,
      medication_id,
      item_description,
      quantity,
      unit_cost,
      total_cost,
      unit_of_measure,
      notes
    ) VALUES (
      po_id,
      item_record.medication_id,
      item_record.item_description,
      item_record.quantity,
      item_record.unit_price,
      item_record.total_price,
      item_record.unit_of_measure,
      item_record.notes
    );
  END LOOP;
  
  -- Update quotation status
  UPDATE quotations 
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by = p_created_by
  WHERE id = p_quotation_id;
  
  RETURN po_id;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_comparisons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quotation_requests
CREATE POLICY "Staff can manage quotation requests"
ON public.quotation_requests
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for quotation_request_items  
CREATE POLICY "Staff can manage quotation request items"
ON public.quotation_request_items
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for quotations
CREATE POLICY "Staff can manage quotations"
ON public.quotations
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for quotation_items
CREATE POLICY "Staff can manage quotation items"
ON public.quotation_items
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for quotation_comparisons
CREATE POLICY "Staff can manage quotation comparisons"
ON public.quotation_comparisons
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE TRIGGER update_quotation_requests_updated_at
BEFORE UPDATE ON public.quotation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quotation_comparisons_updated_at
BEFORE UPDATE ON public.quotation_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_quotation_requests_supplier_id ON public.quotation_requests(supplier_id);
CREATE INDEX idx_quotation_requests_status ON public.quotation_requests(status);
CREATE INDEX idx_quotation_requests_request_date ON public.quotation_requests(request_date);

CREATE INDEX idx_quotations_quotation_request_id ON public.quotations(quotation_request_id);
CREATE INDEX idx_quotations_supplier_id ON public.quotations(supplier_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_quotation_date ON public.quotations(quotation_date);

CREATE INDEX idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_medication_id ON public.quotation_items(medication_id);

CREATE INDEX idx_purchase_orders_quotation_id ON public.purchase_orders(quotation_id);
CREATE INDEX idx_purchase_orders_quotation_request_id ON public.purchase_orders(quotation_request_id);