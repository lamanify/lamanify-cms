-- Update queue_sessions table to match suggested structure
-- Add unique constraint to queue_id for data integrity
ALTER TABLE public.queue_sessions 
ADD CONSTRAINT unique_queue_id UNIQUE (queue_id);

-- Make session_data NOT NULL (update existing NULL values first)
UPDATE public.queue_sessions 
SET session_data = '{}'::jsonb 
WHERE session_data IS NULL;

ALTER TABLE public.queue_sessions 
ALTER COLUMN session_data SET NOT NULL;

-- Change status column to use VARCHAR(20) instead of TEXT
ALTER TABLE public.queue_sessions 
ALTER COLUMN status TYPE VARCHAR(20);