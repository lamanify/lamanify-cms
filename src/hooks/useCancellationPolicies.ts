import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CancellationPolicy {
  id: string;
  policy_name: string;
  cancellation_window_hours: number;
  late_cancellation_fee: number;
  no_show_fee: number;
  max_no_shows_before_restriction: number;
  restriction_duration_days: number;
  auto_restriction_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useCancellationPolicies = () => {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching cancellation policies:', error);
      toast({
        title: "Error",
        description: "Failed to load cancellation policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: Omit<CancellationPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .insert([policyData])
        .select()
        .single();

      if (error) throw error;
      
      setPolicies(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Cancellation policy created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating cancellation policy:', error);
      toast({
        title: "Error",
        description: "Failed to create cancellation policy",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePolicy = async (id: string, updates: Partial<CancellationPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPolicies(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Success",
        description: "Cancellation policy updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating cancellation policy:', error);
      toast({
        title: "Error",
        description: "Failed to update cancellation policy",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cancellation_policies')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setPolicies(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Cancellation policy deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting cancellation policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete cancellation policy",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return {
    policies,
    loading,
    createPolicy,
    updatePolicy,
    deletePolicy,
    refetch: fetchPolicies
  };
};