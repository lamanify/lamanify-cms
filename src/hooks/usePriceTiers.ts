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
  panel_ids?: string[];
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
        .select(`
          *,
          panels_price_tiers (
            panel_id
          )
        `)
        .order('created_at', { ascending: false });

      if (tiersError) throw tiersError;

      // Extract payment methods from description field and get panel associations
      const tiersWithMethods = (tiers || []).map(tier => {
        let paymentMethods: string[] = [];
        let cleanDescription = tier.description || '';
        
        // Extract payment methods from description if it exists
        if (tier.description) {
          const paymentMethodsMatch = tier.description.match(/Payment Methods: ([^\n]+)/);
          if (paymentMethodsMatch) {
            paymentMethods = paymentMethodsMatch[1].split(', ').map(method => method.trim());
            // Remove the payment methods line from description
            cleanDescription = tier.description.replace(/Payment Methods: [^\n]+\n?/g, '').trim();
          }
        }

        // Get associated panel IDs
        const panelIds = tier.panels_price_tiers?.map((ppt: any) => ppt.panel_id) || [];

        return {
          ...tier,
          description: cleanDescription,
          payment_methods: paymentMethods,
          panel_ids: panelIds
        };
      });

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
    panel_ids: string[];
  }) => {
    try {
      // Store payment methods in the description for now, until we implement the new structure
      const paymentMethodsDescription = tierData.payment_methods.length > 0 
        ? `Payment Methods: ${tierData.payment_methods.join(', ')}`
        : '';
      
      const finalDescription = tierData.description 
        ? `${tierData.description}\n${paymentMethodsDescription}`
        : paymentMethodsDescription;

      const { data: tier, error: tierError } = await supabase
        .from('price_tiers')
        .insert([{
          tier_name: tierData.tier_name,
          description: finalDescription,
          tier_type: 'general',
          created_by: (await supabase.auth.getUser()).data.user?.id,
          is_default_for_panel: false,
          requires_verification: tierData.payment_methods.includes('panel'),
          coverage_rules: {},
          eligibility_rules: {}
        }])
        .select()
        .single();

      if (tierError) throw tierError;

      // Create panel associations
      if (tierData.panel_ids.length > 0) {
        const panelRelations = tierData.panel_ids.map(panelId => ({
          panel_id: panelId,
          tier_id: tier.id
        }));

        const { error: panelError } = await supabase
          .from('panels_price_tiers')
          .insert(panelRelations);

        if (panelError) throw panelError;
      }
      
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
    panel_ids?: string[];
  }) => {
    try {
      // Handle payment methods in description
      let finalDescription = tierData.description || '';
      
      if (tierData.payment_methods && tierData.payment_methods.length > 0) {
        const paymentMethodsDescription = `Payment Methods: ${tierData.payment_methods.join(', ')}`;
        finalDescription = tierData.description 
          ? `${tierData.description}\n${paymentMethodsDescription}`
          : paymentMethodsDescription;
      }

      // Update the tier
      const { error: tierError } = await supabase
        .from('price_tiers')
        .update({
          tier_name: tierData.tier_name,
          description: finalDescription,
          requires_verification: tierData.payment_methods?.includes('panel') || false
        })
        .eq('id', id);

      if (tierError) throw tierError;

      // Update panel associations if provided
      if (tierData.panel_ids !== undefined) {
        // Delete existing panel associations
        const { error: deleteError } = await supabase
          .from('panels_price_tiers')
          .delete()
          .eq('tier_id', id);

        if (deleteError) throw deleteError;

        // Create new panel associations
        if (tierData.panel_ids.length > 0) {
          const panelRelations = tierData.panel_ids.map(panelId => ({
            panel_id: panelId,
            tier_id: id
          }));

          const { error: panelError } = await supabase
            .from('panels_price_tiers')
            .insert(panelRelations);

          if (panelError) throw panelError;
        }
      }
      
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