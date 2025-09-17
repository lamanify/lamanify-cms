import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DosageTemplate {
  id: string;
  medication_id: string;
  dosage_amount?: number;
  dosage_unit?: string;
  instruction?: string;
  precaution?: string;
  frequency?: string;
  duration_value?: number;
  duration_unit?: string;
  indication?: string;
  dispense_quantity?: number;
  created_at: string;
  updated_at: string;
}

export function useDosageTemplates() {
  const [templates, setTemplates] = useState<DosageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medication_dosage_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching dosage templates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dosage templates"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemplateForMedication = (medicationId: string): DosageTemplate | undefined => {
    return templates.find(template => template.medication_id === medicationId);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    getTemplateForMedication,
    refetch: fetchTemplates
  };
}