import { CalendarView as Calendar } from '@/components/appointments/CalendarView';

export default function CalendarView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendar View</h1>
        <p className="text-muted-foreground">Manage appointments with drag-and-drop calendar interface</p>
      </div>
      
      <Calendar />
    </div>
  );
}