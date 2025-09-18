import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface PaymentRecord {
  id: string;
  visit_id?: string;
  invoice_id?: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  payment_date: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  status: string;
  metadata?: any;
  // Joined data
  processed_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

export interface PaymentSummary {
  total_amount: number;
  total_paid: number;
  amount_due: number;
  payment_status: string;
}

export function usePayments(visitId?: string) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_amount: 0,
    total_paid: 0,
    amount_due: 0,
    payment_status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch payments for a visit
  const fetchPayments = async (targetVisitId?: string) => {
    if (!targetVisitId && !visitId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          processed_by_profile:processed_by (
            first_name,
            last_name
          )
        `)
        .eq('visit_id', targetVisitId || visitId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment summary for a visit
  const fetchPaymentSummary = async (targetVisitId?: string) => {
    if (!targetVisitId && !visitId) return;
    
    try {
      const { data, error } = await supabase
        .from('patient_visits')
        .select('total_amount, total_paid, payment_status')
        .eq('id', targetVisitId || visitId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSummary({
          total_amount: data.total_amount || 0,
          total_paid: data.total_paid || 0,
          amount_due: (data.total_amount || 0) - (data.total_paid || 0),
          payment_status: data.payment_status || 'pending'
        });
      }
    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
    }
  };

  // Add a new payment
  const addPayment = async (paymentData: {
    visit_id?: string;
    patient_id: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    payment_date: string;
    notes?: string;
  }) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to process payments",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          ...paymentData,
          processed_by: user.id,
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Payment recorded successfully",
        description: `Payment of RM${paymentData.amount.toFixed(2)} has been recorded`,
      });

      // Refresh data
      await Promise.all([
        fetchPayments(paymentData.visit_id),
        fetchPaymentSummary(paymentData.visit_id)
      ]);

      return true;
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Update a payment (admin only)
  const updatePayment = async (paymentId: string, updates: Partial<PaymentRecord>) => {
    try {
      const { error } = await supabase
        .from('payment_records')
        .update(updates)
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment updated successfully",
        description: "The payment record has been updated",
      });

      // Refresh data
      await Promise.all([fetchPayments(), fetchPaymentSummary()]);
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating payment",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a payment (admin only)
  const deletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment deleted successfully",
        description: "The payment record has been removed",
      });

      // Refresh data
      await Promise.all([fetchPayments(), fetchPaymentSummary()]);
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting payment",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Generate receipt data
  const generateReceiptData = (payment: PaymentRecord) => {
    return {
      receiptNumber: `RCP-${payment.created_at.split('T')[0].replace(/-/g, '')}-${payment.id.slice(-6).toUpperCase()}`,
      paymentDate: payment.payment_date,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      referenceNumber: payment.reference_number,
      processedBy: payment.processed_by_profile 
        ? `${payment.processed_by_profile.first_name} ${payment.processed_by_profile.last_name}`
        : 'Unknown',
      notes: payment.notes
    };
  };

  useEffect(() => {
    if (visitId) {
      Promise.all([fetchPayments(), fetchPaymentSummary()]);
    }
  }, [visitId]);

  return {
    payments,
    summary,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    fetchPayments,
    fetchPaymentSummary,
    generateReceiptData,
    refresh: () => Promise.all([fetchPayments(), fetchPaymentSummary()])
  };
}