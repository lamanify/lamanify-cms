import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PanelClaim {
  id: string;
  claim_number: string;
  panel_id: string;
  billing_period_start: string;
  billing_period_end: string;
  total_amount: number;
  total_items: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'short_paid' | 'rejected';
  submitted_at?: string;
  submitted_by?: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  paid_amount?: number;
  rejection_reason?: string;
  panel_reference_number?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Computed fields for reconciliation
  panel_amount: number;
  patient_amount: number;
  // Joined data
  panel?: {
    panel_name: string;
    panel_code: string;
  };
  submitted_by_profile?: {
    first_name: string;
    last_name: string;
  };
  claim_items?: PanelClaimItem[];
}

export interface PanelClaimItem {
  id: string;
  claim_id: string;
  billing_id: string;
  item_amount: number;
  claim_amount: number;
  status: 'included' | 'excluded' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  // Joined data
  billing?: {
    invoice_number: string;
    description: string;
    patient_id: string;
    amount: number;
  };
}

export function usePanelClaims() {
  const [claims, setClaims] = useState<PanelClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchClaims = async (filters?: { panel_id?: string; status?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('panel_claims')
        .select(`
          *,
          panel:panels(panel_name, panel_code),
          submitted_by_profile:profiles!panel_claims_submitted_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.panel_id) {
        query = query.eq('panel_id', filters.panel_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Compute panel_amount and patient_amount (90/10 split)
      const claimsWithComputedAmounts = (data || []).map(claim => ({
        ...claim,
        panel_amount: claim.total_amount * 0.9,
        patient_amount: claim.total_amount * 0.1,
      })) as PanelClaim[];
      
      setClaims(claimsWithComputedAmounts);
    } catch (error: any) {
      toast({
        title: "Error fetching panel claims",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimDetails = async (claimId: string): Promise<PanelClaim | null> => {
    try {
      const { data, error } = await supabase
        .from('panel_claims')
        .select(`
          *,
          panel:panels(panel_name, panel_code),
          submitted_by_profile:profiles!panel_claims_submitted_by_fkey(first_name, last_name),
          claim_items:panel_claim_items(
            *,
            billing:billing(invoice_number, description, patient_id, amount)
          )
        `)
        .eq('id', claimId)
        .single();

      if (error) throw error;
      
      // Compute panel_amount and patient_amount (90/10 split)
      return {
        ...data,
        panel_amount: data.total_amount * 0.9,
        patient_amount: data.total_amount * 0.1,
      } as PanelClaim;
    } catch (error: any) {
      toast({
        title: "Error fetching claim details",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const createClaim = async (claimData: {
    panel_id: string;
    billing_period_start: string;
    billing_period_end: string;
    billing_ids: string[];
  }) => {
    try {
      // Generate claim number
      const { data: claimNumberData, error: claimNumberError } = await supabase
        .rpc('generate_claim_number');

      if (claimNumberError) throw claimNumberError;

      // Calculate totals from billing records
      const { data: billingData, error: billingError } = await supabase
        .from('billing')
        .select('id, amount')
        .in('id', claimData.billing_ids);

      if (billingError) throw billingError;

      const totalAmount = billingData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalItems = billingData?.length || 0;

      // Create the claim
      const { data: newClaim, error: claimError } = await supabase
        .from('panel_claims')
        .insert({
          claim_number: claimNumberData,
          panel_id: claimData.panel_id,
          billing_period_start: claimData.billing_period_start,
          billing_period_end: claimData.billing_period_end,
          total_amount: totalAmount,
          total_items: totalItems,
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // Create claim items
      const claimItems = billingData?.map(billing => ({
        claim_id: newClaim.id,
        billing_id: billing.id,
        item_amount: Number(billing.amount),
        claim_amount: Number(billing.amount),
      })) || [];

      const { error: itemsError } = await supabase
        .from('panel_claim_items')
        .insert(claimItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Claim created successfully",
        description: `Claim ${claimNumberData} has been created with ${totalItems} items.`,
      });

      await fetchClaims();
      return newClaim;
    } catch (error: any) {
      toast({
        title: "Error creating claim",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateClaimStatus = async (
    claimId: string, 
    status: PanelClaim['status'], 
    updates?: Partial<PanelClaim & { reason?: string; paidAmount?: number }>
  ) => {
    try {
      setLoading(true);

      // Get current claim to validate transition
      const { data: currentClaim, error: fetchError } = await supabase
        .from('panel_claims')
        .select('status')
        .eq('id', claimId)
        .single();

      if (fetchError) throw fetchError;

      // Validate status transition
      const isValidTransition = await validateStatusTransition(currentClaim.status, status);
      if (!isValidTransition) {
        toast({
          title: "Invalid Status Change",
          description: `Cannot change status from "${currentClaim.status}" to "${status}"`,
          variant: "destructive",
        });
        return;
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ...updates,
      };

      // Handle rejection with reason
      if (status === 'rejected' && updates?.reason) {
        updateData.rejection_reason = updates.reason;
      }

      // Handle payment with amount validation
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        if (updates?.paidAmount) {
          updateData.paid_amount = updates.paidAmount;
        }
      }

      // Set timestamp fields based on status
      if (status === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
        updateData.submitted_by = (await supabase.auth.getUser()).data.user?.id;
      } else if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from('panel_claims')
        .update(updateData)
        .eq('id', claimId);

      if (error) throw error;

      // Refresh claims list
      await fetchClaims();
      toast({
        title: "Success",
        description: `Claim status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStatusTransition = async (
    currentStatus: string,
    newStatus: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_claim_status_transition', {
        old_status: currentStatus,
        new_status: newStatus
      });
      
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error validating status transition:', error);
      return false;
    }
  };

  const deleteClaim = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('panel_claims')
        .delete()
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: "Claim deleted successfully",
        description: "The claim has been removed from the system.",
      });

      await fetchClaims();
    } catch (error: any) {
      toast({
        title: "Error deleting claim",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  return {
    claims,
    loading,
    fetchClaims,
    fetchClaimDetails,
    createClaim,
    updateClaimStatus,
    validateStatusTransition,
    deleteClaim,
  };
}