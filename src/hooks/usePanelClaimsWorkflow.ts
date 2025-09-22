import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  panel_id?: string;
  min_approval_amount: number;
  max_approval_amount?: number;
  required_role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'locum';
  approval_order: number;
  is_active: boolean;
  auto_approve: boolean;
  approval_timeout_hours?: number;
  escalation_role?: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'locum';
  created_at: string;
}

interface ApprovalRequest {
  id: string;
  claim_id: string;
  workflow_id: string;
  requested_by?: string;
  approved_by?: string;
  status: string;
  request_amount: number;
  approval_notes?: string;
  rejection_reason?: string;
  requested_at: string;
  responded_at?: string;
  expires_at?: string;
  [key: string]: any;
}

interface StatusRule {
  id: string;
  rule_name: string;
  from_status: string;
  to_status: string;
  trigger_type: string;
  trigger_condition: any;
  is_active: boolean;
  auto_execute: boolean;
  notification_enabled: boolean;
  delay_hours: number;
}

interface ClaimSchedule {
  id: string;
  schedule_name: string;
  panel_id: string;
  frequency: string;
  day_of_period?: number;
  billing_period_days: number;
  auto_submit: boolean;
  is_active: boolean;
  last_generated_at?: string;
  next_generation_at?: string;
  template_settings: any;
  [key: string]: any;
}

export const usePanelClaimsWorkflow = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [statusRules, setStatusRules] = useState<StatusRule[]>([]);
  const [claimSchedules, setClaimSchedules] = useState<ClaimSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch approval workflows
  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_approval_workflows')
        .select('*')
        .order('approval_order');
      
      if (error) throw error;
      setWorkflows((data as ApprovalWorkflow[]) || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch approval workflows",
        variant: "destructive"
      });
    }
  };

  // Fetch approval requests
  const fetchApprovalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_approval_requests')
        .select(`
          *,
          panel_claims!inner(claim_number, panel_id, total_amount),
          profiles:requested_by(first_name, last_name),
          approver:approved_by(first_name, last_name)
        `)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      setApprovalRequests((data as ApprovalRequest[]) || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    }
  };

  // Fetch status rules
  const fetchStatusRules = async () => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_status_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStatusRules((data as StatusRule[]) || []);
    } catch (error) {
      console.error('Error fetching status rules:', error);
    }
  };

  // Fetch claim schedules
  const fetchClaimSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_schedules')
        .select(`
          *,
          panels(panel_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClaimSchedules((data as ClaimSchedule[]) || []);
    } catch (error) {
      console.error('Error fetching claim schedules:', error);
    }
  };

  // Create approval workflow
  const createWorkflow = async (workflowData: any) => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_approval_workflows')
        .insert(workflowData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Approval workflow created successfully"
      });
      
      fetchWorkflows();
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create approval workflow",
        variant: "destructive"
      });
    }
  };

  // Process approval request
  const processApprovalRequest = async (
    requestId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ) => {
    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        responded_at: new Date().toISOString()
      };

      if (action === 'approve') {
        updates.approval_notes = notes;
      } else {
        updates.rejection_reason = notes;
      }

      const { error } = await supabase
        .from('panel_claims_approval_requests')
        .update(updates)
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Request ${action}d successfully`
      });
      
      fetchApprovalRequests();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Failed to process approval request",
        variant: "destructive"
      });
    }
  };

  // Create status rule
  const createStatusRule = async (ruleData: any) => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_status_rules')
        .insert(ruleData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Status rule created successfully"
      });
      
      fetchStatusRules();
      return data;
    } catch (error) {
      console.error('Error creating status rule:', error);
      toast({
        title: "Error",
        description: "Failed to create status rule",
        variant: "destructive"
      });
    }
  };

  // Create claim schedule
  const createClaimSchedule = async (scheduleData: any) => {
    try {
      const { data, error } = await supabase
        .from('panel_claims_schedules')
        .insert(scheduleData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Claim schedule created successfully"
      });
      
      fetchClaimSchedules();
      return data;
    } catch (error) {
      console.error('Error creating claim schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create claim schedule",
        variant: "destructive"
      });
    }
  };

  // Check if claim needs approval
  const checkClaimNeedsApproval = async (claimId: string, amount: number) => {
    try {
      const { data, error } = await supabase
        .rpc('check_claim_needs_approval', {
          p_claim_id: claimId,
          p_amount: amount
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking approval need:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchApprovalRequests();
    fetchStatusRules();
    fetchClaimSchedules();
  }, []);

  return {
    workflows,
    approvalRequests,
    statusRules,
    claimSchedules,
    loading,
    createWorkflow,
    processApprovalRequest,
    createStatusRule,
    createClaimSchedule,
    checkClaimNeedsApproval,
    refetch: () => {
      fetchWorkflows();
      fetchApprovalRequests();
      fetchStatusRules();
      fetchClaimSchedules();
    }
  };
};