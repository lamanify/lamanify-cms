-- Function to check for appointment overlaps
CREATE OR REPLACE FUNCTION public.check_appointment_overlap(
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME,
    p_duration_minutes INTEGER,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    start_datetime TIMESTAMP;
    end_datetime TIMESTAMP;
    overlap_count INTEGER;
BEGIN
    -- Calculate start and end timestamps
    start_datetime := p_appointment_date + p_appointment_time;
    end_datetime := start_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for overlapping appointments
    SELECT COUNT(*)
    INTO overlap_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND status IN ('scheduled', 'in_consultation')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND (
        -- Check if time ranges overlap
        (appointment_time, appointment_time + (duration_minutes || ' minutes')::INTERVAL) 
        OVERLAPS 
        (p_appointment_time, p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL)
      );
    
    RETURN overlap_count > 0;
END;
$$;

-- Function to get appointments for calendar view
CREATE OR REPLACE FUNCTION public.get_calendar_appointments(
    p_start_date DATE,
    p_end_date DATE,
    p_doctor_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    patient_id UUID,
    doctor_id UUID,
    appointment_date DATE,
    appointment_time TIME,
    duration_minutes INTEGER,
    status TEXT,
    reason TEXT,
    patient_name TEXT,
    doctor_name TEXT,
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT(pr.first_name, ' ', pr.last_name) as doctor_name,
        (a.appointment_date + a.appointment_time) as start_datetime,
        (a.appointment_date + a.appointment_time + (a.duration_minutes || ' minutes')::INTERVAL) as end_datetime
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN profiles pr ON a.doctor_id = pr.id
    WHERE a.appointment_date BETWEEN p_start_date AND p_end_date
      AND (p_doctor_id IS NULL OR a.doctor_id = p_doctor_id)
      AND a.status IN ('scheduled', 'in_consultation', 'completed', 'cancelled')
    ORDER BY a.appointment_date, a.appointment_time;
END;
$$;