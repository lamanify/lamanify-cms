import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PatientReliability {
  id: string;
  patient_id: string;
  total_appointments: number;
  completed_appointments: number;
  no_shows: number;
  late_cancellations: number;
  on_time_arrivals: number;
  reliability_score: number;
  risk_level: 'low' | 'medium' | 'high';
  last_no_show_date?: string;
  restriction_active: boolean;
  restriction_end_date?: string;
  created_at: string;
  updated_at: string;
}

export const usePatientReliability = () => {
  const [reliabilityScores, setReliabilityScores] = useState<PatientReliability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReliabilityScores = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_reliability_scores')
        .select(`
          *,
          patients!inner(first_name, last_name, phone, email)
        `)
        .order('reliability_score', { ascending: true });

      if (error) throw error;
      setReliabilityScores((data || []) as PatientReliability[]);
    } catch (error) {
      console.error('Error fetching reliability scores:', error);
      toast({
        title: "Error",
        description: "Failed to load patient reliability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPatientReliability = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_reliability_scores')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient reliability:', error);
      return null;
    }
  };

  const updateReliability = async (patientId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_patient_reliability', {
        p_patient_id: patientId
      });

      if (error) throw error;
      
      // Refresh the data
      await fetchReliabilityScores();
      
      toast({
        title: "Success",
        description: "Patient reliability updated successfully",
      });
    } catch (error) {
      console.error('Error updating patient reliability:', error);
      toast({
        title: "Error",
        description: "Failed to update patient reliability",
        variant: "destructive",
      });
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      default:
        return 'Low Risk';
    }
  };

  useEffect(() => {
    fetchReliabilityScores();
  }, []);

  return {
    reliabilityScores,
    loading,
    getPatientReliability,
    updateReliability,
    getRiskLevelColor,
    getRiskLevelText,
    refetch: fetchReliabilityScores
  };
};