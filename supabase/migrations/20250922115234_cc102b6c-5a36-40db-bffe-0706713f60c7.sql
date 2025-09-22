-- Create approval workflows table
CREATE TABLE public.panel_claims_approval_workflows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name TEXT NOT NULL,
    panel_id UUID REFERENCES public.panels(id),
    min_approval_amount NUMERIC NOT NULL DEFAULT 0,
    max_approval_amount NUMERIC,
    required_role user_role NOT NULL,
    approval_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_approve BOOLEAN NOT NULL DEFAULT false,
    approval_timeout_hours INTEGER DEFAULT 48,
    escalation_role user_role,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create approval requests table
CREATE TABLE public.panel_claims_approval_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.panel_claims(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.panel_claims_approval_workflows(id),
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'expired')),
    request_amount NUMERIC NOT NULL,
    approval_notes TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create status progression rules table
CREATE TABLE public.panel_claims_status_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_based', 'amount_based', 'manual', 'approval_based')),
    trigger_condition JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_execute BOOLEAN NOT NULL DEFAULT false,
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    delay_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled claim generation table
CREATE TABLE public.panel_claims_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_name TEXT NOT NULL,
    panel_id UUID NOT NULL REFERENCES public.panels(id),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
    day_of_period INTEGER, -- day of month for monthly, day of week for weekly
    billing_period_days INTEGER NOT NULL DEFAULT 30,
    auto_submit BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    template_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create notifications table
CREATE TABLE public.panel_claims_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES public.panel_claims(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('status_change', 'approval_required', 'payment_overdue', 'schedule_reminder')),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('panel', 'staff', 'system')),
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.panel_claims_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claims_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claims_status_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claims_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claims_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can manage approval workflows" ON public.panel_claims_approval_workflows
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage approval requests" ON public.panel_claims_approval_requests
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage status rules" ON public.panel_claims_status_rules
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage claim schedules" ON public.panel_claims_schedules
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can view notifications" ON public.panel_claims_notifications
FOR SELECT USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "System can manage notifications" ON public.panel_claims_notifications
FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON public.panel_claims_approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_rules_updated_at
    BEFORE UPDATE ON public.panel_claims_status_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.panel_claims_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_approval_workflows_panel_amount ON public.panel_claims_approval_workflows(panel_id, min_approval_amount, max_approval_amount);
CREATE INDEX idx_approval_requests_claim_status ON public.panel_claims_approval_requests(claim_id, status);
CREATE INDEX idx_status_rules_trigger ON public.panel_claims_status_rules(from_status, to_status, is_active);
CREATE INDEX idx_schedules_next_generation ON public.panel_claims_schedules(next_generation_at, is_active);
CREATE INDEX idx_notifications_status_type ON public.panel_claims_notifications(status, notification_type);

-- Function to check if claim needs approval
CREATE OR REPLACE FUNCTION public.check_claim_needs_approval(p_claim_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claim_panel_id UUID;
    workflow_exists BOOLEAN := false;
BEGIN
    -- Get panel ID from claim
    SELECT panel_id INTO claim_panel_id FROM panel_claims WHERE id = p_claim_id;
    
    -- Check if any workflow applies
    SELECT EXISTS(
        SELECT 1 FROM panel_claims_approval_workflows 
        WHERE (panel_id = claim_panel_id OR panel_id IS NULL)
        AND is_active = true
        AND p_amount >= min_approval_amount
        AND (max_approval_amount IS NULL OR p_amount <= max_approval_amount)
    ) INTO workflow_exists;
    
    RETURN workflow_exists;
END;
$$;