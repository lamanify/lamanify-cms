import { useState, useEffect } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import { usePatientActivities } from '@/hooks/usePatientActivities';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMedications } from '@/hooks/useMedications';
import { useServices } from '@/hooks/useServices';

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
  const { medications } = useMedications();
  const { services } = useServices();

  // Helper function to update queue session data with validation
  const updateQueueSessionData = async (queueId: string, sessionData: any) => {
    try {
      // Check if queue_id exists and is not archived
      const { data: existingSession, error: checkError } = await supabase
        .from('queue_sessions')
        .select('status, archived_at, queue_id')
        .eq('queue_id', queueId)
        .single();

      if (checkError) throw checkError;

      // Prevent overwriting archived sessions
      if (existingSession.status === 'archived' || existingSession.archived_at) {
        throw new Error('Cannot update archived session data');
      }

      // Ensure queue_id uniqueness - never overwrite different queue records
      if (existingSession.queue_id !== queueId) {
        throw new Error('Queue ID mismatch - data integrity violation');
      }

      const { error } = await supabase
        .from('queue_sessions')
        .update({ 
          session_data: sessionData,
          updated_at: new Date().toISOString()
        })
        .eq('queue_id', queueId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating queue session data:', error);
      throw error;
    }
  };

  // Helper function to find medication or service ID by name
  const findItemId = (itemName: string, itemType: 'medication' | 'service'): string | null => {
    if (itemType === 'medication') {
      const medication = medications.find(med => 
        med.name.toLowerCase() === itemName.toLowerCase() ||
        `${med.name} ${med.brand_name || ''}`.toLowerCase().includes(itemName.toLowerCase())
      );
      return medication?.id || null;
    } else {
      const service = services.find(svc => 
        svc.name.toLowerCase() === itemName.toLowerCase()
      );
      return service?.id || null;
    }
  };

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

      // First update the queue session with consultation data
      const sessionData = {
        consultation_notes: consultationData.notes,
        diagnosis: consultationData.diagnosis,
        prescribed_items: consultationData.treatmentItems.map(item => ({
          type: (item.dosage || item.frequency || item.duration) ? "medication" : "service",
          name: item.item,
          quantity: item.quantity,
          dosage: item.dosage || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          price: item.amount,
          instructions: item.instruction || null,
          rate: item.rate
        })),
        completed_at: new Date().toISOString(),
        doctor_id: doctorId
      };

      await updateQueueSessionData(queueId, sessionData);

      // Also update the session status to completed
      await supabase
        .from('queue_sessions')
        .update({ status: 'completed' })
        .eq('queue_id', queueId);
      
      // First, get or create a consultation session
      let consultationSessionId = activeConsultationSession;
      
      if (!consultationSessionId) {
        // Try to find an existing session for this queue entry
        const { data: existingSession } = await supabase
          .from('consultation_sessions')
          .select('id')
          .eq('patient_id', patientId)
          .eq('queue_id', queueId)
          .eq('status', 'active')
          .single();
          
        if (existingSession) {
          consultationSessionId = existingSession.id;
        } else {
          // Create a new consultation session
          const { data: newSession, error: sessionError } = await supabase
            .from('consultation_sessions')
            .insert({
              patient_id: patientId,
              doctor_id: doctorId,
              queue_id: queueId,
              status: 'active',
              urgency_level: 'normal'
            })
            .select('id')
            .single();

          if (sessionError) throw sessionError;
          consultationSessionId = newSession.id;
        }
      }

      // Store treatment items in the treatment_items table for dispensary access
      if (consultationData.treatmentItems && consultationData.treatmentItems.length > 0) {
        for (const item of consultationData.treatmentItems) {
          // Determine if it's a medication or service based on dosage info
          const isMedication = !!(item.dosage || item.frequency || item.duration);
          const itemType = isMedication ? 'medication' : 'service';
          const itemId = findItemId(item.item, itemType);
          
          await supabase.from('treatment_items').insert({
            consultation_session_id: consultationSessionId,
            item_type: itemType,
            medication_id: isMedication ? itemId : null,
            service_id: !isMedication ? itemId : null,
            quantity: item.quantity,
            dosage_instructions: item.dosage,
            frequency: item.frequency,
            duration_days: item.duration ? parseInt(item.duration.replace(/\D/g, '')) || null : null,
            rate: item.rate,
            total_amount: item.amount,
            notes: item.instruction,
            tier_id_used: item.priceTier,
            tier_price_applied: item.rate,
            original_price: item.rate
          });
        }
      }

      // Complete the consultation session
      await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', consultationSessionId);

      // Create consultation notes
      if (consultationData.notes || consultationData.diagnosis) {
        await supabase.from('consultation_notes').insert({
          appointment_id: null, // We don't have an appointment ID in this flow
          patient_id: patientId,
          doctor_id: doctorId,
          chief_complaint: consultationData.notes,
          diagnosis: consultationData.diagnosis,
          treatment_plan: consultationData.treatmentItems.length > 0 
            ? consultationData.treatmentItems.map(item => `${item.item} - ${item.dosage || 'As directed'}`).join(', ')
            : null
        });
      }
      
      // Create main consultation activity with detailed consultation notes
      const consultationTitle = 'Consultation Completed';
      const consultationContent = [];
      
      // Add consultation notes as the primary content
      if (consultationData.notes) {
        consultationContent.push(`Consultation Notes:\n${consultationData.notes}`);
      }
      
      // Add diagnosis if present
      if (consultationData.diagnosis) {
        consultationContent.push(`Diagnosis: ${consultationData.diagnosis}`);
      }
      
      // Add treatment summary
      if (consultationData.treatmentItems.length > 0) {
        consultationContent.push(`Treatment Items Prescribed: ${consultationData.treatmentItems.length}`);
        
        // Add detailed treatment list
        const treatmentDetails = consultationData.treatmentItems.map(item => {
          if (item.dosage || item.frequency || item.duration) {
            return `• ${item.item} - ${item.dosage || 'As directed'}, ${item.frequency || 'As needed'}${item.duration ? `, for ${item.duration}` : ''}`;
          } else {
            return `• ${item.item} (Service) - Qty: ${item.quantity}`;
          }
        }).join('\n');
        
        consultationContent.push(`\nPrescribed Items:\n${treatmentDetails}`);
      }

      const finalContent = consultationContent.length > 0 
        ? consultationContent.join('\n\n') 
        : 'Consultation completed successfully';

      await supabase.from('patient_activities').insert({
        patient_id: patientId,
        activity_type: 'consultation',
        activity_date: new Date().toISOString(),
        title: consultationTitle,
        content: finalContent,
        metadata: {
          queue_id: queueId,
          diagnosis: consultationData.diagnosis,
          consultation_date: new Date().toISOString().split('T')[0],
          total_items: consultationData.treatmentItems.length,
          consultation_notes: consultationData.notes // Store notes separately in metadata
        },
        staff_member_id: doctorId,
        priority: 'normal',
        status: 'completed'
      });

      // Process treatment items for patient history and dispensary
      if (consultationData.treatmentItems && consultationData.treatmentItems.length > 0) {
        // First, store treatment items in the treatment_items table for dispensary sync
        for (const item of consultationData.treatmentItems) {
          const isMedication = !!(item.dosage || item.frequency || item.duration);
          const itemType = isMedication ? 'medication' : 'service';
          const itemId = findItemId(item.item, itemType);
          
          await supabase.from('treatment_items').insert({
            consultation_session_id: consultationSessionId,
            item_type: itemType,
            medication_id: isMedication ? itemId : null,
            service_id: !isMedication ? itemId : null,
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            total_amount: item.amount || 0,
            dosage_instructions: item.dosage || null,
            frequency: item.frequency || null,
            duration_days: item.duration ? parseInt(item.duration.replace(/\D/g, '')) || null : null,
            notes: item.instruction || null,
            tier_id_used: item.priceTier || null,
            tier_price_applied: item.rate || null,
            original_price: item.rate || null
          });
        }

        // Then process for patient history
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

            // Create medication activity with enhanced details
            await supabase.from('patient_activities').insert({
              patient_id: patientId,
              activity_type: 'medication',
              activity_date: new Date().toISOString(),
              title: `Medication Prescribed: ${item.item}`,
              content: `Medication Details:\n• Medication: ${item.item}\n• Dosage: ${item.dosage || 'As directed'}\n• Frequency: ${item.frequency || 'As needed'}\n• Duration: ${item.duration || 'As prescribed'}\n• Instructions: ${item.instruction || 'Follow as prescribed'}${item.rate > 0 ? `\n• Cost: RM ${item.amount.toFixed(2)}` : ''}`,
              metadata: {
                medication_name: item.item,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instruction,
                amount: item.amount,
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

  // Real-time session data update function
  const updateSessionDataRealtime = async (
    queueId: string,
    consultationNotes: string,
    diagnosis: string,
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
    }>
  ) => {
    try {
      const doctorId = (await supabase.auth.getUser()).data.user?.id;
      
      const sessionData = {
        consultation_notes: consultationNotes,
        diagnosis: diagnosis,
        prescribed_items: treatmentItems.map(item => ({
          type: (item.dosage || item.frequency || item.duration) ? "medication" : "service",
          name: item.item,
          quantity: item.quantity,
          dosage: item.dosage || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          price: item.amount,
          instructions: item.instruction || null,
          rate: item.rate
        })),
        last_updated: new Date().toISOString(),
        doctor_id: doctorId
      };

      await updateQueueSessionData(queueId, sessionData);
    } catch (error) {
      console.error('Error updating session data realtime:', error);
    }
  };

  return {
    activeConsultationSession,
    startConsultationWorkflow,
    completeConsultationWorkflow,
    updateQueueSessionData,
    updateSessionDataRealtime
  };
}