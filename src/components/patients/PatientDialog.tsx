import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PhoneInput } from '@/components/ui/phone-input';
import { PatientSearch } from './PatientSearch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import { Patient } from '@/pages/Patients';
import { generatePatientId } from '@/lib/patientIdGenerator';
import { Calendar, AlertCircle } from 'lucide-react';

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function PatientDialog({ open, onOpenChange, patient, onSave }: PatientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [age, setAge] = useState<number | null>(null);
  const { toast } = useToast();
  const { addToQueue } = useQueue();

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
    additional_notes: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        preferred_name: patient.preferred_name || '',
        date_of_birth: patient.date_of_birth,
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
        additional_notes: patient.additional_notes || '',
      });
    } else {
      // Reset form for new patient
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
        additional_notes: '',
      });
    }
    setErrors({});
    setQueueNumber(null);
    calculateAge(formData.date_of_birth);
  }, [patient, open]);

  // Calculate age when date of birth changes
  useEffect(() => {
    calculateAge(formData.date_of_birth);
  }, [formData.date_of_birth]);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      setAge(null);
      return;
    }
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    setAge(calculatedAge >= 0 ? calculatedAge : null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Primary phone number is required';
    }
    if (!formData.visit_reason) {
      newErrors.visit_reason = 'Visit reason is required';
    }

    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Age validation
    if (formData.date_of_birth && age !== null && age < 0) {
      newErrors.date_of_birth = 'Please enter a valid date of birth';
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
      first_name: selectedPatient.first_name,
      last_name: selectedPatient.last_name,
      preferred_name: selectedPatient.preferred_name || '',
      date_of_birth: selectedPatient.date_of_birth,
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
      additional_notes: selectedPatient.additional_notes || '',
    });
    setErrors({});
  };

  const renderFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      return (
        <div className="flex items-center gap-1 text-sm text-destructive mt-1">
          <AlertCircle className="h-3 w-3" />
          {errors[fieldName]}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {patient ? 'Edit Patient Information' : 'Patient Registration'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {patient ? 'Update patient information' : 'Register new patient and add to queue'}
          </p>
          {queueNumber && (
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg mt-2">
              <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                Queue Number: {queueNumber}
              </Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                Patient successfully registered and added to today's queue!
              </span>
            </div>
          )}
        </DialogHeader>

        {!patient && !queueNumber && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Search Existing Patients</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Search for existing patients to update their information or register a new patient
              </p>
              <PatientSearch onPatientSelect={handlePatientSelect} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={errors.first_name ? 'border-destructive' : ''}
                />
                {renderFieldError('first_name')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={errors.last_name ? 'border-destructive' : ''}
                />
                {renderFieldError('last_name')}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_name">Preferred Name (Optional)</Label>
              <Input
                id="preferred_name"
                value={formData.preferred_name}
                onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                placeholder="What would you like to be called?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <div className="relative">
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className={errors.date_of_birth ? 'border-destructive' : ''}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {age !== null && age >= 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Age: {age} years old
                  </p>
                )}
                {renderFieldError('date_of_birth')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError('gender')}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone Number *</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="(555) 123-4567"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {renderFieldError('phone')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_phone">Secondary Phone (Optional)</Label>
                <PhoneInput
                  id="secondary_phone"
                  value={formData.secondary_phone}
                  onChange={(value) => setFormData({ ...formData, secondary_phone: value })}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {renderFieldError('email')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Street address, city, state, zip code"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Emergency contact full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <PhoneInput
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(value) => setFormData({ ...formData, emergency_contact_phone: value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Visit & Medical Information */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Visit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referral_source">Referral Source</Label>
                  <Select
                    value={formData.referral_source}
                    onValueChange={(value) => setFormData({ ...formData, referral_source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How did you find us?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="doctor-referral">Doctor Referral</SelectItem>
                      <SelectItem value="online-booking">Online Booking</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit_reason">Visit Reason *</Label>
                  <Select
                    value={formData.visit_reason}
                    onValueChange={(value) => setFormData({ ...formData, visit_reason: value })}
                  >
                    <SelectTrigger className={errors.visit_reason ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Purpose of visit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldError('visit_reason')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Medical Information (Optional)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="List any known allergies (e.g., penicillin, nuts, etc.)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_history">Medical History Summary</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    rows={3}
                    placeholder="Previous medical conditions, surgeries, chronic illnesses, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                    rows={3}
                    placeholder="Any other relevant information..."
                  />
                </div>
              </div>
            </div>

            {/* Auto-populated Registration Time */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Registration Date & Time: {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {queueNumber ? 'Close' : 'Cancel'}
            </Button>
            {!queueNumber && (
              <Button type="submit" disabled={loading} className="min-w-[140px]">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  patient ? 'Update Patient' : 'Register & Queue Patient'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}