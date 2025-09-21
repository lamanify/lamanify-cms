import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingItem {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  staff_name?: string;
  staff_ic_passport?: string;
  relationship_to_patient?: string;
  patient_id: string;
  created_at: string;
}

export function useBillingManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateBillingItem = useCallback(async (billingItem: BillingItem): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('billing')
        .update({
          description: billingItem.description,
          amount: billingItem.amount,
          staff_name: billingItem.staff_name || null,
          staff_ic_passport: billingItem.staff_ic_passport || null,
          relationship_to_patient: billingItem.relationship_to_patient || 'self',
          updated_at: new Date().toISOString(),
        })
        .eq('id', billingItem.id);

      if (error) {
        console.error('Error updating billing item:', error);
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Billing item updated successfully.",
      });
    } catch (error) {
      console.error('Error updating billing item:', error);
      toast({
        title: "Error",
        description: "Failed to update billing item. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchBillingItemsByClaimId = useCallback(async (claimId: string): Promise<BillingItem[]> => {
    setIsLoading(true);
    try {
      // First get the claim items
      const { data: claimItems, error: claimItemsError } = await supabase
        .from('panel_claim_items')
        .select('billing_id')
        .eq('claim_id', claimId);

      if (claimItemsError) {
        console.error('Error fetching claim items:', claimItemsError);
        throw new Error(claimItemsError.message);
      }

      if (!claimItems || claimItems.length === 0) {
        return [];
      }

      const billingIds = claimItems.map(item => item.billing_id);

      // Then get the detailed billing information
      const { data: billingItems, error: billingError } = await supabase
        .from('billing')
        .select('*')
        .in('id', billingIds);

      if (billingError) {
        console.error('Error fetching billing items:', billingError);
        throw new Error(billingError.message);
      }

      return billingItems || [];
    } catch (error) {
      console.error('Error fetching billing items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing items. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const validateStaffInformation = useCallback((billingItem: Partial<BillingItem>): string[] => {
    const errors: string[] = [];

    if (billingItem.staff_name && billingItem.staff_name.trim().length < 2) {
      errors.push('Staff name must be at least 2 characters long');
    }

    if (billingItem.staff_ic_passport && billingItem.staff_ic_passport.trim().length < 6) {
      errors.push('IC/Passport number must be at least 6 characters long');
    }

    if (billingItem.relationship_to_patient && 
        !['self', 'spouse', 'child', 'parent', 'sibling', 'other'].includes(billingItem.relationship_to_patient)) {
      errors.push('Invalid relationship to patient');
    }

    return errors;
  }, []);

  const bulkUpdateBillingItems = useCallback(async (
    billingItems: BillingItem[]
  ): Promise<void> => {
    setIsLoading(true);
    try {
      // Update items one by one to avoid type issues with bulk upsert
      for (const item of billingItems) {
        await updateBillingItem(item);
      }

      toast({
        title: "Success",
        description: `${billingItems.length} billing items updated successfully.`,
      });
    } catch (error) {
      console.error('Error bulk updating billing items:', error);
      toast({
        title: "Error",
        description: "Failed to update billing items. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, updateBillingItem]);

  return {
    updateBillingItem,
    fetchBillingItemsByClaimId,
    validateStaffInformation,
    bulkUpdateBillingItems,
    isLoading,
  };
}