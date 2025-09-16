import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generatePatientId } from '@/lib/patientIdGenerator';
import { UserPlus, Search, ClipboardList, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

interface QuickRegistrationData {
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nric: string;
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

  const [quickRegData, setQuickRegData] = useState<QuickRegistrationData>({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nric: ''
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
      await addToQueue(selectedPatient.id, visitData.assignedDoctorId || undefined);
      
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

  const handleQuickRegister = async () => {
    setLoading(true);
    try {
      // Split name
      const nameParts = quickRegData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Generate patient ID
      const patientId = await generatePatientId();

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: quickRegData.dateOfBirth,
          gender: quickRegData.gender.toLowerCase(),
          phone: quickRegData.phone,
          additional_notes: quickRegData.nric ? `NRIC: ${quickRegData.nric}` : '',
          visit_reason: visitData.reason || 'consultation',
          created_by: profile?.id
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Add to queue
      await addToQueue(patient.id, visitData.assignedDoctorId || undefined);

      // Create registration activity
      await supabase
        .from('patient_activities')
        .insert({
          patient_id: patient.id,
          activity_type: 'registration',
          title: 'Quick Registration & Queue',
          content: `New patient registered and added to queue`,
          staff_member_id: profile?.id,
          metadata: {
            registration_type: 'quick',
            visit_reason: visitData.reason,
            payment_method: visitData.paymentMethod,
            payment_notes: visitData.paymentNotes,
            is_urgent: visitData.isUrgent,
            assigned_doctor: visitData.assignedDoctorId,
            visit_notes: visitData.visitNotes
          }
        });

      toast({
        title: "Patient registered and queued",
        description: `${quickRegData.name} has been registered and added to the queue`,
      });

      // Reset form
      setQuickRegData({
        name: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        nric: ''
      });
      setVisitData({
        reason: '',
        paymentMethod: 'self_pay',
        paymentNotes: '',
        isUrgent: false,
        assignedDoctorId: '',
        visitNotes: ''
      });
      setMode('search');
    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: "Error",
        description: "Failed to register patient",
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
        <div className="flex gap-2">
          <Button
            variant={mode === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('search')}
          >
            <Search className="h-4 w-4 mr-1" />
            Search Existing
          </Button>
          <Button
            variant={mode === 'register' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('register')}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Quick Register
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={quickRegData.name}
                  onChange={(e) => setQuickRegData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={quickRegData.phone}
                  onChange={(e) => setQuickRegData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={quickRegData.dateOfBirth}
                  onChange={(e) => setQuickRegData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={quickRegData.gender} 
                  onValueChange={(value) => setQuickRegData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nric">NRIC/ID (Optional)</Label>
                <Input
                  id="nric"
                  value={quickRegData.nric}
                  onChange={(e) => setQuickRegData(prev => ({ ...prev, nric: e.target.value }))}
                  placeholder="NRIC or ID number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Visit Information Section */}
        {(selectedPatient || (mode === 'register' && quickRegData.name)) && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <SelectContent>
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
                  <SelectContent>
                    <SelectItem value="">No specific doctor</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visit-notes">Visit Notes</Label>
                <Textarea
                  id="visit-notes"
                  value={visitData.visitNotes}
                  onChange={(e) => setVisitData(prev => ({ ...prev, visitNotes: e.target.value }))}
                  placeholder="Any additional notes for this visit..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  checked={visitData.isUrgent}
                  onCheckedChange={(checked) => setVisitData(prev => ({ ...prev, isUrgent: !!checked }))}
                />
                <Label htmlFor="urgent" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Mark as Urgent
                </Label>
              </div>

              {visitData.paymentMethod !== 'self_pay' && (
                <div>
                  <Label htmlFor="payment-notes">Payment Notes</Label>
                  <Input
                    id="payment-notes"
                    value={visitData.paymentNotes}
                    onChange={(e) => setVisitData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                    placeholder="Insurance details, company name, etc."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {selectedPatient && (
          <Button 
            onClick={handleAddExistingToQueue}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Adding to Queue...' : 'Add to Queue'}
          </Button>
        )}

        {mode === 'register' && quickRegData.name && quickRegData.phone && quickRegData.dateOfBirth && quickRegData.gender && (
          <Button 
            onClick={handleQuickRegister}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Registering...' : 'Register & Add to Queue'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}