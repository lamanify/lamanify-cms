import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_template: string;
  content_template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientVariables {
  name: string;
  first_name: string;
  phone: string;
  email?: string;
  date?: string;
  time?: string;
  clinic_name?: string;
  report_type?: string;
  service_name?: string;
  custom_message?: string;
}

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWhatsAppTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('template_type', 'whatsapp_patient')
        .eq('is_active', true)
        .order('template_name');

      if (error) {
        console.error('Error fetching WhatsApp templates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch WhatsApp templates",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedTemplates = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? 
          template.variables.filter((v): v is string => typeof v === 'string') : 
          []
      }));
      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch WhatsApp templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processTemplate = (template: WhatsAppTemplate, variables: PatientVariables): string => {
    let processedMessage = template.content_template;
    
    // Replace all variables in the template
    const replacements: Record<string, string> = {
      '{{name}}': variables.name || variables.first_name || '',
      '{{first_name}}': variables.first_name || '',
      '{{phone}}': variables.phone || '',
      '{{email}}': variables.email || '',
      '{{date}}': variables.date || new Date().toLocaleDateString(),
      '{{time}}': variables.time || '',
      '{{clinic_name}}': variables.clinic_name || 'Our Clinic',
      '{{report_type}}': variables.report_type || 'medical',
      '{{service_name}}': variables.service_name || '',
      '{{custom_message}}': variables.custom_message || ''
    };

    // Replace each placeholder with its corresponding value
    Object.entries(replacements).forEach(([placeholder, value]) => {
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
    });

    return processedMessage;
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 60 (Malaysia country code)
    if (cleanPhone.startsWith('0')) {
      return '6' + cleanPhone;
    }
    
    // If it doesn't start with 60, add it
    if (!cleanPhone.startsWith('60')) {
      return '60' + cleanPhone;
    }
    
    return cleanPhone;
  };

  const generateWhatsAppLink = (phone: string, message: string): string => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedMessage}`;
  };

  useEffect(() => {
    fetchWhatsAppTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchWhatsAppTemplates,
    processTemplate,
    formatPhoneForWhatsApp,
    generateWhatsAppLink
  };
}