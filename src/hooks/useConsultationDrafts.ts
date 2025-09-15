import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ConsultationDraft {
  id: string;
  patient_id: string;
  draft_data: ConsultationFormData;
  created_at: string;
  updated_at: string;
  staff_member_id: string;
}

export interface ConsultationFormData {
  consultationNotes: string;
  diagnosis: string;
  treatmentItems: Array<{
    id: string;
    item: string;
    quantity: number;
    priceTier: string;
    rate: number;
    amount: number;
    dosage: string;
    instruction: string;
    frequency: string;
    duration: string;
  }>;
}

export const useConsultationDrafts = () => {
  const [drafts, setDrafts] = useState<ConsultationDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const { toast } = useToast();

  // Fetch user drafts
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const localDrafts = localStorage.getItem('consultation_drafts');
      if (localDrafts) {
        const parsedDrafts = JSON.parse(localDrafts);
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Error fetching consultation drafts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch consultation drafts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save draft with debouncing
  const saveDraft = useCallback(async (formData: ConsultationFormData, patientId: string, draftId?: string) => {
    try {
      setAutoSaveStatus('Saving...');
      
      // Check if form has any data
      const hasData = formData.consultationNotes.trim() !== '' || 
                     formData.diagnosis.trim() !== '' || 
                     formData.treatmentItems.length > 0;
      
      if (!hasData) {
        setAutoSaveStatus('');
        return;
      }

      const now = new Date().toISOString();
      const draft: ConsultationDraft = {
        id: draftId || crypto.randomUUID(),
        patient_id: patientId,
        draft_data: formData,
        created_at: now,
        updated_at: now,
        staff_member_id: 'current_user', // TODO: Get from auth
      };

      const existingDrafts = JSON.parse(localStorage.getItem('consultation_drafts') || '[]');
      const updatedDrafts = draftId 
        ? existingDrafts.map((d: ConsultationDraft) => d.id === draftId ? draft : d)
        : [...existingDrafts, draft];
      
      localStorage.setItem('consultation_drafts', JSON.stringify(updatedDrafts));

      setAutoSaveStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
      await fetchDrafts();
      
      return draft.id;
    } catch (error) {
      console.error('Error saving consultation draft:', error);
      setAutoSaveStatus('Failed to save');
      toast({
        title: "Warning",
        description: "Could not save consultation draft automatically",
        variant: "destructive",
      });
    }
  }, [fetchDrafts, toast]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      const existingDrafts = JSON.parse(localStorage.getItem('consultation_drafts') || '[]');
      const updatedDrafts = existingDrafts.filter((d: ConsultationDraft) => d.id !== draftId);
      localStorage.setItem('consultation_drafts', JSON.stringify(updatedDrafts));

      await fetchDrafts();
      toast({
        title: "Success",
        description: "Consultation draft deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting consultation draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete consultation draft",
        variant: "destructive",
      });
    }
  }, [fetchDrafts, toast]);

  // Get draft for specific patient
  const getDraftForPatient = useCallback((patientId: string) => {
    return drafts.find(draft => draft.patient_id === patientId);
  }, [drafts]);

  // Auto-cleanup old drafts (7+ days)
  const cleanupOldDrafts = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const existingDrafts = JSON.parse(localStorage.getItem('consultation_drafts') || '[]');
      const recentDrafts = existingDrafts.filter((d: ConsultationDraft) => 
        new Date(d.created_at) > sevenDaysAgo
      );
      localStorage.setItem('consultation_drafts', JSON.stringify(recentDrafts));
      
      await fetchDrafts();
    } catch (error) {
      console.error('Error cleaning up old consultation drafts:', error);
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
    getDraftForPatient,
    cleanupOldDrafts,
  };
};