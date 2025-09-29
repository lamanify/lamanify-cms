import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingSyncData {
  visitId: string;
  patientId: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalPaid: number;
}

export function useBillingSync() {
  const [isEnabled, setIsEnabled] = useState(true);
  const { toast } = useToast();

  const syncBillingFromVisit = useCallback(async (visitData: BillingSyncData) => {
    if (!isEnabled) return;

    try {
      // Check if billing record exists for this visit
      const { data: existingBilling, error: checkError } = await supabase
        .from('billing')
        .select('id, status, amount')
        .eq('appointment_id', visitData.visitId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing billing:', checkError);
        return;
      }

      if (existingBilling) {
        // Update existing billing record
        const newStatus = visitData.paymentStatus === 'paid' ? 'paid' : 'pending';
        
        const { error: updateError } = await supabase
          .from('billing')
          .update({
            amount: visitData.totalAmount,
            status: newStatus,
            paid_date: visitData.paymentStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBilling.id);

        if (updateError) {
          console.error('Error updating billing record:', updateError);
          toast({
            title: "Billing Sync Error",
            description: "Failed to update billing record from visit data",
            variant: "destructive",
          });
        } else {
          console.log('Billing record updated successfully from visit sync');
        }
      } else {
        // Let the database trigger handle creation for new visits
        console.log('No existing billing record found - will be created by database trigger');
      }
    } catch (error) {
      console.error('Error in billing sync:', error);
      toast({
        title: "Billing Sync Error",
        description: "Failed to sync billing data from visit update",
        variant: "destructive",
      });
    }
  }, [isEnabled, toast]);

  // Set up real-time listener for patient visit changes
  useEffect(() => {
    if (!isEnabled) return;

    const channel = supabase
      .channel('billing-sync-visits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patient_visits'
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Only sync if payment-related fields changed
          if (
            newData.payment_status !== oldData.payment_status ||
            newData.total_amount !== oldData.total_amount ||
            newData.total_paid !== oldData.total_paid
          ) {
            console.log('Patient visit payment data changed, syncing billing:', payload);
            
            syncBillingFromVisit({
              visitId: newData.id,
              patientId: newData.patient_id,
              totalAmount: newData.total_amount,
              paymentStatus: newData.payment_status,
              totalPaid: newData.total_paid || 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isEnabled, syncBillingFromVisit]);

  return {
    isEnabled,
    setIsEnabled,
    syncBillingFromVisit
  };
}