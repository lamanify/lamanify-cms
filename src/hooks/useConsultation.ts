import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConsultationSession {
  id: string;
  patient_id: string;
  doctor_id: string;
  queue_id?: string;
  started_at: string;
  paused_at?: string;
  completed_at?: string;
  total_duration_minutes: number;
  status: 'active' | 'paused' | 'completed';
  urgency_level: 'low' | 'normal' | 'high' | 'emergency';
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender?: string;
    phone?: string;
    allergies?: string;
    medical_history?: string;
    visit_reason?: string;
  };
  consultation_notes?: {
    id: string;
    chief_complaint?: string;
    symptoms?: string;
    diagnosis?: string;
    treatment_plan?: string;
    prescriptions?: string;
    vital_signs?: any;
  }[];
  treatment_items?: TreatmentItem[];
}

export interface TreatmentItem {
  id: string;
  consultation_session_id: string;
  item_type: 'medication' | 'service';
  medication_id?: string;
  service_id?: string;
  quantity: number;
  dosage_instructions?: string;
  rate: number;
  total_amount: number;
  duration_days?: number;
  frequency?: string;
  notes?: string;
  medication?: {
    name: string;
    brand_name?: string;
    category?: string;
    dosage_forms?: string[];
    strength_options?: string[];
  };
  service?: {
    name: string;
    category: string;
    description?: string;
    duration_minutes?: number;
  };
}

export interface Medication {
  id: string;
  name: string;
  brand_name?: string;
  generic_name?: string;
  category?: string;
  dosage_forms?: string[];
  strength_options?: string[];
  interactions?: string[];
  contraindications?: string[];
  side_effects?: string[];
  price_per_unit?: number;
}

export interface MedicalService {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration_minutes?: number;
  price: number;
  requires_equipment?: boolean;
  preparation_notes?: string;
}

export interface WaitingPatient {
  id: string;
  queue_number: string;
  patient_id: string;
  status: string;
  checked_in_at: string;
  urgency_level?: string;
  patient: {
    first_name: string;
    last_name: string;
    visit_reason?: string;
    allergies?: string;
  };
}

export function useConsultation() {
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [services, setServices] = useState<MedicalService[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch waiting patients from queue
  const fetchWaitingPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patient_queue')
        .select(`
          *,
          patient:patients(
            first_name,
            last_name,
            visit_reason,
            allergies
          )
        `)
        .eq('status', 'waiting')
        .eq('queue_date', new Date().toISOString().split('T')[0])
        .order('queue_number');

      if (error) throw error;
      setWaitingPatients((data as any) || []);
    } catch (error) {
      console.error('Error fetching waiting patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch waiting patients",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Start a new consultation session
  const startConsultation = async (patientId: string, queueId?: string, urgencyLevel: string = 'normal') => {
    try {
      setLoading(true);
      
      // Create consultation session
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: patientId,
          doctor_id: (await supabase.auth.getUser()).data.user?.id,
          queue_id: queueId,
          urgency_level: urgencyLevel as any,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update queue status if queue_id provided
      if (queueId) {
        await supabase
          .from('patient_queue')
          .update({
            status: 'in_consultation',
            consultation_started_at: new Date().toISOString()
          })
          .eq('id', queueId);
      }

      await fetchConsultationDetails(sessionData.id);
      
      toast({
        title: "Consultation started",
        description: "Patient consultation session has been initiated",
      });

      return sessionData;
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch consultation session details
  const fetchConsultationDetails = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          patient:patients(*),
          consultation_notes(*),
          treatment_items(
            *,
            medication:medications(*),
            service:medical_services(*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setActiveSession(data as any);
      return data as any;
    } catch (error) {
      console.error('Error fetching consultation details:', error);
      throw error;
    }
  };

  // Pause consultation
  const pauseConsultation = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      await fetchConsultationDetails(sessionId);
      toast({
        title: "Consultation paused",
        description: "Consultation has been temporarily paused",
      });
    } catch (error) {
      console.error('Error pausing consultation:', error);
      toast({
        title: "Error",
        description: "Failed to pause consultation",
        variant: "destructive",
      });
    }
  };

  // Resume consultation
  const resumeConsultation = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'active',
          paused_at: null
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      await fetchConsultationDetails(sessionId);
      toast({
        title: "Consultation resumed",
        description: "Consultation has been resumed",
      });
    } catch (error) {
      console.error('Error resuming consultation:', error);
      toast({
        title: "Error",
        description: "Failed to resume consultation",
        variant: "destructive",
      });
    }
  };

  // Complete consultation
  const completeConsultation = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const session = activeSession;
      if (!session) throw new Error('No active session');

      // Calculate total duration
      const startTime = new Date(session.started_at);
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Update consultation session
      const { error: sessionError } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          total_duration_minutes: durationMinutes
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Update queue status if connected to queue
      if (session.queue_id) {
        await supabase
          .from('patient_queue')
          .update({
            status: 'completed',
            consultation_completed_at: endTime.toISOString()
          })
          .eq('id', session.queue_id);
      }

      setActiveSession(null);
      await fetchWaitingPatients();
      
      toast({
        title: "Consultation completed",
        description: "Patient has been moved to dispensary",
      });
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: "Error",
        description: "Failed to complete consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add treatment item
  const addTreatmentItem = async (sessionId: string, item: Partial<TreatmentItem>) => {
    try {
      const treatmentData = {
        consultation_session_id: sessionId,
        item_type: item.item_type || 'medication',
        medication_id: item.medication_id,
        service_id: item.service_id,
        quantity: item.quantity || 1,
        dosage_instructions: item.dosage_instructions,
        rate: item.rate || 0,
        total_amount: (item.rate || 0) * (item.quantity || 1),
        duration_days: item.duration_days,
        frequency: item.frequency,
        notes: item.notes
      };

      const { data, error } = await supabase
        .from('treatment_items')
        .insert(treatmentData)
        .select(`
          *,
          medication:medications(*),
          service:medical_services(*)
        `)
        .single();

      if (error) throw error;
      
      // Refresh session data
      await fetchConsultationDetails(sessionId);
      
      toast({
        title: "Treatment item added",
        description: "Item added to treatment plan",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding treatment item:', error);
      toast({
        title: "Error",
        description: "Failed to add treatment item",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch medications
  const fetchMedications = async (search?: string) => {
    try {
      let query = supabase.from('medications').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query.order('name').limit(50);
      
      if (error) throw error;
      setMedications(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching medications:', error);
      return [];
    }
  };

  // Fetch medical services
  const fetchServices = async (search?: string) => {
    try {
      let query = supabase.from('medical_services').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query.order('name').limit(50);
      
      if (error) throw error;
      setServices(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  };

  // Calculate total cost of treatment
  const calculateTotalCost = () => {
    if (!activeSession?.treatment_items) return 0;
    return activeSession.treatment_items.reduce((total, item) => total + item.total_amount, 0);
  };

  useEffect(() => {
    fetchWaitingPatients();
    fetchMedications();
    fetchServices();
  }, [fetchWaitingPatients]);

  return {
    sessions,
    activeSession,
    waitingPatients,
    medications,
    services,
    loading,
    startConsultation,
    fetchConsultationDetails,
    pauseConsultation,
    resumeConsultation,
    completeConsultation,
    addTreatmentItem,
    fetchMedications,
    fetchServices,
    fetchWaitingPatients,
    calculateTotalCost,
    setActiveSession
  };
}