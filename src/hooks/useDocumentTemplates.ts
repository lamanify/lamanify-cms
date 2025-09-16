import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentTemplate {
  id: string;
  template_name: string;
  template_type: string;
  description?: string;
  content: string;
  price_from?: number;
  price_to?: number;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useDocumentTemplates = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch document templates",
          variant: "destructive",
        });
        return;
      }

      setTemplates(data || []);
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

  const createTemplate = async (templateData: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('document_templates')
        .insert([{
          ...templateData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Template created successfully",
      });

      await fetchTemplates();
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

  const updateTemplate = async (id: string, templateData: Partial<DocumentTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Template updated successfully",
      });

      await fetchTemplates();
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

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleTemplateStatus = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    return await updateTemplate(id, { status: newStatus });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
  };
};