import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';
import { ConsultationNote } from '@/pages/Consultations';

interface ConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation?: ConsultationNote | null;
  onSave: () => void;
}

export function ConsultationDialog({ open, onOpenChange, consultation, onSave }: ConsultationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const { updateQueueStatus, queue } = useQueue();

  const [formData, setFormData] = useState({
    appointment_id: '',
    patient_id: '',
    chief_complaint: '',
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    prescriptions: '',
    follow_up_instructions: '',
    vital_signs: {
      temperature: '',
      blood_pressure: '',
      heart_rate: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      weight: '',
      height: ''
    }
  });

  useEffect(() => {
    // Auto-update queue status when consultation starts
    if (open && formData.patient_id && profile?.id) {
      const today = new Date().toISOString().split('T')[0];
      const queueEntry = queue.find(entry => 
        entry.patient_id === formData.patient_id && 
        entry.queue_date === today && 
        entry.status === 'waiting'
      );
      
      if (queueEntry) {
        updateQueueStatus(queueEntry.id, 'in_consultation', profile.id);
      }
    }
  }, [open, formData.patient_id, profile?.id, queue, updateQueueStatus]);

  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchAppointments();
    }
  }, [open]);

  useEffect(() => {
    if (consultation) {
      setFormData({
        appointment_id: consultation.appointment_id,
        patient_id: consultation.patient_id,
        chief_complaint: consultation.chief_complaint || '',
        symptoms: consultation.symptoms || '',
        diagnosis: consultation.diagnosis || '',
        treatment_plan: consultation.treatment_plan || '',
        prescriptions: consultation.prescriptions || '',
        follow_up_instructions: consultation.follow_up_instructions || '',
        vital_signs: consultation.vital_signs || {
          temperature: '',
          blood_pressure: '',
          heart_rate: '',
          respiratory_rate: '',
          oxygen_saturation: '',
          weight: '',
          height: ''
        }
      });
    } else {
      setFormData({
        appointment_id: '',
        patient_id: '',
        chief_complaint: '',
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        prescriptions: '',
        follow_up_instructions: '',
        vital_signs: {
          temperature: '',
          blood_pressure: '',
          heart_rate: '',
          respiratory_rate: '',
          oxygen_saturation: '',
          weight: '',
          height: ''
        }
      });
    }
  }, [consultation, open]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time,
          patients (first_name, last_name)
        `)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        doctor_id: profile.id,
        vital_signs: formData.vital_signs
      };

      if (consultation) {
        const { error } = await supabase
          .from('consultation_notes')
          .update(submitData)
          .eq('id', consultation.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Consultation note updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('consultation_notes')
          .insert(submitData);

        if (error) throw error;

        // Update queue status to completed
        const today = new Date().toISOString().split('T')[0];
        const queueEntry = queue.find(entry => 
          entry.patient_id === formData.patient_id && 
          entry.queue_date === today && 
          entry.status === 'in_consultation'
        );
        
        if (queueEntry) {
          await updateQueueStatus(queueEntry.id, 'completed');
        }

        toast({
          title: "Success",
          description: "Consultation note added successfully. Patient marked as completed in queue.",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: `Failed to ${consultation ? 'update' : 'add'} consultation note`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {consultation ? 'Edit Consultation Note' : 'Add New Consultation Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient and Appointment Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_id">Related Appointment</Label>
              <Select
                value={formData.appointment_id}
                onValueChange={(value) => setFormData({ ...formData, appointment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointment.patients?.first_name} {appointment.patients?.last_name} - {new Date(appointment.appointment_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chief Complaint and Symptoms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint</Label>
              <Input
                id="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                placeholder="Patient's main concern or reason for visit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                rows={3}
                placeholder="Detailed description of symptoms"
              />
            </div>
          </div>

          {/* Vital Signs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vital Signs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  value={formData.vital_signs.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    vital_signs: { ...formData.vital_signs, temperature: e.target.value }
                  })}
                  placeholder="98.6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_pressure">Blood Pressure</Label>
                <Input
                  id="blood_pressure"
                  value={formData.vital_signs.blood_pressure}
                  onChange={(e) => setFormData({
                    ...formData,
                    vital_signs: { ...formData.vital_signs, blood_pressure: e.target.value }
                  })}
                  placeholder="120/80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  value={formData.vital_signs.heart_rate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vital_signs: { ...formData.vital_signs, heart_rate: e.target.value }
                  })}
                  placeholder="72"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
                <Input
                  id="oxygen_saturation"
                  value={formData.vital_signs.oxygen_saturation}
                  onChange={(e) => setFormData({
                    ...formData,
                    vital_signs: { ...formData.vital_signs, oxygen_saturation: e.target.value }
                  })}
                  placeholder="98"
                />
              </div>
            </div>
          </div>

          {/* Diagnosis and Treatment */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
                placeholder="Medical diagnosis and assessment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_plan">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                value={formData.treatment_plan}
                onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                rows={3}
                placeholder="Recommended treatment and care plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescriptions">Prescriptions</Label>
              <Textarea
                id="prescriptions"
                value={formData.prescriptions}
                onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
                rows={3}
                placeholder="Medications prescribed (name, dosage, frequency)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_instructions">Follow-up Instructions</Label>
              <Textarea
                id="follow_up_instructions"
                value={formData.follow_up_instructions}
                onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                rows={2}
                placeholder="Next steps and follow-up care instructions"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : consultation ? 'Update Note' : 'Save Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}