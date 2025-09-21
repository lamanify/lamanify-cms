-- Add average_cost field to medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS average_cost NUMERIC DEFAULT 0;

-- Add cost tracking fields to stock_movements table (some may already exist)
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_unit_before NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_unit_after NUMERIC DEFAULT 0;

-- Create function to calculate moving average cost
CREATE OR REPLACE FUNCTION calculate_moving_average_cost(
  p_medication_id UUID,
  p_new_quantity INTEGER,
  p_new_unit_cost NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
  current_avg_cost NUMERIC;
  new_total_value NUMERIC;
  new_total_quantity INTEGER;
  new_average_cost NUMERIC;
BEGIN
  -- Get current stock and average cost
  SELECT stock_level, COALESCE(average_cost, 0)
  INTO current_stock, current_avg_cost
  FROM medications
  WHERE id = p_medication_id;
  
  -- If no stock exists, new cost becomes the average
  IF current_stock = 0 THEN
    RETURN p_new_unit_cost;
  END IF;
  
  -- Calculate weighted average
  new_total_value := (current_stock * current_avg_cost) + (p_new_quantity * p_new_unit_cost);
  new_total_quantity := current_stock + p_new_quantity;
  
  -- Avoid division by zero
  IF new_total_quantity = 0 THEN
    RETURN current_avg_cost;
  END IF;
  
  new_average_cost := new_total_value / new_total_quantity;
  
  RETURN ROUND(new_average_cost, 4);
END;
$$;

-- Create function to update medication average cost
CREATE OR REPLACE FUNCTION update_medication_average_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_avg_cost NUMERIC;
  current_avg_cost NUMERIC;
BEGIN
  -- Only calculate for stock increases (receipt, adjustment with positive quantity)
  IF NEW.movement_type IN ('receipt', 'adjustment') AND NEW.quantity > 0 THEN
    -- Get current average cost before update
    SELECT COALESCE(average_cost, 0) INTO current_avg_cost
    FROM medications WHERE id = NEW.medication_id;
    
    -- Store the before cost
    NEW.cost_per_unit_before := current_avg_cost;
    
    -- Calculate new average cost
    new_avg_cost := calculate_moving_average_cost(
      NEW.medication_id,
      NEW.quantity,
      COALESCE(NEW.unit_cost, 0)
    );
    
    -- Update medication average cost
    UPDATE medications 
    SET 
      average_cost = new_avg_cost,
      updated_at = now()
    WHERE id = NEW.medication_id;
    
    -- Store cost information in the stock movement
    NEW.cost_per_unit_after := new_avg_cost;
    NEW.total_cost := NEW.quantity * COALESCE(NEW.unit_cost, 0);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic average cost calculation
DROP TRIGGER IF EXISTS trigger_update_average_cost ON stock_movements;
CREATE TRIGGER trigger_update_average_cost
  BEFORE INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_average_cost();

-- Create cost history view for easy access
CREATE OR REPLACE VIEW medication_cost_history AS
SELECT 
  sm.id,
  sm.medication_id,
  m.name as medication_name,
  sm.movement_type,
  sm.quantity,
  sm.unit_cost,
  sm.total_cost,
  sm.cost_per_unit_before,
  sm.cost_per_unit_after,
  sm.previous_stock,
  sm.new_stock,
  sm.batch_number,
  sm.expiry_date,
  sm.notes,
  sm.created_at,
  p.first_name || ' ' || p.last_name as created_by_name
FROM stock_movements sm
LEFT JOIN medications m ON sm.medication_id = m.id
LEFT JOIN profiles p ON sm.created_by = p.id
WHERE sm.unit_cost > 0
ORDER BY sm.created_at DESC;