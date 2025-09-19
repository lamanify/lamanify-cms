import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export interface CalendarAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  reason: string;
  patient_name: string;
  doctor_name: string;
  start_datetime: string;
  end_datetime: string;
}

export function useCalendarAppointments() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      console.log('Fetching appointments for date range:', startDate, 'to', endDate, 'doctor:', selectedDoctorId);

      const { data, error } = await supabase.rpc('get_calendar_appointments', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_doctor_id: selectedDoctorId
      });

      console.log('Calendar appointments response:', { data, error });

      if (error) throw error;

      // Filter based on user role
      let filteredData = data || [];
      if (profile?.role === 'doctor') {
        filteredData = filteredData.filter((apt: CalendarAppointment) => apt.doctor_id === user.id);
      }

      setAppointments(filteredData);
    } catch (error) {
      console.error('Error fetching calendar appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, currentDate, selectedDoctorId]);

  const checkSlotAvailability = async (
    doctorId: string,
    appointmentDate: string,
    appointmentTime: string,
    durationMinutes: number,
    excludeAppointmentId?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_appointment_overlap', {
        p_doctor_id: doctorId,
        p_appointment_date: appointmentDate,
        p_appointment_time: appointmentTime,
        p_duration_minutes: durationMinutes,
        p_exclude_appointment_id: excludeAppointmentId
      });

      if (error) throw error;
      return !data; // Function returns true if overlap exists, we want availability
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  };

  const updateAppointment = async (
    appointmentId: string,
    updates: {
      appointment_date?: string;
      appointment_time?: string;
      duration_minutes?: number;
      doctor_id?: string;
    }
  ) => {
    try {
      // Check for conflicts if date/time/doctor is being changed
      if (updates.appointment_date || updates.appointment_time || updates.doctor_id) {
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (!appointment) throw new Error('Appointment not found');

        const newDate = updates.appointment_date || appointment.appointment_date;
        const newTime = updates.appointment_time || appointment.appointment_time;
        const newDuration = updates.duration_minutes || appointment.duration_minutes;
        const newDoctorId = updates.doctor_id || appointment.doctor_id;

        const isAvailable = await checkSlotAvailability(
          newDoctorId,
          newDate,
          newTime,
          newDuration,
          appointmentId
        );

        if (!isAvailable) {
          toast({
            title: "Slot unavailable",
            description: "The selected time slot conflicts with another appointment",
            variant: "destructive",
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });

      await fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
      return false;
    }
  };

  const createAppointment = async (appointmentData: {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    duration_minutes: number;
    reason?: string;
    status?: string;
  }) => {
    try {
      // Check for conflicts
      const isAvailable = await checkSlotAvailability(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.duration_minutes
      );

      if (!isAvailable) {
        toast({
          title: "Slot unavailable",
          description: "The selected time slot conflicts with another appointment",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          status: appointmentData.status || 'scheduled',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment created successfully",
      });

      await fetchAppointments();
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive",
      });
      return false;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `status.in.(scheduled,in_consultation)`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    currentDate,
    selectedDoctorId,
    setSelectedDoctorId,
    fetchAppointments,
    updateAppointment,
    createAppointment,
    checkSlotAvailability,
    navigateMonth,
    goToToday,
    goToDate,
  };
}