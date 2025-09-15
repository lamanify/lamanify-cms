import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock, AlertTriangle, User } from 'lucide-react';
import { QueueEntry } from '@/hooks/useQueue';
import { PatientConsultationModal } from '@/components/consultation/PatientConsultationModal';
import { useConsultationWorkflow } from '@/hooks/useConsultationWorkflow';
import { useState, useEffect } from 'react';

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

  // Update selectedPatient when queue data changes (to reflect status updates)
  useEffect(() => {
    if (selectedPatient && isModalOpen) {
      const updatedPatient = queue.find(entry => entry.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }
    }
  }, [queue, selectedPatient, isModalOpen]);

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
    // Don't close modal - let it stay open for the doctor to continue
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
        
        // Mark queue entry as dispensary (ready for dispensary)
        onStatusChange(selectedPatient.id, 'dispensary');
        
        // Don't close modal - keep it open for updates
        // Modal will update its status via props/state changes
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
    if (status === 'dispensary') return 'bg-orange-500 text-white';
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
        return 'Serving';
      case 'completed':
        return 'Completed';
      case 'dispensary':
        return 'Dispensary';
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
            onClick={() => handlePatientClick(entry)}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:border-accent hover:bg-accent/5 hover:-translate-y-1 hover:shadow-lg ${
              entry.status === 'in_consultation' 
                ? 'border-info bg-info/5 shadow-sm' 
                : isPriority
                ? 'border-queue-priority bg-queue-priority/5 shadow-sm'
                : 'border-border'
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
                className="min-w-0 flex-1"
              >
                <div className="text-xl font-bold text-foreground hover:text-primary transition-colors">{entry.patient?.first_name} {entry.patient?.last_name}</div>
                <div className="flex items-center space-x-3 mt-1">
                  {entry.patient?.patient_id && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      ID: {entry.patient.patient_id}
                    </span>
                  )}
                  {entry.patient?.date_of_birth && (
                    <span className="text-sm text-muted-foreground">
                      {(() => {
                        const birthDate = new Date(entry.patient.date_of_birth);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                        return `${finalAge} years old`;
                      })()}
                      {' • '}
                      {entry.patient.gender ? 
                        entry.patient.gender.charAt(0).toUpperCase() + entry.patient.gender.slice(1).toLowerCase() 
                        : 'Unknown'}
                    </span>
                  )}
                  {/* Urgency indicator */}
                  {entry.status === 'urgent' || entry.status.includes('urgent') ? (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full border border-orange-200">
                      Urgent
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                      Non-urgent
                    </span>
                  )}
                </div>
                
                {/* Visit Notes */}
                {entry.patient?.visit_reason && (
                  <div className="text-sm text-muted-foreground mt-2 bg-muted/30 px-2 py-1 rounded">
                    Visit notes: {entry.patient.visit_reason}
                  </div>
                )}
                
                {/* Payment Method */}
                {entry.payment_method && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                      Payment: {entry.payment_method}
                    </span>
                    {entry.payment_method_notes && (
                      <span className="text-xs text-muted-foreground">
                        {entry.payment_method_notes}
                      </span>
                    )}
                  </div>
                )}
                
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