-- Phase 1: Database Enhancements & Audit Trail

-- Create purchase order audit table for tracking all changes
CREATE TABLE public.purchase_order_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on audit table
ALTER TABLE public.purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create policies for audit table
CREATE POLICY "Staff can view purchase order audit" 
ON public.purchase_order_audit 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "System can insert audit records" 
ON public.purchase_order_audit 
FOR INSERT 
WITH CHECK (true);

-- Add missing fields to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS supplier_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Add missing fields to purchase_orders table
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS received_by UUID,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add missing fields to purchase_order_items table  
ALTER TABLE public.purchase_order_items
ADD COLUMN IF NOT EXISTS received_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS received_date DATE,
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS received_unit_cost NUMERIC;

-- Create function to log purchase order changes
CREATE OR REPLACE FUNCTION public.log_purchase_order_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed or if it's an UPDATE operation
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.purchase_order_audit (
      purchase_order_id,
      previous_status,
      new_status,
      previous_data,
      new_data,
      changed_by,
      metadata
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
      row_to_json(NEW)::jsonb,
      auth.uid(),
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for purchase order audit logging
DROP TRIGGER IF EXISTS purchase_order_audit_trigger ON public.purchase_orders;
CREATE TRIGGER purchase_order_audit_trigger
  AFTER INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_purchase_order_change();

-- Create function to update inventory from purchase order receipt
CREATE OR REPLACE FUNCTION public.process_po_receipt(
  p_po_id UUID,
  p_items JSONB
) RETURNS VOID AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
  new_avg_cost NUMERIC;
BEGIN
  -- Process each received item
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    item_id UUID,
    medication_id UUID,
    received_quantity INTEGER,
    received_unit_cost NUMERIC,
    batch_number TEXT,
    expiry_date DATE
  ) LOOP
    
    -- Update purchase order item
    UPDATE public.purchase_order_items 
    SET 
      received_quantity = COALESCE(received_quantity, 0) + item.received_quantity,
      received_date = CURRENT_DATE,
      batch_number = item.batch_number,
      expiry_date = item.expiry_date,
      received_unit_cost = item.received_unit_cost
    WHERE id = item.item_id;
    
    -- Update medication stock if medication_id provided
    IF item.medication_id IS NOT NULL THEN
      -- Get current stock
      SELECT stock_level INTO current_stock 
      FROM public.medications 
      WHERE id = item.medication_id;
      
      -- Calculate new average cost
      new_avg_cost := calculate_moving_average_cost(
        item.medication_id,
        item.received_quantity,
        item.received_unit_cost
      );
      
      -- Update medication stock and cost
      UPDATE public.medications 
      SET 
        stock_level = stock_level + item.received_quantity,
        average_cost = new_avg_cost,
        updated_at = now()
      WHERE id = item.medication_id;
      
      -- Create stock movement record
      INSERT INTO public.stock_movements (
        medication_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        stock_after,
        cost_per_unit_before,
        cost_per_unit_after,
        batch_number,
        expiry_date,
        notes,
        reference_id,
        created_by
      ) VALUES (
        item.medication_id,
        'receipt',
        item.received_quantity,
        item.received_unit_cost,
        item.received_quantity * item.received_unit_cost,
        current_stock + item.received_quantity,
        (SELECT average_cost FROM medications WHERE id = item.medication_id) - new_avg_cost + (SELECT average_cost FROM medications WHERE id = item.medication_id),
        new_avg_cost,
        item.batch_number,
        item.expiry_date,
        'PO Receipt: ' || (SELECT po_number FROM purchase_orders WHERE id = p_po_id),
        p_po_id,
        auth.uid()
      );
    END IF;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;