import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceTier {
  id: string;
  tier_name: string;
  description?: string;
  payment_method: 'Self-Pay' | 'Insurance' | 'Corporate' | 'Government Panel';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function usePriceTiers() {
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPriceTiers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_tiers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPriceTiers(data || []);
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
    payment_method: 'Self-Pay' | 'Insurance' | 'Corporate' | 'Government Panel';
  }) => {
    try {
      const { data, error } = await supabase
        .from('price_tiers')
        .insert([{
          ...tierData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPriceTiers(prev => [data, ...prev]);
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
    payment_method?: 'Self-Pay' | 'Insurance' | 'Corporate' | 'Government Panel';
  }) => {
    try {
      const { data, error } = await supabase
        .from('price_tiers')
        .update(tierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPriceTiers(prev => prev.map(tier => tier.id === id ? data : tier));
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
      const { error } = await supabase
        .from('price_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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