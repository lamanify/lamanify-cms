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
    <div className="bg-background rounded-lg border border-border p-4">
      <h3 className="font-semibold mb-4">Upcoming Appointments</h3>
      
      <div className="space-y-4">
        {mockAppointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={appointment.patientAvatar} />
              <AvatarFallback>
                {appointment.patientName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
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