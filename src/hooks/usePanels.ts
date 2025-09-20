import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Panel {
  id: string;
  panel_name: string;
  panel_code: string;
  person_in_charge_name?: string;
  person_in_charge_phone?: string;
  default_status: 'active' | 'inactive';
  verification_method: 'url' | 'manual';
  verification_url?: string;
  manual_remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  price_tiers?: Array<{
    id: string;
    tier_name: string;
  }>;
}

export interface CreatePanelData {
  panel_name: string;
  panel_code: string;
  person_in_charge_name?: string;
  person_in_charge_phone?: string;
  default_status: 'active' | 'inactive';
  verification_method: 'url' | 'manual';
  verification_url?: string;
  manual_remarks?: string;
  price_tier_ids: string[];
}

export function usePanels() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPanels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('panels')
        .select(`
          *,
          panels_price_tiers (
            price_tiers (
              id,
              tier_name
            )
          )
        `)
        .order('panel_name');

      if (error) throw error;

      const panelsWithTiers = data?.map(panel => ({
        ...panel,
        default_status: panel.default_status as 'active' | 'inactive',
        verification_method: panel.verification_method as 'url' | 'manual',
        price_tiers: panel.panels_price_tiers?.map((ppt: any) => ppt.price_tiers) || []
      })) || [];

      setPanels(panelsWithTiers);
    } catch (error) {
      console.error('Error fetching panels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch panels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPanel = async (panelData: CreatePanelData): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Create the panel
      const { data: panel, error: panelError } = await supabase
        .from('panels')
        .insert({
          ...panelData,
          created_by: currentUser.user?.id,
          price_tier_ids: undefined // Remove this field as it's not part of the table
        })
        .select()
        .single();

      if (panelError) throw panelError;

      // Create panel-price tier relationships
      if (panelData.price_tier_ids.length > 0) {
        const tierRelations = panelData.price_tier_ids.map(tierId => ({
          panel_id: panel.id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('panels_price_tiers')
          .insert(tierRelations);

        if (tierError) throw tierError;
      }

      toast({
        title: "Success",
        description: "Panel created successfully",
      });

      await fetchPanels();
      return true;
    } catch (error) {
      console.error('Error creating panel:', error);
      toast({
        title: "Error",
        description: "Failed to create panel",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePanel = async (id: string, panelData: CreatePanelData): Promise<boolean> => {
    try {
      // Update the panel
      const { error: panelError } = await supabase
        .from('panels')
        .update({
          ...panelData,
          price_tier_ids: undefined // Remove this field as it's not part of the table
        })
        .eq('id', id);

      if (panelError) throw panelError;

      // Delete existing tier relationships
      const { error: deleteError } = await supabase
        .from('panels_price_tiers')
        .delete()
        .eq('panel_id', id);

      if (deleteError) throw deleteError;

      // Create new tier relationships
      if (panelData.price_tier_ids.length > 0) {
        const tierRelations = panelData.price_tier_ids.map(tierId => ({
          panel_id: id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('panels_price_tiers')
          .insert(tierRelations);

        if (tierError) throw tierError;
      }

      toast({
        title: "Success",
        description: "Panel updated successfully",
      });

      await fetchPanels();
      return true;
    } catch (error) {
      console.error('Error updating panel:', error);
      toast({
        title: "Error",
        description: "Failed to update panel",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePanel = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('panels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Panel deleted successfully",
      });

      await fetchPanels();
      return true;
    } catch (error) {
      console.error('Error deleting panel:', error);
      toast({
        title: "Error",
        description: "Failed to delete panel",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPanels();
  }, []);

  return {
    panels,
    loading,
    createPanel,
    updatePanel,
    deletePanel,
    refetch: fetchPanels,
  };
}