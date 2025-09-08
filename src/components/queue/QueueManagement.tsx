import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Users, UserCheck, CheckCircle, Play, Phone } from 'lucide-react';

export function QueueManagement() {
  const { queue, loading, currentNumber, callNextPatient, updateQueueStatus, getTodayStats } = useQueue();
  const { profile } = useAuth();
  const [callingNext, setCallingNext] = useState(false);

  const stats = getTodayStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'in_consultation':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'in_consultation':
        return 'In Consultation';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      await callNextPatient();
    } finally {
      setCallingNext(false);
    }
  };

  const handleStatusChange = async (queueId: string, newStatus: string) => {
    await updateQueueStatus(queueId, newStatus as any, profile?.id);
  };

  if (loading) {
    return <div>Loading queue...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Queue Number Display */}
      <Card className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Current Queue Number</CardTitle>
          <div className="text-6xl font-bold mt-4">
            {currentNumber || '---'}
          </div>
        </CardHeader>
      </Card>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Today</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.waiting}</div>
              <div className="text-sm text-muted-foreground">Waiting</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.inConsultation}</div>
              <div className="text-sm text-muted-foreground">In Consultation</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Next Patient Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleCallNext}
          disabled={callingNext || !queue.some(q => q.status === 'waiting')}
          className="text-lg px-8 py-3"
        >
          <Play className="mr-2 h-5 w-5" />
          {callingNext ? 'Calling...' : 'Call Next Patient'}
        </Button>
      </div>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Patient Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patients in queue today
              </div>
            ) : (
              queue.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.status === 'in_consultation' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status)}`} />
                      <span className="text-2xl font-bold text-primary">
                        {entry.queue_number}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {entry.patient?.first_name} {entry.patient?.last_name}
                      </div>
                      {entry.patient?.phone && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {entry.patient.phone}
                        </div>
                      )}
                      {entry.doctor && (
                        <div className="text-sm text-muted-foreground">
                          Dr. {entry.doctor.first_name} {entry.doctor.last_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {getStatusLabel(entry.status)}
                    </Badge>
                    
                    {entry.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(entry.id, 'in_consultation')}
                      >
                        Start Consultation
                      </Button>
                    )}
                    
                    {entry.status === 'in_consultation' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(entry.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}

                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.checked_in_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}