import { Clock, Users, UserCheck, CheckCircle, Pill } from 'lucide-react';

interface CompactQueueStatsProps {
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

export function CompactQueueStats({ stats, activeFilter, onFilterChange }: CompactQueueStatsProps) {
  const handleFilterClick = (filter: string | null) => {
    onFilterChange(activeFilter === filter ? null : filter);
  };

  const getRowClassName = (filter: string | null) => {
    const baseClass = "cursor-pointer hover:bg-muted/50 transition-colors border-l-2";
    const activeClass = "border-primary bg-muted/30";
    const inactiveClass = "border-transparent";
    
    return `${baseClass} ${activeFilter === filter ? activeClass : inactiveClass}`;
  };

  const statusRows = [
    { 
      label: 'Total Today', 
      value: stats.total, 
      icon: Users, 
      filter: null,
      color: 'text-muted-foreground'
    },
    { 
      label: 'Waiting', 
      value: stats.waiting, 
      icon: Clock, 
      filter: 'waiting',
      color: 'text-orange-600'
    },
    { 
      label: 'In Consultation', 
      value: stats.inConsultation, 
      icon: UserCheck, 
      filter: 'in_consultation',
      color: 'text-blue-600'
    },
    { 
      label: 'Dispensary', 
      value: stats.dispensary || 0, 
      icon: Pill, 
      filter: 'dispensary',
      color: 'text-purple-600'
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      icon: CheckCircle, 
      filter: 'completed',
      color: 'text-green-600'
    },
  ];

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Queue Status</h3>
        
        {/* Status Table */}
        <div className="space-y-1">
          {statusRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className={getRowClassName(row.filter)}
                onClick={() => handleFilterClick(row.filter)}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${row.color}`} />
                    <span className="text-sm font-medium">{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{row.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wait Time Stats */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avg Wait:</span>
              <span className="font-medium">{formatWaitTime(stats.averageWaitTime)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Max Wait:</span>
              <span className="font-medium">{formatWaitTime(stats.longestWaitTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}