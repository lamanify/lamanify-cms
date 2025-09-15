import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, UserCheck, CheckCircle, Pill } from 'lucide-react';

interface QueueStatsProps {
  stats: {
    total: number;
    waiting: number;
    inConsultation: number;
    completed: number;
    dispensary?: number;
    averageWaitTime: number;
    longestWaitTime: number;
  };
}

export function QueueStats({ stats }: QueueStatsProps) {
  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
            <Clock className="h-8 w-8 mx-auto mb-2 text-queue-waiting" />
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <div className="text-sm text-muted-foreground">Waiting</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-info" />
            <div className="text-2xl font-bold">{stats.inConsultation}</div>
            <div className="text-sm text-muted-foreground">In Consultation</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Pill className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.dispensary || 0}</div>
            <div className="text-sm text-muted-foreground">Dispensary</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-info" />
            <div className="text-xl font-bold">{formatWaitTime(stats.averageWaitTime)}</div>
            <div className="text-sm text-muted-foreground">Avg Wait</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-queue-urgent" />
            <div className="text-xl font-bold">{formatWaitTime(stats.longestWaitTime)}</div>
            <div className="text-sm text-muted-foreground">Longest Wait</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}