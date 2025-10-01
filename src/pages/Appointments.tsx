import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { Plus, Calendar, Clock, User, CalendarDays, UserCheck, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useQueue } from '@/hooks/useQueue';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  reason?: string;
  notes?: string;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [processingCheckIn, setProcessingCheckIn] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const { queue, addToQueue } = useQueue();

  useEffect(() => {
    fetchAppointments();

    // Set up real-time subscription for appointments
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('New appointment:', payload);
          // Add the new appointment to the list
          setAppointments(prev => [...prev, payload.new as Appointment]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Updated appointment:', payload);
          // Update the appointment in the list
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === payload.new.id ? { ...apt, ...payload.new } as Appointment : apt
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Deleted appointment:', payload);
          // Remove the appointment from the list
          setAppointments(prev => 
            prev.filter(apt => apt.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name),
          profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentSaved = (newAppointment?: Appointment) => {
    // If we have the new appointment data, add it optimistically
    if (newAppointment && !selectedAppointment) {
      setAppointments(prev => [newAppointment, ...prev]);
    } else {
      // For updates, refresh the list
      fetchAppointments();
    }
    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: 'outline',
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      in_progress: 'default',
      no_show: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const formatTime = (time: string) => {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  };

  const isPatientInQueue = (patientId: string): boolean => {
    const activeStatuses = ['waiting', 'in_consultation', 'ready_for_payment', 'dispensary'];
    return queue.some(
      entry => entry.patient_id === patientId && activeStatuses.includes(entry.status)
    );
  };

  const canCheckIn = (appointment: Appointment): boolean => {
    const validStatuses = ['scheduled', 'confirmed'];
    return validStatuses.includes(appointment.status) && !isPatientInQueue(appointment.patient_id);
  };

  const handleCheckIn = async (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    
    if (processingCheckIn === appointment.id) return;

    // Double-check patient not already in queue
    if (isPatientInQueue(appointment.patient_id)) {
      toast({
        title: "Already in Queue",
        description: "This patient is already in today's queue",
        variant: "destructive",
      });
      return;
    }

    setProcessingCheckIn(appointment.id);

    try {
      // Add to queue with appointment data
      await addToQueue(appointment.patient_id, appointment.doctor_id);

      // Find the newly created queue entry to get its ID
      const { data: queueData } = await supabase
        .from('patient_queue')
        .select('id')
        .eq('patient_id', appointment.patient_id)
        .eq('queue_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Update queue_sessions with appointment reference if queue entry exists
      if (queueData) {
        const { data: sessionData } = await supabase
          .from('queue_sessions')
          .select('id')
          .eq('queue_id', queueData.id)
          .maybeSingle();

        if (sessionData) {
          await supabase
            .from('queue_sessions')
            .update({
              session_data: {
                appointment_id: appointment.id,
                source: 'appointment',
                appointment_time: appointment.appointment_time,
                appointment_reason: appointment.reason || '',
                appointment_notes: appointment.notes || ''
              }
            })
            .eq('id', sessionData.id);
        }
      }

      // Update appointment status to arrived
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Patient checked in and added to queue",
      });

      // Refresh appointments to show updated status
      fetchAppointments();
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Failed",
        description: "Failed to check in patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingCheckIn(null);
    }
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments and scheduling</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <Link to="/appointments">
              <Button 
                variant={location.pathname === '/appointments' ? 'default' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <User className="h-4 w-4" />
                List View
              </Button>
            </Link>
            <Link to="/appointments/calendar">
              <Button 
                variant={location.pathname === '/appointments/calendar' ? 'default' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Calendar View
              </Button>
            </Link>
          </div>
          <Button onClick={handleNewAppointment} className="gap-2">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No appointments scheduled</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by scheduling your first appointment
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card 
              key={appointment.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEditAppointment(appointment)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        with Dr. {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {canCheckIn(appointment) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleCheckIn(appointment, e)}
                        disabled={processingCheckIn === appointment.id}
                        className="gap-2"
                      >
                        {processingCheckIn === appointment.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking In...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Mark as Arrived
                          </>
                        )}
                      </Button>
                    )}
                    {isPatientInQueue(appointment.patient_id) && 
                     !['arrived', 'completed', 'cancelled'].includes(appointment.status) && (
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        In Queue
                      </Badge>
                    )}
                    <Badge variant={getStatusBadge(appointment.status)}>
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(appointment.appointment_time)} ({appointment.duration_minutes} min)
                  </div>
                </div>
                {appointment.reason && (
                  <p className="text-sm">
                    <strong>Reason:</strong> {appointment.reason}
                  </p>
                )}
                {appointment.notes && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {appointment.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        appointment={selectedAppointment}
        onSave={handleAppointmentSaved}
      />
    </div>
  );
}