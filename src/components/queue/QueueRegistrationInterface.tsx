import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { QuickRegisterForm } from './QuickRegisterForm';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus, ClipboardList } from 'lucide-react';
import { Patient } from '@/pages/Patients';

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

export function QueueRegistrationInterface() {
  const [mode, setMode] = useState<'search' | 'register'>('search');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { addToQueue } = useQueue();
  const { profile } = useAuth();

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .eq('status', 'active');

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

  const handleAddExistingToQueue = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      // Add to queue
      await addToQueue(selectedPatient.id, visitData.assignedDoctorId === "none" ? undefined : visitData.assignedDoctorId);
      
      // Create patient activity for visit
      await supabase
        .from('patient_activities')
        .insert({
          patient_id: selectedPatient.id,
          activity_type: 'visit',
          title: 'Added to Queue',
          content: `Patient added to queue for ${visitData.reason || 'consultation'}`,
          staff_member_id: profile?.id,
          metadata: {
            visit_reason: visitData.reason,
            payment_method: visitData.paymentMethod,
            payment_notes: visitData.paymentNotes,
            is_urgent: visitData.isUrgent,
            assigned_doctor: visitData.assignedDoctorId,
            visit_notes: visitData.visitNotes
          }
        });

      toast({
        title: "Patient added to queue",
        description: `${selectedPatient.first_name} ${selectedPatient.last_name} has been added to the queue`,
      });

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
    } catch (error) {
      console.error('Error adding patient to queue:', error);
      toast({
        title: "Error",
        description: "Failed to add patient to queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Find & Add to Queue
        </CardTitle>
        
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('search')}
            className={mode === 'search' ? 'bg-white text-foreground hover:bg-white/90' : ''}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Existing
          </Button>
          <Button
            variant={mode === 'register' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('register')}
            className={mode === 'register' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Quick Register
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {mode === 'search' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient-search">Search Patient</Label>
              <PatientSearch
                onPatientSelect={handlePatientSelect}
                placeholder="Search by name or phone number..."
              />
            </div>

            {selectedPatient && (
              <Card className="bg-muted/50">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Visit Information for existing patient */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reason">Visit Reason</Label>
                        <Input
                          id="reason"
                          value={visitData.reason}
                          onChange={(e) => setVisitData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="e.g., General consultation, Follow-up"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment">Payment Method</Label>
                        <Select 
                          value={visitData.paymentMethod} 
                          onValueChange={(value) => setVisitData(prev => ({ ...prev, paymentMethod: value }))}
                        >
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
                      <Select 
                        value={visitData.assignedDoctorId} 
                        onValueChange={(value) => setVisitData(prev => ({ ...prev, assignedDoctorId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor (optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="none">No specific doctor</SelectItem>
                          {doctors.map((doctor) => {
                            console.log('QueueRegistration doctor:', doctor);
                            return (
                              <SelectItem key={doctor.id} value={doctor.id || 'unknown'}>
                                Dr. {doctor.first_name} {doctor.last_name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleAddExistingToQueue}
                      disabled={loading}
                      size="lg"
                      className="w-full"
                    >
                      {loading ? 'Adding to Queue...' : 'Add to Queue'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <QuickRegisterForm />
        )}
      </CardContent>
    </Card>
  );
}