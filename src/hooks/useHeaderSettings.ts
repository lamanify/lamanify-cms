import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HeaderSettings {
  id: string;
  clinic_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export const useHeaderSettings = () => {
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHeaderSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_header_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching header settings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch header settings",
          variant: "destructive",
        });
        return;
      }

      setHeaderSettings(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHeaderSettings = async (settings: Omit<HeaderSettings, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let data, error;

      if (headerSettings) {
        // Update existing settings
        const result = await supabase
          .from('clinic_header_settings')
          .update(settings)
          .eq('id', headerSettings.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new settings
        const result = await supabase
          .from('clinic_header_settings')
          .insert([settings])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error updating header settings:', error);
        toast({
          title: "Error",
          description: "Failed to update header settings",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Header settings updated successfully",
      });

      setHeaderSettings(data);
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchHeaderSettings();
  }, []);

  return {
    headerSettings,
    loading,
    fetchHeaderSettings,
    updateHeaderSettings,
  };
};