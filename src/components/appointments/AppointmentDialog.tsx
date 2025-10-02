import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/pages/Appointments';
import { RecurringAppointmentModal } from './RecurringAppointmentModal';
import { ResourceSelectionModal } from './ResourceSelectionModal';
import { useResources } from '@/hooks/useResources';
import { Button as UIButton } from '@/components/ui/button';
import { Repeat, MapPin, Plus } from 'lucide-react';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSave: (newAppointment?: Appointment) => void;
  preSelectedPatient?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export function AppointmentDialog({ open, onOpenChange, appointment, onSave, preSelectedPatient }: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [newAppointmentId, setNewAppointmentId] = useState<string | null>(null);
  const { assignResourceToAppointment } = useResources();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: null as string | null,
    doctor_id: null as string | null,
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    status: 'scheduled',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchDoctors();
    }
  }, [open]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
      });
    } else {
      // Reset form for new appointment, but pre-select patient if provided
      setFormData({
        patient_id: preSelectedPatient?.id || null,
        doctor_id: null,
        appointment_date: '',
        appointment_time: '',
        duration_minutes: 30,
        status: 'scheduled',
        reason: '',
        notes: '',
      });
    }
  }, [appointment, preSelectedPatient, open]);

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

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['doctor', 'admin'])
        .order('first_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.patient_id) {
      toast({
        title: "Validation Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!formData.doctor_id) {
      toast({
        title: "Validation Error", 
        description: "Please select a doctor",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!formData.appointment_date) {
      toast({
        title: "Validation Error",
        description: "Please select an appointment date",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!formData.appointment_time) {
      toast({
        title: "Validation Error",
        description: "Please select an appointment time",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (appointment) {
        const { error } = await supabase
          .from('appointments')
          .update(formData)
          .eq('id', appointment.id);

        if (error) throw error;

        // Update resource assignments
        if (selectedResources.length > 0) {
          await assignResourceToAppointment(appointment.id, selectedResources);
        }

        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        // Get patient and doctor names for optimistic update
        const patient = patients.find(p => p.id === formData.patient_id);
        const doctor = doctors.find(d => d.id === formData.doctor_id);

        // Create optimistic appointment object
        const optimisticAppointment = {
          id: crypto.randomUUID(), // Temporary ID
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          patients: {
            first_name: patient?.first_name || '',
            last_name: patient?.last_name || '',
          },
          profiles: {
            first_name: doctor?.first_name || '',
            last_name: doctor?.last_name || '',
          },
        };

        // Call onSave with optimistic data immediately
        onSave(optimisticAppointment as any);

        // Then save to database
        const { data, error } = await supabase
          .from('appointments')
          .insert(formData)
          .select(`
            *,
            patients (first_name, last_name),
            profiles!appointments_doctor_id_fkey (first_name, last_name)
          `)
          .single();

        if (error) throw error;

        // Assign resources to new appointment
        if (selectedResources.length > 0 && data) {
          await assignResourceToAppointment(data.id, selectedResources);
        }

        // Store new appointment ID for recurring appointments
        setNewAppointmentId(data?.id || null);

        toast({
          title: "Success",
          description: "Appointment scheduled successfully",
        });
      }

      // For updates, also call onSave to refresh
      if (appointment) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: `Failed to ${appointment ? 'update' : 'schedule'} appointment`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient *</Label>
              <Select
                value={formData.patient_id || ''}
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
              <Label htmlFor="doctor_id">Doctor *</Label>
              <Select
                value={formData.doctor_id || ''}
                onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">Time *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (min) *</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Regular checkup, Follow-up, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="space-y-2">
            <Label>Resources</Label>
            <div className="flex items-center gap-2">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResourceModal(true)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Select Resources ({selectedResources.length})
              </UIButton>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : appointment ? 'Update Appointment' : 'Schedule Appointment'}
            </Button>
            {!appointment && newAppointmentId && (
              <UIButton
                type="button"
                variant="secondary"
                onClick={() => setShowRecurringModal(true)}
                className="flex items-center gap-2"
              >
                <Repeat className="h-4 w-4" />
                Make Recurring
              </UIButton>
            )}
          </DialogFooter>
        </form>
      </DialogContent>

      <RecurringAppointmentModal
        open={showRecurringModal}
        onOpenChange={setShowRecurringModal}
        appointmentId={newAppointmentId || ''}
        onSuccess={() => {
          onSave();
          setShowRecurringModal(false);
          onOpenChange(false);
        }}
      />

      <ResourceSelectionModal
        open={showResourceModal}
        onOpenChange={setShowResourceModal}
        selectedResources={selectedResources}
        onResourcesChange={setSelectedResources}
        appointmentDate={formData.appointment_date}
        appointmentTime={formData.appointment_time}
        durationMinutes={formData.duration_minutes}
        excludeAppointmentId={appointment?.id}
      />
    </Dialog>
  );
}