import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addDays, startOfDay, isBefore, isAfter, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason?: string;
}

interface AvailableTimeSlotsProps {
  patientId: string;
  onSelect: (data: AppointmentData) => void;
  onBack: () => void;
}

export function AvailableTimeSlots({ patientId, onSelect, onBack }: AvailableTimeSlotsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [reason, setReason] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, duration]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['doctor', 'admin'])
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Unable to load doctors. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const slots: TimeSlot[] = [];
      
      // Generate time slots from 9 AM to 5 PM (clinic hours)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check if slot is available
          const { data: isOverlap } = await supabase.rpc('check_appointment_overlap', {
            p_doctor_id: selectedDoctor,
            p_appointment_date: selectedDate,
            p_appointment_time: timeString,
            p_duration_minutes: duration
          });
          
          slots.push({
            time: timeString,
            available: !isOverlap
          });
        }
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Unable to load available time slots.",
        variant: "destructive",
      });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select doctor, date, and time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Double-check availability before booking
      const { data: isOverlap } = await supabase.rpc('check_appointment_overlap', {
        p_doctor_id: selectedDoctor,
        p_appointment_date: selectedDate,
        p_appointment_time: selectedTime,
        p_duration_minutes: duration
      });

      if (isOverlap) {
        toast({
          title: "Slot no longer available",
          description: "This time slot has been booked by someone else. Please select another time.",
          variant: "destructive",
        });
        await fetchAvailableSlots(); // Refresh slots
        return;
      }

      const appointmentData: AppointmentData = {
        patient_id: patientId,
        doctor_id: selectedDoctor,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        duration_minutes: duration,
        reason: reason || undefined
      };

      onSelect(appointmentData);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast({
        title: "Error",
        description: "Unable to verify time slot availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = setMinutes(setHours(new Date(), parseInt(hour)), parseInt(minute));
    return format(date, 'h:mm a');
  };

  const getMinDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  const getMaxDate = () => {
    return format(addDays(new Date(), 30), 'yyyy-MM-dd'); // Allow booking up to 30 days ahead
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patient Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selection Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Appointment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor *</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Select Date *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                placeholder="Brief description of your visit reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Available Times</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDoctor || !selectedDate ? (
              <div className="text-center text-muted-foreground py-8">
                Please select a doctor and date to view available times
              </div>
            ) : slotsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading available times...
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableSlots.filter(slot => slot.available).length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No available time slots for this date. Please try another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots
                      .filter(slot => slot.available)
                      .map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot.time)}
                          className="justify-start"
                        >
                          {formatTimeSlot(slot.time)}
                        </Button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTime && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Selected Appointment:</h4>
              <p>
                <strong>Doctor:</strong> Dr. {doctors.find(d => d.id === selectedDoctor)?.first_name} {doctors.find(d => d.id === selectedDoctor)?.last_name}
              </p>
              <p><strong>Date:</strong> {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {formatTimeSlot(selectedTime)}</p>
              <p><strong>Duration:</strong> {duration} minutes</p>
              {reason && <p><strong>Reason:</strong> {reason}</p>}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? 'Checking availability...' : 'Continue to Confirmation'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}