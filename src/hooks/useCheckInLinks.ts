import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CheckInLink {
  id: string;
  appointment_id: string;
  patient_id: string;
  secure_token: string;
  expires_at: string;
  used_at?: string;
  forms_completed: boolean;
  check_in_completed: boolean;
  created_at: string;
}

export const useCheckInLinks = () => {
  const [checkInLinks, setCheckInLinks] = useState<CheckInLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckInLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_check_in_links')
        .select(`
          *,
          appointments!inner(appointment_date, appointment_time, reason),
          patients!inner(first_name, last_name, phone, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckInLinks(data || []);
    } catch (error) {
      console.error('Error fetching check-in links:', error);
      toast({
        title: "Error",
        description: "Failed to load check-in links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCheckInLink = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_check_in_link', {
        p_appointment_id: appointmentId
      });

      if (error) throw error;
      
      await fetchCheckInLinks();
      
      toast({
        title: "Success",
        description: "Check-in link generated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error generating check-in link:', error);
      toast({
        title: "Error",
        description: "Failed to generate check-in link",
        variant: "destructive",
      });
      return null;
    }
  };

  const validateCheckInToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('appointment_check_in_links')
        .select(`
          *,
          appointments!inner(id, appointment_date, appointment_time, reason),
          patients!inner(id, first_name, last_name)
        `)
        .eq('secure_token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating check-in token:', error);
      return null;
    }
  };

  const completeCheckIn = async (token: string, formData?: any) => {
    try {
      const { data, error } = await supabase
        .from('appointment_check_in_links')
        .update({
          used_at: new Date().toISOString(),
          forms_completed: !!formData,
          check_in_completed: true
        })
        .eq('secure_token', token)
        .select()
        .single();

      if (error) throw error;
      
      // Update appointment status
      await supabase
        .from('appointments')
        .update({
          digital_check_in_status: 'checked_in'
        })
        .eq('id', data.appointment_id);
      
      await fetchCheckInLinks();
      
      toast({
        title: "Success",
        description: "Check-in completed successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error completing check-in:', error);
      toast({
        title: "Error",
        description: "Failed to complete check-in",
        variant: "destructive",
      });
      return null;
    }
  };

  const getCheckInUrl = (token: string) => {
    return `${window.location.origin}/check-in/${token}`;
  };

  useEffect(() => {
    fetchCheckInLinks();
  }, []);

  return {
    checkInLinks,
    loading,
    generateCheckInLink,
    validateCheckInToken,
    completeCheckIn,
    getCheckInUrl,
    refetch: fetchCheckInLinks
  };
};