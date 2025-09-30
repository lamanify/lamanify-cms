import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BillingRecord {
  id: string;
  invoice_number: string;
  patient_id: string;
  visit_id?: string;
  appointment_id?: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  payment_method?: string;
  panel_id?: string;
  claim_status?: string;
  claim_number?: string;
  staff_name?: string;
  staff_ic_passport?: string;
  relationship_to_patient?: string;
  submission_date?: string;
  claim_submitted_by?: string;
  panel_reference_number?: string;
  claim_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  patient?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  panel?: {
    panel_name: string;
    panel_code: string;
  };
}

interface UseBillingRecordsOptions {
  payer?: 'panel' | 'patient' | 'all';
  status?: 'outstanding' | 'paid' | 'all';
  panelId?: string;
}

export function useBillingRecords(options: UseBillingRecordsOptions = {}) {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBillingRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('billing')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          panel:panels(panel_name, panel_code)
        `)
        .order('created_at', { ascending: false });

      // Filter by payer type
      if (options.payer === 'panel') {
        query = query.not('panel_id', 'is', null);
      } else if (options.payer === 'patient') {
        query = query.is('panel_id', null);
      }

      // Filter by status
      if (options.status === 'outstanding') {
        query = query.in('status', ['pending', 'unpaid', 'partial']);
      } else if (options.status === 'paid') {
        query = query.eq('status', 'paid');
      }

      // Filter by specific panel
      if (options.panelId) {
        query = query.eq('panel_id', options.panelId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBillingRecords((data || []) as BillingRecord[]);
    } catch (error: any) {
      toast({
        title: "Error fetching billing records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBillingStatus = async (
    billingId: string,
    status: string,
    updates?: {
      reason?: string;
      paidAmount?: number;
      claimStatus?: string;
    }
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Handle claim status
      if (updates?.claimStatus) {
        updateData.claim_status = updates.claimStatus;
      }

      // Handle rejection reason
      if (updates?.reason) {
        updateData.claim_notes = updates.reason;
      }

      // Handle paid amount
      if (updates?.paidAmount !== undefined) {
        updateData.amount = updates.paidAmount;
        if (status === 'paid') {
          updateData.paid_date = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('billing')
        .update(updateData)
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing record updated successfully",
      });

      await fetchBillingRecords();
    } catch (error: any) {
      toast({
        title: "Error updating billing record",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const batchUpdateBillingStatus = async (
    billingIds: string[],
    status: string,
    updates?: {
      reason?: string;
      paidAmount?: number;
      claimStatus?: string;
    }
  ) => {
    try {
      setLoading(true);
      
      for (const billingId of billingIds) {
        await updateBillingStatus(billingId, status, updates);
      }

      toast({
        title: "Batch update completed",
        description: `Successfully updated ${billingIds.length} billing records`,
      });
    } catch (error: any) {
      toast({
        title: "Error in batch update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingRecords();
  }, [options.payer, options.status, options.panelId]);

  return {
    billingRecords,
    loading,
    fetchBillingRecords,
    updateBillingStatus,
    batchUpdateBillingStatus,
  };
}
