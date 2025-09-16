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
  activeFilter?: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function QueueStats({ stats, activeFilter, onFilterChange }: QueueStatsProps) {
  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleFilterClick = (filter: string | null) => {
    // Toggle filter: if clicking the same filter, clear it; otherwise set new filter
    onFilterChange(activeFilter === filter ? null : filter);
  };

  const getCardClassName = (filter: string | null) => {
    const baseClass = "transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-105";
    const activeClass = "ring-2 ring-primary shadow-lg scale-105";
    const inactiveClass = "hover:bg-muted/50";
    
    return `${baseClass} ${activeFilter === filter ? activeClass : inactiveClass}`;
  };

  return (
    <div className="space-y-4">
      {/* Clickable filter cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className={getCardClassName(null)} onClick={() => handleFilterClick(null)}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Today</div>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardClassName('waiting')} onClick={() => handleFilterClick('waiting')}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-queue-waiting" />
              <div className="text-2xl font-bold">{stats.waiting}</div>
              <div className="text-sm text-muted-foreground">Waiting</div>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardClassName('in_consultation')} onClick={() => handleFilterClick('in_consultation')}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-info" />
              <div className="text-2xl font-bold">{stats.inConsultation}</div>
              <div className="text-sm text-muted-foreground">In Consultation</div>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardClassName('dispensary')} onClick={() => handleFilterClick('dispensary')}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Pill className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.dispensary || 0}</div>
              <div className="text-sm text-muted-foreground">Dispensary</div>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardClassName('completed')} onClick={() => handleFilterClick('completed')}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wait time stats - non-clickable, moved below */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-info" />
              <div className="text-xl font-bold">{formatWaitTime(stats.averageWaitTime)}</div>
              <div className="text-sm text-muted-foreground">Avg Wait</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-queue-urgent" />
              <div className="text-xl font-bold">{formatWaitTime(stats.longestWaitTime)}</div>
              <div className="text-sm text-muted-foreground">Longest Wait</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}