import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatientDraft {
  id: string;
  draft_data: any;
  created_at: string;
  updated_at: string;
  staff_member_id: string;
}

export interface PatientFormData {
  image?: string;
  name: string;
  idType: 'NRIC/MyKad' | 'Birth Certificate' | 'Passport' | 'Other';
  nric_passport: string;
  countryOfIssue?: string;
  otherIdDescription?: string;
  parentGuardianName?: string;
  parentGuardianNric?: string;
  phone: string;
  countryCode: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  assignedDoctorId?: string;
  visitNotes: string;
  isUrgent: boolean;
  paymentMethod: string;
  paymentMethodNotes: string;
}

export const usePatientDrafts = () => {
  const [drafts, setDrafts] = useState<PatientDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const { toast } = useToast();

  // Fetch user drafts
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      // For now, use localStorage as fallback until database table is created
      const localDrafts = localStorage.getItem('patient_drafts');
      if (localDrafts) {
        const parsedDrafts = JSON.parse(localDrafts);
        setDrafts(parsedDrafts);
      }
      
      // TODO: Replace with Supabase query once table is created
      // const { data, error } = await supabase
      //   .from('patient_drafts')
      //   .select('*')
      //   .order('updated_at', { ascending: false });
      // 
      // if (error) throw error;
      // setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drafts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save draft with debouncing
  const saveDraft = useCallback(async (formData: PatientFormData, draftId?: string) => {
    try {
      setAutoSaveStatus('Saving...');
      
      // Check if form has any data
      const hasData = Object.values(formData).some(value => 
        value && value.toString().trim() !== ''
      );
      
      if (!hasData) {
        setAutoSaveStatus('');
        return;
      }

      const now = new Date().toISOString();
      const draft: PatientDraft = {
        id: draftId || crypto.randomUUID(),
        draft_data: formData,
        created_at: now,
        updated_at: now,
        staff_member_id: 'current_user', // TODO: Get from auth
      };

      // For now, save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('patient_drafts') || '[]');
      const updatedDrafts = draftId 
        ? existingDrafts.map((d: PatientDraft) => d.id === draftId ? draft : d)
        : [...existingDrafts, draft];
      
      localStorage.setItem('patient_drafts', JSON.stringify(updatedDrafts));
      
      // TODO: Replace with Supabase mutation once table is created
      // if (draftId) {
      //   const { error } = await supabase
      //     .from('patient_drafts')
      //     .update({ draft_data: formData, updated_at: now })
      //     .eq('id', draftId);
      //   if (error) throw error;
      // } else {
      //   const { error } = await supabase
      //     .from('patient_drafts')
      //     .insert({ draft_data: formData });
      //   if (error) throw error;
      // }

      setAutoSaveStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
      await fetchDrafts();
      
      return draft.id;
    } catch (error) {
      console.error('Error saving draft:', error);
      setAutoSaveStatus('Failed to save');
      toast({
        title: "Warning",
        description: "Could not save draft automatically",
        variant: "destructive",
      });
    }
  }, [fetchDrafts, toast]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      // For now, delete from localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('patient_drafts') || '[]');
      const updatedDrafts = existingDrafts.filter((d: PatientDraft) => d.id !== draftId);
      localStorage.setItem('patient_drafts', JSON.stringify(updatedDrafts));

      // TODO: Replace with Supabase delete once table is created
      // const { error } = await supabase
      //   .from('patient_drafts')
      //   .delete()
      //   .eq('id', draftId);
      // if (error) throw error;

      await fetchDrafts();
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  }, [fetchDrafts, toast]);

  // Auto-cleanup old drafts (7+ days)
  const cleanupOldDrafts = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // For localStorage implementation
      const existingDrafts = JSON.parse(localStorage.getItem('patient_drafts') || '[]');
      const recentDrafts = existingDrafts.filter((d: PatientDraft) => 
        new Date(d.created_at) > sevenDaysAgo
      );
      localStorage.setItem('patient_drafts', JSON.stringify(recentDrafts));

      // TODO: Replace with Supabase query once table is created
      // const { error } = await supabase
      //   .from('patient_drafts')
      //   .delete()
      //   .lt('created_at', sevenDaysAgo.toISOString());
      // if (error) throw error;
      
      await fetchDrafts();
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
    }
  }, [fetchDrafts]);

  useEffect(() => {
    fetchDrafts();
    cleanupOldDrafts();
  }, [fetchDrafts, cleanupOldDrafts]);

  return {
    drafts,
    loading,
    autoSaveStatus,
    saveDraft,
    deleteDraft,
    fetchDrafts,
    cleanupOldDrafts,
  };
};