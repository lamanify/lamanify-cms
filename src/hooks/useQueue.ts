import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QueueEntry {
  id: string;
  patient_id: string;
  queue_number: string;
  queue_date: string;
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'urgent' | 'dispensary';
  assigned_doctor_id?: string;
  estimated_consultation_duration: number;
  checked_in_at: string;
  consultation_started_at?: string;
  consultation_completed_at?: string;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  payment_method_notes?: string;
  // Joined patient data
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth: string;
    gender?: string;
    allergies?: string;
    email?: string;
    medical_history?: string;
    patient_id?: string;
    visit_reason?: string;
    assigned_tier_id?: string;
  };
  // Joined doctor data
  doctor?: {
    first_name: string;
    last_name: string;
  };
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQueue();
    
    // Set up real-time subscription for patient queue changes
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patient_queue'
        },
        (payload) => {
          console.log('Real-time queue status update received:', payload);
          // Update specific queue entry instead of refetching all
          setQueue(currentQueue => {
            const updatedQueue = currentQueue.map(entry => 
              entry.id === payload.new.id 
                ? { ...entry, ...payload.new, status: payload.new.status as QueueEntry['status'] }
                : entry
            );
            
            // Update current number based on new status
            const inConsultation = updatedQueue.find(entry => entry.status === 'in_consultation');
            const firstWaiting = updatedQueue.find(entry => entry.status === 'waiting');
            
            if (inConsultation) {
              setCurrentNumber(inConsultation.queue_number);
            } else if (firstWaiting) {
              setCurrentNumber(firstWaiting.queue_number);
            } else {
              const lastCompleted = updatedQueue.filter(entry => entry.status === 'completed' || entry.status === 'dispensary').pop();
              setCurrentNumber(lastCompleted?.queue_number || null);
            }
            
            return updatedQueue;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_queue'
        },
        () => {
          // Refetch on new entries
          fetchQueue();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'patient_queue'
        },
        () => {
          // Refetch on deletions
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First get the queue entries
      const { data: queueData, error: queueError } = await supabase
        .from('patient_queue')
        .select('*')
        .eq('queue_date', today)
        .order('queue_number');

      if (queueError) throw queueError;
      
      if (!queueData || queueData.length === 0) {
        setQueue([]);
        return;
      }

      // Get patient IDs for additional data lookup
      const patientIds = queueData.map(entry => entry.patient_id);
      const doctorIds = queueData.map(entry => entry.assigned_doctor_id).filter(Boolean);

      // Fetch patients data
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, date_of_birth, gender, allergies, email, medical_history, patient_id, visit_reason, assigned_tier_id')
        .in('id', patientIds);

      // Fetch doctors data  
      const { data: doctors } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', doctorIds);

      // Fetch payment information from patient activities (registration activities)
      const { data: activities } = await supabase
        .from('patient_activities')
        .select('patient_id, metadata')
        .in('patient_id', patientIds)
        .eq('activity_type', 'registration')
        .order('created_at', { ascending: false });

      // Create enriched queue entries
      const enrichedQueue: QueueEntry[] = queueData.map(entry => {
        const patient = patients?.find(p => p.id === entry.patient_id);
        const doctor = doctors?.find(d => d.id === entry.assigned_doctor_id);
        const activity = activities?.find(a => a.patient_id === entry.patient_id);
        const metadata = activity?.metadata as any;
        
        return {
          ...entry,
          status: entry.status as QueueEntry['status'],
          payment_method: metadata?.payment_method,
          payment_method_notes: metadata?.payment_method_notes,
          patient: patient ? {
            id: patient.id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            phone: patient.phone || undefined,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender || undefined,
            allergies: patient.allergies || undefined,
            email: patient.email || undefined,
            medical_history: patient.medical_history || undefined,
            patient_id: patient.patient_id || undefined,
          } : undefined,
          doctor: doctor ? {
            first_name: doctor.first_name,
            last_name: doctor.last_name,
          } : undefined,
        };
      });
      
      setQueue(enrichedQueue);
      
      // Set current number to the first waiting patient or last in consultation
      const inConsultation = enrichedQueue?.find(entry => entry.status === 'in_consultation');
      const firstWaiting = enrichedQueue?.find(entry => entry.status === 'waiting');
      
      if (inConsultation) {
        setCurrentNumber(inConsultation.queue_number);
      } else if (firstWaiting) {
        setCurrentNumber(firstWaiting.queue_number);
      } else {
        const lastCompleted = enrichedQueue?.filter(entry => entry.status === 'completed' || entry.status === 'dispensary').pop();
        setCurrentNumber(lastCompleted?.queue_number || null);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Error",
        description: "Failed to fetch queue data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = async (patientId: string, doctorId?: string) => {
    try {
      // Generate queue number and create entry
      const { data: queueNumber, error: numberError } = await supabase
        .rpc('generate_queue_number');

      if (numberError) throw numberError;

      const { data, error } = await supabase
        .from('patient_queue')
        .insert({
          patient_id: patientId,
          queue_number: queueNumber,
          assigned_doctor_id: doctorId,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically create queue session record
      const { error: sessionError } = await supabase
        .from('queue_sessions')
        .insert({
          queue_id: data.id,
          patient_id: patientId,
          session_data: {
            queue_number: queueNumber,
            assigned_doctor_id: doctorId,
            registration_timestamp: new Date().toISOString()
          },
          status: 'active'
        });

      if (sessionError) {
        console.error('Error creating queue session:', sessionError);
        // Don't throw error here as the queue entry was successful
        // Just log the session creation error
      }

      toast({
        title: "Added to Queue",
        description: `Patient assigned queue number: ${queueNumber}`,
      });

      return { queueNumber, entry: data };
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast({
        title: "Error",
        description: "Failed to add patient to queue",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateQueueStatus = async (queueId: string, status: QueueEntry['status'], doctorId?: string) => {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString() // Force updated_at to trigger real-time
      };
      
      if (status === 'in_consultation') {
        updates.consultation_started_at = new Date().toISOString();
        if (doctorId) updates.assigned_doctor_id = doctorId;
      } else if (status === 'completed' || status === 'dispensary') {
        updates.consultation_completed_at = new Date().toISOString();
      }

      console.log('Updating queue status:', { queueId, status, updates });

      const { error } = await supabase
        .from('patient_queue')
        .update(updates)
        .eq('id', queueId);

      if (error) throw error;

      console.log('Queue status updated successfully');

      toast({
        title: "Status Updated",
        description: `Patient status changed to ${status.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating queue status:', error);
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const callNextPatient = async () => {
    const nextPatient = queue.find(entry => entry.status === 'waiting');
    if (nextPatient) {
      await updateQueueStatus(nextPatient.id, 'in_consultation');
      return nextPatient;
    }
    return null;
  };

  const getEstimatedWaitTime = (queueNumber: string) => {
    const entry = queue.find(q => q.queue_number === queueNumber);
    if (!entry || entry.status !== 'waiting') return 0;

    const waitingAhead = queue.filter(q => 
      q.status === 'waiting' && 
      parseInt(q.queue_number.substring(1)) < parseInt(queueNumber.substring(1))
    ).length;

    const inConsultation = queue.find(q => q.status === 'in_consultation');
    const avgConsultationTime = queue.find(q => q.id === entry.id)?.estimated_consultation_duration || 30;

    let estimatedWait = waitingAhead * avgConsultationTime;
    
    if (inConsultation) {
      const consultationStarted = new Date(inConsultation.consultation_started_at || inConsultation.checked_in_at);
      const elapsed = (Date.now() - consultationStarted.getTime()) / 1000 / 60; // minutes
      const remaining = Math.max(0, (inConsultation.estimated_consultation_duration || 30) - elapsed);
      estimatedWait += remaining;
    }

    return Math.round(estimatedWait);
  };

  const getTodayStats = () => {
    const total = queue.length;
    const waiting = queue.filter(q => q.status === 'waiting').length;
    const inConsultation = queue.filter(q => q.status === 'in_consultation').length;
    const completed = queue.filter(q => q.status === 'completed' || q.status === 'dispensary').length;
    const dispensary = queue.filter(q => q.status === 'dispensary').length;
    
    return { total, waiting, inConsultation, completed, dispensary };
  };

  return {
    queue,
    loading,
    currentNumber,
    addToQueue,
    updateQueueStatus,
    callNextPatient,
    getEstimatedWaitTime,
    getTodayStats,
    refetch: fetchQueue
  };
}