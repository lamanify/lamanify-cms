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
    const baseClass = "transition-colors cursor-pointer hover:bg-muted/50 border-b-2";
    const activeClass = "border-primary bg-muted/30";
    const inactiveClass = "border-transparent";
    
    return `${baseClass} ${activeFilter === filter ? activeClass : inactiveClass}`;
  };

  return (
    <div className="space-y-4">
      {/* Clickable filter cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        <div className={getCardClassName(null)} onClick={() => handleFilterClick(null)}>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="text-xl font-medium">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Today</div>
            </div>
          </div>
        </div>

        <div className={getCardClassName('waiting')} onClick={() => handleFilterClick('waiting')}>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="text-xl font-medium">{stats.waiting}</div>
              <div className="text-sm text-muted-foreground">Waiting</div>
            </div>
          </div>
        </div>

        <div className={getCardClassName('in_consultation')} onClick={() => handleFilterClick('in_consultation')}>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="text-xl font-medium">{stats.inConsultation}</div>
              <div className="text-sm text-muted-foreground">In Consultation</div>
            </div>
          </div>
        </div>

        <div className={getCardClassName('dispensary')} onClick={() => handleFilterClick('dispensary')}>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Pill className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="text-xl font-medium">{stats.dispensary || 0}</div>
              <div className="text-sm text-muted-foreground">Dispensary</div>
            </div>
          </div>
        </div>

        <div className={getCardClassName('completed')} onClick={() => handleFilterClick('completed')}>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <div className="text-xl font-medium">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wait time stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-md mx-auto pt-8 border-t border-border">
        <div className="text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-lg font-medium">{formatWaitTime(stats.averageWaitTime)}</div>
          <div className="text-sm text-muted-foreground">Average Wait</div>
        </div>

        <div className="text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-lg font-medium">{formatWaitTime(stats.longestWaitTime)}</div>
          <div className="text-sm text-muted-foreground">Longest Wait</div>
        </div>
      </div>
    </div>
  );
}