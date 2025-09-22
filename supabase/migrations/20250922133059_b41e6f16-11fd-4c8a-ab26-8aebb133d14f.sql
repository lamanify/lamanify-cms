-- Create reconciliation tables for claims variance tracking and approval workflows

-- Create panel claims reconciliation entries table
CREATE TABLE public.panel_claims_reconciliation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL,
    reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    claim_amount NUMERIC NOT NULL DEFAULT 0,
    received_amount NUMERIC NOT NULL DEFAULT 0,
    variance_amount NUMERIC GENERATED ALWAYS AS (claim_amount - received_amount) STORED,
    variance_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN claim_amount > 0 THEN ROUND(((claim_amount - received_amount) / claim_amount) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    variance_type TEXT NOT NULL DEFAULT 'none' CHECK (variance_type IN ('none', 'shortfall', 'overpayment', 'partial_rejection', 'full_rejection')),
    reconciliation_status TEXT NOT NULL DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'investigating', 'resolved', 'escalated', 'written_off')),
    reconciled_by UUID,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    payment_date DATE,
    payment_method TEXT,
    rejection_reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation approval workflows table
CREATE TABLE public.reconciliation_approval_workflows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name TEXT NOT NULL,
    variance_threshold_amount NUMERIC NOT NULL DEFAULT 0,
    variance_threshold_percentage NUMERIC NOT NULL DEFAULT 0,
    required_approver_role user_role NOT NULL,
    auto_escalate_days INTEGER DEFAULT 3,
    escalation_role user_role,
    is_active BOOLEAN NOT NULL DEFAULT true,
    panel_id UUID, -- NULL means applies to all panels
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create reconciliation approval requests table
CREATE TABLE public.reconciliation_approval_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reconciliation_id UUID NOT NULL,
    workflow_id UUID NOT NULL,
    requested_by UUID,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'expired')),
    approval_notes TEXT,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create reconciliation variance categories table
