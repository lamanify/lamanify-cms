import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Appointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  purpose: string;
  time: string;
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'Mark M.',
    purpose: 'Health Assessment',
    time: '08:45am'
  },
  {
    id: '2',
    patientName: 'Adina G.',
    purpose: 'Consultation Cardiology',
    time: '11:15am'
  },
  {
    id: '3',
    patientName: 'Joey F.',
    purpose: "Ensure your child's wellness.",
    time: '12:45pm'
  }
];

export function UpcomingAppointments() {
  return (
    <div>
      <h3 className="text-lg font-medium mb-6">Upcoming Appointments</h3>
      
      <div className="space-y-4">
        {mockAppointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center gap-4 py-3 border-b border-border last:border-b-0">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {appointment.patientName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{appointment.patientName}</p>
              <p className="text-xs text-muted-foreground truncate">{appointment.purpose}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {appointment.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}