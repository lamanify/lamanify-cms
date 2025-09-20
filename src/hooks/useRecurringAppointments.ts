import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  end_date?: string;
  max_occurrences?: number;
  [key: string]: any;
}

export const useRecurringAppointments = () => {
  const [loading, setLoading] = useState(false);

  const createRecurringAppointments = async (
    baseAppointmentId: string,
    pattern: RecurrencePattern
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_recurring_appointments', {
        p_base_appointment_id: baseAppointmentId,
        p_recurrence_pattern: pattern
      });

      if (error) throw error;

      toast.success(`Created ${data?.length || 0} recurring appointments`);
      return data;
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      toast.error('Failed to create recurring appointments');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRecurringSeries = async (recurrenceId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(first_name, last_name),
          doctors:doctor_id(first_name, last_name)
        `)
        .eq('recurrence_id', recurrenceId)
        .order('appointment_date');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recurring series:', error);
      return [];
    }
  };

  const cancelRecurringSeries = async (recurrenceId: string, cancelFuture = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('recurrence_id', recurrenceId);

      if (cancelFuture) {
        query = query.gte('appointment_date', new Date().toISOString().split('T')[0]);
      }

      const { error } = await query;

      if (error) throw error;

      toast.success(cancelFuture ? 'Cancelled future appointments' : 'Cancelled entire series');
      return true;
    } catch (error) {
      console.error('Error cancelling recurring series:', error);
      toast.error('Failed to cancel appointments');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createRecurringAppointments,
    getRecurringSeries,
    cancelRecurringSeries
  };
};