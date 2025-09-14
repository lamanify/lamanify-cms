-- Update existing patients with generated patient IDs
DO $$
DECLARE
    patient_record RECORD;
    new_patient_id TEXT;
    base_timestamp BIGINT;
    random_suffix INTEGER;
BEGIN
    -- Set a base timestamp to ensure uniqueness
    base_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- Loop through patients without patient_id
    FOR patient_record IN 
        SELECT id FROM patients WHERE patient_id IS NULL
    LOOP
        -- Generate unique patient ID (timestamp + random 3 digits)
        random_suffix := FLOOR(RANDOM() * 1000)::INTEGER;
        new_patient_id := base_timestamp::TEXT || LPAD(random_suffix::TEXT, 3, '0');
        
        -- Update the patient with the new ID
        UPDATE patients 
        SET patient_id = new_patient_id 
        WHERE id = patient_record.id;
        
        -- Increment base timestamp to ensure uniqueness
        base_timestamp := base_timestamp + 1;
    END LOOP;
END $$;