-- Stage 3 Appointment Upgrades: Cancellation Policies, Follow-ups, and Pre-Consultation (Fixed)

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
  created_by UUID,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cancellation_policies
CREATE POLICY "Admins can manage cancellation policies"
ON public.cancellation_policies
FOR ALL
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view cancellation policies"
ON public.cancellation_policies
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Patient Reliability Tracking
CREATE TABLE public.patient_reliability_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL UNIQUE,
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
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

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
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.follow_up_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follow_up_campaigns
CREATE POLICY "Admins can manage follow-up campaigns"
ON public.follow_up_campaigns
FOR ALL
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view follow-up campaigns"
ON public.follow_up_campaigns
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

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
  created_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.recall_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recall_campaigns
CREATE POLICY "Staff can manage recall campaigns"
ON public.recall_campaigns
FOR ALL
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

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
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.pre_consultation_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pre_consultation_forms
CREATE POLICY "Admins can manage pre-consultation forms"
ON public.pre_consultation_forms
FOR ALL
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view pre-consultation forms"
ON public.pre_consultation_forms
FOR SELECT
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

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
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

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
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Public access for patients using secure tokens (no auth required)
CREATE POLICY "Public access with valid token"
ON public.appointment_check_in_links
FOR SELECT
TO anon
USING (expires_at > now() AND used_at IS NULL);

-- Add new fields to existing tables
ALTER TABLE public.appointments 
ADD COLUMN digital_check_in_status TEXT DEFAULT 'pending' CHECK (digital_check_in_status IN ('pending', 'forms_sent', 'forms_completed', 'checked_in')),
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancelled_by UUID,
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