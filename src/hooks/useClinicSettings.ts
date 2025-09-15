import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClinicSetting {
  id: string;
  setting_category: string;
  setting_key: string;
  setting_value: string | null;
  data_type: string;
  description: string | null;
  is_required: boolean;
  updated_at: string;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export function useClinicSettings() {
  const [settings, setSettings] = useState<ClinicSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .order('setting_category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (error) throw error;
      setSettings(data?.map(setting => ({
        ...setting,
        setting_value: setting.setting_value
      })) || []);
    } catch (error) {
      console.error('Error fetching clinic settings:', error);
      toast({
        title: "Error",
        description: "Failed to load clinic settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback((category: string, key: string): ClinicSetting | null => {
    return settings.find(s => s.setting_category === category && s.setting_key === key) || null;
  }, [settings]);

  const getSettingValue = useCallback((category: string, key: string, defaultValue: any = null): any => {
    const setting = getSetting(category, key);
    if (!setting || setting.setting_value === null) return defaultValue;

    switch (setting.data_type) {
      case 'boolean':
        return setting.setting_value === 'true';
      case 'number':
        return parseFloat(setting.setting_value) || 0;
      case 'json':
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return defaultValue;
        }
      default:
        return setting.setting_value;
    }
  }, [getSetting]);

  const updateSetting = useCallback(async (category: string, key: string, value: any) => {
    try {
      let settingValue: string;
      
      // Convert value to string based on data type
      if (typeof value === 'boolean') {
        settingValue = value.toString();
      } else if (typeof value === 'object' && value !== null) {
        settingValue = JSON.stringify(value);
      } else {
        settingValue = value?.toString() || '';
      }

      const { error } = await supabase
        .from('clinic_settings')
        .update({ 
          setting_value: settingValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .match({ setting_category: category, setting_key: key });

      if (error) throw error;

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.setting_category === category && setting.setting_key === key
          ? { ...setting, setting_value: settingValue, updated_at: new Date().toISOString() }
          : setting
      ));

      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const updateMultipleSettings = useCallback(async (updates: Array<{ category: string; key: string; value: any }>) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // Batch update all settings
      const promises = updates.map(({ category, key, value }) => {
        let settingValue: string;
        
        if (typeof value === 'boolean') {
          settingValue = value.toString();
        } else if (typeof value === 'object' && value !== null) {
          settingValue = JSON.stringify(value);
        } else {
          settingValue = value?.toString() || '';
        }

        return supabase
          .from('clinic_settings')
          .update({ 
            setting_value: settingValue,
            updated_by: user?.id
          })
          .match({ setting_category: category, setting_key: key });
      });

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Some settings failed to update');
      }

      // Update local state
      setSettings(prev => prev.map(setting => {
        const update = updates.find(u => u.category === setting.setting_category && u.key === setting.setting_key);
        if (update) {
          let settingValue: string;
          if (typeof update.value === 'boolean') {
            settingValue = update.value.toString();
          } else if (typeof update.value === 'object' && update.value !== null) {
            settingValue = JSON.stringify(update.value);
          } else {
            settingValue = update.value?.toString() || '';
          }
          
          return { ...setting, setting_value: settingValue, updated_at: new Date().toISOString() };
        }
        return setting;
      }));

      toast({
        title: "Settings Updated",
        description: "All changes have been saved successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      toast({
        title: "Error",
        description: "Failed to update some settings",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const getSettingsByCategory = useCallback((category: string): ClinicSetting[] => {
    return settings.filter(s => s.setting_category === category);
  }, [settings]);

  return {
    settings,
    loading,
    getSetting,
    getSettingValue,
    updateSetting,
    updateMultipleSettings,
    getSettingsByCategory,
    refetch: fetchSettings
  };
}