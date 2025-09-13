import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Pause, Play } from 'lucide-react';

interface ConsultationTimerProps {
  startedAt: string;
  pausedAt?: string;
  status: 'active' | 'paused' | 'completed';
}

export function ConsultationTimer({ startedAt, pausedAt, status }: ConsultationTimerProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      
      if (status === 'paused' && pausedAt) {
        const pauseTime = new Date(pausedAt).getTime();
        setDuration(Math.floor((pauseTime - start) / 1000));
      } else if (status === 'active') {
        setDuration(Math.floor((now - start) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, pausedAt, status]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'paused':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Badge className={`text-lg px-4 py-2 ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="font-mono font-bold">
          {formatDuration(duration)}
        </span>
        <span className="text-sm opacity-90">
          {status === 'paused' && '(Paused)'}
        </span>
      </div>
    </Badge>
  );
}