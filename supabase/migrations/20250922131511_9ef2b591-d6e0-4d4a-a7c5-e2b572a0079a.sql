-- Phase 2B: Document Management & Enhanced Notes System

-- Create storage bucket for panel claim documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('panel-claim-files', 'panel-claim-files', false);

-- Create panel claim documents table
CREATE TABLE public.panel_claim_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.panel_claims(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('supporting_document', 'invoice', 'receipt', 'correspondence', 'medical_report', 'other')),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create panel claim notes table for enhanced note tracking
CREATE TABLE public.panel_claim_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.panel_claims(id) ON DELETE CASCADE,
    note_category TEXT NOT NULL CHECK (note_category IN ('internal', 'panel_communication', 'follow_up', 'system')),
    content TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'panel_shared', 'public')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    parent_note_id UUID REFERENCES public.panel_claim_notes(id),
    is_system_generated BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create scheduled reports table for automation
CREATE TABLE public.panel_claims_scheduled_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly_summary', 'quarterly_review', 'aging_analysis', 'panel_performance', 'custom')),
    schedule_frequency TEXT NOT NULL CHECK (schedule_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    schedule_day INTEGER, -- Day of week/month
    recipients TEXT[] NOT NULL, -- Email addresses
    panel_filters UUID[], -- Panel IDs to include
    date_range_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    report_template JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.panel_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claim_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_claims_scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for panel claim documents
CREATE POLICY "Staff can manage panel claim documents" ON public.panel_claim_documents
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for panel claim notes
CREATE POLICY "Staff can manage panel claim notes" ON public.panel_claim_notes
FOR ALL USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for scheduled reports
CREATE POLICY "Admins can manage scheduled reports" ON public.panel_claims_scheduled_reports
FOR ALL USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view scheduled reports" ON public.panel_claims_scheduled_reports
FOR SELECT USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create storage policies for panel claim files
CREATE POLICY "Staff can upload panel claim files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'panel-claim-files' AND
    get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);

CREATE POLICY "Staff can view panel claim files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'panel-claim-files' AND
    get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);

CREATE POLICY "Staff can update panel claim files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'panel-claim-files' AND
    get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);

CREATE POLICY "Staff can delete panel claim files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'panel-claim-files' AND
    get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);

-- Create updated_at triggers
CREATE TRIGGER update_panel_claim_documents_updated_at
    BEFORE UPDATE ON public.panel_claim_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_panel_claim_notes_updated_at
    BEFORE UPDATE ON public.panel_claim_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON public.panel_claims_scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_panel_claim_documents_claim_id ON public.panel_claim_documents(claim_id);
CREATE INDEX idx_panel_claim_documents_type ON public.panel_claim_documents(document_type);
CREATE INDEX idx_panel_claim_notes_claim_id ON public.panel_claim_notes(claim_id);
CREATE INDEX idx_panel_claim_notes_category ON public.panel_claim_notes(note_category);
CREATE INDEX idx_panel_claim_notes_created_at ON public.panel_claim_notes(created_at);
CREATE INDEX idx_scheduled_reports_next_generation ON public.panel_claims_scheduled_reports(next_generation_at, is_active);

-- Function to generate aging analysis
CREATE OR REPLACE FUNCTION public.generate_claim_aging_analysis(p_panel_id UUID DEFAULT NULL)
RETURNS TABLE(
    age_range TEXT,
    claim_count INTEGER,
    total_amount NUMERIC,
    avg_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH claim_ages AS (
        SELECT 
            pc.id,
            pc.total_amount,
            CASE 
                WHEN pc.status = 'paid' THEN COALESCE(EXTRACT(days FROM pc.paid_at - pc.created_at), 0)
                ELSE EXTRACT(days FROM now() - pc.created_at)
            END as age_days
        FROM panel_claims pc
        WHERE (p_panel_id IS NULL OR pc.panel_id = p_panel_id)
    )
    SELECT 
        CASE 
            WHEN ca.age_days <= 30 THEN '0-30 days'
            WHEN ca.age_days <= 60 THEN '31-60 days'
            WHEN ca.age_days <= 90 THEN '61-90 days'
            WHEN ca.age_days <= 120 THEN '91-120 days'
            ELSE '120+ days'
        END as age_range,
        COUNT(*)::INTEGER as claim_count,
        SUM(ca.total_amount) as total_amount,
        AVG(ca.total_amount) as avg_amount
    FROM claim_ages ca
    GROUP BY 
        CASE 
            WHEN ca.age_days <= 30 THEN '0-30 days'
            WHEN ca.age_days <= 60 THEN '31-60 days'
            WHEN ca.age_days <= 90 THEN '61-90 days'
            WHEN ca.age_days <= 120 THEN '91-120 days'
            ELSE '120+ days'
        END
    ORDER BY 
        CASE 
            WHEN age_range = '0-30 days' THEN 1
            WHEN age_range = '31-60 days' THEN 2
            WHEN age_range = '61-90 days' THEN 3
            WHEN age_range = '91-120 days' THEN 4
            ELSE 5
        END;
END;
$$;