import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateSessionData, checkDataCompleteness, type ValidatedQueueSessionData } from '@/lib/sessionValidation';
import { useToast } from '@/hooks/use-toast';

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
  const [sessionHistory, setSessionHistory] = useState<QueueSessionData[]>([]);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const { toast } = useToast();

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

  // Validate and save session data with integrity checks
  const saveSessionData = useCallback(async (newData: Partial<QueueSessionData>) => {
    if (!queueId || isSessionLocked) {
      toast({
        title: "Session Locked",
        description: "Cannot modify archived or locked session",
        variant: "destructive",
      });
      return false;
    }

    // Check if session is already archived
    const { data: sessionCheck } = await supabase
      .from('queue_sessions')
      .select('status, archived_at')
      .eq('queue_id', queueId)
      .single();

    if (sessionCheck?.status === 'archived' || sessionCheck?.archived_at) {
      setIsSessionLocked(true);
      toast({
        title: "Session Archived",
        description: "Cannot modify archived session data",
        variant: "destructive",
      });
      return false;
    }

    // Merge with existing data
    const mergedData = { ...sessionData, ...newData, last_updated: new Date().toISOString() };

    // Validate data structure
    const validation = validateSessionData(mergedData);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: `Invalid data: ${validation.errors?.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      // Save current state to history before update
      if (sessionData) {
        setSessionHistory(prev => [...prev.slice(-9), sessionData]); // Keep last 10 versions
      }

      // Update session with validated data
      const { error } = await supabase
        .from('queue_sessions')
        .update({ 
          session_data: validation.data as any,
          updated_at: new Date().toISOString()
        })
        .eq('queue_id', queueId);

      if (error) throw error;

      setSessionData(validation.data as QueueSessionData);
      toast({
        title: "Session Updated",
        description: "Session data saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error saving session data:', error);
      toast({
        title: "Save Error",
        description: "Failed to save session data",
        variant: "destructive",
      });
      return false;
    }
  }, [queueId, sessionData, isSessionLocked, toast]);

  // Rollback to previous version
  const rollbackSession = useCallback(async (historyIndex?: number) => {
    if (!queueId || isSessionLocked || sessionHistory.length === 0) return false;

    const targetData = historyIndex !== undefined 
      ? sessionHistory[historyIndex] 
      : sessionHistory[sessionHistory.length - 1];

    if (!targetData) return false;

    try {
      const { error } = await supabase
        .from('queue_sessions')
        .update({ 
          session_data: targetData as any,
          updated_at: new Date().toISOString()
        })
        .eq('queue_id', queueId);

      if (error) throw error;

      setSessionData(targetData);
      // Remove the rolled back versions from history
      if (historyIndex !== undefined) {
        setSessionHistory(prev => prev.slice(0, historyIndex));
      } else {
        setSessionHistory(prev => prev.slice(0, -1));
      }

      toast({
        title: "Session Rolled Back",
        description: "Reverted to previous version",
      });
      return true;
    } catch (error) {
      console.error('Error rolling back session:', error);
      toast({
        title: "Rollback Error",
        description: "Failed to rollback session",
        variant: "destructive",
      });
      return false;
    }
  }, [queueId, isSessionLocked, sessionHistory, toast]);

  // Validate session completeness
  const validateCompleteness = useCallback(() => {
    if (!sessionData) return { isComplete: false, missing: ['session_data'] };
    
    const validation = validateSessionData(sessionData);
    if (!validation.isValid) {
      return { isComplete: false, missing: validation.errors || [] };
    }

    return checkDataCompleteness(validation.data!);
  }, [sessionData]);

  return {
    sessionData,
    loading,
    refreshSessionData,
    lastUpdate,
    sessionHistory,
    isSessionLocked,
    saveSessionData,
    rollbackSession,
    validateCompleteness
  };
}