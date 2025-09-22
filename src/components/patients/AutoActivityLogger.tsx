import { useAuth } from '@/hooks/useAuth';
import { usePatientActivities } from '@/hooks/usePatientActivities';
import { useCurrency } from '@/hooks/useCurrency';

/**
 * Auto Activity Logger - Utility functions for automatically logging patient activities
 * This integrates with various parts of the system to create comprehensive activity tracking
 */

export function useAutoActivityLogger() {
  const { profile } = useAuth();
  const { createActivity } = usePatientActivities();
  const { formatCurrency } = useCurrency();

  // Log consultation completion
  const logConsultationActivity = async (patientId: string, consultationData: {
    diagnosis?: string;
    treatment_plan?: string;
    duration_minutes?: number;
    notes?: string;
    prescriptions?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'consultation',
        activity_date: new Date().toISOString(),
        title: 'Consultation Completed',
        content: `Diagnosis: ${consultationData.diagnosis || 'Not specified'}
Treatment Plan: ${consultationData.treatment_plan || 'Not specified'}
Duration: ${consultationData.duration_minutes || 0} minutes
Notes: ${consultationData.notes || 'No additional notes'}`,
        metadata: {
          diagnosis: consultationData.diagnosis,
          treatment_plan: consultationData.treatment_plan,
          duration_minutes: consultationData.duration_minutes,
          prescriptions: consultationData.prescriptions
        },
        staff_member_id: profile?.id,
        priority: 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging consultation activity:', error);
    }
  };

  // Log medication dispensing
  const logMedicationActivity = async (patientId: string, medicationData: {
    medication_name: string;
    quantity: number;
    dosage?: string;
    instructions?: string;
    pharmacist_id?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'medication',
        activity_date: new Date().toISOString(),
        title: `Medication Dispensed: ${medicationData.medication_name}`,
        content: `Quantity: ${medicationData.quantity}
Dosage: ${medicationData.dosage || 'As prescribed'}
Instructions: ${medicationData.instructions || 'Follow prescription'}`,
        metadata: {
          medication_name: medicationData.medication_name,
          quantity: medicationData.quantity,
          dosage: medicationData.dosage,
          instructions: medicationData.instructions
        },
        staff_member_id: medicationData.pharmacist_id || profile?.id,
        priority: 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging medication activity:', error);
    }
  };

  // Log payment transaction
  const logPaymentActivity = async (patientId: string, paymentData: {
    amount: number;
    payment_method: string;
    invoice_number?: string;
    description?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'payment',
        activity_date: new Date().toISOString(),
        title: `Payment Received: ${formatCurrency(paymentData.amount)}`,
        content: `Payment Method: ${paymentData.payment_method}
Invoice: ${paymentData.invoice_number || 'N/A'}
Description: ${paymentData.description || 'Payment received'}`,
        metadata: {
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          invoice_number: paymentData.invoice_number,
          currency: 'MYR'
        },
        staff_member_id: profile?.id,
        priority: 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging payment activity:', error);
    }
  };

  // Log appointment scheduling
  const logAppointmentActivity = async (patientId: string, appointmentData: {
    appointment_date: string;
    appointment_time: string;
    doctor_id?: string;
    reason?: string;
    status: 'scheduled' | 'rescheduled' | 'cancelled';
  }) => {
    try {
      const actionMap = {
        scheduled: 'Appointment Scheduled',
        rescheduled: 'Appointment Rescheduled',
        cancelled: 'Appointment Cancelled'
      };

      await createActivity({
        patient_id: patientId,
        activity_type: 'appointment',
        activity_date: new Date().toISOString(),
        title: actionMap[appointmentData.status],
        content: `Date: ${appointmentData.appointment_date}
Time: ${appointmentData.appointment_time}
Reason: ${appointmentData.reason || 'General consultation'}`,
        metadata: {
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          doctor_id: appointmentData.doctor_id,
          reason: appointmentData.reason,
          status: appointmentData.status
        },
        staff_member_id: profile?.id,
        priority: appointmentData.status === 'cancelled' ? 'high' : 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging appointment activity:', error);
    }
  };

  // Log communication (phone calls, SMS, emails)
  const logCommunicationActivity = async (patientId: string, communicationData: {
    type: 'phone_call' | 'sms' | 'email';
    direction: 'incoming' | 'outgoing';
    duration?: number; // for phone calls in minutes
    subject?: string;
    content_preview?: string;
    status: 'completed' | 'missed' | 'failed';
  }) => {
    try {
      const typeMap = {
        phone_call: 'Phone Call',
        sms: 'SMS',
        email: 'Email'
      };

      await createActivity({
        patient_id: patientId,
        activity_type: 'communication',
        activity_date: new Date().toISOString(),
        title: `${typeMap[communicationData.type]} - ${communicationData.direction}`,
        content: `Type: ${typeMap[communicationData.type]}
Direction: ${communicationData.direction}
Status: ${communicationData.status}
${communicationData.duration ? `Duration: ${communicationData.duration} minutes` : ''}
${communicationData.subject ? `Subject: ${communicationData.subject}` : ''}
${communicationData.content_preview ? `Preview: ${communicationData.content_preview}` : ''}`,
        metadata: {
          type: communicationData.type,
          direction: communicationData.direction,
          duration: communicationData.duration,
          subject: communicationData.subject,
          status: communicationData.status
        },
        staff_member_id: profile?.id,
        priority: communicationData.status === 'failed' ? 'high' : 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging communication activity:', error);
    }
  };

  // Log vital signs
  const logVitalSignsActivity = async (patientId: string, vitalData: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    notes?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'vital_signs',
        activity_date: new Date().toISOString(),
        title: 'Vital Signs Recorded',
        content: `Blood Pressure: ${vitalData.blood_pressure || 'Not recorded'}
Heart Rate: ${vitalData.heart_rate || 'Not recorded'} bpm
Temperature: ${vitalData.temperature || 'Not recorded'}°C
Weight: ${vitalData.weight || 'Not recorded'} kg
Height: ${vitalData.height || 'Not recorded'} cm
Notes: ${vitalData.notes || 'No additional notes'}`,
        metadata: vitalData,
        staff_member_id: profile?.id,
        priority: 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging vital signs activity:', error);
    }
  };

  // Log lab results
  const logLabResultsActivity = async (patientId: string, labData: {
    test_name: string;
    results: string;
    normal_range?: string;
    abnormal: boolean;
    lab_technician_id?: string;
    notes?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'lab_results',
        activity_date: new Date().toISOString(),
        title: `Lab Results: ${labData.test_name}`,
        content: `Test: ${labData.test_name}
Results: ${labData.results}
Normal Range: ${labData.normal_range || 'Not specified'}
Status: ${labData.abnormal ? 'ABNORMAL' : 'Normal'}
Notes: ${labData.notes || 'No additional notes'}`,
        metadata: {
          test_name: labData.test_name,
          results: labData.results,
          normal_range: labData.normal_range,
          abnormal: labData.abnormal
        },
        staff_member_id: labData.lab_technician_id || profile?.id,
        priority: labData.abnormal ? 'high' : 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging lab results activity:', error);
    }
  };

  // Log system notes (registration updates, insurance changes, etc.)
  const logSystemNoteActivity = async (patientId: string, noteData: {
    title: string;
    description: string;
    category?: string;
  }) => {
    try {
      await createActivity({
        patient_id: patientId,
        activity_type: 'system_note',
        activity_date: new Date().toISOString(),
        title: noteData.title,
        content: noteData.description,
        metadata: {
          category: noteData.category || 'general'
        },
        staff_member_id: profile?.id,
        priority: 'normal',
        status: 'active'
      });
    } catch (error) {
      console.error('Error logging system note activity:', error);
    }
  };

  return {
    logConsultationActivity,
    logMedicationActivity,
    logPaymentActivity,
    logAppointmentActivity,
    logCommunicationActivity,
    logVitalSignsActivity,
    logLabResultsActivity,
    logSystemNoteActivity
  };
}