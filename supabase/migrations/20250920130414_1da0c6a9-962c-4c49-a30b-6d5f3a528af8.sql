-- Fix security warnings by adding missing functions with proper search_path

-- Function to calculate reliability score
CREATE OR REPLACE FUNCTION public.calculate_patient_reliability_score(p_patient_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
  completed_count INTEGER;
  no_show_count INTEGER;
  late_cancel_count INTEGER;
  score NUMERIC;
BEGIN
  -- Get appointment statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_at > appointment_date + appointment_time - INTERVAL '24 hours')
  INTO total_count, completed_count, no_show_count, late_cancel_count
  FROM appointments
  WHERE patient_id = p_patient_id
    AND appointment_date >= CURRENT_DATE - INTERVAL '1 year';
  
  -- Calculate score (100 = perfect, decreases with no-shows and late cancellations)
  IF total_count = 0 THEN
    RETURN 100.0;
  END IF;
  
  score := 100.0 - (no_show_count * 15.0) - (late_cancel_count * 5.0);
  
  -- Ensure score doesn't go below 0
  RETURN GREATEST(score, 0.0);
END;
$$;

-- Function to update patient reliability
CREATE OR REPLACE FUNCTION public.update_patient_reliability(p_patient_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score NUMERIC;
  new_risk_level TEXT;
BEGIN
  -- Calculate new score
  new_score := calculate_patient_reliability_score(p_patient_id);
  
  -- Determine risk level
  IF new_score >= 80 THEN
    new_risk_level := 'low';
  ELSIF new_score >= 60 THEN
    new_risk_level := 'medium';
  ELSE
    new_risk_level := 'high';
  END IF;
  
  -- Update patient record
  UPDATE patients 
  SET 
    reliability_score = new_score,
    risk_level = new_risk_level,
    updated_at = now()
  WHERE id = p_patient_id;
  
  -- Update or create reliability scores record
  INSERT INTO patient_reliability_scores (
    patient_id, 
    reliability_score, 
    risk_level,
    total_appointments,
    completed_appointments,
    no_shows,
    late_cancellations
  )
  SELECT 
    p_patient_id,
    new_score,
    new_risk_level,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_at > appointment_date + appointment_time - INTERVAL '24 hours')
  FROM appointments
  WHERE patient_id = p_patient_id
    AND appointment_date >= CURRENT_DATE - INTERVAL '1 year'
  ON CONFLICT (patient_id) DO UPDATE SET
    reliability_score = EXCLUDED.reliability_score,
    risk_level = EXCLUDED.risk_level,
    total_appointments = EXCLUDED.total_appointments,
    completed_appointments = EXCLUDED.completed_appointments,
    no_shows = EXCLUDED.no_shows,
    late_cancellations = EXCLUDED.late_cancellations,
    updated_at = now();
END;
$$;

-- Trigger function to update reliability when appointment status changes
CREATE OR REPLACE FUNCTION public.handle_appointment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update reliability if status changed to completed, no_show, or cancelled
  IF (OLD.status IS DISTINCT FROM NEW.status) AND 
     NEW.status IN ('completed', 'no_show', 'cancelled') THEN
    PERFORM update_patient_reliability(NEW.patient_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_patient_reliability_trigger ON appointments;
CREATE TRIGGER update_patient_reliability_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_status_change();

-- Function to generate secure check-in token
CREATE OR REPLACE FUNCTION public.generate_check_in_link(p_appointment_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_record RECORD;
  secure_token TEXT;
  link_id UUID;
BEGIN
  -- Get appointment and patient info
  SELECT a.patient_id, p.first_name, p.last_name
  INTO patient_record
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE a.id = p_appointment_id;
  
  -- Generate secure token
  secure_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create check-in link record
  INSERT INTO appointment_check_in_links (
    appointment_id,
    patient_id,
    secure_token,
    expires_at
  ) VALUES (
    p_appointment_id,
    patient_record.patient_id,
    secure_token,
    now() + INTERVAL '7 days'
  ) RETURNING id INTO link_id;
  
  RETURN secure_token;
END;
$$;