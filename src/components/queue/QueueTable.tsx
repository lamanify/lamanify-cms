import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock, AlertTriangle, User } from 'lucide-react';
import { QueueEntry } from '@/hooks/useQueue';
import { PatientConsultationModal } from '@/components/consultation/PatientConsultationModal';
import { useConsultationWorkflow } from '@/hooks/useConsultationWorkflow';
import { useState } from 'react';

interface QueueTableProps {
  queue: QueueEntry[];
  onStatusChange: (queueId: string, newStatus: string) => void;
  onRemoveFromQueue: (queueId: string) => void;
  isPaused: boolean;
}

export function QueueTable({ queue, onStatusChange, onRemoveFromQueue, isPaused }: QueueTableProps) {
  const [selectedPatient, setSelectedPatient] = useState<QueueEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { completeConsultationWorkflow } = useConsultationWorkflow();

  const handlePatientClick = (entry: QueueEntry) => {
    setSelectedPatient(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleStartConsultation = (queueId: string) => {
    onStatusChange(queueId, 'in_consultation');
    setIsModalOpen(false);
  };

  const handleCallPatient = (queueId: string) => {
    // Logic for calling patient - could be notification, announcement system, etc.
    console.log('Calling patient:', queueId);
  };

  const handleMarkDone = async (consultationData: { notes: string; diagnosis: string; treatmentItems: any[] }) => {
    if (selectedPatient && selectedPatient.patient) {
      try {
        // Complete consultation workflow with patient activity sync
        await completeConsultationWorkflow(
          selectedPatient.patient.id,
          selectedPatient.id,
          consultationData
        );
        
        // Mark queue entry as completed
        onStatusChange(selectedPatient.id, 'completed');
        
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error marking consultation as done:', error);
      }
    }
  };
  const getWaitTime = (checkedInAt: string) => {
    const now = new Date();
    const checkedIn = new Date(checkedInAt);
    const diffMinutes = Math.floor((now.getTime() - checkedIn.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const getStatusColor = (status: string, waitTime: number, isPriority = false) => {
    if (isPriority) return 'bg-queue-priority text-queue-priority-foreground';
    if (status === 'completed') return 'bg-success text-success-foreground';
    if (status === 'in_consultation') return 'bg-info text-info-foreground';
    if (status === 'cancelled') return 'bg-destructive text-destructive-foreground';
    
    // Wait time based colors for waiting patients
    if (waitTime >= 45) return 'bg-queue-urgent text-destructive-foreground';
    if (waitTime >= 20) return 'bg-queue-waiting text-warning-foreground';
    return 'bg-queue-new text-success-foreground';
  };

  const getWaitTimeAlert = (waitTime: number) => {
    if (waitTime >= 45) return 'text-queue-urgent';
    if (waitTime >= 20) return 'text-queue-waiting';
    return 'text-muted-foreground';
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  if (queue.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No patients in queue today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isPaused && (
        <div className="flex items-center justify-center p-3 bg-warning/10 border border-warning rounded-lg">
          <AlertTriangle className="h-5 w-5 text-warning mr-2" />
          <span className="text-warning font-medium">Queue is paused</span>
        </div>
      )}
      
      {queue.map((entry) => {
        const waitTime = getWaitTime(entry.checked_in_at);
        const isPriority = entry.status.includes('priority');
        
        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              entry.status === 'in_consultation' 
                ? 'border-info bg-info/5 shadow-sm' 
                : isPriority
                ? 'border-queue-priority bg-queue-priority/5 shadow-sm'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center space-x-6">
              {/* Queue Number and Status */}
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {entry.queue_number}
                  </div>
                  <Badge 
                    className={`text-xs ${getStatusColor(entry.status, waitTime, isPriority)}`}
                  >
                    {getStatusLabel(entry.status)}
                  </Badge>
                </div>
              </div>

              {/* Patient Info */}
              <div 
                className="min-w-0 flex-1 cursor-pointer hover:bg-muted/30 rounded p-3 -m-3 transition-colors group"
                onClick={() => handlePatientClick(entry)}
              >
                <div className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {entry.patient?.first_name} {entry.patient?.last_name}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  {entry.patient?.patient_id && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      ID: {entry.patient.patient_id}
                    </span>
                  )}
                  {entry.patient?.phone && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {entry.patient.phone}
                    </div>
                  )}
                  {entry.payment_method && entry.payment_method !== 'Self pay' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {entry.payment_method}
                      {entry.payment_method_notes && ` • ${entry.payment_method_notes}`}
                    </span>
                  )}
                </div>
                {entry.doctor && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Dr. {entry.doctor.first_name} {entry.doctor.last_name}
                  </div>
                )}
              </div>

              {/* Check-in Time and Wait Time */}
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Check-in: {new Date(entry.checked_in_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className={`text-sm font-medium flex items-center ${getWaitTimeAlert(waitTime)}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  Wait: {formatWaitTime(waitTime)}
                  {waitTime >= 45 && <AlertTriangle className="h-3 w-3 ml-1" />}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {entry.status === 'waiting' && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(entry.id, 'in_consultation')}
                >
                  Start Consultation
                </Button>
              )}
              
              {entry.status === 'in_consultation' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(entry.id, 'completed')}
                >
                  Mark Complete
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveFromQueue(entry.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}
      
      {/* Patient Consultation Modal */}
      <PatientConsultationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        queueEntry={selectedPatient}
        onStartConsultation={handleStartConsultation}
        onCallPatient={handleCallPatient}
        onMarkDone={handleMarkDone}
      />
    </div>
  );
}