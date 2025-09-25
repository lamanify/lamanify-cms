import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Phone, Clock, AlertTriangle, User, MapPin, CreditCard, ChevronDown } from 'lucide-react';
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

  const getWaitTime = (entry: any) => {
    const checkedIn = new Date(entry.checked_in_at);
    let endTime: Date;
    
    if (entry.status === 'completed' && entry.consultation_completed_at) {
      endTime = new Date(entry.consultation_completed_at);
    } else {
      endTime = new Date();
    }
    
    const diffMinutes = Math.floor((endTime.getTime() - checkedIn.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const getStatusColor = (status: string, waitTime: number, isPriority = false) => {
    if (isPriority) return 'bg-queue-priority text-queue-priority-foreground';
    if (status === 'completed') return 'bg-gray-100 text-gray-700 border-gray-300';
    if (status === 'waiting') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'dispensary') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'in_consultation') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'urgent') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'cancelled') return 'bg-destructive text-destructive-foreground';
    
    // Default fallback
    return 'bg-muted text-muted-foreground border-muted';
  };

  const getStatusDropdownOptions = (currentStatus: string) => {
    const options = [];
    
    // Always show revert to waiting option (except for completed)
    if (currentStatus !== 'waiting' && currentStatus !== 'completed') {
      options.push({ value: 'waiting', label: 'Mark as Waiting' });
    }
    
    // Urgent option for waiting patients
    if (currentStatus === 'waiting') {
      options.push({ value: 'urgent', label: 'Mark as Urgent' });
    }
    
    // Forward progression options
    if (currentStatus === 'urgent' || currentStatus === 'waiting') {
      options.push({ value: 'in_consultation', label: 'Start Consultation' });
    }
    
    if (currentStatus === 'in_consultation') {
      options.push({ value: 'dispensary', label: 'Move to Dispensary' });
    }
    
    if (currentStatus === 'dispensary') {
      options.push({ value: 'completed', label: 'Mark Complete' });
    }
    
    return options;
  };

  const getWaitTimeAlert = (waitTime: number) => {
    if (waitTime >= 15) return 'text-red-600 font-semibold';
    if (waitTime >= 10) return 'text-orange-600';
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
    <div className="space-y-6">
      {isPaused && (
        <div className="flex items-center justify-center p-3 bg-warning/10 border border-warning rounded-lg animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-warning mr-2" />
          <span className="text-warning font-medium">Queue is paused</span>
        </div>
      )}
      
      {(() => {
        // Separate urgent and regular patients
        const urgentPatients = displayQueue.filter(entry => 
          entry.status === 'urgent' || 
          ((entry.patient as any)?.urgency_level === 'urgent' || (entry.patient as any)?.urgency_level === 'high')
        );
        const waitingPatients = displayQueue.filter(entry => 
          entry.status === 'waiting' && 
          !((entry.patient as any)?.urgency_level === 'urgent' || (entry.patient as any)?.urgency_level === 'high')
        );
        const otherPatients = displayQueue.filter(entry => 
          !['waiting', 'urgent'].includes(entry.status) &&
          !((entry.patient as any)?.urgency_level === 'urgent' || (entry.patient as any)?.urgency_level === 'high')
        );

        return (
          <>
            {/* Urgent Patients Section */}
            {urgentPatients.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 pb-2 border-b border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                  <h3 className="text-lg font-semibold text-destructive">Urgent ({urgentPatients.length})</h3>
                </div>
                <div className="space-y-3">
                  {urgentPatients.map((entry) => {
                    const waitTime = getWaitTime(entry);
                    
                    return (
                       <div
                         key={entry.id}
                         onClick={() => handlePatientClick(entry)}
                         className="flex items-center p-4 pr-16 rounded-lg border-2 border-destructive/30 bg-destructive/5 transition-all duration-200 cursor-pointer hover:border-destructive hover:bg-destructive/10 hover:-translate-y-1 hover:shadow-lg animate-scale-in"
                       >
                         {/* Queue Number and Status - 20% */}
                         <div className="w-[20%] flex flex-col items-center space-y-1">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <div className="text-center cursor-pointer hover:bg-destructive/20 rounded-md p-2 transition-colors">
                                 <div className="text-2xl font-bold flex items-center gap-1 text-destructive">
                                   {entry.queue_number}
                                   <ChevronDown className="h-4 w-4" />
                                 </div>
                                 <Badge variant="destructive" className="text-xs animate-pulse">
                                   URGENT
                                 </Badge>
                               </div>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent>
                               {getStatusDropdownOptions(entry.status).map((option) => (
                                 <DropdownMenuItem 
                                   key={option.value}
                                   onClick={() => onStatusChange(entry.id, option.value)}
                                 >
                                   {option.label}
                                 </DropdownMenuItem>
                               ))}
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>

                         {/* Patient Info (Name) - 15% */}
                         <div className="w-[15%] px-2">
                           <div className="font-semibold text-lg text-foreground mb-2">
                             {entry.patient?.first_name} {entry.patient?.last_name}
                           </div>
                           <div className="flex items-center gap-2">
                             {entry.patient?.gender && (
                               <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                 {entry.patient.gender.charAt(0).toUpperCase()}
                               </span>
                             )}
                             {entry.patient?.date_of_birth && (
                               <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                 {new Date().getFullYear() - new Date(entry.patient.date_of_birth).getFullYear()}
                               </span>
                             )}
                           </div>
                         </div>

                          {/* Visit Notes - 30% */}
                          <div className="w-[30%] px-2">
                            <div className="text-xs text-muted-foreground mb-1">Visit Notes</div>
                            <div className="text-sm text-foreground truncate">
                            {entry.patient?.visit_reason || 'No notes'}
                            </div>
                          </div>

                         {/* Payment Method - 10% */}
                         <div className="w-[10%] px-2">
                           <div className="text-xs text-muted-foreground mb-1">Payment</div>
                           <div className="text-sm font-medium">
                             {(entry.patient as any)?.payment_method ? 
                               getPaymentMethodDisplay((entry.patient as any).payment_method) : 
                               'Not set'
                             }
                           </div>
                         </div>

                         {/* Arrived - 12.5% */}
                         <div className="w-[12.5%] px-2">
                           <div className="text-center">
                             <div className="text-xs text-muted-foreground">Arrived</div>
                             <div className="text-sm font-medium">
                               {new Date(entry.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </div>
                           </div>
                         </div>

                         {/* Wait Time - 12.5% */}
                         <div className="w-[12.5%] px-2">
                           <div className="text-center">
                             <div className="text-xs text-muted-foreground">Wait Time</div>
                             <div className={`text-sm font-medium flex items-center justify-center gap-1 ${getWaitTimeAlert(waitTime)}`}>
                               <Clock className="h-3 w-3" />
                               {formatWaitTime(waitTime)}
                             </div>
                           </div>
                         </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(entry.id, 'in_consultation');
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Start Now
                          </Button>

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
                </div>
              </div>
            )}

            {/* Waiting Patients Section */}
            {waitingPatients.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Waiting ({waitingPatients.length})</h3>
                </div>
                <div className="space-y-3">
                  {waitingPatients.map((entry) => {
                    const waitTime = getWaitTime(entry);
                    
                    return (
                      <div
                        key={entry.id}
                        onClick={() => handlePatientClick(entry)}
                        className="flex items-center p-4 pr-16 rounded-lg border transition-all duration-200 cursor-pointer hover:border-accent hover:bg-accent/5 hover:-translate-y-1 hover:shadow-lg bg-white"
                      >
                        {/* Queue Number and Status - 20% */}
                        <div className="w-[20%] flex flex-col items-center space-y-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="text-center cursor-pointer hover:bg-accent/20 rounded-md p-2 transition-colors">
                                <div className="text-2xl font-bold flex items-center gap-1 text-primary">
                                  {entry.queue_number}
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                                 <Badge className={`text-xs border ${getStatusColor(entry.status, waitTime)}`}>
                                   {getStatusLabel(entry.status)}
                                 </Badge>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {getStatusDropdownOptions(entry.status).map((option) => (
                                <DropdownMenuItem 
                                  key={option.value}
                                  onClick={() => onStatusChange(entry.id, option.value)}
                                >
                                  {option.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Patient Info (Name) - 15% */}
                        <div className="w-[15%] px-2">
                          <div className="font-semibold text-lg text-foreground mb-2">
                            {entry.patient?.first_name} {entry.patient?.last_name}
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.patient?.gender && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                {entry.patient.gender.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {entry.patient?.date_of_birth && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                {new Date().getFullYear() - new Date(entry.patient.date_of_birth).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>

                          {/* Visit Notes - 30% */}
                          <div className="w-[30%] px-2">
                            <div className="text-xs text-muted-foreground mb-1">Visit Notes</div>
                            <div className="text-sm text-foreground truncate">
                            {entry.patient?.visit_reason || 'No notes'}
                            </div>
                          </div>

                        {/* Payment Method - 10% */}
                        <div className="w-[10%] px-2">
                          <div className="text-xs text-muted-foreground mb-1">Payment</div>
                          <div className="text-sm font-medium">
                            {(entry.patient as any)?.payment_method ? 
                              getPaymentMethodDisplay((entry.patient as any).payment_method) : 
                              'Not set'
                            }
                          </div>
                        </div>

                        {/* Arrived - 12.5% */}
                        <div className="w-[12.5%] px-2">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Arrived</div>
                            <div className="text-sm font-medium">
                              {new Date(entry.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>

                        {/* Wait Time - 12.5% */}
                        <div className="w-[12.5%] px-2">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Wait Time</div>
                            <div className={`text-sm font-medium flex items-center justify-center gap-1 ${getWaitTimeAlert(waitTime)}`}>
                              <Clock className="h-3 w-3" />
                              {formatWaitTime(waitTime)}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(entry.id, 'in_consultation');
                            }}
                          >
                            Start Consultation
                          </Button>

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
                </div>
              </div>
            )}

            {/* Other Status Patients (In Consultation, Dispensary, etc.) */}
            {otherPatients.length > 0 && (
              <div className="space-y-3">
                {otherPatients.map((entry) => {
                  const waitTime = getWaitTime(entry);
                  
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handlePatientClick(entry)}
                      className={`flex items-center p-4 pr-16 rounded-lg border transition-all duration-200 cursor-pointer hover:border-accent hover:bg-accent/5 hover:-translate-y-1 hover:shadow-lg ${
                        entry.status === 'completed' ? 'bg-gray-100' :
                        'bg-white'
                      }`}
                    >
                      {/* Queue Number and Status - 20% */}
                      <div className="w-[20%] flex flex-col items-center space-y-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="text-center cursor-pointer hover:bg-accent/20 rounded-md p-2 transition-colors">
                              <div className={`text-2xl font-bold flex items-center gap-1 ${entry.status === 'completed' ? 'text-gray-500' : 'text-primary'}`}>
                                {entry.queue_number}
                                <ChevronDown className="h-4 w-4" />
                              </div>
                              <Badge className={`text-xs border ${getStatusColor(entry.status, waitTime)}`}>
                                {getStatusLabel(entry.status)}
                              </Badge>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {getStatusDropdownOptions(entry.status).map((option) => (
                              <DropdownMenuItem 
                                key={option.value}
                                onClick={() => onStatusChange(entry.id, option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Patient Info (Name) - 15% */}
                      <div className="w-[15%] px-2">
                        <div className="font-semibold text-lg text-foreground mb-2">
                          {entry.patient?.first_name} {entry.patient?.last_name}
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.patient?.gender && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              {entry.patient.gender.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {entry.patient?.date_of_birth && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              {new Date().getFullYear() - new Date(entry.patient.date_of_birth).getFullYear()}
                            </span>
                          )}
                        </div>
                      </div>

                          {/* Visit Notes - 30% */}
                          <div className="w-[30%] px-2">
                            <div className="text-xs text-muted-foreground mb-1">Visit Notes</div>
                            <div className="text-sm text-foreground truncate">
                              {entry.patient?.visit_reason || 'No notes'}
                            </div>
                          </div>

                      {/* Payment Method - 10% */}
                      <div className="w-[10%] px-2">
                        <div className="text-xs text-muted-foreground mb-1">Payment</div>
                        <div className="text-sm font-medium">
                          {(entry.patient as any)?.payment_method ? 
                            getPaymentMethodDisplay((entry.patient as any).payment_method) : 
                            'Not set'
                          }
                        </div>
                      </div>

                      {/* Arrived - 12.5% */}
                      <div className="w-[12.5%] px-2">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Arrived</div>
                          <div className="text-sm font-medium">
                            {new Date(entry.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>

                      {/* Wait Time - 12.5% */}
                      <div className="w-[12.5%] px-2">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Wait Time</div>
                          <div className={`text-sm font-medium flex items-center justify-center gap-1 ${getWaitTimeAlert(waitTime)}`}>
                            <Clock className="h-3 w-3" />
                            {formatWaitTime(waitTime)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {entry.status === 'in_consultation' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(entry.id, 'dispensary');
                            }}
                          >
                            Move to Dispensary
                          </Button>
                        )}

                        {entry.status === 'dispensary' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(entry.id, 'completed');
                            }}
                          >
                            Mark Complete
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
              </div>
            )}
          </>
        );
      })()}
      
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