CREATE TABLE public.reconciliation_variance_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    category_code TEXT NOT NULL UNIQUE,
    description TEXT,
    default_action TEXT DEFAULT 'investigate' CHECK (default_action IN ('investigate', 'accept', 'escalate', 'write_off')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_reconciliation_claim_id ON public.panel_claims_reconciliation(claim_id);
CREATE INDEX idx_reconciliation_status ON public.panel_claims_reconciliation(reconciliation_status);
CREATE INDEX idx_reconciliation_date ON public.panel_claims_reconciliation(reconciliation_date);
CREATE INDEX idx_reconciliation_variance_amount ON public.panel_claims_reconciliation(variance_amount);
CREATE INDEX idx_reconciliation_approval_status ON public.reconciliation_approval_requests(status);

-- Add foreign key constraints
ALTER TABLE public.panel_claims_reconciliation 
ADD CONSTRAINT fk_reconciliation_claim 
FOREIGN KEY (claim_id) REFERENCES public.panel_claims(id) ON DELETE CASCADE;

ALTER TABLE public.reconciliation_approval_requests
ADD CONSTRAINT fk_approval_reconciliation 
FOREIGN KEY (reconciliation_id) REFERENCES public.panel_claims_reconciliation(id) ON DELETE CASCADE;

ALTER TABLE public.reconciliation_approval_requests
ADD CONSTRAINT fk_approval_workflow 
FOREIGN KEY (workflow_id) REFERENCES public.reconciliation_approval_workflows(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.panel_claims_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_variance_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can manage reconciliation records" ON public.panel_claims_reconciliation
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage approval workflows" ON public.reconciliation_approval_workflows
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage approval requests" ON public.reconciliation_approval_requests
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can manage variance categories" ON public.reconciliation_variance_categories
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Add update triggers
CREATE TRIGGER update_reconciliation_updated_at
    BEFORE UPDATE ON public.panel_claims_reconciliation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON public.reconciliation_approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default variance categories
INSERT INTO public.reconciliation_variance_categories (category_name, category_code, description, default_action) VALUES
('Partial Payment', 'PARTIAL', 'Payment received is less than claimed amount', 'investigate'),
('Overpayment', 'OVER', 'Payment received exceeds claimed amount', 'investigate'),
('Full Rejection', 'REJECT_FULL', 'Entire claim was rejected by panel', 'escalate'),
('Partial Rejection', 'REJECT_PARTIAL', 'Part of the claim was rejected', 'investigate'),
('Processing Delay', 'DELAY', 'Payment delayed but expected to arrive', 'accept'),
('Documentation Issue', 'DOC_ISSUE', 'Missing or incorrect documentation', 'investigate'),
('Coding Error', 'CODE_ERROR', 'Incorrect billing codes submitted', 'investigate'),
('Panel System Error', 'PANEL_ERROR', 'Error in panel payment system', 'escalate');

-- Create function to automatically detect variances and create reconciliation records
CREATE OR REPLACE FUNCTION public.detect_claim_variance()
RETURNS TRIGGER AS $$
DECLARE
    existing_reconciliation_id UUID;
    variance_amt NUMERIC;
    variance_type_val TEXT := 'none';
BEGIN
    -- Only process when status changes to 'paid' or paid_amount is updated
    IF (NEW.status = 'paid' AND OLD.status != 'paid') OR 
       (NEW.paid_amount != OLD.paid_amount AND NEW.status = 'paid') THEN
        
        -- Calculate variance
        variance_amt := NEW.total_amount - COALESCE(NEW.paid_amount, 0);
        
        -- Determine variance type
        IF variance_amt = 0 THEN
            variance_type_val := 'none';
        ELSIF variance_amt > 0 THEN
            IF NEW.paid_amount = 0 THEN
                variance_type_val := 'full_rejection';
            ELSE
                variance_type_val := 'shortfall';
            END IF;
        ELSE
            variance_type_val := 'overpayment';
        END IF;
        
        -- Check if reconciliation record exists
        SELECT id INTO existing_reconciliation_id 
        FROM public.panel_claims_reconciliation 
        WHERE claim_id = NEW.id;
        
        -- Create or update reconciliation record
        IF existing_reconciliation_id IS NULL THEN
            INSERT INTO public.panel_claims_reconciliation (
                claim_id,
                claim_amount,
                received_amount,
                variance_type,
                reconciliation_status,
                payment_date,
                notes
            ) VALUES (
                NEW.id,
                NEW.total_amount,
                COALESCE(NEW.paid_amount, 0),
                variance_type_val,
                CASE WHEN variance_amt = 0 THEN 'resolved' ELSE 'pending' END,
                NEW.paid_at::DATE,
                CASE 
                    WHEN variance_amt = 0 THEN 'Full payment received - automatically reconciled'
                    WHEN variance_amt > 0 THEN 'Payment shortfall detected - requires investigation'
                    ELSE 'Overpayment detected - requires investigation'
                END
            );
        ELSE
            UPDATE public.panel_claims_reconciliation 
            SET 
                claim_amount = NEW.total_amount,
                received_amount = COALESCE(NEW.paid_amount, 0),
                variance_type = variance_type_val,
                reconciliation_status = CASE WHEN variance_amt = 0 THEN 'resolved' ELSE reconciliation_status END,
                payment_date = NEW.paid_at::DATE,
                updated_at = now()
            WHERE id = existing_reconciliation_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic variance detection
CREATE TRIGGER trigger_detect_claim_variance
    AFTER UPDATE ON public.panel_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_claim_variance();

-- Create function to check if reconciliation needs approval
CREATE OR REPLACE FUNCTION public.check_reconciliation_needs_approval(reconciliation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rec_record RECORD;
    workflow_exists BOOLEAN := false;
BEGIN
    -- Get reconciliation details
    SELECT r.*, pc.panel_id
    INTO rec_record
    FROM public.panel_claims_reconciliation r
    JOIN public.panel_claims pc ON r.claim_id = pc.id
    WHERE r.id = reconciliation_id;
    
    -- Check if any workflow applies
    SELECT EXISTS(
        SELECT 1 FROM public.reconciliation_approval_workflows 
        WHERE (panel_id = rec_record.panel_id OR panel_id IS NULL)
        AND is_active = true
        AND (
            ABS(rec_record.variance_amount) >= variance_threshold_amount OR
            ABS(rec_record.variance_percentage) >= variance_threshold_percentage
        )
    ) INTO workflow_exists;
    
    RETURN workflow_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;