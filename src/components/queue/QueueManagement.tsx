import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, UserPlus, Pause, PlayCircle } from 'lucide-react';
import { QueueStats } from './QueueStats';
import { CurrentQueueDisplay } from './CurrentQueueDisplay';
import { QueueTable } from './QueueTable';
import { FloatingActions } from './FloatingActions';
import { QueueRegistrationInterface } from './QueueRegistrationInterface';

export function QueueManagement() {
  const { queue, loading, currentNumber, callNextPatient, updateQueueStatus, getTodayStats, refetch } = useQueue();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [callingNext, setCallingNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<string | null>(null);

  const stats = getTodayStats();
  
  // Get current patient info for display
  const currentPatient = queue.find(q => q.status === 'in_consultation');
  
  // Filter queue based on selected filter
  const filteredQueue = queueFilter 
    ? queue.filter(q => q.status === queueFilter)
    : queue;
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        refetch();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch, isPaused]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmTpL3v');
      audio.play().catch(() => {
        // Fallback to system notification if audio fails
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Next Patient Called', {
            body: `Queue number ${currentNumber} is being called`,
            icon: '/favicon.ico'
          });
        }
      });
    } catch (error) {
      console.log('Audio notification failed');
    }
  };

  const handleCallNext = async () => {
    if (isPaused) {
      toast({
        title: "Queue is paused",
        description: "Please resume the queue to call the next patient.",
        variant: "destructive",
      });
      return;
    }
    
    setCallingNext(true);
    try {
      await callNextPatient();
      playNotificationSound();
      toast({
        title: "Next patient called",
        description: "Patient has been notified to proceed for consultation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to call next patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCallingNext(false);
    }
  };

  const handleStatusChange = async (queueId: string, newStatus: string) => {
    try {
      await updateQueueStatus(queueId, newStatus as any, profile?.id);
      toast({
        title: "Status updated",
        description: `Patient status changed to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = async (queueId: string) => {
    try {
      await updateQueueStatus(queueId, 'cancelled', profile?.id);
      toast({
        title: "Patient removed",
        description: "Patient has been removed from the queue",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove patient from queue",
        variant: "destructive",
      });
    }
  };

  const handleAddPriorityPatient = () => {
    toast({
      title: "Feature coming soon",
      description: "Priority patient functionality will be available soon",
    });
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Queue refreshed",
        description: "Latest queue data has been loaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh queue data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  const handlePrintSummary = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Queue Summary</title></head>
          <body>
            <h1>Queue Summary - ${new Date().toLocaleDateString()}</h1>
            <p>Total Patients: ${stats.total}</p>
            <p>Waiting: ${stats.waiting}</p>
            <p>In Consultation: ${stats.inConsultation}</p>
            <p>At Dispensary: ${stats.dispensary || 0}</p>
            <p>Completed: ${stats.completed}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleOpenSettings = () => {
    toast({
      title: "Settings",
      description: "Queue settings panel coming soon",
    });
  };

  if (loading) {
    return <div>Loading queue...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Registration Interface */}
      <QueueRegistrationInterface />

      {/* Current Queue Display */}
      <CurrentQueueDisplay 
        currentNumber={currentNumber}
        currentPatient={currentPatient ? {
          firstName: currentPatient.patient?.first_name || '',
          lastName: currentPatient.patient?.last_name || '',
          patientId: currentPatient.patient?.patient_id
        } : null}
        isServing={!!currentPatient}
      />

      {/* Queue Statistics */}
      <QueueStats 
        stats={{
          ...stats,
          averageWaitTime: Math.round(
            queue.filter(q => q.status === 'waiting').reduce((acc, entry) => {
              const waitTime = Math.floor((new Date().getTime() - new Date(entry.checked_in_at).getTime()) / (1000 * 60));
              return acc + waitTime;
            }, 0) / Math.max(stats.waiting, 1)
          ),
          longestWaitTime: Math.max(
            ...queue.filter(q => q.status === 'waiting').map(entry => 
              Math.floor((new Date().getTime() - new Date(entry.checked_in_at).getTime()) / (1000 * 60))
            ),
            0
          )
        }}
        activeFilter={queueFilter}
        onFilterChange={setQueueFilter}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          variant="priority"
          size="lg" 
          onClick={handleCallNext}
          disabled={callingNext || !queue.some(q => q.status === 'waiting') || isPaused}
          className="text-lg px-8 py-3"
        >
          <Play className="mr-2 h-5 w-5" />
          {callingNext ? 'Calling...' : 'Call Next Patient'}
        </Button>
        
        <Button 
          variant="outline"
          size="lg"
          onClick={handleAddPriorityPatient}
          className="text-lg px-6 py-3"
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Add Priority Patient
        </Button>
        
        <Button 
          variant={isPaused ? "default" : "secondary"}
          size="lg"
          onClick={() => setIsPaused(!isPaused)}
          className="text-lg px-6 py-3"
        >
          {isPaused ? <PlayCircle className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
          {isPaused ? 'Resume Queue' : 'Pause Queue'}
        </Button>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {queueFilter 
              ? `${queueFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Patients`
              : "Today's Patient Queue"
            }
            {queueFilter && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredQueue.length} patients)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QueueTable 
            queue={filteredQueue}
            onStatusChange={handleStatusChange}
            onRemoveFromQueue={handleRemoveFromQueue}
            isPaused={isPaused}
          />
        </CardContent>
      </Card>

      {/* Floating Action Buttons */}
      <FloatingActions 
        onRefresh={handleRefresh}
        onPrintSummary={handlePrintSummary}
        onOpenSettings={handleOpenSettings}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}