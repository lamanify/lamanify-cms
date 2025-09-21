-- Fix security definer view by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS medication_cost_history;

-- Create cost history view without security definer (uses caller's permissions)
CREATE VIEW medication_cost_history AS
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