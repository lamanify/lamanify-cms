import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface PreConsultationForm {
  id: string;
  form_name: string;
  form_description?: string;
  form_fields: FormField[];
  appointment_types?: string[];
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FormSubmission {
  id: string;
  appointment_id: string;
  patient_id: string;
  form_id: string;
  form_data: any;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const usePreConsultationForms = () => {
  const [forms, setForms] = useState<PreConsultationForm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('pre_consultation_forms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms((data || []).map(form => ({
        ...form,
        form_fields: form.form_fields as unknown as FormField[]
      })) as PreConsultationForm[]);
    } catch (error) {
      console.error('Error fetching pre-consultation forms:', error);
      toast({
        title: "Error",
        description: "Failed to load pre-consultation forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (formData: Omit<PreConsultationForm, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pre_consultation_forms')
        .insert([{
          ...formData,
          form_fields: formData.form_fields as any
        }])
        .select()
        .single();

      if (error) throw error;
      
      setForms(prev => [{
        ...data,
        form_fields: data.form_fields as unknown as FormField[]
      } as PreConsultationForm, ...prev]);
      toast({
        title: "Success",
        description: "Pre-consultation form created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating pre-consultation form:', error);
      toast({
        title: "Error",
        description: "Failed to create pre-consultation form",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateForm = async (id: string, updates: Partial<PreConsultationForm>) => {
    try {
      const { data, error } = await supabase
        .from('pre_consultation_forms')
        .update({
          ...updates,
          form_fields: updates.form_fields as any
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setForms(prev => prev.map(f => f.id === id ? {
        ...data,
        form_fields: data.form_fields as unknown as FormField[]
      } as PreConsultationForm : f));
      toast({
        title: "Success",
        description: "Pre-consultation form updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating pre-consultation form:', error);
      toast({
        title: "Error",
        description: "Failed to update pre-consultation form",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pre_consultation_forms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setForms(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Pre-consultation form deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting pre-consultation form:', error);
      toast({
        title: "Error",
        description: "Failed to delete pre-consultation form",
        variant: "destructive",
      });
    }
  };

  const submitForm = async (appointmentId: string, patientId: string, formId: string, formData: any) => {
    try {
      const { data, error } = await supabase
        .from('patient_form_submissions')
        .insert([{
          appointment_id: appointmentId,
          patient_id: patientId,
          form_id: formId,
          form_data: formData,
          ip_address: null,
          user_agent: navigator.userAgent
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
      return null;
    }
  };

  const getFormSubmissions = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_form_submissions')
        .select(`
          *,
          patients!inner(first_name, last_name),
          appointments!inner(appointment_date, appointment_time)
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return {
    forms,
    loading,
    createForm,
    updateForm,
    deleteForm,
    submitForm,
    getFormSubmissions,
    refetch: fetchForms
  };
};