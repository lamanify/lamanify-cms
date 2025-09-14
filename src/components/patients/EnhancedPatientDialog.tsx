import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/ui/phone-input';
import { PatientSearch } from './PatientSearch';
import { ActivityHistoryTab } from './ActivityHistoryTab';
import { MedicalSummaryTab } from './MedicalSummaryTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { usePatientActivities } from '@/hooks/usePatientActivities';
import { Patient } from '@/pages/Patients';
import { generatePatientId } from '@/lib/patientIdGenerator';
import { Calendar, AlertCircle, User, Activity, FileText, X } from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function EnhancedPatientDialog({ open, onOpenChange, patient, onSave }: EnhancedPatientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [age, setAge] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();
  const { addToQueue } = useQueue();
  
  // Only initialize activities hook if we have a patient (for activity logging)
  const patientActivities = usePatientActivities(patient?.id);
  const { createActivity } = patientActivities;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    secondary_phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    referral_source: '',
    visit_reason: '',
    additional_notes: ''
  });

  useEffect(() => {
    if (open) {
      if (patient) {
        // Edit mode - populate form with patient data
        setFormData({
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          preferred_name: patient.preferred_name || '',
          date_of_birth: patient.date_of_birth || '',
          gender: patient.gender || '',
          phone: patient.phone || '',
          secondary_phone: patient.secondary_phone || '',
          email: patient.email || '',
          address: patient.address || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
          medical_history: patient.medical_history || '',
          allergies: patient.allergies || '',
          referral_source: patient.referral_source || '',
          visit_reason: patient.visit_reason || '',
          additional_notes: patient.additional_notes || ''
        });
      } else {
        // New patient mode - reset form
        setFormData({
          first_name: '',
          last_name: '',
          preferred_name: '',
          date_of_birth: '',
          gender: '',
          phone: '',
          secondary_phone: '',
          email: '',
          address: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          medical_history: '',
          allergies: '',
          referral_source: '',
          visit_reason: '',
          additional_notes: ''
        });
      }
      setErrors({});
      setQueueNumber(null);
    }
  }, [open, patient]);

  useEffect(() => {
    if (formData.date_of_birth) {
      const calculatedAge = calculateAge(formData.date_of_birth);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.date_of_birth]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (patient) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(formData)
          .eq('id', patient.id);

        if (error) throw error;

        // Log update activity
        if (patient?.id && createActivity) {
          await createActivity({
            patient_id: patient.id,
            activity_type: 'system_note',
            activity_date: new Date().toISOString(),
            title: 'Patient Information Updated',
            content: 'Patient profile information was updated',
            priority: 'normal',
            status: 'active'
          });
        }

        toast({
          title: "Success",
          description: `Patient updated successfully: **${formData.first_name} ${formData.last_name}**`,
        });
      } else {
        // Generate unique patient ID for new patients
        const patientId = await generatePatientId();
        
        // Create new patient with generated patient_id
        const { data: newPatient, error } = await supabase
          .from('patients')
          .insert({ ...formData, patient_id: patientId })
          .select()
          .single();

        if (error) throw error;

        // Log registration activity
        if (newPatient?.id && createActivity) {
          await createActivity({
            patient_id: newPatient.id,
            activity_type: 'system_note',
            activity_date: new Date().toISOString(),
            title: 'Patient Registration',
            content: `New patient registered: ${formData.first_name} ${formData.last_name}`,
            metadata: {
              patient_id: patientId,
              registration_source: 'manual'
            },
            priority: 'normal',
            status: 'active'
          });
        }

        // Auto-add to queue for new patients
        try {
          const queueResult = await addToQueue(newPatient.id);
          setQueueNumber(queueResult.queueNumber);
          
          toast({
            title: "Patient Added & Queued",
            description: `Patient registered successfully: **${formData.first_name} ${formData.last_name}** (ID: ${patientId}) - Queue number: ${queueResult.queueNumber}`,
          });
        } catch (queueError) {
          console.error('Error adding to queue:', queueError);
          toast({
            title: "Patient Added",
            description: `Patient registered successfully: **${formData.first_name} ${formData.last_name}** (ID: ${patientId})`,
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: `Failed to ${patient ? 'update' : 'add'} patient`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (selectedPatient: Patient) => {
    setFormData({
      first_name: selectedPatient.first_name || '',
      last_name: selectedPatient.last_name || '',
      preferred_name: selectedPatient.preferred_name || '',
      date_of_birth: selectedPatient.date_of_birth || '',
      gender: selectedPatient.gender || '',
      phone: selectedPatient.phone || '',
      secondary_phone: selectedPatient.secondary_phone || '',
      email: selectedPatient.email || '',
      address: selectedPatient.address || '',
      emergency_contact_name: selectedPatient.emergency_contact_name || '',
      emergency_contact_phone: selectedPatient.emergency_contact_phone || '',
      medical_history: selectedPatient.medical_history || '',
      allergies: selectedPatient.allergies || '',
      referral_source: selectedPatient.referral_source || '',
      visit_reason: selectedPatient.visit_reason || '',
      additional_notes: selectedPatient.additional_notes || ''
    });
  };

  const renderFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      return (
        <div className="flex items-center text-destructive text-sm mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          {errors[fieldName]}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-[95vh]">
          {/* Header with Patient ID Section */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {patient ? 'Edit Patient Information' : 'Add New Patient'}
                  </DialogTitle>
                  {patient && (
                    <div className="flex items-center space-x-4 mt-2">
                      {patient.patient_id && (
                        <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                          Patient ID: {patient.patient_id}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Registered: {format(new Date(patient.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <Separator />

          {/* Tabbed Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Basic Information</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center space-x-2" disabled={!patient}>
                    <Activity className="h-4 w-4" />
                    <span>Activity History</span>
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex items-center space-x-2" disabled={!patient}>
                    <FileText className="h-4 w-4" />
                    <span>Medical Summary</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto px-6 py-4">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!patient && (
                      <Card className="bg-muted/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Registration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <PatientSearch onPatientSelect={handlePatientSelect} />
                        </CardContent>
                      </Card>
                    )}

                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                              id="first_name"
                              value={formData.first_name}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                              className={errors.first_name ? 'border-destructive' : ''}
                            />
                            {renderFieldError('first_name')}
                          </div>

                          <div>
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                              id="last_name"
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                              className={errors.last_name ? 'border-destructive' : ''}
                            />
                            {renderFieldError('last_name')}
                          </div>

                          <div>
                            <Label htmlFor="preferred_name">Preferred Name (Optional)</Label>
                            <Input
                              id="preferred_name"
                              placeholder="What would you like to be called?"
                              value={formData.preferred_name}
                              onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="gender">Gender *</Label>
                            <Select
                              value={formData.gender}
                              onValueChange={(value) => setFormData({ ...formData, gender: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="date_of_birth">Date of Birth *</Label>
                            <Input
                              id="date_of_birth"
                              type="date"
                              value={formData.date_of_birth}
                              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                              className={errors.date_of_birth ? 'border-destructive' : ''}
                            />
                            {renderFieldError('date_of_birth')}
                            {age !== null && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Age: {age} years old
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Primary Phone Number *</Label>
                            <PhoneInput
                              value={formData.phone}
                              onChange={(value) => setFormData({ ...formData, phone: value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="secondary_phone">Secondary Phone (Optional)</Label>
                            <PhoneInput
                              value={formData.secondary_phone}
                              onChange={(value) => setFormData({ ...formData, secondary_phone: value })}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className={errors.email ? 'border-destructive' : ''}
                            />
                            {renderFieldError('email')}
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Textarea
                              id="address"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Emergency Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                            <Input
                              id="emergency_contact_name"
                              value={formData.emergency_contact_name}
                              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                            <PhoneInput
                              value={formData.emergency_contact_phone}
                              onChange={(value) => setFormData({ ...formData, emergency_contact_phone: value })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medical Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Medical Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="allergies">Allergies</Label>
                          <Input
                            id="allergies"
                            placeholder="Any known allergies..."
                            value={formData.allergies}
                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="medical_history">Medical History (Optional)</Label>
                          <Textarea
                            id="medical_history"
                            placeholder="Previous medical conditions, surgeries, etc..."
                            value={formData.medical_history}
                            onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="referral_source">Referral Source (Optional)</Label>
                            <Input
                              id="referral_source"
                              placeholder="How did you hear about us?"
                              value={formData.referral_source}
                              onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="visit_reason">Reason for Visit (Optional)</Label>
                            <Input
                              id="visit_reason"
                              placeholder="Brief reason for today's visit"
                              value={formData.visit_reason}
                              onChange={(e) => setFormData({ ...formData, visit_reason: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                          <Textarea
                            id="additional_notes"
                            placeholder="Any additional information..."
                            value={formData.additional_notes}
                            onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  {patient && <ActivityHistoryTab patientId={patient.id} />}
                </TabsContent>

                <TabsContent value="medical" className="mt-0">
                  {patient && <MedicalSummaryTab patientId={patient.id} patient={patient} />}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer Actions */}
          {activeTab === 'basic' && (
            <>
              <Separator />
              <DialogFooter className="p-6">
                {queueNumber && (
                  <div className="flex items-center text-sm text-muted-foreground mr-auto">
                    <Calendar className="h-4 w-4 mr-2" />
                    Queue Number: <Badge variant="outline" className="ml-1">{queueNumber}</Badge>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {patient ? 'Close' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? 'Saving...' : patient ? 'Update Patient' : 'Save Patient'}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}