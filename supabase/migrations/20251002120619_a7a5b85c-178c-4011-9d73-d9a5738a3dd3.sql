-- Add version column to patient_queue for optimistic concurrency control
ALTER TABLE public.patient_queue 
ADD COLUMN version integer NOT NULL DEFAULT 1;

-- Create index for efficient version lookups
CREATE INDEX idx_patient_queue_version ON public.patient_queue(id, version);

-- Add comment explaining the column
COMMENT ON COLUMN public.patient_queue.version IS 'Version number for optimistic concurrency control. Incremented on each update to prevent lost updates.';