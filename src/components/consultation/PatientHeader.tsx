import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, User, Calendar, Clock, MapPin } from 'lucide-react';
import { ConsultationTimer } from './ConsultationTimer';

interface PatientHeaderProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender?: string;
    phone?: string;
    allergies?: string;
    address?: string;
  };
  session: {
    id: string;
    started_at: string;
    paused_at?: string;
    status: 'active' | 'paused' | 'completed';
  };
  queueNumber?: string;
}

export function PatientHeader({ patient, session, queueNumber }: PatientHeaderProps) {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Patient Basic Info */}
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {patient.first_name} {patient.last_name}
                </h2>
                {queueNumber && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {queueNumber}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Age: {calculateAge(patient.date_of_birth)} years</span>
                </div>
                
                {patient.gender && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Gender: {patient.gender}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>ID: {patient.id.slice(0, 8)}</span>
                </div>
              </div>

              {patient.phone && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Phone: {patient.phone}
                </div>
              )}

              {patient.address && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timer and Alerts */}
          <div className="text-right space-y-3">
            <ConsultationTimer 
              startedAt={session.started_at}
              pausedAt={session.paused_at}
              status={session.status}
            />
            
            <div className="text-xs text-muted-foreground">
              Started: {new Date(session.started_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Allergy Alert */}
        {patient.allergies && (
          <div className="mt-4 p-3 bg-queue-urgent/10 border border-queue-urgent/30 rounded-lg">
            <div className="flex items-center gap-2 text-queue-urgent font-medium">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">ALLERGY ALERT:</span>
              <span>{patient.allergies}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}