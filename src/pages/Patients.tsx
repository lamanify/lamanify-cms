import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPatientDialog } from '@/components/patients/EnhancedPatientDialog';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { DraftNotificationCard } from '@/components/patients/DraftNotificationCard';
import { Plus, Search, User, Phone, Mail } from 'lucide-react';

export interface Patient {
  id: string;
  patient_id?: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  referral_source?: string;
  visit_reason?: string;
  additional_notes?: string;
  assigned_tier_id?: string;
  created_at: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSaved = () => {
    fetchPatients();
    setIsEditDialogOpen(false);
    setSelectedPatient(null);
  };

  const handlePatientRegistered = () => {
    fetchPatients();
    setIsRegistrationModalOpen(false);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditDialogOpen(true);
  };

  const filteredPatients = patients.filter((patient) =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return <div>Loading patients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Management</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <Button onClick={() => setIsRegistrationModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Draft Notification */}
      <DraftNotificationCard onPatientRegistered={handlePatientRegistered} />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleEditPatient(patient)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {patient.first_name} {patient.last_name}
                  </p>
                  {patient.patient_id && (
                     <p className="text-xs text-muted-foreground font-mono">
                       ID: {patient.patient_id}
                     </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Age: {calculateAge(patient.date_of_birth)} • {patient.gender}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {patient.email}
                </div>
              )}
              {patient.allergies && (
                <div>
                  <Badge variant="outline" className="text-xs">
                    Allergies: {patient.allergies}
                  </Badge>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Registered: {new Date(patient.created_at || Date.now()).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              {searchTerm ? 'No patients found' : 'No patients registered'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first patient'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsRegistrationModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <EnhancedPatientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        patient={selectedPatient}
        onSave={handlePatientSaved}
      />

      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onPatientRegistered={handlePatientRegistered}
      />
    </div>
  );
}