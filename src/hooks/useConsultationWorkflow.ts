import { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import { usePatientActivities } from '@/hooks/usePatientActivities';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConsultationData {
  notes: string;
  diagnosis: string;
  treatmentItems: Array<{
    id: string;
    item: string;
    quantity: number;
    priceTier: string;
    rate: number;
    amount: number;
    dosage: string;
    instruction: string;
    frequency: string;
    duration: string;
  }>;
}

export function useConsultationWorkflow() {
  const [activeConsultationSession, setActiveConsultationSession] = useState<string | null>(null);
  const { completeConsultation } = useConsultation();
  const { toast } = useToast();

  // Start consultation and create session
  const startConsultationWorkflow = async (patientId: string, queueId: string) => {
    try {
      const { data: sessionData, error } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: patientId,
          doctor_id: (await supabase.auth.getUser()).data.user?.id,
          queue_id: queueId,
          status: 'active',
          urgency_level: 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      
      setActiveConsultationSession(sessionData.id);
      return sessionData.id;
    } catch (error) {
      console.error('Error starting consultation workflow:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation session",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Complete consultation with patient activity sync
  const completeConsultationWorkflow = async (
    patientId: string, 
    queueId: string, 
    consultationData: ConsultationData
  ) => {
    try {
      const doctorId = (await supabase.auth.getUser()).data.user?.id;
      
      // Create main consultation activity
      const consultationContent = [
        consultationData.diagnosis ? `Diagnosis: ${consultationData.diagnosis}` : '',
        consultationData.notes ? `Notes: ${consultationData.notes}` : '',
        consultationData.treatmentItems.length ? `Prescribed ${consultationData.treatmentItems.length} items` : ''
      ].filter(Boolean).join('\n');

      await supabase.from('patient_activities').insert({
        patient_id: patientId,
        activity_type: 'consultation',
        activity_date: new Date().toISOString(),
        title: 'Consultation Completed',
        content: consultationContent || 'Consultation completed successfully',
        metadata: {
          queue_id: queueId,
          diagnosis: consultationData.diagnosis,
          consultation_date: new Date().toISOString().split('T')[0],
          total_items: consultationData.treatmentItems.length
        },
        staff_member_id: doctorId,
        priority: 'normal',
        status: 'completed'
      });

      // Process treatment items
      if (consultationData.treatmentItems && consultationData.treatmentItems.length > 0) {
        for (const item of consultationData.treatmentItems) {
          // Add medication to current medications if it has dosage info
          if (item.dosage || item.frequency || item.duration) {
            await supabase.from('patient_current_medications').insert({
              patient_id: patientId,
              medication_name: item.item,
              dosage: item.dosage || 'As directed',
              frequency: item.frequency || 'As needed',
              prescribed_date: new Date().toISOString(),
              prescribed_by: doctorId,
              duration_days: item.duration ? parseInt(item.duration.replace(/\D/g, '')) || null : null,
              status: 'active',
              instructions: item.instruction || 'Follow as prescribed'
            });

            // Create medication activity
            await supabase.from('patient_activities').insert({
              patient_id: patientId,
              activity_type: 'medication',
              activity_date: new Date().toISOString(),
              title: `Prescribed ${item.item}`,
              content: `Dosage: ${item.dosage || 'As directed'}\nFrequency: ${item.frequency || 'As needed'}\nInstructions: ${item.instruction || 'Follow as prescribed'}`,
              metadata: {
                medication_name: item.item,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                queue_id: queueId
              },
              staff_member_id: doctorId,
              priority: 'normal',
              status: 'active'
            });
          } else {
            // Create service/treatment activity
            await supabase.from('patient_activities').insert({
              patient_id: patientId,
              activity_type: 'treatment',
              activity_date: new Date().toISOString(),
              title: `Treatment: ${item.item}`,
              content: `Service provided: ${item.item}\nQuantity: ${item.quantity}\nAmount: RM ${item.amount.toFixed(2)}`,
              metadata: {
                service_name: item.item,
                quantity: item.quantity,
                amount: item.amount,
                queue_id: queueId
              },
              staff_member_id: doctorId,
              priority: 'normal',
              status: 'completed'
            });
          }
        }
      }

      // Complete the consultation session if exists
      if (activeConsultationSession) {
        await completeConsultation(activeConsultationSession, consultationData);
        setActiveConsultationSession(null);
      }

      toast({
        title: "Consultation Completed",
        description: "Patient data has been synced to medical history",
      });

      return true;
    } catch (error) {
      console.error('Error completing consultation workflow:', error);
      toast({
        title: "Error",
        description: "Failed to complete consultation",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    activeConsultationSession,
    startConsultationWorkflow,
    completeConsultationWorkflow
  };
}