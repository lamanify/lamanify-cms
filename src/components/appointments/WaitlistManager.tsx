import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Mail, MessageSquare, X, CheckCircle } from 'lucide-react';
import { useAppointmentWaitlist } from '@/hooks/useAppointmentWaitlist';
import { WaitlistModal } from './WaitlistModal';

export function WaitlistManager() {
  const { waitlist, loading, removeFromWaitlist } = useAppointmentWaitlist();
  const [showAddModal, setShowAddModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getContactIcon = (preference: string) => {
    switch (preference) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return 'Any date';
    if (start && end) return `${start} to ${end}`;
    if (start) return `From ${start}`;
    if (end) return `Until ${end}`;
    return 'Any date';
  };

  const formatTimeRange = (start?: string, end?: string) => {
    if (!start && !end) return 'Any time';
    if (start && end) return `${start} - ${end}`;
    if (start) return `From ${start}`;
    if (end) return `Until ${end}`;
    return 'Any time';
  };

  if (loading) {
    return <div className="p-6 text-center">Loading waitlist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Appointment Waitlist</h2>
          <p className="text-muted-foreground">
            {waitlist.length} patient{waitlist.length !== 1 ? 's' : ''} waiting for appointments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <User className="mr-2 h-4 w-4" />
          Add to Waitlist
        </Button>
      </div>

      {waitlist.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No one waiting</h3>
            <p className="text-muted-foreground">
              The waitlist is empty. Patients will appear here when they request earlier appointment slots.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {waitlist.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {entry.patients?.first_name} {entry.patients?.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPriorityColor(entry.priority)}>
                          {entry.priority} priority
                        </Badge>
                        {entry.service_type && (
                          <Badge variant="outline">{entry.service_type}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromWaitlist(entry.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Fulfilled
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromWaitlist(entry.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Preferred Dates</h4>
                    <p className="text-muted-foreground">
                      {formatDateRange(entry.preferred_date_start, entry.preferred_date_end)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Preferred Times</h4>
                    <p className="text-muted-foreground">
                      {formatTimeRange(entry.preferred_time_start, entry.preferred_time_end)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contact</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getContactIcon(entry.contact_preference)}
                      <span className="capitalize">{entry.contact_preference}</span>
                    </div>
                    {entry.contact_preference === 'phone' && entry.patients?.phone && (
                      <p className="text-sm mt-1">{entry.patients.phone}</p>
                    )}
                    {entry.contact_preference === 'email' && entry.patients?.email && (
                      <p className="text-sm mt-1">{entry.patients.email}</p>
                    )}
                  </div>
                </div>
                
                {entry.notes && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WaitlistModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => setShowAddModal(false)}
      />
    </div>
  );
}