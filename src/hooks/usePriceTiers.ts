import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceTier {
  id: string;
  tier_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  payment_methods?: string[];
}

export interface TierPaymentMethod {
  id: string;
  tier_id: string;
  payment_method_type: string;
  payment_method_value: string;
  created_at: string;
}

export function usePriceTiers() {
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPriceTiers = async () => {
    try {
      setLoading(true);
      const { data: tiers, error: tiersError } = await supabase
        .from('price_tiers')
        .select('*')
        .order('created_at', { ascending: false });

      if (tiersError) throw tiersError;

      // For now, set payment_methods as empty array since we're not using the junction table yet
      const tiersWithMethods = (tiers || []).map(tier => ({
        ...tier,
        payment_methods: [] as string[]
      }));

      setPriceTiers(tiersWithMethods);
    } catch (error) {
      console.error('Error fetching price tiers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch price tiers"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPriceTier = async (tierData: {
    tier_name: string;
    description?: string;
    payment_methods: string[];
  }) => {
    try {
      // For now, we'll use a simplified approach with the existing structure
      // Create the tier with a default payment method (using the first method or 'general')
      const defaultPaymentMethod = tierData.payment_methods.length > 0 ? tierData.payment_methods[0] : 'Self-Pay';
      
      const { data: tier, error: tierError } = await supabase
        .from('price_tiers')
        .insert([{
          tier_name: tierData.tier_name,
          description: tierData.description,
          payment_method: defaultPaymentMethod as 'Self-Pay' | 'Insurance' | 'Corporate' | 'Government Panel',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (tierError) throw tierError;
      
      // Refresh the list
      await fetchPriceTiers();
      
      toast({
        title: "Success",
        description: "Price tier created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating price tier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create price tier"
      });
      return false;
    }
  };

  const updatePriceTier = async (id: string, tierData: {
    tier_name?: string;
    description?: string;
    payment_methods?: string[];
  }) => {
    try {
      // Update the tier
      const { error: tierError } = await supabase
        .from('price_tiers')
        .update({
          tier_name: tierData.tier_name,
          description: tierData.description
        })
        .eq('id', id);

      if (tierError) throw tierError;
      
      // Refresh the list
      await fetchPriceTiers();
      
      toast({
        title: "Success",
        description: "Price tier updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating price tier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update price tier"
      });
      return false;
    }
  };

  const deletePriceTier = async (id: string) => {
    try {
      // Delete the tier
      const { error: tierError } = await supabase
        .from('price_tiers')
        .delete()
        .eq('id', id);

      if (tierError) throw tierError;
      
      setPriceTiers(prev => prev.filter(tier => tier.id !== id));
      toast({
        title: "Success",
        description: "Price tier deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting price tier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete price tier"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPriceTiers();
  }, []);

  return {
    priceTiers,
    loading,
    createPriceTier,
    updatePriceTier,
    deletePriceTier,
    refetch: fetchPriceTiers
  };
}