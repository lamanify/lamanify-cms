-- Fix security warnings by setting proper search paths for functions

-- Fix the log_purchase_order_change function
CREATE OR REPLACE FUNCTION public.log_purchase_order_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Fix the process_po_receipt function
CREATE OR REPLACE FUNCTION public.process_po_receipt(
  p_po_id UUID,
  p_items JSONB
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
        (SELECT average_cost FROM medications WHERE id = item.medication_id),
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
$$;