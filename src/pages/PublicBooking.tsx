import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PatientSelfRegistration } from '@/components/booking/PatientSelfRegistration';
import { AvailableTimeSlots } from '@/components/booking/AvailableTimeSlots';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { CalendarDays, Clock, UserPlus } from 'lucide-react';

type BookingStep = 'patient-info' | 'select-time' | 'confirmation';

interface PatientData {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  isExisting?: boolean;
}

interface AppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason?: string;
}

export default function PublicBooking() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-info');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);

  const handlePatientSubmit = (data: PatientData) => {
    setPatientData(data);
    setCurrentStep('select-time');
  };

  const handleTimeSlotSelect = (data: AppointmentData) => {
    setAppointmentData(data);
    setCurrentStep('confirmation');
  };

  const handleBackToPatientInfo = () => {
    setCurrentStep('patient-info');
  };

  const handleBackToTimeSelection = () => {
    setCurrentStep('select-time');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">Book Your Appointment</h1>
          <p className="text-center text-primary-foreground/90">
            Schedule your visit with our healthcare professionals
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className={`flex items-center space-x-2 ${
            currentStep === 'patient-info' ? 'text-primary' : 
            currentStep === 'select-time' || currentStep === 'confirmation' ? 'text-muted-foreground' : 'text-muted-foreground'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'patient-info' ? 'bg-primary text-primary-foreground' :
              currentStep === 'select-time' || currentStep === 'confirmation' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="font-medium">Patient Info</span>
          </div>

          <div className={`flex items-center space-x-2 ${
            currentStep === 'select-time' ? 'text-primary' : 
            currentStep === 'confirmation' ? 'text-muted-foreground' : 'text-muted-foreground'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'select-time' ? 'bg-primary text-primary-foreground' :
              currentStep === 'confirmation' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-medium">Select Time</span>
          </div>

          <div className={`flex items-center space-x-2 ${
            currentStep === 'confirmation' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="font-medium">Confirmation</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 'patient-info' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientSelfRegistration onSubmit={handlePatientSubmit} />
              </CardContent>
            </Card>
          )}

          {currentStep === 'select-time' && patientData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Select Appointment Time</CardTitle>
                <div className="text-center text-muted-foreground">
                  Booking for: {patientData.first_name} {patientData.last_name}
                </div>
              </CardHeader>
              <CardContent>
                <AvailableTimeSlots 
                  patientId={patientData.id!}
                  onSelect={handleTimeSlotSelect}
                  onBack={handleBackToPatientInfo}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'confirmation' && patientData && appointmentData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Booking Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingConfirmation 
                  patientData={patientData}
                  appointmentData={appointmentData}
                  onBack={handleBackToTimeSelection}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}