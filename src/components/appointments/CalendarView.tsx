import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCalendarAppointments, CalendarAppointment } from '@/hooks/useCalendarAppointments';
import { QuickBookModal } from './QuickBookModal';
import { AppointmentDialog } from './AppointmentDialog';
import { CalendarIcon, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

export function CalendarView() {
  const {
    appointments,
    loading,
    currentDate,
    selectedDoctorId,
    setSelectedDoctorId,
    updateAppointment,
    createAppointment,
    navigateMonth,
    goToToday,
    goToDate,
    fetchAppointments,
  } = useCalendarAppointments();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [quickBookSlot, setQuickBookSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<CalendarAppointment | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const calendarRef = useRef<FullCalendar>(null);
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  // Fetch doctors for filter
  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching doctors:', error);
      } else {
        setDoctors(data || []);
      }
    };

    fetchDoctors();
  }, []);

  // Auto-switch to agenda view on mobile
  useEffect(() => {
    if (isMobile && calendarView !== 'listWeek') {
      setCalendarView('listWeek');
    }
  }, [isMobile, calendarView]);

  const getEventColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6'; // Blue
      case 'in_consultation':
        return '#f97316'; // Orange
      case 'completed':
        return '#6b7280'; // Grey
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#3b82f6';
    }
  };

  const formatCalendarEvents = () => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.patient_name}${appointment.reason ? ` - ${appointment.reason}` : ''}`,
      start: appointment.start_datetime,
      end: appointment.end_datetime,
      backgroundColor: getEventColor(appointment.status),
      borderColor: getEventColor(appointment.status),
      extendedProps: {
        appointment,
      },
    }));
  };

  const handleEventDrop = async (info: any) => {
    const { appointment } = info.event.extendedProps;
    const newStart = info.event.start;
    
    const newDate = format(newStart, 'yyyy-MM-dd');
    const newTime = format(newStart, 'HH:mm:ss');

    const success = await updateAppointment(appointment.id, {
      appointment_date: newDate,
      appointment_time: newTime,
    });

    if (!success) {
      info.revert();
    }
  };

  const handleEventResize = async (info: any) => {
    const { appointment } = info.event.extendedProps;
    const newEnd = info.event.end;
    const start = info.event.start;
    
    const durationMs = newEnd.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const success = await updateAppointment(appointment.id, {
      duration_minutes: durationMinutes,
    });

    if (!success) {
      info.revert();
    }
  };

  const handleDateClick = (info: any) => {
    // Only allow double-click on empty slots
    if (info.jsEvent.detail === 2) {
      const clickedDate = format(info.date, 'yyyy-MM-dd');
      const clickedTime = format(info.date, 'HH:mm:ss');
      
      setQuickBookSlot({ date: clickedDate, time: clickedTime });
      setQuickBookOpen(true);
    }
  };

  const handleEventClick = (info: any) => {
    const { appointment } = info.event.extendedProps;
    setEditingAppointment(appointment);
    setAppointmentDialogOpen(true);
  };

  const handleViewChange = (view: string) => {
    setCalendarView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      goToDate(date);
      if (calendarRef.current) {
        calendarRef.current.getApi().gotoDate(date);
      }
    }
    setDatePickerOpen(false);
  };

  const handleNavigation = (action: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    switch (action) {
      case 'prev':
        calendarApi.prev();
        navigateMonth('prev');
        break;
      case 'next':
        calendarApi.next();
        navigateMonth('next');
        break;
      case 'today':
        calendarApi.today();
        goToToday();
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(currentDate, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('today')}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Doctor Filter */}
          {(profile?.role === 'admin' || profile?.role === 'receptionist') && (
            <Select value={selectedDoctorId || 'all'} onValueChange={(value) => setSelectedDoctorId(value === 'all' ? null : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All doctors</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={calendarView === 'dayGridMonth' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('dayGridMonth')}
              className="h-8"
            >
              Month
            </Button>
            <Button
              variant={calendarView === 'timeGridWeek' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('timeGridWeek')}
              className="h-8"
            >
              Week
            </Button>
            <Button
              variant={calendarView === 'timeGridDay' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('timeGridDay')}
              className="h-8"
            >
              Day
            </Button>
            {isMobile && (
              <Button
                variant={calendarView === 'listWeek' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('listWeek')}
                className="h-8"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 text-sm">
        {[
          { status: 'scheduled', color: '#3b82f6', label: 'Scheduled' },
          { status: 'in_consultation', color: '#f97316', label: 'In Progress' },
          { status: 'completed', color: '#6b7280', label: 'Completed' },
          { status: 'cancelled', color: '#ef4444', label: 'Cancelled' },
        ].map(({ status, color, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-background border rounded-lg p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          headerToolbar={false}
          height="auto"
          events={formatCalendarEvents()}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '08:00',
            endTime: '17:00',
          }}
          eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
          dayCellClassNames="hover:bg-accent/50 cursor-pointer"
        />
      </div>

      {/* Quick Book Modal */}
      <QuickBookModal
        open={quickBookOpen}
        onOpenChange={setQuickBookOpen}
        initialDate={quickBookSlot?.date}
        initialTime={quickBookSlot?.time}
        doctors={doctors}
        onSuccess={createAppointment}
      />

      {/* Edit Appointment Modal */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open);
          if (!open) setEditingAppointment(null);
        }}
        appointment={editingAppointment ? {
          id: editingAppointment.id,
          patient_id: editingAppointment.patient_id,
          doctor_id: editingAppointment.doctor_id,
          appointment_date: editingAppointment.appointment_date,
          appointment_time: editingAppointment.appointment_time,
          duration_minutes: editingAppointment.duration_minutes,
          status: editingAppointment.status,
          reason: editingAppointment.reason || '',
          notes: '',
          created_at: new Date().toISOString(),
          patients: {
            first_name: editingAppointment.patient_name.split(' ')[0] || '',
            last_name: editingAppointment.patient_name.split(' ').slice(1).join(' ') || '',
          },
          profiles: {
            first_name: editingAppointment.doctor_name.split(' ')[0] || '',
            last_name: editingAppointment.doctor_name.split(' ').slice(1).join(' ') || '',
          },
        } : null}
        onSave={() => {
          setAppointmentDialogOpen(false);
          setEditingAppointment(null);
          fetchAppointments();
        }}
      />
    </div>
  );
}