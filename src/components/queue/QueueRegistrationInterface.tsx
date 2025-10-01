import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { QuickRegisterForm } from './QuickRegisterForm';
import { QueueTicket } from './QueueTicket';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus, ClipboardList, Printer } from 'lucide-react';
import { Patient } from '@/pages/Patients';
import { createRoot } from 'react-dom/client';
interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}
interface VisitData {
  reason: string;
  paymentMethod: string;
  paymentNotes: string;
  isUrgent: boolean;
  assignedDoctorId: string;
  visitNotes: string;
}
interface QueueRegistrationInterfaceProps {
  onPatientAdded?: () => Promise<void>;
}
export function QueueRegistrationInterface({
  onPatientAdded
}: QueueRegistrationInterfaceProps) {
  const [mode, setMode] = useState<'search' | 'register'>('search');
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastQueueData, setLastQueueData] = useState<{
    queueNumber: string;
    patientName: string;
    timestamp: Date;
  } | null>(null);
  const {
    toast
  } = useToast();
  const {
    addToQueue
  } = useQueue();
  const {
    profile
  } = useAuth();
  const [visitData, setVisitData] = useState<VisitData>({
    reason: '',
    paymentMethod: 'self_pay',
    paymentNotes: '',
    isUrgent: false,
    assignedDoctorId: '',
    visitNotes: ''
  });
  const fetchDoctors = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'doctor').eq('status', 'active');
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handlePrintTicket = () => {
    if (!lastQueueData) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Print Blocked",
          description: "Please allow popups to print tickets",
          variant: "destructive"
        });
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Queue Ticket - ${lastQueueData.queueNumber}</title>
          </head>
          <body>
            <div id="ticket-root"></div>
          </body>
        </html>
      `);
      printWindow.document.close();

      const ticketRoot = printWindow.document.getElementById('ticket-root');
      if (ticketRoot) {
        const root = createRoot(ticketRoot);
        root.render(
          <QueueTicket
            queueNumber={lastQueueData.queueNumber}
            patientName={lastQueueData.patientName}
            timestamp={lastQueueData.timestamp}
          />
        );

        setTimeout(() => {
          printWindow.print();
          
          printWindow.onafterprint = () => {
            toast({
              title: "Print Successful",
              description: "Queue ticket printed successfully"
            });
            printWindow.close();
          };
        }, 500);
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Unable to print ticket. Queue number: " + lastQueueData.queueNumber,
        variant: "destructive"
      });
    }
  };
  const handleAddExistingToQueue = async () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient first",
        variant: "destructive"
      });
      return;
    }
    if (!visitData.reason.trim()) {
      toast({
        title: "Visit Notes Required",
        description: "Please provide visit notes",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      console.log('Adding existing patient to queue:', {
        patientId: selectedPatient.id,
        visitData,
        assignedDoctor: visitData.assignedDoctorId
      });

      // Add to queue first
      const queueResult = await addToQueue(selectedPatient.id, visitData.assignedDoctorId === "none" || !visitData.assignedDoctorId ? undefined : visitData.assignedDoctorId);
      console.log('Queue addition result:', queueResult);

      // Update patient's visit notes if provided
      if (visitData.reason.trim()) {
        const {
          error: updateError
        } = await supabase.from('patients').update({
          additional_notes: visitData.reason,
          visit_reason: 'consultation' // Default to consultation
        }).eq('id', selectedPatient.id);
        if (updateError) {
          console.warn('Failed to update patient visit notes:', updateError);
        }
      }

      // Create patient activity for visit
      const {
        error: activityError
      } = await supabase.from('patient_activities').insert({
        patient_id: selectedPatient.id,
        activity_type: 'visit',
        title: 'Added to Queue',
        content: `Patient added to queue for consultation${visitData.reason ? `\nNotes: ${visitData.reason}` : ''}`,
        staff_member_id: profile?.id,
        metadata: {
          queue_id: queueResult?.entry?.id,
          visit_reason: visitData.reason,
          payment_method: visitData.paymentMethod,
          payment_notes: visitData.paymentNotes,
          is_urgent: visitData.isUrgent,
          assigned_doctor: visitData.assignedDoctorId === "none" ? null : visitData.assignedDoctorId,
          visit_notes: visitData.visitNotes,
          queue_number: queueResult?.queueNumber
        }
      });
      if (activityError) {
        console.warn('Failed to create patient activity:', activityError);
        // Don't fail the whole operation for this
      }
      // Store queue data for printing
      if (queueResult?.queueNumber) {
        setLastQueueData({
          queueNumber: queueResult.queueNumber,
          patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          timestamp: new Date()
        });
      }

      toast({
        title: "Patient added to queue",
        description: `${selectedPatient.first_name} ${selectedPatient.last_name} has been added to the queue${queueResult?.queueNumber ? ` (${queueResult.queueNumber})` : ''}`
      });

      // Manual refresh to ensure immediate UI update
      console.log('Manually refreshing queue after adding patient');
      if (onPatientAdded) {
        try {
          await onPatientAdded();
          console.log('Manual queue refresh completed successfully');
        } catch (error) {
          console.error('Manual queue refresh failed:', error);
        }
      }

      // Reset form
      setSelectedPatient(null);
      setVisitData({
        reason: '',
        paymentMethod: 'self_pay',
        paymentNotes: '',
        isUrgent: false,
        assignedDoctorId: '',
        visitNotes: ''
      });
    } catch (error: any) {
      console.error('Error adding patient to queue:', error);
      let errorMessage = "Failed to add patient to queue";
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Find & Add to Queue
        </CardTitle>
        
        {/* Search Input and Quick Register Button Inline */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="patient-search" className="text-sm font-medium">Search Patient</Label>
            <PatientSearch onPatientSelect={handlePatientSelect} placeholder="Search by name or phone number..." />
          </div>
          <div className="flex-shrink-0">
            <Label className="text-sm font-medium text-transparent">Action</Label>
            <Button size="default" onClick={() => {
              console.log('Quick Register button clicked');
              console.log('Current quickRegisterOpen state:', quickRegisterOpen);
              setQuickRegisterOpen(true);
              console.log('Set quickRegisterOpen to true');
            }} className="bg-green-600 hover:bg-green-700 text-white w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Quick Register
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedPatient && <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedPatient.patient_id} | Phone: {selectedPatient.phone || 'N/A'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                  Clear
                </Button>
              </div>

              {/* Visit Information for existing patient */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reason">Visit Notes *</Label>
                    <Input id="reason" value={visitData.reason} onChange={e => setVisitData(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))} placeholder="e.g., Headache symptoms, follow-up checkup" className={!visitData.reason.trim() ? 'border-destructive' : ''} />
                    {!visitData.reason.trim() && <p className="text-xs text-destructive mt-1">State the reason of visit.</p>}
                  </div>
                  <div>
                    <Label htmlFor="payment">Payment Method</Label>
                    <Select value={visitData.paymentMethod} onValueChange={value => setVisitData(prev => ({
                    ...prev,
                    paymentMethod: value
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="self_pay">Self Pay</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="doctor">Assign Doctor (Optional)</Label>
                  <Select value={visitData.assignedDoctorId} onValueChange={value => setVisitData(prev => ({
                  ...prev,
                  assignedDoctorId: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="none">No specific doctor</SelectItem>
                      {doctors.map(doctor => {
                      console.log('QueueRegistration doctor:', doctor);
                      return <SelectItem key={doctor.id} value={doctor.id || 'unknown'}>
                            Dr. {doctor.first_name} {doctor.last_name}
                          </SelectItem>;
                    })}
                    </SelectContent>
                  </Select>
                </div>

                 <div className="flex gap-2">
                   <Button onClick={handleAddExistingToQueue} disabled={loading || !visitData.reason.trim()} size="lg" className="flex-1">
                     {loading ? 'Adding to Queue...' : 'Add to Queue'}
                   </Button>
                   
                   {lastQueueData && (
                     <Button onClick={handlePrintTicket} variant="outline" size="lg" className="gap-2">
                       <Printer className="h-4 w-4" />
                       Print Ticket
                     </Button>
                   )}
                 </div>
              </div>
            </CardContent>
          </Card>}
      </CardContent>
    </Card>

    <QuickRegisterForm isOpen={quickRegisterOpen} onClose={() => {
      console.log('Closing QuickRegisterForm modal');
      setQuickRegisterOpen(false);
    }} />
    </>;
}