-- Ensure patient_visits table has proper realtime configuration
ALTER TABLE public.patient_visits REPLICA IDENTITY FULL;

-- Ensure patient_activities table has proper realtime configuration  
ALTER TABLE public.patient_activities REPLICA IDENTITY FULL;

-- Ensure payment_records table has proper realtime configuration
ALTER TABLE public.payment_records REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_visits;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_activities;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_records;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_notes;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;