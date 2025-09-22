-- Ensure patient_queue table has proper realtime configuration
ALTER TABLE public.patient_queue REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_queue;
    EXCEPTION
        WHEN duplicate_object THEN
            -- Table already in publication, continue
            NULL;
    END;
END $$;