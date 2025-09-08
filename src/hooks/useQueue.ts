import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QueueEntry {
  id: string;
  patient_id: string;
  queue_number: string;
  queue_date: string;
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  assigned_doctor_id?: string;
  estimated_consultation_duration: number;
  checked_in_at: string;
  consultation_started_at?: string;
  consultation_completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined patient data
  patient?: {
    first_name: string;
    last_name: string;
    phone?: string;
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
    
    // Set up real-time subscription
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_queue'
        },
        () => {
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

      // Fetch patient data
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone')
        .in('id', patientIds);

      // Fetch doctor data
      const { data: doctorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', doctorIds);

      // Combine the data
      const enrichedQueue: QueueEntry[] = queueData.map(entry => ({
        ...entry,
        status: entry.status as QueueEntry['status'],
        patient: patientsData?.find(p => p.id === entry.patient_id),
        doctor: doctorsData?.find(d => d.id === entry.assigned_doctor_id)
      }));
      
      setQueue(enrichedQueue);
      
      // Set current number to the first waiting patient or last in consultation
      const inConsultation = enrichedQueue?.find(entry => entry.status === 'in_consultation');
      const firstWaiting = enrichedQueue?.find(entry => entry.status === 'waiting');
      
      if (inConsultation) {
        setCurrentNumber(inConsultation.queue_number);
      } else if (firstWaiting) {
        setCurrentNumber(firstWaiting.queue_number);
      } else {
        const lastCompleted = enrichedQueue?.filter(entry => entry.status === 'completed').pop();
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
      const updates: any = { status };
      
      if (status === 'in_consultation') {
        updates.consultation_started_at = new Date().toISOString();
        if (doctorId) updates.assigned_doctor_id = doctorId;
      } else if (status === 'completed') {
        updates.consultation_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('patient_queue')
        .update(updates)
        .eq('id', queueId);

      if (error) throw error;

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
    const completed = queue.filter(q => q.status === 'completed').length;
    
    return { total, waiting, inConsultation, completed };
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