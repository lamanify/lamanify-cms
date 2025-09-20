-- Add recurring appointments functionality
ALTER TABLE appointments 
ADD COLUMN recurrence_id uuid,
ADD COLUMN recurrence_pattern jsonb,
ADD COLUMN recurrence_end_date date,
ADD COLUMN occurrence_number integer,
ADD COLUMN is_series_parent boolean DEFAULT false;

-- Create appointment waitlist table
CREATE TABLE appointment_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  service_type text,
  preferred_date_start date,
  preferred_date_end date,
  preferred_time_start time,
  preferred_time_end time,
  duration_minutes integer DEFAULT 30,
  priority text DEFAULT 'normal',
  status text DEFAULT 'active',
  notes text,
  contact_preference text DEFAULT 'phone',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Create resources table
CREATE TABLE resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- 'room', 'equipment', 'device'
  description text,
  capacity integer DEFAULT 1,
  status text DEFAULT 'active',
  location text,
  availability_schedule jsonb, -- Store weekly schedule
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Create appointment resources junction table
CREATE TABLE appointment_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(appointment_id, resource_id)
);

-- Enable RLS on new tables
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_waitlist
CREATE POLICY "Staff can manage appointment waitlist" ON appointment_waitlist
FOR ALL USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create policies for resources
CREATE POLICY "Admins can manage resources" ON resources
FOR ALL USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view resources" ON resources
FOR SELECT USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create policies for appointment_resources
CREATE POLICY "Staff can manage appointment resources" ON appointment_resources
FOR ALL USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create function to generate recurring appointments
CREATE OR REPLACE FUNCTION create_recurring_appointments(
  p_base_appointment_id uuid,
  p_recurrence_pattern jsonb
) RETURNS uuid[] AS $$
DECLARE
  base_appointment record;
  new_appointment_id uuid;
  appointment_ids uuid[] := ARRAY[]::uuid[];
  recurrence_id uuid := gen_random_uuid();
  occurrence_date date;
  occurrence_num integer := 1;
  frequency text;
  interval_val integer;
  end_date date;
  max_occurrences integer;
BEGIN
  -- Get base appointment details
  SELECT * INTO base_appointment FROM appointments WHERE id = p_base_appointment_id;
  
  -- Extract recurrence parameters
  frequency := p_recurrence_pattern->>'frequency';
  interval_val := COALESCE((p_recurrence_pattern->>'interval')::integer, 1);
  end_date := (p_recurrence_pattern->>'end_date')::date;
  max_occurrences := COALESCE((p_recurrence_pattern->>'max_occurrences')::integer, 52);
  
  -- Update base appointment to mark as series parent
  UPDATE appointments 
  SET 
    recurrence_id = recurrence_id,
    recurrence_pattern = p_recurrence_pattern,
    recurrence_end_date = end_date,
    occurrence_number = 1,
    is_series_parent = true
  WHERE id = p_base_appointment_id;
  
  appointment_ids := array_append(appointment_ids, p_base_appointment_id);
  
  -- Generate recurring appointments
  occurrence_date := base_appointment.appointment_date;
  
  WHILE occurrence_num < max_occurrences AND (end_date IS NULL OR occurrence_date <= end_date) LOOP
    -- Calculate next occurrence date
    CASE frequency
      WHEN 'daily' THEN
        occurrence_date := occurrence_date + (interval_val || ' days')::interval;
      WHEN 'weekly' THEN
        occurrence_date := occurrence_date + (interval_val * 7 || ' days')::interval;
      WHEN 'monthly' THEN
        occurrence_date := occurrence_date + (interval_val || ' months')::interval;
      ELSE
        EXIT; -- Unknown frequency, stop
    END CASE;
    
    occurrence_num := occurrence_num + 1;
    
    -- Check if we've reached the end date
    IF end_date IS NOT NULL AND occurrence_date > end_date THEN
      EXIT;
    END IF;
    
    -- Create new appointment
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      status,
      reason,
      recurrence_id,
      recurrence_pattern,
      recurrence_end_date,
      occurrence_number,
      created_by
    ) VALUES (
      base_appointment.patient_id,
      base_appointment.doctor_id,
      occurrence_date,
      base_appointment.appointment_time,
      base_appointment.duration_minutes,
      'scheduled',
      base_appointment.reason,
      recurrence_id,
      p_recurrence_pattern,
      end_date,
      occurrence_num,
      base_appointment.created_by
    ) RETURNING id INTO new_appointment_id;
    
    appointment_ids := array_append(appointment_ids, new_appointment_id);
  END LOOP;
  
  RETURN appointment_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check resource availability
CREATE OR REPLACE FUNCTION check_resource_availability(
  p_resource_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer,
  p_exclude_appointment_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM appointment_resources ar
  JOIN appointments a ON ar.appointment_id = a.id
  WHERE ar.resource_id = p_resource_id
    AND a.appointment_date = p_appointment_date
    AND a.status IN ('scheduled', 'in_consultation')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      -- Check if time ranges overlap
      (a.appointment_time, a.appointment_time + (a.duration_minutes || ' minutes')::INTERVAL) 
      OVERLAPS 
      (p_appointment_time, p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL)
    );
    
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find waitlist matches when appointment is cancelled
CREATE OR REPLACE FUNCTION process_waitlist_for_slot(
  p_doctor_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer
) RETURNS TABLE(waitlist_id uuid, patient_id uuid, contact_info jsonb) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.patient_id,
    jsonb_build_object(
      'patient_name', p.first_name || ' ' || p.last_name,
      'phone', p.phone,
      'email', p.email,
      'contact_preference', w.contact_preference
    )
  FROM appointment_waitlist w
  JOIN patients p ON w.patient_id = p.id
  WHERE w.status = 'active'
    AND (w.doctor_id IS NULL OR w.doctor_id = p_doctor_id)
    AND (w.preferred_date_start IS NULL OR p_appointment_date >= w.preferred_date_start)
    AND (w.preferred_date_end IS NULL OR p_appointment_date <= w.preferred_date_end)
    AND (w.preferred_time_start IS NULL OR p_appointment_time >= w.preferred_time_start)
    AND (w.preferred_time_end IS NULL OR p_appointment_time <= w.preferred_time_end)
    AND (w.duration_minutes IS NULL OR w.duration_minutes <= p_duration_minutes)
  ORDER BY 
    CASE w.priority 
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2  
      WHEN 'low' THEN 3
      ELSE 4
    END,
    w.created_at
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at
CREATE TRIGGER update_appointment_waitlist_updated_at
  BEFORE UPDATE ON appointment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();