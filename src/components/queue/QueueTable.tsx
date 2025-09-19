import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock, AlertTriangle, User, MapPin, CreditCard } from 'lucide-react';
import { QueueEntry } from '@/hooks/useQueue';
import { PatientConsultationModal } from '@/components/consultation/PatientConsultationModal';
import { DispensaryModal } from '@/components/queue/DispensaryModal';
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
  const [isDispensaryModalOpen, setIsDispensaryModalOpen] = useState(false);
  const [removedEntries, setRemovedEntries] = useState<Set<string>>(new Set());
  const { completeConsultationWorkflow } = useConsultationWorkflow();

  const handleOptimisticRemove = async (queueId: string) => {
    // Immediately hide the patient from UI
    setRemovedEntries(prev => new Set(prev).add(queueId));
    
    try {
      // Process backend removal
      await onRemoveFromQueue(queueId);
    } catch (error) {
      // If backend operation fails, restore the patient
      setRemovedEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(queueId);
        return newSet;
      });
      console.error('Failed to remove patient from queue:', error);
    }
  };

  // Filter out optimistically removed entries
  const displayQueue = queue.filter(entry => !removedEntries.has(entry.id));
  // Update selectedPatient when queue data changes (to reflect status updates)
  useEffect(() => {
    if (selectedPatient && isModalOpen) {
      const updatedPatient = displayQueue.find(entry => entry.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }
    }
  }, [displayQueue, selectedPatient, isModalOpen]);

  const handlePatientClick = (entry: QueueEntry) => {
    setSelectedPatient(entry);
    if (entry.status === 'dispensary') {
      setIsDispensaryModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleCloseDispensaryModal = () => {
    setIsDispensaryModalOpen(false);
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
      case 'urgent':
        return 'Urgent';
      default:
        return status;
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'self_pay':
        return 'Self Pay';
      case 'insurance':
        return 'Insurance';
      case 'company':
        return 'Company';
      case 'government':
        return 'Government';
      default:
        return method;
    }
  };

  if (displayQueue.length === 0) {
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
      
      {displayQueue.map((entry) => {
        const waitTime = getWaitTime(entry.checked_in_at);
        const isPriority = entry.status === 'urgent' || entry.status.includes('urgent');
        
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
            <div className="flex items-center space-x-6 flex-1">
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
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                  {entry.patient?.first_name} {entry.patient?.last_name}
                </div>
                
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
                </div>
                
                {/* Visit Context and Additional Info */}
                <div className="flex items-center flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                  {entry.patient?.visit_reason && (
                    <span className="bg-secondary/50 px-2 py-1 rounded-md">
                      {entry.patient.visit_reason}
                    </span>
                  )}
                  
                  {entry.patient?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {entry.patient.phone}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.checked_in_at).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </div>
                
                {/* Payment Method and Doctor Assignment */}
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {entry.payment_method && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-blue-500" />
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                        {getPaymentMethodDisplay(entry.payment_method)}
                      </span>
                    </div>
                  )}
                  
                  {entry.assigned_doctor_id && entry.doctor && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200">
                      Dr. {entry.doctor.first_name} {entry.doctor.last_name}
                    </span>
                  )}
                </div>
                
                {/* Visit Notes */}
                {entry.patient?.medical_history && (
                  <div className="text-sm text-muted-foreground mt-2 bg-muted/30 px-2 py-1 rounded max-w-md truncate">
                    Notes: {entry.patient.medical_history}
                  </div>
                )}
              </div>

              {/* Wait Time Display */}
              <div className="text-right">
                <div className={`text-lg font-medium flex items-center ${getWaitTimeAlert(waitTime)}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {formatWaitTime(waitTime)}
                  {waitTime >= 45 && <AlertTriangle className="h-4 w-4 ml-1" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  Wait time
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {entry.status === 'waiting' && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(entry.id, 'in_consultation');
                  }}
                >
                  Start Consultation
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptimisticRemove(entry.id);
                }}
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

      {/* Dispensary Modal */}
      <DispensaryModal
        isOpen={isDispensaryModalOpen}
        onClose={handleCloseDispensaryModal}
        queueEntry={selectedPatient}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
