import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReconciliationRecord {
  id: string;
  claim_id: string;
  reconciliation_date: string;
  claim_amount: number;
  received_amount: number;
  variance_amount: number;
  variance_percentage: number;
  variance_type: string;
  reconciliation_status: string;
  reconciled_by?: string;
  reconciled_at?: string;
  payment_reference?: string;
  payment_date?: string;
  payment_method?: string;
  rejection_reason?: string;
  notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Joined data
  panel_claims?: {
    claim_number: string;
    panel_id: string;
    billing_period_start: string;
    billing_period_end: string;
    panels?: {
      name: string;
    };
  };
}

export interface VarianceCategory {
  id: string;
  category_name: string;
  category_code: string;
  description?: string;
  default_action: string;
  is_active: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  variance_threshold_amount: number;
  variance_threshold_percentage: number;
  required_approver_role: string;
  auto_escalate_days: number;
  escalation_role?: string;
  is_active: boolean;
  panel_id?: string;
}

export interface ReconciliationStats {
  total_variances: number;
  pending_count: number;
  resolved_count: number;
  total_variance_amount: number;
  avg_variance_percentage: number;
  top_variance_types: Array<{
    variance_type: string;
    count: number;
    total_amount: number;
  }>;
}

export const useClaimsReconciliation = () => {
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [categories, setCategories] = useState<VarianceCategory[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReconciliations = async (filters?: {
    status?: string;
    variance_type?: string;
    panel_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('panel_claims_reconciliation')
        .select(`
          *,
          panel_claims!inner(
            claim_number,
            panel_id,
            billing_period_start,
            billing_period_end,
            panels(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('reconciliation_status', filters.status);
      }
      if (filters?.variance_type) {
        query = query.eq('variance_type', filters.variance_type);
      }
      if (filters?.panel_id) {
        query = query.eq('panel_claims.panel_id', filters.panel_id);
      }
      if (filters?.date_from) {
        query = query.gte('reconciliation_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('reconciliation_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReconciliations(data as any || []);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      toast({
        title: "Error fetching reconciliations",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('reconciliation_variance_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching variance categories:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('reconciliation_approval_workflows')
        .select('*')
        .eq('is_active', true)
        .order('workflow_name');

      if (error) throw error;

      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchReconciliationStats = async (panelId?: string) => {
    try {
      let baseQuery = supabase
        .from('panel_claims_reconciliation')
        .select(`
          variance_amount,
          variance_percentage,
          variance_type,
          reconciliation_status,
          panel_claims!inner(panel_id)
        `);

      if (panelId) {
        baseQuery = baseQuery.eq('panel_claims.panel_id', panelId);
      }

      const { data, error } = await baseQuery;

      if (error) throw error;

      if (data) {
        const totalVariances = data.length;
        const pendingCount = data.filter(r => r.reconciliation_status === 'pending').length;
        const resolvedCount = data.filter(r => r.reconciliation_status === 'resolved').length;
        const totalVarianceAmount = data.reduce((sum, r) => sum + Math.abs(r.variance_amount), 0);
        const avgVariancePercentage = data.length > 0 
          ? data.reduce((sum, r) => sum + Math.abs(r.variance_percentage), 0) / data.length 
          : 0;

        // Group by variance type
        const varianceTypeMap = data.reduce((acc, r) => {
          if (!acc[r.variance_type]) {
            acc[r.variance_type] = { count: 0, total_amount: 0 };
          }
          acc[r.variance_type].count++;
          acc[r.variance_type].total_amount += Math.abs(r.variance_amount);
          return acc;
        }, {} as Record<string, { count: number; total_amount: number }>);

        const topVarianceTypes = Object.entries(varianceTypeMap)
          .map(([variance_type, stats]) => ({
            variance_type,
            count: stats.count,
            total_amount: stats.total_amount
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        setStats({
          total_variances: totalVariances,
          pending_count: pendingCount,
          resolved_count: resolvedCount,
          total_variance_amount: totalVarianceAmount,
          avg_variance_percentage: avgVariancePercentage,
          top_variance_types: topVarianceTypes
        });
      }
    } catch (error) {
      console.error('Error fetching reconciliation stats:', error);
    }
  };

  const updateReconciliationStatus = async (
    reconciliationId: string, 
    status: string,
    updates?: Partial<ReconciliationRecord>
  ) => {
    try {
      setLoading(true);

      const updateData = {
        reconciliation_status: status,
        reconciled_by: status === 'resolved' ? (await supabase.auth.getUser()).data.user?.id : undefined,
        reconciled_at: status === 'resolved' ? new Date().toISOString() : undefined,
        ...updates
      };

      const { error } = await supabase
        .from('panel_claims_reconciliation')
        .update(updateData)
        .eq('id', reconciliationId);

      if (error) throw error;

      toast({
        title: "Reconciliation updated",
        description: `Status changed to ${status}`,
      });

      // Refresh data
      await fetchReconciliations();
      
    } catch (error) {
      console.error('Error updating reconciliation:', error);
      toast({
        title: "Error updating reconciliation",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createApprovalRequest = async (reconciliationId: string, workflowId: string) => {
    try {
      const { error } = await supabase
        .from('reconciliation_approval_requests')
        .insert({
          reconciliation_id: reconciliationId,
          workflow_id: workflowId,
          requested_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        });

      if (error) throw error;

      toast({
        title: "Approval request created",
        description: "The reconciliation has been submitted for approval",
      });

    } catch (error) {
      console.error('Error creating approval request:', error);
      toast({
        title: "Error creating approval request",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const createWorkflow = async (workflow: any) => {
    try {
      const { error } = await supabase
        .from('reconciliation_approval_workflows')
        .insert(workflow);

      if (error) throw error;

      toast({
        title: "Workflow created",
        description: "New approval workflow has been created",
      });

      await fetchWorkflows();

    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error creating workflow",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchReconciliations();
    fetchCategories();
    fetchWorkflows();
    fetchReconciliationStats();
  }, []);

  return {
    reconciliations,
    categories,
    workflows,
    stats,
    loading,
    fetchReconciliations,
    fetchReconciliationStats,
    updateReconciliationStatus,
    createApprovalRequest,
    createWorkflow
  };
};