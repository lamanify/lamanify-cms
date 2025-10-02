-- Add priority_rank computed column to patient_queue
-- This enables deterministic server-side queue ordering
ALTER TABLE patient_queue 
ADD COLUMN priority_rank INTEGER 
GENERATED ALWAYS AS (
  CASE 
    WHEN status = 'urgent' THEN 3
    WHEN status = 'waiting' THEN 1
    ELSE 0
  END
) STORED;

-- Create performance index for queue ordering
-- This index optimizes the ORDER BY query for queue display
CREATE INDEX idx_queue_priority_order 
ON patient_queue (queue_date, status, priority_rank DESC, checked_in_at ASC, id);