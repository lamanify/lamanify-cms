-- Stage 3 Appointment Upgrades: Cancellation Policies, Follow-ups, and Pre-Consultation

-- Phase 1: Cancellation Policies and No-Show Handling
CREATE TABLE public.cancellation_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name TEXT NOT NULL,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
  late_cancellation_fee NUMERIC DEFAULT 0,
  no_show_fee NUMERIC DEFAULT 0,
  max_no_shows_before_restriction INTEGER DEFAULT 3,
  restriction_duration_days INTEGER DEFAULT 30,
  auto_restriction_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cancellation_policies
CREATE POLICY "Admins can manage cancellation policies"
ON public.cancellation_policies
FOR ALL
USING (get_user_role() = 'admin');

CREATE POLICY "Staff can view cancellation policies"
ON public.cancellation_policies
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Patient Reliability Tracking
CREATE TABLE public.patient_reliability_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  late_cancellations INTEGER DEFAULT 0,
  on_time_arrivals INTEGER DEFAULT 0,
  reliability_score NUMERIC DEFAULT 100.0,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  last_no_show_date DATE,
  restriction_active BOOLEAN DEFAULT false,
  restriction_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_reliability_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_reliability_scores
CREATE POLICY "Staff can manage patient reliability scores"
ON public.patient_reliability_scores
FOR ALL
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Phase 2: Follow-up Campaigns
CREATE TABLE public.follow_up_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL, -- 'appointment_completed', 'diagnosis_specific', 'service_specific'
  trigger_criteria JSONB, -- Additional criteria for triggering
  follow_up_days INTEGER NOT NULL,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('appointment', 'reminder', 'both')),
  message_template TEXT,
  appointment_reason TEXT,
  appointment_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.follow_up_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follow_up_campaigns
CREATE POLICY "Admins can manage follow-up campaigns"
ON public.follow_up_campaigns
FOR ALL
USING (get_user_role() = 'admin');

CREATE POLICY "Staff can view follow-up campaigns"
ON public.follow_up_campaigns
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Recall Campaigns
CREATE TABLE public.recall_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  target_criteria JSONB NOT NULL, -- Criteria for selecting patients
  message_template TEXT NOT NULL,
  scheduled_date DATE,
  campaign_status TEXT DEFAULT 'draft' CHECK (campaign_status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  patients_targeted INTEGER DEFAULT 0,
  patients_contacted INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.recall_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recall_campaigns
CREATE POLICY "Staff can manage recall campaigns"
ON public.recall_campaigns
FOR ALL
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Phase 3: Pre-Consultation Forms
CREATE TABLE public.pre_consultation_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_name TEXT NOT NULL,
  form_description TEXT,
  form_fields JSONB NOT NULL, -- Dynamic form structure
  appointment_types TEXT[], -- Which appointment types require this form
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.pre_consultation_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pre_consultation_forms
CREATE POLICY "Admins can manage pre-consultation forms"
ON public.pre_consultation_forms
FOR ALL
USING (get_user_role() = 'admin');

CREATE POLICY "Staff can view pre-consultation forms"
ON public.pre_consultation_forms
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Patient Form Submissions
CREATE TABLE public.patient_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  form_id UUID NOT NULL REFERENCES public.pre_consultation_forms(id),
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.patient_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_form_submissions
CREATE POLICY "Staff can view patient form submissions"
ON public.patient_form_submissions
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Digital Check-in Links
CREATE TABLE public.appointment_check_in_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  secure_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  forms_completed BOOLEAN DEFAULT false,
  check_in_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_check_in_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_check_in_links
CREATE POLICY "Staff can manage check-in links"
ON public.appointment_check_in_links
FOR ALL
USING (get_user_role() = ANY(ARRAY['admin', 'doctor', 'nurse', 'receptionist']));

-- Public access for patients using secure tokens
CREATE POLICY "Public access with valid token"
ON public.appointment_check_in_links
FOR SELECT
USING (expires_at > now() AND used_at IS NULL);

-- Add new fields to existing tables
ALTER TABLE public.appointments 
ADD COLUMN digital_check_in_status TEXT DEFAULT 'pending' CHECK (digital_check_in_status IN ('pending', 'forms_sent', 'forms_completed', 'checked_in')),
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN cancellation_fee NUMERIC DEFAULT 0,
ADD COLUMN no_show_marked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN follow_up_scheduled BOOLEAN DEFAULT false;

-- Add reliability tracking to patients
ALTER TABLE public.patients
ADD COLUMN reliability_score NUMERIC DEFAULT 100.0,
ADD COLUMN risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN restriction_active BOOLEAN DEFAULT false,
ADD COLUMN restriction_reason TEXT,
ADD COLUMN restriction_end_date DATE;

-- Function to calculate reliability score
CREATE OR REPLACE FUNCTION public.calculate_patient_reliability_score(p_patient_id UUID)
RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update patient reliability
CREATE OR REPLACE FUNCTION public.update_patient_reliability(p_patient_id UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update reliability when appointment status changes
CREATE OR REPLACE FUNCTION public.handle_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reliability if status changed to completed, no_show, or cancelled
  IF (OLD.status IS DISTINCT FROM NEW.status) AND 
     NEW.status IN ('completed', 'no_show', 'cancelled') THEN
    PERFORM update_patient_reliability(NEW.patient_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_patient_reliability_trigger ON appointments;
CREATE TRIGGER update_patient_reliability_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_status_change();

-- Function to generate secure check-in token
CREATE OR REPLACE FUNCTION public.generate_check_in_link(p_appointment_id UUID)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;