import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Clock, UserPlus } from 'lucide-react';
import { useAppointmentWaitlist } from '@/hooks/useAppointmentWaitlist';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
  doctorId?: string;
  onSuccess?: () => void;
}

export function WaitlistModal({
  open,
  onOpenChange,
  patientId,
  doctorId,
  onSuccess
}: WaitlistModalProps) {
  const { loading, addToWaitlist } = useAppointmentWaitlist();
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    doctor_id: doctorId || '',
    service_type: '',
    preferred_date_start: '',
    preferred_date_end: '',
    preferred_time_start: '',
    preferred_time_end: '',
    duration_minutes: 30,
    priority: 'normal' as 'high' | 'normal' | 'low',
    notes: '',
    contact_preference: 'phone' as 'phone' | 'email' | 'sms'
  });

  const handleSubmit = async () => {
    if (!formData.patient_id) return;

    const result = await addToWaitlist(formData);
    if (result) {
      onSuccess?.();
      onOpenChange(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        service_type: '',
        preferred_date_start: '',
        preferred_date_end: '',
        preferred_time_start: '',
        preferred_time_end: '',
        duration_minutes: 30,
        priority: 'normal',
        notes: '',
        contact_preference: 'phone'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Add to Waitlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Start Date</Label>
              <Input
                type="date"
                value={formData.preferred_date_start}
                onChange={(e) => setFormData({ ...formData, preferred_date_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred End Date</Label>
              <Input
                type="date"
                value={formData.preferred_date_end}
                onChange={(e) => setFormData({ ...formData, preferred_date_end: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Start Time</Label>
              <Input
                type="time"
                value={formData.preferred_time_start}
                onChange={(e) => setFormData({ ...formData, preferred_time_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred End Time</Label>
              <Input
                type="time"
                value={formData.preferred_time_end}
                onChange={(e) => setFormData({ ...formData, preferred_time_end: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
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
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'high' | 'normal' | 'low') => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Type</Label>
            <Input
              placeholder="e.g., Consultation, Follow-up, Procedure"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Contact Preference</Label>
            <Select 
              value={formData.contact_preference} 
              onValueChange={(value: 'phone' | 'email' | 'sms') => setFormData({ ...formData, contact_preference: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes or requirements"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.patient_id}>
            {loading ? 'Adding...' : 'Add to Waitlist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}