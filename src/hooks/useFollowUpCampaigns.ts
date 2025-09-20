import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FollowUpCampaign {
  id: string;
  campaign_name: string;
  trigger_condition: 'appointment_completed' | 'diagnosis_specific' | 'service_specific';
  trigger_criteria?: any;
  follow_up_days: number;
  follow_up_type: 'appointment' | 'reminder' | 'both';
  message_template?: string;
  appointment_reason?: string;
  appointment_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useFollowUpCampaigns = () => {
  const [campaigns, setCampaigns] = useState<FollowUpCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_up_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as FollowUpCampaign[]);
    } catch (error) {
      console.error('Error fetching follow-up campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load follow-up campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Omit<FollowUpCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('follow_up_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      
      setCampaigns(prev => [data as FollowUpCampaign, ...prev]);
      toast({
        title: "Success",
        description: "Follow-up campaign created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating follow-up campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create follow-up campaign",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<FollowUpCampaign>) => {
    try {
      const { data, error } = await supabase
        .from('follow_up_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCampaigns(prev => prev.map(c => c.id === id ? data as FollowUpCampaign : c));
      toast({
        title: "Success",
        description: "Follow-up campaign updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating follow-up campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update follow-up campaign",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Follow-up campaign deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting follow-up campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete follow-up campaign",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};