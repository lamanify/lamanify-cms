import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle, ArrowLeft, Calendar, Clock, User, Phone, Mail } from 'lucide-react';

interface PatientData {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
}

interface AppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason?: string;
}

interface BookingConfirmationProps {
  patientData: PatientData;
  appointmentData: AppointmentData;
  onBack: () => void;
}

export function BookingConfirmation({ patientData, appointmentData, onBack }: BookingConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [doctorName, setDoctorName] = useState<string>('');

  // Fetch doctor name
  useState(() => {
    const fetchDoctorName = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', appointmentData.doctor_id)
        .single();
      
      if (data) {
        setDoctorName(`Dr. ${data.first_name} ${data.last_name}`);
      }
    };
    fetchDoctorName();
  });

  const confirmBooking = async () => {
    setLoading(true);
    try {
      // Final availability check
      const { data: isOverlap } = await supabase.rpc('check_appointment_overlap', {
        p_doctor_id: appointmentData.doctor_id,
        p_appointment_date: appointmentData.appointment_date,
        p_appointment_time: appointmentData.appointment_time,
        p_duration_minutes: appointmentData.duration_minutes
      });

      if (isOverlap) {
        toast({
          title: "Booking unavailable",
          description: "This time slot is no longer available. Please select a different time.",
          variant: "destructive",
        });
        onBack();
        return;
      }

      // Create the appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: appointmentData.patient_id,
          doctor_id: appointmentData.doctor_id,
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          duration_minutes: appointmentData.duration_minutes,
          reason: appointmentData.reason,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      setConfirmed(true);
      toast({
        title: "Appointment confirmed!",
        description: "Your appointment has been successfully booked.",
      });

      // TODO: Send confirmation email/SMS here in Phase 2
      
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Booking failed",
        description: "Unable to confirm your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return format(date, 'h:mm a');
  };

  if (confirmed) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Appointment Confirmed!</h2>
              <p className="text-muted-foreground">
                Your appointment has been successfully booked. We look forward to seeing you!
              </p>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-left">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Patient:</strong> {patientData.first_name} {patientData.last_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Doctor:</strong> {doctorName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Date:</strong> {format(new Date(appointmentData.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Time:</strong> {formatTimeSlot(appointmentData.appointment_time)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Duration:</strong> {appointmentData.duration_minutes} minutes</span>
                  </div>
                  {appointmentData.reason && (
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 mt-0.5 text-muted-foreground">📝</span>
                      <span><strong>Reason:</strong> {appointmentData.reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Important Reminders:</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Please arrive 15 minutes before your appointment time</li>
                <li>• Bring a valid ID and any relevant medical documents</li>
                <li>• If you need to cancel or reschedule, please call us at least 24 hours in advance</li>
                <li>• You will receive a reminder before your appointment</li>
              </ul>
            </div>

            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Time Selection
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Confirm Your Appointment</h3>
              <p className="text-muted-foreground">
                Please review the details below and confirm your booking
              </p>
            </div>

            {/* Patient Information */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Patient Information</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {patientData.first_name} {patientData.last_name}</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{patientData.phone}</span>
                  </div>
                  {patientData.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{patientData.email}</span>
                    </div>
                  )}
                  <p><strong>Date of Birth:</strong> {format(new Date(patientData.date_of_birth), 'MMMM d, yyyy')}</p>
                  <p><strong>Gender:</strong> {patientData.gender}</p>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Appointment Details</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Doctor:</strong> {doctorName}</p>
                  <p><strong>Date:</strong> {format(new Date(appointmentData.appointment_date), 'EEEE, MMMM d, yyyy')}</p>
                  <p><strong>Time:</strong> {formatTimeSlot(appointmentData.appointment_time)}</p>
                  <p><strong>Duration:</strong> {appointmentData.duration_minutes} minutes</p>
                  {appointmentData.reason && <p><strong>Reason:</strong> {appointmentData.reason}</p>}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={confirmBooking} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}