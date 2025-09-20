import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WaitlistEntry {
  id?: string;
  patient_id: string;
  doctor_id?: string;
  service_type?: string;
  preferred_date_start?: string;
  preferred_date_end?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  duration_minutes?: number;
  priority?: 'high' | 'normal' | 'low';
  notes?: string;
  contact_preference?: 'phone' | 'email' | 'sms';
}

export const useAppointmentWaitlist = () => {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select(`
          *,
          patients:patient_id(first_name, last_name, phone, email),
          doctors:doctor_id(first_name, last_name)
        `)
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to fetch waitlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWaitlist = async (entry: WaitlistEntry) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;

      toast.success('Added to waitlist');
      await fetchWaitlist();
      return data;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error('Failed to add to waitlist');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWaitlist = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointment_waitlist')
        .update({ status: 'fulfilled' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Removed from waitlist');
      await fetchWaitlist();
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast.error('Failed to remove from waitlist');
    } finally {
      setLoading(false);
    }
  };

  const processWaitlistForSlot = async (
    doctorId: string,
    appointmentDate: string,
    appointmentTime: string,
    durationMinutes: number
  ) => {
    try {
      const { data, error } = await supabase.rpc('process_waitlist_for_slot', {
        p_doctor_id: doctorId,
        p_appointment_date: appointmentDate,
        p_appointment_time: appointmentTime,
        p_duration_minutes: durationMinutes
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error processing waitlist:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  return {
    waitlist,
    loading,
    fetchWaitlist,
    addToWaitlist,
    removeFromWaitlist,
    processWaitlistForSlot
  };
};