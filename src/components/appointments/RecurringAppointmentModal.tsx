import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { useRecurringAppointments } from '@/hooks/useRecurringAppointments';

interface RecurringAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSuccess?: () => void;
}

export function RecurringAppointmentModal({
  open,
  onOpenChange,
  appointmentId,
  onSuccess
}: RecurringAppointmentModalProps) {
  const { loading, createRecurringAppointments } = useRecurringAppointments();
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState<'date' | 'occurrences'>('occurrences');
  const [endDate, setEndDate] = useState<Date>();
  const [maxOccurrences, setMaxOccurrences] = useState(10);

  const handleSubmit = async () => {
    const pattern = {
      frequency,
      interval,
      ...(endType === 'date' && endDate ? { end_date: format(endDate, 'yyyy-MM-dd') } : {}),
      ...(endType === 'occurrences' ? { max_occurrences: maxOccurrences } : {})
    };

    const result = await createRecurringAppointments(appointmentId, pattern);
    if (result) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Create Recurring Appointments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Repeat Frequency</Label>
            <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Repeat Every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="12"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {frequency === 'daily' ? 'day(s)' : frequency === 'weekly' ? 'week(s)' : 'month(s)'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>End</Label>
            <Select value={endType} onValueChange={(value: any) => setEndType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occurrences">After number of appointments</SelectItem>
                <SelectItem value="date">On specific date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {endType === 'occurrences' && (
            <div className="space-y-2">
              <Label>Number of Appointments</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={maxOccurrences}
                onChange={(e) => setMaxOccurrences(parseInt(e.target.value) || 10)}
              />
            </div>
          )}

          {endType === 'date' && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Series'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}