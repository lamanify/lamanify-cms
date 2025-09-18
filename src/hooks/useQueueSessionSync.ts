import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QueueSessionData {
  consultation_notes?: string;
  diagnosis?: string;
  prescribed_items?: Array<{
    type: 'medication' | 'service';
    name: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    price: number;
    instructions?: string;
    rate: number;
  }>;
  completed_at?: string;
  doctor_id?: string;
  last_updated?: string;
}

export function useQueueSessionSync(queueId: string | null) {
  const [sessionData, setSessionData] = useState<QueueSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    if (!queueId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('queue_sessions')
        .select('session_data, updated_at')
        .eq('queue_id', queueId)
        .single();

      if (error) {
        console.error('Error fetching session data:', error);
        return;
      }

      if (data?.session_data) {
        setSessionData(data.session_data as QueueSessionData);
        setLastUpdate(data.updated_at);
      }
    } catch (error) {
      console.error('Error in fetchSessionData:', error);
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  // Set up real-time listener
  useEffect(() => {
    if (!queueId) return;

    // Initial fetch
    fetchSessionData();

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-session-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_sessions',
          filter: `queue_id=eq.${queueId}`
        },
        (payload) => {
          console.log('Queue session updated:', payload);
          const newSessionData = payload.new?.session_data;
          const updatedAt = payload.new?.updated_at;
          
          if (newSessionData && updatedAt !== lastUpdate) {
            setSessionData(newSessionData as QueueSessionData);
            setLastUpdate(updatedAt);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, fetchSessionData, lastUpdate]);

  // Force refresh function
  const refreshSessionData = useCallback(() => {
    if (queueId) {
      fetchSessionData();
    }
  }, [fetchSessionData, queueId]);

  return {
    sessionData,
    loading,
    refreshSessionData,
    lastUpdate
  };
}